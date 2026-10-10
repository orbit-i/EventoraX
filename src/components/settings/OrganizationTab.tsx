import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { toast } from "sonner"
import { TextField } from "@/components/ui/form-fields"
import { FormSection, FullWidth } from "@/components/app/form/FormLayout"
import { applyServerErrors } from "@/components/app/form/serverErrors"
import { FormError } from "@/components/auth/AuthShell"
import { useAuth } from "@/context/AuthContext"
import { phoneSchema } from "@/lib/validation"
import { formatDate } from "@/lib/format"
import { SaveBar, saveOrg, useReportDirty, type TabProps } from "./shared"

const schema = z.object({
  name: z.string().trim().min(2, "Organization name must be at least 2 characters").max(150),
  email: z.union([z.literal(""), z.string().trim().email("Enter a valid email")]),
  phone: z.union([z.literal(""), phoneSchema]),
})
type Values = z.infer<typeof schema>

export function OrganizationTab({ onDirtyChange }: TabProps) {
  const { organization, refresh } = useAuth()
  const [formError, setFormError] = useState<string | null>(null)
  const defaults: Values = { name: organization?.name ?? "", email: organization?.email ?? "", phone: organization?.phone ?? "" }
  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<Values>({ resolver: zodResolver(schema), defaultValues: defaults })
  useReportDirty(isDirty, onDirtyChange)

  async function onSubmit(values: Values) {
    setFormError(null)
    try {
      await saveOrg(values)
      await refresh()
      reset(values)
      toast.success("Organization details saved")
    } catch (err) {
      setFormError(applyServerErrors(err, setError))
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
      <FormSection title="Organization profile" description="Shown on certificates, emails and your public event pages.">
        {formError && (
          <FullWidth>
            <FormError message={formError} />
          </FullWidth>
        )}
        <FullWidth>
          <TextField label="Organization name" required error={errors.name?.message} {...register("name")} />
        </FullWidth>
        <TextField label="Contact email" type="email" placeholder="events@university.edu.pk" helper="Attendees see this for questions" error={errors.email?.message} {...register("email")} />
        <TextField label="Contact phone" type="tel" placeholder="+92 51 1234567" error={errors.phone?.message} {...register("phone")} />
        <FullWidth>
          <dl className="grid gap-3 rounded-xl bg-[#faf8ff] p-4 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-xs text-[#94a3b8]">Workspace address (slug)</dt>
              <dd className="font-mono text-[#334155]">{organization?.slug}</dd>
            </div>
            <div>
              <dt className="text-xs text-[#94a3b8]">Plan</dt>
              <dd className="text-[#334155]">
                {organization?.plan?.name ?? "No plan"} · until {formatDate(organization?.subscriptionEndsAt)}
              </dd>
            </div>
          </dl>
        </FullWidth>
        <FullWidth>
          <SaveBar dirty={isDirty} submitting={isSubmitting} onDiscard={() => reset(defaults)} />
        </FullWidth>
      </FormSection>
    </form>
  )
}
