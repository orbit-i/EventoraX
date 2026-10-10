import { useNavigate } from "react-router"
import { Award, CalendarDays, ExternalLink, Eye, EyeOff, Handshake, Medal, Pencil, Plus, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { PageHeader } from "@/components/app/PageHeader"
import { EventPicker } from "@/components/app/EventPicker"
import { StatsRow } from "@/components/app/StatCard"
import { Toolbar, SearchInput, FilterSelect, FilterChips, type ActiveFilter } from "@/components/app/Toolbar"
import { RowActions, type RowAction } from "@/components/app/RowActions"
import { StatusBadge } from "@/components/app/StatusBadge"
import { EmptyState, ErrorState, NoResults } from "@/components/app/States"
import { useConfirm } from "@/components/app/ConfirmDialog"
import { useApi } from "@/hooks/useApi"
import { useUrlState } from "@/hooks/useUrlState"
import { useSelectedEvent } from "@/hooks/useSelectedEvent"
import { useVisibilityToggle } from "@/hooks/useVisibilityToggle"
import { useCan } from "@/lib/permissions"
import { api, buildQuery, errorMessage } from "@/lib/api"
import { plural } from "@/lib/format"
import { statusLabel, statusOptions } from "@/lib/status"
import type { EventItem, EventStats } from "@/types/event"
import { TIER_ORDER, type Sponsor, type SponsorTier } from "@/types/sponsor"

// Bigger tiers get bigger cards, like on the public page.
const TIER_GRID: Record<SponsorTier, string> = {
  PLATINUM: "grid-cols-1 sm:grid-cols-2",
  GOLD: "grid-cols-2 lg:grid-cols-3",
  SILVER: "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4",
  BRONZE: "grid-cols-2 sm:grid-cols-4 lg:grid-cols-5",
}
const TIER_LOGO: Record<SponsorTier, string> = { PLATINUM: "h-20", GOLD: "h-16", SILVER: "h-12", BRONZE: "h-10" }

function hostOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "")
  } catch {
    return url
  }
}

