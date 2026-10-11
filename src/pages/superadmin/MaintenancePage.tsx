import { useEffect, useState } from "react"
import { toast } from "sonner"
import { Bug, CheckCircle2, Database, Download, Eraser, HardDrive, Loader2, Mail, Play, RotateCw, Server, Timer, Trash2, Wrench, XCircle } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Switch } from "@/components/ui/switch"
import { TextareaField } from "@/components/ui/form-fields"
import { PageHeader } from "@/components/app/PageHeader"
import { Panel } from "@/components/app/Panel"
import { ErrorState } from "@/components/app/States"
import { PaginationBar } from "@/components/app/PaginationBar"
import { useConfirm } from "@/components/app/ConfirmDialog"
import { usePlatform } from "@/context/PlatformContext"
import { useApi } from "@/hooks/useApi"
import { useUrlState } from "@/hooks/useUrlState"
import { api, buildQuery, errorMessage } from "@/lib/api"
import { formatDateTime, formatDuration, formatRelative, plural } from "@/lib/format"

interface Check {
  ok: boolean
  message: string
}
interface Job {
  name: string
  label: string
  description: string
  intervalMs: number
  running: boolean
  lastRunAt: string | null
  lastDurationMs: number | null
  lastResult: string | null
  lastError: string | null
  nextRunAt: string | null
  runs: number
}
interface Overview {
  version: { app: string; commit: string | null; node: string; startedAt: string; uptimeSec: number }
  maintenance: { enabled: boolean; message: string }
  health: {
    database: Check & { latencyMs: number | null }
    storage: Check & { freeBytes: number | null; totalBytes: number | null; uploadsBytes: number | null; privateBytes: number | null }
    email: Check & { mode: string; host: string | null }
    jobs: Check
  }
  jobs: Job[]
  errors: { last24h: number; total: number }
}
interface ErrorRow {
  id: string
  message: string
  stack: string | null
  method: string | null
  path: string | null
  status: number
  createdAt: string
  user: { id: string; name: string; email: string } | null
}
interface Backups {
  folder: string
  tool: string | null
  backups: { file: string; sizeBytes: number; createdAt: string }[]
}

function bytes(n: number | null | undefined) {
  if (n === null || n === undefined) return "—"
  const units = ["B", "KB", "MB", "GB", "TB"]
  let i = 0
  let v = n
  while (v >= 1024 && i < units.length - 1) {
    v /= 1024
    i++
  }
  return `${v.toFixed(v >= 10 || i === 0 ? 0 : 1)} ${units[i]}`
}

function HealthCard({ icon: Icon, title, check, detail }: { icon: typeof Database; title: string; check: Check | undefined; detail?: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-[#e9e4ff] bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <Icon className="h-4 w-4 text-[#7c3aed]" />
          <p className="text-sm font-semibold text-[#0f172a]">{title}</p>
        </div>
        {!check ? (
          <Skeleton className="h-5 w-12" />
        ) : check.ok ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">
            <CheckCircle2 className="h-3 w-3" /> OK
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700">
            <XCircle className="h-3 w-3" /> Check
          </span>
        )}
      </div>
      <p className="mt-2 text-xs text-[#64748b]">{check?.message ?? "…"}</p>
      {detail && <div className="mt-1 text-xs text-[#94a3b8]">{detail}</div>}
    </div>
  )
}

