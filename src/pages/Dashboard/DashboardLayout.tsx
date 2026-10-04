import { useState } from "react"
import { Outlet } from "react-router-dom"
import { cn } from "@/lib/utils"
import Sidebar from "@/components/ui/dashboard/sidebar"

export default function DashboardLayout() {
  const [collapsed, setCollapsed] = useState(false)

  return (
    <div className="min-h-screen bg-[#f3f0ff]">
      <Sidebar collapsed={collapsed} onCollapsedChange={setCollapsed} />
      <main
        className={cn(
          "min-h-screen transition-all duration-300",
          collapsed ? "ml-20" : "ml-64"
        )}
      >
        <Outlet />
      </main>
    </div>
  )
}