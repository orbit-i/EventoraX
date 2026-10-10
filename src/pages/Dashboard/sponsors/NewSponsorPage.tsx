import { CalendarDays } from "lucide-react"
import { PageHeader } from "@/components/app/PageHeader"
import { EventPicker } from "@/components/app/EventPicker"
import { EmptyState } from "@/components/app/States"
import { SponsorForm } from "@/components/sponsors/SponsorForm"
import { useSelectedEvent } from "@/hooks/useSelectedEvent"

export default function NewSponsorPage() {
  const [eventId, setEventId] = useSelectedEvent()
  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader
        title="Add sponsor"
        breadcrumbs={[
          { label: "Dashboard", to: "/dashboard" },
          { label: "Sponsors", to: `/dashboard/sponsors${eventId ? `?eventId=${eventId}` : ""}` },
          { label: "Add sponsor" },
        ]}
      />
      <EventPicker value={eventId} onChange={setEventId} className="mb-6" />
      {eventId ? <SponsorForm key={eventId} eventId={eventId} /> : <EmptyState icon={CalendarDays} title="Choose an event first" compact />}
    </div>
  )
}