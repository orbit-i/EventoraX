import { useEffect, useState } from "react"
import { Outlet, useLocation } from "react-router"
import { cn } from "@/lib/utils"
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet"
import { Sidebar } from "./Sidebar"
import { Topbar } from "./Topbar"
import { AccountBanners } from "./AccountBanners"

const COLLAPSED_KEY = "evx_sidebar_collapsed"

/** Frame around every dashboard page: menu, top bar and account notices. */
export default function DashboardLayout() {
  const { pathname } = useLocation()
  const [collapsed, setCollapsed] = useState(() => localStorage.getItem(COLLAPSED_KEY) === "1")
  const [drawerOpen, setDrawerOpen] = useState(false)

  // Close the phone menu when the page changes.
  useEffect(() => setDrawerOpen(false), [pathname])

  function toggleCollapsed() {
    setCollapsed((c) => {
      localStorage.setItem(COLLAPSED_KEY, c ? "0" : "1")
      return !c
    })
  }

  return (
    <div className="min-h-screen bg-[#f3f0ff]">
      {/* Desktop: fixed menu on the left */}
      <Sidebar
        collapsed={collapsed}
        onToggleCollapsed={toggleCollapsed}
        className={cn(
          "fixed inset-y-0 left-0 z-30 hidden border-r border-[#e9e4ff] transition-[width] duration-200 md:flex",
          collapsed ? "w-20" : "w-64"
        )}
      />

      {/* Phone: the same menu in a slide-out drawer */}
      <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
        <SheetContent side="left" className="w-72 gap-0 p-0">
          <SheetTitle className="sr-only">Menu</SheetTitle>
          <Sidebar onNavigate={() => setDrawerOpen(false)} />
        </SheetContent>
      </Sheet>

      <div className={cn("flex min-h-screen flex-col transition-[padding] duration-200", collapsed ? "md:pl-20" : "md:pl-64")}>
        <Topbar onOpenMenu={() => setDrawerOpen(true)} />
        <AccountBanners />
        <main className="flex-1 p-4 sm:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}