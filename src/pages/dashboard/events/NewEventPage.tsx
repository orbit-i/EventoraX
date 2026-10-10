import { PageHeader } from "@/components/app/PageHeader"
import { EventForm } from "@/components/events/EventForm"

export default function NewEventPage() {
  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader
        title="New event"
        description="Fill in the details. You can change everything later."
        breadcrumbs={[
          { label: "Dashboard", to: "/dashboard" },
          { label: "Events", to: "/dashboard/events" },
          { label: "New event" },
        ]}
      />
      <EventForm />
    </div>
  )
}