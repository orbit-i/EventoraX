import { CalendarDays } from "lucide-react"
import { PageHeader } from "@/components/app/PageHeader"
import { EventPicker } from "@/components/app/EventPicker"
import { EmptyState } from "@/components/app/States"
import { SessionForm } from "@/components/sessions/SessionForm"
import { useSelectedEvent } from "@/hooks/useSelectedEvent"

export default function NewSessionPage() {
  const [eventId, setEventId] = useSelectedEvent()
  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader
        title="Add session"
        breadcrumbs={[
          { label: "Dashboard", to: "/dashboard" },
          { label: "Schedule", to: `/dashboard/schedule${eventId ? `?eventId=${eventId}` : ""}` },
          { label: "Add session" },
        ]}
      />
      <EventPicker value={eventId} onChange={setEventId} className="mb-6" />
      {eventId ? <SessionForm key={eventId} eventId={eventId} /> : <EmptyState icon={CalendarDays} title="Choose an event first" compact />}
    </div>
  )
}