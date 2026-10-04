import type { ReactNode } from "react"
import { Navigate, useLocation } from "react-router"
import { useAuth, homeFor } from "@/context/AuthContext"
import { Spinner } from "@/components/ui/spinner"
import type { Role } from "@/types/auth"

export function FullPageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f3f0ff]">
      <Spinner className="size-8" />
    </div>
  )
}

/** Only logged-in users (optionally only certain roles) may see these pages. */
export function ProtectedRoute({ children, roles }: { children: ReactNode; roles?: Role[] }) {
  const { status, user } = useAuth()
  const location = useLocation()

  if (status === "loading") return <FullPageLoader />
  if (status === "guest" || !user) {
    return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />
  }
  if (roles && !roles.includes(user.role)) return <Navigate to={homeFor(user)} replace />
  return <>{children}</>
}

/** Login/register pages: logged-in users are sent straight to their dashboard. */
export function GuestRoute({ children }: { children: ReactNode }) {
  const { status, user } = useAuth()
  if (status === "loading") return <FullPageLoader />
  if (status === "authenticated" && user) return <Navigate to={homeFor(user)} replace />
  return <>{children}</>
}