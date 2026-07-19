"use client"

import { NavLink, useLocation } from "react-router-dom"
import { 
  LayoutDashboard, 
  BarChart3, 
  PieChart, 
  Users, 
  CreditCard, 
  Settings, 
  Activity,
  LogOut,
  ChevronRight
} from "lucide-react"
import { cn } from "@/lib/utils"

const navItems = [
  { to: "/dashboard", label: "Overview", icon: LayoutDashboard, end: true },
  { to: "/dashboard/statistics", label: "Statistics", icon: BarChart3 },
  { to: "/dashboard/charts", label: "Charts", icon: PieChart },
  { to: "/dashboard/team", label: "Team", icon: Users },
  { to: "/dashboard/billing", label: "Billing", icon: CreditCard },
  { to: "/dashboard/settings", label: "Settings", icon: Settings },
  { to: "/dashboard/activity", label: "Activity Logs", icon: Activity },
]

export default function Sidebar() {
  const location = useLocation()

  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-64 bg-[#faf8ff] border-r border-[#e9e4ff] flex flex-col">
      {/* Logo */}
      <div className="flex items-center gap-2 px-6 py-5 border-b border-[#e9e4ff]">
        <div className="w-8 h-8 bg-[#7c3aed] rounded-lg flex items-center justify-center">
          <span className="text-white font-bold text-sm">E</span>
        </div>
        <span className="text-xl font-bold text-[#0f172a]">
          Eventora<span className="text-[#7c3aed]">X</span>
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = item.end 
            ? location.pathname === item.to
            : location.pathname.startsWith(item.to)
          const Icon = item.icon
          
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200",
                isActive 
                  ? "bg-[#7c3aed] text-white shadow-md shadow-[#7c3aed]/25" 
                  : "text-[#475569] hover:bg-[#f5f3ff] hover:text-[#7c3aed]"
              )}
            >
              <Icon className="w-5 h-5" />
              {item.label}
              {isActive && <ChevronRight className="w-4 h-4 ml-auto" />}
            </NavLink>
          )
        })}
      </nav>

      {/* User Profile */}
      <div className="p-4 border-t border-[#e9e4ff]">
        <div className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-[#f5f3ff] transition-colors cursor-pointer">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#7c3aed] to-[#a78bfa] flex items-center justify-center text-white font-bold text-sm">
            JD
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-[#0f172a] truncate">John Doe</p>
            <p className="text-xs text-[#94a3b8] truncate">john@company.com</p>
          </div>
          <button 
            onClick={() => {
              localStorage.removeItem("token")
              window.location.href = "/login"
            }}
            className="p-1.5 rounded-lg hover:bg-red-50 text-[#94a3b8] hover:text-[#dc2626] transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  )
}