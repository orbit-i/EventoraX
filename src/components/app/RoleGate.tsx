import type { ReactNode } from "react"
import { useCan, type Permission } from "@/lib/permissions"

/** Renders children only if the user has the permission (viewers don't see edit buttons). */
export function RoleGate({ need, children, fallback = null }: { need: Permission; children: ReactNode; fallback?: ReactNode }) {
  const can = useCan()
  return <>{can(need) ? children : fallback}</>
}