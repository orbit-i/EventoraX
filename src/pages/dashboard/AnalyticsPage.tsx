import { useState, type ReactNode } from "react"
import { Link, useNavigate } from "react-router"
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import { Award, BarChart3, CalendarDays, CheckCircle2, Plus, RotateCw, Table2, Users } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { PageHeader } from "@/components/app/PageHeader"
import { StatsRow } from "@/components/app/StatCard"
import { Panel } from "@/components/app/Panel"
import { EmptyState, ErrorState } from "@/components/app/States"
import { RoleGate } from "@/components/app/RoleGate"
import { useApi } from "@/hooks/useApi"
import { formatDate, formatMonth } from "@/lib/format"
import { statusLabel } from "@/lib/status"
import type { Analytics } from "@/types/dashboard"

// Chart colours. Event statuses use a colour-blind-safe set (checked with a palette validator);
// each status always keeps its own colour, whatever the counts are.
const BRAND = "#7c3aed"
const CERT_GREEN = "#1baf7a"
const STATUS_COLOR: Record<string, string> = {
  DRAFT: "#e87ba4",
  PUBLISHED: "#2a78d6",
  ONGOING: "#1baf7a",
  COMPLETED: "#6250d6",
  ARCHIVED: "#eda100",
}
const STATUS_ORDER = ["DRAFT", "PUBLISHED", "ONGOING", "COMPLETED", "ARCHIVED"]
const VIA_LABEL: Record<string, string> = { WEB: "Public page", ADMIN: "Added by organizers", CSV_IMPORT: "CSV import", API: "API" }

const AXIS_TICK = { fontSize: 12, fill: "#94a3b8" }
const TOOLTIP_STYLE = { borderRadius: 12, border: "1px solid #e9e4ff", fontSize: 13 }

// ─────────────────────────── Building blocks ───────────────────────────

