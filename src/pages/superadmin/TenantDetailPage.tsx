import { useMemo, useState } from "react"
import { useNavigate, useParams } from "react-router"
import { toast } from "sonner"
import { Award, Ban, CalendarDays, CalendarPlus, CheckCircle2, IdCard, Layers, LogIn, Mail, Phone, RotateCcw, ScanLine, Trash2, Users, Wallet } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { PageHeader } from "@/components/app/PageHeader"
import { StatsRow } from "@/components/app/StatCard"
import { Panel, PanelLink } from "@/components/app/Panel"
import { StatusBadge } from "@/components/app/StatusBadge"
import { ErrorState } from "@/components/app/States"
import { Avatar } from "@/components/app/Avatar"
import { useConfirm } from "@/components/app/ConfirmDialog"
import { ActivityFeed } from "@/components/superadmin/ActivityFeed"
import { ChangePlanDialog, DeleteTenantDialog, ExtendDialog, SuspendDialog } from "@/components/superadmin/TenantDialogs"
import { useImpersonate } from "@/components/superadmin/useImpersonate"
import { useApi } from "@/hooks/useApi"
import { api, errorMessage } from "@/lib/api"
import { formatDate, formatMoney, formatRelative, formatTimeLeft, plural } from "@/lib/format"
import type { PlanRow, TenantDetail } from "@/types/superadmin"

