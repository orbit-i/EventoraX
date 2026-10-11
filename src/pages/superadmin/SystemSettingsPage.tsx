import { useEffect, useState } from "react"
import { Controller, useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Link } from "react-router"
import { toast } from "sonner"
import { CheckCircle2, Info, Megaphone, Palette, Wrench } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { SelectField, TextField, TextareaField } from "@/components/ui/form-fields"
import { PageHeader } from "@/components/app/PageHeader"
import { SegmentedTabs } from "@/components/app/SegmentedTabs"
import { ErrorState } from "@/components/app/States"
import { FormSection, FullWidth, SwitchField } from "@/components/app/form/FormLayout"
import { ImageUploadField } from "@/components/app/form/ImageUploadField"
import { FormError } from "@/components/auth/AuthShell"
import { SaveBar } from "@/components/settings/shared"
import { AccountTab } from "@/components/settings/AccountTab"
import { TemplatePickerDialog } from "@/components/certificates/TemplatePickerDialog"
import { usePlatform } from "@/context/PlatformContext"
import { useApi } from "@/hooks/useApi"
import { useUrlState } from "@/hooks/useUrlState"
import { useUnsavedChanges } from "@/hooks/useUnsavedChanges"
import { ApiError, api, errorMessage } from "@/lib/api"
import { emailSchema } from "@/lib/validation"

/** Settings as the API stores them (flat keys). */
type ApiSettings = {
  "platform.name": string
  "platform.logoUrl": string
  "platform.faviconUrl": string
  "contact.email": string
  "contact.whatsapp": string
  "contact.hours": string
  "trial.days": number
  "maintenance.enabled": boolean
  "maintenance.message": string
  banner: { enabled: boolean; text: string; tone: "info" | "warning" | "success"; link: string; linkLabel: string }
  "payments.accounts": { jazzcash: string; easypaisa: string; bankIban: string }
  "uploads.maxMb": number
  "certificates.defaultTemplate": string
  seo: { title: string; description: string }
}

