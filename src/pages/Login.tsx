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
import type { AuthUser } from "@/types/auth"

const schema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Password is required"),
  remember: z.boolean(),
})
type Values = z.infer<typeof schema>

// Spaced-out digits for the 6-digit code (className would style the label too).
const CODE_STYLE = { letterSpacing: "0.4em", textAlign: "center", fontSize: 18 } as const

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const from = (location.state as { from?: string } | null)?.from
  const [formError, setFormError] = useState<string | null>(null)
  // Set when the password was right but the account also needs its authenticator code.
  const [challenge, setChallenge] = useState<{ token: string; remember: boolean } | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { email: "", password: "", remember: false },
  })

  const finish = (user: AuthUser) => {
    toast.success(`Welcome back, ${user.name.split(" ")[0]}!`)
    navigate(from ?? homeFor(user), { replace: true })
  }

  const onSubmit = async (values: Values) => {
    setFormError(null)
    try {
      const result = await login(values.email, values.password, values.remember)
      if ("challengeToken" in result) setChallenge({ token: result.challengeToken, remember: values.remember })
      else finish(result.user)
    } catch (err) {
      setFormError(errorMessage(err))
    }
  }

  if (challenge) {
    return (
      <TwoFactorStep
        challengeToken={challenge.token}
        remember={challenge.remember}
        onDone={finish}
        onBack={() => setChallenge(null)}
      />
    )
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

/** Second login step: the 6-digit code from the authenticator app, or one recovery code. */
function TwoFactorStep({
  challengeToken,
  remember,
  onDone,
  onBack,
}: {
  challengeToken: string
  remember: boolean
  onDone: (user: AuthUser) => void
  onBack: () => void
}) {
  const { completeTwoFactor } = useAuth()
  const [useRecovery, setUseRecovery] = useState(false)
  const [code, setCode] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    const clean = code.trim()
    if (!useRecovery && !/^\d{6}$/.test(clean.replace(/\s+/g, ""))) return setError("Enter the 6-digit code from your app")
    if (useRecovery && clean.replace(/[^a-z0-9]/gi, "").length !== 8) return setError("Recovery codes look like abcd-2345")
    setError(null)
    setBusy(true)
    try {
      const { user, recoveryCodeUsed } = await completeTwoFactor(challengeToken, clean, remember)
      if (recoveryCodeUsed) toast.info("That recovery code is now used up. Make new ones in Settings if you are running low.")
      onDone(user)
    } catch (err) {
      setError(errorMessage(err))
      setBusy(false)
    }
  }

  const switchMode = () => {
    setUseRecovery((v) => !v)
    setCode("")
    setError(null)
  }

  return (
    <AuthShell
      title="Two-factor login"
      subtitle={useRecovery ? "Enter one of your recovery codes" : "Enter the 6-digit code from your authenticator app"}
      footer={
        <button type="button" onClick={onBack} className={linkClass}>
          Back to login
        </button>
      }
    >
      <form onSubmit={submit} noValidate className="space-y-4">
        {error && <FormError message={error} />}
        <TextField
          key={useRecovery ? "recovery" : "totp"}
          label={useRecovery ? "Recovery code" : "Code"}
          autoFocus
          autoComplete="one-time-code"
          inputMode={useRecovery ? "text" : "numeric"}
          maxLength={useRecovery ? 12 : 7}
          placeholder={useRecovery ? "abcd-2345" : "123456"}
          style={useRecovery ? undefined : CODE_STYLE}
          value={code}
          onChange={(e) => setCode(e.target.value)}
        />
        <Button type="submit" className="w-full" disabled={busy}>
          {busy ? "Checking..." : "Verify and log in"}
        </Button>
        <button type="button" onClick={switchMode} className="w-full text-sm font-medium text-[#7c3aed] hover:underline">
          {useRecovery ? "Use the code from my app instead" : "Lost your phone? Use a recovery code"}
        </button>
      </form>
    </AuthShell>
  )
}
