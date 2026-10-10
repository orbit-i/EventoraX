import { useParams } from "react-router"
import { Skeleton } from "@/components/ui/skeleton"
import { PageHeader } from "@/components/app/PageHeader"
import { ErrorState } from "@/components/app/States"
import { SponsorForm } from "@/components/sponsors/SponsorForm"
import { useApi } from "@/hooks/useApi"
import type { Sponsor } from "@/types/sponsor"

export default function EditSponsorPage() {
  const { id = "" } = useParams()
  const { data: sponsor, error, initialLoading, reload } = useApi<Sponsor>(`/sponsors/${id}`)
  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader
        title={sponsor ? sponsor.name : "Edit sponsor"}
        breadcrumbs={[
          { label: "Dashboard", to: "/dashboard" },
          { label: "Sponsors", to: sponsor ? `/dashboard/sponsors?eventId=${sponsor.eventId}` : "/dashboard/sponsors" },
          { label: "Edit sponsor" },
        ]}
      />
      {error ? (
        <ErrorState message={error} onRetry={reload} />
      ) : initialLoading || !sponsor ? (
        <Skeleton className="h-96 rounded-2xl" />
      ) : (
        <SponsorForm key={sponsor.id} eventId={sponsor.eventId} sponsor={sponsor} />
      )}
    </div>
  )
}