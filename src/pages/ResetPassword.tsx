import { useState } from "react"
import { Link, useSearchParams } from "react-router"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { PasswordField } from "@/components/ui/form-fields"
import { AuthShell, FormError, FormSuccess, linkClass } from "@/components/auth/AuthShell"
import { api, errorMessage } from "@/lib/api"
import { passwordSchema, PASSWORD_HINT } from "@/lib/validation"

const schema = z
  .object({ newPassword: passwordSchema, confirmPassword: z.string() })
  .refine((v) => v.newPassword === v.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  })
type Values = z.infer<typeof schema>

export default function ResetPassword() {
  const [params] = useSearchParams()
  const token = params.get("token") ?? ""
  const [done, setDone] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<Values>({ resolver: zodResolver(schema), defaultValues: { newPassword: "", confirmPassword: "" } })

  const onSubmit = async (values: Values) => {
    setFormError(null)
    try {
      await api.post("/auth/reset-password", { token, newPassword: values.newPassword }, { auth: false })
      setDone(true)
    } catch (err) {
      setFormError(errorMessage(err))
    }
  }

  if (!token) {
    return (
      <AuthShell title="Invalid reset link" footer={<Link to="/forgot-password" className={linkClass}>Request a new link</Link>}>
        <FormError message="This link is missing its reset token. Please use the link from your email." />
      </AuthShell>
    )
  }

  return (
    <AuthShell title="Choose a new password" subtitle="For your security, this logs you out on all other devices.">
      {done ? (
        <div className="space-y-4">
          <FormSuccess message="Your password has been updated." />
          <Button asChild className="w-full">
            <Link to="/login">Log in</Link>
          </Button>
        </div>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
          {formError && <FormError message={formError} />}
          <PasswordField
            label="New password"
            autoComplete="new-password"
            helper={PASSWORD_HINT}
            error={errors.newPassword?.message}
            {...register("newPassword")}
          />
          <PasswordField
            label="Confirm new password"
            autoComplete="new-password"
            error={errors.confirmPassword?.message}
            {...register("confirmPassword")}
          />
          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? "Saving..." : "Update password"}
          </Button>
        </form>
      )}
    </AuthShell>
  )
}