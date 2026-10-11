import { useState } from "react"
import { Loader2, LogOut, UserCheck } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/context/AuthContext"
import { tokenStore } from "@/lib/api"

/** Shown across the dashboard while a superadmin is "logged in as" an organization admin. */
export function ImpersonationBanner() {
  const { impersonator, user, organization, stopImpersonating } = useAuth()
  const [leaving, setLeaving] = useState(false)
  if (!impersonator) return null

  function leave() {
    setLeaving(true)
    const orgId = organization?.id
    // A full page load back to the tenant: the dashboard's route guards would otherwise redirect first.
    if (tokenStore.stopImpersonation()) window.location.assign(orgId ? `/superadmin/tenants/${orgId}` : "/superadmin")
    else void stopImpersonating()
  }

  return (
    <div role="status" className="flex flex-wrap items-center gap-x-3 gap-y-2 border-b border-slate-800 bg-slate-900 px-4 py-2.5 text-sm text-white md:px-6">
      <UserCheck className="h-4 w-4 shrink-0 text-amber-300" />
      <span className="flex-1">
        <strong>Superadmin view:</strong> you're logged in as {user?.name} ({user?.email}) at <strong>{organization?.name}</strong>. Everything you do is
        logged as you.
      </span>
      <Button size="sm" variant="secondary" onClick={leave} disabled={leaving}>
        {leaving ? <Loader2 className="animate-spin" /> : <LogOut />} Back to superadmin
      </Button>
    </div>
  )
}
