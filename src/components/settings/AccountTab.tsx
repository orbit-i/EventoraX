import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { toast } from "sonner"
import { CheckCircle2, Loader2, LogOut, MailWarning } from "lucide-react"
import { Button } from "@/components/ui/button"
import { PasswordField, TextField } from "@/components/ui/form-fields"
import { FormSection, FullWidth } from "@/components/app/form/FormLayout"
import { applyServerErrors } from "@/components/app/form/serverErrors"
import { useConfirm } from "@/components/app/ConfirmDialog"
import { FormError } from "@/components/auth/AuthShell"
import { useAuth } from "@/context/AuthContext"
import { api, errorMessage, tokenStore } from "@/lib/api"
import { passwordSchema, phoneSchema, PASSWORD_HINT } from "@/lib/validation"
import { SaveBar, useReportDirty, type TabProps } from "./shared"

const profileSchema = z.object({
  name: z.string().trim().min(2, "Name must be 2–100 characters").max(100, "Name must be 2–100 characters"),
  phone: z.union([z.literal(""), phoneSchema]),
})
type ProfileValues = z.infer<typeof profileSchema>

const passwordFormSchema = z
  .object({
    currentPassword: z.string().min(1, "Enter your current password"),
    newPassword: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((v) => v.newPassword === v.confirmPassword, { path: ["confirmPassword"], message: "Passwords don't match" })
type PasswordValues = z.infer<typeof passwordFormSchema>

function ProfileSection({ onDirtyChange }: TabProps) {
  const { user, refresh } = useAuth()
  const [formError, setFormError] = useState<string | null>(null)
  const [resending, setResending] = useState(false)
  const defaults = { name: user?.name ?? "", phone: user?.phone ?? "" }
  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<ProfileValues>({ resolver: zodResolver(profileSchema), defaultValues: defaults })
  useReportDirty(isDirty, onDirtyChange)

  async function onSubmit(values: ProfileValues) {
    setFormError(null)
    try {
      await api.patch("/auth/me", { name: values.name, phone: values.phone || null })
      await refresh()
      reset(values)
      toast.success("Profile updated")
    } catch (err) {
      setFormError(applyServerErrors(err, setError))
    }
  }

  async function resendVerification() {
    setResending(true)
    try {
      await api.post("/auth/resend-verification")
      toast.success("Verification email sent", { description: `Check ${user?.email}` })
    } catch (err) {
      toast.error(errorMessage(err))
    } finally {
      setResending(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
      <FormSection title="Your profile" description="How you appear to your team and in the activity log.">
        {formError && (
          <FullWidth>
            <FormError message={formError} />
          </FullWidth>
        )}
        <TextField label="Full name" required autoComplete="name" error={errors.name?.message} {...register("name")} />
        <TextField label="Phone" type="tel" autoComplete="tel" placeholder="+92 300 1234567" error={errors.phone?.message} {...register("phone")} />
        <FullWidth>
          <TextField label="Email" value={user?.email ?? ""} disabled helper="Your login email can't be changed here. Contact support if you need to change it." />
          <div className="mt-2">
            {user?.emailVerified ? (
              <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-600">
                <CheckCircle2 className="h-3.5 w-3.5" /> Email verified
              </span>
            ) : (
              <span className="inline-flex flex-wrap items-center gap-2 text-xs font-medium text-amber-600">
                <MailWarning className="h-3.5 w-3.5" /> Email not verified
                <Button type="button" variant="link" size="sm" className="h-auto p-0 text-xs" onClick={resendVerification} disabled={resending}>
                  {resending ? "Sending…" : "Resend verification email"}
                </Button>
              </span>
            )}
          </div>
        </FullWidth>
        <FullWidth>
          <SaveBar dirty={isDirty} submitting={isSubmitting} onDiscard={() => reset(defaults)} />
        </FullWidth>
      </FormSection>
    </form>
  )
}

function PasswordSection({ onDirtyChange }: TabProps) {
  const [formError, setFormError] = useState<string | null>(null)
  const empty = { currentPassword: "", newPassword: "", confirmPassword: "" }
  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<PasswordValues>({ resolver: zodResolver(passwordFormSchema), defaultValues: empty })
  useReportDirty(isDirty, onDirtyChange)

  async function onSubmit(values: PasswordValues) {
    setFormError(null)
    try {
      const res = await api.post<{ token: string }>("/auth/change-password", {
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
      })
      tokenStore.replace(res.token) // this tab stays logged in; every other device is logged out
      reset(empty)
      toast.success("Password changed", { description: "You've been logged out on all other devices." })
    } catch (err) {
      setFormError(applyServerErrors(err, setError))
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
      <FormSection title="Change password" description="Changing your password logs you out on every other device.">
        {formError && (
          <FullWidth>
            <FormError message={formError} />
          </FullWidth>
        )}
        <FullWidth>
          <PasswordField label="Current password" required autoComplete="current-password" error={errors.currentPassword?.message} {...register("currentPassword")} />
        </FullWidth>
        <PasswordField label="New password" required autoComplete="new-password" helper={PASSWORD_HINT} error={errors.newPassword?.message} {...register("newPassword")} />
        <PasswordField label="Confirm new password" required autoComplete="new-password" error={errors.confirmPassword?.message} {...register("confirmPassword")} />
        <FullWidth>
          <SaveBar dirty={isDirty} submitting={isSubmitting} onDiscard={() => reset(empty)} label="Change password" />
        </FullWidth>
      </FormSection>
    </form>
  )
}

function SessionsSection() {
  const { logout } = useAuth()
  const confirm = useConfirm()
  const [busy, setBusy] = useState(false)

  async function logoutEverywhere() {
    const ok = await confirm({
      title: "Log out everywhere?",
      description: "You'll be logged out on every device and browser, including this one. Use this if you think someone else has access to your account.",
      confirmLabel: "Log out everywhere",
      tone: "danger",
    })
    if (!ok) return
    setBusy(true)
    try {
      await api.post("/auth/logout-all")
      toast.success("Logged out of all devices")
      logout()
    } catch (err) {
      toast.error(errorMessage(err))
      setBusy(false)
    }
  }

  return (
    <FormSection title="Sessions" description="Devices where you're logged in.">
      <FullWidth>
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#e9e4ff] bg-[#faf8ff] p-4">
          <p className="text-sm text-[#475569]">Lost a device or logged in on a shared computer? End every session at once.</p>
          <Button variant="outline" onClick={logoutEverywhere} disabled={busy}>
            {busy ? <Loader2 className="animate-spin" /> : <LogOut />} Log out everywhere
          </Button>
        </div>
      </FullWidth>
    </FormSection>
  )
}

/** "My account" — available to every role. */
export function AccountTab({ onDirtyChange }: TabProps) {
  // Two independent forms: the tab is dirty if either is.
  const [dirty, setDirty] = useState({ profile: false, password: false })
  useReportDirty(dirty.profile || dirty.password, onDirtyChange)

  return (
    <div className="space-y-6">
      <ProfileSection onDirtyChange={(d) => setDirty((s) => (s.profile === d ? s : { ...s, profile: d }))} />
      <PasswordSection onDirtyChange={(d) => setDirty((s) => (s.password === d ? s : { ...s, password: d }))} />
      <SessionsSection />
    </div>
  )
}
