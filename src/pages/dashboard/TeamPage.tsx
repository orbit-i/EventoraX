import { useState } from "react"
import { toast } from "sonner"
import { Mail, RotateCw, ShieldCheck, Trash2, UserPlus, Users, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { PageHeader } from "@/components/app/PageHeader"
import { Panel } from "@/components/app/Panel"
import { Toolbar, SearchInput, FilterSelect } from "@/components/app/Toolbar"
import { ServerTable, type Column } from "@/components/app/ServerTable"
import { EmptyState, ErrorState, NoResults } from "@/components/app/States"
import { StatusBadge } from "@/components/app/StatusBadge"
import { RowActions } from "@/components/app/RowActions"
import { Avatar } from "@/components/app/Avatar"
import { useConfirm } from "@/components/app/ConfirmDialog"
import { InviteDialog } from "@/components/team/InviteDialog"
import { ROLE_INFO, seatsLeft } from "@/components/team/roles"
import { useAuth } from "@/context/AuthContext"
import { useApi } from "@/hooks/useApi"
import { useUrlState } from "@/hooks/useUrlState"
import { useCan } from "@/lib/permissions"
import { api, errorMessage } from "@/lib/api"
import { formatDate, formatRelative, formatTimeLeft } from "@/lib/format"
import { statusOptions } from "@/lib/status"
import type { SeatUsage, TeamMember, TeamResponse, TeamRole } from "@/types/team"

function SeatCard({ label, seat, count }: { label: string; seat?: SeatUsage; count?: number }) {
  const used = seat?.used ?? count ?? 0
  const limit = seat?.limit ?? null
  const full = limit !== null && used >= limit
  const pct = limit ? Math.min(100, (used / limit) * 100) : 0
  return (
    <div className="rounded-2xl border border-[#e9e4ff] bg-white p-4 shadow-sm">
      <p className="text-xs font-medium uppercase tracking-wide text-[#64748b]">{label}</p>
      <p className="mt-1 text-2xl font-bold tabular-nums text-[#0f172a]">
        {used.toLocaleString()}
        <span className="text-base font-medium text-[#94a3b8]">{limit === null ? "" : ` / ${limit}`}</span>
      </p>
      {limit === null ? (
        <p className="mt-2 text-xs text-[#94a3b8]">Unlimited on your plan</p>
      ) : (
        <>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[#f1f5f9]">
            <div className={cn("h-full rounded-full", full ? "bg-rose-500" : "bg-[#7c3aed]")} style={{ width: `${pct}%` }} />
          </div>
          <p className={cn("mt-1.5 text-xs", full ? "font-medium text-rose-600" : "text-[#94a3b8]")}>
            {full ? "All seats used — upgrade or free one" : `${seatsLeft(seat!)} left · pending invites count`}
          </p>
        </>
      )}
    </div>
  )
}

export default function TeamPage() {
  const { user } = useAuth()
  const can = useCan()
  const manage = can("manage")
  const confirm = useConfirm()
  const { data, error, initialLoading, loading, reload } = useApi<TeamResponse>("/team")
  const { values, set, reset } = useUrlState({ search: "", role: "" })
  const [inviteOpen, setInviteOpen] = useState(false)
  const [busyId, setBusyId] = useState<string | null>(null)

  const members = data?.members ?? []
  const invites = data?.pendingInvites ?? []
  const adminCount = members.filter((m) => m.role === "admin").length
  const search = values.search.toLowerCase()
  const shown = members.filter(
    (m) => (!values.role || m.role === values.role) && (!search || m.name.toLowerCase().includes(search) || m.email.toLowerCase().includes(search))
  )
  const hasFilters = Boolean(values.search || values.role)

  /** Seat check for moving `member` into `role` (their own seat is freed only if they leave a limited role). */
  function roleBlocked(member: TeamMember, role: TeamRole): string | null {
    if (role === member.role || role === "viewer" || !data) return null
    const left = seatsLeft(data.seats[role])
    return left === 0 ? "No seats left" : null
  }

  async function changeRole(member: TeamMember, role: TeamRole, isUndo = false) {
    if (role === member.role) return
    if (!isUndo && member.role === "admin") {
      const ok = await confirm({
        title: `Make ${member.name} a ${ROLE_INFO[role].label.toLowerCase()}?`,
        description: "They will lose access to team, billing and settings.",
        confirmLabel: "Change role",
      })
      if (!ok) return
    }
    setBusyId(member.id)
    try {
      await api.patch(`/team/${member.id}/role`, { role })
      reload()
      const msg = `${member.name} is now ${role === "admin" ? "an admin" : `a ${role}`}`
      if (isUndo) toast.success(msg)
      else toast.success(msg, { action: { label: "Undo", onClick: () => void changeRole({ ...member, role }, member.role, true) } })
    } catch (err) {
      toast.error(errorMessage(err))
    } finally {
      setBusyId(null)
    }
  }

  async function removeMember(member: TeamMember) {
    const ok = await confirm({
      title: `Remove ${member.name}?`,
      description: (
        <>
          <strong>{member.email}</strong> will lose access straight away and their account will be deleted. Their past activity stays in the
          activity log. You can invite them again later.
        </>
      ),
      confirmLabel: "Remove from team",
      tone: "danger",
    })
    if (!ok) return
    setBusyId(member.id)
    try {
      await api.delete(`/team/${member.id}`)
      toast.success(`${member.name} was removed from the team`)
      reload()
    } catch (err) {
      toast.error(errorMessage(err))
    } finally {
      setBusyId(null)
    }
  }

  async function resendInvite(id: string, email: string) {
    setBusyId(id)
    try {
      await api.post(`/team/invites/${id}/resend`)
      toast.success(`New invite sent to ${email}`, { description: "The previous link no longer works." })
      reload()
    } catch (err) {
      toast.error(errorMessage(err))
    } finally {
      setBusyId(null)
    }
  }

  async function cancelInvite(id: string, email: string) {
    const ok = await confirm({
      title: "Cancel this invite?",
      description: `The link sent to ${email} will stop working and the seat is freed.`,
      confirmLabel: "Cancel invite",
      cancelLabel: "Keep invite",
      tone: "danger",
    })
    if (!ok) return
    setBusyId(id)
    try {
      await api.delete(`/team/invites/${id}`)
      toast.success(`Invite for ${email} cancelled`)
      reload()
    } catch (err) {
      toast.error(errorMessage(err))
    } finally {
      setBusyId(null)
    }
  }

  const columns: Column<TeamMember>[] = [
    {
      key: "member",
      header: "Member",
      cell: (m) => (
        <div className="flex items-center gap-3">
          <Avatar name={m.name} size="sm" />
          <div className="min-w-0">
            <p className="flex items-center gap-2 truncate font-medium text-[#0f172a]">
              {m.name}
              {m.id === user?.id && <span className="rounded-full bg-[#f5f3ff] px-2 py-0.5 text-[10px] font-semibold text-[#7c3aed]">You</span>}
            </p>
            <p className="truncate text-xs text-[#94a3b8]">{m.email}</p>
          </div>
        </div>
      ),
    },
    {
      key: "role",
      header: "Role",
      cell: (m) => {
        const isSelf = m.id === user?.id
        const lastAdmin = m.role === "admin" && adminCount <= 1
        if (!manage || isSelf || lastAdmin) {
          return (
            <span title={isSelf ? "You can't change your own role" : lastAdmin ? "The organization needs at least one admin" : undefined}>
              <StatusBadge kind="role" value={m.role} />
            </span>
          )
        }
        return (
          <Select value={m.role} onValueChange={(r) => void changeRole(m, r as TeamRole)} disabled={busyId === m.id}>
            <SelectTrigger className="h-8 w-32 bg-white" aria-label={`Role for ${m.name}`}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(Object.keys(ROLE_INFO) as TeamRole[]).map((r) => {
                const blocked = roleBlocked(m, r)
                return (
                  <SelectItem key={r} value={r} disabled={Boolean(blocked)}>
                    {ROLE_INFO[r].label}
                    {blocked && <span className="ml-1 text-xs text-[#94a3b8]">({blocked})</span>}
                  </SelectItem>
                )
              })}
            </SelectContent>
          </Select>
        )
      },
    },
    {
      key: "status",
      header: "Status",
      hideBelow: "md",
      cell: (m) =>
        !m.isActive ? (
          <span className="text-xs font-medium text-rose-600">Disabled</span>
        ) : m.emailVerified ? (
          <span className="text-xs font-medium text-emerald-600">Active</span>
        ) : (
          <span className="text-xs font-medium text-amber-600">Email not verified</span>
        ),
    },
    {
      key: "lastLogin",
      header: "Last login",
      hideBelow: "lg",
      cell: (m) => <span className="text-[#64748b]">{m.lastLoginAt ? formatRelative(m.lastLoginAt) : "Never"}</span>,
    },
    {
      key: "joined",
      header: "Joined",
      hideBelow: "lg",
      cell: (m) => <span className="text-[#64748b]">{formatDate(m.createdAt)}</span>,
    },
    ...(manage
      ? [
          {
            key: "actions",
            header: <span className="sr-only">Actions</span>,
            align: "right" as const,
            cell: (m: TeamMember) => (
              <RowActions
                label={`Actions for ${m.name}`}
                actions={[
                  {
                    label: "Remove from team",
                    icon: Trash2,
                    destructive: true,
                    onClick: () => void removeMember(m),
                    hidden: m.id === user?.id,
                    disabled: busyId === m.id || (m.role === "admin" && adminCount <= 1),
                  },
                ]}
              />
            ),
          },
        ]
      : []),
  ]

  if (error) {
    return (
      <>
        <PageHeader title="Team" breadcrumbs={[{ label: "Dashboard", to: "/dashboard" }, { label: "Team" }]} />
        <ErrorState message={error} onRetry={reload} />
      </>
    )
  }

  return (
    <>
      <PageHeader
        title="Team"
        description="People who can work in this organization and what they're allowed to do."
        breadcrumbs={[{ label: "Dashboard", to: "/dashboard" }, { label: "Team" }]}
        actions={
          manage && (
            <Button onClick={() => setInviteOpen(true)} disabled={initialLoading}>
              <UserPlus /> Invite member
            </Button>
          )
        }
      />

      {/* Seat usage */}
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        {initialLoading ? (
          Array.from({ length: 3 }, (_, i) => <Skeleton key={i} className="h-28 rounded-2xl" />)
        ) : (
          <>
            <SeatCard label="Admins" seat={data?.seats.admin} />
            <SeatCard label="Managers" seat={data?.seats.manager} />
            <SeatCard label="Viewers" count={members.filter((m) => m.role === "viewer").length + invites.filter((i) => i.role === "viewer").length} />
          </>
        )}
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <div className="space-y-6 xl:col-span-2">
          {/* Members */}
          <section>
            <Toolbar end={<span className="text-sm text-[#64748b]">{members.length.toLocaleString()} members</span>}>
              <SearchInput value={values.search} onChange={(v) => set({ search: v })} placeholder="Search name or email…" />
              <FilterSelect value={values.role} onChange={(role) => set({ role })} allLabel="All roles" options={statusOptions("role")} className="sm:w-36" />
            </Toolbar>
            {!loading && shown.length === 0 ? (
              hasFilters ? (
                <NoResults onClear={() => reset([])} />
              ) : (
                <EmptyState icon={Users} title="No team members" compact />
              )
            ) : (
              <ServerTable columns={columns} rows={shown} rowKey={(m) => m.id} loading={initialLoading} skeletonRows={3} />
            )}
          </section>

          {/* Pending invites */}
          {(invites.length > 0 || manage) && !initialLoading && (
            <Panel title="Pending invites" description={invites.length ? "Invites expire after 7 days. Resending creates a new link." : undefined}>
              {invites.length === 0 ? (
                <p className="text-sm text-[#94a3b8]">No pending invites.</p>
              ) : (
                <ul className="divide-y divide-[#f1f5f9]">
                  {invites.map((inv) => (
                    <li key={inv.id} className="flex flex-wrap items-center gap-3 py-3">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#f5f3ff] text-[#7c3aed]">
                        <Mail className="h-4 w-4" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-[#0f172a]">{inv.email}</p>
                        <p className="text-xs text-[#94a3b8]">
                          Invited {formatRelative(inv.createdAt)}
                          {inv.invitedBy ? ` by ${inv.invitedBy.name}` : ""} · expires in {formatTimeLeft(new Date(inv.expiresAt).getTime() - Date.now())}
                        </p>
                      </div>
                      <StatusBadge kind="role" value={inv.role} />
                      {manage && (
                        <div className="flex gap-1">
                          <Button variant="ghost" size="sm" onClick={() => void resendInvite(inv.id, inv.email)} disabled={busyId === inv.id}>
                            <RotateCw className={cn(busyId === inv.id && "animate-spin")} /> Resend
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => void cancelInvite(inv.id, inv.email)}
                            disabled={busyId === inv.id}
                            aria-label={`Cancel invite for ${inv.email}`}
                            className="text-[#94a3b8] hover:text-rose-600"
                          >
                            <X />
                          </Button>
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </Panel>
          )}
        </div>

        {/* Role guide */}
        <Panel title="Roles" description="What each role can do">
          <ul className="space-y-3">
            {(Object.keys(ROLE_INFO) as TeamRole[]).map((r) => (
              <li key={r} className="flex items-start gap-3">
                <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-[#7c3aed]" />
                <div>
                  <p className="text-sm font-medium text-[#0f172a]">{ROLE_INFO[r].label}</p>
                  <p className="text-xs text-[#64748b]">{ROLE_INFO[r].description}</p>
                </div>
              </li>
            ))}
          </ul>
          {!manage && <p className="mt-4 rounded-xl bg-[#faf8ff] p-3 text-xs text-[#64748b]">Only admins can invite people or change roles.</p>}
        </Panel>
      </div>

      {manage && <InviteDialog open={inviteOpen} onOpenChange={setInviteOpen} seats={data?.seats} onInvited={reload} />}
    </>
  )
}
