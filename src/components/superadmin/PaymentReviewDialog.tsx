import { useEffect, useState } from "react"
import { Link } from "react-router"
import { toast } from "sonner"
import { CheckCircle2, ExternalLink, Loader2, XCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { TextareaField } from "@/components/ui/form-fields"
import { StatusBadge } from "@/components/app/StatusBadge"
import { METHOD_LABEL } from "@/components/billing/paymentInfo"
import { api, errorMessage } from "@/lib/api"
import { formatDate, formatDateTime, formatMoney } from "@/lib/format"
import type { PlatformPayment } from "@/types/superadmin"

const YEAR = 365 * 24 * 60 * 60 * 1000

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-[#f1f5f9] py-2 text-sm last:border-0">
      <span className="shrink-0 text-[#64748b]">{label}</span>
      <span className="text-right font-medium text-[#0f172a]">{children}</span>
    </div>
  )
}

/** Payment details with the receipt, and (for pending ones) Confirm / Reject. */
export function PaymentReviewDialog({
  payment,
  onOpenChange,
  onReviewed,
}: {
  payment: PlatformPayment | null
  onOpenChange: (open: boolean) => void
  onReviewed: () => void
}) {
  const [mode, setMode] = useState<"view" | "reject">("view")
  const [note, setNote] = useState("")
  const [notify, setNotify] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState<"confirm" | "reject" | null>(null)

  useEffect(() => {
    setMode("view")
    setNote("")
    setNotify(true)
    setError(null)
  }, [payment])

  if (!payment) return <Dialog open={false} />

  const pending = payment.status === "PENDING"
  const org = payment.organization
  const running = org.status === "active" && new Date(org.subscriptionEndsAt).getTime() > Date.now()
  const newEnd = new Date((running ? new Date(org.subscriptionEndsAt).getTime() : Date.now()) + YEAR)

  async function review(action: "confirm" | "reject") {
    if (!payment) return
    if (action === "reject" && note.trim().length < 3) {
      setError("Tell the organization why it was rejected")
      return
    }
    setBusy(action)
    setError(null)
    try {
      await api.post(`/superadmin/payments/${payment.id}/${action}`, { note: note.trim() || undefined, notify })
      toast.success(action === "confirm" ? `Payment confirmed. ${org.name} is active until ${formatDate(newEnd)}.` : "Payment rejected", {
        description: notify ? "The organization's admins were emailed." : undefined,
      })
      onOpenChange(false)
      onReviewed()
    } catch (err) {
      setError(errorMessage(err))
    } finally {
      setBusy(null)
    }
  }

  return (
    <Dialog open onOpenChange={(o) => !busy && onOpenChange(o)}>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {formatMoney(payment.amount)} from {org.name}
          </DialogTitle>
          <DialogDescription>
            Submitted {formatDateTime(payment.createdAt)} · <StatusBadge kind="payment" value={payment.status} />
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <Row label="Organization">
              <Link to={`/superadmin/tenants/${org.id}`} className="text-[#7c3aed] hover:underline">
                {org.name}
              </Link>
            </Row>
            <Row label="Plan">{payment.plan?.name ?? "—"}</Row>
            <Row label="Method">{METHOD_LABEL[payment.method]}</Row>
            <Row label="Transaction ID">
              <span className="font-mono">{payment.referenceNo ?? "—"}</span>
            </Row>
            {payment.notes && <Row label="Their note">{payment.notes}</Row>}
            {payment.status !== "PENDING" && (
              <>
                <Row label={payment.status === "CONFIRMED" ? "Confirmed" : "Rejected"}>
                  {formatDateTime(payment.confirmedAt)}
                  {payment.reviewedBy && <span className="block text-xs font-normal text-[#94a3b8]">by {payment.reviewedBy}</span>}
                </Row>
                {payment.periodEnd && (
                  <Row label="Paid period">
                    {formatDate(payment.periodStart)} – {formatDate(payment.periodEnd)}
                  </Row>
                )}
                {payment.reviewNote && <Row label="Review note">{payment.reviewNote}</Row>}
              </>
            )}
          </div>
          <div>
            <p className="mb-2 text-sm font-semibold text-[#0f172a]">Receipt</p>
            {payment.proofUrl ? (
              <a href={payment.proofUrl} target="_blank" rel="noreferrer" className="group relative block overflow-hidden rounded-xl border border-[#e9e4ff]">
                <img src={payment.proofUrl} alt="Payment receipt" className="max-h-72 w-full bg-[#faf8ff] object-contain" />
                <span className="absolute right-2 top-2 inline-flex items-center gap-1 rounded-lg bg-white/90 px-2 py-1 text-xs font-medium text-[#475569] opacity-0 shadow-sm transition group-hover:opacity-100">
                  <ExternalLink className="h-3 w-3" /> Full size
                </span>
              </a>
            ) : (
              <div className="flex h-40 items-center justify-center rounded-xl border border-dashed border-[#e9e4ff] text-sm text-[#94a3b8]">No receipt uploaded</div>
            )}
          </div>
        </div>

        {pending && (
          <div className="space-y-3 rounded-xl border border-[#e9e4ff] bg-[#faf8ff] p-4">
            {mode === "view" ? (
              <p className="text-sm text-[#475569]">
                Check that <strong className="font-mono">{payment.referenceNo}</strong> appears in your {METHOD_LABEL[payment.method]} statement for{" "}
                <strong>{formatMoney(payment.amount)}</strong>. Confirming activates <strong>{payment.plan?.name ?? "the plan"}</strong> until{" "}
                <strong>{formatDate(newEnd)}</strong>
                {running ? " (one year added to their current end date)" : " (one year from today)"}.
              </p>
            ) : (
              <p className="text-sm text-[#475569]">The organization sees this reason on its Billing page and can submit the payment again.</p>
            )}
            <TextareaField
              label={mode === "reject" ? "Reason for rejecting" : "Note (optional)"}
              required={mode === "reject"}
              rows={2}
              value={note}
              placeholder={mode === "reject" ? "e.g. We couldn't find this transaction ID" : "e.g. Verified in the JazzCash statement"}
              onChange={(e) => {
                setNote(e.target.value)
                setError(null)
              }}
              error={error ?? undefined}
            />
            <label className="flex cursor-pointer items-center gap-2 text-sm text-[#334155]">
              <Checkbox checked={notify} onCheckedChange={(c) => setNotify(c === true)} />
              Email the organization's admins
            </label>
          </div>
        )}

        <DialogFooter>
          {!pending ? (
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Close
            </Button>
          ) : mode === "view" ? (
            <>
              <Button variant="outline" onClick={() => setMode("reject")} disabled={Boolean(busy)}>
                <XCircle /> Reject…
              </Button>
              <Button onClick={() => void review("confirm")} disabled={Boolean(busy)}>
                {busy === "confirm" ? <Loader2 className="animate-spin" /> : <CheckCircle2 />} Confirm payment
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" onClick={() => setMode("view")} disabled={Boolean(busy)}>
                Back
              </Button>
              <Button variant="destructive" onClick={() => void review("reject")} disabled={Boolean(busy)}>
                {busy === "reject" ? <Loader2 className="animate-spin" /> : <XCircle />} Reject payment
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
