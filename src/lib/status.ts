/**
 * Every status shown anywhere in the app: one label and one colour each.
 * Change wording or colours here and every badge, filter and chip follows.
 */
export type Tone = "slate" | "blue" | "green" | "amber" | "red" | "purple" | "teal"

export interface StatusMeta {
  label: string
  tone: Tone
}

export const EVENT_STATUS: Record<string, StatusMeta> = {
  DRAFT: { label: "Draft", tone: "slate" },
  PUBLISHED: { label: "Upcoming", tone: "blue" },
  ONGOING: { label: "Active", tone: "green" },
  COMPLETED: { label: "Completed", tone: "purple" },
  ARCHIVED: { label: "Archived", tone: "amber" },
}

export const EVENT_MODE: Record<string, StatusMeta> = {
  OFFLINE: { label: "Physical", tone: "teal" },
  ONLINE: { label: "Online", tone: "blue" },
  HYBRID: { label: "Hybrid", tone: "purple" },
}

export const REGISTRATION_STATUS: Record<string, StatusMeta> = {
  REGISTERED: { label: "Registered", tone: "blue" },
  ATTENDED: { label: "Attended", tone: "green" },
  ABSENT: { label: "Absent", tone: "amber" },
  CANCELLED: { label: "Cancelled", tone: "slate" },
}

export const SPONSOR_TIER: Record<string, StatusMeta> = {
  PLATINUM: { label: "Platinum", tone: "slate" },
  GOLD: { label: "Gold", tone: "amber" },
  SILVER: { label: "Silver", tone: "slate" },
  BRONZE: { label: "Bronze", tone: "red" },
}

export const ORG_STATUS: Record<string, StatusMeta> = {
  trial: { label: "Trial", tone: "blue" },
  active: { label: "Active", tone: "green" },
  expired: { label: "Expired", tone: "red" },
  suspended: { label: "Suspended", tone: "red" },
}

export const TEAM_ROLE: Record<string, StatusMeta> = {
  admin: { label: "Admin", tone: "purple" },
  manager: { label: "Manager", tone: "blue" },
  viewer: { label: "Viewer", tone: "slate" },
}

export const VISIBILITY: Record<string, StatusMeta> = {
  true: { label: "Public", tone: "green" },
  false: { label: "Hidden", tone: "slate" },
}

export const STATUS_MAPS = {
  event: EVENT_STATUS,
  mode: EVENT_MODE,
  registration: REGISTRATION_STATUS,
  tier: SPONSOR_TIER,
  org: ORG_STATUS,
  role: TEAM_ROLE,
  visibility: VISIBILITY,
} as const

export type StatusKind = keyof typeof STATUS_MAPS

export const TONE_CLASSES: Record<Tone, { badge: string; dot: string }> = {
  slate: { badge: "bg-slate-100 text-slate-700 border-slate-200", dot: "bg-slate-400" },
  blue: { badge: "bg-blue-50 text-blue-700 border-blue-200", dot: "bg-blue-500" },
  green: { badge: "bg-emerald-50 text-emerald-700 border-emerald-200", dot: "bg-emerald-500" },
  amber: { badge: "bg-amber-50 text-amber-700 border-amber-200", dot: "bg-amber-500" },
  red: { badge: "bg-rose-50 text-rose-700 border-rose-200", dot: "bg-rose-500" },
  purple: { badge: "bg-violet-50 text-violet-700 border-violet-200", dot: "bg-violet-500" },
  teal: { badge: "bg-teal-50 text-teal-700 border-teal-200", dot: "bg-teal-500" },
}

/** Options for filter dropdowns, e.g. statusOptions("registration"). */
export function statusOptions(kind: StatusKind): { value: string; label: string }[] {
  return Object.entries(STATUS_MAPS[kind]).map(([value, meta]) => ({ value, label: meta.label }))
}

export function statusLabel(kind: StatusKind, value: string | boolean | null | undefined): string {
  if (value === null || value === undefined) return "—"
  return STATUS_MAPS[kind][String(value)]?.label ?? String(value)
}