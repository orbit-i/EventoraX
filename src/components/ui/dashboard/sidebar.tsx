import { useState } from "react"
import { NavLink, useLocation, useNavigate } from "react-router"
import {
  LayoutDashboard,
  BarChart3,
  PieChart,
  Users,
  CreditCard,
  Settings,
  Activity,
  LogOut,
  ChevronRight,
  ChevronLeft,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useAuth } from "@/context/AuthContext"

const navItems = [
  { to: "/dashboard", label: "Overview", icon: LayoutDashboard, end: true },
  { to: "/dashboard/statistics", label: "Statistics", icon: BarChart3 },
  { to: "/dashboard/charts", label: "Charts", icon: PieChart },
  { to: "/dashboard/team", label: "Team", icon: Users },
  { to: "/dashboard/billing", label: "Billing", icon: CreditCard },
  { to: "/dashboard/settings", label: "Settings", icon: Settings },
  { to: "/dashboard/activity", label: "Activity Logs", icon: Activity },
]

interface SidebarProps {
  collapsed?: boolean
  onCollapsedChange?: (collapsed: boolean) => void
}

export default function Sidebar({ collapsed: collapsedProp, onCollapsedChange }: SidebarProps = {}) {
  const location = useLocation()
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const [internalCollapsed, setInternalCollapsed] = useState(false)

  const collapsed = collapsedProp ?? internalCollapsed
  const setCollapsed = onCollapsedChange ?? setInternalCollapsed

  const initials = (user?.name ?? "?")
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase()

  const handleLogout = () => {
    logout()
    navigate("/login", { replace: true })
  }

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 z-40 h-screen bg-[#faf8ff] border-r border-[#e9e4ff] flex flex-col transition-all duration-300",
        collapsed ? "w-20" : "w-64"
      )}
    >
      {/* Logo */}
      <div className="flex items-center gap-2 px-6 py-5 border-b border-[#e9e4ff]">
        <div className="w-8 h-8 shrink-0 bg-[#7c3aed] rounded-lg flex items-center justify-center">
          <span className="text-white font-bold text-sm">E</span>
        </div>
        {!collapsed && (
          <span className="text-xl font-bold text-[#0f172a] whitespace-nowrap">
            Eventora<span className="text-[#7c3aed]">X</span>
          </span>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = item.end ? location.pathname === item.to : location.pathname.startsWith(item.to)
          const Icon = item.icon

          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              title={collapsed ? item.label : undefined}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200",
                collapsed && "justify-center",
                isActive
                  ? "bg-[#7c3aed] text-white shadow-md shadow-[#7c3aed]/25"
                  : "text-[#475569] hover:bg-[#f5f3ff] hover:text-[#7c3aed]"
              )}
            >
              <Icon className="w-5 h-5 shrink-0" />
              {!collapsed && item.label}
              {!collapsed && isActive && <ChevronRight className="w-4 h-4 ml-auto" />}
            </NavLink>
          )
        })}
      </nav>

      {/* Logged-in user */}
      <div className="p-4 border-t border-[#e9e4ff]">
        <div
          className={cn(
            "flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-[#f5f3ff] transition-colors",
            collapsed && "justify-center"
          )}
        >
          <div className="w-9 h-9 shrink-0 rounded-full bg-gradient-to-br from-[#7c3aed] to-[#a78bfa] flex items-center justify-center text-white font-bold text-sm">
            {initials}
          </div>
          {!collapsed && (
            <>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-[#0f172a] truncate">{user?.name}</p>
                <p className="text-xs text-[#94a3b8] truncate capitalize">{user?.role}</p>
              </div>
              <button
                onClick={handleLogout}
                title="Log out"
                className="p-1.5 rounded-lg hover:bg-red-50 text-[#94a3b8] hover:text-[#dc2626] transition-colors"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </>
          )}
        </div>
      </div>

      {/* Collapse toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-20 flex h-6 w-6 items-center justify-center rounded-full border border-[#e9e4ff] bg-white text-[#7c3aed] shadow-sm hover:shadow-md transition-all"
      >
        {collapsed ? <ChevronRight className="h-3 w-3" /> : <ChevronLeft className="h-3 w-3" />}
      </button>
    </aside>
  )
}