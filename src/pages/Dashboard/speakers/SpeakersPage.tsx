import { useNavigate } from "react-router"
import { CalendarDays, Eye, EyeOff, Linkedin, ListOrdered, Mic2, Pencil, Plus, Trash2, Users } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { PageHeader } from "@/components/app/PageHeader"
import { EventPicker } from "@/components/app/EventPicker"
import { StatsRow } from "@/components/app/StatCard"
import { Toolbar, SearchInput, FilterSelect, FilterChips, ViewToggle, type ActiveFilter } from "@/components/app/Toolbar"
import { ServerTable, type Column } from "@/components/app/ServerTable"
import { CardGrid } from "@/components/app/CardGrid"
import { PaginationBar } from "@/components/app/PaginationBar"
import { RowActions, type RowAction } from "@/components/app/RowActions"
import { StatusBadge } from "@/components/app/StatusBadge"
import { EmptyState, ErrorState, NoResults } from "@/components/app/States"
import { RoleGate } from "@/components/app/RoleGate"
import { Avatar } from "@/components/app/Avatar"
import { useConfirm } from "@/components/app/ConfirmDialog"
import { useApi } from "@/hooks/useApi"
import { useUrlState } from "@/hooks/useUrlState"
import { useSelectedEvent } from "@/hooks/useSelectedEvent"
import { useVisibilityToggle } from "@/hooks/useVisibilityToggle"
import { useCan } from "@/lib/permissions"
import { api, buildQuery, errorMessage } from "@/lib/api"
import { plural } from "@/lib/format"
import { statusOptions } from "@/lib/status"
import type { EventItem, EventStats } from "@/types/event"
import type { Speaker } from "@/types/speaker"

const fullName = (s: Speaker) => `${s.firstName} ${s.lastName}`

