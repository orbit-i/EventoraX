import { useEffect, useState } from "react"
import { useNavigate } from "react-router"
import { CalendarDays, Mic2 } from "lucide-react"
import { toast } from "sonner"
import { Skeleton } from "@/components/ui/skeleton"
import { PageHeader } from "@/components/app/PageHeader"
import { EventPicker } from "@/components/app/EventPicker"
import { ReorderList } from "@/components/app/ReorderList"
import { EmptyState, ErrorState } from "@/components/app/States"
import { StatusBadge } from "@/components/app/StatusBadge"
import { Avatar } from "@/components/app/Avatar"
import { useApi } from "@/hooks/useApi"
import { useSelectedEvent } from "@/hooks/useSelectedEvent"
import { api, buildQuery, errorMessage } from "@/lib/api"
import type { Speaker } from "@/types/speaker"

export default function ReorderSpeakersPage() {
  const navigate = useNavigate()
  const [eventId, setEventId] = useSelectedEvent()
  const [goTo, setGoTo] = useState<string | null>(null)
  const list = useApi<Speaker[]>(eventId ? `/speakers${buildQuery({ eventId, limit: 500 })}` : null)
  const backTo = `/dashboard/speakers?eventId=${eventId}`

  useEffect(() => {
    if (goTo) navigate(goTo)
  }, [goTo, navigate])

  async function save(ordered: Speaker[]) {
    try {
      await api.post("/reorder", { type: "speakers", items: ordered.map((s, i) => ({ id: s.id, displayOrder: i })) })
      toast.success("Speaker order saved")
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
        title="Reorder speakers"
        description="This is the order speakers appear on the public event page."
        breadcrumbs={[
          { label: "Dashboard", to: "/dashboard" },
          { label: "Speakers", to: backTo },
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
        <EmptyState icon={Mic2} title="Nothing to reorder" description="Add at least two speakers first." compact />
      ) : (
        <ReorderList
          items={list.data ?? []}
          onSave={save}
          renderItem={(s) => (
            <div className="flex items-center gap-3">
              <Avatar name={`${s.firstName} ${s.lastName}`} src={s.photo} size="sm" />
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium text-[#0f172a]">
                  {s.firstName} {s.lastName}
                </p>
                <p className="truncate text-xs text-[#94a3b8]">{[s.title, s.company].filter(Boolean).join(" · ") || "—"}</p>
              </div>
              <StatusBadge kind="visibility" value={s.displayPublic} />
            </div>
          )}
        />
      )}
    </div>
  )
}