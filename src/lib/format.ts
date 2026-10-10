/** One date / number / money format for the whole app (Pakistan locale). */
const LOCALE = "en-PK"

export function formatDate(value: string | Date | null | undefined): string {
  if (!value) return "—"
  return new Date(value).toLocaleDateString(LOCALE, { day: "numeric", month: "short", year: "numeric" })
}

export function formatDateTime(value: string | Date | null | undefined): string {
  if (!value) return "—"
  return new Date(value).toLocaleString(LOCALE, {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  })
}

export function formatTime(value: string | Date | null | undefined): string {
  if (!value) return "—"
  return new Date(value).toLocaleTimeString(LOCALE, { hour: "numeric", minute: "2-digit" })
}

export function formatPKR(amount: number | string | null | undefined): string {
  if (amount === null || amount === undefined || amount === "") return "Free"
  const n = Number(amount)
  if (!Number.isFinite(n) || n === 0) return "Free"
  return `PKR ${n.toLocaleString(LOCALE)}`
}

export function formatDuration(totalMinutes: number): string {
  const h = Math.floor(totalMinutes / 60)
  const m = Math.round(totalMinutes % 60)
  if (h === 0) return `${m}m`
  return m === 0 ? `${h}h` : `${h}h ${m}m`
}

/** "1 attendee" / "3 attendees" */
export function plural(count: number, singular: string, pluralForm = `${singular}s`): string {
  return `${count.toLocaleString(LOCALE)} ${count === 1 ? singular : pluralForm}`
}
/** "just now", "5 min ago", "3 h ago", "yesterday", or a date. */
export function formatRelative(value: string | Date | null | undefined): string {
  if (!value) return "—"
  const date = new Date(value)
  const seconds = Math.round((Date.now() - date.getTime()) / 1000)
  if (seconds < 45) return "just now"
  const minutes = Math.round(seconds / 60)
  if (minutes < 60) return `${minutes} min ago`
  const hours = Math.round(minutes / 60)
  if (hours < 24) return `${hours} h ago`
  const days = Math.round(hours / 24)
  if (days === 1) return "yesterday"
  if (days < 7) return `${days} days ago`
  return formatDate(date)
}

/** Time remaining in words: "3 days", "5 hours", "20 minutes". */
export function formatTimeLeft(ms: number): string {
  const minutes = Math.max(0, Math.floor(ms / 60000))
  if (minutes < 60) return plural(minutes, "minute")
  const hours = Math.floor(minutes / 60)
  if (hours < 48) return plural(hours, "hour")
  return plural(Math.floor(hours / 24), "day")
}

/** "2026-10" → "Oct" (or "Oct 2026" with the year). */
export function formatMonth(key: string, withYear = false): string {
  const [y, m] = key.split("-").map(Number)
  return new Date(Date.UTC(y ?? 2000, (m ?? 1) - 1, 1)).toLocaleDateString(LOCALE, {
    month: "short",
    ...(withYear ? { year: "numeric" } : {}),
    timeZone: "UTC",
  })
}