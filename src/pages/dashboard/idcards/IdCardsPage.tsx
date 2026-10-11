import { useEffect, useState } from "react"
import { toast } from "sonner"
import { CalendarDays, CheckCircle2, Clock, Download, Eye, IdCard, Loader2, Printer, Users } from "lucide-react"
import { Button } from "@/components/ui/button"
import { PageHeader } from "@/components/app/PageHeader"
import { EventPicker } from "@/components/app/EventPicker"
import { StatsRow } from "@/components/app/StatCard"
import { Toolbar, SearchInput, FilterSelect, FilterChips, type ActiveFilter } from "@/components/app/Toolbar"
import { ServerTable, type Column } from "@/components/app/ServerTable"
import { PaginationBar } from "@/components/app/PaginationBar"
import { BulkActionBar } from "@/components/app/BulkActionBar"
import { RowActions, type RowAction } from "@/components/app/RowActions"
import { StatusBadge } from "@/components/app/StatusBadge"
import { EmptyState, ErrorState, NoResults } from "@/components/app/States"
import { DesignPanel } from "@/components/idcards/DesignPanel"
import { designQuery, useIdCardDesign } from "@/components/idcards/design"
import { openPdf } from "@/components/certificates/pdf"
import { useApi } from "@/hooks/useApi"
import { useUrlState } from "@/hooks/useUrlState"
import { useSelectedEvent } from "@/hooks/useSelectedEvent"
import { api, buildQuery, errorMessage } from "@/lib/api"
import { formatDate, formatRelative, plural } from "@/lib/format"
import type { IdCardOptions, IdCardPerson, IdCardStats } from "@/types/idcard"
import type { EventCategory } from "@/types/event"

