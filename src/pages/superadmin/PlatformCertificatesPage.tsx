import { useEffect, useState } from "react"
import { Link } from "react-router"
import { toast } from "sonner"
import { Award, Ban, Building2, Download, ExternalLink, Eye, FileWarning, Loader2, RotateCcw, ShieldAlert, ShieldCheck } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { SelectField, TextareaField } from "@/components/ui/form-fields"
import { PageHeader } from "@/components/app/PageHeader"
import { StatsRow } from "@/components/app/StatCard"
import { SegmentedTabs } from "@/components/app/SegmentedTabs"
import { Toolbar, SearchInput, FilterSelect, FilterChips, type ActiveFilter } from "@/components/app/Toolbar"
import { ServerTable, type Column } from "@/components/app/ServerTable"
import { PaginationBar } from "@/components/app/PaginationBar"
import { RowActions, type RowAction } from "@/components/app/RowActions"
import { StatusBadge } from "@/components/app/StatusBadge"
import { EmptyState, ErrorState, NoResults } from "@/components/app/States"
import { FormError } from "@/components/auth/AuthShell"
import { usePdfUrl } from "@/components/certificates/pdf"
import { useApi } from "@/hooks/useApi"
import { useUrlState } from "@/hooks/useUrlState"
import { api, buildQuery, errorMessage } from "@/lib/api"
import { statusOptions } from "@/lib/status"
import { formatDate, formatDateTime, plural } from "@/lib/format"
import type { CertificateEventOption, CertificateStatsAll, PlatformCertificate, TenantRow } from "@/types/superadmin"

