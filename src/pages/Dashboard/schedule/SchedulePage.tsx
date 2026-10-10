import { useMemo } from "react"
import { useNavigate } from "react-router"
import { AlertTriangle, CalendarDays, Clock, Eye, EyeOff, ListOrdered, MapPin, Mic2, Pencil, Plus, Timer, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { PageHeader } from "@/components/app/PageHeader"
import { EventPicker } from "@/components/app/EventPicker"
import { StatsRow } from "@/components/app/StatCard"
import { Toolbar, SearchInput, FilterSelect, FilterChips, type ActiveFilter } from "@/components/app/Toolbar"
import { RowActions, type RowAction } from "@/components/app/RowActions"
import { StatusBadge } from "@/components/app/StatusBadge"
import { EmptyState, ErrorState, NoResults } from "@/components/app/States"
import { Avatar } from "@/components/app/Avatar"
import { useConfirm } from "@/components/app/ConfirmDialog"
import { useApi } from "@/hooks/useApi"
import { useUrlState } from "@/hooks/useUrlState"
import { useSelectedEvent } from "@/hooks/useSelectedEvent"
import { useVisibilityToggle } from "@/hooks/useVisibilityToggle"
import { useCan } from "@/lib/permissions"
import { api, buildQuery, errorMessage } from "@/lib/api"
import { formatDuration, formatTime, plural } from "@/lib/format"
import { statusOptions } from "@/lib/status"
import type { EventItem, EventStats } from "@/types/event"
import type { Session } from "@/types/session"

const dayKey = (iso: string) => new Date(iso).toLocaleDateString("en-CA") // YYYY-MM-DD in local time
const dayLabel = (iso: string) => new Date(iso).toLocaleDateString("en-PK", { weekday: "long", day: "numeric", month: "long" })
const minutes = (s: Session) => (new Date(s.endTime).getTime() - new Date(s.startTime).getTime()) / 60000

/** Sessions in the same room whose times overlap. */
function findClashes(sessions: Session[]): Set<string> {
  const clashes = new Set<string>()
  for (let i = 0; i < sessions.length; i++) {
    for (let j = i + 1; j < sessions.length; j++) {
      const a = sessions[i]!
      const b = sessions[j]!
      if (!a.location || (a.location ?? "").toLowerCase() !== (b.location ?? "").toLowerCase()) continue
      if (new Date(a.startTime) < new Date(b.endTime) && new Date(b.startTime) < new Date(a.endTime)) {
        clashes.add(a.id)
        clashes.add(b.id)
      }
    }
  }
  return clashes
}

export default function SchedulePage() {
  const navigate = useNavigate()
  const can = useCan()
  const confirm = useConfirm()
  const [eventId, setEventId] = useSelectedEvent()
  const { values, set, reset } = useUrlState({ search: "", visibility: "" })

  // An agenda needs every session, so load them all (one event rarely has more than a few dozen).
  const list = useApi<Session[]>(eventId ? `/sessions${buildQuery({ eventId, search: values.search, displayPublic: values.visibility, limit: 500 })}` : null)
  const statsQ = useApi<EventStats>(eventId ? `/events/${eventId}/stats` : null)
  const eventQ = useApi<EventItem>(eventId ? `/events/${eventId}` : null)

  const sessions = list.data ?? []
  const stats = statsQ.data?.sessions
  const write = can("write") && eventQ.data?.status !== "ARCHIVED"
  const hasFilters = Boolean(values.search || values.visibility)
  const eventQuery = eventId ? `?eventId=${eventId}` : ""

  const refresh = () => {
    list.reload()
    statsQ.reload()
  }
  const toggleVisibility = useVisibilityToggle("sessions", refresh)

  const clashes = useMemo(() => findClashes(sessions), [sessions])
  const days = useMemo(() => {
    const groups = new Map<string, Session[]>()
    for (const s of [...sessions].sort((a, b) => a.startTime.localeCompare(b.startTime) || a.displayOrder - b.displayOrder)) {
      const key = dayKey(s.startTime)
      groups.set(key, [...(groups.get(key) ?? []), s])
    }
    return [...groups.entries()]
  }, [sessions])

  async function remove(s: Session) {
    const ok = await confirm({ title: `Delete "${s.title}"?`, description: "It will be removed from the schedule.", confirmLabel: "Delete session", tone: "danger" })
    if (!ok) return
    try {
      await api.delete(`/sessions/${s.id}`)
      toast.success("Session deleted")
      refresh()
    } catch (err) {
      toast.error(errorMessage(err))
    }
  }

  const actionsFor = (s: Session): RowAction[] => [
    { label: "Edit", icon: Pencil, to: `/dashboard/schedule/${s.id}/edit`, hidden: !write },
    {
      label: s.displayPublic ? "Hide from public agenda" : "Show on public agenda",
      icon: s.displayPublic ? EyeOff : Eye,
      hidden: !write,
      onClick: () => void toggleVisibility(s, `"${s.title}"`),
    },
    { label: "Delete", icon: Trash2, destructive: true, separatorBefore: true, hidden: !write, onClick: () => void remove(s) },
  ]

  const chips: ActiveFilter[] = [
    ...(values.search ? [{ key: "search", label: `Search: "${values.search}"`, onRemove: () => set({ search: "" }) }] : []),
    ...(values.visibility ? [{ key: "vis", label: values.visibility === "true" ? "Public only" : "Hidden only", onRemove: () => set({ visibility: "" }) }] : []),
  ]

  return (
    <>
      <PageHeader
        title="Schedule"
        description="The event's agenda, grouped by day."
        breadcrumbs={[{ label: "Dashboard", to: "/dashboard" }, { label: "Schedule" }]}
        actions={
          eventId &&
          write && (
            <>
              <Button variant="outline" disabled={(stats?.total ?? 0) < 2} onClick={() => navigate(`/dashboard/schedule/reorder${eventQuery}`)}>
                <ListOrdered /> Reorder
              </Button>
              <Button onClick={() => navigate(`/dashboard/schedule/new${eventQuery}`)}>
                <Plus /> Add session
              </Button>
            </>
          )
        }
      />

      <EventPicker value={eventId} onChange={setEventId} className="mb-6" />

      {!eventId ? (
        <EmptyState icon={CalendarDays} title="Choose an event" description="Pick an event above to build its agenda." />
      ) : (
        <>
          <StatsRow
            loading={!stats}
            items={[
              { label: "Sessions", value: stats?.total, icon: ListOrdered, accent: "purple" },
              { label: "With a speaker", value: stats?.withSpeaker, icon: Mic2, accent: "blue" },
              { label: "Public", value: stats?.public, icon: Eye, accent: "green", hint: "on the public agenda" },
              { label: "Total time", value: stats ? formatDuration(stats.totalMinutes) : undefined, icon: Timer, accent: "amber" },
            ]}
          />

          <Toolbar>
            <SearchInput value={values.search} onChange={(search) => set({ search })} placeholder="Search title or room…" />
            <FilterSelect value={values.visibility} onChange={(visibility) => set({ visibility })} options={statusOptions("visibility")} allLabel="Public & hidden" />
          </Toolbar>
          <FilterChips filters={chips} onClearAll={() => reset(["eventId"])} />

          {clashes.size > 0 && (
            <div className="mb-4 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              {plural(clashes.size, "session")} share a room at overlapping times. They're marked below.
            </div>
          )}

          {list.error ? (
            <ErrorState message={list.error} onRetry={list.reload} />
          ) : list.initialLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }, (_, i) => (
                <Skeleton key={i} className="h-20 rounded-2xl" />
              ))}
            </div>
          ) : sessions.length === 0 ? (
            hasFilters ? (
              <NoResults onClear={() => reset(["eventId"])} />
            ) : (
              <EmptyState
                icon={ListOrdered}
                title="No sessions yet"
                description="Build the agenda: talks, workshops, breaks."
                action={
                  write && (
                    <Button onClick={() => navigate(`/dashboard/schedule/new${eventQuery}`)}>
                      <Plus /> Add session
                    </Button>
                  )
                }
              />
            )
          ) : (
            <div className={cn("space-y-8", list.loading && "opacity-60")}>
              {days.map(([key, daySessions]) => (
                <section key={key}>
                  <h2 className="mb-3 flex items-baseline gap-3 text-base font-semibold text-[#0f172a]">
                    {dayLabel(daySessions[0]!.startTime)}
                    <span className="text-xs font-normal text-[#94a3b8]">
                      {plural(daySessions.length, "session")} · {formatDuration(daySessions.reduce((sum, s) => sum + minutes(s), 0))}
                    </span>
                  </h2>
                  <ol className="relative space-y-3 border-l-2 border-[#ede9fe] pl-6">
                    {daySessions.map((s) => (
                      <li key={s.id} className="relative">
                        <span className="absolute -left-[31px] top-5 h-3 w-3 rounded-full border-2 border-white bg-[#7c3aed] ring-2 ring-[#ede9fe]" />
                        <article
                          onClick={write ? () => navigate(`/dashboard/schedule/${s.id}/edit`) : undefined}
                          className={cn(
                            "flex flex-wrap items-center gap-4 rounded-2xl border bg-white p-4 shadow-sm transition-colors",
                            write && "cursor-pointer hover:border-[#c4b5fd]",
                            clashes.has(s.id) ? "border-amber-300" : "border-[#e9e4ff]"
                          )}
                        >
                          <div className="w-28 shrink-0">
                            <p className="flex items-center gap-1 text-sm font-semibold text-[#7c3aed]">
                              <Clock className="h-3.5 w-3.5" /> {formatTime(s.startTime)}
                            </p>
                            <p className="text-xs text-[#94a3b8]">
                              to {formatTime(s.endTime)} · {formatDuration(minutes(s))}
                            </p>
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="font-medium text-[#0f172a]">{s.title}</p>
                            <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[#64748b]">
                              {s.speaker && (
                                <span className="flex items-center gap-1.5">
                                  <Avatar name={`${s.speaker.firstName} ${s.speaker.lastName}`} src={s.speaker.photo} size="sm" className="h-5 w-5 text-[9px]" />
                                  {s.speaker.firstName} {s.speaker.lastName}
                                </span>
                              )}
                              {s.location && (
                                <span className="flex items-center gap-1">
                                  <MapPin className="h-3.5 w-3.5" /> {s.location}
                                </span>
                              )}
                              {clashes.has(s.id) && (
                                <span className="flex items-center gap-1 font-medium text-amber-700">
                                  <AlertTriangle className="h-3.5 w-3.5" /> Room overlap
                                </span>
                              )}
                            </div>
                          </div>
                          <StatusBadge kind="visibility" value={s.displayPublic} />
                          <div onClick={(e) => e.stopPropagation()}>
                            <RowActions actions={actionsFor(s)} />
                          </div>
                        </article>
                      </li>
                    ))}
                  </ol>
                </section>
              ))}
            </div>
          )}
        </>
      )}
    </>
  )
}