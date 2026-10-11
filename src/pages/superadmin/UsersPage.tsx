import { useState } from "react"
import { Link } from "react-router"
import { toast } from "sonner"
import { Ban, CheckCircle2, Download, KeyRound, LogOut, Mail, MailWarning, ShieldOff, UserCheck, UserCog, Users, XCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { PageHeader } from "@/components/app/PageHeader"
import { StatsRow } from "@/components/app/StatCard"
import { SegmentedTabs } from "@/components/app/SegmentedTabs"
import { Toolbar, SearchInput, FilterSelect, FilterChips, type ActiveFilter } from "@/components/app/Toolbar"
import { ServerTable, type Column } from "@/components/app/ServerTable"
import { PaginationBar } from "@/components/app/PaginationBar"
import { RowActions, type RowAction } from "@/components/app/RowActions"
import { StatusBadge } from "@/components/app/StatusBadge"
import { Avatar } from "@/components/app/Avatar"
import { EmptyState, ErrorState, NoResults } from "@/components/app/States"
import { useConfirm } from "@/components/app/ConfirmDialog"
import { ActivityFeed } from "@/components/superadmin/ActivityFeed"
import { OneTimeSecret } from "@/components/superadmin/TenantDialogs"
import { useAuth } from "@/context/AuthContext"
import { useApi } from "@/hooks/useApi"
import { useUrlState } from "@/hooks/useUrlState"
import { api, buildQuery, errorMessage } from "@/lib/api"
import { formatDate, formatDateTime, formatRelative } from "@/lib/format"
import type { PlatformUser, TenantDetail, UserDetail, UserStats } from "@/types/superadmin"

const ROLE_LABEL: Record<string, string> = { superAdmin: "Super admin", admin: "Admin", manager: "Manager", viewer: "Viewer" }

/** Short browser description from a user agent ("Chrome on Windows"). */
function deviceOf(ua: string | null) {
  if (!ua) return "Unknown device"
  const browser = /Edg\//.test(ua) ? "Edge" : /Chrome\//.test(ua) ? "Chrome" : /Firefox\//.test(ua) ? "Firefox" : /Safari\//.test(ua) ? "Safari" : /curl/i.test(ua) ? "curl" : "Browser"
  const os = /Windows/.test(ua) ? "Windows" : /Android/.test(ua) ? "Android" : /iPhone|iPad/.test(ua) ? "iOS" : /Mac OS/.test(ua) ? "macOS" : /Linux/.test(ua) ? "Linux" : ""
  return os ? `${browser} on ${os}` : browser
}

/** All account actions in one place, so the table menu and the side panel behave the same. */
function useUserActions(onChanged: () => void) {
  const confirm = useConfirm()
  const [secret, setSecret] = useState<{ name: string; password: string } | null>(null)

  async function run(u: PlatformUser, action: "disable" | "enable" | "logout" | "link" | "temporary" | "reset-2fa") {
    const prompts = {
      disable: { title: `Disable ${u.name}'s account?`, description: "They're logged out everywhere and can't log in until you enable the account again.", confirmLabel: "Disable account", tone: "danger" as const },
      enable: { title: `Enable ${u.name}'s account?`, description: "They can log in again with their current password.", confirmLabel: "Enable account" },
      logout: { title: `Log ${u.name} out everywhere?`, description: "Every session on every device ends. They can log in again straight away.", confirmLabel: "Log out everywhere" },
      link: { title: `Email ${u.name} a reset link?`, description: `A link valid for 15 minutes is sent to ${u.email}.`, confirmLabel: "Send link" },
      "reset-2fa": {
        title: `Reset two-factor login for ${u.name}?`,
        description: "Only do this after confirming who they are (they lost their phone and their recovery codes). They're logged out everywhere and can log in with just their password, then turn it on again.",
        confirmLabel: "Reset two-factor",
        tone: "danger" as const,
      },
      temporary: {
        title: `Set a temporary password for ${u.name}?`,
        description: "Their current password stops working and they're logged out everywhere. You'll see the new password once, to share privately.",
        confirmLabel: "Set temporary password",
        tone: "danger" as const,
      },
    }
    if (!(await confirm(prompts[action]))) return false
    try {
      if (action === "link" || action === "temporary") {
        const res = await api.post<{ temporaryPassword?: string; sentTo?: string }>(`/superadmin/users/${u.id}/reset-password`, { mode: action })
        if (res.temporaryPassword) setSecret({ name: u.name, password: res.temporaryPassword })
        else toast.success(`Reset link sent to ${res.sentTo}`)
      } else {
        await api.post(`/superadmin/users/${u.id}/${action}`)
        const done = { disable: `${u.name} is disabled`, enable: `${u.name} can log in again`, logout: `${u.name} was logged out everywhere`, "reset-2fa": `Two-factor login is off for ${u.name}` }
        toast.success(done[action], {
          action: action === "disable" ? { label: "Undo", onClick: () => void api.post(`/superadmin/users/${u.id}/enable`).then(onChanged) } : undefined,
        })
      }
      onChanged()
      return true
    } catch (err) {
      toast.error(errorMessage(err))
      return false
    }
  }

  const secretDialog = (
    <Dialog open={secret !== null} onOpenChange={(o) => !o && setSecret(null)}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Temporary password for {secret?.name}</DialogTitle>
          <DialogDescription>Give it to them privately (WhatsApp or phone). They should change it in their account settings.</DialogDescription>
        </DialogHeader>
        {secret && <OneTimeSecret label="Temporary password" value={secret.password} />}
        <DialogFooter>
          <Button onClick={() => setSecret(null)}>Done</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
  return { run, secretDialog }
}

function UserSheet({ userId, onOpenChange, onAction }: { userId: string | null; onOpenChange: (o: boolean) => void; onAction: (u: PlatformUser, a: "disable" | "enable" | "logout" | "link" | "temporary" | "reset-2fa") => void }) {
  const { user: me } = useAuth()
  const { data, error, initialLoading } = useApi<UserDetail>(userId ? `/superadmin/users/${userId}` : null)
  const u = data?.user
  const protectedUser = u ? u.role === "superAdmin" || u.id === me?.id : true

  return (
    <Sheet open={userId !== null} onOpenChange={onOpenChange}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>{u?.name ?? "User"}</SheetTitle>
          <SheetDescription>{u?.email}</SheetDescription>
        </SheetHeader>
        <div className="space-y-6 px-4 pb-6">
          {error ? (
            <p className="text-sm text-rose-600">{error}</p>
          ) : initialLoading || !u ? (
            <Skeleton className="h-48 rounded-xl" />
          ) : (
            <>
              <div className="flex items-center gap-3">
                <Avatar name={u.name} />
                <div className="min-w-0 flex-1 text-sm">
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusBadge kind="role" value={u.role} />
                    {!u.isActive && <span className="rounded-full bg-rose-50 px-2 py-0.5 text-xs font-medium text-rose-700">Disabled</span>}
                    {u.twoFactorEnabledAt && <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">Two-factor on</span>}
                    {!u.emailVerified && <span className="rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700">Email not verified</span>}
                  </div>
                  <p className="mt-1 text-[#64748b]">
                    {u.organization ? (
                      <Link to={`/superadmin/tenants/${u.organization.id}`} className="text-[#7c3aed] hover:underline">
                        {u.organization.name}
                      </Link>
                    ) : (
                      "Platform account"
                    )}{" "}
                    · joined {formatDate(u.createdAt)}
                  </p>
                </div>
              </div>

              {!protectedUser && (
                <div className="grid grid-cols-2 gap-2">
                  {u.isActive ? (
                    <Button size="sm" variant="outline" onClick={() => onAction(u, "disable")}>
                      <Ban /> Disable
                    </Button>
                  ) : (
                    <Button size="sm" variant="outline" onClick={() => onAction(u, "enable")}>
                      <UserCheck /> Enable
                    </Button>
                  )}
                  <Button size="sm" variant="outline" onClick={() => onAction(u, "logout")}>
                    <LogOut /> Log out everywhere
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => onAction(u, "link")}>
                    <Mail /> Email reset link
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => onAction(u, "temporary")}>
                    <KeyRound /> Temporary password
                  </Button>
                  {u.twoFactorEnabledAt && (
                    <Button size="sm" variant="outline" onClick={() => onAction(u, "reset-2fa")}>
                      <ShieldOff /> Reset two-factor
                    </Button>
                  )}
                </div>
              )}

              <section>
                <h3 className="mb-2 text-sm font-semibold text-[#0f172a]">Recent logins</h3>
                {data.logins.length === 0 ? (
                  <p className="text-sm text-[#94a3b8]">No login attempts recorded.</p>
                ) : (
                  <ul className="space-y-1.5">
                    {data.logins.map((l) => (
                      <li key={l.id} className="flex items-center gap-2 text-xs">
                        {l.success ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" /> : <XCircle className="h-3.5 w-3.5 text-rose-600" />}
                        <span className="flex-1 text-[#334155]">
                          {l.success ? "Logged in" : "Failed attempt"} · {deviceOf(l.userAgent)}
                          <span className="text-[#94a3b8]"> · {l.ipAddress ?? "unknown IP"}</span>
                        </span>
                        <span className="text-[#94a3b8]" title={formatDateTime(l.createdAt)}>
                          {formatRelative(l.createdAt)}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </section>

              <section>
                <h3 className="mb-2 text-sm font-semibold text-[#0f172a]">Recent activity</h3>
                {data.activity.length === 0 ? <p className="text-sm text-[#94a3b8]">Nothing yet.</p> : <ActivityFeed items={data.activity} />}
              </section>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}

export default function UsersPage() {
  const { user: me } = useAuth()
  const { values, set, reset } = useUrlState({ status: "", role: "", orgId: "", search: "", user: "", page: "1", limit: "20" })
  const page = Number(values.page) || 1
  const limit = Number(values.limit) || 20
  const filters = { status: values.status, role: values.role, orgId: values.orgId, search: values.search }

  const list = useApi<PlatformUser[]>(`/superadmin/users${buildQuery({ ...filters, page, limit })}`)
  const statsQ = useApi<UserStats>("/superadmin/users/stats")
  const orgQ = useApi<TenantDetail>(values.orgId ? `/superadmin/tenants/${values.orgId}` : null)
  const [exporting, setExporting] = useState(false)
  const [sheetVersion, setSheetVersion] = useState(0)

  function refresh() {
    list.reload()
    statsQ.reload()
  }
  const { run, secretDialog } = useUserActions(refresh)

  const rows = list.data ?? []
  const stats = statsQ.data
  const hasFilters = Boolean(values.role || values.orgId || values.search)

  async function exportCsv() {
    setExporting(true)
    try {
      await api.download(`/superadmin/users/export${buildQuery(filters)}`, "users.csv")
    } catch (err) {
      toast.error(errorMessage(err, "Export failed."))
    } finally {
      setExporting(false)
    }
  }

  const actionsFor = (u: PlatformUser): RowAction[] => {
    const locked = u.role === "superAdmin" || u.id === me?.id
    return [
      { label: "View details", icon: UserCog, onClick: () => set({ user: u.id }) },
      { label: "Disable account", icon: Ban, hidden: locked || !u.isActive, separatorBefore: true, onClick: () => void run(u, "disable") },
      { label: "Enable account", icon: UserCheck, hidden: locked || u.isActive, separatorBefore: true, onClick: () => void run(u, "enable") },
      { label: "Log out everywhere", icon: LogOut, hidden: locked, onClick: () => void run(u, "logout") },
      { label: "Email reset link", icon: Mail, hidden: locked, onClick: () => void run(u, "link") },
      { label: "Set temporary password", icon: KeyRound, hidden: locked, onClick: () => void run(u, "temporary") },
      { label: "Reset two-factor login", icon: ShieldOff, hidden: locked || !u.twoFactorEnabledAt, onClick: () => void run(u, "reset-2fa") },
    ]
  }

  const columns: Column<PlatformUser>[] = [
    {
      key: "user",
      header: "User",
      cell: (u) => (
        <div className="flex min-w-0 items-center gap-3">
          <Avatar name={u.name} size="sm" />
          <div className="min-w-0">
            <p className="truncate font-medium text-[#0f172a]">
              {u.name} {u.id === me?.id && <span className="text-xs font-normal text-[#94a3b8]">(you)</span>}
            </p>
            <p className="truncate text-xs text-[#94a3b8]">{u.email}</p>
          </div>
        </div>
      ),
    },
    { key: "role", header: "Role", hideBelow: "sm", cell: (u) => <StatusBadge kind="role" value={u.role} /> },
    {
      key: "org",
      header: "Organization",
      hideBelow: "md",
      cell: (u) =>
        u.organization ? (
          <Link to={`/superadmin/tenants/${u.organization.id}`} onClick={(e) => e.stopPropagation()} className="text-[#475569] hover:text-[#7c3aed] hover:underline">
            {u.organization.name}
          </Link>
        ) : (
          <span className="text-[#94a3b8]">Platform</span>
        ),
    },
    {
      key: "status",
      header: "Status",
      cell: (u) =>
        !u.isActive ? (
          <span className="inline-flex items-center gap-1 text-xs font-medium text-rose-700">
            <ShieldOff className="h-3.5 w-3.5" /> Disabled
          </span>
        ) : !u.emailVerified ? (
          <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-700">
            <MailWarning className="h-3.5 w-3.5" /> Unverified
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700">
            <CheckCircle2 className="h-3.5 w-3.5" /> Active
          </span>
        ),
    },
    { key: "seen", header: "Last login", hideBelow: "lg", cell: (u) => <span className="text-xs text-[#64748b]">{u.lastLoginAt ? formatRelative(u.lastLoginAt) : "Never"}</span> },
    { key: "actions", header: "", align: "right", cell: (u) => <RowActions actions={actionsFor(u)} label={`Actions for ${u.name}`} /> },
  ]

  const chips: ActiveFilter[] = [
    values.orgId && { key: "orgId", label: `Organization: ${orgQ.data?.organization.name ?? "…"}`, onRemove: () => set({ orgId: "" }) },
    values.search && { key: "search", label: `Search: "${values.search}"`, onRemove: () => set({ search: "" }) },
    values.role && { key: "role", label: `Role: ${ROLE_LABEL[values.role] ?? values.role}`, onRemove: () => set({ role: "" }) },
  ].filter(Boolean) as ActiveFilter[]

  return (
    <>
      <PageHeader
        title="Users"
        description="All accounts on the platform and their access."
        breadcrumbs={[{ label: "Superadmin", to: "/superadmin" }, { label: "Users" }]}
        actions={
          <Button variant="outline" onClick={() => void exportCsv()} disabled={exporting}>
            <Download /> Export CSV
          </Button>
        }
      />

      <StatsRow
        loading={statsQ.initialLoading}
        items={[
          { label: "Accounts", value: stats?.total, icon: Users, accent: "purple", hint: stats ? `${stats.byRole.admin ?? 0} admins · ${stats.byRole.manager ?? 0} managers · ${stats.byRole.viewer ?? 0} viewers` : undefined },
          { label: "Active this week", value: stats?.activeWeek, icon: UserCheck, accent: "green" },
          { label: "Email not verified", value: stats?.unverified, icon: MailWarning, accent: "amber" },
          { label: "Disabled", value: stats?.disabled, icon: Ban, accent: "red" },
        ]}
      />

      <SegmentedTabs
        value={values.status}
        onChange={(status) => set({ status })}
        options={[
          { value: "", label: "All" },
          { value: "active", label: "Active" },
          { value: "unverified", label: "Unverified" },
          { value: "disabled", label: "Disabled" },
        ]}
      />
      <Toolbar>
        <SearchInput value={values.search} onChange={(v) => set({ search: v })} placeholder="Search name, email or organization…" />
        <FilterSelect value={values.role} onChange={(role) => set({ role })} allLabel="Any role" options={Object.entries(ROLE_LABEL).map(([value, label]) => ({ value, label }))} />
      </Toolbar>
      <FilterChips filters={chips} onClearAll={() => reset(values.status ? ["status"] : [])} />

      {list.error ? (
        <ErrorState message={list.error} onRetry={list.reload} />
      ) : !list.loading && rows.length === 0 ? (
        hasFilters || values.status ? <NoResults onClear={() => reset([])} /> : <EmptyState icon={Users} title="No users yet" description="Accounts appear here when organizations sign up." />
      ) : (
        <>
          <ServerTable columns={columns} rows={rows} rowKey={(u) => u.id} loading={list.loading} onRowClick={(u) => set({ user: u.id })} />
          {list.meta && <PaginationBar page={page} limit={limit} total={list.meta.total} onPageChange={(p) => set({ page: String(p) })} onLimitChange={(l) => set({ limit: String(l) })} />}
        </>
      )}

      <UserSheet
        key={`${values.user}-${sheetVersion}`}
        userId={values.user || null}
        onOpenChange={(o) => !o && set({ user: "", page: values.page })}
        onAction={(u, a) => void run(u, a).then((done) => done && setSheetVersion((v) => v + 1))}
      />
      {secretDialog}
    </>
  )
}
