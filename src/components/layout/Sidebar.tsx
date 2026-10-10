import { NavLink, useLocation } from "react-router"
import { ChevronLeft, ChevronRight, Sparkles } from "lucide-react"
import { cn } from "@/lib/utils"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { useAuth } from "@/context/AuthContext"
import { useCan } from "@/lib/permissions"
import { formatDate, formatTimeLeft } from "@/lib/format"
import { NAV, type NavItem } from "./nav"

function OrgMark({ name, logoUrl, size = "md" }: { name: string; logoUrl: string | null; size?: "md" | "sm" }) {
  const box = size === "md" ? "h-9 w-9" : "h-8 w-8"
  return logoUrl ? (
    <img src={logoUrl} alt="" className={cn(box, "shrink-0 rounded-lg bg-white object-contain ring-1 ring-[#e9e4ff]")} />
  ) : (
    <div className={cn(box, "flex shrink-0 items-center justify-center rounded-lg bg-[#7c3aed] text-sm font-bold text-white")}>
      {name.charAt(0).toUpperCase() || "E"}
    </div>
  )
}

/** Small card at the bottom of the menu showing the plan and time left. */
function PlanCard({ collapsed, onNavigate }: { collapsed: boolean; onNavigate?: () => void }) {
  const { organization } = useAuth()
  const can = useCan()
  if (!organization || collapsed) return null

  const msLeft = new Date(organization.subscriptionEndsAt).getTime() - Date.now()
  const label =
    organization.status === "trial"
      ? `Free trial · ${formatTimeLeft(msLeft)} left`
      : organization.status === "expired"
        ? "Plan expired"
        : `${organization.plan?.name ?? "Plan"} · renews ${formatDate(organization.subscriptionEndsAt)}`

  const content = (
    <div
      className={cn(
        "rounded-xl border p-3 text-xs",
        organization.status === "expired" ? "border-rose-200 bg-rose-50 text-rose-700" : "border-[#e9e4ff] bg-white text-[#475569]"
      )}
    >
      <p className="flex items-center gap-1.5 font-semibold text-[#0f172a]">
        <Sparkles className="h-3.5 w-3.5 text-[#7c3aed]" /> {organization.plan?.name ?? "No plan"}
      </p>
      <p className="mt-0.5">{label}</p>
    </div>
  )

  return can("manage") ? (
    <NavLink to="/dashboard/billing" onClick={onNavigate} className="block transition-opacity hover:opacity-90">
      {content}
    </NavLink>
  ) : (
    content
  )
}

function NavEntry({ item, collapsed, onNavigate }: { item: NavItem; collapsed: boolean; onNavigate?: () => void }) {
  const { pathname } = useLocation()
  const active = item.end ? pathname === item.to : pathname === item.to || pathname.startsWith(`${item.to}/`)
  const Icon = item.icon

  const link = (
    <NavLink
      to={item.to}
      end={item.end}
      onClick={onNavigate}
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-colors",
        collapsed && "justify-center px-0",
        active ? "bg-[#7c3aed] text-white shadow-md shadow-[#7c3aed]/25" : "text-[#475569] hover:bg-[#f5f3ff] hover:text-[#7c3aed]"
      )}
    >
      <Icon className="h-[18px] w-[18px] shrink-0" />
      {!collapsed && <span className="truncate">{item.label}</span>}
    </NavLink>
  )

  if (!collapsed) return link
  return (
    <Tooltip>
      <TooltipTrigger asChild>{link}</TooltipTrigger>
      <TooltipContent side="right">{item.label}</TooltipContent>
    </Tooltip>
  )
}

/**
 * The dashboard menu. Used fixed on the left on desktop (collapsible to icons)
 * and inside a slide-out drawer on phones.
 */
export function Sidebar({
  collapsed = false,
  onToggleCollapsed,
  onNavigate,
  className,
}: {
  collapsed?: boolean
  onToggleCollapsed?: () => void
  /** Called after a link is clicked (closes the mobile drawer) */
  onNavigate?: () => void
  className?: string
}) {
  const { organization } = useAuth()
  const can = useCan()
  const orgName = organization?.whiteLabelName || organization?.name || "EventoraX"

  return (
    <aside className={cn("flex h-full flex-col bg-[#faf8ff]", className)}>
      {/* Organization */}
      <div className={cn("flex items-center gap-3 border-b border-[#e9e4ff] px-4 py-4", collapsed && "justify-center px-2")}>
        <OrgMark name={orgName} logoUrl={organization?.logoUrl ?? null} />
        {!collapsed && (
          <div className="min-w-0">
            <p className="truncate text-sm font-bold text-[#0f172a]">{orgName}</p>
            <p className="truncate text-xs text-[#94a3b8]">
              Eventora<span className="text-[#7c3aed]">X</span> dashboard
            </p>
          </div>
        )}
      </div>

      {/* Menu */}
      <nav aria-label="Dashboard" className="flex-1 space-y-5 overflow-y-auto px-3 py-4">
        {NAV.map((group, i) => {
          const items = group.items.filter((item) => !item.need || can(item.need))
          if (items.length === 0) return null
          return (
            <div key={group.title ?? i} className="space-y-1">
              {group.title &&
                (collapsed ? (
                  <div className="mx-auto mb-2 h-px w-6 bg-[#e9e4ff]" />
                ) : (
                  <p className="px-3 pb-1 text-[11px] font-semibold uppercase tracking-wider text-[#94a3b8]">{group.title}</p>
                ))}
              {items.map((item) => (
                <NavEntry key={item.to} item={item} collapsed={collapsed} onNavigate={onNavigate} />
              ))}
            </div>
          )
        })}
      </nav>

      <div className="space-y-2 border-t border-[#e9e4ff] p-3">
        <PlanCard collapsed={collapsed} onNavigate={onNavigate} />
        {onToggleCollapsed && (
          <button
            type="button"
            onClick={onToggleCollapsed}
            className={cn(
              "flex w-full items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium text-[#64748b] hover:bg-[#f5f3ff] hover:text-[#7c3aed]",
              collapsed && "justify-center px-0"
            )}
            aria-label={collapsed ? "Expand menu" : "Collapse menu"}
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
            {!collapsed && "Collapse menu"}
          </button>
        )}
      </div>
    </aside>
  )
}