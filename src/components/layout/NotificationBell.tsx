import { useCallback, useEffect, useState } from "react"
import { useNavigate } from "react-router"
import { Bell, CheckCheck, Megaphone } from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { api, errorMessage } from "@/lib/api"
import { formatDateTime, formatRelative } from "@/lib/format"

interface NotificationItem {
  id: string
  title: string
  body: string | null
  link: string | null
  readAt: string | null
  createdAt: string
}

const POLL_MS = 60_000

/** The bell in the dashboard's top bar: announcements from the EventoraX team (and later, other alerts). */
export function NotificationBell() {
  const [items, setItems] = useState<NotificationItem[]>([])
  const [unread, setUnread] = useState(0)
  const [open, setOpen] = useState(false)
  const [expanded, setExpanded] = useState<string | null>(null)
  const navigate = useNavigate()

  const load = useCallback(() => {
    api
      .get<{ items: NotificationItem[]; unread: number }>("/notifications?limit=15")
      .then((r) => {
        setItems(r.items)
        setUnread(r.unread)
      })
      .catch(() => undefined) // the bell just stays as it is
  }, [])

  useEffect(() => {
    load()
    const timer = setInterval(load, POLL_MS)
    return () => clearInterval(timer)
  }, [load])

  /** Click: mark as read, then open its page (if it has one) or show the full text. */
  async function read(n: NotificationItem) {
    if (n.link) {
      setOpen(false)
      navigate(n.link)
    } else {
      setExpanded((id) => (id === n.id ? null : n.id))
    }
    if (n.readAt) return
    setItems((list) => list.map((x) => (x.id === n.id ? { ...x, readAt: new Date().toISOString() } : x)))
    setUnread((u) => Math.max(0, u - 1))
    await api.post(`/notifications/${n.id}/read`).catch(() => undefined)
  }

  async function readAll() {
    try {
      await api.post("/notifications/read-all")
      setItems((list) => list.map((x) => ({ ...x, readAt: x.readAt ?? new Date().toISOString() })))
      setUnread(0)
    } catch (err) {
      toast.error(errorMessage(err))
    }
  }

  return (
    <Popover open={open} onOpenChange={(o) => (setOpen(o), o && load())}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon-sm" className="relative" aria-label={unread ? `Notifications, ${unread} unread` : "Notifications"}>
          <Bell />
          {unread > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white">
              {unread > 9 ? "9+" : unread}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[22rem] p-0">
        <div className="flex items-center justify-between border-b border-[#f1f5f9] px-4 py-3">
          <p className="text-sm font-semibold text-[#0f172a]">Notifications</p>
          {unread > 0 && (
            <button type="button" onClick={() => void readAll()} className="inline-flex items-center gap-1 text-xs font-medium text-[#7c3aed] hover:underline">
              <CheckCheck className="h-3.5 w-3.5" /> Mark all as read
            </button>
          )}
        </div>
        {items.length === 0 ? (
          <div className="px-4 py-10 text-center">
            <Bell className="mx-auto h-6 w-6 text-[#cbd5e1]" />
            <p className="mt-2 text-sm text-[#64748b]">You're all caught up.</p>
          </div>
        ) : (
          <ul className="max-h-[26rem] divide-y divide-[#f1f5f9] overflow-y-auto">
            {items.map((n) => (
              <li key={n.id}>
                <button type="button" onClick={() => void read(n)} className={cn("flex w-full gap-3 px-4 py-3 text-left transition-colors hover:bg-[#faf8ff]", !n.readAt && "bg-[#f5f3ff]/60")}>
                  <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#ede9fe] text-[#7c3aed]">
                    <Megaphone className="h-4 w-4" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-start justify-between gap-2">
                      <span className={cn("text-sm text-[#0f172a]", !n.readAt && "font-semibold")}>{n.title}</span>
                      {!n.readAt && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-[#7c3aed]" aria-label="unread" />}
                    </span>
                    {n.body && (
                      <span className={cn("mt-0.5 block whitespace-pre-line text-xs text-[#64748b]", expanded !== n.id && "line-clamp-2")}>{n.body}</span>
                    )}
                    <span className="mt-1 block text-[11px] text-[#94a3b8]" title={formatDateTime(n.createdAt)}>
                      {n.link ? "Your organization" : "EventoraX team"} · {formatRelative(n.createdAt)}
                    </span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </PopoverContent>
    </Popover>
  )
}