function MaintenanceSwitch({ current, onSaved }: { current: Overview["maintenance"] | undefined; onSaved: () => void }) {
  const confirm = useConfirm()
  const { refresh } = usePlatform()
  const [message, setMessage] = useState("")
  const [saving, setSaving] = useState(false)
  useEffect(() => setMessage(current?.message ?? ""), [current])

  async function save(enabled: boolean) {
    if (enabled && !current?.enabled) {
      const ok = await confirm({
        title: "Turn maintenance mode on?",
        description: "Every organization sees a maintenance screen until you turn it off. Only superadmins can use EventoraX meanwhile.",
        confirmLabel: "Turn on",
        tone: "danger",
      })
      if (!ok) return
    }
    setSaving(true)
    try {
      await api.patch("/superadmin/settings", { "maintenance.enabled": enabled, "maintenance.message": message.trim() })
      toast.success(enabled ? (current?.enabled ? "Message updated" : "Maintenance mode is on") : "Maintenance mode is off. Everyone can use EventoraX again.")
      refresh()
      onSaved()
    } catch (err) {
      toast.error(errorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  const on = current?.enabled === true
  return (
    <Panel
      title="Maintenance mode"
      description="Lock organizations out during upgrades. Login, public certificate checks and this panel keep working."
      className={cn(on && "border-amber-300 bg-amber-50/40")}
      action={current && <Switch checked={on} disabled={saving} onCheckedChange={(v) => void save(v)} aria-label="Maintenance mode" />}
    >
      <TextareaField
        label="Message shown to organizations"
        rows={2}
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="e.g. We're upgrading EventoraX and will be back by 9:00 am."
        maxLength={300}
      />
      <div className="mt-3 flex items-center justify-between gap-2">
        <span className={cn("text-sm font-medium", on ? "text-amber-700" : "text-[#64748b]")}>{on ? "On: organizations are locked out" : "Off"}</span>
        <Button size="sm" variant="outline" onClick={() => void save(on)} disabled={saving || message.trim() === (current?.message ?? "")}>
          {saving && <Loader2 className="animate-spin" />} Save message
        </Button>
      </div>
    </Panel>
  )
}

function ErrorsPanel({ onChanged }: { onChanged: () => void }) {
  const confirm = useConfirm()
  const { values, set } = useUrlState({ epage: "1" })
  const page = Number(values.epage) || 1
  const list = useApi<ErrorRow[]>(`/superadmin/maintenance/errors${buildQuery({ page, limit: 10 })}`)
  const rows = list.data ?? []

  async function clearAll() {
    const ok = await confirm({ title: "Clear the error log?", description: `All ${plural(list.meta?.total ?? 0, "error")} are deleted. Do this after you've fixed what caused them.`, confirmLabel: "Clear log", tone: "danger" })
    if (!ok) return
    try {
      const res = await api.delete<{ deleted: number }>("/superadmin/maintenance/errors")
      toast.success(`${plural(res.deleted, "error")} cleared`)
      list.reload()
      onChanged()
    } catch (err) {
      toast.error(errorMessage(err))
    }
  }

  return (
    <Panel
      title="Error logs"
      description="Server errors (5xx) with where they happened. Click one to see the technical details."
      className="lg:col-span-2"
      action={
        rows.length > 0 && (
          <Button size="sm" variant="ghost" className="text-rose-600 hover:bg-rose-50 hover:text-rose-700" onClick={() => void clearAll()}>
            <Trash2 /> Clear log
          </Button>
        )
      }
    >
      {list.error ? (
        <ErrorState message={list.error} onRetry={list.reload} />
      ) : list.initialLoading ? (
        <Skeleton className="h-32 rounded-xl" />
      ) : rows.length === 0 ? (
        <p className="flex items-center gap-2 text-sm text-emerald-700">
          <CheckCircle2 className="h-4 w-4" /> No server errors recorded.
        </p>
      ) : (
        <>
          <ul className="space-y-2">
            {rows.map((e) => (
              <li key={e.id}>
                <details className="group rounded-xl border border-[#e9e4ff] bg-[#faf8ff] px-3 py-2">
                  <summary className="flex cursor-pointer list-none flex-wrap items-center gap-2 text-sm">
                    <Bug className="h-4 w-4 shrink-0 text-rose-600" />
                    <span className="min-w-0 flex-1 truncate font-medium text-[#0f172a]">{e.message}</span>
                    {e.path && (
                      <span className="font-mono text-xs text-[#64748b]">
                        {e.method} {e.path}
                      </span>
                    )}
                    <span className="text-xs text-[#94a3b8]" title={formatDateTime(e.createdAt)}>
                      {formatRelative(e.createdAt)}
                    </span>
                  </summary>
                  <div className="mt-2 space-y-1 text-xs text-[#475569]">
                    <p>
                      Status {e.status} · {formatDateTime(e.createdAt)}
                      {e.user && ` · ${e.user.name} (${e.user.email})`}
                    </p>
                    {e.stack && <pre className="max-h-64 overflow-auto rounded-lg bg-slate-900 p-3 text-[11px] leading-relaxed text-slate-100">{e.stack}</pre>}
                  </div>
                </details>
              </li>
            ))}
          </ul>
          {list.meta && list.meta.total > 10 && <PaginationBar page={page} limit={10} total={list.meta.total} onPageChange={(p) => set({ epage: String(p) })} onLimitChange={() => undefined} />}
        </>
      )}
    </Panel>
  )
}

function BackupsPanel() {
  const { data, error, initialLoading, reload } = useApi<Backups>("/superadmin/maintenance/backups")
  const [busy, setBusy] = useState(false)

  async function backupNow() {
    setBusy(true)
    const id = toast.loading("Backing up the database…")
    try {
      const res = await api.post<{ file: string; sizeBytes: number; durationMs: number }>("/superadmin/maintenance/backups")
      toast.success(`Backup created (${bytes(res.sizeBytes)})`, { id, description: res.file })
      reload()
    } catch (err) {
      toast.error(errorMessage(err, "Backup failed."), { id })
    } finally {
      setBusy(false)
    }
  }

  async function download(file: string) {
    try {
      await api.download(`/superadmin/maintenance/backups/${file}`, file)
    } catch (err) {
      toast.error(errorMessage(err, "Download failed."))
    }
  }

  return (
    <Panel
      title="Database backups"
      description={data ? `Saved on the server in ${data.folder}` : "A full SQL copy of the database (mysqldump)."}
      action={
        <Button size="sm" onClick={() => void backupNow()} disabled={busy || !data?.tool}>
          {busy ? <Loader2 className="animate-spin" /> : <Database />} Back up now
        </Button>
      }
    >
      {error ? (
        <ErrorState message={error} onRetry={reload} />
      ) : initialLoading || !data ? (
        <Skeleton className="h-24 rounded-xl" />
      ) : (
        <>
          {!data.tool && <p className="mb-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">mysqldump isn't installed on this server, so backups can't run here. Set MYSQLDUMP_PATH in .env.</p>}
          {data.backups.length === 0 ? (
            <p className="text-sm text-[#94a3b8]">No backups yet.</p>
          ) : (
            <ul className="divide-y divide-[#f1f5f9]">
              {data.backups.slice(0, 8).map((b) => (
                <li key={b.file} className="flex items-center gap-3 py-2 text-sm">
                  <Database className="h-4 w-4 text-[#94a3b8]" />
                  <span className="min-w-0 flex-1 truncate font-mono text-xs text-[#334155]">{b.file}</span>
                  <span className="text-xs text-[#94a3b8]">
                    {bytes(b.sizeBytes)} · {formatRelative(b.createdAt)}
                  </span>
                  <Button size="icon-sm" variant="ghost" onClick={() => void download(b.file)} aria-label={`Download ${b.file}`}>
                    <Download />
                  </Button>
                </li>
              ))}
            </ul>
          )}
          <p className="mt-2 text-xs text-[#94a3b8]">Backups contain personal data. Keep downloaded copies somewhere safe.</p>
        </>
      )}
    </Panel>
  )
}

export default function MaintenancePage() {
  const { data, error, initialLoading, loading, reload } = useApi<Overview>("/superadmin/maintenance")
  const [running, setRunning] = useState<string | null>(null)
  const [clearing, setClearing] = useState(false)

  async function runNow(job: Job) {
    setRunning(job.name)
    try {
      const res = await api.post<Job>(`/superadmin/maintenance/jobs/${job.name}/run`)
      if (res.lastError) toast.error(`${job.label} failed`, { description: res.lastError })
      else toast.success(`${job.label}: ${res.lastResult}`)
      reload()
    } catch (err) {
      toast.error(errorMessage(err))
    } finally {
      setRunning(null)
    }
  }

  async function clearCache() {
    setClearing(true)
    try {
      const res = await api.post<{ cleared: number }>("/superadmin/maintenance/cache/clear")
      toast.success(`Cache cleared (${plural(res.cleared, "cached setting")})`, { description: "Settings are read fresh from the database again." })
    } catch (err) {
      toast.error(errorMessage(err))
    } finally {
      setClearing(false)
    }
  }

  const v = data?.version
  const h = data?.health
  return (
    <>
      <PageHeader
        title="Maintenance"
        description="Server health, background jobs, errors and backups."
        breadcrumbs={[{ label: "Superadmin", to: "/superadmin" }, { label: "Maintenance" }]}
        actions={
          <>
            <Button variant="outline" onClick={() => void clearCache()} disabled={clearing}>
              {clearing ? <Loader2 className="animate-spin" /> : <Eraser />} Clear cache
            </Button>
            <Button variant="outline" onClick={reload} disabled={loading}>
              <RotateCw className={cn(loading && "animate-spin")} /> Refresh
            </Button>
          </>
        }
      />
      {error ? (
        <ErrorState message={error} onRetry={reload} />
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          <Panel title="Version" description="What's running on this server">
            {initialLoading || !v ? (
              <Skeleton className="h-28 rounded-xl" />
            ) : (
              <dl className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <dt className="text-xs text-[#64748b]">EventoraX</dt>
                  <dd className="font-semibold text-[#0f172a]">v{v.app}</dd>
                </div>
                <div>
                  <dt className="text-xs text-[#64748b]">Commit</dt>
                  <dd className="font-mono text-[#0f172a]">{v.commit ?? "—"}</dd>
                </div>
                <div>
                  <dt className="text-xs text-[#64748b]">Node.js</dt>
                  <dd className="text-[#0f172a]">{v.node}</dd>
                </div>
                <div>
                  <dt className="text-xs text-[#64748b]">Up for</dt>
                  <dd className="text-[#0f172a]" title={`Started ${formatDateTime(v.startedAt)}`}>
                    {formatDuration(Math.round(v.uptimeSec / 60))}
                  </dd>
                </div>
              </dl>
            )}
          </Panel>

          <MaintenanceSwitch current={data?.maintenance} onSaved={reload} />

          <div className="grid gap-4 sm:grid-cols-2 lg:col-span-2 lg:grid-cols-4">
            <HealthCard icon={Database} title="Database" check={h?.database} detail={h?.database.latencyMs != null && `${h.database.latencyMs} ms response`} />
            <HealthCard
              icon={HardDrive}
              title="Storage"
              check={h?.storage}
              detail={h && `${bytes(h.storage.freeBytes)} free · uploads ${bytes(h.storage.uploadsBytes)} · certificates ${bytes(h.storage.privateBytes)}`}
            />
            <HealthCard icon={Mail} title="Email" check={h?.email} />
            <HealthCard icon={Server} title="Background jobs" check={h?.jobs} detail={data && `${plural(data.errors.last24h, "server error")} in 24 h`} />
          </div>

          <Panel title="Scheduled jobs" description="Run inside the API server. 'Run now' runs a job immediately." className="lg:col-span-2">
            {!data ? (
              <Skeleton className="h-24 rounded-xl" />
            ) : (
              <ul className="divide-y divide-[#f1f5f9]">
                {data.jobs.map((j) => (
                  <li key={j.name} className="flex flex-wrap items-center gap-3 py-3">
                    <Timer className="h-4 w-4 text-[#7c3aed]" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-[#0f172a]">
                        {j.label} <span className="text-xs font-normal text-[#94a3b8]">· every {formatDuration(j.intervalMs / 60000)}</span>
                      </p>
                      <p className="text-xs text-[#64748b]">{j.description}</p>
                    </div>
                    <div className="w-56 text-xs">
                      {j.lastError ? (
                        <p className="text-rose-600">Failed: {j.lastError}</p>
                      ) : (
                        <p className="text-[#334155]">{j.lastResult ?? "Not run yet"}</p>
                      )}
                      <p className="text-[#94a3b8]">
                        {j.lastRunAt ? `last ${formatRelative(j.lastRunAt)}` : "waiting"} {j.nextRunAt && `· next ${formatDateTime(j.nextRunAt).split(", ").pop()}`}
                      </p>
                    </div>
                    <Button size="sm" variant="outline" onClick={() => void runNow(j)} disabled={running !== null || j.running}>
                      {running === j.name ? <Loader2 className="animate-spin" /> : <Play />} Run now
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </Panel>

          <BackupsPanel />
          <section className="rounded-2xl border border-[#e9e4ff] bg-white p-5 shadow-sm">
            <div className="flex items-center gap-2">
              <Wrench className="h-4 w-4 text-[#7c3aed]" />
              <h2 className="text-base font-semibold text-[#0f172a]">Before an upgrade</h2>
            </div>
            <ol className="mt-3 list-decimal space-y-1.5 pl-5 text-sm text-[#475569]">
              <li>Turn maintenance mode on with a short message.</li>
              <li>Click <strong>Back up now</strong> and download the file.</li>
              <li>Deploy the new version, then check the health cards are all OK.</li>
              <li>Turn maintenance mode off.</li>
            </ol>
          </section>

          <ErrorsPanel onChanged={reload} />
        </div>
      )}
    </>
  )
}
