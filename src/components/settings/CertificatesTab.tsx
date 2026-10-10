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
import { SaveBar, saveOrg, useReportDirty, type TabProps } from "./shared"

const schema = z.object({
  signatoryName: z.string().trim().max(100, "Keep this under 100 characters"),
  signatoryTitle: z.string().trim().max(100, "Keep this under 100 characters"),
  signatureUrl: z.string().nullable(),
})
type Values = z.infer<typeof schema>

export function CertificatesTab({ onDirtyChange }: TabProps) {
  const { organization, refresh } = useAuth()
  const [formError, setFormError] = useState<string | null>(null)
  const defaults: Values = {
    signatoryName: organization?.signatoryName ?? "",
    signatoryTitle: organization?.signatoryTitle ?? "",
    signatureUrl: organization?.signatureUrl ?? null,
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
  const [name, title, signature] = useWatch({ control, name: ["signatoryName", "signatoryTitle", "signatureUrl"] })

  async function onSubmit(values: Values) {
    setFormError(null)
    try {
      await saveOrg(values)
      await refresh()
      reset(values)
      toast.success("Certificate signatory saved")
    } catch (err) {
      setFormError(applyServerErrors(err, setError))
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
      <FormSection title="Certificate signatory" description="The person whose name and signature appear on every certificate you issue.">
        {formError && (
          <FullWidth>
            <FormError message={formError} />
          </FullWidth>
        )}
        <TextField label="Signatory name" placeholder="Dr. Ahmed Raza" error={errors.signatoryName?.message} {...register("signatoryName")} />
        <TextField label="Title" placeholder="Director, Student Affairs" error={errors.signatoryTitle?.message} {...register("signatoryTitle")} />
        <FullWidth>
          <Controller
            control={control}
            name="signatureUrl"
            render={({ field }) => (
              <ImageUploadField
                label="Signature"
                kind="signature"
                value={field.value}
                onChange={field.onChange}
                helper="Sign on white paper, take a clear photo, or use a transparent PNG · up to 2 MB"
              />
            )}
          />
        </FullWidth>

        <FullWidth>
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-[#94a3b8]">How it will look</p>
          <div className="flex justify-center rounded-2xl border border-[#e9e4ff] bg-[#fffdf7] p-8">
            <div className="w-56 text-center">
              <div className="flex h-16 items-end justify-center">
                {signature ? <img src={signature} alt="Signature preview" className="max-h-16 object-contain" /> : <span className="text-xs text-[#cbd5e1]">signature</span>}
              </div>
              <div className="mt-1 border-t border-[#0f172a]/60 pt-2">
                <p className="text-sm font-semibold text-[#0f172a]">{name.trim() || "Signatory name"}</p>
                <p className="text-xs text-[#64748b]">{title.trim() || "Title"}</p>
              </div>
            </div>
          </div>
        </FullWidth>
        <FullWidth>
          <SaveBar dirty={isDirty} submitting={isSubmitting} onDiscard={() => reset(defaults)} />
        </FullWidth>
      </FormSection>
    </form>
  )
}
