import { Outlet } from "react-router-dom"
import Sidebar from "@/components/ui/dashboard/sidebar"

export default function DashboardLayout() {
  return (
    <div className="min-h-screen bg-[#f3f0ff]">
      <Sidebar />
      <main className="ml-64 min-h-screen">
        <Outlet />
      </main>
    </div>
  )
}