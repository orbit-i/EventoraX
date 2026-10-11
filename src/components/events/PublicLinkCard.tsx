import { useState } from "react"
import QRCode from "qrcode"
import { toast } from "sonner"
import { Check, Copy, Download, ExternalLink, Globe, Lock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { QrCode } from "@/components/tickets/QrCode"

/**
 * The event's public page link (/e/:id) for sharing on WhatsApp, posters (QR) or social media.
 * Drafts don't have a public page yet; archived events are hidden.
 */
export function PublicLinkCard({ event }: { event: { id: string; title: string; status: string; registrationOpen: boolean } }) {
  const [copied, setCopied] = useState(false)
  if (event.status === "ARCHIVED") return null
  const url = `${window.location.origin}/e/${event.id}`

  if (event.status === "DRAFT") {
    return (
      <div className="mb-6 flex items-start gap-3 rounded-2xl border border-[#e9e4ff] bg-white px-5 py-4 text-sm text-[#475569] shadow-sm">
        <Lock className="mt-0.5 h-4 w-4 shrink-0 text-[#94a3b8]" />
        <span>
          <strong className="text-[#0f172a]">Public page:</strong> this event is a draft, so it has no public page yet. Set its status to <strong>Upcoming</strong> to get a link people
          can register with.
        </span>
      </div>
    )
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast.error("Couldn't copy. Select the link and copy it yourself.")
    }
  }

  async function downloadQr() {
    const dataUrl = await QRCode.toDataURL(url, { margin: 2, width: 1024, errorCorrectionLevel: "M" })
    const a = document.createElement("a")
    a.href = dataUrl
    a.download = `${event.title.replace(/[^a-z0-9]+/gi, "-").slice(0, 40)}-qr.png`
    a.click()
  }

  return (
    <div className="mb-6 flex flex-wrap items-center gap-5 rounded-2xl border border-[#e9e4ff] bg-white p-5 shadow-sm">
      <QrCode value={url} size={88} label="QR code of the public event page" />
      <div className="min-w-0 flex-1">
        <p className="flex items-center gap-1.5 text-sm font-semibold text-[#0f172a]">
          <Globe className="h-4 w-4 text-[#7c3aed]" /> Public page {event.registrationOpen ? "· people can register themselves" : "· registration is closed"}
        </p>
        <p className="mt-1 truncate font-mono text-xs text-[#64748b]">{url}</p>
        <p className="mt-1 text-xs text-[#94a3b8]">Speakers, sponsors and sessions marked "show on public page" appear there.</p>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button size="sm" variant="outline" onClick={() => void copy()}>
          {copied ? <Check /> : <Copy />} {copied ? "Copied" : "Copy link"}
        </Button>
        <Button size="sm" variant="outline" onClick={() => void downloadQr()}>
          <Download /> QR for posters
        </Button>
        <Button size="sm" variant="outline" asChild>
          <a href={url} target="_blank" rel="noreferrer">
            <ExternalLink /> Open
          </a>
        </Button>
      </div>
    </div>
  )
}