export default function SponsorsPage() {
  const navigate = useNavigate()
  const can = useCan()
  const confirm = useConfirm()
  const [eventId, setEventId] = useSelectedEvent()
  const { values, set, reset } = useUrlState({ search: "", tier: "", visibility: "" })

  // Sponsor lists are short, so load them all and group by tier.
  const list = useApi<Sponsor[]>(
    eventId ? `/sponsors${buildQuery({ eventId, search: values.search, tier: values.tier, displayPublic: values.visibility, limit: 500 })}` : null
  )
  const statsQ = useApi<EventStats>(eventId ? `/events/${eventId}/stats` : null)
  const eventQ = useApi<EventItem>(eventId ? `/events/${eventId}` : null)

  const sponsors = list.data ?? []
  const stats = statsQ.data?.sponsors
  const write = can("write") && eventQ.data?.status !== "ARCHIVED"
  const hasFilters = Boolean(values.search || values.tier || values.visibility)
  const eventQuery = eventId ? `?eventId=${eventId}` : ""

  const refresh = () => {
    list.reload()
    statsQ.reload()
  }
  const toggleVisibility = useVisibilityToggle("sponsors", refresh)

  async function remove(s: Sponsor) {
    const ok = await confirm({ title: `Remove ${s.name}?`, description: "They'll be removed from this event.", confirmLabel: "Remove sponsor", tone: "danger" })
    if (!ok) return
    try {
      await api.delete(`/sponsors/${s.id}`)
      toast.success(`${s.name} removed`)
      refresh()
    } catch (err) {
      toast.error(errorMessage(err))
    }
  }

  const actionsFor = (s: Sponsor): RowAction[] => [
    { label: "Edit", icon: Pencil, to: `/dashboard/sponsors/${s.id}/edit`, hidden: !write },
    {
      label: s.displayPublic ? "Hide from public page" : "Show on public page",
      icon: s.displayPublic ? EyeOff : Eye,
      hidden: !write,
      onClick: () => void toggleVisibility(s, s.name),
    },
    { label: "Remove", icon: Trash2, destructive: true, separatorBefore: true, hidden: !write, onClick: () => void remove(s) },
  ]

  const chips: ActiveFilter[] = [
    ...(values.search ? [{ key: "search", label: `Search: "${values.search}"`, onRemove: () => set({ search: "" }) }] : []),
    ...(values.tier ? [{ key: "tier", label: `Tier: ${statusLabel("tier", values.tier)}`, onRemove: () => set({ tier: "" }) }] : []),
    ...(values.visibility ? [{ key: "vis", label: values.visibility === "true" ? "Public only" : "Hidden only", onRemove: () => set({ visibility: "" }) }] : []),
  ]

  return (
    <>
      <PageHeader
        title="Sponsors"
        description="Organizations supporting your event, grouped by tier."
        breadcrumbs={[{ label: "Dashboard", to: "/dashboard" }, { label: "Sponsors" }]}
        actions={
          eventId &&
          write && (
            <Button onClick={() => navigate(`/dashboard/sponsors/new${eventQuery}`)}>
              <Plus /> Add sponsor
            </Button>
          )
        }
      />

      <EventPicker value={eventId} onChange={setEventId} className="mb-6" />

      {!eventId ? (
        <EmptyState icon={CalendarDays} title="Choose an event" description="Pick an event above to manage its sponsors." />
      ) : (
        <>
          <StatsRow
            loading={!stats}
            items={[
              { label: "Sponsors", value: stats?.total, icon: Handshake, accent: "purple", hint: stats ? `${stats.public} shown publicly` : undefined },
              { label: "Platinum", value: stats?.byTier.PLATINUM, icon: Award, accent: "slate" },
              { label: "Gold", value: stats?.byTier.GOLD, icon: Medal, accent: "amber" },
              {
                label: "Silver & Bronze",
                value: stats ? stats.byTier.SILVER + stats.byTier.BRONZE : undefined,
                icon: Medal,
                accent: "blue",
              },
            ]}
          />

          <Toolbar>
            <SearchInput value={values.search} onChange={(search) => set({ search })} placeholder="Search sponsors…" />
            <FilterSelect value={values.tier} onChange={(tier) => set({ tier })} options={statusOptions("tier")} allLabel="All tiers" />
            <FilterSelect value={values.visibility} onChange={(visibility) => set({ visibility })} options={statusOptions("visibility")} allLabel="Public & hidden" />
          </Toolbar>
          <FilterChips filters={chips} onClearAll={() => reset(["eventId"])} />

          {list.error ? (
            <ErrorState message={list.error} onRetry={list.reload} />
          ) : list.initialLoading ? (
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
              {Array.from({ length: 6 }, (_, i) => (
                <Skeleton key={i} className="h-36 rounded-2xl" />
              ))}
            </div>
          ) : sponsors.length === 0 ? (
            hasFilters ? (
              <NoResults onClear={() => reset(["eventId"])} />
            ) : (
              <EmptyState
                icon={Handshake}
                title="No sponsors yet"
                description="Add the organizations supporting this event."
                action={
                  write && (
                    <Button onClick={() => navigate(`/dashboard/sponsors/new${eventQuery}`)}>
                      <Plus /> Add sponsor
                    </Button>
                  )
                }
              />
            )
          ) : (
            <div className={cn("space-y-8", list.loading && "opacity-60")}>
              {TIER_ORDER.map((tier) => {
                const inTier = sponsors.filter((s) => s.tier === tier)
                if (inTier.length === 0) return null
                return (
                  <section key={tier}>
                    <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-[#64748b]">
                      <StatusBadge kind="tier" value={tier} /> {plural(inTier.length, "sponsor")}
                    </h2>
                    <div className={cn("grid gap-4", TIER_GRID[tier])}>
                      {inTier.map((s) => (
                        <article key={s.id} className="flex flex-col rounded-2xl border border-[#e9e4ff] bg-white p-4 shadow-sm">
                          <div className="flex justify-end">
                            <RowActions actions={actionsFor(s)} />
                          </div>
                          <div className={cn("flex items-center justify-center", TIER_LOGO[tier])}>
                            {s.logo ? (
                              <img src={s.logo} alt={`${s.name} logo`} className="max-h-full max-w-full object-contain" />
                            ) : (
                              <span className="text-center text-lg font-bold text-[#cbd5e1]">{s.name}</span>
                            )}
                          </div>
                          <p className="mt-3 truncate text-center font-medium text-[#0f172a]">{s.name}</p>
                          <div className="mt-2 flex items-center justify-center gap-2">
                            <StatusBadge kind="visibility" value={s.displayPublic} />
                            {s.website && (
                              <a
                                href={s.website}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1 truncate text-xs text-[#7c3aed] hover:underline"
                              >
                                {hostOf(s.website)} <ExternalLink className="h-3 w-3" />
                              </a>
                            )}
                          </div>
                        </article>
                      ))}
                    </div>
                  </section>
                )
              })}
            </div>
          )}
        </>
      )}
    </>
  )
}