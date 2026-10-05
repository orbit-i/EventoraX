import { useParams } from "react-router"
import { Skeleton } from "@/components/ui/skeleton"
import { PageHeader } from "@/components/app/PageHeader"
import { ErrorState } from "@/components/app/States"
import { EventForm } from "@/components/events/EventForm"
import { useApi } from "@/hooks/useApi"
import type { EventItem } from "@/types/event"

export default function EditEventPage() {
  const { id = "" } = useParams()
  const { data: event, error, initialLoading, reload } = useApi<EventItem>(`/events/${id}`)

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader
        title={event ? `Edit "${event.title}"` : "Edit event"}
        breadcrumbs={[
          { label: "Dashboard", to: "/dashboard" },
          { label: "Events", to: "/dashboard/events" },
          ...(event ? [{ label: event.title, to: `/dashboard/events/${id}` }] : []),
          { label: "Edit" },
        ]}
      />
      {error ? (
        <ErrorState message={error} onRetry={reload} />
      ) : initialLoading || !event ? (
        <div className="space-y-6">
          <Skeleton className="h-64 w-full rounded-2xl" />
          <Skeleton className="h-48 w-full rounded-2xl" />
        </div>
      ) : (
        // key: re-create the form if a different event is loaded
        <EventForm key={event.id} event={event} onCategoriesChanged={reload} />
      )}
    </div>
  )
}