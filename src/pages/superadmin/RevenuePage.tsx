import { useState } from "react"
import { Link } from "react-router"
import { toast } from "sonner"
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import { AlertTriangle, CheckCircle2, Clock, Download, Eye, Mail, Receipt, Wallet, XCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { PageHeader } from "@/components/app/PageHeader"
import { StatsRow } from "@/components/app/StatCard"
import { Panel } from "@/components/app/Panel"
import { SegmentedTabs } from "@/components/app/SegmentedTabs"
import { Toolbar, SearchInput, FilterSelect, FilterChips, type ActiveFilter } from "@/components/app/Toolbar"
import { DateRangeFilter } from "@/components/app/DateRangeFilter"
import { ServerTable, type Column } from "@/components/app/ServerTable"
import { PaginationBar } from "@/components/app/PaginationBar"
import { RowActions } from "@/components/app/RowActions"
import { StatusBadge } from "@/components/app/StatusBadge"
import { EmptyState, ErrorState, NoResults } from "@/components/app/States"
import { METHOD_LABEL } from "@/components/billing/paymentInfo"
import { PaymentReviewDialog } from "@/components/superadmin/PaymentReviewDialog"
import { useApi } from "@/hooks/useApi"
import { useUrlState } from "@/hooks/useUrlState"
import { api, buildQuery, errorMessage } from "@/lib/api"
import { formatDate, formatMoney, formatMonth, formatRelative, plural } from "@/lib/format"
import type { PaymentStats, PlanRow, PlatformPayment, RevenueOverview, TenantDetail } from "@/types/superadmin"

const AXIS_TICK = { fontSize: 12, fill: "#94a3b8" }
const PIE_COLORS = ["#7c3aed", "#2a78d6", "#1baf7a", "#eda100", "#e87ba4", "#64748b"]
const compact = (n: number) => (n >= 1000 ? `${Math.round(n / 1000)}k` : String(n))

function Charts({ data, loading }: { data: RevenueOverview | null; loading: boolean }) {
  const months = (data?.monthly ?? []).map((m) => ({ month: formatMonth(m.month), full: formatMonth(m.month, true), amount: m.amount }))
  const total12 = months.reduce((s, m) => s + m.amount, 0)
  const planTotal = (data?.byPlan ?? []).reduce((s, p) => s + p.amount, 0)
  const maxMethod = Math.max(1, ...(data?.byMethod ?? []).map((m) => m.amount))

  return (
    <div className="mb-6 grid gap-6 lg:grid-cols-3">
      <Panel title="Revenue by month" description={data ? `${formatMoney(total12)} in the last 12 months` : undefined} className="lg:col-span-2">
        {loading ? (
          <Skeleton className="h-60 rounded-xl" />
        ) : total12 === 0 ? (
          <div className="flex h-60 items-center justify-center text-sm text-[#94a3b8]">No confirmed payments in the last 12 months.</div>
        ) : (
          <div className="h-60">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={months} margin={{ top: 5, right: 5, left: -10, bottom: 0 }} barCategoryGap="25%">
                <CartesianGrid stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="month" tick={AXIS_TICK} axisLine={false} tickLine={false} />
                <YAxis tickFormatter={compact} tick={AXIS_TICK} axisLine={false} tickLine={false} />
                <Tooltip
                  cursor={{ fill: "#f5f3ff" }}
                  contentStyle={{ borderRadius: 12, border: "1px solid #e9e4ff", fontSize: 13 }}
                  labelFormatter={(_, payload) => payload?.[0]?.payload?.full ?? ""}
                  formatter={(value) => formatMoney(Number(value))}
                />
                <Bar dataKey="amount" name="Revenue" fill="#7c3aed" radius={[4, 4, 0, 0]} maxBarSize={28} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </Panel>

      <Panel title="By plan" description="All-time confirmed revenue">
        {loading ? (
          <Skeleton className="h-60 rounded-xl" />
        ) : planTotal === 0 ? (
          <div className="flex h-60 items-center justify-center text-sm text-[#94a3b8]">Nothing yet.</div>
        ) : (
          <>
            <div className="h-40">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={data!.byPlan} dataKey="amount" nameKey="plan" innerRadius={42} outerRadius={70} paddingAngle={data!.byPlan.length > 1 ? 2 : 0} stroke="none">
                    {data!.byPlan.map((p, i) => (
                      <Cell key={p.plan} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #e9e4ff", fontSize: 13 }} formatter={(value) => formatMoney(Number(value))} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <ul className="mt-3 space-y-1.5 text-sm">
              {data!.byPlan.map((p, i) => (
                <li key={p.plan} className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }} />
                  <span className="flex-1 text-[#334155]">
                    {p.plan} <span className="text-xs text-[#94a3b8]">· {plural(p.count, "payment")}</span>
                  </span>
                  <span className="font-medium tabular-nums text-[#0f172a]">{Math.round((p.amount / planTotal) * 100)}%</span>
                </li>
              ))}
            </ul>
            {data!.byMethod.length > 0 && (
              <div className="mt-4 space-y-2 border-t border-[#f1f5f9] pt-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-[#94a3b8]">By method</p>
                {data!.byMethod.map((m) => (
                  <div key={m.method} className="text-xs">
                    <div className="flex justify-between text-[#475569]">
                      <span>{METHOD_LABEL[m.method as keyof typeof METHOD_LABEL] ?? m.method}</span>
                      <span className="tabular-nums">{formatMoney(m.amount)}</span>
                    </div>
                    <div className="mt-1 h-1.5 rounded-full bg-[#f1f5f9]">
                      <div className="h-1.5 rounded-full bg-[#7c3aed]" style={{ width: `${(m.amount / maxMethod) * 100}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </Panel>
    </div>
  )
}

function Outstanding({ data, loading }: { data: RevenueOverview | null; loading: boolean }) {
  if (loading) return <Skeleton className="h-60 rounded-2xl" />
  const rows = data?.outstanding ?? []
  if (rows.length === 0) {
    return <EmptyState icon={CheckCircle2} title="Nothing outstanding" description="No organization has run out or will run out in the next 14 days without a payment on the way." />
  }
  return (
    <Panel title="Outstanding" description="Expired, or ending within 14 days — and no payment submitted yet. Reach out before they lose access.">
      <ul className="divide-y divide-[#f1f5f9]">
        {rows.map((o) => {
          const ended = new Date(o.subscriptionEndsAt).getTime() < Date.now()
          return (
            <li key={o.id} className="flex flex-wrap items-center gap-3 py-3">
              <div className="min-w-0 flex-1">
                <Link to={`/superadmin/tenants/${o.id}`} className="font-medium text-[#0f172a] hover:text-[#7c3aed] hover:underline">
                  {o.name}
                </Link>
                <p className="text-xs text-[#94a3b8]">
                  {o.plan ? `${o.plan.name} · ${formatMoney(o.plan.price)}/yr` : "No plan"} · {ended ? `ended ${formatRelative(o.subscriptionEndsAt)}` : `ends ${formatDate(o.subscriptionEndsAt)}`}
                </p>
              </div>
              <StatusBadge kind="org" value={o.status} />
              {o.email && (
                <Button asChild size="sm" variant="outline">
                  <a href={`mailto:${o.email}?subject=${encodeURIComponent("Your EventoraX plan")}`}>
                    <Mail /> Email
                  </a>
                </Button>
              )}
            </li>
          )
        })}
      </ul>
    </Panel>
  )
}

export default function RevenuePage() {
  const { values, set, reset } = useUrlState({ view: "transactions", status: "", method: "", planId: "", orgId: "", search: "", from: "", to: "", page: "1", limit: "20" })
  const page = Number(values.page) || 1
  const limit = Number(values.limit) || 20
  const filters = { status: values.status, method: values.method, planId: values.planId, orgId: values.orgId, search: values.search, from: values.from, to: values.to }

  const list = useApi<PlatformPayment[]>(values.view === "transactions" ? `/superadmin/payments${buildQuery({ ...filters, page, limit })}` : null)
  const statsQ = useApi<PaymentStats>("/superadmin/payments/stats")
  const revenueQ = useApi<RevenueOverview>("/superadmin/revenue")
  const plansQ = useApi<PlanRow[]>("/superadmin/plans")
  const orgQ = useApi<TenantDetail>(values.orgId ? `/superadmin/tenants/${values.orgId}` : null)
  const [open, setOpen] = useState<PlatformPayment | null>(null)
  const [exporting, setExporting] = useState(false)

  const stats = statsQ.data
  const rows = list.data ?? []
  const hasFilters = Boolean(values.method || values.planId || values.orgId || values.search || values.from || values.to)

  function refresh() {
    list.reload()
    statsQ.reload()
    revenueQ.reload()
  }

  async function exportCsv() {
    setExporting(true)
    try {
      await api.download(`/superadmin/payments/export${buildQuery(filters)}`, "transactions.csv")
    } catch (err) {
      toast.error(errorMessage(err, "Export failed."))
    } finally {
      setExporting(false)
    }
  }

  const columns: Column<PlatformPayment>[] = [
    {
      key: "org",
      header: "Organization",
      cell: (p) => (
        <div className="min-w-0">
          <p className="truncate font-medium text-[#0f172a]">{p.organization.name}</p>
          <p className="truncate text-xs text-[#94a3b8]">{p.plan?.name ?? "—"} plan</p>
        </div>
      ),
    },
    { key: "amount", header: "Amount", align: "right", cell: (p) => <span className="font-medium tabular-nums text-[#0f172a]">{formatMoney(p.amount)}</span> },
    {
      key: "method",
      header: "Method",
      hideBelow: "md",
      cell: (p) => (
        <div className="text-xs">
          <p className="text-[#334155]">{METHOD_LABEL[p.method]}</p>
          <p className="font-mono text-[#94a3b8]">{p.referenceNo ?? "—"}</p>
        </div>
      ),
    },
    { key: "date", header: "Submitted", hideBelow: "sm", cell: (p) => <span className="text-xs text-[#64748b]" title={formatDate(p.createdAt)}>{formatRelative(p.createdAt)}</span> },
    { key: "status", header: "Status", cell: (p) => <StatusBadge kind="payment" value={p.status} /> },
    {
      key: "actions",
      header: "",
      align: "right",
      cell: (p) =>
        p.status === "PENDING" ? (
          <Button size="sm" onClick={(e) => (e.stopPropagation(), setOpen(p))}>
            Review
          </Button>
        ) : (
          <RowActions actions={[{ label: "View details", icon: Eye, onClick: () => setOpen(p) }]} label={`Actions for payment from ${p.organization.name}`} />
        ),
    },
  ]

  const plans = plansQ.data ?? []
  const chips: ActiveFilter[] = [
    values.orgId && { key: "orgId", label: `Organization: ${orgQ.data?.organization.name ?? "…"}`, onRemove: () => set({ orgId: "" }) },
    values.search && { key: "search", label: `Search: "${values.search}"`, onRemove: () => set({ search: "" }) },
    values.method && { key: "method", label: `Method: ${METHOD_LABEL[values.method as keyof typeof METHOD_LABEL] ?? values.method}`, onRemove: () => set({ method: "" }) },
    values.planId && { key: "planId", label: `Plan: ${plans.find((p) => p.id === values.planId)?.name ?? "…"}`, onRemove: () => set({ planId: "" }) },
    values.from && { key: "from", label: `From ${formatDate(values.from)}`, onRemove: () => set({ from: "" }) },
    values.to && { key: "to", label: `Until ${formatDate(values.to)}`, onRemove: () => set({ to: "" }) },
  ].filter(Boolean) as ActiveFilter[]

  return (
    <>
      <PageHeader
        title="Revenue & payments"
        description="Confirm JazzCash, Easypaisa and bank transfers, and see what the platform earns."
        breadcrumbs={[{ label: "Superadmin", to: "/superadmin" }, { label: "Revenue & payments" }]}
        actions={
          <Button variant="outline" onClick={() => void exportCsv()} disabled={exporting}>
            <Download /> Export CSV
          </Button>
        }
      />

      <StatsRow
        loading={statsQ.initialLoading}
        items={[
          { label: "Waiting for you", value: stats?.PENDING.count, icon: Clock, accent: "amber", hint: stats ? formatMoney(stats.PENDING.amount) : undefined },
          { label: "Confirmed", value: stats ? formatMoney(stats.CONFIRMED.amount) : undefined, icon: Wallet, accent: "green", hint: stats ? plural(stats.CONFIRMED.count, "payment") : undefined },
          { label: "Rejected", value: stats?.REJECTED.count, icon: XCircle, accent: "red" },
          { label: "Outstanding", value: revenueQ.data?.outstanding.length, icon: AlertTriangle, accent: "slate", hint: "expired or ending soon" },
        ]}
      />

      <Charts data={revenueQ.data} loading={revenueQ.initialLoading} />

      <SegmentedTabs
        value={values.view}
        onChange={(view) => set({ view })}
        options={[
          { value: "transactions", label: "Transactions", count: stats ? stats.PENDING.count + stats.CONFIRMED.count + stats.REJECTED.count : undefined },
          { value: "outstanding", label: "Outstanding", count: revenueQ.data?.outstanding.length },
        ]}
      />

      {values.view === "outstanding" ? (
        <Outstanding data={revenueQ.data} loading={revenueQ.initialLoading} />
      ) : (
        <>
          <Toolbar>
            <SearchInput value={values.search} onChange={(v) => set({ search: v })} placeholder="Search organization or transaction ID…" />
            <FilterSelect
              value={values.status}
              onChange={(status) => set({ status })}
              allLabel="Any status"
              options={[
                { value: "PENDING", label: "Waiting for confirmation" },
                { value: "CONFIRMED", label: "Confirmed" },
                { value: "REJECTED", label: "Rejected" },
              ]}
            />
            <FilterSelect value={values.method} onChange={(method) => set({ method })} allLabel="Any method" options={Object.entries(METHOD_LABEL).map(([value, label]) => ({ value, label }))} />
            <FilterSelect value={values.planId} onChange={(planId) => set({ planId })} allLabel="Any plan" options={plans.map((p) => ({ value: p.id, label: p.name }))} />
            <DateRangeFilter id="payments" from={values.from} to={values.to} onChange={set} />
          </Toolbar>
          <FilterChips filters={chips} onClearAll={() => reset(["view", "status"])} />

          {list.error ? (
            <ErrorState message={list.error} onRetry={list.reload} />
          ) : !list.loading && rows.length === 0 ? (
            hasFilters || values.status ? (
              <NoResults onClear={() => reset(["view"])} />
            ) : (
              <EmptyState icon={Receipt} title="No payments yet" description="When an organization pays by JazzCash, Easypaisa or bank transfer, it appears here for you to confirm." />
            )
          ) : (
            <>
              <ServerTable columns={columns} rows={rows} rowKey={(p) => p.id} loading={list.loading} onRowClick={setOpen} />
              {list.meta && (
                <PaginationBar page={page} limit={limit} total={list.meta.total} onPageChange={(p) => set({ page: String(p) })} onLimitChange={(l) => set({ limit: String(l) })} />
              )}
            </>
          )}
        </>
      )}

      <PaymentReviewDialog payment={open} onOpenChange={(o) => !o && setOpen(null)} onReviewed={refresh} />
    </>
  )
}
