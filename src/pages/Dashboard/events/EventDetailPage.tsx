import type { ReactNode } from "react"
import { Link, useNavigate, useParams, useSearchParams } from "react-router"
import {
  Archive,
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  Clock,
  Copy,
  ExternalLink,
  Handshake,
  ListOrdered,
  MapPin,
  Mic2,
  Pencil,
  RotateCcw,
  Tag,
  Ticket,
  Trash2,
  Upload,
  UserCheck,
  UserPlus,
  Users,
  Video,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { PageHeader } from "@/components/app/PageHeader"
import { StatsRow } from "@/components/app/StatCard"
import { StatusBadge } from "@/components/app/StatusBadge"
import { RowActions } from "@/components/app/RowActions"
import { EmptyState, ErrorState } from "@/components/app/States"
import { RoleGate } from "@/components/app/RoleGate"
import { useEventActions } from "@/components/events/useEventActions"
import { useApi } from "@/hooks/useApi"
import { useCan } from "@/lib/permissions"
import { buildQuery } from "@/lib/api"
import { formatDateTime, formatDuration, formatPKR, formatTime, plural } from "@/lib/format"
import { REGISTRATION_STATUS, TONE_CLASSES } from "@/lib/status"
import type { EventItem, EventStats } from "@/types/event"

const TABS = ["overview", "registrations", "speakers", "sponsors", "schedule"] as const
type Tab = (typeof TABS)[number]

interface SpeakerPreview {
  id: string
  firstName: string
  lastName: string
  title: string | null
  company: string | null
  photo: string | null
}
interface SponsorPreview {
  id: string
  name: string
  tier: string
  logo: string | null
}
interface SessionPreview {
  id: string
  title: string
  startTime: string
  endTime: string
  location: string | null
  speaker: { firstName: string; lastName: string } | null
}

function Card({ title, children, action }: { title: string; children: ReactNode; action?: ReactNode }) {
  return (
    <section className="rounded-2xl border border-[#e9e4ff] bg-white p-6 shadow-sm">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="text-base font-semibold text-[#0f172a]">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  )
}

function Detail({ icon: Icon, label, children }: { icon: typeof CalendarDays; label: string; children: ReactNode }) {
  return (
    <div className="flex gap-3">
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-[#a78bfa]" />
      <div className="min-w-0">
        <p className="text-xs font-medium uppercase tracking-wide text-[#94a3b8]">{label}</p>
        <div className="text-sm text-[#0f172a]">{children}</div>
      </div>
    </div>
  )
}

function ManageLink({ to, label }: { to: string; label: string }) {
  return (
    <Button asChild variant="outline" size="sm">
      <Link to={to}>
        {label} <ArrowRight />
      </Link>
    </Button>
  )
}

export default function EventDetailPage() {
  const { id = "" } = useParams()
  const navigate = useNavigate()
  const [params, setParams] = useSearchParams()
  const can = useCan()
  const actions = useEventActions()

  const tabParam = params.get("tab")
  const tab: Tab = TABS.includes(tabParam as Tab) ? (tabParam as Tab) : "overview"
  const setTab = (t: string) => setParams(t === "overview" ? {} : { tab: t }, { replace: true })

  const eventQ = useApi<EventItem>(`/events/${id}`)
  const statsQ = useApi<EventStats>(`/events/${id}/stats`)
  const speakersQ = useApi<SpeakerPreview[]>(tab === "speakers" ? `/speakers${buildQuery({ eventId: id, limit: 6 })}` : null)
  const sponsorsQ = useApi<SponsorPreview[]>(tab === "sponsors" ? `/sponsors${buildQuery({ eventId: id, limit: 8 })}` : null)
  const sessionsQ = useApi<SessionPreview[]>(tab === "schedule" ? `/sessions${buildQuery({ eventId: id, limit: 6 })}` : null)

  const event = eventQ.data
  const stats = statsQ.data
  const reloadAll = () => {
    eventQ.reload()
    statsQ.reload()
  }

  if (eventQ.error) {
    return (
      <ErrorState
        message={eventQ.error === "Event not found" ? "This event doesn't exist or was deleted." : eventQ.error}
        onRetry={eventQ.error === "Event not found" ? undefined : eventQ.reload}
      />
    )
  }

  if (!event) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-16 w-2/3" />
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {Array.from({ length: 4 }, (_, i) => (
            <Skeleton key={i} className="h-24 rounded-2xl" />
          ))}
        </div>
        <Skeleton className="h-72 rounded-2xl" />
      </div>
    )
  }

  const archived = event.status === "ARCHIVED"
  const reg = stats?.registrations
  const q = `?eventId=${event.id}`

  return (
    <>
      <PageHeader
        title={event.title}
        breadcrumbs={[
          { label: "Dashboard", to: "/dashboard" },
          { label: "Events", to: "/dashboard/events" },
          { label: event.title },
        ]}
        badge={
          <>
            <StatusBadge kind="event" value={event.status} />
            <StatusBadge kind="mode" value={event.mode} />
          </>
        }
        description={
          <span className="flex flex-wrap items-center gap-x-4 gap-y-1">
            <span className="flex items-center gap-1.5">
              <CalendarDays className="h-4 w-4" /> {formatDateTime(event.startDateTime)}
            </span>
            <span className={event.registrationOpen ? "text-emerald-600" : "text-[#94a3b8]"}>
              ● Registration {event.registrationOpen ? "open" : "closed"}
            </span>
          </span>
        }
        actions={
          <RoleGate need="write">
            {!archived && (
              <Button variant="outline" onClick={() => navigate(`/dashboard/events/${event.id}/edit`)}>
                <Pencil /> Edit
              </Button>
            )}
            <RowActions
              label="More actions"
              actions={[
                {
                  label: "Duplicate",
                  icon: Copy,
                  onClick: async () => {
                    const copy = await actions.duplicate(event)
                    if (copy) navigate(`/dashboard/events/${copy.id}`)
                  },
                },
                {
                  label: "Archive",
                  icon: Archive,
                  hidden: archived,
                  onClick: async () => {
                    if (await actions.archive(event)) reloadAll()
                  },
                },
                {
                  label: "Delete",
                  icon: Trash2,
                  destructive: true,
                  separatorBefore: true,
                  onClick: async () => {
                    const result = await actions.remove({ ...event, _count: { registrations: reg?.total ?? 0 } })
                    if (result === "deleted") navigate("/dashboard/events")
                    if (result === "archived") reloadAll()
                  },
                },
              ]}
            />
          </RoleGate>
        }
      />

      {archived && (
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4">
          <div className="flex items-start gap-3 text-sm text-amber-800">
            <Archive className="mt-0.5 h-4 w-4 shrink-0" />
            <span>
              This event is <strong>archived</strong>. Its records are kept and can be viewed, but it's hidden from your
              events list and closed to registration.
            </span>
          </div>
          {can("write") && (
            <Button
              variant="outline"
              size="sm"
              onClick={async () => {
                if (await actions.restore(event)) reloadAll()
              }}
            >
              <RotateCcw /> Restore event
            </Button>
          )}
        </div>
      )}

      <StatsRow
        loading={!stats}
        items={[
          {
            label: "Registered",
            value: reg?.active,
            icon: Users,
            accent: "blue",
            hint: reg?.maxAttendees ? `of ${reg.maxAttendees.toLocaleString()} seats` : "no seat limit",
          },
          { label: "Attended", value: reg?.ATTENDED, icon: UserCheck, accent: "green", hint: `${reg?.attendanceRate ?? 0}% attendance` },
          {
            label: "Seats left",
            value: reg?.seatsLeft === null ? "∞" : reg?.seatsLeft,
            icon: Ticket,
            accent: reg?.seatsLeft === 0 ? "red" : "purple",
            hint: reg?.seatsLeft === 0 ? "Event is full" : undefined,
          },
          {
            label: "Checked in",
            value: stats?.tickets.checkedIn,
            icon: CheckCircle2,
            accent: "amber",
            hint: stats ? `of ${plural(stats.tickets.total, "ticket")}` : undefined,
          },
        ]}
      />

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="mb-4 flex h-auto w-full justify-start overflow-x-auto rounded-2xl border border-[#e9e4ff] bg-white p-1">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="registrations">Registrations {reg ? `(${reg.total})` : ""}</TabsTrigger>
          <TabsTrigger value="speakers">Speakers {stats ? `(${stats.speakers.total})` : ""}</TabsTrigger>
          <TabsTrigger value="sponsors">Sponsors {stats ? `(${stats.sponsors.total})` : ""}</TabsTrigger>
          <TabsTrigger value="schedule">Schedule {stats ? `(${stats.sessions.total})` : ""}</TabsTrigger>
        </TabsList>

        {/* ── Overview ── */}
        <TabsContent value="overview" className="grid gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            <Card title="About this event">
              {event.description ? (
                <p className="whitespace-pre-line text-sm leading-relaxed text-[#334155]">{event.description}</p>
              ) : (
                <p className="text-sm text-[#94a3b8]">No description yet.</p>
              )}
            </Card>
            <Card title="Attendee categories">
              {event.categories && event.categories.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {event.categories.map((c) => (
                    <span
                      key={c.id}
                      className="inline-flex items-center gap-1.5 rounded-full border border-[#e9e4ff] bg-[#f5f3ff] px-3 py-1 text-sm font-medium text-[#5b21b6]"
                    >
                      <Tag className="h-3.5 w-3.5" /> {c.label}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-[#94a3b8]">No categories — everyone is "General".</p>
              )}
            </Card>
          </div>
          <Card title="Details">
            <div className="space-y-4">
              <Detail icon={Clock} label="When">
                {formatDateTime(event.startDateTime)}
                <br />
                <span className="text-[#64748b]">until {formatDateTime(event.endDateTime)}</span>
              </Detail>
              {event.mode !== "ONLINE" && (
                <Detail icon={MapPin} label="Venue">
                  {event.location || "To be announced"}
                </Detail>
              )}
              {event.mode !== "OFFLINE" && (
                <Detail icon={Video} label="Meeting link">
                  {event.meetingLink ? (
                    <a href={event.meetingLink} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-[#7c3aed] hover:underline">
                      Open link <ExternalLink className="h-3 w-3" />
                    </a>
                  ) : (
                    "Not set"
                  )}
                </Detail>
              )}
              {event.organizer && (
                <Detail icon={Users} label="Organizer">
                  {event.organizer}
                </Detail>
              )}
              {event.topic && (
                <Detail icon={Mic2} label="Topic">
                  {event.topic}
                </Detail>
              )}
              <Detail icon={Ticket} label="Ticket price">
                {formatPKR(event.ticketPrice)}
              </Detail>
              <Detail icon={CheckCircle2} label="Certificates">
                {event.autoIssueCert ? "Issued automatically on attendance" : "Issued manually"}
              </Detail>
            </div>
          </Card>
        </TabsContent>

        {/* ── Registrations ── */}
        <TabsContent value="registrations">
          <Card
            title="Registrations"
            action={
              <div className="flex flex-wrap gap-2">
                <RoleGate need="write">
                  {!archived && (
                    <>
                      <Button asChild variant="outline" size="sm">
                        <Link to={`/dashboard/registrations/import${q}`}>
                          <Upload /> Import CSV
                        </Link>
                      </Button>
                      <Button asChild variant="outline" size="sm">
                        <Link to={`/dashboard/registrations/new${q}`}>
                          <UserPlus /> Add attendee
                        </Link>
                      </Button>
                    </>
                  )}
                </RoleGate>
                <ManageLink to={`/dashboard/registrations${q}`} label="Open registrations" />
              </div>
            }
          >
            {!reg || reg.total === 0 ? (
              <EmptyState icon={Users} title="No registrations yet" description="Add attendees one by one or import a CSV." compact />
            ) : (
              <div className="space-y-4">
                <div className="flex h-3 overflow-hidden rounded-full bg-[#f1f5f9]">
                  {(["ATTENDED", "REGISTERED", "ABSENT", "CANCELLED"] as const).map((s) =>
                    reg[s] > 0 ? (
                      <div
                        key={s}
                        className={TONE_CLASSES[REGISTRATION_STATUS[s]!.tone].dot}
                        style={{ width: `${(reg[s] / reg.total) * 100}%` }}
                        title={`${REGISTRATION_STATUS[s]!.label}: ${reg[s]}`}
                      />
                    ) : null
                  )}
                </div>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {(["REGISTERED", "ATTENDED", "ABSENT", "CANCELLED"] as const).map((s) => (
                    <Link
                      key={s}
                      to={`/dashboard/registrations${q}&status=${s}`}
                      className="rounded-xl border border-[#e9e4ff] p-3 transition-colors hover:border-[#c4b5fd] hover:bg-[#faf8ff]"
                    >
                      <StatusBadge kind="registration" value={s} />
                      <p className="mt-2 text-xl font-bold tabular-nums text-[#0f172a]">{reg[s].toLocaleString()}</p>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </Card>
        </TabsContent>

        {/* ── Speakers ── */}
        <TabsContent value="speakers">
          <Card title="Speakers" action={<ManageLink to={`/dashboard/speakers${q}`} label="Manage speakers" />}>
            {speakersQ.initialLoading ? (
              <Skeleton className="h-24 rounded-xl" />
            ) : (speakersQ.data ?? []).length === 0 ? (
              <EmptyState icon={Mic2} title="No speakers yet" compact />
            ) : (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {speakersQ.data!.map((s) => (
                  <div key={s.id} className="flex items-center gap-3 rounded-xl border border-[#e9e4ff] p-3">
                    {s.photo ? (
                      <img src={s.photo} alt="" className="h-11 w-11 rounded-full object-cover" />
                    ) : (
                      <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#ede9fe] text-sm font-bold text-[#7c3aed]">
                        {s.firstName[0]}
                        {s.lastName[0]}
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-[#0f172a]">
                        {s.firstName} {s.lastName}
                      </p>
                      <p className="truncate text-xs text-[#64748b]">{[s.title, s.company].filter(Boolean).join(" · ") || "—"}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {stats && stats.speakers.total > 6 && (
              <p className="mt-3 text-xs text-[#94a3b8]">and {stats.speakers.total - 6} more…</p>
            )}
          </Card>
        </TabsContent>

        {/* ── Sponsors ── */}
        <TabsContent value="sponsors">
          <Card title="Sponsors" action={<ManageLink to={`/dashboard/sponsors${q}`} label="Manage sponsors" />}>
            {sponsorsQ.initialLoading ? (
              <Skeleton className="h-24 rounded-xl" />
            ) : (sponsorsQ.data ?? []).length === 0 ? (
              <EmptyState icon={Handshake} title="No sponsors yet" compact />
            ) : (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {sponsorsQ.data!.map((s) => (
                  <div key={s.id} className="flex flex-col items-center gap-2 rounded-xl border border-[#e9e4ff] p-4 text-center">
                    {s.logo ? (
                      <img src={s.logo} alt="" className="h-12 w-full object-contain" />
                    ) : (
                      <div className="flex h-12 items-center text-sm font-semibold text-[#64748b]">{s.name}</div>
                    )}
                    <p className="w-full truncate text-xs font-medium text-[#0f172a]">{s.name}</p>
                    <StatusBadge kind="tier" value={s.tier} />
                  </div>
                ))}
              </div>
            )}
          </Card>
        </TabsContent>

        {/* ── Schedule ── */}
        <TabsContent value="schedule">
          <Card
            title={`Schedule${stats && stats.sessions.totalMinutes > 0 ? ` · ${formatDuration(stats.sessions.totalMinutes)} total` : ""}`}
            action={<ManageLink to={`/dashboard/schedule${q}`} label="Manage schedule" />}
          >
            {sessionsQ.initialLoading ? (
              <Skeleton className="h-24 rounded-xl" />
            ) : (sessionsQ.data ?? []).length === 0 ? (
              <EmptyState icon={ListOrdered} title="No sessions yet" compact />
            ) : (
              <ol className="space-y-2">
                {sessionsQ.data!.map((s) => (
                  <li key={s.id} className="flex items-start gap-4 rounded-xl border border-[#e9e4ff] p-3">
                    <p className="w-24 shrink-0 text-xs font-semibold text-[#7c3aed]">
                      {formatTime(s.startTime)} – {formatTime(s.endTime)}
                    </p>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-[#0f172a]">{s.title}</p>
                      <p className="truncate text-xs text-[#64748b]">
                        {[s.speaker ? `${s.speaker.firstName} ${s.speaker.lastName}` : null, s.location].filter(Boolean).join(" · ") || "—"}
                      </p>
                    </div>
                  </li>
                ))}
              </ol>
            )}
          </Card>
        </TabsContent>
      </Tabs>
    </>
  )
}