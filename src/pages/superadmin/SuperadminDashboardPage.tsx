import { Link, useNavigate } from "react-router"
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import { AlertTriangle, Award, Building2, CalendarDays, CheckCircle2, Clock, Megaphone, Plus, RotateCw, ShieldAlert, ShieldCheck, Users, Wallet } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { PageHeader } from "@/components/app/PageHeader"
import { StatsRow } from "@/components/app/StatCard"
import { Panel, PanelLink } from "@/components/app/Panel"
import { ErrorState } from "@/components/app/States"
import { ActivityFeed } from "@/components/superadmin/ActivityFeed"
import { useApi } from "@/hooks/useApi"
import { formatDate, formatMoney, formatMonth, formatRelative, plural } from "@/lib/format"
import type { PlatformDashboard } from "@/types/superadmin"

const AXIS_TICK = { fontSize: 12, fill: "#94a3b8" }

function MoneyTile({ label, value, hint }: { label: string; value: string | undefined; hint: string }) {
  return (
    <div className="rounded-xl border border-[#e9e4ff] bg-[#faf8ff] p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-[#64748b]">{label}</p>
      {value === undefined ? <Skeleton className="mt-1 h-7 w-28" /> : <p className="mt-1 text-xl font-bold tabular-nums text-[#0f172a]">{formatMoney(value)}</p>}
      <p className="text-xs text-[#94a3b8]">{hint}</p>
    </div>
  )
}

function AlertRow({ tone, icon: Icon, children, to }: { tone: "red" | "amber" | "slate"; icon: typeof Clock; children: React.ReactNode; to?: string }) {
  const body = (
    <div
      className={cn(
        "flex items-start gap-3 rounded-xl border px-3 py-2.5 text-sm",
        tone === "red" && "border-rose-200 bg-rose-50 text-rose-800",
        tone === "amber" && "border-amber-200 bg-amber-50 text-amber-800",
        tone === "slate" && "border-[#e9e4ff] bg-white text-[#475569]",
        to && "transition-colors hover:border-[#c4b5fd]"
      )}
    >
      <Icon className="mt-0.5 h-4 w-4 shrink-0" />
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  )
  return to ? <Link to={to}>{body}</Link> : body
}

