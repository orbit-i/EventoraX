import { useAuth } from "@/context/AuthContext"

/**
 * What the logged-in user may do.
 *   write  → create / edit / delete event data (admins and managers)
 *   manage → team, billing, settings (admins only)
 */
export type Permission = "write" | "manage"

export function useCan() {
  const { user } = useAuth()
  const role = user?.role
  return (permission: Permission): boolean => {
    if (!role) return false
    if (permission === "write") return role === "admin" || role === "manager" || role === "superAdmin"
    return role === "admin" || role === "superAdmin"
  }
}