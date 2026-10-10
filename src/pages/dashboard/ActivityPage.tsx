import { useState } from "react"
import { Link } from "react-router"
import { toast } from "sonner"
import { Activity, Download, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { PageHeader } from "@/components/app/PageHeader"
import { Toolbar, FilterSelect, FilterChips, type ActiveFilter } from "@/components/app/Toolbar"
import { ServerTable, type Column } from "@/components/app/ServerTable"
import { PaginationBar } from "@/components/app/PaginationBar"
import { EmptyState, ErrorState, NoResults } from "@/components/app/States"
import { Avatar } from "@/components/app/Avatar"
import { useApi } from "@/hooks/useApi"
import { useUrlState } from "@/hooks/useUrlState"
import { api, buildQuery, errorMessage } from "@/lib/api"
import { describeActivity } from "@/lib/activityText"
import { formatDate, formatDateTime, formatRelative } from "@/lib/format"
import type { ActivityItem } from "@/types/dashboard"

/** Action filter: the backend matches by prefix, so "event" covers event.create, event.update… */
const ACTION_OPTIONS = [
  { value: "auth.login", label: "Logins" },
  { value: "auth", label: "Account & security" },
  { value: "event", label: "Events" },
  { value: "registration", label: "Registrations" },
  { value: "speaker", label: "Speakers" },
  { value: "sponsor", label: "Sponsors" },
  { value: "session", label: "Schedule" },
  { value: "team", label: "Team" },
  { value: "org", label: "Organization settings" },
  { value: "billing", label: "Billing" },
  { value: "support", label: "Support" },
  { value: "upload", label: "Uploads" },
]

/** Where an entity can be opened (deleted things have no page any more). */
function entityLink(item: ActivityItem): string | null {
  if (!item.entityId || item.action.endsWith(".delete")) return null
  switch (item.entityType) {
    case "Event":
      return `/dashboard/events/${item.entityId}`
    case "Registration":
      return `/dashboard/registrations/${item.entityId}/edit`
    case "Speaker":
      return `/dashboard/speakers/${item.entityId}/edit`
    case "Sponsor":
      return `/dashboard/sponsors/${item.entityId}/edit`
    case "Session":
      return `/dashboard/schedule/${item.entityId}/edit`
    default:
      return null
  }
}

/** A picked calendar day → the exact start / end of that day in the viewer's time zone. */
function dayStart(day: string) {
  return day ? new Date(`${day}T00:00:00`).toISOString() : ""
}
function dayEnd(day: string) {
  return day ? new Date(`${day}T23:59:59.999`).toISOString() : ""
}

interface TeamResponse {
  members: { id: string; name: string; email: string }[]
}

export default function ActivityPage() {
  const { values, set, reset } = useUrlState({ userId: "", action: "", from: "", to: "", page: "1", limit: "20" })
  const page = Number(values.page) || 1
  const limit = Number(values.limit) || 20
  const [exporting, setExporting] = useState(false)

  const badRange = Boolean(values.from && values.to && values.from > values.to)
  const filters = {
    userId: values.userId,
    action: values.action,
    from: dayStart(values.from),
    to: dayEnd(values.to),
  }
  const { data, meta, error, loading, reload } = useApi<ActivityItem[]>(
    badRange ? null : `/activity${buildQuery({ ...filters, page, limit })}`
  )
  const team = useApi<TeamResponse>("/team")
  const members = team.data?.members ?? []

  const rows = data ?? []
  const hasFilters = Boolean(values.userId || values.action || values.from || values.to)

  const chips: ActiveFilter[] = [
    values.userId && {
      key: "userId",
      label: `Person: ${members.find((m) => m.id === values.userId)?.name ?? "Selected person"}`,
      onRemove: () => set({ userId: "" }),
    },
    values.action && {
      key: "action",
      label: `Action: ${ACTION_OPTIONS.find((o) => o.value === values.action)?.label ?? values.action}`,
      onRemove: () => set({ action: "" }),
    },
    values.from && { key: "from", label: `From ${formatDate(dayStart(values.from))}`, onRemove: () => set({ from: "" }) },
    values.to && { key: "to", label: `To ${formatDate(dayStart(values.to))}`, onRemove: () => set({ to: "" }) },
  ].filter(Boolean) as ActiveFilter[]

  async function exportCsv() {
    setExporting(true)
    try {
      await api.download(`/activity/export${buildQuery(filters)}`, "activity-log.csv")
      toast.success(meta && meta.total > 10000 ? "Export downloaded (newest 10,000 entries)" : "Export downloaded")
    } catch (err) {
      toast.error(errorMessage(err, "Export failed."))
    } finally {
      setExporting(false)
    }
  }

  const columns: Column<ActivityItem>[] = [
    {
      key: "who",
      header: "Who",
      cell: (a) => (
        <div className="flex items-center gap-3">
          <Avatar name={a.user?.name ?? "System"} size="sm" />
          <div className="min-w-0">
            <p className="truncate font-medium text-[#0f172a]">{a.user?.name ?? "System"}</p>
            {a.user?.email && <p className="truncate text-xs text-[#94a3b8]">{a.user.email}</p>}
          </div>
        </div>
      ),
    },
    {
      key: "action",
      header: "Action",
      cell: (a) => (
        <div className="min-w-0 max-w-md">
          <p className="text-[#334155]">{describeActivity(a)}</p>
          <code className="text-[11px] text-[#94a3b8]">{a.action}</code>
        </div>
      ),
    },
    {
      key: "entity",
      header: "Entity",
      hideBelow: "md",
      cell: (a) => {
        if (!a.entityType) return <span className="text-[#cbd5e1]">—</span>
        const to = entityLink(a)
        return to ? (
          <Link to={to} className="text-[#7c3aed] hover:underline">
            {a.entityType}
          </Link>
        ) : (
          <span className="text-[#64748b]">{a.entityType}</span>
        )
      },
    },
    {
      key: "when",
      header: "When",
      cell: (a) => (
        <div className="whitespace-nowrap">
          <p className="text-[#334155]">{formatRelative(a.createdAt)}</p>
          <p className="text-xs text-[#94a3b8]">{formatDateTime(a.createdAt)}</p>
        </div>
      ),
    },
    {
      key: "ip",
      header: "IP address",
      hideBelow: "lg",
      cell: (a) => <span className="font-mono text-xs text-[#64748b]">{a.ipAddress || "—"}</span>,
    },
  ]

  return (
    <>
      <PageHeader
        title="Activity log"
        description="Everything that happens in your workspace, newest first."
        breadcrumbs={[{ label: "Dashboard", to: "/dashboard" }, { label: "Activity log" }]}
        actions={
          <Button variant="outline" onClick={exportCsv} disabled={exporting || badRange || (meta?.total ?? 0) === 0}>
            {exporting ? <Loader2 className="animate-spin" /> : <Download />}
            {exporting ? "Exporting…" : "Export CSV"}
          </Button>
        }
      />

      <Toolbar>
        <FilterSelect
          value={values.userId}
          onChange={(userId) => set({ userId })}
          allLabel="Everyone"
          options={members.map((m) => ({ value: m.id, label: m.name }))}
          className="sm:w-48"
        />
        <FilterSelect
          value={values.action}
          onChange={(action) => set({ action })}
          allLabel="All actions"
          options={ACTION_OPTIONS}
          className="sm:w-52"
        />
        <div className="flex items-center gap-2">
          <label className="sr-only" htmlFor="activity-from">
            From date
          </label>
          <Input
            id="activity-from"
            type="date"
            value={values.from}
            max={values.to || undefined}
            onChange={(e) => set({ from: e.target.value })}
            className="h-10 w-40 bg-white"
            aria-invalid={badRange}
          />
          <span className="text-sm text-[#94a3b8]">to</span>
          <label className="sr-only" htmlFor="activity-to">
            To date
          </label>
          <Input
            id="activity-to"
            type="date"
            value={values.to}
            min={values.from || undefined}
            onChange={(e) => set({ to: e.target.value })}
            className="h-10 w-40 bg-white"
            aria-invalid={badRange}
          />
        </div>
      </Toolbar>
      {badRange && <p className="-mt-2 mb-4 text-sm font-medium text-rose-600">The start date must be on or before the end date.</p>}

      <FilterChips filters={chips} onClearAll={() => reset([])} />

      {error ? (
        <ErrorState message={error} onRetry={reload} />
      ) : badRange ? null : !loading && rows.length === 0 ? (
        hasFilters ? (
          <NoResults onClear={() => reset([])} />
        ) : (
          <EmptyState icon={Activity} title="No activity yet" description="Actions like creating events, adding attendees and inviting teammates will be listed here." />
        )
      ) : (
        <>
          <ServerTable columns={columns} rows={rows} rowKey={(a) => a.id} loading={loading} skeletonRows={8} />
          {meta && (
            <PaginationBar
              page={page}
              limit={limit}
              total={meta.total}
              onPageChange={(p) => set({ page: String(p) })}
              onLimitChange={(l) => set({ limit: String(l) })}
            />
          )}
        </>
      )}
    </>
  )
}
