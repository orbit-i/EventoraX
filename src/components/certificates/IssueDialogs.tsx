import { useEffect, useState } from "react"
import { toast } from "sonner"
import { Award, Check, Loader2, Search } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Skeleton } from "@/components/ui/skeleton"
import { SelectField, TextareaField } from "@/components/ui/form-fields"
import { FormError } from "@/components/auth/AuthShell"
import { StatusBadge } from "@/components/app/StatusBadge"
import { useApi } from "@/hooks/useApi"
import { api, buildQuery, errorMessage } from "@/lib/api"
import { plural } from "@/lib/format"
import { statusOptions } from "@/lib/status"
import type { CertCandidate, CertType, Certificate } from "@/types/certificate"

const TYPE_HELP: Record<CertType, string> = {
  PARTICIPATION: "For attendees who were there (marked Attended).",
  ACHIEVEMENT: "For winners and top performers who attended.",
  APPRECIATION: "To thank volunteers, judges or partners.",
  SPEAKER: "For people who spoke at the event.",
  ORGANIZER: "For the team who ran the event.",
}

function EmailToggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-[#e9e4ff] bg-[#faf8ff] p-3">
      <Checkbox checked={checked} onCheckedChange={(v) => onChange(v === true)} className="mt-0.5" />
      <span>
        <span className="block text-sm font-medium text-[#0f172a]">Email the certificate</span>
        <span className="block text-xs text-[#64748b]">The PDF is attached, with a link anyone can use to verify it.</span>
      </span>
    </label>
  )
}

