import { Input } from "@/components/ui/input"

/** Two date pickers ("from … to …") for a Toolbar. Values are "YYYY-MM-DD" (empty = no limit). */
export function DateRangeFilter({
  id,
  from,
  to,
  onChange,
}: {
  id: string
  from: string
  to: string
  onChange: (range: { from?: string; to?: string }) => void
}) {
  const bad = Boolean(from && to && from > to)
  return (
    <div className="flex items-center gap-2">
      <label className="sr-only" htmlFor={`${id}-from`}>
        From date
      </label>
      <Input
        id={`${id}-from`}
        type="date"
        value={from}
        max={to || undefined}
        onChange={(e) => onChange({ from: e.target.value })}
        className="h-10 w-40 bg-white"
        aria-invalid={bad}
      />
      <span className="text-sm text-[#94a3b8]">to</span>
      <label className="sr-only" htmlFor={`${id}-to`}>
        To date
      </label>
      <Input id={`${id}-to`} type="date" value={to} min={from || undefined} onChange={(e) => onChange({ to: e.target.value })} className="h-10 w-40 bg-white" aria-invalid={bad} />
    </div>
  )
}

/** A picked calendar day → the exact start / end of that day in the viewer's time zone (ISO), for the API. */
export function dayStart(day: string) {
  return day ? new Date(`${day}T00:00:00`).toISOString() : ""
}
export function dayEnd(day: string) {
  return day ? new Date(`${day}T23:59:59.999`).toISOString() : ""
}
