import { useState } from "react"
import { Link } from "react-router"
import { toast } from "sonner"
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import { Award, Building2, CalendarDays, ChevronDown, FileDown, Loader2, Sheet, Users } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { PageHeader } from "@/components/app/PageHeader"
import { StatsRow } from "@/components/app/StatCard"
import { Panel } from "@/components/app/Panel"
import { StatusBadge } from "@/components/app/StatusBadge"
import { ErrorState } from "@/components/app/States"
import { useApi } from "@/hooks/useApi"
import { api, errorMessage } from "@/lib/api"
import { formatDate, formatMonth } from "@/lib/format"
import type { PlatformAnalytics } from "@/types/superadmin"

const AXIS_TICK = { fontSize: 12, fill: "#94a3b8" }
const TOOLTIP = { borderRadius: 12, border: "1px solid #e9e4ff", fontSize: 13 }
const PIE_COLORS = ["#7c3aed", "#2a78d6", "#1baf7a", "#eda100", "#e87ba4", "#64748b"]
const CSV_SETS = [
  { value: "monthly", label: "Monthly numbers (12 months)" },
  { value: "plans", label: "Plan distribution" },
  { value: "organizations", label: "Top 10 organizations" },
  { value: "events", label: "Top 10 events" },
]

function ChartBox({ loading, children, height = "h-60" }: { loading: boolean; children: React.ReactNode; height?: string }) {
  return loading ? <Skeleton className={`${height} rounded-xl`} /> : <div className={height}>{children}</div>
}