function Fact({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-[#f1f5f9] py-2.5 text-sm last:border-0">
      <span className="text-[#64748b]">{label}</span>
      <span className="text-right font-medium text-[#0f172a]">{children}</span>
    </div>
  )
}

export default function TenantDetailPage() {
  const { id = "" } = useParams()
  const navigate = useNavigate()
  const confirm = useConfirm()
  const impersonate = useImpersonate()
  const { data, error, initialLoading, reload } = useApi<TenantDetail>(`/superadmin/tenants/${id}`)
  const plansQ = useApi<PlanRow[]>("/superadmin/plans")
  const [dialog, setDialog] = useState<"plan" | "extend" | "suspend" | "delete" | null>(null)

  const org = data?.organization
  const u = data?.usage
  const crumbs = [
    { label: "Superadmin", to: "/superadmin" },
    { label: "Tenants", to: "/superadmin/tenants" },
    { label: org?.name ?? "…" },
  ]

  // Stable object, so the dialogs don't reset while open.
  const tenantForDialogs = useMemo(
    () => (org ? { id: org.id, name: org.name, status: org.status, subscriptionEndsAt: org.subscriptionEndsAt, plan: org.plan } : null),
    [org]
  )

  if (error) {
    return (
      <>
        <PageHeader title="Organization" breadcrumbs={crumbs} />
        <ErrorState message={error} onRetry={reload} />
      </>
    )
  }

  async function unsuspend() {
    if (!org) return
    const ok = await confirm({ title: `Reactivate ${org.name}?`, description: "Its team can log in and use EventoraX again straight away.", confirmLabel: "Reactivate" })
    if (!ok) return
    try {
      await api.post(`/superadmin/tenants/${org.id}/unsuspend`)
      toast.success(`${org.name} is active again`)
      reload()
    } catch (err) {
      toast.error(errorMessage(err))
    }
  }

  const msLeft = org ? new Date(org.subscriptionEndsAt).getTime() - Date.now() : 0

  return (
    <>
      <PageHeader
        title={org?.name ?? <Skeleton className="h-8 w-64" />}
        badge={org && <StatusBadge kind="org" value={org.status} />}
        description={org ? `${org.slug} · joined ${formatDate(org.createdAt)}` : undefined}
        breadcrumbs={crumbs}
        actions={
          org && (
            <>
              <Button variant="outline" onClick={() => void impersonate(org)}>
                <LogIn /> Log in as admin
              </Button>
              <Button variant="outline" onClick={() => setDialog("plan")}>
                <Layers /> Change plan
              </Button>
              <Button variant="outline" onClick={() => setDialog("extend")}>
                <CalendarPlus /> {org.status === "trial" ? "Extend trial" : "Extend"}
              </Button>
              {org.status === "suspended" ? (
                <Button onClick={() => void unsuspend()}>
                  <RotateCcw /> Reactivate
                </Button>
              ) : (
                <Button variant="destructive" onClick={() => setDialog("suspend")}>
                  <Ban /> Suspend
                </Button>
              )}
            </>
          )
        }
      />

      {org?.status === "suspended" && (
        <div role="alert" className="mb-6 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">
          <p className="font-semibold">Suspended {org.suspendedAt ? formatRelative(org.suspendedAt) : ""}</p>
          <p className="mt-0.5">{org.suspendedReason || "No reason given."}</p>
        </div>
      )}

      <StatsRow
        loading={initialLoading}
        items={[
          { label: "Events", value: u?.events, icon: CalendarDays, accent: "purple", hint: u ? `${u.archivedEvents} archived` : undefined },
          { label: "Registrations", value: u?.registrations, icon: Users, accent: "blue", hint: u ? `${u.attended} attended` : undefined },
          { label: "Certificates", value: u?.certificates, icon: Award, accent: "amber" },
          { label: "Paid in total", value: u ? formatMoney(u.totalPaid) : undefined, icon: Wallet, accent: "green" },
        ]}
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <Panel title="Subscription">
          {!org || !u ? (
            <Skeleton className="h-48 rounded-xl" />
          ) : (
            <div>
              <Fact label="Plan">{org.plan ? `${org.plan.name} · ${formatMoney(org.plan.price)}/yr` : "No plan"}</Fact>
              <Fact label="Status">
                <StatusBadge kind="org" value={org.status} />
              </Fact>
              <Fact label={msLeft < 0 ? "Ended" : "Ends"}>
                {formatDate(org.subscriptionEndsAt)}
                <span className="block text-xs font-normal text-[#94a3b8]">{msLeft < 0 ? formatRelative(org.subscriptionEndsAt) : `${formatTimeLeft(msLeft)} left`}</span>
              </Fact>
              <Fact label="Seats">
                {u.team.admin}/{org.plan?.maxAdmins ?? "∞"} admins · {u.team.manager}/{org.plan?.maxManagers ?? "∞"} managers · {u.team.viewer} viewers
              </Fact>
              <Fact label="Pending invites">{u.pendingInvites}</Fact>
              <Fact label="Last activity">{u.lastActivityAt ? formatRelative(u.lastActivityAt) : "Never"}</Fact>
            </div>
          )}
        </Panel>

        <Panel title="Contact & branding">
          {!org ? (
            <Skeleton className="h-48 rounded-xl" />
          ) : (
            <div>
              <div className="mb-3 flex items-center gap-3">
                {org.logoUrl ? (
                  <img src={org.logoUrl} alt="" className="h-12 w-12 rounded-xl bg-white object-contain ring-1 ring-[#e9e4ff]" />
                ) : (
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl text-lg font-bold text-white" style={{ backgroundColor: org.primaryColor || "#7c3aed" }}>
                    {org.name.charAt(0)}
                  </div>
                )}
                <div className="min-w-0 text-sm">
                  <p className="flex items-center gap-1.5 truncate text-[#334155]">
                    <Mail className="h-3.5 w-3.5 text-[#94a3b8]" /> {org.email ?? "—"}
                  </p>
                  <p className="flex items-center gap-1.5 truncate text-[#334155]">
                    <Phone className="h-3.5 w-3.5 text-[#94a3b8]" /> {org.phone ?? "—"}
                  </p>
                </div>
              </div>
              <Fact label="White-label name">{org.whiteLabelName ?? "—"}</Fact>
              <Fact label="Custom domain">{org.customDomain ?? "—"}</Fact>
              <Fact label="Tickets checked in">
                <span className="inline-flex items-center gap-1">
                  <ScanLine className="h-3.5 w-3.5 text-[#94a3b8]" /> {u?.ticketsCheckedIn.toLocaleString()}
                </span>
              </Fact>
              <Fact label="ID cards printed">
                <span className="inline-flex items-center gap-1">
                  <IdCard className="h-3.5 w-3.5 text-[#94a3b8]" /> {u?.idCards.toLocaleString()}
                </span>
              </Fact>
            </div>
          )}
        </Panel>

        <Panel title="Recent activity" action={<PanelLink to={`/superadmin/security?orgId=${id}`}>All</PanelLink>}>
          {!data ? (
            <Skeleton className="h-48 rounded-xl" />
          ) : data.activity.length ? (
            <ActivityFeed items={data.activity} showOrg={false} />
          ) : (
            <p className="text-sm text-[#94a3b8]">No activity yet.</p>
          )}
        </Panel>

        <Panel title="Team" description={data ? plural(data.users.length, "person", "people") : undefined} action={<PanelLink to={`/superadmin/users?orgId=${id}`}>Manage</PanelLink>} className="lg:col-span-2">
          {!data ? (
            <Skeleton className="h-40 rounded-xl" />
          ) : (
            <ul className="divide-y divide-[#f1f5f9]">
              {data.users.map((p) => (
                <li key={p.id} className="flex items-center gap-3 py-2.5">
                  <Avatar name={p.name} size="sm" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-[#0f172a]">
                      {p.name} {!p.isActive && <span className="ml-1 text-xs font-normal text-rose-600">disabled</span>}
                    </p>
                    <p className="truncate text-xs text-[#94a3b8]">{p.email}</p>
                  </div>
                  <StatusBadge kind="role" value={p.role} />
                  <span className="hidden w-28 text-right text-xs text-[#94a3b8] sm:block">{p.lastLoginAt ? `seen ${formatRelative(p.lastLoginAt)}` : "never logged in"}</span>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel title="Payments" action={<PanelLink to={`/superadmin/revenue?orgId=${id}`}>All</PanelLink>}>
          {!data ? (
            <Skeleton className="h-40 rounded-xl" />
          ) : data.payments.length === 0 ? (
            <p className="text-sm text-[#94a3b8]">No payments yet.</p>
          ) : (
            <ul className="space-y-2">
              {data.payments.map((p) => (
                <li key={p.id} className="flex items-center justify-between gap-2 rounded-xl border border-[#e9e4ff] px-3 py-2 text-sm">
                  <div className="min-w-0">
                    <p className="font-medium text-[#0f172a]">{formatMoney(p.amount)}</p>
                    <p className="truncate text-xs text-[#94a3b8]">
                      {p.plan?.name ?? "—"} · {formatDate(p.createdAt)}
                    </p>
                  </div>
                  <StatusBadge kind="payment" value={p.status} />
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel title="Events" description="Most recent first" className="lg:col-span-3">
          {!data ? (
            <Skeleton className="h-32 rounded-xl" />
          ) : data.recentEvents.length === 0 ? (
            <p className="text-sm text-[#94a3b8]">This organization hasn't created any events yet.</p>
          ) : (
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
              {data.recentEvents.map((e) => (
                <div key={e.id} className="rounded-xl border border-[#e9e4ff] p-3">
                  <p className="truncate text-sm font-medium text-[#0f172a]" title={e.title}>
                    {e.title}
                  </p>
                  <p className="mt-0.5 text-xs text-[#94a3b8]">{formatDate(e.startDateTime)}</p>
                  <div className="mt-2 flex items-center justify-between">
                    <StatusBadge kind="event" value={e.status} />
                    <span className="inline-flex items-center gap-1 text-xs text-[#64748b]">
                      <CheckCircle2 className="h-3.5 w-3.5" /> {e.registrations}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Panel>
      </div>

      {org && (
        <section className="mt-6 rounded-2xl border border-rose-200 bg-white p-5">
          <h2 className="text-base font-semibold text-rose-700">Danger zone</h2>
          <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-[#64748b]">Permanently delete this organization and everything in it. Suspending is reversible; deleting is not.</p>
            <Button variant="destructive" onClick={() => setDialog("delete")}>
              <Trash2 /> Delete organization
            </Button>
          </div>
        </section>
      )}

      <ChangePlanDialog tenant={dialog === "plan" ? tenantForDialogs : null} plans={plansQ.data ?? []} onOpenChange={(o) => !o && setDialog(null)} onDone={reload} />
      <ExtendDialog tenant={dialog === "extend" ? tenantForDialogs : null} onOpenChange={(o) => !o && setDialog(null)} onDone={reload} />
      <SuspendDialog tenant={dialog === "suspend" ? tenantForDialogs : null} onOpenChange={(o) => !o && setDialog(null)} onDone={reload} />
      <DeleteTenantDialog tenant={dialog === "delete" ? tenantForDialogs : null} onOpenChange={(o) => !o && setDialog(null)} onDone={() => navigate("/superadmin/tenants", { replace: true })} />
    </>
  )
}
