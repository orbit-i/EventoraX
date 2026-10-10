import { useEffect, useState } from "react"
import QRCode from "qrcode"
import { Skeleton } from "@/components/ui/skeleton"

/** Must match the backend (pdf/ticket.ts): the scanner only accepts codes with this prefix. */
export const ticketQrValue = (qrCode: string) => `EVXT:${qrCode}`

/** Draws a QR code as an image (generated in the browser, nothing is uploaded). */
export function QrCode({ value, size = 200, label }: { value: string; size?: number; label: string }) {
  const [src, setSrc] = useState<string | null>(null)

  useEffect(() => {
    let alive = true
    QRCode.toDataURL(value, { margin: 1, width: size * 2, errorCorrectionLevel: "M", color: { dark: "#0f172a", light: "#ffffff" } })
      .then((url) => alive && setSrc(url))
      .catch(() => alive && setSrc(null))
    return () => {
      alive = false
    }
  }, [value, size])

  return src ? (
    <img src={src} alt={label} width={size} height={size} className="rounded-lg" />
  ) : (
    <Skeleton className="rounded-lg" style={{ width: size, height: size }} />
  )
}
