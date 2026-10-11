import { useEffect, useState } from "react"
import { Link, useParams } from "react-router"
import { ArrowRight, Building2, CalendarDays, MapPin, Monitor } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { PublicShell, brandColor } from "@/components/public/PublicShell"
import { api, ApiError } from "@/lib/api"
import { formatDate, formatTime } from "@/lib/format"
import type { PublicEventCard, PublicOrgPage } from "@/types/public"

function EventCard({ e, color, past }: { e: PublicEventCard; color: string; past?: boolean }) {
  const start = new Date(e.startDateTime)
  return (
    <Link to={`/e/${e.id}`} className="group flex gap-4 rounded-2xl border border-[#e9e4ff] bg-white p-5 transition-all hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex h-16 w-16 shrink-0 flex-col items-center justify-center rounded-xl text-white" style={{ backgroundColor: past ? "#94a3b8" : color }}>
        <span className="text-xs font-semibold uppercase">{start.toLocaleDateString("en-PK", { month: "short" })}</span>
        <span className="text-2xl font-bold leading-none">{start.getDate()}</span>
      </div>
      <div className="min-w-0 flex-1">
        <p className="font-semibold text-[#0f172a] group-hover:underline">{e.title}</p>
        {e.topic && <p className="truncate text-sm text-[#64748b]">{e.topic}</p>}
        <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[#64748b]">
          <span className="inline-flex items-center gap-1">
            <CalendarDays className="h-3.5 w-3.5" /> {formatDate(start)}, {formatTime(start)}
          </span>
          <span className="inline-flex items-center gap-1">
            {e.mode === "ONLINE" ? <Monitor className="h-3.5 w-3.5" /> : <MapPin className="h-3.5 w-3.5" />}
            {e.mode === "ONLINE" ? "Online" : e.location || "Venue to be announced"}
          </span>
        </p>
      </div>
      {!past && (
        <span className="hidden items-center gap-1 self-center text-sm font-semibold sm:inline-flex" style={{ color }}>
          {e.registrationOpen ? "Register" : "Details"} <ArrowRight className="h-4 w-4" />
        </span>
      )}
    </Link>
  )
}

export default function OrgPage() {
  const { slug = "" } = useParams()
  const [data, setData] = useState<PublicOrgPage | null>(null)
  const [error, setError] = useState<{ status: number; message: string } | null>(null)

  useEffect(() => {
    const controller = new AbortController()
    api
      .get<PublicOrgPage>(`/public/orgs/${slug}`, { auth: false, signal: controller.signal })
      .then((d) => {
        setData(d)
        document.title = `${d.organization.name} — events`
      })
      .catch((err) => {
        if (!controller.signal.aborted) setError(err instanceof ApiError ? { status: err.status, message: err.message } : { status: 0, message: "Couldn't load this page." })
      })
    return () => controller.abort()
  }, [slug])

  if (error) {
    return (
      <PublicShell org={null}>
        <div className="mx-auto max-w-md px-4 py-24 text-center">
          <Building2 className="mx-auto h-10 w-10 text-[#cbd5e1]" />
          <h1 className="mt-4 text-2xl font-bold text-[#0f172a]">{error.status === 404 ? "Page not found" : "Something went wrong"}</h1>
          <p className="mt-2 text-[#64748b]">{error.status === 404 ? "There's no organization at this address." : error.message}</p>
          <Button asChild variant="outline" className="mt-6">
            <Link to="/">Go to EventoraX</Link>
          </Button>
        </div>
      </PublicShell>
    )
  }

  const color = brandColor(data?.organization)
  return (
    <PublicShell org={data?.organization ?? null}>
      <section className="border-b border-[#e9e4ff] bg-white">
        <div className="mx-auto flex max-w-4xl items-center gap-5 px-4 py-10 sm:px-6">
          {!data ? (
            <Skeleton className="h-20 w-full rounded-2xl" />
          ) : (
            <>
              {data.organization.logoUrl ? (
                <img src={data.organization.logoUrl} alt="" className="h-20 w-20 rounded-2xl bg-white object-contain ring-1 ring-[#e9e4ff]" />
              ) : (
                <span className="flex h-20 w-20 items-center justify-center rounded-2xl text-3xl font-bold text-white" style={{ backgroundColor: color }}>
                  {data.organization.name.charAt(0)}
                </span>
              )}
              <div>
                <h1 className="font-heading text-3xl font-bold text-[#0f172a]">{data.organization.name}</h1>
                <p className="text-[#64748b]">Events and registration</p>
              </div>
            </>
          )}
        </div>
      </section>
      <div className="mx-auto max-w-4xl space-y-10 px-4 py-10 sm:px-6">
        <section>
          <h2 className="mb-4 text-xl font-bold text-[#0f172a]">Upcoming events</h2>
          {!data ? (
            <div className="space-y-3">
              <Skeleton className="h-24 rounded-2xl" />
              <Skeleton className="h-24 rounded-2xl" />
            </div>
          ) : data.upcoming.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-[#e9e4ff] bg-white p-8 text-center text-[#64748b]">No upcoming events right now — check back soon.</p>
          ) : (
            <div className="space-y-3">
              {data.upcoming.map((e) => (
                <EventCard key={e.id} e={e} color={color} />
              ))}
            </div>
          )}
        </section>
        {data && data.past.length > 0 && (
          <section>
            <h2 className="mb-4 text-xl font-bold text-[#0f172a]">Past events</h2>
            <div className="space-y-3">
              {data.past.map((e) => (
                <EventCard key={e.id} e={e} color={color} past />
              ))}
            </div>
          </section>
        )}
      </div>
    </PublicShell>
  )
}
