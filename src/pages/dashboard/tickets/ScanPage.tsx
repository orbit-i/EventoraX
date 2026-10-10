import { useCallback, useEffect, useRef, useState } from "react"
import QrScanner from "qr-scanner"
import { toast } from "sonner"
import { AlertTriangle, Camera, CameraOff, CheckCircle2, Flashlight, Keyboard, Loader2, RotateCcw, ScanLine, XCircle } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { PageHeader } from "@/components/app/PageHeader"
import { EventPicker } from "@/components/app/EventPicker"
import { EmptyState } from "@/components/app/States"
import { useApi } from "@/hooks/useApi"
import { useSelectedEvent } from "@/hooks/useSelectedEvent"
import { api, ApiError, errorMessage } from "@/lib/api"
import { formatTime } from "@/lib/format"
import type { CheckInResult, TicketStats } from "@/types/ticket"

type Outcome =
  | { kind: "ok"; data: CheckInResult }
  | { kind: "used"; data: CheckInResult }
  | { kind: "error"; title: string; message: string }

interface LogEntry {
  id: number
  at: Date
  outcome: Outcome
  undone?: boolean
}

type CameraState = "off" | "starting" | "on" | "denied" | "none" | "insecure"

/** Short beep: high for OK, low double for a problem. Vibrates on phones. */
function feedback(good: boolean) {
  try {
    const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    const ctx = new Ctx()
    const beep = (freq: number, start: number) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.frequency.value = freq
      gain.gain.setValueAtTime(0.15, ctx.currentTime + start)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + start + 0.15)
      osc.connect(gain).connect(ctx.destination)
      osc.start(ctx.currentTime + start)
      osc.stop(ctx.currentTime + start + 0.16)
    }
    if (good) beep(880, 0)
    else {
      beep(220, 0)
      beep(220, 0.2)
    }
    setTimeout(() => void ctx.close(), 600)
  } catch {
    /* audio not available */
  }
  navigator.vibrate?.(good ? 80 : [120, 80, 120])
}

const ERROR_TITLES: Record<string, string> = {
  WRONG_EVENT: "Wrong event",
  REGISTRATION_CANCELLED: "Registration cancelled",
  NOT_FOUND: "Ticket not found",
  NOT_A_TICKET: "Not a ticket",
  EVENT_ARCHIVED: "Event archived",
}

function ResultPanel({ outcome }: { outcome: Outcome | null }) {
  if (!outcome)
    return (
      <div className="flex min-h-36 flex-col items-center justify-center rounded-2xl border border-dashed border-[#d8ccff] bg-white p-6 text-center">
        <ScanLine className="mb-2 h-8 w-8 text-[#a78bfa]" />
        <p className="font-medium text-[#0f172a]">Ready to scan</p>
        <p className="text-sm text-[#64748b]">Point the camera at the QR on the ticket.</p>
      </div>
    )
  if (outcome.kind === "ok")
    return (
      <div className="flex min-h-36 items-center gap-4 rounded-2xl bg-emerald-600 p-6 text-white shadow-lg">
        <CheckCircle2 className="h-12 w-12 shrink-0" />
        <div className="min-w-0">
          <p className="text-sm font-semibold uppercase tracking-wide opacity-90">Checked in</p>
          <p className="truncate text-2xl font-bold">{outcome.data.name}</p>
          <p className="text-sm opacity-90">
            {outcome.data.type && outcome.data.type !== "General" ? `${outcome.data.type} · ` : ""}
            {outcome.data.ticketNo}
          </p>
        </div>
      </div>
    )
  if (outcome.kind === "used")
    return (
      <div className="flex min-h-36 items-center gap-4 rounded-2xl bg-amber-500 p-6 text-white shadow-lg">
        <AlertTriangle className="h-12 w-12 shrink-0" />
        <div className="min-w-0">
          <p className="text-sm font-semibold uppercase tracking-wide opacity-90">Already checked in</p>
          <p className="truncate text-2xl font-bold">{outcome.data.name}</p>
          <p className="text-sm opacity-90">
            at {formatTime(outcome.data.usedAt)}
            {outcome.data.usedBy ? ` by ${outcome.data.usedBy}` : ""} — don't let the same ticket in twice
          </p>
        </div>
      </div>
    )
  return (
    <div className="flex min-h-36 items-center gap-4 rounded-2xl bg-rose-600 p-6 text-white shadow-lg">
      <XCircle className="h-12 w-12 shrink-0" />
      <div className="min-w-0">
        <p className="text-sm font-semibold uppercase tracking-wide opacity-90">{outcome.title}</p>
        <p className="text-lg font-semibold">{outcome.message}</p>
      </div>
    </div>
  )
}

