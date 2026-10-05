import { useEffect } from "react"
import { CalendarDays } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { useApi } from "@/hooks/useApi"
import { buildQuery } from "@/lib/api"
import { formatDate } from "@/lib/format"
import { StatusBadge } from "./StatusBadge"

export interface EventOptionItem {
  id: string
  title: string
  startDateTime: string
  status: string
}

/**
 * Chooses which event a page works on (Registrations, Speakers, Sponsors, Schedule).
 * Archived events are listed last so their records can still be viewed.
 */
export function EventPicker({
  value,
  onChange,
  className,
}: {
  value: string
  onChange: (eventId: string) => void
  className?: string
}) {
  const active = useApi<EventOptionItem[]>(`/events${buildQuery({ limit: 100 })}`)
  const archived = useApi<EventOptionItem[]>(`/events${buildQuery({ limit: 100, status: "ARCHIVED" })}`)
  const events = [...(active.data ?? []), ...(archived.data ?? [])]
  const loading = active.initialLoading || archived.initialLoading

  // The remembered event no longer exists (deleted) → clear the selection.
  useEffect(() => {
    if (!loading && value && events.length > 0 && !events.some((e) => e.id === value)) onChange("")
  }, [loading, value, events, onChange])

  if (loading) return <Skeleton className={`h-11 w-full max-w-md rounded-xl ${className ?? ""}`} />

  return (
    <div className={`flex items-center gap-3 ${className ?? ""}`}>
      <CalendarDays className="h-5 w-5 shrink-0 text-[#7c3aed]" />
      <Select value={value || undefined} onValueChange={onChange}>
        <SelectTrigger className="h-11 w-full max-w-md bg-white">
          <SelectValue placeholder={events.length ? "Choose an event…" : "No events yet — create one first"} />
        </SelectTrigger>
        <SelectContent>
          {events.map((event) => (
            <SelectItem key={event.id} value={event.id}>
              <span className="flex items-center gap-2">
                <span className="truncate">{event.title}</span>
                <span className="text-xs text-[#94a3b8]">{formatDate(event.startDateTime)}</span>
                {event.status === "ARCHIVED" && <StatusBadge kind="event" value="ARCHIVED" />}
              </span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}