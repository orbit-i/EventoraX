import { useNavigate } from "react-router"
import {
  Archive,
  CalendarCheck,
  CalendarClock,
  CalendarDays,
  Copy,
  Eye,
  FilePen,
  Pencil,
  Plus,
  RotateCcw,
  Radio,
  Trash2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { PageHeader } from "@/components/app/PageHeader"
import { StatsRow } from "@/components/app/StatCard"
import { SegmentedTabs } from "@/components/app/SegmentedTabs"
import { Toolbar, SearchInput, FilterSelect, FilterChips, ViewToggle, type ActiveFilter } from "@/components/app/Toolbar"
import { ServerTable, type Column } from "@/components/app/ServerTable"
import { CardGrid } from "@/components/app/CardGrid"
import { PaginationBar } from "@/components/app/PaginationBar"
import { RowActions, type RowAction } from "@/components/app/RowActions"
import { StatusBadge } from "@/components/app/StatusBadge"
import { EmptyState, ErrorState, NoResults } from "@/components/app/States"
import { RoleGate } from "@/components/app/RoleGate"
import { EventCard } from "@/components/events/EventCard"
import { CapacityBar } from "@/components/events/CapacityBar"
import { useEventActions } from "@/components/events/useEventActions"
import { useApi } from "@/hooks/useApi"
import { useUrlState } from "@/hooks/useUrlState"
import { useCan } from "@/lib/permissions"
import { buildQuery } from "@/lib/api"
import { formatDate, formatTime } from "@/lib/format"
import { statusLabel, statusOptions } from "@/lib/status"
import type { EventItem, EventsOverview } from "@/types/event"

export default function EventsPage() {
  const navigate = useNavigate()
  const can = useCan()
  const actions = useEventActions()

  const { values, set, reset } = useUrlState({
    status: "",
    mode: "",
    search: "",
    from: "",
    to: "",
    page: "1",
    limit: "20",
    view: "table",
  })
  const page = Number(values.page) || 1
  const limit = Number(values.limit) || 20

  const overview = useApi<EventsOverview>("/events/stats")
  const list = useApi<EventItem[]>(
    `/events${buildQuery({
      status: values.status,
      mode: values.mode,
      search: values.search,
      from: values.from,
      to: values.to,
      page,
      limit,
    })}`
  )

  const events = list.data ?? []
  const total = list.meta?.total ?? 0
  const byStatus = overview.data?.byStatus
  const hasFilters = Boolean(values.search || values.mode || values.from || values.to)
  const nothingAtAll = !list.initialLoading && !overview.loading && (overview.data?.total ?? 0) === 0

  const refresh = () => {
    list.reload()
    overview.reload()
  }

  function rowActions(event: EventItem): RowAction[] {
    const write = can("write")
    const archived = event.status === "ARCHIVED"
    return [
      { label: "Open", icon: Eye, to: `/dashboard/events/${event.id}` },
      { label: "Edit", icon: Pencil, to: `/dashboard/events/${event.id}/edit`, hidden: !write },
      {
        label: "Duplicate",
        icon: Copy,
        hidden: !write,
        onClick: async () => {
          if (await actions.duplicate(event)) refresh()
        },
      },
      {
        label: "Archive",
        icon: Archive,
        hidden: !write || archived,
        separatorBefore: true,
        onClick: async () => {
          if (await actions.archive(event)) refresh()
        },
      },
      {
        label: "Restore",
        icon: RotateCcw,
        hidden: !write || !archived,
        separatorBefore: true,
        onClick: async () => {
          if (await actions.restore(event)) refresh()
        },
      },
      {
        label: "Delete",
        icon: Trash2,
        destructive: true,
        hidden: !write,
        onClick: async () => {
          if (await actions.remove(event)) refresh()
        },
      },
    ]
  }

  const columns: Column<EventItem>[] = [
    {
      key: "title",
      header: "Event",
      cell: (e) => (
        <div className="min-w-0">
          <p className="truncate font-medium text-[#0f172a]">{e.title}</p>
          <p className="truncate text-xs text-[#94a3b8]">
            {e.mode === "ONLINE" ? "Online" : e.location || "Venue to be announced"}
            {e.topic ? ` · ${e.topic}` : ""}
          </p>
        </div>
      ),
    },
    {
      key: "date",
      header: "Date",
      hideBelow: "md",
      cell: (e) => (
        <div className="whitespace-nowrap">
          <p className="text-sm text-[#0f172a]">{formatDate(e.startDateTime)}</p>
          <p className="text-xs text-[#94a3b8]">
            {formatTime(e.startDateTime)} – {formatTime(e.endDateTime)}
          </p>
        </div>
      ),
    },
    { key: "mode", header: "Mode", hideBelow: "lg", cell: (e) => <StatusBadge kind="mode" value={e.mode} /> },
    { key: "status", header: "Status", cell: (e) => <StatusBadge kind="event" value={e.status} /> },
    {
      key: "registrations",
      header: "Registrations",
      hideBelow: "sm",
      cell: (e) => <CapacityBar registered={e._count?.registrations ?? 0} max={e.maxAttendees} compact />,
    },
    { key: "actions", header: "", align: "right", cell: (e) => <RowActions actions={rowActions(e)} /> },
  ]

  const chips: ActiveFilter[] = [
    ...(values.search ? [{ key: "search", label: `Search: "${values.search}"`, onRemove: () => set({ search: "" }) }] : []),
    ...(values.mode ? [{ key: "mode", label: `Mode: ${statusLabel("mode", values.mode)}`, onRemove: () => set({ mode: "" }) }] : []),
    ...(values.from ? [{ key: "from", label: `From ${formatDate(values.from)}`, onRemove: () => set({ from: "" }) }] : []),
    ...(values.to ? [{ key: "to", label: `Until ${formatDate(values.to)}`, onRemove: () => set({ to: "" }) }] : []),
  ]

  const newEventButton = (
    <RoleGate need="write">
      <Button onClick={() => navigate("/dashboard/events/new")}>
        <Plus /> New event
      </Button>
    </RoleGate>
  )

  return (
    <>
      <PageHeader
        title="Events"
        description="Create and manage your organization's events."
        breadcrumbs={[{ label: "Dashboard", to: "/dashboard" }, { label: "Events" }]}
        actions={newEventButton}
      />

      <StatsRow
        loading={overview.loading && !overview.data}
        items={[
          { label: "Upcoming", value: byStatus?.PUBLISHED, icon: CalendarClock, accent: "blue" },
          { label: "Active now", value: byStatus?.ONGOING, icon: Radio, accent: "green" },
          { label: "Drafts", value: byStatus?.DRAFT, icon: FilePen, accent: "slate" },
          {
            label: "Completed",
            value: byStatus?.COMPLETED,
            icon: CalendarCheck,
            accent: "purple",
            hint: byStatus?.ARCHIVED ? `${byStatus.ARCHIVED} archived` : undefined,
          },
        ]}
      />

      {nothingAtAll ? (
        <EmptyState
          icon={CalendarDays}
          title="No events yet"
          description="Create your first event to start taking registrations, adding speakers and issuing certificates."
          action={newEventButton}
        />
      ) : (
        <>
          <SegmentedTabs
            value={values.status}
            onChange={(status) => set({ status })}
            options={[
              { value: "", label: "All active", count: overview.data?.active },
              ...statusOptions("event").map((o) => ({
                ...o,
                count: byStatus?.[o.value as keyof typeof byStatus],
              })),
            ]}
          />

          <Toolbar end={<ViewToggle value={values.view === "grid" ? "grid" : "table"} onChange={(view) => set({ view, page: values.page })} />}>
            <SearchInput value={values.search} onChange={(search) => set({ search })} placeholder="Search title, topic, venue…" />
            <FilterSelect value={values.mode} onChange={(mode) => set({ mode })} options={statusOptions("mode")} allLabel="All modes" />
            <div className="flex items-center gap-2 text-sm text-[#64748b]">
              <Input
                type="date"
                value={values.from}
                onChange={(e) => set({ from: e.target.value })}
                className="h-10 w-[150px] bg-white"
                aria-label="From date"
              />
              <span>to</span>
              <Input
                type="date"
                value={values.to}
                min={values.from || undefined}
                onChange={(e) => set({ to: e.target.value })}
                className="h-10 w-[150px] bg-white"
                aria-label="To date"
              />
            </div>
          </Toolbar>

          <FilterChips filters={chips} onClearAll={() => reset(["status", "view"])} />

          {list.error ? (
            <ErrorState message={list.error} onRetry={list.reload} />
          ) : !list.loading && events.length === 0 ? (
            hasFilters ? (
              <NoResults onClear={() => reset(["status", "view"])} />
            ) : (
              <EmptyState
                icon={CalendarDays}
                title={`No ${values.status ? statusLabel("event", values.status).toLowerCase() : ""} events`}
                description="Events with this status will appear here."
                compact
              />
            )
          ) : values.view === "grid" ? (
            <CardGrid loading={list.initialLoading}>
              {events.map((e) => (
                <EventCard
                  key={e.id}
                  event={e}
                  onOpen={() => navigate(`/dashboard/events/${e.id}`)}
                  actions={<RowActions actions={rowActions(e)} />}
                />
              ))}
            </CardGrid>
          ) : (
            <ServerTable
              columns={columns}
              rows={events}
              rowKey={(e) => e.id}
              loading={list.loading}
              onRowClick={(e) => navigate(`/dashboard/events/${e.id}`)}
            />
          )}

          <PaginationBar
            page={page}
            limit={limit}
            total={total}
            onPageChange={(p) => set({ page: String(p) })}
            onLimitChange={(n) => set({ limit: String(n) })}
          />
        </>
      )}
    </>
  )
}