export default function ScanPage() {
  const [eventId, setEventId] = useSelectedEvent()
  const stats = useApi<TicketStats>(eventId ? `/tickets/stats?eventId=${eventId}` : null)

  const videoRef = useRef<HTMLVideoElement>(null)
  const scannerRef = useRef<QrScanner | null>(null)
  const busyRef = useRef(false)
  const lastRef = useRef<{ code: string; at: number }>({ code: "", at: 0 })
  const logId = useRef(0)

  const [camera, setCamera] = useState<CameraState>("off")
  const [cameras, setCameras] = useState<QrScanner.Camera[]>([])
  const [cameraId, setCameraId] = useState<string>("environment")
  const [hasFlash, setHasFlash] = useState(false)
  const [flashOn, setFlashOn] = useState(false)
  const [outcome, setOutcome] = useState<Outcome | null>(null)
  const [log, setLog] = useState<LogEntry[]>([])
  const [manual, setManual] = useState("")
  const [submitting, setSubmitting] = useState(false)

  // Clear the big result after a few seconds so the next person sees "Ready".
  useEffect(() => {
    if (!outcome) return
    const t = setTimeout(() => setOutcome(null), outcome.kind === "ok" ? 3500 : 6000)
    return () => clearTimeout(t)
  }, [outcome])

  const submit = useCallback(
    async (code: string) => {
      if (!eventId || busyRef.current) return
      // The camera sees the same QR many times a second — ignore repeats for 3 s.
      const now = Date.now()
      if (code === lastRef.current.code && now - lastRef.current.at < 3000) return
      lastRef.current = { code, at: now }
      busyRef.current = true
      setSubmitting(true)

      let result: Outcome
      try {
        const data = await api.post<CheckInResult>("/tickets/check-in", { code, eventId })
        result = data.result === "CHECKED_IN" ? { kind: "ok", data } : { kind: "used", data }
      } catch (err) {
        const code = err instanceof ApiError ? err.code : ""
        result = { kind: "error", title: ERROR_TITLES[code] ?? "Couldn't check in", message: errorMessage(err) }
      }
      feedback(result.kind === "ok")
      setOutcome(result)
      setLog((l) => [{ id: ++logId.current, at: new Date(), outcome: result }, ...l].slice(0, 15))
      if (result.kind === "ok") stats.reload()
      busyRef.current = false
      setSubmitting(false)
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [eventId]
  )

  const stopCamera = useCallback(() => {
    scannerRef.current?.destroy()
    scannerRef.current = null
    setCamera("off")
    setFlashOn(false)
  }, [])

  const startCamera = useCallback(
    async (preferred: string) => {
      if (!videoRef.current) return
      if (!window.isSecureContext) return setCamera("insecure")
      setCamera("starting")
      scannerRef.current?.destroy()
      const scanner = new QrScanner(videoRef.current, (r) => void submit(r.data), {
        returnDetailedScanResult: true,
        highlightScanRegion: true,
        highlightCodeOutline: true,
        preferredCamera: preferred,
        maxScansPerSecond: 8,
      })
      scannerRef.current = scanner
      try {
        await scanner.start()
        setCamera("on")
        setHasFlash(await scanner.hasFlash())
        const list = await QrScanner.listCameras(true)
        setCameras(list)
      } catch (err) {
        scanner.destroy()
        scannerRef.current = null
        const msg = String(err)
        setCamera(/NotAllowed|Permission|denied/i.test(msg) ? "denied" : /NotFound|no camera/i.test(msg) ? "none" : "denied")
      }
    },
    [submit]
  )

  // Stop the camera when leaving the page or switching events.
  useEffect(() => stopCamera, [stopCamera, eventId])

  async function switchCamera(id: string) {
    setCameraId(id)
    if (scannerRef.current) {
      await scannerRef.current.setCamera(id)
      setHasFlash(await scannerRef.current.hasFlash())
      setFlashOn(false)
    }
  }

  async function toggleFlash() {
    if (!scannerRef.current) return
    await scannerRef.current.toggleFlash()
    setFlashOn(scannerRef.current.isFlashOn())
  }

  async function undo(entry: LogEntry) {
    if (entry.outcome.kind !== "ok") return
    try {
      await api.post(`/tickets/${entry.outcome.data.ticketId}/undo-check-in`)
      setLog((l) => l.map((e) => (e.id === entry.id ? { ...e, undone: true } : e)))
      lastRef.current = { code: "", at: 0 }
      stats.reload()
      toast.success(`Check-in undone for ${entry.outcome.data.name}`)
    } catch (err) {
      toast.error(errorMessage(err))
    }
  }

  const s = stats.data

  return (
    <>
      <PageHeader
        title="Check-in scanner"
        description="Scan tickets at the entrance. Works on phones and laptops with a camera."
        breadcrumbs={[{ label: "Dashboard", to: "/dashboard" }, { label: "Tickets", to: `/dashboard/tickets${eventId ? `?eventId=${eventId}` : ""}` }, { label: "Scanner" }]}
      />
      <EventPicker value={eventId} onChange={setEventId} className="mb-6" />

      {!eventId ? (
        <EmptyState icon={ScanLine} title="Choose an event" description="Tickets for other events are rejected, so pick the event you're checking people in for." />
      ) : (
        <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
          {/* Camera */}
          <div className="space-y-3">
            <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-[#0f172a]">
              <video ref={videoRef} className={cn("h-full w-full object-cover", camera !== "on" && "invisible")} muted playsInline />
              {camera !== "on" && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-6 text-center text-white">
                  {camera === "starting" ? (
                    <Loader2 className="h-8 w-8 animate-spin" />
                  ) : camera === "denied" ? (
                    <>
                      <CameraOff className="h-10 w-10 text-rose-300" />
                      <p className="font-medium">Camera access was blocked</p>
                      <p className="max-w-sm text-sm text-white/70">Click the camera icon in the address bar, allow the camera, then press Start again. You can also type ticket numbers below.</p>
                    </>
                  ) : camera === "none" ? (
                    <>
                      <CameraOff className="h-10 w-10 text-rose-300" />
                      <p className="font-medium">No camera found</p>
                      <p className="text-sm text-white/70">Use a phone or a laptop with a camera, or type ticket numbers below.</p>
                    </>
                  ) : camera === "insecure" ? (
                    <>
                      <CameraOff className="h-10 w-10 text-amber-300" />
                      <p className="font-medium">The camera needs a secure address</p>
                      <p className="max-w-sm text-sm text-white/70">Browsers only allow cameras on https:// pages or on localhost. Type ticket numbers below for now.</p>
                    </>
                  ) : (
                    <>
                      <Camera className="h-10 w-10 text-[#c4b5fd]" />
                      <Button size="lg" onClick={() => void startCamera(cameraId)}>
                        <Camera /> Start camera
                      </Button>
                    </>
                  )}
                </div>
              )}
              {submitting && (
                <div className="absolute right-3 top-3 rounded-full bg-black/60 p-2 text-white">
                  <Loader2 className="h-4 w-4 animate-spin" />
                </div>
              )}
            </div>

            {camera === "on" && (
              <div className="flex flex-wrap items-center gap-2">
                {cameras.length > 1 && (
                  <Select value={cameraId} onValueChange={(id) => void switchCamera(id)}>
                    <SelectTrigger className="h-9 w-56 bg-white">
                      <SelectValue placeholder="Camera" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="environment">Back camera</SelectItem>
                      <SelectItem value="user">Front camera</SelectItem>
                      {cameras.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.label || "Camera"}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
                {hasFlash && (
                  <Button variant="outline" size="sm" onClick={() => void toggleFlash()} aria-pressed={flashOn}>
                    <Flashlight /> {flashOn ? "Light off" : "Light on"}
                  </Button>
                )}
                <Button variant="outline" size="sm" onClick={stopCamera} className="ml-auto">
                  <CameraOff /> Stop camera
                </Button>
              </div>
            )}

            <form
              onSubmit={(e) => {
                e.preventDefault()
                const code = manual.trim()
                if (!code) return
                lastRef.current = { code: "", at: 0 } // typed codes are never ignored as repeats
                void submit(code).then(() => setManual(""))
              }}
              className="flex gap-2"
            >
              <div className="relative flex-1">
                <Keyboard className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#94a3b8]" />
                <Input value={manual} onChange={(e) => setManual(e.target.value)} placeholder="Or type a ticket number, e.g. TKT-8D21E04A7C" className="h-11 bg-white pl-9 font-mono" aria-label="Ticket number" />
              </div>
              <Button type="submit" className="h-11" disabled={!manual.trim() || submitting}>
                Check in
              </Button>
            </form>
          </div>

          {/* Result + counters + recent */}
          <div className="space-y-4">
            <div aria-live="assertive">
              <ResultPanel outcome={outcome} />
            </div>

            <div className="grid grid-cols-3 gap-3 text-center">
              {[
                { label: "Checked in", value: s?.used },
                { label: "Not yet", value: s?.unused },
                { label: "Total", value: s?.total },
              ].map((x) => (
                <div key={x.label} className="rounded-2xl border border-[#e9e4ff] bg-white p-3 shadow-sm">
                  <p className="text-2xl font-bold tabular-nums text-[#0f172a]">{x.value?.toLocaleString() ?? "—"}</p>
                  <p className="text-xs text-[#64748b]">{x.label}</p>
                </div>
              ))}
            </div>
            {s && s.total > 0 && (
              <div className="h-2 overflow-hidden rounded-full bg-[#ede9fe]">
                <div className="h-full rounded-full bg-emerald-500 transition-all" style={{ width: `${s.rate}%` }} />
              </div>
            )}

            <section className="rounded-2xl border border-[#e9e4ff] bg-white p-4 shadow-sm">
              <h2 className="mb-2 text-sm font-semibold text-[#0f172a]">Recent scans</h2>
              {log.length === 0 ? (
                <p className="text-sm text-[#94a3b8]">Scans from this session appear here.</p>
              ) : (
                <ul className="divide-y divide-[#f1f5f9]">
                  {log.map((e) => {
                    const o = e.outcome
                    const name = o.kind === "error" ? o.title : o.data.name
                    return (
                      <li key={e.id} className="flex items-center gap-3 py-2 text-sm">
                        {o.kind === "ok" ? (
                          <CheckCircle2 className={cn("h-4 w-4 shrink-0", e.undone ? "text-[#cbd5e1]" : "text-emerald-600")} />
                        ) : o.kind === "used" ? (
                          <AlertTriangle className="h-4 w-4 shrink-0 text-amber-500" />
                        ) : (
                          <XCircle className="h-4 w-4 shrink-0 text-rose-600" />
                        )}
                        <span className={cn("min-w-0 flex-1 truncate", e.undone && "text-[#94a3b8] line-through")}>{name}</span>
                        <span className="text-xs tabular-nums text-[#94a3b8]">{formatTime(e.at)}</span>
                        {o.kind === "ok" && !e.undone && (
                          <Button variant="ghost" size="sm" onClick={() => void undo(e)} className="h-7 px-2 text-xs">
                            <RotateCcw className="h-3 w-3" /> Undo
                          </Button>
                        )}
                      </li>
                    )
                  })}
                </ul>
              )}
            </section>
          </div>
        </div>
      )}
    </>
  )
}
