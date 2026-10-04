import { useState } from "react"
import { Outlet } from "react-router"
import { MailWarning } from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import Sidebar from "@/components/ui/dashboard/sidebar"
import { useAuth } from "@/context/AuthContext"
import { api, errorMessage } from "@/lib/api"

function VerifyEmailBanner({ email }: { email: string }) {
  const [sending, setSending] = useState(false)

  const resend = async () => {
    setSending(true)
    try {
      await api.post("/auth/resend-verification")
      toast.success(`Verification email sent to ${email}`)
    } catch (err) {
      toast.error(errorMessage(err))
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-3 bg-amber-50 border-b border-amber-200 px-6 py-2.5 text-sm text-amber-800">
      <MailWarning className="w-4 h-4 shrink-0" />
      <span>
        Please verify your email address (<strong>{email}</strong>).
      </span>
      <button onClick={resend} disabled={sending} className="font-semibold underline hover:no-underline disabled:opacity-60">
        {sending ? "Sending..." : "Resend email"}
      </button>
    </div>
  )
}

export default function DashboardLayout() {
  const [collapsed, setCollapsed] = useState(false)
  const { user } = useAuth()

  return (
    <div className="min-h-screen bg-[#f3f0ff]">
      <Sidebar collapsed={collapsed} onCollapsedChange={setCollapsed} />
      <main className={cn("min-h-screen transition-all duration-300", collapsed ? "ml-20" : "ml-64")}>
        {user && !user.emailVerified && <VerifyEmailBanner email={user.email} />}
        <Outlet />
      </main>
    </div>
  )
}