import { Button } from "@/components/ui/button"
import { useAuth } from "@/context/AuthContext"

/** Placeholder until the Superadmin panel is built in Phase 10. */
export default function SuperadminHome() {
  const { user, logout } = useAuth()
  return (
    <main className="min-h-screen flex items-center justify-center bg-[#f3f0ff] px-4">
      <div className="max-w-md w-full bg-white rounded-2xl border border-[#e9e4ff] p-8 text-center space-y-4">
        <h1 className="text-2xl font-bold text-[#0f172a]">Superadmin Panel</h1>
        <p className="text-sm text-[#64748b]">
          Logged in as <strong>{user?.email}</strong>. The superadmin panel is built in Phase 10.
        </p>
        <Button variant="outline" onClick={logout}>
          Log out
        </Button>
      </div>
    </main>
  )
}