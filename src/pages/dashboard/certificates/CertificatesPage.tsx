import { useEffect, useState } from "react"
import { Link } from "react-router"
import { toast } from "sonner"
import { Award, CalendarDays, Copy, Download, Eye, Mail, MailCheck, Palette, RotateCcw, Send, ShieldOff, Users } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
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
import { TemplatePickerDialog } from "@/components/certificates/TemplatePickerDialog"
import { BulkIssueDialog, IssueOneDialog, RevokeDialog } from "@/components/certificates/IssueDialogs"
import { openPdf } from "@/components/certificates/pdf"
import { useApi } from "@/hooks/useApi"
import { useUrlState } from "@/hooks/useUrlState"
import { useSelectedEvent } from "@/hooks/useSelectedEvent"
import { useCan } from "@/lib/permissions"
import { api, buildQuery, errorMessage } from "@/lib/api"
import { formatDate, formatRelative, plural } from "@/lib/format"
import { statusLabel, statusOptions } from "@/lib/status"
import type { EventItem } from "@/types/event"
import type { Certificate, CertificateStats, TemplatesResponse } from "@/types/certificate"

function templateName(key: string | null, catalogue: TemplatesResponse | null) {
  const t = catalogue?.templates.find((x) => x.key === (key ?? "classic-royal"))
  return t ? `${t.layoutName} · ${t.variantName}` : "Classic · Royal"
}