export default function SpeakersPage() {
  const navigate = useNavigate()
  const can = useCan()
  const confirm = useConfirm()
  const [eventId, setEventId] = useSelectedEvent()
  const { values, set, reset } = useUrlState({ search: "", visibility: "", page: "1", limit: "24", view: "grid" })
  const page = Number(values.page) || 1
  const limit = Number(values.limit) || 24

  const list = useApi<Speaker[]>(
    eventId ? `/speakers${buildQuery({ eventId, search: values.search, displayPublic: values.visibility, page, limit })}` : null
  )
  const statsQ = useApi<EventStats>(eventId ? `/events/${eventId}/stats` : null)
  const eventQ = useApi<EventItem>(eventId ? `/events/${eventId}` : null)

  const speakers = list.data ?? []
  const total = list.meta?.total ?? 0
  const stats = statsQ.data?.speakers
  const write = can("write") && eventQ.data?.status !== "ARCHIVED"
  const hasFilters = Boolean(values.search || values.visibility)
  const eventQuery = eventId ? `?eventId=${eventId}` : ""

  const refresh = () => {
    list.reload()
    statsQ.reload()
  }
  const toggleVisibility = useVisibilityToggle("speakers", refresh)

  async function remove(s: Speaker) {
    const sessions = s._count?.sessions ?? 0
    const ok = await confirm({
      title: `Remove ${fullName(s)}?`,
      description:
        sessions > 0
          ? `They're assigned to ${plural(sessions, "session")}. Those sessions stay in the schedule without a speaker.`
          : "They'll be removed from this event.",
      confirmLabel: "Remove speaker",
      tone: "danger",
    })
    if (!ok) return
    try {
      await api.delete(`/speakers/${s.id}`)
      toast.success(`${fullName(s)} removed`)
      refresh()
    } catch (err) {
      toast.error(errorMessage(err))
    }
  }

  const actionsFor = (s: Speaker): RowAction[] => [
    { label: "Edit", icon: Pencil, to: `/dashboard/speakers/${s.id}/edit`, hidden: !write },
    {
      label: s.displayPublic ? "Hide from public page" : "Show on public page",
      icon: s.displayPublic ? EyeOff : Eye,
      hidden: !write,
      onClick: () => void toggleVisibility(s, fullName(s)),
    },
    { label: "Remove", icon: Trash2, destructive: true, separatorBefore: true, hidden: !write, onClick: () => void remove(s) },
  ]

  const columns: Column<Speaker>[] = [
    {
      key: "name",
      header: "Speaker",
      cell: (s) => (
        <div className="flex items-center gap-3">
          <Avatar name={fullName(s)} src={s.photo} size="sm" />
          <div className="min-w-0">
            <p className="truncate font-medium text-[#0f172a]">{fullName(s)}</p>
            <p className="truncate text-xs text-[#94a3b8]">{[s.title, s.company].filter(Boolean).join(" · ") || "—"}</p>
          </div>
        </div>
      ),
    },
    { key: "topic", header: "Topic", hideBelow: "md", cell: (s) => <span className="text-sm text-[#475569]">{s.sessionTopic || "—"}</span> },
    { key: "sessions", header: "Sessions", hideBelow: "sm", align: "center", cell: (s) => s._count?.sessions ?? 0 },
    { key: "visibility", header: "Public page", cell: (s) => <StatusBadge kind="visibility" value={s.displayPublic} /> },
    { key: "actions", header: "", align: "right", cell: (s) => <RowActions actions={actionsFor(s)} /> },
  ]

  const chips: ActiveFilter[] = [
    ...(values.search ? [{ key: "search", label: `Search: "${values.search}"`, onRemove: () => set({ search: "" }) }] : []),
    ...(values.visibility ? [{ key: "vis", label: values.visibility === "true" ? "Public only" : "Hidden only", onRemove: () => set({ visibility: "" }) }] : []),
  ]

  return (
    <>
      <PageHeader
        title="Speakers"
        description="The people speaking at your event. Public speakers appear on the event page."
        breadcrumbs={[{ label: "Dashboard", to: "/dashboard" }, { label: "Speakers" }]}
        actions={
          eventId &&
          write && (
            <RoleGate need="write">
              <Button variant="outline" disabled={total < 2} onClick={() => navigate(`/dashboard/speakers/reorder${eventQuery}`)}>
                <ListOrdered /> Reorder
              </Button>
              <Button onClick={() => navigate(`/dashboard/speakers/new${eventQuery}`)}>
                <Plus /> Add speaker
              </Button>
            </RoleGate>
          )
        }
      />

      <EventPicker value={eventId} onChange={setEventId} className="mb-6" />

      {!eventId ? (
        <EmptyState icon={CalendarDays} title="Choose an event" description="Pick an event above to manage its speakers." />
      ) : (
        <>
          <StatsRow
            loading={!stats}
            items={[
              { label: "Speakers", value: stats?.total, icon: Mic2, accent: "purple" },
              { label: "Public", value: stats?.public, icon: Eye, accent: "green", hint: "shown on the event page" },
              { label: "Hidden", value: stats?.hidden, icon: EyeOff, accent: "slate" },
              { label: "With sessions", value: stats?.withSessions, icon: Users, accent: "blue", hint: "assigned in the schedule" },
            ]}
          />

          <Toolbar end={<ViewToggle value={values.view === "table" ? "table" : "grid"} onChange={(view) => set({ view, page: values.page })} />}>
            <SearchInput value={values.search} onChange={(search) => set({ search })} placeholder="Search name, organization, topic…" />
            <FilterSelect
              value={values.visibility}
              onChange={(visibility) => set({ visibility })}
              options={statusOptions("visibility")}
              allLabel="Public & hidden"
            />
          </Toolbar>
          <FilterChips filters={chips} onClearAll={() => reset(["eventId", "view"])} />

          {list.error ? (
            <ErrorState message={list.error} onRetry={list.reload} />
          ) : !list.loading && speakers.length === 0 ? (
            hasFilters ? (
              <NoResults onClear={() => reset(["eventId", "view"])} />
            ) : (
              <EmptyState
                icon={Mic2}
                title="No speakers yet"
                description="Add the people speaking at this event."
                action={
                  write && (
                    <Button onClick={() => navigate(`/dashboard/speakers/new${eventQuery}`)}>
                      <Plus /> Add speaker
                    </Button>
                  )
                }
              />
            )
          ) : values.view === "table" ? (
            <ServerTable
              columns={columns}
              rows={speakers}
              rowKey={(s) => s.id}
              loading={list.loading}
              onRowClick={write ? (s) => navigate(`/dashboard/speakers/${s.id}/edit`) : undefined}
            />
          ) : (
            <CardGrid loading={list.initialLoading}>
              {speakers.map((s) => (
                <article key={s.id} className="flex flex-col rounded-2xl border border-[#e9e4ff] bg-white p-5 shadow-sm">
                  <div className="flex items-start justify-between gap-2">
                    <Avatar name={fullName(s)} src={s.photo} size="lg" />
                    <RowActions actions={actionsFor(s)} />
                  </div>
                  <h3 className="mt-3 font-semibold text-[#0f172a]">{fullName(s)}</h3>
                  <p className="text-sm text-[#64748b]">{[s.title, s.company].filter(Boolean).join(" · ") || "—"}</p>
                  {s.sessionTopic && <p className="mt-2 line-clamp-2 text-sm italic text-[#475569]">“{s.sessionTopic}”</p>}
                  <div className="mt-auto flex flex-wrap items-center gap-2 pt-4">
                    <StatusBadge kind="visibility" value={s.displayPublic} />
                    <span className="text-xs text-[#94a3b8]">{plural(s._count?.sessions ?? 0, "session")}</span>
                    {s.linkedin && (
                      <a href={s.linkedin} target="_blank" rel="noreferrer" className="ml-auto text-[#0a66c2] hover:opacity-80" aria-label="LinkedIn profile">
                        <Linkedin className="h-4 w-4" />
                      </a>
                    )}
                  </div>
                </article>
              ))}
            </CardGrid>
          )}

          <PaginationBar
            page={page}
            limit={limit}
            total={total}
            limitOptions={[12, 24, 48, 96]}
            onPageChange={(p) => set({ page: String(p) })}
            onLimitChange={(n) => set({ limit: String(n) })}
          />
        </>
      )}
    </>
  )
}