import { Suspense, useEffect, useState } from "react"
import { Outlet, useLocation } from "react-router"
import { PageLoader } from "@/components/app/PageLoader"
import { cn } from "@/lib/utils"
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet"
import { Sidebar } from "@/components/layout/Sidebar"
import { Topbar } from "@/components/layout/Topbar"
import { Link } from "react-router"
import { Wrench } from "lucide-react"
import { usePlatform } from "@/context/PlatformContext"

const COLLAPSED_KEY = "evx_sa_sidebar_collapsed"

/** Frame around every superadmin page (same look as the organization dashboard, platform menu). */
export default function SuperadminLayout() {
  const { pathname } = useLocation()
  const [collapsed, setCollapsed] = useState(() => localStorage.getItem(COLLAPSED_KEY) === "1")
  const [drawerOpen, setDrawerOpen] = useState(false)
  const { platform } = usePlatform()

  useEffect(() => setDrawerOpen(false), [pathname])

  function toggleCollapsed() {
    setCollapsed((c) => {
      localStorage.setItem(COLLAPSED_KEY, c ? "0" : "1")
      return !c
    })
  }

  return (
    <div className="min-h-screen bg-[#f3f0ff]">
      <Sidebar
        variant="platform"
        collapsed={collapsed}
        onToggleCollapsed={toggleCollapsed}
        className={cn(
          "fixed inset-y-0 left-0 z-30 hidden border-r border-[#e9e4ff] transition-[width] duration-200 md:flex",
          collapsed ? "w-20" : "w-64"
        )}
      />
      <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
        <SheetContent side="left" className="w-72 gap-0 p-0">
          <SheetTitle className="sr-only">Menu</SheetTitle>
          <Sidebar variant="platform" onNavigate={() => setDrawerOpen(false)} />
        </SheetContent>
      </Sheet>
      <div className={cn("flex min-h-screen flex-col transition-[padding] duration-200", collapsed ? "md:pl-20" : "md:pl-64")}>
        <Topbar variant="platform" onOpenMenu={() => setDrawerOpen(true)} />
        {platform?.maintenance.enabled && (
          <div role="status" className="flex items-center gap-3 border-b border-amber-200 bg-amber-50 px-4 py-2 text-sm text-amber-900 md:px-6">
            <Wrench className="h-4 w-4 shrink-0" />
            <span className="flex-1">
              <strong>Maintenance mode is on.</strong> Organizations see a maintenance screen; only superadmins can use EventoraX.
            </span>
            <Link to="/superadmin/maintenance" className="font-semibold underline underline-offset-2">
              Turn off
            </Link>
          </div>
        )}
        <main className="flex-1 p-4 sm:p-6">
          <Suspense fallback={<PageLoader />}>
            <Outlet />
          </Suspense>
        </main>
      </div>
    </div>
  )
}
