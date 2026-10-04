import { useState } from "react"
import { Link, useLocation, useNavigate } from "react-router"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { TextField, PasswordField } from "@/components/ui/form-fields"
import { AuthShell, FormError, linkClass } from "@/components/auth/AuthShell"
import { useAuth, homeFor } from "@/context/AuthContext"
import { errorMessage } from "@/lib/api"
import { emailSchema } from "@/lib/validation"

const schema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Password is required"),
  remember: z.boolean(),
})
type Values = z.infer<typeof schema>

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const from = (location.state as { from?: string } | null)?.from
  const [formError, setFormError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { email: "", password: "", remember: false },
  })

  const onSubmit = async (values: Values) => {
    setFormError(null)
    try {
      const user = await login(values.email, values.password, values.remember)
      toast.success(`Welcome back, ${user.name.split(" ")[0]}!`)
      navigate(from ?? homeFor(user), { replace: true })
    } catch (err) {
      setFormError(errorMessage(err))
    }
  }

  return (
    <AuthShell
      title="Welcome back"
      subtitle="Log in to your EventoraX account"
      footer={
        <>
          New to EventoraX?{" "}
          <Link to="/register" className={linkClass}>
            Start your free trial
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
        {formError && <FormError message={formError} />}

        <TextField
          label="Email"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          error={errors.email?.message}
          {...register("email")}
        />
        <PasswordField
          label="Password"
          autoComplete="current-password"
          placeholder="Your password"
          error={errors.password?.message}
          {...register("password")}
        />

        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2 text-sm text-[#475569] cursor-pointer select-none">
            <input type="checkbox" className="w-4 h-4 accent-[#7c3aed]" {...register("remember")} />
            Remember me for 30 days
          </label>
          <Link to="/forgot-password" className="text-sm font-medium text-[#7c3aed] hover:underline">
            Forgot password?
          </Link>
        </div>

        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? "Logging in..." : "Log in"}
        </Button>
      </form>
    </AuthShell>
  )
}