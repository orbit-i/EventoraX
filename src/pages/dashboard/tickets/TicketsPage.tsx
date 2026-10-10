import { useEffect, useState } from "react"
import { useNavigate } from "react-router"
import { toast } from "sonner"
import { CalendarDays, CheckCircle2, Clock, Download, FileArchive, Loader2, Mail, MailCheck, QrCode as QrIcon, RotateCcw, ScanLine, Send, Ticket as TicketIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { PageHeader } from "@/components/app/PageHeader"
import { EventPicker } from "@/components/app/EventPicker"
import { StatsRow } from "@/components/app/StatCard"
import { Toolbar, SearchInput, FilterSelect, FilterChips, type ActiveFilter } from "@/components/app/Toolbar"
import { ServerTable, type Column } from "@/components/app/ServerTable"
import { PaginationBar } from "@/components/app/PaginationBar"
import { BulkActionBar } from "@/components/app/BulkActionBar"
import { RowActions, type RowAction } from "@/components/app/RowActions"
import { EmptyState, ErrorState, NoResults } from "@/components/app/States"
import { useConfirm } from "@/components/app/ConfirmDialog"
import { TicketDialog } from "@/components/tickets/TicketDialog"
import { useApi } from "@/hooks/useApi"
import { useUrlState } from "@/hooks/useUrlState"
import { useSelectedEvent } from "@/hooks/useSelectedEvent"
import { useCan } from "@/lib/permissions"
import { api, buildQuery, errorMessage } from "@/lib/api"
import { formatDate, formatRelative, formatTime, plural } from "@/lib/format"
import type { EventItem } from "@/types/event"
import type { CheckInResult, Ticket, TicketStats } from "@/types/ticket"

export default function TicketsPage() {
  const navigate = useNavigate()
  const can = useCan()
  const confirm = useConfirm()
  const [eventId, setEventId] = useSelectedEvent()
  const { values, set, reset } = useUrlState({ search: "", used: "", page: "1", limit: "20" })
  const page = Number(values.page) || 1
  const limit = Number(values.limit) || 20

  const list = useApi<Ticket[]>(eventId ? `/tickets${buildQuery({ eventId, search: values.search, used: values.used, page, limit })}` : null)
  const statsQ = useApi<TicketStats>(eventId ? `/tickets/stats?eventId=${eventId}` : null)
  const eventQ = useApi<EventItem>(eventId ? `/events/${eventId}` : null)

  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [open, setOpen] = useState<Ticket | null>(null)
  const [zipping, setZipping] = useState(false)

  const archived = eventQ.data?.status === "ARCHIVED"
  const write = can("write") && !archived
  const tickets = list.data ?? []
  const stats = statsQ.data
  const hasFilters = Boolean(values.search || values.used)

  useEffect(() => setSelected(new Set()), [eventId, values.search, values.used])

  function refresh() {
    list.reload()
    statsQ.reload()
  }

  async function downloadPdf(t: Ticket) {
    try {
      await api.download(`/tickets/${t.id}/pdf`, `${t.ticketNo}.pdf`)
    } catch (err) {
      toast.error(errorMessage(err, "Download failed."))
    }
  }

  async function downloadZip(ids?: string[]) {
    setZipping(true)
    const toastId = toast.loading("Preparing tickets…")
    try {
      await api.download(`/tickets/zip${buildQuery(ids ? { ids: ids.join(",") } : { eventId })}`, "tickets.zip")
      toast.success("Tickets downloaded", { id: toastId })
    } catch (err) {
      toast.error(errorMessage(err, "Download failed."), { id: toastId })
    } finally {
      setZipping(false)
    }
  }

  async function emailOne(t: Ticket) {
    try {
      await api.post(`/tickets/${t.id}/email`)
      toast.success(`Ticket emailed to ${t.registration.email}`)
      setOpen(null)
      refresh()
    } catch (err) {
      toast.error(errorMessage(err))
    }
  }

  async function emailMany(body: { ids: string[] } | { eventId: string; onlyUnsent: boolean }) {
    if ("eventId" in body) {
      const unsent = (stats?.total ?? 0) - (stats?.emailed ?? 0)
      const ok = await confirm({
        title: `Email ${plural(unsent, "ticket")}?`,
        description: "Everyone who hasn't been sent their ticket yet gets an email with the PDF attached. Tickets already sent are skipped.",
        confirmLabel: "Send tickets",
      })
      if (!ok) return
    }
    try {
      const res = await api.post<{ sending: number }>("/tickets/email", body)
      toast.success(res.sending ? `Sending ${plural(res.sending, "ticket")}` : "Nothing to send", {
        description: res.sending ? "Emails go out in the background — refresh in a moment to see them marked as sent." : undefined,
      })
      setSelected(new Set())
      if (res.sending) setTimeout(refresh, 3000)
    } catch (err) {
      toast.error(errorMessage(err))
    }
  }

  async function checkIn(t: Ticket) {
    try {
      const res = await api.post<CheckInResult>("/tickets/check-in", { code: t.ticketNo, eventId })
      if (res.result === "ALREADY_USED") toast.info(`${t.registration.name} was already checked in`)
      else toast.success(`${t.registration.name} checked in`, { action: { label: "Undo", onClick: () => void undo(t, true) } })
      setOpen(null)
      refresh()
    } catch (err) {
      toast.error(errorMessage(err))
    }
  }

  async function undo(t: Ticket, quiet = false) {
    try {
      await api.post(`/tickets/${t.id}/undo-check-in`)
      if (!quiet) toast.success(`Check-in undone for ${t.registration.name}`)
      setOpen(null)
      refresh()
    } catch (err) {
      toast.error(errorMessage(err))
    }
  }

  const actionsFor = (t: Ticket): RowAction[] => [
    { label: "Show QR", icon: QrIcon, onClick: () => setOpen(t) },
    { label: "Download PDF", icon: Download, onClick: () => void downloadPdf(t) },
    { label: t.emailedAt ? "Email again" : "Email ticket", icon: Mail, hidden: !write, onClick: () => void emailOne(t) },
    { label: "Check in manually", icon: CheckCircle2, separatorBefore: true, hidden: !write || t.isUsed, onClick: () => void checkIn(t) },
    { label: "Undo check-in", icon: RotateCcw, separatorBefore: true, hidden: !write || !t.isUsed, onClick: () => void undo(t) },
  ]

  const columns: Column<Ticket>[] = [
    {
      key: "attendee",
      header: "Attendee",
      cell: (t) => (
        <div className="min-w-0">
          <p className="truncate font-medium text-[#0f172a]">{t.registration.name}</p>
          <p className="truncate text-xs text-[#94a3b8]">{t.registration.email}</p>
        </div>
      ),
    },
    { key: "no", header: "Ticket no.", cell: (t) => <span className="font-mono text-xs text-[#334155]">{t.ticketNo}</span> },
    { key: "type", header: "Type", hideBelow: "md", cell: (t) => <span className="text-[#475569]">{t.type || "General"}</span> },
    {
      key: "status",
      header: "Entry",
      cell: (t) =>
        t.isUsed ? (
          <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700" title={t.usedAt ? formatDate(t.usedAt) : undefined}>
            <CheckCircle2 className="h-3.5 w-3.5" /> In {t.usedAt ? formatTime(t.usedAt) : ""}
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 text-xs text-[#94a3b8]">
            <Clock className="h-3.5 w-3.5" /> Not yet
          </span>
        ),
    },
    {
      key: "emailed",
      header: "Emailed",
      hideBelow: "lg",
      cell: (t) =>
        t.emailedAt ? (
          <span className="inline-flex items-center gap-1 text-xs text-emerald-700">
            <MailCheck className="h-3.5 w-3.5" /> {formatRelative(t.emailedAt)}
          </span>
        ) : (
          <span className="text-xs text-[#94a3b8]">Not sent</span>
        ),
    },
    { key: "issued", header: "Issued", hideBelow: "lg", cell: (t) => <span className="text-[#64748b]">{formatDate(t.createdAt)}</span> },
    { key: "actions", header: "", align: "right", cell: (t) => <RowActions actions={actionsFor(t)} label={`Actions for ${t.registration.name}`} /> },
  ]

  const chips: ActiveFilter[] = [
    values.search && { key: "search", label: `Search: "${values.search}"`, onRemove: () => set({ search: "" }) },
    values.used && { key: "used", label: values.used === "yes" ? "Checked in" : "Not checked in", onRemove: () => set({ used: "" }) },
  ].filter(Boolean) as ActiveFilter[]

  return (
    <>
      <PageHeader
        title="Tickets & check-in"
        description="Every registration gets a QR ticket. Scan it at the entrance to check people in."
        breadcrumbs={[{ label: "Dashboard", to: "/dashboard" }, { label: "Tickets" }]}
        actions={
          eventId && (
            <>
              <Button variant="outline" onClick={() => void downloadZip()} disabled={zipping || !stats?.total}>
                {zipping ? <Loader2 className="animate-spin" /> : <FileArchive />} Download all (ZIP)
              </Button>
              {write && (
                <>
                  <Button variant="outline" onClick={() => void emailMany({ eventId, onlyUnsent: true })} disabled={!stats || stats.total === stats.emailed}>
                    <Send /> Email unsent
                  </Button>
                  <Button onClick={() => navigate(`/dashboard/tickets/scan?eventId=${eventId}`)}>
                    <ScanLine /> Open scanner
                  </Button>
                </>
              )}
            </>
          )
        }
      />

      <EventPicker value={eventId} onChange={setEventId} className="mb-6" />

      {!eventId ? (
        <EmptyState icon={CalendarDays} title="Choose an event" description="Pick an event above to see its tickets." />
      ) : (
        <>
          <StatsRow
            loading={statsQ.initialLoading}
            items={[
              { label: "Tickets", value: stats?.total, icon: TicketIcon, accent: "purple", hint: "cancelled excluded" },
              { label: "Checked in", value: stats?.used, icon: CheckCircle2, accent: "green", hint: stats ? `${stats.rate}% of tickets` : undefined },
              { label: "Not yet", value: stats?.unused, icon: Clock, accent: "amber" },
              { label: "Emailed", value: stats?.emailed, icon: MailCheck, accent: "blue" },
            ]}
          />

          <Toolbar>
            <SearchInput value={values.search} onChange={(v) => set({ search: v })} placeholder="Search name, email or ticket no…" />
            <FilterSelect
              value={values.used}
              onChange={(used) => set({ used })}
              allLabel="Everyone"
              options={[
                { value: "yes", label: "Checked in" },
                { value: "no", label: "Not checked in" },
              ]}
              className="sm:w-44"
            />
          </Toolbar>
          <FilterChips filters={chips} onClearAll={() => reset(["eventId"])} />

          <BulkActionBar count={selected.size} onClear={() => setSelected(new Set())}>
            <Button size="sm" variant="outline" onClick={() => void downloadZip([...selected])} disabled={zipping}>
              <FileArchive /> Download ZIP
            </Button>
            {write && (
              <Button size="sm" variant="outline" onClick={() => void emailMany({ ids: [...selected] })}>
                <Mail /> Email selected
              </Button>
            )}
          </BulkActionBar>

          {list.error ? (
            <ErrorState message={list.error} onRetry={list.reload} />
          ) : !list.loading && tickets.length === 0 ? (
            hasFilters ? (
              <NoResults onClear={() => reset(["eventId"])} />
            ) : (
              <EmptyState icon={TicketIcon} title="No tickets yet" description="Tickets are created automatically when someone registers for this event." />
            )
          ) : (
            <>
              <ServerTable
                columns={columns}
                rows={tickets}
                rowKey={(t) => t.id}
                loading={list.loading}
                onRowClick={(t) => setOpen(t)}
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
                    for (const t of tickets) {
                      if (checked) next.add(t.id)
                      else next.delete(t.id)
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

          <TicketDialog
            ticket={open}
            onOpenChange={(o) => !o && setOpen(null)}
            canWrite={write}
            onDownload={(t) => void downloadPdf(t)}
            onEmail={(t) => void emailOne(t)}
            onCheckIn={(t) => void checkIn(t)}
            onUndo={(t) => void undo(t)}
          />
        </>
      )}
    </>
  )
}