/** Revoke one certificate (reason is shown on the public verify page). */
function RevokeDialog({ cert, onOpenChange, onDone }: { cert: PlatformCertificate | null; onOpenChange: (o: boolean) => void; onDone: () => void }) {
  const [reason, setReason] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  useEffect(() => {
    setReason("")
    setError(null)
  }, [cert])

  async function save() {
    if (!cert) return
    if (reason.trim().length < 3) return setError("Give a short reason (it's shown on the verify page)")
    setSaving(true)
    try {
      await api.post(`/superadmin/certificates/${cert.id}/revoke`, { reason: reason.trim() })
      toast.success(`${cert.recipientName}'s certificate was revoked`, {
        action: { label: "Undo", onClick: () => void api.post(`/superadmin/certificates/${cert.id}/restore`).then(onDone) },
      })
      onOpenChange(false)
      onDone()
    } catch (err) {
      setError(errorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={cert !== null} onOpenChange={(o) => !saving && onOpenChange(o)}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Revoke this certificate?</DialogTitle>
          <DialogDescription>
            {cert?.recipientName} · <span className="font-mono">{cert?.verifyCode}</span>. The record is kept; the public verify page shows it as revoked with your reason.
          </DialogDescription>
        </DialogHeader>
        <TextareaField label="Reason" required rows={3} value={reason} onChange={(e) => (setReason(e.target.value), setError(null))} error={error ?? undefined} placeholder="e.g. Issued by mistake" />
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={() => void save()} disabled={saving}>
            {saving ? <Loader2 className="animate-spin" /> : <Ban />} Revoke
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function DetailsDialog({
  certId,
  onOpenChange,
  onRevoke,
  onRestore,
}: {
  certId: string | null
  onOpenChange: (o: boolean) => void
  onRevoke: (c: PlatformCertificate) => void
  onRestore: (c: PlatformCertificate) => void
}) {
  const { data: c, error } = useApi<PlatformCertificate>(certId ? `/superadmin/certificates/${certId}` : null)
  const pdf = usePdfUrl(certId ? `/superadmin/certificates/${certId}/pdf?inline=1` : null)
  return (
    <Dialog open={certId !== null} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle>{c ? `${c.recipientName}'s certificate` : "Certificate"}</DialogTitle>
          <DialogDescription>{c && <span className="font-mono">{c.verifyCode}</span>}</DialogDescription>
        </DialogHeader>
        {error && <FormError message={error} />}
        <div className="grid gap-5 lg:grid-cols-[1.3fr_1fr]">
          <div className="relative aspect-[1.414] overflow-hidden rounded-xl border border-[#e9e4ff] bg-[#faf8ff]">
            {pdf.url && <iframe title="Certificate" src={`${pdf.url}#toolbar=0&navpanes=0&view=Fit`} className="h-full w-full" />}
            {pdf.loading && (
              <div className="absolute inset-0 flex items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-[#7c3aed]" />
              </div>
            )}
          </div>
          {c && (
            <dl className="space-y-2 text-sm">
              {[
                ["Status", <StatusBadge key="s" kind="cert" value={c.status} />],
                ["Integrity", c.hashMatches ? <span key="i" className="inline-flex items-center gap-1 text-emerald-700"><ShieldCheck className="h-4 w-4" /> Hash matches</span> : <span key="i" className="inline-flex items-center gap-1 text-rose-700"><ShieldAlert className="h-4 w-4" /> Tampered</span>],
                ["Type", <StatusBadge key="t" kind="certType" value={c.type} />],
                ["Recipient", `${c.recipientName} · ${c.recipientEmail}`],
                ["Event", c.event.title],
                ["Organization", c.organization ? <Link key="o" to={`/superadmin/tenants/${c.organization.id}`} className="text-[#7c3aed] hover:underline">{c.organization.name}</Link> : "—"],
                ["Issued", formatDateTime(c.issuedAt)],
                ["Downloads", c.downloadCount.toLocaleString()],
                ["Emailed", c.emailedAt ? formatDateTime(c.emailedAt) : "Not yet"],
                ...(c.status === "REVOKED" ? [["Revoked", `${formatDateTime(c.revokedAt)} — ${c.revokeReason ?? ""}`]] : []),
              ].map(([k, v]) => (
                <div key={String(k)} className="flex items-start justify-between gap-4 border-b border-[#f1f5f9] pb-2">
                  <dt className="text-[#64748b]">{k}</dt>
                  <dd className="text-right font-medium text-[#0f172a]">{v}</dd>
                </div>
              ))}
              <p className="break-all pt-1 font-mono text-[10px] text-[#94a3b8]">SHA-256 {c.sha256Hash}</p>
            </dl>
          )}
        </div>
        {c && (
          <DialogFooter>
            <Button asChild variant="outline">
              <a href={`/verify/${c.verifyCode}`} target="_blank" rel="noreferrer">
                <ExternalLink /> Public verify page
              </a>
            </Button>
            {c.status === "ISSUED" ? (
              <Button variant="destructive" onClick={() => onRevoke(c)}>
                <Ban /> Revoke…
              </Button>
            ) : (
              <Button onClick={() => onRestore(c)}>
                <RotateCcw /> Restore
              </Button>
            )}
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  )
}

/** Revoke every valid certificate of one event or one organization (with a count check first). */
function BulkRevokeDialog({ open, onOpenChange, tenants, onDone }: { open: boolean; onOpenChange: (o: boolean) => void; tenants: TenantRow[]; onDone: () => void }) {
  const [scope, setScope] = useState<"event" | "org">("event")
  const [eventId, setEventId] = useState("")
  const [orgId, setOrgId] = useState("")
  const [reason, setReason] = useState("")
  const [count, setCount] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const eventsQ = useApi<CertificateEventOption[]>(open ? "/superadmin/certificates/events" : null)

  useEffect(() => {
    if (open) {
      setScope("event")
      setEventId("")
      setOrgId("")
      setReason("")
      setCount(null)
      setError(null)
    }
  }, [open])
  useEffect(() => setCount(null), [scope, eventId, orgId])

  const target = scope === "event" ? { eventId } : { orgId }
  const chosen = scope === "event" ? eventId : orgId

  async function step() {
    if (!chosen) return setError(scope === "event" ? "Choose an event" : "Choose an organization")
    if (reason.trim().length < 3) return setError("Give a short reason (it's shown on the verify page)")
    setBusy(true)
    setError(null)
    try {
      if (count === null) {
        const res = await api.post<{ count: number }>("/superadmin/certificates/bulk-revoke", { ...target, reason: reason.trim(), dryRun: true })
        setCount(res.count)
      } else {
        const res = await api.post<{ count: number }>("/superadmin/certificates/bulk-revoke", { ...target, reason: reason.trim() })
        toast.success(`${plural(res.count, "certificate")} revoked`)
        onOpenChange(false)
        onDone()
      }
    } catch (err) {
      setError(errorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !busy && onOpenChange(o)}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Bulk revoke</DialogTitle>
          <DialogDescription>Revoke every valid certificate of one event or one organization — e.g. after fraud. Each can still be restored one by one.</DialogDescription>
        </DialogHeader>
        {error && <FormError message={error} />}
        <div className="flex gap-1 rounded-lg bg-[#f5f3ff] p-1" role="tablist">
          {(
            [
              ["event", "One event"],
              ["org", "One organization"],
            ] as const
          ).map(([v, l]) => (
            <button key={v} type="button" role="tab" aria-selected={scope === v} onClick={() => setScope(v)} className={cn("flex-1 rounded-md px-3 py-1.5 text-sm font-medium", scope === v ? "bg-white text-[#7c3aed] shadow-sm" : "text-[#64748b]")}>
              {l}
            </button>
          ))}
        </div>
        {scope === "event" ? (
          <SelectField
            label="Event"
            placeholder={eventsQ.initialLoading ? "Loading…" : "Choose an event"}
            value={eventId}
            onChange={(e) => setEventId(e.target.value)}
            options={(eventsQ.data ?? []).map((e) => ({ value: e.id, label: `${e.title} — ${e.organization.name} (${e.certificates})` }))}
          />
        ) : (
          <SelectField label="Organization" placeholder="Choose an organization" value={orgId} onChange={(e) => setOrgId(e.target.value)} options={tenants.map((t) => ({ value: t.id, label: t.name }))} />
        )}
        <TextareaField label="Reason" required rows={2} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Shown on the public verify page" />
        {count !== null && (
          <div className={cn("rounded-xl border p-3 text-sm", count ? "border-rose-200 bg-rose-50 text-rose-800" : "border-[#e9e4ff] bg-[#faf8ff] text-[#475569]")}>
            {count ? (
              <>
                This will revoke <strong>{plural(count, "valid certificate")}</strong>. Click again to confirm.
              </>
            ) : (
              "There are no valid certificates to revoke here."
            )}
          </div>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={busy}>
            Cancel
          </Button>
          <Button variant={count ? "destructive" : "default"} onClick={() => void step()} disabled={busy || count === 0}>
            {busy && <Loader2 className="animate-spin" />} {count === null ? "Check how many" : `Revoke ${plural(count, "certificate")}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default function PlatformCertificatesPage() {
  const { values, set, reset } = useUrlState({ status: "", type: "", orgId: "", search: "", cert: "", page: "1", limit: "20" })
  const page = Number(values.page) || 1
  const limit = Number(values.limit) || 20
  const list = useApi<PlatformCertificate[]>(`/superadmin/certificates${buildQuery({ status: values.status, type: values.type, orgId: values.orgId, search: values.search, page, limit })}`)
  const statsQ = useApi<CertificateStatsAll>("/superadmin/certificates/stats")
  const tenantsQ = useApi<TenantRow[]>("/superadmin/tenants?limit=100&sort=name")
  const [revoking, setRevoking] = useState<PlatformCertificate | null>(null)
  const [bulkOpen, setBulkOpen] = useState(false)
  const [detailVersion, setDetailVersion] = useState(0)

  const rows = list.data ?? []
  const stats = statsQ.data
  const tenants = tenantsQ.data ?? []
  const hasFilters = Boolean(values.type || values.orgId || values.search)

  function refresh() {
    list.reload()
    statsQ.reload()
    setDetailVersion((v) => v + 1)
  }

  async function restore(c: PlatformCertificate) {
    try {
      await api.post(`/superadmin/certificates/${c.id}/restore`)
      toast.success(`${c.recipientName}'s certificate is valid again`)
      refresh()
    } catch (err) {
      toast.error(errorMessage(err))
    }
  }

  async function download(c: PlatformCertificate) {
    try {
      await api.download(`/superadmin/certificates/${c.id}/pdf`, `${c.verifyCode}.pdf`)
    } catch (err) {
      toast.error(errorMessage(err, "Download failed."))
    }
  }

  const actionsFor = (c: PlatformCertificate): RowAction[] => [
    { label: "View details", icon: Eye, onClick: () => set({ cert: c.id }) },
    { label: "Download PDF", icon: Download, onClick: () => void download(c) },
    { label: "Revoke…", icon: Ban, destructive: true, separatorBefore: true, hidden: c.status !== "ISSUED", onClick: () => setRevoking(c) },
    { label: "Restore", icon: RotateCcw, separatorBefore: true, hidden: c.status !== "REVOKED", onClick: () => void restore(c) },
  ]

  const columns: Column<PlatformCertificate>[] = [
    {
      key: "who",
      header: "Recipient",
      cell: (c) => (
        <div className="min-w-0">
          <p className="truncate font-medium text-[#0f172a]">{c.recipientName}</p>
          <p className="truncate text-xs text-[#94a3b8]">{c.recipientEmail}</p>
        </div>
      ),
    },
    { key: "code", header: "Verify code", hideBelow: "sm", cell: (c) => <span className="font-mono text-xs text-[#334155]">{c.verifyCode}</span> },
    {
      key: "event",
      header: "Event · organization",
      hideBelow: "md",
      cell: (c) => (
        <div className="min-w-0 text-xs">
          <p className="truncate text-[#334155]">{c.event.title}</p>
          <p className="truncate text-[#94a3b8]">{c.organization?.name ?? "—"}</p>
        </div>
      ),
    },
    { key: "type", header: "Type", hideBelow: "lg", cell: (c) => <StatusBadge kind="certType" value={c.type} /> },
    { key: "status", header: "Status", cell: (c) => <StatusBadge kind="cert" value={c.status} /> },
    { key: "dl", header: "Downloads", hideBelow: "lg", align: "right", cell: (c) => <span className="tabular-nums text-[#64748b]">{c.downloadCount}</span> },
    { key: "issued", header: "Issued", hideBelow: "lg", cell: (c) => <span className="text-xs text-[#64748b]">{formatDate(c.issuedAt)}</span> },
    { key: "actions", header: "", align: "right", cell: (c) => <RowActions actions={actionsFor(c)} label={`Actions for ${c.recipientName}`} /> },
  ]

  const chips: ActiveFilter[] = [
    values.search && { key: "search", label: `Search: "${values.search}"`, onRemove: () => set({ search: "" }) },
    values.orgId && { key: "orgId", label: `Organization: ${tenants.find((t) => t.id === values.orgId)?.name ?? "…"}`, onRemove: () => set({ orgId: "" }) },
    values.type && { key: "type", label: `Type: ${statusOptions("certType").find((o) => o.value === values.type)?.label ?? values.type}`, onRemove: () => set({ type: "" }) },
  ].filter(Boolean) as ActiveFilter[]

  return (
    <>
      <PageHeader
        title="Certificates"
        description="Every certificate issued on EventoraX. Look one up by verify code, name or email."
        breadcrumbs={[{ label: "Superadmin", to: "/superadmin" }, { label: "Certificates" }]}
        actions={
          <Button variant="outline" onClick={() => setBulkOpen(true)}>
            <FileWarning /> Bulk revoke…
          </Button>
        }
      />
      <StatsRow
        loading={statsQ.initialLoading}
        items={[
          { label: "Valid", value: stats?.issued, icon: Award, accent: "green" },
          { label: "Revoked", value: stats?.revoked, icon: Ban, accent: "red" },
          { label: "Downloads", value: stats?.downloads, icon: Download, accent: "blue" },
          { label: "Issuing organizations", value: stats?.organizations, icon: Building2, accent: "purple" },
        ]}
      />
      <SegmentedTabs
        value={values.status}
        onChange={(status) => set({ status })}
        options={[
          { value: "", label: "All" },
          { value: "ISSUED", label: "Valid" },
          { value: "REVOKED", label: "Revoked" },
        ]}
      />
      <Toolbar>
        <SearchInput value={values.search} onChange={(v) => set({ search: v })} placeholder="Verify code (EVX-…), name or email…" />
        <FilterSelect value={values.orgId} onChange={(orgId) => set({ orgId })} allLabel="All organizations" options={tenants.map((t) => ({ value: t.id, label: t.name }))} className="sm:w-56" />
        <FilterSelect value={values.type} onChange={(type) => set({ type })} allLabel="Any type" options={statusOptions("certType")} />
      </Toolbar>
      <FilterChips filters={chips} onClearAll={() => reset(values.status ? ["status"] : [])} />

      {list.error ? (
        <ErrorState message={list.error} onRetry={list.reload} />
      ) : !list.loading && rows.length === 0 ? (
        hasFilters || values.status ? <NoResults onClear={() => reset([])} /> : <EmptyState icon={Award} title="No certificates yet" description="Certificates appear here as organizations issue them." />
      ) : (
        <>
          <ServerTable columns={columns} rows={rows} rowKey={(c) => c.id} loading={list.loading} onRowClick={(c) => set({ cert: c.id })} />
          {list.meta && <PaginationBar page={page} limit={limit} total={list.meta.total} onPageChange={(p) => set({ page: String(p) })} onLimitChange={(l) => set({ limit: String(l) })} />}
        </>
      )}

      <DetailsDialog
        key={`${values.cert}-${detailVersion}`}
        certId={values.cert || null}
        onOpenChange={(o) => !o && set({ cert: "", page: values.page })}
        onRevoke={setRevoking}
        onRestore={(c) => void restore(c)}
      />
      <RevokeDialog cert={revoking} onOpenChange={(o) => !o && setRevoking(null)} onDone={refresh} />
      <BulkRevokeDialog open={bulkOpen} onOpenChange={setBulkOpen} tenants={tenants} onDone={refresh} />
    </>
  )
}
