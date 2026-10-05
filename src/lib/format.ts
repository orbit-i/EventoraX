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