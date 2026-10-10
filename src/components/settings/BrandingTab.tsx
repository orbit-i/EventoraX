import { useState } from "react"
import { Controller, useForm, useWatch } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { toast } from "sonner"
import { TextField } from "@/components/ui/form-fields"
import { FormSection, FullWidth } from "@/components/app/form/FormLayout"
import { ImageUploadField } from "@/components/app/form/ImageUploadField"
import { applyServerErrors } from "@/components/app/form/serverErrors"
import { FormError } from "@/components/auth/AuthShell"
import { useAuth } from "@/context/AuthContext"
import { EnterpriseLock, hasFeature, SaveBar, saveOrg, useReportDirty, type TabProps } from "./shared"

const HEX = /^#[0-9a-fA-F]{6}$/
const DEFAULT_PRIMARY = "#7c3aed"
const DEFAULT_ACCENT = "#f59e0b"

const schema = z.object({
  logoUrl: z.string().nullable(),
  primaryColor: z.string().regex(HEX, "Use a hex colour like #7c3aed"),
  accentColor: z.string().regex(HEX, "Use a hex colour like #f59e0b"),
  whiteLabelName: z.string().trim().max(100, "Keep this under 100 characters"),
  customDomain: z
    .string()
    .trim()
    .refine((v) => v === "" || /^[a-z0-9.-]+\.[a-z]{2,}$/i.test(v.replace(/^https?:\/\//, "")), "Enter a domain like events.university.edu.pk"),
})
type Values = z.infer<typeof schema>

/** Colour picker + hex text box that stay in sync. */
function ColorField({ label, value, onChange, error }: { label: string; value: string; onChange: (v: string) => void; error?: string }) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-sm font-semibold text-[#0f172a]">{label}</span>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={HEX.test(value) ? value : DEFAULT_PRIMARY}
          onChange={(e) => onChange(e.target.value)}
          className="h-11 w-14 cursor-pointer rounded-xl border border-[#e2e8f0] bg-white p-1"
          aria-label={`${label} picker`}
        />
        <TextField value={value} onChange={(e) => onChange(e.target.value)} maxLength={7} className="flex-1" aria-label={`${label} hex code`} error={error} />
      </div>
    </div>
  )
}

export function BrandingTab({ onDirtyChange }: TabProps) {
  const { organization, refresh } = useAuth()
  const [formError, setFormError] = useState<string | null>(null)
  const whiteLabel = hasFeature(organization, "whiteLabel")
  const customDomain = hasFeature(organization, "customDomain")

  const defaults: Values = {
    logoUrl: organization?.logoUrl ?? null,
    primaryColor: organization?.primaryColor ?? DEFAULT_PRIMARY,
    accentColor: organization?.accentColor ?? DEFAULT_ACCENT,
    whiteLabelName: organization?.whiteLabelName ?? "",
    customDomain: organization?.customDomain ?? "",
  }
  const {
    register,
    handleSubmit,
    control,
    reset,
    setError,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<Values>({ resolver: zodResolver(schema), defaultValues: defaults })
  useReportDirty(isDirty, onDirtyChange)
  const [primary, accent, logo, brandName] = useWatch({ control, name: ["primaryColor", "accentColor", "logoUrl", "whiteLabelName"] })

  async function onSubmit(values: Values) {
    setFormError(null)
    try {
      await saveOrg({
        logoUrl: values.logoUrl,
        primaryColor: values.primaryColor.toLowerCase(),
        accentColor: values.accentColor.toLowerCase(),
        // Enterprise-only fields are sent only when the plan includes them.
        ...(whiteLabel ? { whiteLabelName: values.whiteLabelName } : {}),
        ...(customDomain ? { customDomain: values.customDomain } : {}),
      })
      await refresh()
      reset(values)
      toast.success("Branding saved")
    } catch (err) {
      setFormError(applyServerErrors(err, setError))
    }
  }

  const displayName = (whiteLabel && brandName.trim()) || organization?.name || "Your organization"

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-6">
      <FormSection title="Logo and colours" description="Used on certificates, tickets, ID cards and emails.">
        {formError && (
          <FullWidth>
            <FormError message={formError} />
          </FullWidth>
        )}
        <FullWidth>
          <Controller
            control={control}
            name="logoUrl"
            render={({ field }) => (
              <ImageUploadField label="Logo" kind="logo" value={field.value} onChange={field.onChange} helper="A square or wide logo, ideally a transparent PNG · PNG or JPG (printed on certificates) · up to 2 MB" />
            )}
          />
        </FullWidth>
        <Controller control={control} name="primaryColor" render={({ field }) => <ColorField label="Primary colour" value={field.value} onChange={field.onChange} error={errors.primaryColor?.message} />} />
        <Controller control={control} name="accentColor" render={({ field }) => <ColorField label="Accent colour" value={field.value} onChange={field.onChange} error={errors.accentColor?.message} />} />

        {/* Live preview */}
        <FullWidth>
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-[#94a3b8]">Preview</p>
          <div className="overflow-hidden rounded-2xl border border-[#e9e4ff]">
            <div className="flex items-center gap-3 p-4 text-white" style={{ backgroundColor: HEX.test(primary) ? primary : DEFAULT_PRIMARY }}>
              {logo ? (
                <img src={logo} alt="" className="h-10 w-10 rounded-lg bg-white object-contain p-1" />
              ) : (
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/20 text-sm font-bold">{displayName.slice(0, 2).toUpperCase()}</div>
              )}
              <div>
                <p className="font-semibold">{displayName}</p>
                <p className="text-xs opacity-80">Certificate of Participation</p>
              </div>
            </div>
            <div className="flex items-center justify-between bg-white p-4">
              <p className="text-sm text-[#475569]">Awarded to Ayesha Khan</p>
              <span className="rounded-full px-3 py-1 text-xs font-semibold text-white" style={{ backgroundColor: HEX.test(accent) ? accent : DEFAULT_ACCENT }}>
                Verified
              </span>
            </div>
          </div>
        </FullWidth>
        <FullWidth>
          <SaveBar dirty={isDirty} submitting={isSubmitting} onDiscard={() => reset(defaults)} />
        </FullWidth>
      </FormSection>

      <FormSection title="White label and custom domain" description="Remove EventoraX branding and use your own address. Enterprise plan.">
        <FullWidth>
          {whiteLabel ? (
            <TextField
              label="Brand name"
              placeholder="NUST Events"
              helper="Replaces “EventoraX” in emails and public pages"
              error={errors.whiteLabelName?.message}
              {...register("whiteLabelName")}
            />
          ) : (
            <EnterpriseLock>White label (your own brand name instead of EventoraX) is part of the Enterprise plan.</EnterpriseLock>
          )}
        </FullWidth>
        <FullWidth>
          {customDomain ? (
            <TextField
              label="Custom domain"
              placeholder="events.university.edu.pk"
              helper="After saving, point a CNAME record for this domain to EventoraX. Contact support to finish the setup."
              error={errors.customDomain?.message}
              {...register("customDomain")}
            />
          ) : (
            <EnterpriseLock>A custom domain (e.g. events.university.edu.pk) is part of the Enterprise plan.</EnterpriseLock>
          )}
        </FullWidth>
        {(whiteLabel || customDomain) && (
          <FullWidth>
            <SaveBar dirty={isDirty} submitting={isSubmitting} onDiscard={() => reset(defaults)} />
          </FullWidth>
        )}
      </FormSection>
    </form>
  )
}
