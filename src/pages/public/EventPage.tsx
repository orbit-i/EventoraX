import { useEffect, useState } from "react"
import { Link, useParams } from "react-router"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { toast } from "sonner"
import { CalendarDays, CalendarPlus, CheckCircle2, Clock, ExternalLink, Linkedin, Loader2, MapPin, Monitor, Share2, Ticket, Users } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { SelectField, TextField } from "@/components/ui/form-fields"
import { FormError } from "@/components/auth/AuthShell"
import { applyServerErrors } from "@/components/app/form/serverErrors"
import { PublicShell, brandColor } from "@/components/public/PublicShell"
import { QrCode, ticketQrValue } from "@/components/tickets/QrCode"
import { api, ApiError } from "@/lib/api"
import { emailSchema, phoneSchema } from "@/lib/validation"
import { formatDate, formatMoney, formatTime } from "@/lib/format"
import type { PublicEvent, PublicRegistration } from "@/types/public"

const TIER_ORDER = ["PLATINUM", "GOLD", "SILVER", "BRONZE"] as const
const TIER_LABEL = { PLATINUM: "Platinum", GOLD: "Gold", SILVER: "Silver", BRONZE: "Bronze" }
const MODE_LABEL = { ONLINE: "Online", OFFLINE: "In person", HYBRID: "Hybrid" }

function whenText(e: PublicEvent) {
  const start = new Date(e.startDateTime)
  const end = new Date(e.endDateTime)
  const sameDay = start.toDateString() === end.toDateString()
  return sameDay ? `${formatDate(start)} · ${formatTime(start)} – ${formatTime(end)}` : `${formatDate(start)}, ${formatTime(start)} – ${formatDate(end)}, ${formatTime(end)}`
}

