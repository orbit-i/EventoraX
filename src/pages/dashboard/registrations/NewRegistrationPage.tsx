import { PageHeader } from "@/components/app/PageHeader"
import { EventPicker } from "@/components/app/EventPicker"
import { EmptyState } from "@/components/app/States"
import { RegistrationForm } from "@/components/registrations/RegistrationForm"
import { useSelectedEvent } from "@/hooks/useSelectedEvent"
import { CalendarDays } from "lucide-react"

export default function NewRegistrationPage() {
  const [eventId, setEventId] = useSelectedEvent()

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader
        title="Add attendee"
        description="Organizers can add attendees even when public registration is closed."
        breadcrumbs={[
          { label: "Dashboard", to: "/dashboard" },
          { label: "Registrations", to: `/dashboard/registrations${eventId ? `?eventId=${eventId}` : ""}` },
          { label: "Add attendee" },
        ]}
      />
      <EventPicker value={eventId} onChange={setEventId} className="mb-6" />
      {eventId ? (
        <RegistrationForm key={eventId} eventId={eventId} />
      ) : (
        <EmptyState icon={CalendarDays} title="Choose an event first" description="Pick which event this attendee is registering for." compact />
      )}
    </div>
  )
}