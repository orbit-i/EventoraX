import { useState } from "react"
import { Link } from "react-router"
import { AlertOctagon, Clock, MailWarning, Sparkles, X } from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/context/AuthContext"
import { useCan } from "@/lib/permissions"
import { useNow } from "@/hooks/useNow"
import { api, errorMessage } from "@/lib/api"
import { formatDate, formatTimeLeft } from "@/lib/format"

const DAY = 24 * 60 * 60 * 1000
const DISMISS_KEY = "evx_trial_banner_dismissed"

function Banner({
  tone,
  icon: Icon,
  children,
  action,
  onDismiss,
}: {
  tone: "red" | "amber" | "violet"
  icon: typeof Clock
  children: React.ReactNode
  action?: React.ReactNode
  onDismiss?: () => void
}) {
  return (
    <div
      role={tone === "red" ? "alert" : "status"}
      className={cn(
        "flex flex-wrap items-center gap-x-3 gap-y-2 border-b px-4 py-2.5 text-sm md:px-6",
        tone === "red" && "border-rose-200 bg-rose-50 text-rose-800",
        tone === "amber" && "border-amber-200 bg-amber-50 text-amber-800",
        tone === "violet" && "border-[#ddd6fe] bg-[#f5f3ff] text-[#5b21b6]"
      )}
    >
      <Icon className="h-4 w-4 shrink-0" />
      <span className="flex-1">{children}</span>
      {action}
      {onDismiss && (
        <button type="button" onClick={onDismiss} className="rounded-md p-1 opacity-70 hover:opacity-100" aria-label="Dismiss">
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  )
}

/** Subscription and email-verification notices shown above every dashboard page. */
export function AccountBanners() {
  const { user, organization } = useAuth()
  const can = useCan()
  const now = useNow()
  const [trialDismissed, setTrialDismissed] = useState(() => sessionStorage.getItem(DISMISS_KEY) === "1")
  const [sending, setSending] = useState(false)

  if (!user || !organization) return null

  const endsAt = new Date(organization.subscriptionEndsAt).getTime()
  const msLeft = endsAt - now
  const expired = organization.status === "expired" || msLeft <= 0
  const planName = organization.plan?.name ?? "current"

  const renewButton = can("manage") ? (
    <Button asChild size="sm" variant={expired ? "danger" : "default"}>
      <Link to="/dashboard/billing">{expired ? "Renew now" : "Choose a plan"}</Link>
    </Button>
  ) : (
    <span className="text-xs opacity-80">Ask an admin to renew</span>
  )

  async function resendVerification() {
    setSending(true)
    try {
      await api.post("/auth/resend-verification")
      toast.success(`Verification email sent to ${user!.email}`)
    } catch (err) {
      toast.error(errorMessage(err))
    } finally {
      setSending(false)
    }
  }

  return (
    <>
      {expired ? (
        <Banner tone="red" icon={AlertOctagon} action={renewButton}>
          <strong>Your {organization.status === "trial" ? "free trial" : `${planName} plan`} has ended.</strong> Events, registrations and
          certificates are paused until you renew. Nothing has been deleted.
        </Banner>
      ) : organization.status === "trial" ? (
        !trialDismissed && (
          <Banner
            tone="violet"
            icon={Sparkles}
            action={renewButton}
            onDismiss={() => {
              sessionStorage.setItem(DISMISS_KEY, "1")
              setTrialDismissed(true)
            }}
          >
            You're on a <strong>free trial</strong> — <strong>{formatTimeLeft(msLeft)}</strong> left. Choose a plan to keep everything running.
          </Banner>
        )
      ) : (
        msLeft < 7 * DAY && (
          <Banner tone="amber" icon={Clock} action={renewButton}>
            Your {planName} plan ends on <strong>{formatDate(organization.subscriptionEndsAt)}</strong> ({formatTimeLeft(msLeft)} left). Renew to
            avoid any interruption.
          </Banner>
        )
      )}

      {!user.emailVerified && (
        <Banner
          tone="amber"
          icon={MailWarning}
          action={
            <Button size="sm" variant="outline" disabled={sending} onClick={() => void resendVerification()}>
              {sending ? "Sending…" : "Resend email"}
            </Button>
          }
        >
          Please verify your email address (<strong>{user.email}</strong>) — check your inbox for the link.
        </Banner>
      )}
    </>
  )
}