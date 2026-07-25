// NOTE: schema.prisma wasn't attached yet — these types are derived from the
// API reference in the handoff brief. Field names/types match what's
// documented; flag it if the real schema differs (esp. nullability).

export type EventMode = "ONLINE" | "OFFLINE" | "HYBRID";

export type EventStatus =
  | "DRAFT"
  | "PUBLISHED"
  | "ONGOING"
  | "COMPLETED"
  | "ARCHIVED";

// UI label mapping — backend enum values differ from what's shown to users.
export const EVENT_STATUS_LABELS: Record<EventStatus, string> = {
  DRAFT: "Draft",
  PUBLISHED: "Upcoming",
  ONGOING: "Active",
  COMPLETED: "Completed",
  ARCHIVED: "Archived",
};

export const EVENT_MODE_LABELS: Record<EventMode, string> = {
  ONLINE: "Online",
  OFFLINE: "Offline",
  HYBRID: "Hybrid",
};

export interface EventCounts {
  registrations: number;
  speakers: number;
  sponsors: number;
  sessions: number;
}

export interface EventItem {
  id: string;
  title: string;
  organizer?: string | null;
  mode: EventMode;
  startDateTime: string; // ISO
  endDateTime: string; // ISO
  location?: string | null;
  description?: string | null;
  topic?: string | null;
  maxAttendees?: number | null;
  ticketPrice?: string | null;
  registrationOpen: boolean;
  meetingLink?: string | null;
  certTemplateId?: string | null;
  autoIssueCert: boolean;
  status: EventStatus;
  createdAt?: string;
  updatedAt?: string;
  _count?: EventCounts;
}

export interface EventFormValues {
  title: string;
  organizer?: string;
  mode: EventMode;
  startDateTime: string;
  endDateTime: string;
  location?: string;
  description?: string;
  topic?: string;
  maxAttendees?: number;
  ticketPrice?: string;
  registrationOpen?: boolean;
  meetingLink?: string;
  certTemplateId?: string;
  autoIssueCert?: boolean;
  status?: EventStatus;
}

export interface EventsListFilters {
  search?: string;
  status?: EventStatus | "ALL";
  mode?: EventMode | "ALL";
  page?: number;
  limit?: number;
}

export interface EventCategory {
  id: string;
  eventId: string;
  label: string;
}
