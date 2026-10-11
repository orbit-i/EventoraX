import { useCallback } from "react"
import { useNavigate } from "react-router"
import { toast } from "sonner"
import { useConfirm } from "@/components/app/ConfirmDialog"
import { useAuth } from "@/context/AuthContext"
import { api, errorMessage } from "@/lib/api"

interface ImpersonationResponse {
  token: string
}

/** "Log in as admin": asks first, then opens that organization's dashboard in this tab (1-hour session). */
export function useImpersonate() {
  const confirm = useConfirm()
  const { impersonate } = useAuth()
  const navigate = useNavigate()

  return useCallback(
    async (tenant: { id: string; name: string; status: string }) => {
      const blocked = tenant.status === "suspended" ? " It is suspended, so most pages will show the suspension message." : ""
      const ok = await confirm({
        title: `Log in as ${tenant.name}'s admin?`,
        description: `You'll see their dashboard exactly as they do, for up to 1 hour. Everything you change is real and is logged as done by you.${blocked}`,
        confirmLabel: "Log in as admin",
      })
      if (!ok) return
      try {
        const res = await api.post<ImpersonationResponse>(`/superadmin/tenants/${tenant.id}/impersonate`)
        // No toast here: it would cover the "Back to superadmin" button; the banner explains everything.
        await impersonate(res.token)
        navigate("/dashboard", { replace: true })
      } catch (err) {
        toast.error(errorMessage(err))
      }
    },
    [confirm, impersonate, navigate]
  )
}