export default function CertificatesPage() {
  const can = useCan()
  const [eventId, setEventId] = useSelectedEvent()
  const { values, set, reset } = useUrlState({ search: "", status: "", type: "", emailed: "", page: "1", limit: "20" })
  const page = Number(values.page) || 1
  const limit = Number(values.limit) || 20

  const list = useApi<Certificate[]>(
    eventId ? `/certificates${buildQuery({ eventId, search: values.search, status: values.status, type: values.type, emailed: values.emailed, page, limit })}` : null
  )
  const statsQ = useApi<CertificateStats>(eventId ? `/certificates/stats?eventId=${eventId}` : null)
  const eventQ = useApi<EventItem>(eventId ? `/events/${eventId}` : null)
  const catalogue = useApi<TemplatesResponse>("/certificates/templates")

  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [issueOpen, setIssueOpen] = useState(false)
  const [bulkOpen, setBulkOpen] = useState(false)
  const [designOpen, setDesignOpen] = useState(false)
  const [revoking, setRevoking] = useState<Certificate | null>(null)
  const [savingAuto, setSavingAuto] = useState(false)

  const event = eventQ.data
  const archived = event?.status === "ARCHIVED"
  const write = can("write") && !archived
  const certs = list.data ?? []
  const stats = statsQ.data
  const hasFilters = Boolean(values.search || values.status || values.type || values.emailed)

  useEffect(() => setSelected(new Set()), [eventId, values.search, values.status, values.type, values.emailed])

  function refresh() {
    list.reload()
    statsQ.reload()
  }

  async function updateEvent(fields: Partial<Pick<EventItem, "certTemplateId" | "autoIssueCert">>) {
    await api.patch(`/events/${eventId}`, fields)
    eventQ.reload()
  }

  async function toggleAutoIssue(on: boolean) {
    setSavingAuto(true)
    try {
      await updateEvent({ autoIssueCert: on })
      toast.success(on ? "Certificates will be issued and emailed automatically at check-in" : "Automatic certificates turned off", {
        action: { label: "Undo", onClick: () => void updateEvent({ autoIssueCert: !on }).catch((err) => toast.error(errorMessage(err))) },
      })
    } catch (err) {
      toast.error(errorMessage(err))
    } finally {
      setSavingAuto(false)
    }
  }

  async function saveTemplate(key: string) {
    try {
      await updateEvent({ certTemplateId: key })
      toast.success(`Design changed to ${templateName(key, catalogue.data)}`, { description: "Used for certificates issued from now on." })
    } catch (err) {
      toast.error(errorMessage(err))
      throw err
    }
  }

  async function view(c: Certificate) {
    try {
      await openPdf(`/certificates/${c.id}/pdf?inline=1`)
    } catch (err) {
      toast.error(errorMessage(err, "Couldn't open the PDF."))
    }
  }

  async function download(c: Certificate) {
    try {
      await api.download(`/certificates/${c.id}/pdf`, `${c.verifyCode}.pdf`)
      list.reload()
    } catch (err) {
      toast.error(errorMessage(err, "Download failed."))
    }
  }

  async function email(c: Certificate) {
    try {
      await api.post(`/certificates/${c.id}/email`)
      toast.success(`Certificate emailed to ${c.recipientEmail}`)
      refresh()
    } catch (err) {
      toast.error(errorMessage(err))
    }
  }

  async function emailSelected() {
    try {
      const res = await api.post<{ sending: number; skipped: number }>("/certificates/email", { ids: [...selected] })
      toast.success(`Emailing ${plural(res.sending, "certificate")}`, {
        description: res.skipped ? `${res.skipped} revoked skipped` : "They go out in the background — refresh in a moment to see them marked as sent.",
      })
      setSelected(new Set())
      setTimeout(refresh, 3000)
    } catch (err) {
      toast.error(errorMessage(err))
    }
  }

  async function restore(c: Certificate, quiet = false) {
    try {
      await api.post(`/certificates/${c.id}/restore`)
      if (!quiet) toast.success(`${c.recipientName}'s certificate is valid again`)
      refresh()
    } catch (err) {
      toast.error(errorMessage(err))
    }
  }

  function copyLink(c: Certificate) {
    const url = `${window.location.origin}/verify/${c.verifyCode}`
    navigator.clipboard.writeText(url).then(
      () => toast.success("Verify link copied"),
      () => toast.error("Couldn't copy — the link is " + url)
    )
  }

  const actionsFor = (c: Certificate): RowAction[] => [
    { label: "View PDF", icon: Eye, onClick: () => void view(c) },
    { label: "Download", icon: Download, onClick: () => void download(c) },
    { label: "Copy verify link", icon: Copy, onClick: () => copyLink(c) },
    { label: c.emailedAt ? "Email again" : "Email to attendee", icon: Mail, hidden: !write || c.status === "REVOKED", onClick: () => void email(c) },
    { label: "Revoke", icon: ShieldOff, destructive: true, separatorBefore: true, hidden: !write || c.status === "REVOKED", onClick: () => setRevoking(c) },
    { label: "Restore", icon: RotateCcw, separatorBefore: true, hidden: !write || c.status === "ISSUED", onClick: () => void restore(c) },
  ]

  const columns: Column<Certificate>[] = [
    {
      key: "recipient",
      header: "Recipient",
      cell: (c) => (
        <div className="min-w-0">
          <p className="truncate font-medium text-[#0f172a]">{c.recipientName}</p>
          <p className="truncate text-xs text-[#94a3b8]">{c.recipientEmail}</p>
        </div>
      ),
    },
    { key: "type", header: "Type", hideBelow: "md", cell: (c) => <StatusBadge kind="certType" value={c.type} /> },
    {
      key: "code",
      header: "Verify code",
      cell: (c) => (
        <a href={`/verify/${c.verifyCode}`} target="_blank" rel="noopener noreferrer" className="font-mono text-xs text-[#7c3aed] hover:underline">
          {c.verifyCode}
        </a>
      ),
    },
    { key: "issued", header: "Issued", hideBelow: "lg", cell: (c) => <span className="whitespace-nowrap text-[#64748b]">{formatDate(c.issuedAt)}</span> },
    { key: "downloads", header: "Downloads", hideBelow: "lg", align: "center", cell: (c) => <span className="tabular-nums">{c.downloadCount}</span> },
    {
      key: "emailed",
      header: "Emailed",
      hideBelow: "md",
      cell: (c) =>
        c.emailedAt ? (
          <span className="inline-flex items-center gap-1 text-xs text-emerald-700" title={formatDate(c.emailedAt)}>
            <MailCheck className="h-3.5 w-3.5" /> {formatRelative(c.emailedAt)}
          </span>
        ) : (
          <span className="text-xs text-[#94a3b8]">Not sent</span>
        ),
    },
    {
      key: "status",
      header: "Status",
      cell: (c) => (
        <span title={c.revokeReason ?? undefined}>
          <StatusBadge kind="cert" value={c.status} />
        </span>
      ),
    },
    { key: "actions", header: "", align: "right", cell: (c) => <RowActions actions={actionsFor(c)} label={`Actions for ${c.recipientName}`} /> },
  ]

  const chips: ActiveFilter[] = [
    values.search && { key: "search", label: `Search: "${values.search}"`, onRemove: () => set({ search: "" }) },
    values.status && { key: "status", label: statusLabel("cert", values.status), onRemove: () => set({ status: "" }) },
    values.type && { key: "type", label: statusLabel("certType", values.type), onRemove: () => set({ type: "" }) },
    values.emailed && { key: "emailed", label: values.emailed === "yes" ? "Emailed" : "Not emailed", onRemove: () => set({ emailed: "" }) },
  ].filter(Boolean) as ActiveFilter[]

  return (
    <>
      <PageHeader
        title="Certificates"
        description="Issue, email and verify certificates. Each one has a unique code and QR anyone can check."
        breadcrumbs={[{ label: "Dashboard", to: "/dashboard" }, { label: "Certificates" }]}
        actions={
          eventId &&
          write && (
            <>
              <Button variant="outline" onClick={() => setIssueOpen(true)}>
                <Award /> Issue one
              </Button>
              <Button onClick={() => setBulkOpen(true)}>
                <Users /> Issue to attendees
              </Button>
            </>
          )
        }
      />

      <EventPicker value={eventId} onChange={setEventId} className="mb-6" />

      {!eventId ? (
        <EmptyState icon={CalendarDays} title="Choose an event" description="Pick an event above to manage its certificates." />
      ) : (
        <>
          <StatsRow
            loading={statsQ.initialLoading}
            items={[
              { label: "Issued", value: stats?.issued, icon: Award, accent: "purple", hint: stats?.revoked ? `${stats.revoked} revoked` : "valid certificates" },
              { label: "Emailed", value: stats?.emailed, icon: Send, accent: "blue" },
              { label: "Downloads", value: stats?.downloads, icon: Download, accent: "green" },
              { label: "Waiting", value: stats?.awaitingParticipation, icon: Users, accent: "amber", hint: "attended, no certificate yet" },
            ]}
          />

          {/* Design + automation for this event */}
          {event && (
            <section className="mb-6 flex flex-wrap items-center gap-4 rounded-2xl border border-[#e9e4ff] bg-white p-4 shadow-sm">
              <div className="flex min-w-0 flex-1 items-center gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#f5f3ff] text-[#7c3aed]">
                  <Palette className="h-5 w-5" />
                </span>
                <div className="min-w-0">
                  <p className="text-xs text-[#94a3b8]">Design for this event</p>
                  <p className="truncate font-medium text-[#0f172a]">{templateName(event.certTemplateId, catalogue.data)}</p>
                </div>
                {write && (
                  <Button variant="outline" size="sm" onClick={() => setDesignOpen(true)}>
                    Change design
                  </Button>
                )}
              </div>
              <label className="flex items-center gap-3 rounded-xl bg-[#faf8ff] px-3 py-2">
                <span className="text-sm">
                  <span className="block font-medium text-[#0f172a]">Issue automatically at check-in</span>
                  <span className="block text-xs text-[#64748b]">Participation certificate + email when marked Attended</span>
                </span>
                <Switch checked={event.autoIssueCert} onCheckedChange={(v) => void toggleAutoIssue(v)} disabled={!write || savingAuto} />
              </label>
              <p className="w-full text-xs text-[#94a3b8]">
                Logo, signatory name and signature come from{" "}
                <Link to="/dashboard/settings?tab=certificates" className="text-[#7c3aed] hover:underline">
                  Settings → Certificates
                </Link>
                .
              </p>
            </section>
          )}

          <Toolbar>
            <SearchInput value={values.search} onChange={(v) => set({ search: v })} placeholder="Search name, email or code…" />
            <FilterSelect value={values.status} onChange={(status) => set({ status })} allLabel="Any status" options={statusOptions("cert")} className="sm:w-36" />
            <FilterSelect value={values.type} onChange={(type) => set({ type })} allLabel="All types" options={statusOptions("certType")} className="sm:w-40" />
            <FilterSelect
              value={values.emailed}
              onChange={(emailed) => set({ emailed })}
              allLabel="Emailed or not"
              options={[
                { value: "yes", label: "Emailed" },
                { value: "no", label: "Not emailed" },
              ]}
              className="sm:w-40"
            />
          </Toolbar>
          <FilterChips filters={chips} onClearAll={() => reset(["eventId"])} />

          {write && (
            <BulkActionBar count={selected.size} onClear={() => setSelected(new Set())}>
              <Button size="sm" variant="outline" onClick={() => void emailSelected()}>
                <Mail /> Email selected
              </Button>
            </BulkActionBar>
          )}

          {list.error ? (
            <ErrorState message={list.error} onRetry={list.reload} />
          ) : !list.loading && certs.length === 0 ? (
            hasFilters ? (
              <NoResults onClear={() => reset(["eventId"])} />
            ) : (
              <EmptyState
                icon={Award}
                title="No certificates yet"
                description={
                  stats && stats.awaitingParticipation > 0
                    ? `${plural(stats.awaitingParticipation, "attendee")} marked Attended can get a certificate now.`
                    : "Mark attendees as Attended on the Registrations page, then issue certificates here."
                }
                action={
                  write && (
                    <Button onClick={() => setBulkOpen(true)}>
                      <Users /> Issue to attendees
                    </Button>
                  )
                }
              />
            )
          ) : (
            <>
              <ServerTable
                columns={columns}
                rows={certs}
                rowKey={(c) => c.id}
                loading={list.loading}
                selectedIds={write ? selected : undefined}
                onToggleRow={
                  write
                    ? (id) =>
                        setSelected((s) => {
                          const next = new Set(s)
                          if (next.has(id)) next.delete(id)
                          else next.add(id)
                          return next
                        })
                    : undefined
                }
                onToggleAll={(checked) =>
                  setSelected((s) => {
                    const next = new Set(s)
                    for (const c of certs) {
                      if (checked) next.add(c.id)
                      else next.delete(c.id)
                    }
                    return next
                  })
                }
              />
              {list.meta && (
                <PaginationBar
                  page={page}
                  limit={limit}
                  total={list.meta.total}
                  onPageChange={(p) => set({ page: String(p) })}
                  onLimitChange={(l) => set({ limit: String(l) })}
                />
              )}
            </>
          )}

          {write && (
            <>
              <IssueOneDialog open={issueOpen} onOpenChange={setIssueOpen} eventId={eventId} onIssued={refresh} />
              <BulkIssueDialog open={bulkOpen} onOpenChange={setBulkOpen} eventId={eventId} awaiting={stats?.awaitingParticipation ?? 0} onIssued={refresh} />
              <TemplatePickerDialog open={designOpen} onOpenChange={setDesignOpen} eventId={eventId} value={event?.certTemplateId ?? null} onSave={saveTemplate} />
              <RevokeDialog
                cert={revoking}
                onOpenChange={(o) => !o && setRevoking(null)}
                onRevoked={(c) => {
                  toast.success(`${c.recipientName}'s certificate was revoked`, { action: { label: "Undo", onClick: () => void restore(c, false) } })
                  refresh()
                }}
              />
            </>
          )}
        </>
      )}
    </>
  )
}
