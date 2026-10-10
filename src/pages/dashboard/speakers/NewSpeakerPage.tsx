import { CalendarDays } from "lucide-react"
import { PageHeader } from "@/components/app/PageHeader"
import { EventPicker } from "@/components/app/EventPicker"
import { EmptyState } from "@/components/app/States"
import { SpeakerForm } from "@/components/speakers/SpeakerForm"
import { useSelectedEvent } from "@/hooks/useSelectedEvent"

export default function NewSpeakerPage() {
  const [eventId, setEventId] = useSelectedEvent()
  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader
        title="Add speaker"
        breadcrumbs={[
          { label: "Dashboard", to: "/dashboard" },
          { label: "Speakers", to: `/dashboard/speakers${eventId ? `?eventId=${eventId}` : ""}` },
          { label: "Add speaker" },
        ]}
      />
      <EventPicker value={eventId} onChange={setEventId} className="mb-6" />
      {eventId ? (
        <SpeakerForm key={eventId} eventId={eventId} />
      ) : (
        <EmptyState icon={CalendarDays} title="Choose an event first" compact />
      )}
    </div>
  )
}