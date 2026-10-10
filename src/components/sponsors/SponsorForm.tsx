import { useEffect, useState } from "react"
import { useNavigate } from "react-router"
import { Controller, useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { TextField } from "@/components/ui/form-fields"
import { FormSection, FullWidth, SwitchField, FormFooter } from "@/components/app/form/FormLayout"
import { ImageUploadField } from "@/components/app/form/ImageUploadField"
import { applyServerErrors } from "@/components/app/form/serverErrors"
import { FormError } from "@/components/auth/AuthShell"
import { StatusBadge } from "@/components/app/StatusBadge"
import { useUnsavedChanges } from "@/hooks/useUnsavedChanges"
import { api } from "@/lib/api"
import { TIER_ORDER, type Sponsor, type SponsorTier } from "@/types/sponsor"

const TIER_HINT: Record<SponsorTier, string> = {
  PLATINUM: "Largest logo, shown first",
  GOLD: "Large logo",
  SILVER: "Medium logo",
  BRONZE: "Small logo",
}

const schema = z.object({
  name: z.string().trim().min(1, "Sponsor name is required").max(150),
  website: z
    .string()
    .trim()
    .refine((v) => v === "" || /^https?:\/\/\S+\.\S+$/i.test(v), "Enter the full website address, e.g. https://techcorp.pk"),
  tier: z.enum(["PLATINUM", "GOLD", "SILVER", "BRONZE"]),
  logo: z.string().nullable(),
  displayPublic: z.boolean(),
})
type Values = z.infer<typeof schema>

/** Add or edit a sponsor. Returns to the sponsors list when saved. */
export function SponsorForm({ eventId, sponsor }: { eventId: string; sponsor?: Sponsor }) {
  const navigate = useNavigate()
  const [formError, setFormError] = useState<string | null>(null)
  const [goTo, setGoTo] = useState<string | null>(null)
  const backTo = `/dashboard/sponsors?eventId=${eventId}`

  const {
    register,
    handleSubmit,
    control,
    setError,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: sponsor?.name ?? "",
      website: sponsor?.website ?? "",
      tier: sponsor?.tier ?? "GOLD",
      logo: sponsor?.logo ?? null,
      displayPublic: sponsor?.displayPublic ?? true,
    },
  })

  useUnsavedChanges(isDirty && goTo === null)
  useEffect(() => {
    if (goTo) navigate(goTo)
  }, [goTo, navigate])

  async function onSubmit(v: Values) {
    setFormError(null)
    const payload = { name: v.name, website: v.website || null, tier: v.tier, logo: v.logo, displayPublic: v.displayPublic }
    try {
      if (sponsor) await api.patch(`/sponsors/${sponsor.id}`, payload)
      else await api.post("/sponsors", { ...payload, eventId })
      toast.success(sponsor ? "Sponsor updated" : `${v.name} added`)
      setGoTo(backTo)
    } catch (err) {
      setFormError(applyServerErrors(err, setError))
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-6">
      {formError && <FormError message={formError} />}

      <FormSection title="Sponsor" description="Shown on the event page, grouped by tier.">
        <FullWidth>
          <Controller
            control={control}
            name="logo"
            render={({ field }) => (
              <ImageUploadField
                label="Logo"
                kind="sponsor"
                value={field.value}
                onChange={field.onChange}
                helper="A transparent PNG looks best · up to 2 MB"
              />
            )}
          />
        </FullWidth>
        <TextField label="Sponsor name" required error={errors.name?.message} {...register("name")} />
        <TextField label="Website" placeholder="https://techcorp.pk" error={errors.website?.message} {...register("website")} />
        <FullWidth>
          <p className="mb-2 text-sm font-medium text-[#0f172a]">Tier</p>
          <Controller
            control={control}
            name="tier"
            render={({ field }) => (
              <div role="radiogroup" className="grid gap-3 sm:grid-cols-4">
                {TIER_ORDER.map((tier) => (
                  <button
                    key={tier}
                    type="button"
                    role="radio"
                    aria-checked={field.value === tier}
                    onClick={() => field.onChange(tier)}
                    className={cn(
                      "rounded-xl border p-3 text-left transition-colors",
                      field.value === tier ? "border-[#7c3aed] bg-[#f5f3ff] ring-2 ring-[#7c3aed]/20" : "border-[#e2e8f0] hover:border-[#c4b5fd]"
                    )}
                  >
                    <StatusBadge kind="tier" value={tier} />
                    <span className="mt-2 block text-xs text-[#64748b]">{TIER_HINT[tier]}</span>
                  </button>
                ))}
              </div>
            )}
          />
        </FullWidth>
      </FormSection>

      <FormSection title="Visibility">
        <FullWidth>
          <Controller
            control={control}
            name="displayPublic"
            render={({ field }) => (
              <SwitchField label="Show on the public event page" checked={field.value} onCheckedChange={field.onChange} />
            )}
          />
        </FullWidth>
      </FormSection>

      <FormFooter submitting={isSubmitting} onCancel={() => navigate(backTo)} submitLabel={sponsor ? "Save changes" : "Add sponsor"} dirty={isDirty} />
    </form>
  )
}