export default function SuperadminDashboardPage() {
  const navigate = useNavigate()
  const { data, error, initialLoading, loading, reload } = useApi<PlatformDashboard>("/superadmin/dashboard")

  const header = (
    <PageHeader
      title="Platform overview"
      description="Every organization on EventoraX at a glance."
      actions={
        <>
          <Button variant="outline" onClick={reload} disabled={loading}>
            <RotateCw className={cn(loading && "animate-spin")} /> Refresh
          </Button>
          <Button variant="outline" onClick={() => navigate("/superadmin/security")}>
            <ShieldCheck /> View logs
          </Button>
          <Button variant="outline" onClick={() => navigate("/superadmin/announcements?new=1")}>
            <Megaphone /> Send announcement
          </Button>
          <Button onClick={() => navigate("/superadmin/tenants?new=1")}>
            <Plus /> Add tenant
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

  const t = data?.tenants
  const signups = (data?.signups ?? []).map((m) => ({ month: formatMonth(m.month), full: formatMonth(m.month, true), count: m.count }))
  const a = data?.alerts
  const alertCount = a ? (a.pendingPayments.count > 0 ? 1 : 0) + a.recentlyExpired.length + a.expiringSoon.length + (a.errors24h > 0 ? 1 : 0) + (a.failedLogins24h >= 10 ? 1 : 0) : 0

  return (
    <>
      {header}

      <StatsRow
        loading={initialLoading}
        items={[
          { label: "Tenants", value: t?.total, icon: Building2, accent: "purple", hint: t ? `${t.newThisMonth} new this month` : undefined },
          { label: "Active (paid)", value: t?.active, icon: CheckCircle2, accent: "green" },
          { label: "On trial", value: t?.trial, icon: Clock, accent: "blue" },
          { label: "Expired · suspended", value: t ? `${t.expired} · ${t.suspended}` : undefined, icon: AlertTriangle, accent: "amber" },
        ]}
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <Panel title="Revenue" description="Confirmed payments only" action={<PanelLink to="/superadmin/revenue">Details</PanelLink>} className="lg:col-span-2">
          <div className="grid gap-3 sm:grid-cols-3">
            <MoneyTile label="This month" value={data?.revenue.month} hint="confirmed this month" />
            <MoneyTile label="This year" value={data?.revenue.year} hint={`since 1 Jan ${new Date().getFullYear()}`} />
            <MoneyTile label="All time" value={data?.revenue.allTime} hint="since launch" />
          </div>
          <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { label: "Events", value: data?.totals.events, icon: CalendarDays },
              { label: "Registrations", value: data?.totals.registrations, icon: Users },
              { label: "Certificates", value: data?.totals.certificates, icon: Award },
              { label: "Org users", value: data?.totals.users, icon: Users },
            ].map((s) => (
              <div key={s.label} className="flex items-center gap-3 rounded-xl border border-[#e9e4ff] px-3 py-2.5">
                <s.icon className="h-4 w-4 text-[#7c3aed]" />
                <div>
                  <p className="text-xs text-[#64748b]">{s.label}</p>
                  {s.value === undefined ? <Skeleton className="h-5 w-12" /> : <p className="font-semibold tabular-nums text-[#0f172a]">{s.value.toLocaleString()}</p>}
                </div>
              </div>
            ))}
          </div>
        </Panel>

        <Panel title="Needs attention" description={data ? (alertCount ? plural(alertCount, "item") : "All clear") : undefined}>
          {initialLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-12 rounded-xl" />
              <Skeleton className="h-12 rounded-xl" />
            </div>
          ) : alertCount === 0 ? (
            <AlertRow tone="slate" icon={CheckCircle2}>
              No pending payments, expiring plans or server errors.
            </AlertRow>
          ) : (
            <div className="space-y-2">
              {a!.pendingPayments.count > 0 && (
                <AlertRow tone="red" icon={Wallet} to="/superadmin/revenue?status=PENDING">
                  <strong>{plural(a!.pendingPayments.count, "payment")}</strong> waiting for confirmation
                  <span className="block text-xs opacity-80">Oldest: {a!.pendingPayments.items[0]?.organization.name} · {formatRelative(a!.pendingPayments.items[0]?.createdAt)}</span>
                </AlertRow>
              )}
              {a!.errors24h > 0 && (
                <AlertRow tone="red" icon={ShieldAlert} to="/superadmin/maintenance">
                  <strong>{plural(a!.errors24h, "server error")}</strong> in the last 24 hours
                </AlertRow>
              )}
              {a!.failedLogins24h >= 10 && (
                <AlertRow tone="amber" icon={ShieldAlert} to="/superadmin/security?tab=logins">
                  <strong>{plural(a!.failedLogins24h, "failed login")}</strong> in the last 24 hours
                </AlertRow>
              )}
              {a!.expiringSoon.map((o) => (
                <AlertRow key={o.id} tone="amber" icon={Clock} to={`/superadmin/tenants/${o.id}`}>
                  <strong>{o.name}</strong> — {o.status === "trial" ? "trial" : "plan"} ends {formatDate(o.subscriptionEndsAt)}
                </AlertRow>
              ))}
              {a!.recentlyExpired.map((o) => (
                <AlertRow key={o.id} tone="slate" icon={AlertTriangle} to={`/superadmin/tenants/${o.id}`}>
                  <strong>{o.name}</strong> expired {formatRelative(o.subscriptionEndsAt)}
                </AlertRow>
              ))}
            </div>
          )}
        </Panel>

        <Panel title="New organizations" description="Sign-ups in the last 12 months" className="lg:col-span-2">
          {initialLoading ? (
            <Skeleton className="h-64 rounded-xl" />
          ) : (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={signups} margin={{ top: 5, right: 5, left: -20, bottom: 0 }} barCategoryGap="25%">
                  <CartesianGrid stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="month" tick={AXIS_TICK} axisLine={false} tickLine={false} />
                  <YAxis allowDecimals={false} tick={AXIS_TICK} axisLine={false} tickLine={false} />
                  <Tooltip
                    cursor={{ fill: "#f5f3ff" }}
                    contentStyle={{ borderRadius: 12, border: "1px solid #e9e4ff", fontSize: 13 }}
                    labelFormatter={(_, payload) => payload?.[0]?.payload?.full ?? ""}
                    formatter={(value) => Number(value).toLocaleString()}
                  />
                  <Bar dataKey="count" name="New organizations" fill="#7c3aed" radius={[4, 4, 0, 0]} maxBarSize={28} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </Panel>

        <Panel title="Recent activity" action={<PanelLink to="/superadmin/security">All activity</PanelLink>}>
          {initialLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }, (_, i) => (
                <Skeleton key={i} className="h-10 rounded-xl" />
              ))}
            </div>
          ) : data?.recentActivity.length ? (
            <ActivityFeed items={data.recentActivity} />
          ) : (
            <p className="text-sm text-[#94a3b8]">Nothing has happened yet.</p>
          )}
        </Panel>
      </div>
    </>
  )
}
