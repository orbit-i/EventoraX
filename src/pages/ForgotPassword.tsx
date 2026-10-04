import { useState } from "react"
import { Link } from "react-router"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { TextField } from "@/components/ui/form-fields"
import { AuthShell, FormError, FormSuccess, linkClass } from "@/components/auth/AuthShell"
import { api, errorMessage } from "@/lib/api"
import { emailSchema } from "@/lib/validation"

const schema = z.object({ email: emailSchema })
type Values = z.infer<typeof schema>

export default function ForgotPassword() {
  const [sentTo, setSentTo] = useState<string | null>(null)
  const [formError, setFormError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<Values>({ resolver: zodResolver(schema), defaultValues: { email: "" } })

  const onSubmit = async (values: Values) => {
    setFormError(null)
    try {
      await api.post("/auth/forgot-password", { email: values.email }, { auth: false })
      setSentTo(values.email)
    } catch (err) {
      setFormError(errorMessage(err))
    }
  }

  return (
    <AuthShell
      title="Forgot your password?"
      subtitle="Enter your email and we'll send you a link to reset it."
      footer={
        <Link to="/login" className={linkClass}>
          ← Back to log in
        </Link>
      }
    >
      {sentTo ? (
        <FormSuccess
          message={
            <>
              If <strong>{sentTo}</strong> has an account, a reset link is on its way. It expires in 15 minutes.
            </>
          }
        />
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
          {formError && <FormError message={formError} />}
          <TextField label="Email" type="email" autoComplete="email" placeholder="you@example.com" error={errors.email?.message} {...register("email")} />
          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? "Sending..." : "Send reset link"}
          </Button>
        </form>
      )}
    </AuthShell>
  )
}