export default function PlatformAnalyticsPage() {
  const { data, error, initialLoading, reload } = useApi<PlatformAnalytics>("/superadmin/analytics")
  const [busy, setBusy] = useState(false)

  async function download(path: string, name: string) {
    setBusy(true)
    const id = toast.loading("Preparing your file…")
    try {
      await api.download(path, name)
      toast.success("Downloaded", { id })
    } catch (err) {
      toast.error(errorMessage(err, "Download failed."), { id })
    } finally {
      setBusy(false)
    }
  }

  const header = (
    <PageHeader
      title="Platform analytics"
      description="Growth and usage across every organization."
      breadcrumbs={[{ label: "Superadmin", to: "/superadmin" }, { label: "Analytics" }]}
      actions={
        <>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" disabled={busy || !data}>
                <Sheet /> CSV <ChevronDown />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {CSV_SETS.map((s) => (
                <DropdownMenuItem key={s.value} onSelect={() => void download(`/superadmin/analytics/export?dataset=${s.value}`, `platform-${s.value}.csv`)}>
                  {s.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          <Button onClick={() => void download("/superadmin/analytics/report", "platform-report.pdf")} disabled={busy || !data}>
            {busy ? <Loader2 className="animate-spin" /> : <FileDown />} PDF report
          </Button>
        </>
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

  const months = (data?.monthly ?? []).map((m) => ({ ...m, label: formatMonth(m.month), full: formatMonth(m.month, true) }))
  const plans = data?.planDistribution ?? []
  const label = (_: unknown, payload: readonly { payload?: { full?: string } }[]) => payload?.[0]?.payload?.full ?? ""

  return (
    <>
      {header}
      <StatsRow
        loading={initialLoading}
        items={[
          { label: "Organizations", value: data?.totals.organizations, icon: Building2, accent: "purple" },
          { label: "Events", value: data?.totals.events, icon: CalendarDays, accent: "amber", hint: "not archived" },
          { label: "Registrations", value: data?.totals.registrations, icon: Users, accent: "blue", hint: "cancelled excluded" },
          { label: "Certificates", value: data?.totals.certificates, icon: Award, accent: "green", hint: "valid" },
        ]}
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <Panel title="New organizations" description="Per month, last 12 months" className="lg:col-span-2">
          <ChartBox loading={initialLoading}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={months} margin={{ top: 5, right: 5, left: -20, bottom: 0 }} barCategoryGap="25%">
                <CartesianGrid stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="label" tick={AXIS_TICK} axisLine={false} tickLine={false} />
                <YAxis allowDecimals={false} tick={AXIS_TICK} axisLine={false} tickLine={false} />
                <Tooltip cursor={{ fill: "#f5f3ff" }} contentStyle={TOOLTIP} labelFormatter={label} />
                <Bar dataKey="organizations" name="New organizations" fill="#7c3aed" radius={[4, 4, 0, 0]} maxBarSize={28} />
              </BarChart>
            </ResponsiveContainer>
          </ChartBox>
        </Panel>

        <Panel title="Plan distribution" description="Organizations per plan">
          <ChartBox loading={initialLoading} height="h-44">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={plans} dataKey="total" nameKey="plan" innerRadius={45} outerRadius={75} paddingAngle={plans.length > 1 ? 2 : 0} stroke="none">
                  {plans.map((p, i) => (
                    <Cell key={p.plan} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={TOOLTIP} />
              </PieChart>
            </ResponsiveContainer>
          </ChartBox>
          <ul className="mt-3 space-y-1.5 text-sm">
            {plans.map((p, i) => (
              <li key={p.plan} className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }} />
                <span className="flex-1 text-[#334155]">{p.plan}</span>
                <span className="text-xs text-[#94a3b8]">
                  {p.active} active · {p.trial} trial · {p.expired + p.suspended} inactive
                </span>
                <span className="w-6 text-right font-medium tabular-nums text-[#0f172a]">{p.total}</span>
              </li>
            ))}
          </ul>
        </Panel>

        <Panel title="Events and registrations" description="Events created and registrations per month" className="lg:col-span-2">
          <ChartBox loading={initialLoading}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={months} margin={{ top: 5, right: 5, left: -20, bottom: 0 }} barCategoryGap="20%">
                <CartesianGrid stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="label" tick={AXIS_TICK} axisLine={false} tickLine={false} />
                <YAxis allowDecimals={false} tick={AXIS_TICK} axisLine={false} tickLine={false} />
                <Tooltip cursor={{ fill: "#f5f3ff" }} contentStyle={TOOLTIP} labelFormatter={label} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="registrations" name="Registrations" fill="#2a78d6" radius={[4, 4, 0, 0]} maxBarSize={22} />
                <Bar dataKey="events" name="Events" fill="#eda100" radius={[4, 4, 0, 0]} maxBarSize={22} />
              </BarChart>
            </ResponsiveContainer>
          </ChartBox>
        </Panel>

        <Panel title="Certificates issued" description="Per month">
          <ChartBox loading={initialLoading}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={months} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="certFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#1baf7a" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#1baf7a" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="label" tick={AXIS_TICK} axisLine={false} tickLine={false} />
                <YAxis allowDecimals={false} tick={AXIS_TICK} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={TOOLTIP} labelFormatter={label} />
                <Area type="monotone" dataKey="certificates" name="Certificates" stroke="#1baf7a" strokeWidth={2} fill="url(#certFill)" />
              </AreaChart>
            </ResponsiveContainer>
          </ChartBox>
        </Panel>

        <Panel title="Top 10 organizations" description="By registrations" className="lg:col-span-3 xl:col-span-1">
          {initialLoading ? (
            <Skeleton className="h-48 rounded-xl" />
          ) : (data?.topOrganizations.length ?? 0) === 0 ? (
            <p className="text-sm text-[#94a3b8]">No registrations yet.</p>
          ) : (
            <ol className="space-y-2">
              {data!.topOrganizations.map((o, i) => (
                <li key={o.id} className="flex items-start gap-3 text-sm">
                  <span className="mt-0.5 w-5 text-right text-xs font-semibold text-[#94a3b8]">{i + 1}</span>
                  <div className="min-w-0 flex-1">
                    <Link to={`/superadmin/tenants/${o.id}`} className="block font-medium text-[#0f172a] hover:text-[#7c3aed] hover:underline">
                      {o.name}
                    </Link>
                    <span className="text-xs text-[#64748b]">
                      {o.registrations.toLocaleString()} registrations · {o.events} events · {o.plan ?? "no plan"}
                    </span>
                  </div>
                  <StatusBadge kind="org" value={o.status} />
                </li>
              ))}
            </ol>
          )}
        </Panel>

        <Panel title="Top 10 events" description="By registrations, across all organizations" className="lg:col-span-3 xl:col-span-2">
          {initialLoading ? (
            <Skeleton className="h-48 rounded-xl" />
          ) : (data?.topEvents.length ?? 0) === 0 ? (
            <p className="text-sm text-[#94a3b8]">No events yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs uppercase tracking-wide text-[#94a3b8]">
                    <th className="pb-2 font-semibold">Event</th>
                    <th className="hidden pb-2 font-semibold sm:table-cell">Organization</th>
                    <th className="hidden pb-2 font-semibold md:table-cell">Date</th>
                    <th className="pb-2 text-right font-semibold">Registrations</th>
                  </tr>
                </thead>
                <tbody>
                  {data!.topEvents.map((e) => (
                    <tr key={e.id} className="border-t border-[#f1f5f9]">
                      <td className="py-2 pr-3 font-medium text-[#0f172a]">{e.title}</td>
                      <td className="hidden py-2 pr-3 text-[#475569] sm:table-cell">
                        <Link to={`/superadmin/tenants/${e.organization.id}`} className="hover:text-[#7c3aed] hover:underline">
                          {e.organization.name}
                        </Link>
                      </td>
                      <td className="hidden whitespace-nowrap py-2 pr-3 text-[#64748b] md:table-cell">{formatDate(e.startDateTime)}</td>
                      <td className="py-2 text-right tabular-nums text-[#0f172a]">{e.registrations.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Panel>
      </div>
    </>
  )
}
