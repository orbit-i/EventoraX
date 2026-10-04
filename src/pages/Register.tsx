import { useState } from "react"
import { Link, useNavigate } from "react-router"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { TextField, PasswordField } from "@/components/ui/form-fields"
import { AuthShell, FormError, linkClass } from "@/components/auth/AuthShell"
import { useAuth } from "@/context/AuthContext"
import { errorMessage } from "@/lib/api"
import { emailSchema, passwordSchema, phoneSchema, PASSWORD_HINT } from "@/lib/validation"

const schema = z
  .object({
    fullName: z.string().trim().min(2, "Enter your full name"),
    organizationName: z.string().trim().min(2, "Enter your organization's name"),
    email: emailSchema,
    phone: phoneSchema,
    password: passwordSchema,
    confirmPassword: z.string(),
    acceptTerms: z.boolean().refine((v) => v, "You must accept the Terms and Privacy Policy"),
  })
  .refine((v) => v.password === v.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  })
type Values = z.infer<typeof schema>

export default function Register() {
  const { register: registerAccount } = useAuth()
  const navigate = useNavigate()
  const [formError, setFormError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: {
      fullName: "",
      organizationName: "",
      email: "",
      phone: "",
      password: "",
      confirmPassword: "",
      acceptTerms: false,
    },
  })

  const onSubmit = async (values: Values) => {
    setFormError(null)
    try {
      await registerAccount({
        fullName: values.fullName,
        organizationName: values.organizationName,
        email: values.email,
        phone: values.phone,
        password: values.password,
      })
      toast.success("Your free trial has started! Check your email to verify your address.")
      navigate("/dashboard", { replace: true })
    } catch (err) {
      setFormError(errorMessage(err))
    }
  }

  return (
    <AuthShell
      title="Start your free trial"
      subtitle={
        <>
          <span className="font-semibold text-[#7c3aed]">1-day free trial</span> · No credit card required
        </>
      }
      footer={
        <>
          Already have an account?{" "}
          <Link to="/login" className={linkClass}>
            Log in
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
        {formError && <FormError message={formError} />}

        <TextField label="Full name" autoComplete="name" placeholder="Ayesha Khan" error={errors.fullName?.message} {...register("fullName")} />
        <TextField
          label="Organization name"
          autoComplete="organization"
          placeholder="NUST SEECS"
          error={errors.organizationName?.message}
          {...register("organizationName")}
        />
        <TextField label="Email" type="email" autoComplete="email" placeholder="you@example.com" error={errors.email?.message} {...register("email")} />
        <TextField label="Phone" type="tel" autoComplete="tel" placeholder="+92 300 1234567" error={errors.phone?.message} {...register("phone")} />
        <PasswordField
          label="Password"
          autoComplete="new-password"
          helper={PASSWORD_HINT}
          error={errors.password?.message}
          {...register("password")}
        />
        <PasswordField
          label="Confirm password"
          autoComplete="new-password"
          error={errors.confirmPassword?.message}
          {...register("confirmPassword")}
        />

        <div>
          <label className="flex items-start gap-2 text-sm text-[#475569] cursor-pointer select-none">
            <input type="checkbox" className="w-4 h-4 mt-0.5 accent-[#7c3aed]" {...register("acceptTerms")} />
            <span>
              I agree to the{" "}
              <Link to="/terms" className={linkClass} target="_blank">
                Terms of Service
              </Link>{" "}
              and{" "}
              <Link to="/privacy" className={linkClass} target="_blank">
                Privacy Policy
              </Link>
            </span>
          </label>
          {errors.acceptTerms && <p className="mt-1 text-xs font-medium text-rose-500">{errors.acceptTerms.message}</p>}
        </div>

        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? "Creating your account..." : "Create account"}
        </Button>
      </form>
    </AuthShell>
  )
}