const schema = z.object({
  platformName: z.string().trim().min(2, "At least 2 characters").max(60),
  logoUrl: z.string(),
  faviconUrl: z.string(),
  contactEmail: z.union([z.literal(""), emailSchema]),
  whatsapp: z.string().trim().refine((v) => v === "" || /^\+?[\d\s-]{10,16}$/.test(v), "Enter a phone number like +92 300 1234567"),
  hours: z.string().trim().max(100),
  trialDays: z.string().trim().refine((v) => /^\d+$/.test(v) && Number(v) >= 1 && Number(v) <= 90, "Between 1 and 90 days"),
  maxMb: z.string().trim().refine((v) => /^\d+$/.test(v) && Number(v) >= 1 && Number(v) <= 20, "Between 1 and 20 MB"),
  defaultTemplate: z.string(),
  banner: z.object({
    enabled: z.boolean(),
    text: z.string().trim().max(200, "At most 200 characters"),
    tone: z.enum(["info", "warning", "success"]),
    link: z.string().trim().refine((v) => v === "" || v.startsWith("/") || /^https?:\/\//.test(v), "A full link (https://…) or a page like /pricing"),
    linkLabel: z.string().trim().max(30),
  }),
  payments: z.object({ jazzcash: z.string().trim().max(60), easypaisa: z.string().trim().max(60), bankIban: z.string().trim().max(80) }),
  seo: z.object({ title: z.string().trim().max(70, "At most 70 characters"), description: z.string().trim().max(160, "At most 160 characters") }),
}).refine((v) => !v.banner.enabled || v.banner.text.length > 0, { message: "Write the message to show", path: ["banner", "text"] })
type Values = z.infer<typeof schema>

/** Form field ↔ API key (server field errors come back with API keys). */
const KEY_MAP: [keyof Values, keyof ApiSettings][] = [
  ["platformName", "platform.name"],
  ["logoUrl", "platform.logoUrl"],
  ["faviconUrl", "platform.faviconUrl"],
  ["contactEmail", "contact.email"],
  ["whatsapp", "contact.whatsapp"],
  ["hours", "contact.hours"],
  ["trialDays", "trial.days"],
  ["maxMb", "uploads.maxMb"],
  ["defaultTemplate", "certificates.defaultTemplate"],
  ["banner", "banner"],
  ["payments", "payments.accounts"],
  ["seo", "seo"],
]

const TABS = [
  { value: "platform", label: "Platform", fields: ["platformName", "logoUrl", "faviconUrl", "trialDays", "maxMb", "defaultTemplate"] },
  { value: "contact", label: "Contact & payments", fields: ["contactEmail", "whatsapp", "hours", "payments"] },
  { value: "banner", label: "Banner & SEO", fields: ["banner", "seo"] },
  { value: "account", label: "My account", fields: [] },
] as const

function toValues(s: ApiSettings): Values {
  const template = /^[a-z]+-[a-z]+$/.test(s["certificates.defaultTemplate"]) ? s["certificates.defaultTemplate"] : "classic-royal"
  return {
    platformName: s["platform.name"],
    logoUrl: s["platform.logoUrl"],
    faviconUrl: s["platform.faviconUrl"],
    contactEmail: s["contact.email"],
    whatsapp: s["contact.whatsapp"],
    hours: s["contact.hours"],
    trialDays: String(s["trial.days"]),
    maxMb: String(s["uploads.maxMb"]),
    defaultTemplate: template,
    // Older databases may miss some inner values → start from empty ones.
    banner: Object.assign({ enabled: false, text: "", tone: "info" as const, link: "", linkLabel: "" }, s.banner),
    payments: Object.assign({ jazzcash: "", easypaisa: "", bankIban: "" }, s["payments.accounts"]),
    seo: Object.assign({ title: "", description: "" }, s.seo),
  }
}

function toApi(v: Values, only: (keyof Values)[]): Partial<Record<keyof ApiSettings, unknown>> {
  const out: Partial<Record<keyof ApiSettings, unknown>> = {}
  for (const [field, key] of KEY_MAP) {
    if (!only.includes(field)) continue
    const value = v[field]
    out[key] = field === "trialDays" || field === "maxMb" ? Number(value) : value
  }
  return out
}

function BannerPreview({ banner }: { banner: Values["banner"] }) {
  if (!banner.enabled || !banner.text) return <p className="text-sm text-[#94a3b8]">The banner is off.</p>
  const Icon = banner.tone === "warning" ? Megaphone : banner.tone === "success" ? CheckCircle2 : Info
  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-xl border px-4 py-2 text-sm",
        banner.tone === "warning" && "border-amber-200 bg-amber-50 text-amber-900",
        banner.tone === "success" && "border-emerald-200 bg-emerald-50 text-emerald-900",
        banner.tone === "info" && "border-[#ddd6fe] bg-[#f5f3ff] text-[#4c1d95]"
      )}
    >
      <Icon className="h-4 w-4 shrink-0" />
      <span>
        {banner.text}
        {banner.link && <span className="ml-2 font-semibold underline">{banner.linkLabel || "Learn more"}</span>}
      </span>
    </div>
  )
}

