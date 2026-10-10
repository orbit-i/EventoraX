import { useParams } from "react-router"
import { Skeleton } from "@/components/ui/skeleton"
import { PageHeader } from "@/components/app/PageHeader"
import { ErrorState } from "@/components/app/States"
import { SessionForm } from "@/components/sessions/SessionForm"
import { useApi } from "@/hooks/useApi"
import type { Session } from "@/types/session"

export default function EditSessionPage() {
  const { id = "" } = useParams()
  const { data: session, error, initialLoading, reload } = useApi<Session>(`/sessions/${id}`)
  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader
        title={session ? session.title : "Edit session"}
        breadcrumbs={[
          { label: "Dashboard", to: "/dashboard" },
          { label: "Schedule", to: session ? `/dashboard/schedule?eventId=${session.eventId}` : "/dashboard/schedule" },
          { label: "Edit session" },
        ]}
      />
      {error ? (
        <ErrorState message={error} onRetry={reload} />
      ) : initialLoading || !session ? (
        <Skeleton className="h-96 rounded-2xl" />
      ) : (
        <SessionForm key={session.id} eventId={session.eventId} session={session} />
      )}
    </div>
  )
}