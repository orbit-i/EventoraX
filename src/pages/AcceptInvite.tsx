import { useEffect, useState } from "react"
import { Link, useNavigate, useSearchParams } from "react-router"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { TextField, PasswordField } from "@/components/ui/form-fields"
import { AuthShell, FormError, linkClass } from "@/components/auth/AuthShell"
import { useAuth } from "@/context/AuthContext"
import { api, errorMessage } from "@/lib/api"
import { passwordSchema, PASSWORD_HINT } from "@/lib/validation"

interface InviteInfo {
  email: string
  role: string
  organization: { name: string; logoUrl: string | null }
  expiresAt: string
}

const schema = z
  .object({
    name: z.string().trim().min(2, "Enter your full name"),
    phone: z
      .string()
      .trim()
      .refine((v) => v === "" || /^\+?[\d\s-]{10,16}$/.test(v), "Enter a valid phone number"),
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((v) => v.password === v.confirmPassword, { message: "Passwords do not match", path: ["confirmPassword"] })
type Values = z.infer<typeof schema>

export default function AcceptInvite() {
  const [params] = useSearchParams()
  const token = params.get("token") ?? ""
  const { acceptInvite } = useAuth()
  const navigate = useNavigate()

  const [invite, setInvite] = useState<InviteInfo | null>(null)
  const [loadError, setLoadError] = useState<string | null>(token ? null : "This invite link is missing its token.")
  const [formError, setFormError] = useState<string | null>(null)

  useEffect(() => {
    if (!token) return
    api
      .get<InviteInfo>(`/auth/invite/${encodeURIComponent(token)}`, { auth: false })
      .then(setInvite)
      .catch((err) => setLoadError(errorMessage(err)))
  }, [token])

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", phone: "", password: "", confirmPassword: "" },
  })

  const onSubmit = async (values: Values) => {
    setFormError(null)
    try {
      await acceptInvite({
        token,
        name: values.name,
        password: values.password,
        ...(values.phone ? { phone: values.phone } : {}),
      })
      toast.success(`Welcome to ${invite?.organization.name ?? "your team"}!`)
      navigate("/dashboard", { replace: true })
    } catch (err) {
      setFormError(errorMessage(err))
    }
  }

  if (loadError) {
    return (
      <AuthShell title="Invite unavailable" footer={<Link to="/login" className={linkClass}>Go to log in</Link>}>
        <FormError message={loadError} />
      </AuthShell>
    )
  }

  if (!invite) {
    return (
      <AuthShell title="Loading your invite">
        <div className="flex items-center gap-3 text-sm text-[#64748b]">
          <Spinner /> Checking the invite...
        </div>
      </AuthShell>
    )
  }

  return (
    <AuthShell
      title={`Join ${invite.organization.name}`}
      subtitle={
        <>
          You've been invited as <strong className="capitalize text-[#0f172a]">{invite.role}</strong> using{" "}
          <strong className="text-[#0f172a]">{invite.email}</strong>.
        </>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
        {formError && <FormError message={formError} />}
        <TextField label="Full name" autoComplete="name" error={errors.name?.message} {...register("name")} />
        <TextField
          label="Phone (optional)"
          type="tel"
          autoComplete="tel"
          placeholder="+92 300 1234567"
          error={errors.phone?.message}
          {...register("phone")}
        />
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
        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? "Joining..." : "Accept invite & create account"}
        </Button>
      </form>
    </AuthShell>
  )
}