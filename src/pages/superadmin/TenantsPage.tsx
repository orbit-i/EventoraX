import { useEffect, useState } from "react"
import { useNavigate } from "react-router"
import { toast } from "sonner"
import { AlertTriangle, Ban, Building2, CalendarPlus, Download, Eye, Layers, LogIn, Plus, RotateCcw, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { PageHeader } from "@/components/app/PageHeader"
import { SegmentedTabs } from "@/components/app/SegmentedTabs"
import { Toolbar, SearchInput, FilterSelect, FilterChips, type ActiveFilter } from "@/components/app/Toolbar"
import { ServerTable, type Column } from "@/components/app/ServerTable"
import { PaginationBar } from "@/components/app/PaginationBar"
import { RowActions, type RowAction } from "@/components/app/RowActions"
import { StatusBadge } from "@/components/app/StatusBadge"
import { EmptyState, ErrorState, NoResults } from "@/components/app/States"
import { useConfirm } from "@/components/app/ConfirmDialog"
import { DateRangeFilter } from "@/components/app/DateRangeFilter"
import { ChangePlanDialog, CreateTenantDialog, DeleteTenantDialog, ExtendDialog, SuspendDialog } from "@/components/superadmin/TenantDialogs"
import { useImpersonate } from "@/components/superadmin/useImpersonate"
import { useApi } from "@/hooks/useApi"
import { useUrlState } from "@/hooks/useUrlState"
import { api, buildQuery, errorMessage } from "@/lib/api"
import { formatDate, formatRelative } from "@/lib/format"
import type { PlanRow, TenantRow, TenantStats } from "@/types/superadmin"

function OrgLogo({ name, logoUrl }: { name: string; logoUrl: string | null }) {
  return logoUrl ? (
    <img src={logoUrl} alt="" className="h-9 w-9 shrink-0 rounded-lg bg-white object-contain ring-1 ring-[#e9e4ff]" />
  ) : (
    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#ede9fe] text-sm font-bold text-[#6d28d9]">{name.charAt(0).toUpperCase()}</div>
  )
}

/** "ends in 3 days" / "ended 2 days ago" for the plan end column. */
function EndsCell({ t }: { t: TenantRow }) {
  const ms = new Date(t.subscriptionEndsAt).getTime() - Date.now()
  const soon = ms > 0 && ms < 7 * 24 * 60 * 60 * 1000
  return (
    <div className="text-xs">
      <p className={soon ? "font-medium text-amber-700" : ms < 0 ? "text-rose-700" : "text-[#334155]"}>{formatDate(t.subscriptionEndsAt)}</p>
      <p className="text-[#94a3b8]">{ms < 0 ? `ended ${formatRelative(t.subscriptionEndsAt)}` : soon ? "ends this week" : t.status === "trial" ? "trial" : "plan"}</p>
    </div>
  )
}

export default function TenantsPage() {
  const navigate = useNavigate()
  const confirm = useConfirm()
  const impersonate = useImpersonate()
  const { values, set, reset } = useUrlState({ status: "", planId: "", search: "", from: "", to: "", sort: "newest", new: "", page: "1", limit: "20" })
  const page = Number(values.page) || 1
  const limit = Number(values.limit) || 20
  const filters = { status: values.status, planId: values.planId, search: values.search, from: values.from, to: values.to }

  const list = useApi<TenantRow[]>(`/superadmin/tenants${buildQuery({ ...filters, sort: values.sort, page, limit })}`)
  const statsQ = useApi<TenantStats>("/superadmin/tenants/stats")
  const plansQ = useApi<PlanRow[]>("/superadmin/plans")
  const plans = plansQ.data ?? []

  const [createOpen, setCreateOpen] = useState(false)
  const [planFor, setPlanFor] = useState<TenantRow | null>(null)
  const [extendFor, setExtendFor] = useState<TenantRow | null>(null)
  const [suspendFor, setSuspendFor] = useState<TenantRow | null>(null)
  const [deleteFor, setDeleteFor] = useState<TenantRow | null>(null)
  const [exporting, setExporting] = useState(false)

  // "Add tenant" quick action on the dashboard links here with ?new=1
  useEffect(() => {
    if (values.new === "1") {
      setCreateOpen(true)
      set({ new: "" })
    }
  }, [values.new, set])

  const tenants = list.data ?? []
  const stats = statsQ.data
  const hasFilters = Boolean(values.search || values.planId || values.from || values.to)

  function refresh() {
    list.reload()
    statsQ.reload()
  }

  async function unsuspend(t: TenantRow) {
    const ok = await confirm({
      title: `Reactivate ${t.name}?`,
      description: "Its team can log in and use EventoraX again straight away.",
      confirmLabel: "Reactivate",
    })
    if (!ok) return
    try {
      await api.post(`/superadmin/tenants/${t.id}/unsuspend`)
      toast.success(`${t.name} is active again`, {
        action: { label: "Undo", onClick: () => setSuspendFor(t) },
      })
      refresh()
    } catch (err) {
      toast.error(errorMessage(err))
    }
  }

  async function exportCsv() {
    setExporting(true)
    try {
      await api.download(`/superadmin/tenants/export${buildQuery(filters)}`, "tenants.csv")
    } catch (err) {
      toast.error(errorMessage(err, "Export failed."))
    } finally {
      setExporting(false)
    }
  }

  const actionsFor = (t: TenantRow): RowAction[] => [
    { label: "View details", icon: Eye, to: `/superadmin/tenants/${t.id}` },
    { label: "Log in as admin", icon: LogIn, onClick: () => void impersonate(t) },
    { label: "Change plan", icon: Layers, separatorBefore: true, onClick: () => setPlanFor(t) },
    { label: t.status === "trial" ? "Extend trial" : "Extend plan", icon: CalendarPlus, onClick: () => setExtendFor(t) },
    { label: "Suspend", icon: Ban, hidden: t.status === "suspended", onClick: () => setSuspendFor(t) },
    { label: "Reactivate", icon: RotateCcw, hidden: t.status !== "suspended", onClick: () => void unsuspend(t) },
    { label: "Delete…", icon: Trash2, destructive: true, separatorBefore: true, onClick: () => setDeleteFor(t) },
  ]

  const columns: Column<TenantRow>[] = [
    {
      key: "org",
      header: "Organization",
      cell: (t) => (
        <div className="flex min-w-0 items-center gap-3">
          <OrgLogo name={t.name} logoUrl={t.logoUrl} />
          <div className="min-w-0">
            <p className="truncate font-medium text-[#0f172a]">{t.name}</p>
            <p className="truncate text-xs text-[#94a3b8]">{t.email ?? t.slug}</p>
          </div>
        </div>
      ),
    },
    { key: "plan", header: "Plan", hideBelow: "sm", cell: (t) => <span className="text-[#475569]">{t.plan?.name ?? "—"}</span> },
    { key: "status", header: "Status", cell: (t) => <StatusBadge kind="org" value={t.status} /> },
    { key: "ends", header: "Ends", hideBelow: "md", cell: (t) => <EndsCell t={t} /> },
    {
      key: "usage",
      header: "Team · events",
      hideBelow: "lg",
      cell: (t) => (
        <span className="text-xs text-[#64748b]">
          {t._count.users} people · {t._count.events} events
        </span>
      ),
    },
    { key: "created", header: "Created", hideBelow: "lg", cell: (t) => <span className="text-xs text-[#64748b]">{formatDate(t.createdAt)}</span> },
    { key: "actions", header: "", align: "right", cell: (t) => <RowActions actions={actionsFor(t)} label={`Actions for ${t.name}`} /> },
  ]

  const chips: ActiveFilter[] = [
    values.search && { key: "search", label: `Search: "${values.search}"`, onRemove: () => set({ search: "" }) },
    values.planId && {
      key: "planId",
      label: `Plan: ${values.planId === "none" ? "No plan" : plans.find((p) => p.id === values.planId)?.name ?? "…"}`,
      onRemove: () => set({ planId: "" }),
    },
    values.from && { key: "from", label: `Created from ${formatDate(values.from)}`, onRemove: () => set({ from: "" }) },
    values.to && { key: "to", label: `Created until ${formatDate(values.to)}`, onRemove: () => set({ to: "" }) },
  ].filter(Boolean) as ActiveFilter[]

  return (
    <>
      <PageHeader
        title="Tenants"
        description="Every organization using EventoraX — plans, trials, suspensions and drill-down."
        breadcrumbs={[{ label: "Superadmin", to: "/superadmin" }, { label: "Tenants" }]}
        actions={
          <>
            <Button variant="outline" onClick={() => void exportCsv()} disabled={exporting}>
              <Download /> Export CSV
            </Button>
            <Button onClick={() => setCreateOpen(true)} disabled={plansQ.initialLoading}>
              <Plus /> Add tenant
            </Button>
          </>
        }
      />

      <SegmentedTabs
        value={values.status}
        onChange={(status) => set({ status })}
        options={[
          { value: "", label: "All", count: stats?.total },
          { value: "active", label: "Active", count: stats?.active },
          { value: "trial", label: "Trial", count: stats?.trial },
          { value: "expired", label: "Expired", count: stats?.expired },
          { value: "suspended", label: "Suspended", count: stats?.suspended },
        ]}
      />

      <Toolbar
        end={
          <FilterSelect
            value={values.sort === "newest" ? "" : values.sort}
            onChange={(sort) => set({ sort: sort || "newest" })}
            allLabel="Newest first"
            options={[
              { value: "oldest", label: "Oldest first" },
              { value: "name", label: "Name A–Z" },
              { value: "ending", label: "Ending soonest" },
            ]}
          />
        }
      >
        <SearchInput value={values.search} onChange={(v) => set({ search: v })} placeholder="Search name, slug or any member's email…" />
        <FilterSelect
          value={values.planId}
          onChange={(planId) => set({ planId })}
          allLabel="All plans"
          options={[...plans.map((p) => ({ value: p.id, label: p.name })), { value: "none", label: "No plan" }]}
        />
        <DateRangeFilter id="tenants-created" from={values.from} to={values.to} onChange={set} />
      </Toolbar>
      <FilterChips filters={chips} onClearAll={() => reset(values.status ? ["status"] : [])} />

      {list.error ? (
        <ErrorState message={list.error} onRetry={list.reload} />
      ) : !list.loading && tenants.length === 0 ? (
        hasFilters || values.status ? (
          <NoResults onClear={() => reset([])} />
        ) : (
          <EmptyState
            icon={Building2}
            title="No organizations yet"
            description="Organizations appear here when they sign up for a trial, or when you add one."
            action={
              <Button onClick={() => setCreateOpen(true)}>
                <Plus /> Add tenant
              </Button>
            }
          />
        )
      ) : (
        <>
          <ServerTable columns={columns} rows={tenants} rowKey={(t) => t.id} loading={list.loading} onRowClick={(t) => navigate(`/superadmin/tenants/${t.id}`)} />
          {list.meta && (
            <PaginationBar page={page} limit={limit} total={list.meta.total} onPageChange={(p) => set({ page: String(p) })} onLimitChange={(l) => set({ limit: String(l) })} />
          )}
        </>
      )}

      {stats && stats.expired + stats.suspended > 0 && !values.status && (
        <p className="mt-4 flex items-center gap-1.5 text-xs text-[#94a3b8]">
          <AlertTriangle className="h-3.5 w-3.5" />
          Expired organizations keep all their data — they can still log in to renew.
        </p>
      )}

      <CreateTenantDialog open={createOpen} onOpenChange={setCreateOpen} plans={plans} onCreated={(id) => navigate(`/superadmin/tenants/${id}`)} />
      <ChangePlanDialog tenant={planFor} plans={plans} onOpenChange={(o) => !o && setPlanFor(null)} onDone={refresh} />
      <ExtendDialog tenant={extendFor} onOpenChange={(o) => !o && setExtendFor(null)} onDone={refresh} />
      <SuspendDialog tenant={suspendFor} onOpenChange={(o) => !o && setSuspendFor(null)} onDone={refresh} />
      <DeleteTenantDialog tenant={deleteFor} onOpenChange={(o) => !o && setDeleteFor(null)} onDone={refresh} />
    </>
  )
}
