import { CheckCircle2, Clock, Download, Mail, RotateCcw, Ticket as TicketIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { formatDateTime } from "@/lib/format"
import type { Ticket } from "@/types/ticket"
import { QrCode, ticketQrValue } from "./QrCode"

/** One ticket: big QR (can be scanned straight off this screen) + actions. */
export function TicketDialog({
  ticket,
  onOpenChange,
  canWrite,
  onDownload,
  onEmail,
  onCheckIn,
  onUndo,
}: {
  ticket: Ticket | null
  onOpenChange: (open: boolean) => void
  canWrite: boolean
  onDownload: (t: Ticket) => void
  onEmail: (t: Ticket) => void
  onCheckIn: (t: Ticket) => void
  onUndo: (t: Ticket) => void
}) {
  const t = ticket
  return (
    <Dialog open={t !== null} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        {t && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <TicketIcon className="h-5 w-5 text-[#7c3aed]" /> {t.registration.name}
              </DialogTitle>
              <DialogDescription>
                {t.event.title}
                {t.type && t.type !== "General" ? ` · ${t.type}` : ""}
              </DialogDescription>
            </DialogHeader>

            <div className="flex flex-col items-center gap-2 rounded-2xl border border-[#e9e4ff] bg-white p-4">
              <QrCode value={ticketQrValue(t.qrCode)} size={220} label={`QR code for ticket ${t.ticketNo}`} />
              <p className="font-mono text-sm text-[#0f172a]">{t.ticketNo}</p>
              <p className="text-xs text-[#94a3b8]">{t.registration.refNo}</p>
            </div>

            {t.isUsed ? (
              <p className="flex items-center gap-2 rounded-xl bg-emerald-50 p-3 text-sm text-emerald-800">
                <CheckCircle2 className="h-4 w-4 shrink-0" /> Checked in {t.usedAt ? formatDateTime(t.usedAt) : ""}
              </p>
            ) : (
              <p className="flex items-center gap-2 rounded-xl bg-[#f8fafc] p-3 text-sm text-[#64748b]">
                <Clock className="h-4 w-4 shrink-0" /> Not checked in yet
              </p>
            )}

            <div className="grid grid-cols-2 gap-2">
              <Button variant="outline" onClick={() => onDownload(t)}>
                <Download /> PDF
              </Button>
              {canWrite && (
                <Button variant="outline" onClick={() => onEmail(t)}>
                  <Mail /> {t.emailedAt ? "Email again" : "Email"}
                </Button>
              )}
              {canWrite &&
                (t.isUsed ? (
                  <Button variant="outline" className="col-span-2" onClick={() => onUndo(t)}>
                    <RotateCcw /> Undo check-in
                  </Button>
                ) : (
                  <Button className="col-span-2" onClick={() => onCheckIn(t)}>
                    <CheckCircle2 /> Check in manually
                  </Button>
                ))}
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