export default function IdCardsPage() {
  const [eventId, setEventId] = useSelectedEvent()
  const { values, set, reset } = useUrlState({ search: "", categoryId: "", printed: "", page: "1", limit: "20" })
  const page = Number(values.page) || 1
  const limit = Number(values.limit) || 20
  const [design, setDesign] = useIdCardDesign()

  const filters = { search: values.search, categoryId: values.categoryId, printed: values.printed }
  const list = useApi<IdCardPerson[]>(eventId ? `/idcards${buildQuery({ eventId, ...filters, page, limit })}` : null)
  const statsQ = useApi<IdCardStats>(eventId ? `/idcards/stats?eventId=${eventId}` : null)
  const optionsQ = useApi<IdCardOptions>("/idcards/options")
  const categoriesQ = useApi<EventCategory[]>(eventId ? `/categories${buildQuery({ eventId })}` : null)

  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [busy, setBusy] = useState(false)

  const people = list.data ?? []
  const stats = statsQ.data
  const hasFilters = Boolean(values.search || values.categoryId || values.printed)
  const matching = list.meta?.total ?? 0

  useEffect(() => setSelected(new Set()), [eventId, values.search, values.categoryId, values.printed])

  /** Downloads one PDF with the cards of: some people (ids) or everyone matching the filters. */
  async function download(ids?: string[], layout = design.layout) {
    const count = ids ? ids.length : hasFilters ? matching : (stats?.total ?? 0)
    setBusy(true)
    const toastId = toast.loading(`Preparing ${plural(count, "card")}…`)
    try {
      const scope = ids ? { ids: ids.join(",") } : filters
      await api.download(`/idcards/pdf${designQuery(design, { eventId, layout, ...scope })}`, "id-cards.pdf")
      toast.success(`${plural(count, "ID card")} downloaded`, { id: toastId })
      list.reload()
      statsQ.reload()
    } catch (err) {
      toast.error(errorMessage(err, "Download failed."), { id: toastId })
    } finally {
      setBusy(false)
    }
  }

  async function view(p: IdCardPerson) {
    try {
      await openPdf(`/idcards/pdf${designQuery(design, { eventId, layout: "single", ids: p.id, inline: "1" })}`)
    } catch (err) {
      toast.error(errorMessage(err, "Couldn't open the card."))
    }
  }

  const actionsFor = (p: IdCardPerson): RowAction[] => [
    { label: "View card", icon: Eye, onClick: () => void view(p) },
    { label: "Download card", icon: Download, onClick: () => void download([p.id], "single") },
  ]

  const columns: Column<IdCardPerson>[] = [
    {
      key: "attendee",
      header: "Attendee",
      cell: (p) => (
        <div className="min-w-0">
          <p className="truncate font-medium text-[#0f172a]">{p.name}</p>
          <p className="truncate text-xs text-[#94a3b8]">{p.email}</p>
        </div>
      ),
    },
    { key: "category", header: "Category", hideBelow: "md", cell: (p) => <span className="text-[#475569]">{p.category?.label ?? "—"}</span> },
    {
      key: "details",
      header: "Department · Roll no.",
      hideBelow: "lg",
      cell: (p) =>
        p.department || p.rollNo ? (
          <div className="min-w-0 text-xs">
            <p className="truncate text-[#334155]">{p.department ?? "—"}</p>
            <p className="truncate font-mono text-[#94a3b8]">{p.rollNo ?? ""}</p>
          </div>
        ) : (
          <span className="text-xs text-[#94a3b8]">Not given</span>
        ),
    },
    { key: "status", header: "Status", hideBelow: "sm", cell: (p) => <StatusBadge kind="registration" value={p.status} /> },
    {
      key: "printed",
      header: "Card",
      cell: (p) =>
        p.lastPrintedAt ? (
          <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700" title={formatDate(p.lastPrintedAt)}>
            <CheckCircle2 className="h-3.5 w-3.5" /> Printed {formatRelative(p.lastPrintedAt)}
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 text-xs text-[#94a3b8]">
            <Clock className="h-3.5 w-3.5" /> Not yet
          </span>
        ),
    },
    { key: "actions", header: "", align: "right", cell: (p) => <RowActions actions={actionsFor(p)} label={`Actions for ${p.name}`} /> },
  ]

  const categoryOptions = (categoriesQ.data ?? []).map((c) => ({ value: c.id, label: c.label }))
  const chips: ActiveFilter[] = [
    values.search && { key: "search", label: `Search: "${values.search}"`, onRemove: () => set({ search: "" }) },
    values.categoryId && {
      key: "categoryId",
      label: `Category: ${categoryOptions.find((c) => c.value === values.categoryId)?.label ?? "…"}`,
      onRemove: () => set({ categoryId: "" }),
    },
    values.printed && { key: "printed", label: values.printed === "yes" ? "Printed" : "Not printed yet", onRemove: () => set({ printed: "" }) },
  ].filter(Boolean) as ActiveFilter[]

  const downloadLabel = hasFilters ? `Download ${plural(matching, "card")}` : "Download all cards"

  return (
    <>
      <PageHeader
        title="ID cards"
        description="Design and print name badges for attendees."
        breadcrumbs={[{ label: "Dashboard", to: "/dashboard" }, { label: "ID cards" }]}
        actions={
          eventId && (
            <Button onClick={() => void download()} disabled={busy || (hasFilters ? matching === 0 : !stats?.total)}>
              {busy ? <Loader2 className="animate-spin" /> : <Printer />} {downloadLabel}
            </Button>
          )
        }
      />

      <EventPicker value={eventId} onChange={setEventId} className="mb-6" />

      {!eventId ? (
        <EmptyState icon={CalendarDays} title="Choose an event" description="Pick an event above to print its attendees' ID cards." />
      ) : (
        <>
          <StatsRow
            loading={statsQ.initialLoading}
            items={[
              { label: "Attendees", value: stats?.total, icon: Users, accent: "purple", hint: "cancelled excluded" },
              { label: "Cards printed", value: stats?.printed, icon: CheckCircle2, accent: "green" },
              { label: "Not printed yet", value: stats?.notPrinted, icon: Clock, accent: "amber" },
            ]}
          />

          <DesignPanel eventId={eventId} options={optionsQ.data} optionsLoading={optionsQ.initialLoading} design={design} onChange={setDesign} />

          <Toolbar>
            <SearchInput value={values.search} onChange={(v) => set({ search: v })} placeholder="Search name, email, department or roll no…" />
            {categoryOptions.length > 0 && (
              <FilterSelect value={values.categoryId} onChange={(categoryId) => set({ categoryId })} options={categoryOptions} allLabel="All categories" />
            )}
            <FilterSelect
              value={values.printed}
              onChange={(printed) => set({ printed })}
              allLabel="Printed or not"
              options={[
                { value: "no", label: "Not printed yet" },
                { value: "yes", label: "Printed" },
              ]}
            />
          </Toolbar>
          <FilterChips filters={chips} onClearAll={() => reset(["eventId"])} />

          <BulkActionBar count={selected.size} onClear={() => setSelected(new Set())}>
            <Button size="sm" variant="outline" onClick={() => void download([...selected])} disabled={busy}>
              <Printer /> Download selected cards
            </Button>
          </BulkActionBar>

          {list.error ? (
            <ErrorState message={list.error} onRetry={list.reload} />
          ) : !list.loading && people.length === 0 ? (
            hasFilters ? (
              <NoResults onClear={() => reset(["eventId"])} />
            ) : (
              <EmptyState icon={IdCard} title="No attendees yet" description="ID cards can be printed once people register for this event." />
            )
          ) : (
            <>
              <ServerTable
                columns={columns}
                rows={people}
                rowKey={(p) => p.id}
                loading={list.loading}
                onRowClick={(p) => void view(p)}
                selectedIds={selected}
                onToggleRow={(id) =>
                  setSelected((s) => {
                    const next = new Set(s)
                    if (next.has(id)) next.delete(id)
                    else next.add(id)
                    return next
                  })
                }
                onToggleAll={(checked) =>
                  setSelected((s) => {
                    const next = new Set(s)
                    for (const p of people) {
                      if (checked) next.add(p.id)
                      else next.delete(p.id)
                    }
                    return next
                  })
                }
              />
              {list.meta && (
                <PaginationBar page={page} limit={limit} total={list.meta.total} onPageChange={(p) => set({ page: String(p) })} onLimitChange={(l) => set({ limit: String(l) })} />
              )}
            </>
          )}
        </>
      )}
    </>
  )
}