/** Issue a certificate to one attendee. */
export function IssueOneDialog({
  open,
  onOpenChange,
  eventId,
  onIssued,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  eventId: string
  onIssued: () => void
}) {
  const [type, setType] = useState<CertType>("PARTICIPATION")
  const [search, setSearch] = useState("")
  const [debounced, setDebounced] = useState("")
  const [selected, setSelected] = useState<CertCandidate | null>(null)
  const [sendEmail, setSendEmail] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (open) {
      setType("PARTICIPATION")
      setSearch("")
      setDebounced("")
      setSelected(null)
      setSendEmail(true)
      setError(null)
    }
  }, [open])
  useEffect(() => {
    const t = setTimeout(() => setDebounced(search.trim()), 250)
    return () => clearTimeout(t)
  }, [search])
  useEffect(() => setSelected(null), [type])

  const candidates = useApi<CertCandidate[]>(open ? `/certificates/candidates${buildQuery({ eventId, type, search: debounced })}` : null)

  async function issue() {
    if (!selected) return setError("Choose an attendee")
    setBusy(true)
    setError(null)
    try {
      const cert = await api.post<Certificate>("/certificates", { registrationId: selected.id, type, sendEmail })
      toast.success(`Certificate issued to ${selected.name}`, { description: `${cert.verifyCode}${sendEmail ? " · emailed" : ""}` })
      onOpenChange(false)
      onIssued()
    } catch (err) {
      setError(errorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  function reason(c: CertCandidate) {
    if (c.existing) return `Already has one (${c.existing.verifyCode})`
    if (!c.eligible) return "Not marked attended"
    return null
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !busy && onOpenChange(o)}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Issue a certificate</DialogTitle>
          <DialogDescription>Generated straight away with its own verify code.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          {error && <FormError message={error} />}
          <SelectField
            label="Certificate type"
            value={type}
            onChange={(e) => setType(e.target.value as CertType)}
            options={statusOptions("certType")}
            helper={TYPE_HELP[type]}
          />
          <div>
            <p className="mb-1.5 text-sm font-semibold text-[#0f172a]">Attendee</p>
            <div className="relative mb-2">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#94a3b8]" />
              <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search name or email…" className="h-10 pl-9" aria-label="Search attendees" />
            </div>
            <div className="max-h-60 overflow-y-auto rounded-xl border border-[#e9e4ff]" role="listbox" aria-label="Attendees">
              {candidates.initialLoading ? (
                <div className="space-y-2 p-2">
                  {Array.from({ length: 4 }, (_, i) => (
                    <Skeleton key={i} className="h-10 rounded-lg" />
                  ))}
                </div>
              ) : (candidates.data ?? []).length === 0 ? (
                <p className="p-4 text-center text-sm text-[#94a3b8]">{debounced ? "No one matches that search." : "No attendees in this event yet."}</p>
              ) : (
                (candidates.data ?? []).map((c) => {
                  const why = reason(c)
                  const active = selected?.id === c.id
                  return (
                    <button
                      key={c.id}
                      type="button"
                      role="option"
                      aria-selected={active}
                      disabled={Boolean(why)}
                      onClick={() => setSelected(c)}
                      className={cn(
                        "flex w-full items-center gap-3 border-b border-[#f1f5f9] px-3 py-2 text-left last:border-0",
                        active ? "bg-[#f5f3ff]" : "hover:bg-[#faf8ff]",
                        why && "cursor-not-allowed opacity-55 hover:bg-transparent"
                      )}
                    >
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-[#0f172a]">{c.name}</p>
                        <p className="truncate text-xs text-[#94a3b8]">{why ?? c.email}</p>
                      </div>
                      <StatusBadge kind="registration" value={c.status} />
                      {active && <Check className="h-4 w-4 text-[#7c3aed]" />}
                    </button>
                  )
                })
              )}
            </div>
          </div>
          <EmailToggle checked={sendEmail} onChange={setSendEmail} />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={busy}>
            Cancel
          </Button>
          <Button onClick={issue} disabled={busy || !selected}>
            {busy ? <Loader2 className="animate-spin" /> : <Award />} Issue certificate
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

/** Issue to everyone marked Attended who doesn't have this type yet. */
export function BulkIssueDialog({
  open,
  onOpenChange,
  eventId,
  awaiting,
  onIssued,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  eventId: string
  /** Attended attendees without a Participation certificate */
  awaiting: number
  onIssued: () => void
}) {
  const [type, setType] = useState<CertType>("PARTICIPATION")
  const [sendEmail, setSendEmail] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (open) {
      setType("PARTICIPATION")
      setSendEmail(true)
      setError(null)
    }
  }, [open])

  async function run() {
    setBusy(true)
    setError(null)
    try {
      const res = await api.post<{ issued: number; failed: number; emailing?: number; message?: string }>("/certificates/bulk", { eventId, type, sendEmail })
      if (res.issued === 0) toast.info(res.message ?? "No new certificates were needed.")
      else
        toast.success(`${plural(res.issued, "certificate")} issued`, {
          description: [res.failed ? `${res.failed} failed — try again` : null, res.emailing ? `Emailing ${plural(res.emailing, "attendee")} in the background` : null]
            .filter(Boolean)
            .join(" · "),
        })
      onOpenChange(false)
      onIssued()
    } catch (err) {
      setError(errorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !busy && onOpenChange(o)}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Issue to everyone who attended</DialogTitle>
          <DialogDescription>Only attendees marked Attended get one, and nobody gets the same type twice.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          {error && <FormError message={error} />}
          <SelectField
            label="Certificate type"
            value={type}
            onChange={(e) => setType(e.target.value as CertType)}
            options={statusOptions("certType")}
            helper={TYPE_HELP[type]}
          />
          {type === "PARTICIPATION" && (
            <p className={cn("rounded-xl p-3 text-sm", awaiting > 0 ? "bg-[#f5f3ff] text-[#5b21b6]" : "bg-[#f8fafc] text-[#64748b]")}>
              {awaiting > 0
                ? `${plural(awaiting, "attendee")} will get a certificate.`
                : "Everyone marked Attended already has one. Mark more attendees as Attended first."}
            </p>
          )}
          <EmailToggle checked={sendEmail} onChange={setSendEmail} />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={busy}>
            Cancel
          </Button>
          <Button onClick={run} disabled={busy || (type === "PARTICIPATION" && awaiting === 0)}>
            {busy ? <Loader2 className="animate-spin" /> : <Award />}
            {busy ? "Generating…" : "Issue certificates"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

/** Revoke with a reason (shown on the public verify page). */
export function RevokeDialog({
  cert,
  onOpenChange,
  onRevoked,
}: {
  cert: Certificate | null
  onOpenChange: (open: boolean) => void
  onRevoked: (cert: Certificate) => void
}) {
  const [reason, setReason] = useState("")
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (cert) {
      setReason("")
      setError(null)
    }
  }, [cert])

  async function revoke() {
    if (!cert) return
    if (reason.trim().length < 3) return setError("Give a short reason (it's shown on the verify page)")
    setBusy(true)
    setError(null)
    try {
      await api.post(`/certificates/${cert.id}/revoke`, { reason: reason.trim() })
      onOpenChange(false)
      onRevoked(cert)
    } catch (err) {
      setError(errorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <Dialog open={cert !== null} onOpenChange={(o) => !busy && onOpenChange(o)}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Revoke {cert?.recipientName}'s certificate?</DialogTitle>
          <DialogDescription>
            The verify page for {cert?.verifyCode} will show <strong>Revoked</strong> with your reason, and the PDF can no longer be downloaded publicly. You can restore it later.
          </DialogDescription>
        </DialogHeader>
        <TextareaField label="Reason" required rows={3} value={reason} onChange={(e) => setReason(e.target.value)} maxLength={500} placeholder="e.g. Issued to the wrong person" error={error ?? undefined} />
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={busy}>
            Cancel
          </Button>
          <Button variant="danger" onClick={revoke} disabled={busy}>
            {busy && <Loader2 className="animate-spin" />} Revoke certificate
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