export default function SystemSettingsPage() {
  const { refresh: refreshPlatform } = usePlatform()
  const { data, error, initialLoading, reload } = useApi<ApiSettings>("/superadmin/settings")
  const { values: url, set } = useUrlState({ tab: "platform" })
  const [formError, setFormError] = useState<string | null>(null)
  const [pickerOpen, setPickerOpen] = useState(false)
  const [accountDirty, setAccountDirty] = useState(false)

  const {
    register,
    control,
    handleSubmit,
    reset,
    watch,
    setValue,
    setError,
    formState: { errors, isDirty, dirtyFields, isSubmitting },
  } = useForm<Values>({ resolver: zodResolver(schema) })

  useEffect(() => {
    if (data) reset(toValues(data))
  }, [data, reset])

  useUnsavedChanges(isDirty || accountDirty)

  async function onSubmit(v: Values) {
    setFormError(null)
    const changed = Object.keys(dirtyFields) as (keyof Values)[]
    try {
      const saved = await api.patch<ApiSettings>("/superadmin/settings", toApi(v, changed))
      reset(toValues(saved))
      refreshPlatform()
      toast.success("Settings saved")
    } catch (err) {
      if (err instanceof ApiError && err.fieldErrors) {
        for (const [key, message] of Object.entries(err.fieldErrors)) {
          // "payments.accounts.jazzcash" → field "payments" + "jazzcash"
          const match = KEY_MAP.find(([, k]) => key === k || key.startsWith(`${k}.`))
          if (!match) continue
          const rest = key.slice(match[1].length + 1)
          setError((rest ? `${match[0]}.${rest}` : match[0]) as keyof Values, { message })
        }
        setFormError("Please fix the highlighted fields.")
      } else setFormError(errorMessage(err))
    }
  }

  const banner = watch("banner")
  const tabDirty = (fields: readonly string[]) => fields.some((f) => f in dirtyFields)
  const seo = watch("seo")

  const header = (
    <PageHeader
      title="System settings"
      description="Platform-wide settings: branding, contact details, payments, the sitewide banner and SEO."
      breadcrumbs={[{ label: "Superadmin", to: "/superadmin" }, { label: "System settings" }]}
    />
  )
  if (error) {
    return (
      <>
        {header}
        <ErrorState message={error} onRetry={reload} />
      </>
    )
  }

  return (
    <>
      {header}
      <SegmentedTabs
        value={url.tab}
        onChange={(tab) => set({ tab })}
        options={TABS.map((t) => ({ value: t.value, label: t.label, dot: t.value === "account" ? accountDirty : tabDirty(t.fields) }))}
      />

      {initialLoading || !data ? (
        <Skeleton className="h-96 rounded-2xl" />
      ) : (
        <>
          <form onSubmit={handleSubmit(onSubmit)} noValidate className={cn("space-y-6", url.tab === "account" && "hidden")}>
            {formError && <FormError message={formError} />}

            <div className={cn("space-y-6", url.tab !== "platform" && "hidden")}>
              <FormSection title="Branding" description="Shown in the browser tab and on platform PDF reports.">
                <FullWidth>
                  <TextField label="Platform name" required error={errors.platformName?.message} {...register("platformName")} />
                </FullWidth>
                <Controller
                  control={control}
                  name="logoUrl"
                  render={({ field }) => (
                    <ImageUploadField label="Logo" kind="logo" uploadUrl="/superadmin/uploads?kind=logo" value={field.value || null} onChange={(u) => field.onChange(u ?? "")} helper="PNG or JPG" />
                  )}
                />
                <Controller
                  control={control}
                  name="faviconUrl"
                  render={({ field }) => (
                    <ImageUploadField label="Favicon" kind="logo" uploadUrl="/superadmin/uploads?kind=favicon" value={field.value || null} onChange={(u) => field.onChange(u ?? "")} helper="A small square PNG, e.g. 64 × 64" />
                  )}
                />
              </FormSection>
              <FormSection title="Defaults & limits">
                <TextField label="Free trial (days)" inputMode="numeric" required helper="For organizations that sign up from now on" error={errors.trialDays?.message} {...register("trialDays")} />
                <TextField label="Max image upload (MB)" inputMode="numeric" required helper="Logos, photos, receipts (1–20 MB)" error={errors.maxMb?.message} {...register("maxMb")} />
                <FullWidth>
                  <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#e9e4ff] bg-[#faf8ff] p-4">
                    <div>
                      <p className="text-sm font-medium text-[#0f172a]">Default certificate design</p>
                      <p className="text-xs text-[#64748b]">
                        Used when an event hasn't picked one: <span className="font-mono">{watch("defaultTemplate")}</span>
                      </p>
                    </div>
                    <Button type="button" variant="outline" onClick={() => setPickerOpen(true)}>
                      <Palette /> Choose design
                    </Button>
                  </div>
                </FullWidth>
              </FormSection>
              <section className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#e9e4ff] bg-white p-5 shadow-sm">
                <div>
                  <h2 className="text-base font-semibold text-[#0f172a]">Maintenance mode</h2>
                  <p className="text-sm text-[#64748b]">
                    Currently <strong>{data["maintenance.enabled"] ? "on" : "off"}</strong>. Turn it on or off from the Maintenance page.
                  </p>
                </div>
                <Button asChild variant="outline">
                  <Link to="/superadmin/maintenance">
                    <Wrench /> Open Maintenance
                  </Link>
                </Button>
              </section>
            </div>

            <div className={cn("space-y-6", url.tab !== "contact" && "hidden")}>
              <FormSection title="Contact" description="Shown on the public contact page and the dashboard's Help & support page. Leave empty to hide.">
                <TextField label="Contact email" type="email" helper="New payments and contact messages are also sent here" error={errors.contactEmail?.message} {...register("contactEmail")} />
                <TextField label="WhatsApp number" placeholder="+92 300 1234567" error={errors.whatsapp?.message} {...register("whatsapp")} />
                <FullWidth>
                  <TextField label="Support hours" placeholder="Mon–Fri, 9:00 am – 6:00 pm (PKT)" error={errors.hours?.message} {...register("hours")} />
                </FullWidth>
              </FormSection>
              <FormSection title="Payment accounts" description="Shown to organizations on their Billing page when they pay. Leave a method empty to hide it.">
                <TextField label="JazzCash number" placeholder="0300 1234567 (Account title)" error={errors.payments?.jazzcash?.message} {...register("payments.jazzcash")} />
                <TextField label="Easypaisa number" placeholder="0345 1234567 (Account title)" error={errors.payments?.easypaisa?.message} {...register("payments.easypaisa")} />
                <FullWidth>
                  <TextField label="Bank IBAN" placeholder="PK36 SCBL 0000 0011 2345 6702 · Bank name · Account title" error={errors.payments?.bankIban?.message} {...register("payments.bankIban")} />
                </FullWidth>
              </FormSection>
            </div>

            <div className={cn("space-y-6", url.tab !== "banner" && "hidden")}>
              <FormSection title="Sitewide banner" description="A short message at the top of the website and every dashboard (people can dismiss it).">
                <FullWidth>
                  <Controller
                    control={control}
                    name="banner.enabled"
                    render={({ field }) => <SwitchField label="Show the banner" checked={field.value} onCheckedChange={field.onChange} />}
                  />
                </FullWidth>
                <FullWidth>
                  <TextareaField label="Message" rows={2} placeholder="e.g. New: ID cards are here! Print badges for your next event." error={errors.banner?.text?.message} {...register("banner.text")} />
                </FullWidth>
                <SelectField
                  label="Style"
                  options={[
                    { value: "info", label: "Information (purple)" },
                    { value: "warning", label: "Warning (amber)" },
                    { value: "success", label: "Good news (green)" },
                  ]}
                  {...register("banner.tone")}
                />
                <TextField label="Link (optional)" placeholder="/pricing or https://…" error={errors.banner?.link?.message} {...register("banner.link")} />
                <TextField label="Link text" placeholder="Learn more" error={errors.banner?.linkLabel?.message} {...register("banner.linkLabel")} />
                <FullWidth>
                  <p className="mb-2 text-sm font-semibold text-[#0f172a]">Preview</p>
                  {banner && <BannerPreview banner={banner} />}
                </FullWidth>
              </FormSection>
              <FormSection title="Search engines (SEO)" description="The title and description Google shows for the website.">
                <FullWidth>
                  <TextField label="Meta title" helper={`${seo?.title.length ?? 0}/70 characters`} error={errors.seo?.title?.message} {...register("seo.title")} />
                </FullWidth>
                <FullWidth>
                  <TextareaField label="Meta description" rows={2} helper={`${seo?.description.length ?? 0}/160 characters`} error={errors.seo?.description?.message} {...register("seo.description")} />
                </FullWidth>
              </FormSection>
            </div>

            <div className="rounded-2xl border border-[#e9e4ff] bg-white px-5 pb-4 shadow-sm">
              <SaveBar dirty={isDirty} submitting={isSubmitting} onDiscard={() => reset(toValues(data))} />
            </div>
          </form>

          <div className={cn(url.tab !== "account" && "hidden")}>
            <AccountTab onDirtyChange={setAccountDirty} />
          </div>
        </>
      )}

      <TemplatePickerDialog
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        eventId=""
        apiBase="/superadmin/certificates"
        value={watch("defaultTemplate") ?? null}
        onSave={async (key) => setValue("defaultTemplate", key, { shouldDirty: true })}
      />
    </>
  )
}
