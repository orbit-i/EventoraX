import type { SeatUsage, TeamRole } from "@/types/team"

/** What each role may do — shown in the invite dialog and on the Team page. */
export const ROLE_INFO: Record<TeamRole, { label: string; description: string }> = {
  admin: { label: "Admin", description: "Everything, including team, billing and settings." },
  manager: { label: "Manager", description: "Create and edit events, attendees, speakers, sponsors and the schedule." },
  viewer: { label: "Viewer", description: "Can see everything but can't change anything." },
}

/** Seats still free (null = unlimited). */
export function seatsLeft(seat: SeatUsage): number | null {
  return seat.limit === null ? null : Math.max(0, seat.limit - seat.used)
}
