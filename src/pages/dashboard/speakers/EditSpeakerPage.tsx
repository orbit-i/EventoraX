import { useParams } from "react-router"
import { Skeleton } from "@/components/ui/skeleton"
import { PageHeader } from "@/components/app/PageHeader"
import { ErrorState } from "@/components/app/States"
import { SpeakerForm } from "@/components/speakers/SpeakerForm"
import { useApi } from "@/hooks/useApi"
import type { Speaker } from "@/types/speaker"

export default function EditSpeakerPage() {
  const { id = "" } = useParams()
  const { data: speaker, error, initialLoading, reload } = useApi<Speaker>(`/speakers/${id}`)
  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader
        title={speaker ? `${speaker.firstName} ${speaker.lastName}` : "Edit speaker"}
        breadcrumbs={[
          { label: "Dashboard", to: "/dashboard" },
          { label: "Speakers", to: speaker ? `/dashboard/speakers?eventId=${speaker.eventId}` : "/dashboard/speakers" },
          { label: "Edit speaker" },
        ]}
      />
      {error ? (
        <ErrorState message={error} onRetry={reload} />
      ) : initialLoading || !speaker ? (
        <Skeleton className="h-96 rounded-2xl" />
      ) : (
        <SpeakerForm key={speaker.id} eventId={speaker.eventId} speaker={speaker} />
      )}
    </div>
  )
}