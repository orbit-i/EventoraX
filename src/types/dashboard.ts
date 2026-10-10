// Shapes returned by /api/v1/dashboard and /api/v1/analytics
import type { EventMode, EventStatus } from "./event"
import type { OrgStatus } from "./auth"

export interface EventSummary {
  id: string
  title: string
  startDateTime: string
  endDateTime: string
  status: EventStatus
  mode: EventMode
  location: string | null
  maxAttendees: number | null
  _count: { registrations: number }
}

export interface ActivityItem {
  id: string
  action: string
  entityType: string | null
  entityId: string | null
  metadata: Record<string, unknown> | null
  createdAt: string
  user: { id: string; name: string; email?: string } | null
  ipAddress?: string | null
}

export interface MonthCount {
  month: string // "2026-10"
  count: number
}

/** GET /dashboard/overview */
export interface Overview {
  organization: {
    id: string
    name: string
    logoUrl: string | null
    status: OrgStatus
    subscriptionEndsAt: string
    msLeft: number
    plan: { id: string; name: string } | null
  }
  totals: { events: number; registrations: number; certificates: number; teamMembers: number }
  upcomingEvents: EventSummary[]
  recentEvents: EventSummary[]
  recentActivity: ActivityItem[]
  registrationTrend: MonthCount[]
}