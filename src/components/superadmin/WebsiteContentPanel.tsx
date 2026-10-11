import { useEffect, useMemo, useState } from "react"
import { Controller, useFieldArray, useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { toast } from "sonner"
import { ArrowDown, ArrowUp, ExternalLink, Plus, Quote, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { TextField, TextareaField } from "@/components/ui/form-fields"
import { ErrorState } from "@/components/app/States"
import { FormSection, FullWidth, SwitchField } from "@/components/app/form/FormLayout"
import { ImageUploadField } from "@/components/app/form/ImageUploadField"
import { applyServerErrors } from "@/components/app/form/serverErrors"
import { FormError } from "@/components/auth/AuthShell"
import { SaveBar } from "@/components/settings/shared"
import { usePlatform } from "@/context/PlatformContext"
import { useApi } from "@/hooks/useApi"
import { api, ApiError } from "@/lib/api"

const link = z
  .string()
  .trim()
  .refine((v) => v === "" || /^https?:\/\/\S+$/.test(v), "A full link starting with https://")

const schema = z.object({
  showStats: z.boolean(),
  testimonials: z
    .array(
      z.object({
        quote: z.string().trim().min(10, "At least 10 characters").max(300, "At most 300 characters"),
        name: z.string().trim().min(2, "Enter the person's name").max(80),
        role: z.string().trim().max(80),
        organization: z.string().trim().max(120),
      })
    )
    .max(8, "At most 8 testimonials"),
  logos: z.array(z.object({ name: z.string().trim().min(2, "Enter the organization's name").max(80), logoUrl: z.string() })).max(16, "At most 16 logos"),
  social: z.object({ facebook: link, instagram: link, linkedin: link, x: link, youtube: link }),
})
type Values = z.infer<typeof schema>

interface WebsiteSettings {
  "website.showStats": boolean
  "website.testimonials": Values["testimonials"]
  "website.logos": Values["logos"]
  "website.social": Values["social"]
}

const EMPTY_SOCIAL = { facebook: "", instagram: "", linkedin: "", x: "", youtube: "" }

/** Superadmin → System settings → Website: what the public home page shows. */
export function WebsiteContentPanel({ onDirtyChange }: { onDirtyChange: (dirty: boolean) => void }) {
  const { refresh } = usePlatform()
  const { data, error, reload } = useApi<WebsiteSettings>("/superadmin/settings")
  const [formError, setFormError] = useState<string | null>(null)
  const {
    register,
    control,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isDirty, isSubmitting },
  } = useForm<Values>({ resolver: zodResolver(schema) })
  const testimonials = useFieldArray({ control, name: "testimonials" })
  const logos = useFieldArray({ control, name: "logos" })

  const defaults = useMemo<Values | undefined>(
    () =>
      data
        ? {
            showStats: data["website.showStats"] === true,
            testimonials: data["website.testimonials"] ?? [],
            logos: data["website.logos"] ?? [],
            social: Object.assign({ ...EMPTY_SOCIAL }, data["website.social"]),
          }
        : undefined,
    [data]
  )
  useEffect(() => {
    if (defaults) reset(defaults)
  }, [defaults, reset])
  useEffect(() => onDirtyChange(isDirty), [isDirty, onDirtyChange])

  async function onSubmit(v: Values) {
    setFormError(null)
    try {
      await api.patch("/superadmin/settings", {
        "website.showStats": v.showStats,
        "website.testimonials": v.testimonials,
        "website.logos": v.logos,
        "website.social": v.social,
      })
      toast.success("Website content saved", { description: "The public home page shows it right away." })
      reset(v)
      refresh()
    } catch (err) {
      if (err instanceof ApiError && err.fieldErrors) {
        // "website.testimonials.0.quote" → "testimonials.0.quote"
        for (const [key, message] of Object.entries(err.fieldErrors)) {
          setError(key.replace(/^website\.(showStats|testimonials|logos|social)/, "$1") as keyof Values, { message })
        }
        setFormError("Please fix the highlighted fields.")
      } else setFormError(applyServerErrors(err, setError))
    }
  }

  if (error) return <ErrorState message={error} onRetry={reload} />
  if (!defaults) return <Skeleton className="h-96 rounded-2xl" />

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-6">
      {formError && <FormError message={formError} />}

      <FormSection title="Live numbers" description="The home page can show how many events, certificates and organizations EventoraX has — real numbers from the database.">
        <FullWidth>
          <Controller
            control={control}
            name="showStats"
            render={({ field }) => (
              <SwitchField
                label="Show live numbers on the home page"
                description="Tip: switch this on once the numbers look good. While it's off, the section is hidden."
                checked={field.value}
                onCheckedChange={field.onChange}
              />
            )}
          />
        </FullWidth>
      </FormSection>

      <FormSection title="Testimonials" description="Real quotes from organizers who use EventoraX (ask their permission first). The section is hidden while the list is empty.">
        <FullWidth>
          <div className="space-y-4">
            {testimonials.fields.length === 0 && <p className="rounded-xl border border-dashed border-[#e9e4ff] p-4 text-center text-sm text-[#94a3b8]">No testimonials yet.</p>}
            {testimonials.fields.map((f, i) => (
              <div key={f.id} className="rounded-xl border border-[#e9e4ff] bg-[#faf8ff] p-4">
                <div className="mb-3 flex items-center justify-between">
                  <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#0f172a]">
                    <Quote className="h-4 w-4 text-[#7c3aed]" /> Testimonial {i + 1}
                  </span>
                  <span className="flex gap-1">
                    <Button type="button" size="icon-sm" variant="ghost" disabled={i === 0} onClick={() => testimonials.move(i, i - 1)} aria-label="Move up">
                      <ArrowUp />
                    </Button>
                    <Button type="button" size="icon-sm" variant="ghost" disabled={i === testimonials.fields.length - 1} onClick={() => testimonials.move(i, i + 1)} aria-label="Move down">
                      <ArrowDown />
                    </Button>
                    <Button type="button" size="icon-sm" variant="ghost" className="text-rose-600 hover:bg-rose-50" onClick={() => testimonials.remove(i)} aria-label="Remove testimonial">
                      <Trash2 />
                    </Button>
                  </span>
                </div>
                <div className="grid gap-3 md:grid-cols-3">
                  <TextareaField className="md:col-span-3" label="Quote" required rows={2} error={errors.testimonials?.[i]?.quote?.message} {...register(`testimonials.${i}.quote`)} />
                  <TextField label="Name" required error={errors.testimonials?.[i]?.name?.message} {...register(`testimonials.${i}.name`)} />
                  <TextField label="Role" placeholder="e.g. President" error={errors.testimonials?.[i]?.role?.message} {...register(`testimonials.${i}.role`)} />
                  <TextField label="Organization" placeholder="e.g. NUST ACM Chapter" error={errors.testimonials?.[i]?.organization?.message} {...register(`testimonials.${i}.organization`)} />
                </div>
              </div>
            ))}
            {errors.testimonials?.message && <p className="text-xs font-medium text-rose-500">{errors.testimonials.message}</p>}
            <Button type="button" variant="outline" size="sm" disabled={testimonials.fields.length >= 8} onClick={() => testimonials.append({ quote: "", name: "", role: "", organization: "" })}>
              <Plus /> Add testimonial
            </Button>
          </div>
        </FullWidth>
      </FormSection>

      <FormSection title="“Trusted by” logos" description="Organizations that use EventoraX (with their permission). Hidden while the list is empty.">
        <FullWidth>
          <div className="space-y-4">
            {logos.fields.length === 0 && <p className="rounded-xl border border-dashed border-[#e9e4ff] p-4 text-center text-sm text-[#94a3b8]">No logos yet.</p>}
            <div className="grid gap-4 md:grid-cols-2">
              {logos.fields.map((f, i) => (
                <div key={f.id} className="rounded-xl border border-[#e9e4ff] bg-[#faf8ff] p-4">
                  <div className="mb-3 flex justify-end">
                    <Button type="button" size="icon-sm" variant="ghost" className="text-rose-600 hover:bg-rose-50" onClick={() => logos.remove(i)} aria-label="Remove logo">
                      <Trash2 />
                    </Button>
                  </div>
                  <TextField label="Organization name" required error={errors.logos?.[i]?.name?.message} {...register(`logos.${i}.name`)} />
                  <div className="mt-3">
                    <Controller
                      control={control}
                      name={`logos.${i}.logoUrl`}
                      render={({ field }) => (
                        <ImageUploadField label="Logo (optional — the name is shown without one)" kind="logo" uploadUrl="/superadmin/uploads?kind=logo" value={field.value || null} onChange={(u) => field.onChange(u ?? "")} helper="A transparent PNG works best" />
                      )}
                    />
                  </div>
                </div>
              ))}
            </div>
            <Button type="button" variant="outline" size="sm" disabled={logos.fields.length >= 16} onClick={() => logos.append({ name: "", logoUrl: "" })}>
              <Plus /> Add logo
            </Button>
          </div>
        </FullWidth>
      </FormSection>

      <FormSection title="Social media" description="Shown in the website footer and on the contact page. Leave empty to hide.">
        <TextField label="Facebook" placeholder="https://facebook.com/…" error={errors.social?.facebook?.message} {...register("social.facebook")} />
        <TextField label="Instagram" placeholder="https://instagram.com/…" error={errors.social?.instagram?.message} {...register("social.instagram")} />
        <TextField label="LinkedIn" placeholder="https://linkedin.com/company/…" error={errors.social?.linkedin?.message} {...register("social.linkedin")} />
        <TextField label="X (Twitter)" placeholder="https://x.com/…" error={errors.social?.x?.message} {...register("social.x")} />
        <TextField label="YouTube" placeholder="https://youtube.com/@…" error={errors.social?.youtube?.message} {...register("social.youtube")} />
        <FullWidth>
          <a href="/" target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-sm font-medium text-[#7c3aed] hover:underline">
            <ExternalLink className="h-3.5 w-3.5" /> Open the home page
          </a>
        </FullWidth>
      </FormSection>

      <div className="rounded-2xl border border-[#e9e4ff] bg-white px-5 pb-4 shadow-sm">
        <SaveBar dirty={isDirty} submitting={isSubmitting} onDiscard={() => reset(defaults)} label="Save website content" />
      </div>
    </form>
  )
}
