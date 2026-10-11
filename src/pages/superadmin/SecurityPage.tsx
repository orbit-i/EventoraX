import { useState } from "react"
import { Link } from "react-router"
import { toast } from "sonner"
import { Activity, AlertTriangle, CheckCircle2, Download, KeyRound, Lock, LogOut, ShieldAlert, XCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { PageHeader } from "@/components/app/PageHeader"
import { StatsRow } from "@/components/app/StatCard"
import { SegmentedTabs } from "@/components/app/SegmentedTabs"
import { Panel } from "@/components/app/Panel"
import { Toolbar, SearchInput, FilterSelect, FilterChips, type ActiveFilter } from "@/components/app/Toolbar"
import { DateRangeFilter } from "@/components/app/DateRangeFilter"
import { ServerTable, type Column } from "@/components/app/ServerTable"
import { PaginationBar } from "@/components/app/PaginationBar"
import { StatusBadge } from "@/components/app/StatusBadge"
import { Avatar } from "@/components/app/Avatar"
import { EmptyState, ErrorState, NoResults } from "@/components/app/States"
import { useConfirm } from "@/components/app/ConfirmDialog"
import { useAuth } from "@/context/AuthContext"
import { useApi } from "@/hooks/useApi"
import { useUrlState } from "@/hooks/useUrlState"
import { api, buildQuery, errorMessage } from "@/lib/api"
import { describeActivity } from "@/lib/activityText"
import { formatDate, formatDateTime, formatRelative } from "@/lib/format"
import type { LoginRecord, PlatformActivity, TenantRow } from "@/types/superadmin"

const ACTION_OPTIONS = [
  { value: "auth", label: "Logins & account" },
  { value: "tenant", label: "Tenants (superadmin)" },
  { value: "payment", label: "Payments (superadmin)" },
  { value: "plan", label: "Plans" },
  { value: "user", label: "User accounts (superadmin)" },
  { value: "settings", label: "System settings" },
  { value: "maintenance", label: "Maintenance" },
  { value: "email", label: "Email templates" },
  { value: "announcement", label: "Announcements" },
  { value: "platform", label: "Platform certificates & reports" },
  { value: "event", label: "Events" },
  { value: "registration", label: "Registrations" },
  { value: "certificate", label: "Certificates (orgs)" },
  { value: "ticket", label: "Tickets" },
  { value: "team", label: "Team" },
  { value: "billing", label: "Billing (orgs)" },
  { value: "org", label: "Organization settings" },
]

interface Overview {
  failed24h: number
  success24h: number
  suspiciousIps: { ip: string; failures: number; emails: number; lastAt: string | null }[]
  lockedAccounts: { email: string; failures: number; lastAt: string | null; unlocksAt: string | null }[]
  recentSessions: { id: string; name: string; email: string; role: string; lastLoginAt: string; organization: { id: string; name: string } | null }[]
  rules: { suspiciousFailures: number; suspiciousEmails: number; lockoutMinutes: number; maxFailedLogins: number }
}

function deviceOf(ua: string | null | undefined) {
  if (!ua) return "—"
  const browser = /Edg\//.test(ua) ? "Edge" : /Chrome\//.test(ua) ? "Chrome" : /Firefox\//.test(ua) ? "Firefox" : /Safari\//.test(ua) ? "Safari" : /curl/i.test(ua) ? "curl" : "Browser"
  const os = /Windows/.test(ua) ? "Windows" : /Android/.test(ua) ? "Android" : /iPhone|iPad/.test(ua) ? "iOS" : /Mac OS/.test(ua) ? "macOS" : /Linux/.test(ua) ? "Linux" : ""
  return os ? `${browser} · ${os}` : browser
}

// ─────────────────────────── Activity tab ───────────────────────────

function ActivityTab() {
  const { values, set, reset } = useUrlState({ tab: "activity", action: "", orgId: "", search: "", from: "", to: "", page: "1", limit: "25" })
  const page = Number(values.page) || 1
  const limit = Number(values.limit) || 25
  const filters = { action: values.action, orgId: values.orgId, search: values.search, from: values.from, to: values.to }
  const list = useApi<(PlatformActivity & { userAgent?: string | null })[]>(`/superadmin/security/activity${buildQuery({ ...filters, page, limit })}`)
  const tenantsQ = useApi<TenantRow[]>("/superadmin/tenants?limit=100&sort=name")
  const [exporting, setExporting] = useState(false)
  const tenants = tenantsQ.data ?? []
  const rows = list.data ?? []
  const hasFilters = Object.values(filters).some(Boolean)

  async function exportCsv() {
    setExporting(true)
    try {
      await api.download(`/superadmin/security/activity/export${buildQuery(filters)}`, "security-log.csv")
    } catch (err) {
      toast.error(errorMessage(err, "Export failed."))
    } finally {
      setExporting(false)
    }
  }

  const columns: Column<PlatformActivity & { userAgent?: string | null }>[] = [
    {
      key: "who",
      header: "Who",
      cell: (a) => (
        <div className="flex min-w-0 items-center gap-2.5">
          <Avatar name={a.user?.name ?? "System"} size="sm" />
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-[#0f172a]">{a.user?.name ?? "System"}</p>
            <p className="truncate text-xs text-[#94a3b8]">{a.user?.email ?? ""}</p>
          </div>
        </div>
      ),
    },
    {
      key: "what",
      header: "What",
      cell: (a) => (
        <div className="min-w-0 text-sm">
          <p className="text-[#334155]">
            {describeActivity(a)}
            {a.metadata && "impersonatedBy" in a.metadata && <span className="ml-1 text-xs text-amber-700">(via log in as)</span>}
          </p>
          <p className="font-mono text-[11px] text-[#94a3b8]">{a.action}</p>
        </div>
      ),
    },
    {
      key: "org",
      header: "Organization",
      hideBelow: "lg",
      cell: (a) =>
        a.organization ? (
          <Link to={`/superadmin/tenants/${a.organization.id}`} className="text-sm text-[#475569] hover:text-[#7c3aed] hover:underline">
            {a.organization.name}
          </Link>
        ) : (
          <span className="text-sm text-[#94a3b8]">Platform</span>
        ),
    },
    {
      key: "where",
      header: "IP · device",
      hideBelow: "md",
      cell: (a) => (
        <div className="text-xs">
          <p className="font-mono text-[#334155]">{a.ipAddress ?? "—"}</p>
          <p className="text-[#94a3b8]">{deviceOf(a.userAgent)}</p>
        </div>
      ),
    },
    {
      key: "when",
      header: "When",
      cell: (a) => (
        <span className="text-xs text-[#64748b]" title={formatDateTime(a.createdAt)}>
          {formatRelative(a.createdAt)}
        </span>
      ),
    },
  ]

  const chips: ActiveFilter[] = [
    values.search && { key: "search", label: `Search: "${values.search}"`, onRemove: () => set({ search: "" }) },
    values.action && { key: "action", label: `Action: ${ACTION_OPTIONS.find((o) => o.value === values.action)?.label ?? values.action}`, onRemove: () => set({ action: "" }) },
    values.orgId && { key: "orgId", label: values.orgId === "platform" ? "Platform only" : `Organization: ${tenants.find((t) => t.id === values.orgId)?.name ?? "…"}`, onRemove: () => set({ orgId: "" }) },
    values.from && { key: "from", label: `From ${formatDate(values.from)}`, onRemove: () => set({ from: "" }) },
    values.to && { key: "to", label: `Until ${formatDate(values.to)}`, onRemove: () => set({ to: "" }) },
  ].filter(Boolean) as ActiveFilter[]

  return (
    <>
      <Toolbar
        end={
          <Button variant="outline" onClick={() => void exportCsv()} disabled={exporting || rows.length === 0}>
            <Download /> Export CSV
          </Button>
        }
      >
        <SearchInput value={values.search} onChange={(v) => set({ search: v })} placeholder="Search IP, name or email…" />
        <FilterSelect value={values.action} onChange={(action) => set({ action })} allLabel="All actions" options={ACTION_OPTIONS} className="sm:w-52" />
        <FilterSelect
          value={values.orgId}
          onChange={(orgId) => set({ orgId })}
          allLabel="Everywhere"
          options={[{ value: "platform", label: "Platform only" }, ...tenants.map((t) => ({ value: t.id, label: t.name }))]}
          className="sm:w-52"
        />
        <DateRangeFilter id="security" from={values.from} to={values.to} onChange={set} />
      </Toolbar>
      <FilterChips filters={chips} onClearAll={() => reset(["tab"])} />
      {list.error ? (
        <ErrorState message={list.error} onRetry={list.reload} />
      ) : !list.loading && rows.length === 0 ? (
        hasFilters ? <NoResults onClear={() => reset(["tab"])} /> : <EmptyState icon={Activity} title="Nothing logged yet" description="Actions across the platform appear here." />
      ) : (
        <>
          <ServerTable columns={columns} rows={rows} rowKey={(a) => a.id} loading={list.loading} />
          {list.meta && <PaginationBar page={page} limit={limit} total={list.meta.total} onPageChange={(p) => set({ page: String(p) })} onLimitChange={(l) => set({ limit: String(l) })} />}
        </>
      )}
    </>
  )
}

// ─────────────────────────── Logins tab ───────────────────────────

function LoginsTab() {
  const { values, set, reset } = useUrlState({ tab: "logins", lstatus: "", lsearch: "", from: "", to: "", page: "1", limit: "25" })
  const page = Number(values.page) || 1
  const limit = Number(values.limit) || 25
  const list = useApi<(LoginRecord & { email: string })[]>(
    `/superadmin/security/logins${buildQuery({ status: values.lstatus, search: values.lsearch, from: values.from, to: values.to, page, limit })}`
  )
  const rows = list.data ?? []
  const hasFilters = Boolean(values.lstatus || values.lsearch || values.from || values.to)

  const columns: Column<LoginRecord & { email: string }>[] = [
    {
      key: "result",
      header: "Result",
      cell: (l) =>
        l.success ? (
          <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700">
            <CheckCircle2 className="h-3.5 w-3.5" /> Logged in
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 text-xs font-medium text-rose-700">
            <XCircle className="h-3.5 w-3.5" /> Failed
          </span>
        ),
    },
    { key: "email", header: "Email", cell: (l) => <span className="text-sm text-[#0f172a]">{l.email}</span> },
    {
      key: "ip",
      header: "IP address",
      cell: (l) =>
        l.ipAddress ? (
          <button type="button" className="font-mono text-xs text-[#7c3aed] hover:underline" onClick={() => set({ lsearch: l.ipAddress! })}>
            {l.ipAddress}
          </button>
        ) : (
          "—"
        ),
    },
    { key: "device", header: "Device", hideBelow: "md", cell: (l) => <span className="text-xs text-[#64748b]">{deviceOf(l.userAgent)}</span> },
    { key: "when", header: "When", cell: (l) => <span className="text-xs text-[#64748b]" title={formatDateTime(l.createdAt)}>{formatRelative(l.createdAt)}</span> },
  ]

  return (
    <>
      <Toolbar>
        <SearchInput value={values.lsearch} onChange={(v) => set({ lsearch: v })} placeholder="Search email or IP…" />
        <FilterSelect
          value={values.lstatus}
          onChange={(lstatus) => set({ lstatus })}
          allLabel="All attempts"
          options={[
            { value: "failed", label: "Failed only" },
            { value: "success", label: "Successful only" },
          ]}
        />
        <DateRangeFilter id="logins" from={values.from} to={values.to} onChange={set} />
      </Toolbar>
      {list.error ? (
        <ErrorState message={list.error} onRetry={list.reload} />
      ) : !list.loading && rows.length === 0 ? (
        hasFilters ? <NoResults onClear={() => reset(["tab"])} /> : <EmptyState icon={KeyRound} title="No login attempts yet" description="Every login attempt (successful or not) is recorded here." />
      ) : (
        <>
          <ServerTable columns={columns} rows={rows} rowKey={(l) => l.id} loading={list.loading} />
          {list.meta && <PaginationBar page={page} limit={limit} total={list.meta.total} onPageChange={(p) => set({ page: String(p) })} onLimitChange={(l) => set({ limit: String(l) })} />}
        </>
      )}
    </>
  )
}

// ─────────────────────────── Threats & sessions tab ───────────────────────────

function ThreatsTab({ data, loading, reload }: { data: Overview | null; loading: boolean; reload: () => void }) {
  const confirm = useConfirm()
  const { user: me } = useAuth()
  const { set } = useUrlState({ tab: "threats", lsearch: "", lstatus: "" })

  async function forceLogout(u: Overview["recentSessions"][number]) {
    const ok = await confirm({ title: `Log ${u.name} out everywhere?`, description: "Every session on every device ends. They can log in again straight away.", confirmLabel: "Log out everywhere" })
    if (!ok) return
    try {
      await api.post(`/superadmin/users/${u.id}/logout`)
      toast.success(`${u.name} was logged out everywhere`)
      reload()
    } catch (err) {
      toast.error(errorMessage(err))
    }
  }

  if (loading || !data) return <Skeleton className="h-80 rounded-2xl" />
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Panel
        title="Suspicious IP addresses"
        description={`Last 24 hours: ${data.rules.suspiciousFailures}+ failed logins, or failures for ${data.rules.suspiciousEmails}+ different emails.`}
      >
        {data.suspiciousIps.length === 0 ? (
          <p className="flex items-center gap-2 text-sm text-emerald-700">
            <CheckCircle2 className="h-4 w-4" /> Nothing suspicious.
          </p>
        ) : (
          <ul className="divide-y divide-[#f1f5f9]">
            {data.suspiciousIps.map((ip) => (
              <li key={ip.ip} className="flex items-center gap-3 py-2.5 text-sm">
                <ShieldAlert className="h-4 w-4 text-rose-600" />
                <span className="font-mono text-[#0f172a]">{ip.ip}</span>
                <span className="flex-1 text-xs text-[#64748b]">
                  {ip.failures} failures · {ip.emails} emails · last {formatRelative(ip.lastAt)}
                </span>
                <Button size="sm" variant="outline" onClick={() => set({ tab: "logins", lsearch: ip.ip, lstatus: "failed" })}>
                  View attempts
                </Button>
              </li>
            ))}
          </ul>
        )}
        <p className="mt-3 text-xs text-[#94a3b8]">Blocking IPs happens at the server / firewall level (Phase 12 deployment adds rate limits and helmet).</p>
      </Panel>

      <Panel title="Locked accounts" description={`${data.rules.maxFailedLogins} wrong passwords in ${data.rules.lockoutMinutes} minutes locks an email for ${data.rules.lockoutMinutes} minutes.`}>
        {data.lockedAccounts.length === 0 ? (
          <p className="flex items-center gap-2 text-sm text-emerald-700">
            <CheckCircle2 className="h-4 w-4" /> No account is locked right now.
          </p>
        ) : (
          <ul className="divide-y divide-[#f1f5f9]">
            {data.lockedAccounts.map((a) => (
              <li key={a.email} className="flex items-center gap-3 py-2.5 text-sm">
                <Lock className="h-4 w-4 text-amber-600" />
                <span className="flex-1 text-[#0f172a]">{a.email}</span>
                <span className="text-xs text-[#64748b]">unlocks {a.unlocksAt ? formatRelative(a.unlocksAt).replace(" ago", "") : "soon"}</span>
              </li>
            ))}
          </ul>
        )}
      </Panel>

      <Panel title="Recent sessions" description="People who logged in during the last 24 hours. End someone's sessions if their device was lost or shared." className="lg:col-span-2">
        {data.recentSessions.length === 0 ? (
          <p className="text-sm text-[#94a3b8]">No logins in the last 24 hours.</p>
        ) : (
          <ul className="divide-y divide-[#f1f5f9]">
            {data.recentSessions.map((u) => (
              <li key={u.id} className="flex flex-wrap items-center gap-3 py-2.5">
                <Avatar name={u.name} size="sm" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-[#0f172a]">{u.name}</p>
                  <p className="truncate text-xs text-[#94a3b8]">
                    {u.email} · {u.organization?.name ?? "Platform"}
                  </p>
                </div>
                <StatusBadge kind="role" value={u.role} />
                <span className="w-28 text-right text-xs text-[#64748b]">{formatRelative(u.lastLoginAt)}</span>
                <Button size="sm" variant="outline" onClick={() => void forceLogout(u)} disabled={u.role === "superAdmin" || u.id === me?.id}>
                  <LogOut /> Force logout
                </Button>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </div>
  )
}

export default function SecurityPage() {
  const { values, set } = useUrlState({ tab: "activity" })
  const overview = useApi<Overview>("/superadmin/security/overview")
  const o = overview.data

  return (
    <>
      <PageHeader
        title="Security & activity"
        description="Everything that happens on EventoraX: who did what, from which IP, failed logins and suspicious activity."
        breadcrumbs={[{ label: "Superadmin", to: "/superadmin" }, { label: "Security & activity" }]}
      />
      <StatsRow
        loading={overview.initialLoading}
        items={[
          { label: "Logins (24 h)", value: o?.success24h, icon: CheckCircle2, accent: "green" },
          { label: "Failed logins (24 h)", value: o?.failed24h, icon: XCircle, accent: "red" },
          { label: "Suspicious IPs", value: o?.suspiciousIps.length, icon: ShieldAlert, accent: o?.suspiciousIps.length ? "red" : "slate" },
          { label: "Locked accounts", value: o?.lockedAccounts.length, icon: AlertTriangle, accent: "amber" },
        ]}
      />
      <SegmentedTabs
        value={values.tab}
        onChange={(tab) => set({ tab })}
        options={[
          { value: "activity", label: "Activity log" },
          { value: "logins", label: "Login attempts" },
          { value: "threats", label: "Threats & sessions", count: o ? o.suspiciousIps.length + o.lockedAccounts.length : undefined },
        ]}
      />
      {values.tab === "logins" ? <LoginsTab /> : values.tab === "threats" ? <ThreatsTab data={o} loading={overview.initialLoading} reload={overview.reload} /> : <ActivityTab />}
    </>
  )
}