/** A Panel whose chart can be switched to a plain table (for exact numbers and screen readers). */
function ChartPanel({
  title,
  description,
  table,
  children,
  className,
}: {
  title: string
  description?: string
  table: { headers: string[]; rows: (string | number)[][] }
  children: ReactNode
  className?: string
}) {
  const [asTable, setAsTable] = useState(false)
  return (
    <Panel
      title={title}
      description={description}
      className={className}
      action={
        <Button variant="ghost" size="sm" onClick={() => setAsTable((v) => !v)} aria-pressed={asTable} className="text-[#64748b]">
          {asTable ? <BarChart3 /> : <Table2 />}
          {asTable ? "Chart" : "Table"}
        </Button>
      }
    >
      {asTable ? (
        <div className="max-h-72 overflow-auto rounded-xl border border-[#f1f5f9]">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-[#faf8ff] text-left text-xs uppercase tracking-wide text-[#64748b]">
              <tr>
                {table.headers.map((h, i) => (
                  <th key={h} className={cn("px-3 py-2 font-semibold", i > 0 && "text-right")}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f1f5f9]">
              {table.rows.map((row, r) => (
                <tr key={r}>
                  {row.map((cell, i) => (
                    <td key={i} className={cn("px-3 py-2 text-[#334155]", i > 0 && "text-right tabular-nums")}>
                      {typeof cell === "number" ? cell.toLocaleString() : cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        children
      )}
    </Panel>
  )
}

/** Horizontal bars drawn with plain HTML — long labels (event titles) stay readable. */
function BarList({ items, color = BRAND }: { items: { key: string; label: ReactNode; value: number; display: string; max: number }[]; color?: string }) {
  return (
    <ul className="space-y-3">
      {items.map((item) => (
        <li key={item.key}>
          <div className="mb-1 flex items-baseline justify-between gap-3 text-sm">
            <span className="min-w-0 truncate text-[#334155]">{item.label}</span>
            <span className="shrink-0 tabular-nums font-medium text-[#0f172a]">{item.display}</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-[#f1f5f9]">
            <div
              className="h-full rounded-full transition-all"
              style={{ width: `${item.max > 0 ? Math.max(2, (item.value / item.max) * 100) : 0}%`, backgroundColor: color }}
            />
          </div>
        </li>
      ))}
    </ul>
  )
}

function ChartEmpty({ children }: { children: ReactNode }) {
  return <div className="flex h-56 items-center justify-center rounded-xl bg-[#faf8ff] px-6 text-center text-sm text-[#94a3b8]">{children}</div>
}

function LoadingGrid() {
  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <Skeleton className="h-80 rounded-2xl lg:col-span-2" />
      <Skeleton className="h-80 rounded-2xl" />
      <Skeleton className="h-72 rounded-2xl lg:col-span-2" />
      <Skeleton className="h-72 rounded-2xl" />
    </div>
  )
}

// ─────────────────────────── Page ───────────────────────────

export default function AnalyticsPage() {
  const navigate = useNavigate()
  const { data, error, initialLoading, loading, reload } = useApi<Analytics>("/analytics")

  const header = (
    <PageHeader
      title="Analytics"
      description="How your events are performing across the whole organization."
      breadcrumbs={[{ label: "Dashboard", to: "/dashboard" }, { label: "Analytics" }]}
      actions={
        <Button variant="outline" onClick={reload} disabled={loading}>
          <RotateCw className={cn(loading && "animate-spin")} /> Refresh
        </Button>
      }
    />
  )

  if (error) {
    return (
      <>
        {header}
        <ErrorState message={error} onRetry={reload} />
      </>
    )
  }

  const t = data?.totals
  const noEvents = data !== null && t!.events === 0 && data.eventsByStatus.length === 0

  // Chart data
  const regMonths = (data?.monthlyRegistrations ?? []).map((m) => ({ key: m.month, month: formatMonth(m.month), full: formatMonth(m.month, true), count: m.count }))
  const certMonths = (data?.monthlyCertificates ?? []).map((m) => ({ key: m.month, month: formatMonth(m.month), full: formatMonth(m.month, true), count: m.count }))
  const regTotal = regMonths.reduce((s, m) => s + m.count, 0)
  const certTotal = certMonths.reduce((s, m) => s + m.count, 0)
  const statusSlices = STATUS_ORDER.map((status) => ({
    status,
    label: statusLabel("event", status),
    count: data?.eventsByStatus.find((g) => g.status === status)?.count ?? 0,
  })).filter((s) => s.count > 0)
  const statusTotal = statusSlices.reduce((s, x) => s + x.count, 0)
  const maxCategory = Math.max(0, ...(data?.categoryBreakdown ?? []).map((c) => c.count))
  const viaTotal = (data?.registeredVia ?? []).reduce((s, v) => s + v.count, 0)
  const maxTop = Math.max(0, ...(data?.topEvents ?? []).map((e) => e.registrations))

  return (
    <>
      {header}

      <StatsRow
        loading={initialLoading}
        items={[
          { label: "Events", value: t?.events, icon: CalendarDays, accent: "purple", hint: "not archived" },
          { label: "Registrations", value: t?.registrations, icon: Users, accent: "blue", hint: "excluding cancelled" },
          {
            label: "Attended",
            value: t?.attended,
            icon: CheckCircle2,
            accent: "green",
            hint: t ? `${t.attendanceRate}% attendance rate` : undefined,
          },
          { label: "Certificates", value: t?.certificatesIssued, icon: Award, accent: "amber", hint: "issued" },
        ]}
      />

      {initialLoading ? (
        <LoadingGrid />
      ) : noEvents ? (
        <EmptyState
          icon={BarChart3}
          title="No data to analyse yet"
          description="Create your first event and add attendees. Charts will fill in as registrations come in."
          action={
            <RoleGate need="write">
              <Button onClick={() => navigate("/dashboard/events/new")}>
                <Plus /> New event
              </Button>
            </RoleGate>
          }
        />
      ) : (
        data && (
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Monthly registrations */}
            <ChartPanel
              title="Registrations — last 12 months"
              description={`${regTotal.toLocaleString()} in total, excluding cancelled`}
              className="lg:col-span-2"
              table={{ headers: ["Month", "Registrations"], rows: regMonths.map((m) => [m.full, m.count]) }}
            >
              {regTotal === 0 ? (
                <ChartEmpty>No registrations in the last 12 months.</ChartEmpty>
              ) : (
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={regMonths} margin={{ top: 5, right: 5, left: -20, bottom: 0 }} barCategoryGap="25%">
                      <CartesianGrid stroke="#f1f5f9" vertical={false} />
                      <XAxis dataKey="month" tick={AXIS_TICK} axisLine={false} tickLine={false} />
                      <YAxis allowDecimals={false} tick={AXIS_TICK} axisLine={false} tickLine={false} />
                      <Tooltip
                        cursor={{ fill: "#f5f3ff" }}
                        contentStyle={TOOLTIP_STYLE}
                        labelFormatter={(_, payload) => payload?.[0]?.payload?.full ?? ""}
                        formatter={(value) => [Number(value).toLocaleString(), "Registrations"]}
                      />
                      <Bar dataKey="count" fill={BRAND} radius={[4, 4, 0, 0]} maxBarSize={28} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </ChartPanel>

            {/* Events by status */}
            <ChartPanel
              title="Events by status"
              description={`${statusTotal.toLocaleString()} events, including archived`}
              table={{ headers: ["Status", "Events"], rows: statusSlices.map((s) => [s.label, s.count]) }}
            >
              {statusTotal === 0 ? (
                <ChartEmpty>No events yet.</ChartEmpty>
              ) : (
                <div className="flex flex-col items-center gap-4">
                  <div className="relative h-44 w-44">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={statusSlices}
                          dataKey="count"
                          nameKey="label"
                          innerRadius="62%"
                          outerRadius="100%"
                          paddingAngle={statusSlices.length > 1 ? 2 : 0}
                          stroke="#ffffff"
                          strokeWidth={2}
                          isAnimationActive={false}
                        >
                          {statusSlices.map((s) => (
                            <Cell key={s.status} fill={STATUS_COLOR[s.status]} />
                          ))}
                        </Pie>
                        <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(value, name) => [Number(value).toLocaleString(), String(name)]} />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-2xl font-bold tabular-nums text-[#0f172a]">{statusTotal.toLocaleString()}</span>
                      <span className="text-xs text-[#64748b]">events</span>
                    </div>
                  </div>
                  {/* Legend with counts — colour is never the only way to tell statuses apart */}
                  <ul className="w-full space-y-1.5">
                    {statusSlices.map((s) => (
                      <li key={s.status} className="flex items-center gap-2 text-sm">
                        <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: STATUS_COLOR[s.status] }} />
                        <span className="text-[#334155]">{s.label}</span>
                        <span className="ml-auto tabular-nums font-medium text-[#0f172a]">{s.count.toLocaleString()}</span>
                        <span className="w-10 text-right tabular-nums text-xs text-[#94a3b8]">{Math.round((s.count / statusTotal) * 100)}%</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </ChartPanel>

            {/* Attendance per event */}
            <ChartPanel
              title="Attendance rate per event"
              description="Active and completed events, most recent first"
              className="lg:col-span-2"
              table={{
                headers: ["Event", "Registered", "Attended", "Rate"],
                rows: data.attendanceByEvent.map((e) => [e.title, e.registered, e.attended, `${e.rate}%`]),
              }}
            >
              {data.attendanceByEvent.length === 0 ? (
                <ChartEmpty>Attendance shows up once an event is active or completed and check-ins are marked.</ChartEmpty>
              ) : (
                <BarList
                  color={CERT_GREEN}
                  items={data.attendanceByEvent.map((e) => ({
                    key: e.id,
                    label: (
                      <Link to={`/dashboard/events/${e.id}`} className="hover:text-[#7c3aed] hover:underline">
                        {e.title} <span className="text-xs text-[#94a3b8]">· {formatDate(e.startDateTime)}</span>
                      </Link>
                    ),
                    value: e.rate,
                    max: 100,
                    display: `${e.rate}% · ${e.attended.toLocaleString()} of ${e.registered.toLocaleString()}`,
                  }))}
                />
              )}
            </ChartPanel>

            {/* Category breakdown */}
            <ChartPanel
              title="Attendee categories"
              description="Same-named categories are combined across events"
              table={{ headers: ["Category", "Registrations"], rows: data.categoryBreakdown.map((c) => [c.label, c.count]) }}
            >
              {data.categoryBreakdown.length === 0 ? (
                <ChartEmpty>No registrations yet.</ChartEmpty>
              ) : (
                <BarList
                  items={data.categoryBreakdown.slice(0, 8).map((c) => ({
                    key: c.label,
                    label: c.label,
                    value: c.count,
                    max: maxCategory,
                    display: c.count.toLocaleString(),
                  }))}
                />
              )}
            </ChartPanel>

            {/* Certificate timeline */}
            <ChartPanel
              title="Certificates issued — last 12 months"
              description={`${certTotal.toLocaleString()} in total`}
              className="lg:col-span-2"
              table={{ headers: ["Month", "Certificates"], rows: certMonths.map((m) => [m.full, m.count]) }}
            >
              {certTotal === 0 ? (
                <ChartEmpty>No certificates issued yet. They'll appear here once you start issuing them.</ChartEmpty>
              ) : (
                <div className="h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={certMonths} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="certFill" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor={CERT_GREEN} stopOpacity={0.25} />
                          <stop offset="100%" stopColor={CERT_GREEN} stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid stroke="#f1f5f9" vertical={false} />
                      <XAxis dataKey="month" tick={AXIS_TICK} axisLine={false} tickLine={false} />
                      <YAxis allowDecimals={false} tick={AXIS_TICK} axisLine={false} tickLine={false} />
                      <Tooltip
                        contentStyle={TOOLTIP_STYLE}
                        labelFormatter={(_, payload) => payload?.[0]?.payload?.full ?? ""}
                        formatter={(value) => [Number(value).toLocaleString(), "Certificates"]}
                      />
                      <Area type="monotone" dataKey="count" stroke={CERT_GREEN} strokeWidth={2} fill="url(#certFill)" activeDot={{ r: 4 }} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              )}
            </ChartPanel>

            {/* How people registered */}
            <ChartPanel
              title="How people registered"
              table={{ headers: ["Source", "Registrations"], rows: data.registeredVia.map((v) => [VIA_LABEL[v.via] ?? v.via, v.count]) }}
            >
              {viaTotal === 0 ? (
                <ChartEmpty>No registrations yet.</ChartEmpty>
              ) : (
                <BarList
                  items={[...data.registeredVia]
                    .sort((a, b) => b.count - a.count)
                    .map((v) => ({
                      key: v.via,
                      label: VIA_LABEL[v.via] ?? v.via,
                      value: v.count,
                      max: viaTotal,
                      display: `${v.count.toLocaleString()} · ${Math.round((v.count / viaTotal) * 100)}%`,
                    }))}
                />
              )}
            </ChartPanel>

            {/* Top events */}
            <Panel title="Top events by registrations" className="lg:col-span-3">
              {data.topEvents.length === 0 || maxTop === 0 ? (
                <p className="text-sm text-[#94a3b8]">No registrations yet.</p>
              ) : (
                <ol className="divide-y divide-[#f1f5f9]">
                  {data.topEvents.map((e, i) => (
                    <li key={e.id}>
                      <Link
                        to={`/dashboard/events/${e.id}`}
                        className="-mx-2 flex items-center gap-4 rounded-xl px-2 py-3 transition-colors hover:bg-[#faf8ff]"
                      >
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#f5f3ff] text-sm font-bold text-[#7c3aed]">
                          {i + 1}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-medium text-[#0f172a]">{e.title}</p>
                          <p className="text-xs text-[#64748b]">{formatDate(e.startDateTime)}</p>
                        </div>
                        <div className="hidden w-48 sm:block">
                          <div className="h-2 overflow-hidden rounded-full bg-[#f1f5f9]">
                            <div className="h-full rounded-full bg-[#7c3aed]" style={{ width: `${(e.registrations / maxTop) * 100}%` }} />
                          </div>
                        </div>
                        <span className="w-28 text-right text-sm tabular-nums text-[#334155]">
                          <span className="font-semibold text-[#0f172a]">{e.registrations.toLocaleString()}</span>
                          {e.maxAttendees ? ` / ${e.maxAttendees.toLocaleString()}` : ""}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ol>
              )}
            </Panel>
          </div>
        )
      )}
    </>
  )
}