/** A tiny .ics file so people can add the event to their phone / Google calendar. */
function downloadIcs(e: PublicEvent) {
  const stamp = (d: string) => new Date(d).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "")
  const esc = (s: string) => s.replace(/[\\,;]/g, (m) => `\\${m}`).replace(/\n/g, "\\n")
  const ics = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//EventoraX//EN",
    "BEGIN:VEVENT",
    `UID:${e.id}@eventorax`,
    `DTSTAMP:${stamp(new Date().toISOString())}`,
    `DTSTART:${stamp(e.startDateTime)}`,
    `DTEND:${stamp(e.endDateTime)}`,
    `SUMMARY:${esc(e.title)}`,
    `LOCATION:${esc(e.mode === "ONLINE" ? "Online (link on your ticket)" : e.location ?? "")}`,
    `URL:${window.location.href}`,
    `DESCRIPTION:${esc(`Organized by ${e.organization.name}. Event page: ${window.location.href}`)}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n")
  const url = URL.createObjectURL(new Blob([ics], { type: "text/calendar" }))
  const a = document.createElement("a")
  a.href = url
  a.download = `${e.title.replace(/[^a-z0-9]+/gi, "-").slice(0, 40)}.ics`
  a.click()
  URL.revokeObjectURL(url)
}

async function share(e: PublicEvent) {
  const url = window.location.href
  try {
    if (navigator.share) await navigator.share({ title: e.title, text: `${e.title} — ${e.organization.name}`, url })
    else {
      await navigator.clipboard.writeText(url)
      toast.success("Link copied")
    }
  } catch {
    // the person closed the share sheet
  }
}

// ─────────────────────────── Registration card ───────────────────────────

const schema = z.object({
  name: z.string().trim().min(2, "Enter your full name").max(200),
  email: emailSchema,
  phone: z.union([z.literal(""), phoneSchema]),
  department: z.string().trim().max(100),
  rollNo: z.string().trim().max(50),
  categoryId: z.string(),
  website: z.string(), // honeypot — hidden from people
})
type Values = z.infer<typeof schema>

const CLOSED_TEXT = {
  FULL: { title: "This event is full", text: "All seats have been taken. Contact the organizer if you'd like to join a waiting list." },
  CLOSED: { title: "Registration is closed", text: "The organizer isn't accepting new registrations right now." },
  ENDED: { title: "This event has ended", text: "Thanks for your interest — follow the organizer for their next events." },
  UNAVAILABLE: { title: "Registration paused", text: "Registration is temporarily unavailable. Please contact the organizer." },
}

function RegistrationCard({ event, color, onRegistered }: { event: PublicEvent; color: string; onRegistered: (r: PublicRegistration) => void }) {
  const [formError, setFormError] = useState<string | null>(null)
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<Values>({ resolver: zodResolver(schema), defaultValues: { name: "", email: "", phone: "", department: "", rollNo: "", categoryId: "", website: "" } })

  async function onSubmit(v: Values) {
    setFormError(null)
    try {
      const res = await api.post<PublicRegistration>(
        `/public/events/${event.id}/register`,
        { ...v, phone: v.phone || undefined, categoryId: v.categoryId || null, department: v.department || undefined, rollNo: v.rollNo || undefined },
        { auth: false }
      )
      onRegistered(res)
    } catch (err) {
      if (err instanceof ApiError && err.code.startsWith("REGISTRATION_")) setFormError(err.message)
      else setFormError(applyServerErrors(err, setError))
    }
  }

  const r = event.registration
  if (!r.open) {
    const c = CLOSED_TEXT[r.reason as keyof typeof CLOSED_TEXT]
    return (
      <div className="rounded-2xl border border-[#e9e4ff] bg-white p-6 text-center shadow-sm">
        <Ticket className="mx-auto h-8 w-8 text-[#cbd5e1]" />
        <h2 className="mt-3 text-lg font-semibold text-[#0f172a]">{c.title}</h2>
        <p className="mt-1 text-sm text-[#64748b]">{c.text}</p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4 rounded-2xl border border-[#e9e4ff] bg-white p-6 shadow-sm">
      <div>
        <h2 className="text-lg font-semibold text-[#0f172a]">{event.ticketPrice && Number(event.ticketPrice) > 0 ? "Register" : "Register for free"}</h2>
        <p className="text-sm text-[#64748b]">
          Your QR ticket is emailed to you instantly.
          {r.seatsLeft !== null && <span className={cn("ml-1 font-medium", r.seatsLeft <= 10 ? "text-amber-700" : "text-[#475569]")}>{r.seatsLeft} seats left.</span>}
        </p>
      </div>
      {formError && <FormError message={formError} />}
      <TextField label="Full name" required autoComplete="name" error={errors.name?.message} {...register("name")} />
      <TextField label="Email" type="email" required autoComplete="email" helper="Your ticket is sent here" error={errors.email?.message} {...register("email")} />
      <TextField label="Phone" type="tel" autoComplete="tel" placeholder="+92 300 1234567" error={errors.phone?.message} {...register("phone")} />
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField label="Department" placeholder="Optional" error={errors.department?.message} {...register("department")} />
        <TextField label="Roll no." placeholder="Optional" error={errors.rollNo?.message} {...register("rollNo")} />
      </div>
      {event.categories.length > 0 && (
        <SelectField
          label="Category"
          options={[{ value: "", label: "General" }, ...event.categories.filter((c) => c.label.toLowerCase() !== "general").map((c) => ({ value: c.id, label: c.label }))]}
          error={errors.categoryId?.message}
          {...register("categoryId")}
        />
      )}
      {/* Bots fill every field; people never see this one. */}
      <input type="text" tabIndex={-1} autoComplete="off" aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 opacity-0" {...register("website")} />
      <Button type="submit" className="w-full" disabled={isSubmitting} style={{ backgroundColor: color }}>
        {isSubmitting ? <Loader2 className="animate-spin" /> : <Ticket />} {isSubmitting ? "Registering…" : "Register"}
      </Button>
      <p className="text-center text-xs text-[#94a3b8]">
        By registering you agree that {event.organization.name} receives your details. See our{" "}
        <Link to="/privacy" className="underline">
          privacy policy
        </Link>
        .
      </p>
    </form>
  )
}

function SuccessCard({ event, reg, color }: { event: PublicEvent; reg: PublicRegistration; color: string }) {
  return (
    <div className="space-y-4 rounded-2xl border-2 bg-white p-6 text-center shadow-sm" style={{ borderColor: color }}>
      <CheckCircle2 className="mx-auto h-10 w-10 text-emerald-600" />
      <div>
        <h2 className="text-lg font-semibold text-[#0f172a]">You're registered, {reg.name.split(" ")[0]}!</h2>
        <p className="mt-1 text-sm text-[#64748b]">
          We emailed your ticket to <strong className="text-[#0f172a]">{reg.email}</strong>. Show this QR code at the entrance.
        </p>
      </div>
      {reg.qrCode && (
        <div className="flex justify-center">
          <QrCode value={ticketQrValue(reg.qrCode)} size={180} label={`Ticket ${reg.ticketNo}`} />
        </div>
      )}
      <div className="rounded-xl bg-[#faf8ff] p-3 text-sm">
        <p className="font-mono text-[#0f172a]">{reg.ticketNo}</p>
        <p className="text-xs text-[#64748b]">Registration no. {reg.refNo}</p>
      </div>
      <Button variant="outline" className="w-full" onClick={() => downloadIcs(event)}>
        <CalendarPlus /> Add to calendar
      </Button>
      <p className="text-xs text-[#94a3b8]">Can't find the email? Check your spam folder. Take a screenshot of this QR as a backup.</p>
    </div>
  )
}

// ─────────────────────────── Page ───────────────────────────

export default function EventPage() {
  const { id = "" } = useParams()
  const [event, setEvent] = useState<PublicEvent | null>(null)
  const [error, setError] = useState<{ status: number; message: string } | null>(null)
  const [registration, setRegistration] = useState<PublicRegistration | null>(null)

  useEffect(() => {
    const controller = new AbortController()
    setError(null)
    api
      .get<PublicEvent>(`/public/events/${id}`, { auth: false, signal: controller.signal })
      .then((e) => {
        setEvent(e)
        document.title = `${e.title} — ${e.organization.name}`
      })
      .catch((err) => {
        if (controller.signal.aborted) return
        setError(err instanceof ApiError ? { status: err.status, message: err.message } : { status: 0, message: "Couldn't load this event." })
      })
    return () => controller.abort()
  }, [id])

  if (error) {
    return (
      <PublicShell org={null}>
        <div className="mx-auto max-w-md px-4 py-24 text-center">
          <CalendarDays className="mx-auto h-10 w-10 text-[#cbd5e1]" />
          <h1 className="mt-4 text-2xl font-bold text-[#0f172a]">{error.status === 404 ? "Event not found" : "Something went wrong"}</h1>
          <p className="mt-2 text-[#64748b]">{error.status === 404 ? "This event doesn't exist, or the organizer hasn't published it yet." : error.message}</p>
          <Button asChild variant="outline" className="mt-6">
            <Link to="/">Go to EventoraX</Link>
          </Button>
        </div>
      </PublicShell>
    )
  }

  if (!event) {
    return (
      <PublicShell org={null}>
        <div className="mx-auto max-w-6xl space-y-6 px-4 py-10 sm:px-6">
          <Skeleton className="h-56 rounded-3xl" />
          <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
            <Skeleton className="h-96 rounded-2xl" />
            <Skeleton className="h-96 rounded-2xl" />
          </div>
        </div>
      </PublicShell>
    )
  }

  const color = brandColor(event.organization)
  const tiers = TIER_ORDER.map((t) => ({ tier: t, items: event.sponsors.filter((s) => s.tier === t) })).filter((g) => g.items.length)
  const price = event.ticketPrice && Number(event.ticketPrice) > 0 ? formatMoney(event.ticketPrice) : null

  return (
    <PublicShell org={event.organization}>
      <section className="text-white" style={{ background: `linear-gradient(135deg, ${color} 0%, ${color}dd 60%, #0f172a 140%)` }}>
        <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 md:py-16">
          <p className="text-sm font-medium opacity-80">{event.organizer || event.organization.name}</p>
          <h1 className="mt-2 max-w-3xl font-heading text-3xl font-bold leading-tight md:text-5xl">{event.title}</h1>
          {event.topic && <p className="mt-3 max-w-2xl text-lg opacity-90">{event.topic}</p>}
          <div className="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-sm">
            <span className="inline-flex items-center gap-2">
              <CalendarDays className="h-4 w-4" /> {whenText(event)}
            </span>
            <span className="inline-flex items-center gap-2">
              {event.mode === "ONLINE" ? <Monitor className="h-4 w-4" /> : <MapPin className="h-4 w-4" />}
              {event.mode === "ONLINE" ? "Online — the link is on your ticket" : `${MODE_LABEL[event.mode]}${event.location ? ` · ${event.location}` : ""}`}
            </span>
            {event.registration.seatsLeft !== null && event.registration.open && (
              <span className="inline-flex items-center gap-2">
                <Users className="h-4 w-4" /> {event.registration.seatsLeft} seats left
              </span>
            )}
            {price && <span className="inline-flex items-center gap-2">Ticket price: {price} (paid to the organizer)</span>}
          </div>
          <div className="mt-6 flex flex-wrap gap-2">
            {event.registration.open && !registration && (
              <Button asChild className="bg-white text-[#0f172a] shadow-none hover:bg-white/90">
                <a href="#register">
                  <Ticket /> Register now
                </a>
              </Button>
            )}
            <Button variant="outline" className="border-white/40 bg-white/10 text-white hover:bg-white/20 hover:text-white" onClick={() => void share(event)}>
              <Share2 /> Share
            </Button>
            <Button variant="outline" className="border-white/40 bg-white/10 text-white hover:bg-white/20 hover:text-white" onClick={() => downloadIcs(event)}>
              <CalendarPlus /> Add to calendar
            </Button>
          </div>
        </div>
      </section>

      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[1fr_380px]">
        <div className="min-w-0 space-y-10">
          {event.description && (
            <section>
              <h2 className="mb-3 text-xl font-bold text-[#0f172a]">About this event</h2>
              <p className="whitespace-pre-line leading-relaxed text-[#334155]">{event.description}</p>
            </section>
          )}

          {event.sessions.length > 0 && (
            <section>
              <h2 className="mb-4 text-xl font-bold text-[#0f172a]">Schedule</h2>
              <ol className="space-y-3">
                {event.sessions.map((s) => (
                  <li key={s.id} className="flex gap-4 rounded-2xl border border-[#e9e4ff] bg-white p-4">
                    <div className="w-28 shrink-0 text-sm">
                      <p className="font-semibold" style={{ color }}>
                        {formatTime(s.startTime)}
                      </p>
                      <p className="text-xs text-[#94a3b8]">until {formatTime(s.endTime)}</p>
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-[#0f172a]">{s.title}</p>
                      <p className="text-sm text-[#64748b]">
                        {[s.speaker && `${s.speaker.firstName} ${s.speaker.lastName}`, s.location].filter(Boolean).join(" · ")}
                      </p>
                    </div>
                  </li>
                ))}
              </ol>
            </section>
          )}

          {event.speakers.length > 0 && (
            <section>
              <h2 className="mb-4 text-xl font-bold text-[#0f172a]">Speakers</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                {event.speakers.map((sp) => (
                  <div key={sp.id} className="flex gap-4 rounded-2xl border border-[#e9e4ff] bg-white p-4">
                    {sp.photo ? (
                      <img src={sp.photo} alt="" className="h-16 w-16 shrink-0 rounded-full object-cover" />
                    ) : (
                      <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full text-lg font-bold text-white" style={{ backgroundColor: color }}>
                        {sp.firstName.charAt(0)}
                        {sp.lastName.charAt(0)}
                      </span>
                    )}
                    <div className="min-w-0">
                      <p className="font-semibold text-[#0f172a]">
                        {sp.firstName} {sp.lastName}
                      </p>
                      <p className="text-sm text-[#64748b]">{[sp.title, sp.company].filter(Boolean).join(", ")}</p>
                      {sp.sessionTopic && <p className="mt-1 text-sm text-[#334155]">“{sp.sessionTopic}”</p>}
                      {sp.bio && <p className="mt-1 line-clamp-3 text-xs text-[#64748b]">{sp.bio}</p>}
                      {sp.linkedin && (
                        <a href={sp.linkedin} target="_blank" rel="noreferrer" className="mt-1 inline-flex items-center gap-1 text-xs font-medium hover:underline" style={{ color }}>
                          <Linkedin className="h-3.5 w-3.5" /> LinkedIn
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {tiers.length > 0 && (
            <section>
              <h2 className="mb-4 text-xl font-bold text-[#0f172a]">Sponsors</h2>
              <div className="space-y-5">
                {tiers.map((g) => (
                  <div key={g.tier}>
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-[#94a3b8]">{TIER_LABEL[g.tier]}</p>
                    <div className="flex flex-wrap gap-3">
                      {g.items.map((s) => {
                        const inner = s.logo ? <img src={s.logo} alt={s.name} className={cn("object-contain", g.tier === "PLATINUM" ? "h-14" : "h-10")} /> : <span className="font-semibold text-[#334155]">{s.name}</span>
                        return s.website ? (
                          <a key={s.id} href={s.website} target="_blank" rel="noreferrer" title={s.name} className="flex items-center gap-1 rounded-xl border border-[#e9e4ff] bg-white px-4 py-3 hover:shadow-sm">
                            {inner}
                            <ExternalLink className="h-3 w-3 text-[#cbd5e1]" />
                          </a>
                        ) : (
                          <span key={s.id} title={s.name} className="flex items-center rounded-xl border border-[#e9e4ff] bg-white px-4 py-3">
                            {inner}
                          </span>
                        )
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {!event.description && event.sessions.length === 0 && event.speakers.length === 0 && tiers.length === 0 && (
            <p className="flex items-center gap-2 text-[#64748b]">
              <Clock className="h-4 w-4" /> More details coming soon from {event.organization.name}.
            </p>
          )}
        </div>

        <aside id="register" className="scroll-mt-6 lg:sticky lg:top-6 lg:self-start">
          {registration ? <SuccessCard event={event} reg={registration} color={color} /> : <RegistrationCard event={event} color={color} onRegistered={setRegistration} />}
        </aside>
      </div>
    </PublicShell>
  )
}
