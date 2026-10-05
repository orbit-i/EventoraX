// Shapes returned by the events API (/api/v1/events). Labels and colours live in lib/status.ts.

export type EventMode = "ONLINE" | "OFFLINE" | "HYBRID"
export type EventStatus = "DRAFT" | "PUBLISHED" | "ONGOING" | "COMPLETED" | "ARCHIVED"

export interface EventCategory {
  id: string
  eventId: string
  label: string
  _count?: { registrations: number }
}

export interface EventItem {
  id: string
  title: string
  organizer: string | null
  mode: EventMode
  startDateTime: string
  endDateTime: string
  location: string | null
  description: string | null
  topic: string | null
  maxAttendees: number | null
  ticketPrice: string | null
  registrationOpen: boolean
  meetingLink: string | null
  certTemplateId: string | null
  autoIssueCert: boolean
  status: EventStatus
  createdAt: string
  updatedAt: string
  categories?: EventCategory[]
  _count?: {
    registrations: number
    speakers?: number
    sponsors?: number
    sessions?: number
    certificates?: number
  }
}

/** GET /events/stats */
export interface EventsOverview {
  total: number
  active: number
  byStatus: Record<EventStatus, number>
}

/** GET /events/:id/stats */
export interface EventStats {
  registrations: {
    total: number
    active: number
    REGISTERED: number
    ATTENDED: number
    ABSENT: number
    CANCELLED: number
    attendanceRate: number
    maxAttendees: number | null
    seatsLeft: number | null
  }
  speakers: { total: number; public: number; hidden: number; withSessions: number }
  sponsors: { total: number; public: number; byTier: Record<"PLATINUM" | "GOLD" | "SILVER" | "BRONZE", number> }
  sessions: { total: number; withSpeaker: number; public: number; totalMinutes: number }
  tickets: { total: number; checkedIn: number }
  categories: number
}