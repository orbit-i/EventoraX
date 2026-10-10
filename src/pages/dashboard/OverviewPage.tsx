import { useState } from "react"
import { Link, useNavigate } from "react-router"
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import {
  ArrowRight,
  Award,
  CalendarDays,
  CalendarPlus,
  Check,
  ClipboardList,
  Image,
  MailCheck,
  MapPin,
  Plus,
  Upload,
  UserPlus,
  Users,
  Video,
  X,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { PageHeader } from "@/components/app/PageHeader"
import { StatsRow } from "@/components/app/StatCard"
import { StatusBadge } from "@/components/app/StatusBadge"
import { EmptyState, ErrorState } from "@/components/app/States"
import { RoleGate } from "@/components/app/RoleGate"
import { Avatar } from "@/components/app/Avatar"
import { Panel, PanelLink } from "@/components/app/Panel"
import { CapacityBar } from "@/components/events/CapacityBar"
import { useAuth } from "@/context/AuthContext"
import { useApi } from "@/hooks/useApi"
import { useCan } from "@/lib/permissions"
import { describeActivity } from "@/lib/activityText"
import { formatMonth, formatRelative, formatTime } from "@/lib/format"
import type { Overview } from "@/types/dashboard"

function greeting(): string {
  const hour = new Date().getHours()
  return hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening"
}

// ─────────────────────────── Getting started ───────────────────────────

function GettingStarted({ data }: { data: Overview }) {
  const { user, organization } = useAuth()
  const can = useCan()
  const key = `evx_onboarding_hidden_${data.organization.id}`
  const [hidden, setHidden] = useState(() => localStorage.getItem(key) === "1")

  const steps = [
    { done: Boolean(user?.emailVerified), label: "Verify your email", icon: MailCheck, to: undefined as string | undefined },
    { done: data.totals.events > 0, label: "Create your first event", icon: CalendarPlus, to: "/dashboard/events/new" },
    { done: data.totals.registrations > 0, label: "Add attendees (one by one or a CSV)", icon: ClipboardList, to: "/dashboard/registrations" },
    ...(can("manage")
      ? [
          { done: data.totals.teamMembers > 1, label: "Invite a teammate", icon: UserPlus, to: "/dashboard/team" },
          { done: Boolean(organization?.logoUrl), label: "Add your logo", icon: Image, to: "/dashboard/settings?tab=branding" },
        ]
      : []),
  ]
  const doneCount = steps.filter((s) => s.done).length
  if (hidden || doneCount === steps.length) return null

  return (
    <section className="mb-6 rounded-2xl border border-[#ddd6fe] bg-gradient-to-br from-white to-[#f5f3ff] p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-[#0f172a]">Get started with EventoraX</h2>
          <p className="text-sm text-[#64748b]">
            {doneCount} of {steps.length} done
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            localStorage.setItem(key, "1")
            setHidden(true)
          }}
          className="rounded-lg p-1.5 text-[#94a3b8] hover:bg-white hover:text-[#475569]"
          aria-label="Hide getting started"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
      <div className="my-4 h-1.5 overflow-hidden rounded-full bg-[#ede9fe]">
        <div className="h-full rounded-full bg-[#7c3aed] transition-all" style={{ width: `${(doneCount / steps.length) * 100}%` }} />
      </div>
      <ol className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {steps.map((step) => {
          const Icon = step.icon
          const inner = (
            <>
              <span
                className={cn(
                  "flex h-7 w-7 shrink-0 items-center justify-center rounded-full",
                  step.done ? "bg-emerald-500 text-white" : "bg-[#ede9fe] text-[#7c3aed]"
                )}
              >
                {step.done ? <Check className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
              </span>
              <span className={cn("text-sm", step.done ? "text-[#94a3b8] line-through" : "font-medium text-[#0f172a]")}>{step.label}</span>
            </>
          )
          return (
            <li key={step.label}>
              {step.to && !step.done ? (
                <Link to={step.to} className="flex items-center gap-3 rounded-xl bg-white p-3 ring-1 ring-[#e9e4ff] transition hover:ring-[#c4b5fd]">
                  {inner}
                </Link>
              ) : (
                <div className="flex items-center gap-3 rounded-xl bg-white/60 p-3 ring-1 ring-[#e9e4ff]">{inner}</div>
              )}
            </li>
          )
        })}
      </ol>
    </section>
  )
}

// ─────────────────────────── Page ───────────────────────────

