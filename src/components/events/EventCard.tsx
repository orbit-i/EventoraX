import { CalendarDays, MapPin, Video } from "lucide-react"
import { StatusBadge } from "@/components/app/StatusBadge"
import { formatDateTime } from "@/lib/format"
import type { EventItem } from "@/types/event"
import { CapacityBar } from "./CapacityBar"

/** One event in the card (grid) view. */
export function EventCard({
  event,
  onOpen,
  actions,
}: {
  event: EventItem
  onOpen: () => void
  actions?: React.ReactNode
}) {
  const place = event.mode === "ONLINE" ? "Online" : event.location || "Venue to be announced"
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onOpen}
      onKeyDown={(e) => e.key === "Enter" && onOpen()}
      className="group flex flex-col gap-4 rounded-2xl border border-[#e9e4ff] bg-white p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:border-[#c4b5fd] hover:shadow-md"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex flex-wrap gap-1.5">
          <StatusBadge kind="event" value={event.status} />
          <StatusBadge kind="mode" value={event.mode} />
        </div>
        <div onClick={(e) => e.stopPropagation()}>{actions}</div>
      </div>
      <div className="space-y-1.5">
        <h3 className="line-clamp-2 font-semibold text-[#0f172a] group-hover:text-[#7c3aed]">{event.title}</h3>
        <p className="flex items-center gap-1.5 text-sm text-[#64748b]">
          <CalendarDays className="h-4 w-4 shrink-0" /> {formatDateTime(event.startDateTime)}
        </p>
        <p className="flex items-center gap-1.5 text-sm text-[#64748b]">
          {event.mode === "ONLINE" ? <Video className="h-4 w-4 shrink-0" /> : <MapPin className="h-4 w-4 shrink-0" />}
          <span className="truncate">{place}</span>
        </p>
      </div>
      <CapacityBar registered={event._count?.registrations ?? 0} max={event.maxAttendees} />
    </div>
  )
}