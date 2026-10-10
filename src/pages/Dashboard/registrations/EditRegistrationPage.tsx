import { useParams } from "react-router"
import { CheckCircle2, Clock, Hash, Ticket } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { PageHeader } from "@/components/app/PageHeader"
import { ErrorState } from "@/components/app/States"
import { StatusBadge } from "@/components/app/StatusBadge"
import { RegistrationForm } from "@/components/registrations/RegistrationForm"
import { useApi } from "@/hooks/useApi"
import { formatDateTime } from "@/lib/format"
import type { Registration } from "@/types/registration"

const VIA_LABEL = { WEB: "Public registration page", ADMIN: "Added by an organizer", CSV_IMPORT: "CSV import", API: "API" } as const

export default function EditRegistrationPage() {
  const { id = "" } = useParams()
  const { data: reg, error, initialLoading, reload } = useApi<Registration>(`/registrations/${id}`)

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader
        title={reg ? reg.name : "Edit attendee"}
        badge={reg && <StatusBadge kind="registration" value={reg.status} />}
        breadcrumbs={[
          { label: "Dashboard", to: "/dashboard" },
          { label: "Registrations", to: reg ? `/dashboard/registrations?eventId=${reg.eventId}` : "/dashboard/registrations" },
          { label: "Edit attendee" },
        ]}
      />

      {error ? (
        <ErrorState message={error} onRetry={reload} />
      ) : initialLoading || !reg ? (
        <Skeleton className="h-96 rounded-2xl" />
      ) : (
        <>
          <div className="mb-6 grid gap-3 rounded-2xl border border-[#e9e4ff] bg-[#faf8ff] p-4 text-sm sm:grid-cols-2 lg:grid-cols-4">
            <p className="flex items-center gap-2 text-[#64748b]">
              <Hash className="h-4 w-4 text-[#a78bfa]" /> <span className="font-mono text-[#0f172a]">{reg.refNo}</span>
            </p>
            <p className="flex items-center gap-2 text-[#64748b]">
              <Ticket className="h-4 w-4 text-[#a78bfa]" />
              <span className="font-mono text-[#0f172a]">{reg.ticket?.ticketNo ?? "No ticket"}</span>
            </p>
            <p className="flex items-center gap-2 text-[#64748b]">
              <CheckCircle2 className="h-4 w-4 text-[#a78bfa]" />
              {reg.ticket?.isUsed ? `Checked in ${formatDateTime(reg.ticket.usedAt)}` : "Not checked in"}
            </p>
            <p className="flex items-center gap-2 text-[#64748b]">
              <Clock className="h-4 w-4 text-[#a78bfa]" /> {VIA_LABEL[reg.registeredVia]} · {formatDateTime(reg.registrationDate)}
            </p>
          </div>
          <RegistrationForm key={reg.id} eventId={reg.eventId} registration={reg} />
        </>
      )}
    </div>
  )
}