export default function OverviewPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const can = useCan()
  const { data, error, initialLoading, reload } = useApi<Overview>("/dashboard/overview")

  if (error) return <ErrorState message={error} onRetry={reload} />

  const firstName = user?.name.split(" ")[0] ?? ""
  const trend = (data?.registrationTrend ?? []).map((m) => ({ month: formatMonth(m.month), count: m.count }))
  const trendTotal = trend.reduce((sum, m) => sum + m.count, 0)

  return (
    <>
      <PageHeader
        title={`${greeting()}, ${firstName}`}
        description="Here's what's happening across your events."
        actions={
          <RoleGate need="write">
            <Button onClick={() => navigate("/dashboard/events/new")}>
              <Plus /> New event
            </Button>
          </RoleGate>
        }
      />

      {data && <GettingStarted data={data} />}

      <StatsRow
        loading={initialLoading}
        items={[
          { label: "Events", value: data?.totals.events, icon: CalendarDays, accent: "purple", hint: "not archived" },
          { label: "Registrations", value: data?.totals.registrations, icon: Users, accent: "blue", hint: "excluding cancelled" },
          { label: "Certificates", value: data?.totals.certificates, icon: Award, accent: "green", hint: "issued" },
          { label: "Team members", value: data?.totals.teamMembers, icon: UserPlus, accent: "amber" },
        ]}
      />

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Registration trend */}
        <Panel title="Registrations — last 6 months" className="lg:col-span-2" action={<span className="text-sm text-[#64748b]">{trendTotal.toLocaleString()} total</span>}>
          {initialLoading ? (
            <Skeleton className="h-56 w-full rounded-xl" />
          ) : trendTotal === 0 ? (
            <EmptyState icon={Users} title="No registrations yet" description="Registrations will show up here month by month." compact />
          ) : (
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trend} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="regFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#7c3aed" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="#7c3aed" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="month" tick={{ fontSize: 12, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{ borderRadius: 12, border: "1px solid #e9e4ff", fontSize: 13 }}
                    formatter={(value) => [Number(value).toLocaleString(), "Registrations"]}
                  />
                  <Area type="monotone" dataKey="count" stroke="#7c3aed" strokeWidth={2} fill="url(#regFill)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </Panel>

        {/* Quick actions */}
        <Panel title="Quick actions">
          {can("write") ? (
            <div className="grid gap-2">
              {[
                { label: "Create an event", icon: CalendarPlus, to: "/dashboard/events/new" },
                { label: "Add an attendee", icon: UserPlus, to: "/dashboard/registrations/new" },
                { label: "Import attendees (CSV)", icon: Upload, to: "/dashboard/registrations/import" },
                ...(can("manage") ? [{ label: "Invite a teammate", icon: Users, to: "/dashboard/team" }] : []),
              ].map((a) => (
                <Link
                  key={a.to}
                  to={a.to}
                  className="flex items-center gap-3 rounded-xl border border-[#e9e4ff] p-3 text-sm font-medium text-[#0f172a] transition-colors hover:border-[#c4b5fd] hover:bg-[#faf8ff]"
                >
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#f5f3ff] text-[#7c3aed]">
                    <a.icon className="h-4 w-4" />
                  </span>
                  {a.label}
                  <ArrowRight className="ml-auto h-4 w-4 text-[#cbd5e1]" />
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-sm text-[#64748b]">You have view-only access. Ask an admin if you need to make changes.</p>
          )}
        </Panel>

        {/* Upcoming events */}
        <Panel title="Upcoming events" className="lg:col-span-2" action={<PanelLink to="/dashboard/events">All events</PanelLink>}>
          {initialLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }, (_, i) => (
                <Skeleton key={i} className="h-16 rounded-xl" />
              ))}
            </div>
          ) : (data?.upcomingEvents ?? []).length === 0 ? (
            <EmptyState
              icon={CalendarDays}
              title="Nothing coming up"
              description="Upcoming events will appear here."
              compact
              action={
                can("write") && (
                  <Button size="sm" onClick={() => navigate("/dashboard/events/new")}>
                    <Plus /> New event
                  </Button>
                )
              }
            />
          ) : (
            <ul className="divide-y divide-[#f1f5f9]">
              {data!.upcomingEvents.map((e) => {
                const start = new Date(e.startDateTime)
                return (
                  <li key={e.id}>
                    <Link to={`/dashboard/events/${e.id}`} className="-mx-2 flex items-center gap-4 rounded-xl px-2 py-3 transition-colors hover:bg-[#faf8ff]">
                      <div className="flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-xl bg-[#f5f3ff] text-[#7c3aed]">
                        <span className="text-[10px] font-semibold uppercase">{start.toLocaleDateString("en-PK", { month: "short" })}</span>
                        <span className="text-lg font-bold leading-none">{start.getDate()}</span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium text-[#0f172a]">{e.title}</p>
                        <p className="flex items-center gap-1 truncate text-xs text-[#64748b]">
                          {formatTime(e.startDateTime)} ·{" "}
                          {e.mode === "ONLINE" ? <Video className="h-3 w-3" /> : <MapPin className="h-3 w-3" />}
                          {e.mode === "ONLINE" ? "Online" : e.location || "Venue to be announced"}
                        </p>
                      </div>
                      <div className="hidden w-32 sm:block">
                        <CapacityBar registered={e._count.registrations} max={e.maxAttendees} compact />
                      </div>
                      <StatusBadge kind="event" value={e.status} />
                    </Link>
                  </li>
                )
              })}
            </ul>
          )}
        </Panel>

        {/* Recent activity */}
        <Panel title="Recent activity" action={can("manage") ? <PanelLink to="/dashboard/activity">Full log</PanelLink> : undefined}>
          {initialLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }, (_, i) => (
                <Skeleton key={i} className="h-10 rounded-xl" />
              ))}
            </div>
          ) : (data?.recentActivity ?? []).length === 0 ? (
            <p className="text-sm text-[#94a3b8]">No activity yet.</p>
          ) : (
            <ul className="space-y-3">
              {data!.recentActivity.map((a) => (
                <li key={a.id} className="flex items-start gap-3">
                  <Avatar name={a.user?.name ?? "System"} size="sm" />
                  <div className="min-w-0 text-sm">
                    <p className="text-[#334155]">
                      <span className="font-semibold text-[#0f172a]">{a.user?.name ?? "System"}</span> {describeActivity(a)}
                    </p>
                    <p className="text-xs text-[#94a3b8]">{formatRelative(a.createdAt)}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>
    </>
  )
}