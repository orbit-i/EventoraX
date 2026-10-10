import { Link, useNavigate } from "react-router"
import { CreditCard, ExternalLink, LogOut, Menu, MonitorSmartphone, Settings, UserRound } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar } from "@/components/app/Avatar"
import { useConfirm } from "@/components/app/ConfirmDialog"
import { useAuth } from "@/context/AuthContext"
import { useCan } from "@/lib/permissions"
import { api, errorMessage } from "@/lib/api"

const ROLE_LABEL = { superAdmin: "Super admin", admin: "Admin", manager: "Manager", viewer: "Viewer" } as const

/** Top bar: menu button on phones, and the account menu. */
export function Topbar({ onOpenMenu }: { onOpenMenu: () => void }) {
  const { user, organization, logout } = useAuth()
  const can = useCan()
  const confirm = useConfirm()
  const navigate = useNavigate()

  function signOut() {
    logout()
    navigate("/login", { replace: true })
  }

  async function signOutEverywhere() {
    const ok = await confirm({
      title: "Log out of all devices?",
      description: "You'll be logged out here and on every other phone or computer where you're signed in.",
      confirmLabel: "Log out everywhere",
    })
    if (!ok) return
    try {
      await api.post("/auth/logout-all")
      toast.success("Logged out of all devices")
      signOut()
    } catch (err) {
      toast.error(errorMessage(err))
    }
  }

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-[#e9e4ff] bg-white/85 px-4 backdrop-blur md:px-6">
      <Button variant="ghost" size="icon-sm" className="md:hidden" onClick={onOpenMenu} aria-label="Open menu">
        <Menu />
      </Button>
      <p className="truncate text-sm font-semibold text-[#0f172a] md:hidden">{organization?.whiteLabelName || organization?.name}</p>

      <div className="ml-auto flex items-center gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger className="flex items-center gap-2.5 rounded-xl px-2 py-1.5 outline-none transition-colors hover:bg-[#f5f3ff] focus-visible:ring-2 focus-visible:ring-[#7c3aed]/30">
            <Avatar name={user?.name ?? "?"} size="sm" />
            <span className="hidden text-left sm:block">
              <span className="block max-w-[160px] truncate text-sm font-semibold text-[#0f172a]">{user?.name}</span>
              <span className="block text-xs text-[#94a3b8]">{user ? ROLE_LABEL[user.role] : ""}</span>
            </span>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-64">
            <DropdownMenuLabel className="font-normal">
              <p className="truncate text-sm font-semibold text-[#0f172a]">{user?.name}</p>
              <p className="truncate text-xs text-[#64748b]">{user?.email}</p>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link to="/dashboard/settings?tab=account">
                <UserRound className="h-4 w-4" /> My account
              </Link>
            </DropdownMenuItem>
            {can("manage") && (
              <>
                <DropdownMenuItem asChild>
                  <Link to="/dashboard/settings?tab=organization">
                    <Settings className="h-4 w-4" /> Organization settings
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/dashboard/billing">
                    <CreditCard className="h-4 w-4" /> Billing
                  </Link>
                </DropdownMenuItem>
              </>
            )}
            <DropdownMenuItem asChild>
              <a href="/" target="_blank" rel="noreferrer">
                <ExternalLink className="h-4 w-4" /> EventoraX website
              </a>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={() => void signOutEverywhere()}>
              <MonitorSmartphone className="h-4 w-4" /> Log out of all devices
            </DropdownMenuItem>
            <DropdownMenuItem variant="destructive" onSelect={signOut}>
              <LogOut className="h-4 w-4" /> Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}