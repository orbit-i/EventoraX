/** Converts an ISO date to the value an <input type="datetime-local"> expects (local time). */
export function toDatetimeLocal(iso?: string | null): string {
  if (!iso) return ""
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ""
  const pad = (n: number) => String(n).padStart(2, "0")
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

/** Converts a datetime-local input value back to an ISO date for the API. */
export function fromDatetimeLocal(local: string): string {
  return new Date(local).toISOString()
}