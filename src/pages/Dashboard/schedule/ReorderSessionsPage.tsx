import { useEffect, useState } from "react"
import { useNavigate } from "react-router"
import { CalendarDays, ListOrdered } from "lucide-react"
import { toast } from "sonner"
import { Skeleton } from "@/components/ui/skeleton"
import { PageHeader } from "@/components/app/PageHeader"
import { EventPicker } from "@/components/app/EventPicker"
import { ReorderList } from "@/components/app/ReorderList"
import { EmptyState, ErrorState } from "@/components/app/States"
import { useApi } from "@/hooks/useApi"
import { useSelectedEvent } from "@/hooks/useSelectedEvent"
import { api, buildQuery, errorMessage } from "@/lib/api"
import { formatDate, formatTime } from "@/lib/format"
import type { Session } from "@/types/session"

export default function ReorderSessionsPage() {
  const navigate = useNavigate()
  const [eventId, setEventId] = useSelectedEvent()
  const [goTo, setGoTo] = useState<string | null>(null)
  const list = useApi<Session[]>(eventId ? `/sessions${buildQuery({ eventId, limit: 500 })}` : null)
  const backTo = `/dashboard/schedule?eventId=${eventId}`

  useEffect(() => {
    if (goTo) navigate(goTo)
  }, [goTo, navigate])

  async function save(ordered: Session[]) {
    try {
      await api.post("/reorder", { type: "sessions", items: ordered.map((s, i) => ({ id: s.id, displayOrder: i })) })
      toast.success("Session order saved")
      setGoTo(backTo)
      return true
    } catch (err) {
      toast.error(errorMessage(err))
      return false
    }
  }

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        title="Reorder sessions"
        description="The agenda is sorted by time. This order decides which comes first when sessions start at the same time, and the order on the public page."
        breadcrumbs={[
          { label: "Dashboard", to: "/dashboard" },
          { label: "Schedule", to: backTo },
          { label: "Reorder" },
        ]}
      />
      <EventPicker value={eventId} onChange={setEventId} className="mb-6" />
      {!eventId ? (
        <EmptyState icon={CalendarDays} title="Choose an event first" compact />
      ) : list.error ? (
        <ErrorState message={list.error} onRetry={list.reload} />
      ) : list.initialLoading ? (
        <Skeleton className="h-64 rounded-2xl" />
      ) : (list.data ?? []).length < 2 ? (
        <EmptyState icon={ListOrdered} title="Nothing to reorder" description="Add at least two sessions first." compact />
      ) : (
        <ReorderList
          items={list.data ?? []}
          onSave={save}
          renderItem={(s) => (
            <div className="flex items-center gap-4">
              <p className="w-28 shrink-0 text-xs font-semibold text-[#7c3aed]">
                {formatDate(s.startTime)}
                <br />
                <span className="font-normal text-[#94a3b8]">
                  {formatTime(s.startTime)} – {formatTime(s.endTime)}
                </span>
              </p>
              <div className="min-w-0">
                <p className="truncate font-medium text-[#0f172a]">{s.title}</p>
                <p className="truncate text-xs text-[#94a3b8]">
                  {[s.speaker ? `${s.speaker.firstName} ${s.speaker.lastName}` : null, s.location].filter(Boolean).join(" · ") || "—"}
                </p>
              </div>
            </div>
          )}
        />
      )}
    </div>
  )
}