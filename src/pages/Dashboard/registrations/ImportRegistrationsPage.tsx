import { useCallback, useEffect, useMemo, useRef, useState, type DragEvent } from "react"
import { useNavigate } from "react-router"
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  Check,
  CheckCircle2,
  Copy,
  Download,
  FileSpreadsheet,
  Info,
  Loader2,
  Tag,
  UploadCloud,
  Users,
  X,
} from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { PageHeader } from "@/components/app/PageHeader"
import { EventPicker } from "@/components/app/EventPicker"
import { EmptyState } from "@/components/app/States"
import { FormError } from "@/components/auth/AuthShell"
import { useSelectedEvent } from "@/hooks/useSelectedEvent"
import { useUnsavedChanges } from "@/hooks/useUnsavedChanges"
import { useApi } from "@/hooks/useApi"
import { api, errorMessage } from "@/lib/api"
import { downloadCsv } from "@/lib/csv"
import { plural } from "@/lib/format"
import type { EventItem } from "@/types/event"
import type { CsvImportReport, CsvImportRow, CsvParseResult, DuplicateStrategy, ImportIssue } from "@/types/registration"

// ─────────────────────────── field mapping ───────────────────────────

type FieldKey = keyof CsvImportRow

const FIELDS: { key: FieldKey; label: string; required: boolean; aliases: string[] }[] = [
  { key: "name", label: "Full name", required: true, aliases: ["name", "full name", "fullname", "attendee", "attendee name", "student name", "participant", "participant name"] },
  { key: "email", label: "Email", required: true, aliases: ["email", "e mail", "email address", "mail"] },
  { key: "phone", label: "Phone", required: false, aliases: ["phone", "mobile", "phone number", "contact", "cell", "whatsapp", "contact number"] },
  { key: "department", label: "Department", required: false, aliases: ["department", "dept", "faculty", "school", "program", "programme"] },
  { key: "rollNo", label: "Roll / reg. no.", required: false, aliases: ["roll", "roll no", "roll number", "rollno", "registration no", "reg no", "cms", "cms id", "student id"] },
  { key: "categoryLabel", label: "Category", required: false, aliases: ["category", "ticket type", "attendee type", "type", "role"] },
]

const normalize = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim()

/** Guess which CSV column holds which field from the header names. */
function autoMap(headers: string[]): Record<FieldKey, number> {
  const normalized = headers.map(normalize)
  const used = new Set<number>()
  const mapping = {} as Record<FieldKey, number>
  for (const field of FIELDS) {
    let index = normalized.findIndex((h, i) => !used.has(i) && field.aliases.includes(h))
    if (index === -1) index = normalized.findIndex((h, i) => !used.has(i) && field.aliases.some((a) => a.length > 3 && h.includes(a)))
    mapping[field.key] = index
    if (index !== -1) used.add(index)
  }
  return mapping
}

const MAX_BYTES = 2 * 1024 * 1024
const PREVIEW_LIMIT = 100

type Step = "upload" | "map" | "review" | "done"
const STEPS: { key: Step; label: string }[] = [
  { key: "upload", label: "Upload" },
  { key: "map", label: "Match columns" },
  { key: "review", label: "Review" },
  { key: "done", label: "Done" },
]

function Stepper({ current }: { current: Step }) {
  const index = STEPS.findIndex((s) => s.key === current)
  return (
    <ol className="mb-6 flex items-center gap-2 overflow-x-auto rounded-2xl border border-[#e9e4ff] bg-white p-3">
      {STEPS.map((s, i) => (
        <li key={s.key} className="flex shrink-0 items-center gap-2">
          <span
            className={cn(
              "flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold",
              i < index ? "bg-emerald-500 text-white" : i === index ? "bg-[#7c3aed] text-white" : "bg-[#f1f5f9] text-[#94a3b8]"
            )}
          >
            {i < index ? <Check className="h-4 w-4" /> : i + 1}
          </span>
          <span className={cn("text-sm font-medium", i === index ? "text-[#0f172a]" : "text-[#94a3b8]")}>{s.label}</span>
          {i < STEPS.length - 1 && <span className="mx-1 h-px w-8 bg-[#e2e8f0]" />}
        </li>
      ))}
    </ol>
  )
}

function Panel({ title, icon: Icon, tone = "default", children }: { title: string; icon: typeof Info; tone?: "default" | "warn" | "info"; children: React.ReactNode }) {
  return (
    <section
      className={cn(
        "rounded-2xl border bg-white p-5",
        tone === "warn" ? "border-amber-200" : tone === "info" ? "border-blue-200" : "border-[#e9e4ff]"
      )}
    >
      <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-[#0f172a]">
        <Icon className={cn("h-4 w-4", tone === "warn" ? "text-amber-500" : tone === "info" ? "text-blue-500" : "text-[#7c3aed]")} />
        {title}
      </h3>
      {children}
    </section>
  )
}

function IssuesTable({ issues }: { issues: ImportIssue[] }) {
  return (
    <div className="max-h-80 overflow-auto rounded-xl border border-[#f1f5f9]">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-16">Row</TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Reason</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {issues.slice(0, PREVIEW_LIMIT).map((issue, i) => (
            <TableRow key={`${issue.row}-${i}`}>
              <TableCell className="tabular-nums text-[#64748b]">{issue.row}</TableCell>
              <TableCell>{issue.name || <span className="text-[#cbd5e1]">—</span>}</TableCell>
              <TableCell className="text-[#475569]">{issue.email || <span className="text-[#cbd5e1]">—</span>}</TableCell>
              <TableCell className="text-amber-700">{issue.reason}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      {issues.length > PREVIEW_LIMIT && (
        <p className="p-3 text-xs text-[#94a3b8]">…and {issues.length - PREVIEW_LIMIT} more. Download the report for the full list.</p>
      )}
    </div>
  )
}

function downloadReport(issues: ImportIssue[]) {
  downloadCsv(
    "import-skipped-rows.csv",
    ["Row", "Name", "Email", "Reason"],
    issues.map((i) => [i.row, i.name, i.email, i.reason])
  )
}

function downloadTemplate() {
  downloadCsv(
    "attendees-template.csv",
    ["name", "email", "phone", "department", "rollNo", "category"],
    [
      ["Ayesha Khan", "ayesha@example.com", "+92 300 1234567", "Computer Science", "CS-2026-014", "VIP"],
      ["Bilal Ahmed", "bilal@example.com", "", "Electrical Engineering", "EE-2026-101", "General"],
    ]
  )
}

// ─────────────────────────── page ───────────────────────────

export default function ImportRegistrationsPage() {
  const navigate = useNavigate()
  const [eventId, setEventId] = useSelectedEvent()
  const eventQ = useApi<EventItem>(eventId ? `/events/${eventId}` : null)

  const [step, setStep] = useState<Step>("upload")
  const [file, setFile] = useState<File | null>(null)
  const [parsed, setParsed] = useState<CsvParseResult | null>(null)
  const [mapping, setMapping] = useState<Record<FieldKey, number> | null>(null)
  const [strategy, setStrategy] = useState<DuplicateStrategy>("first")
  const [createCategories, setCreateCategories] = useState(true)
  const [report, setReport] = useState<CsvImportReport | null>(null)
  const [result, setResult] = useState<CsvImportReport | null>(null)
  const [working, setWorking] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [dragging, setDragging] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  // Warn before leaving in the middle of an import.
  useUnsavedChanges(step === "map" || step === "review")

  const archived = eventQ.data?.status === "ARCHIVED"

  function startOver() {
    setStep("upload")
    setFile(null)
    setParsed(null)
    setMapping(null)
    setReport(null)
    setResult(null)
    setError(null)
  }

  // ── Step 1: upload ──
  async function handleFile(f: File) {
    setError(null)
    if (!f.name.toLowerCase().endsWith(".csv")) return setError("Please choose a .csv file. In Excel: File → Save As → CSV UTF-8.")
    if (f.size > MAX_BYTES) return setError("The file is larger than 2 MB. Split it into smaller files.")
    setFile(f)
    setWorking(true)
    try {
      const form = new FormData()
      form.append("file", f)
      const res = await api.post<CsvParseResult>("/registrations/csv-import/parse", form)
      setParsed(res)
      setMapping(autoMap(res.headers))
      setStep("map")
    } catch (err) {
      setError(errorMessage(err, "Couldn't read that file."))
      setFile(null)
    } finally {
      setWorking(false)
    }
  }

  function onDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault()
    setDragging(false)
    const f = e.dataTransfer.files?.[0]
    if (f) void handleFile(f)
  }

  // ── Step 2: mapping → rows ──
  const rows = useMemo<CsvImportRow[]>(() => {
    if (!parsed || !mapping) return []
    return parsed.rows.map((cells) => {
      const row: CsvImportRow = {}
      for (const field of FIELDS) {
        const index = mapping[field.key]
        const value = index >= 0 ? String(cells[index] ?? "").trim() : ""
        if (value) row[field.key] = value
      }
      return row
    })
  }, [parsed, mapping])

  const missingRequired = FIELDS.filter((f) => f.required && (mapping?.[f.key] ?? -1) < 0)
  const duplicateColumns = mapping
    ? Object.values(mapping).filter((v, i, all) => v >= 0 && all.indexOf(v) !== i).length > 0
    : false

  // ── Step 3: server dry run (re-runs when the choices change) ──
  const runDryRun = useCallback(async () => {
    if (!eventId) return
    setWorking(true)
    setError(null)
    try {
      const res = await api.post<CsvImportReport>("/registrations/csv-import/confirm", {
        eventId,
        rows,
        dryRun: true,
        duplicateStrategy: strategy,
        createMissingCategories: createCategories,
      })
      setReport(res)
    } catch (err) {
      setError(errorMessage(err, "Couldn't check the file."))
    } finally {
      setWorking(false)
    }
  }, [eventId, rows, strategy, createCategories])

  useEffect(() => {
    if (step === "review") void runDryRun()
  }, [step, runDryRun])

  // ── Step 4: import for real ──
  async function confirmImport() {
    if (!eventId) return
    setWorking(true)
    setError(null)
    try {
      const res = await api.post<CsvImportReport>("/registrations/csv-import/confirm", {
        eventId,
        rows,
        duplicateStrategy: strategy,
        createMissingCategories: createCategories,
      })
      setResult(res)
      setStep("done")
      toast.success(`${plural(res.inserted, "attendee")} imported`)
    } catch (err) {
      setError(errorMessage(err, "The import failed. Nothing was saved."))
    } finally {
      setWorking(false)
    }
  }

  const missingCategoryLabels = report ? [...new Set(report.categoryWarnings.map((w) => w.categoryLabel))] : []
  const hasCategoryColumn = (mapping?.categoryLabel ?? -1) >= 0
  const eventQuery = eventId ? `?eventId=${eventId}` : ""

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader
        title="Import attendees"
        description="Upload a CSV file, match its columns, review, then import. Every attendee gets a ticket automatically."
        breadcrumbs={[
          { label: "Dashboard", to: "/dashboard" },
          { label: "Registrations", to: `/dashboard/registrations${eventQuery}` },
          { label: "Import CSV" },
        ]}
        actions={
          <Button variant="outline" onClick={downloadTemplate}>
            <Download /> Download template
          </Button>
        }
      />

      {step === "upload" && <EventPicker value={eventId} onChange={setEventId} className="mb-6" />}

      {!eventId ? (
        <EmptyState icon={CalendarDays} title="Choose an event first" description="Pick which event these attendees are registering for." compact />
      ) : archived ? (
        <EmptyState icon={CalendarDays} title="This event is archived" description="Restore the event before importing attendees." compact />
      ) : (
        <>
          <Stepper current={step} />
          {error && (
            <div className="mb-4">
              <FormError message={error} />
            </div>
          )}

          {/* ───── Step 1: Upload ───── */}
          {step === "upload" && (
            <div
              role="button"
              tabIndex={0}
              onClick={() => !working && inputRef.current?.click()}
              onKeyDown={(e) => e.key === "Enter" && inputRef.current?.click()}
              onDragOver={(e) => {
                e.preventDefault()
                setDragging(true)
              }}
              onDragLeave={() => setDragging(false)}
              onDrop={onDrop}
              className={cn(
                "flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed bg-white px-6 py-16 text-center transition-colors",
                dragging ? "border-[#7c3aed] bg-[#f5f3ff]" : "border-[#d8d0ff] hover:border-[#a78bfa]"
              )}
            >
              {working ? (
                <>
                  <Loader2 className="mb-3 h-10 w-10 animate-spin text-[#7c3aed]" />
                  <p className="font-medium text-[#0f172a]">Reading {file?.name}…</p>
                </>
              ) : (
                <>
                  <UploadCloud className="mb-3 h-10 w-10 text-[#a78bfa]" />
                  <p className="font-medium text-[#0f172a]">Drop your CSV file here, or click to choose</p>
                  <p className="mt-1 text-sm text-[#64748b]">Up to 2 MB and 5,000 rows · needs at least a name and an email column</p>
                  <p className="mt-3 text-xs text-[#94a3b8]">From Excel: File → Save As → "CSV UTF-8 (Comma delimited)"</p>
                </>
              )}
              <input
                ref={inputRef}
                type="file"
                accept=".csv,text/csv"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0]
                  if (f) void handleFile(f)
                  e.target.value = ""
                }}
              />
            </div>
          )}

          {/* ───── Step 2: Match columns ───── */}
          {step === "map" && parsed && mapping && (
            <div className="space-y-6">
              <div className="flex items-center gap-3 rounded-2xl border border-[#e9e4ff] bg-white p-4">
                <FileSpreadsheet className="h-8 w-8 text-[#7c3aed]" />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-[#0f172a]">{file?.name}</p>
                  <p className="text-sm text-[#64748b]">
                    {plural(parsed.totalRows, "row")} · {plural(parsed.headers.length, "column")}
                  </p>
                </div>
                <Button variant="ghost" size="sm" onClick={startOver}>
                  <X /> Choose another file
                </Button>
              </div>

              <Panel title="Match your columns to EventoraX fields" icon={ArrowRight}>
                <p className="mb-4 text-sm text-[#64748b]">We matched what we could from your column names. Check each one.</p>
                <div className="grid gap-3 md:grid-cols-2">
                  {FIELDS.map((field) => (
                    <label key={field.key} className="flex items-center justify-between gap-3 rounded-xl border border-[#f1f5f9] p-3">
                      <span className="text-sm font-medium text-[#0f172a]">
                        {field.label}
                        {field.required && <span className="text-rose-500"> *</span>}
                      </span>
                      <select
                        value={mapping[field.key]}
                        onChange={(e) => setMapping({ ...mapping, [field.key]: Number(e.target.value) })}
                        className={cn(
                          "h-9 w-48 rounded-lg border bg-white px-2 text-sm",
                          field.required && mapping[field.key] < 0 ? "border-rose-300" : "border-[#e2e8f0]"
                        )}
                      >
                        <option value={-1}>{field.required ? "Choose a column…" : "Don't import"}</option>
                        {parsed.headers.map((h, i) => (
                          <option key={`${h}-${i}`} value={i}>
                            {h || `Column ${i + 1}`}
                          </option>
                        ))}
                      </select>
                    </label>
                  ))}
                </div>
                {missingRequired.length > 0 && (
                  <p className="mt-3 text-sm font-medium text-rose-500">Choose a column for: {missingRequired.map((f) => f.label).join(", ")}</p>
                )}
                {duplicateColumns && (
                  <p className="mt-3 text-sm font-medium text-amber-600">The same CSV column is used for more than one field. Check the matches.</p>
                )}
              </Panel>

              <Panel title={`Preview (first ${Math.min(5, rows.length)} rows)`} icon={Users}>
                <div className="overflow-x-auto rounded-xl border border-[#f1f5f9]">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        {FIELDS.filter((f) => mapping[f.key] >= 0).map((f) => (
                          <TableHead key={f.key}>{f.label}</TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {rows.slice(0, 5).map((r, i) => (
                        <TableRow key={i}>
                          {FIELDS.filter((f) => mapping[f.key] >= 0).map((f) => (
                            <TableCell key={f.key} className="max-w-[220px] truncate">
                              {r[f.key] ?? <span className="text-[#cbd5e1]">—</span>}
                            </TableCell>
                          ))}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </Panel>

              <div className="flex justify-between">
                <Button variant="outline" onClick={startOver}>
                  <ArrowLeft /> Back
                </Button>
                <Button
                  disabled={missingRequired.length > 0}
                  onClick={() => {
                    setReport(null)
                    setStep("review")
                  }}
                >
                  Review {plural(rows.length, "row")} <ArrowRight />
                </Button>
              </div>
            </div>
          )}

          {/* ───── Step 3: Review ───── */}
          {step === "review" && (
            <div className="space-y-6">
              {!report ? (
                <div className="flex items-center justify-center gap-3 rounded-2xl border border-[#e9e4ff] bg-white py-16 text-[#64748b]">
                  <Loader2 className="h-5 w-5 animate-spin text-[#7c3aed]" /> Checking every row…
                </div>
              ) : (
                <>
                  <div className={cn("grid gap-4 sm:grid-cols-3", working && "opacity-60")}>
                    <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
                      <p className="text-xs font-medium uppercase tracking-wide text-emerald-700">Will be imported</p>
                      <p className="text-3xl font-bold tabular-nums text-emerald-700">{report.willImport.toLocaleString()}</p>
                    </div>
                    <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
                      <p className="text-xs font-medium uppercase tracking-wide text-amber-700">Will be skipped</p>
                      <p className="text-3xl font-bold tabular-nums text-amber-700">{report.willSkip.toLocaleString()}</p>
                    </div>
                    <div className="rounded-2xl border border-[#e9e4ff] bg-white p-4">
                      <p className="text-xs font-medium uppercase tracking-wide text-[#64748b]">Seats left</p>
                      <p className="text-3xl font-bold tabular-nums text-[#0f172a]">{report.seatsLeft === null ? "No limit" : report.seatsLeft.toLocaleString()}</p>
                    </div>
                  </div>

                  {report.duplicateGroups.length > 0 && (
                    <Panel title={`${plural(report.duplicateGroups.length, "email")} appear more than once in the file`} icon={Copy} tone="warn">
                      <p className="mb-3 text-sm text-[#64748b]">An email can only be registered once per event. Which copy should be kept?</p>
                      <div className="mb-4 flex flex-wrap gap-2" role="radiogroup">
                        {(
                          [
                            { v: "first", label: "Keep the first one" },
                            { v: "last", label: "Keep the last one" },
                            { v: "skip", label: "Skip all copies" },
                          ] as const
                        ).map((o) => (
                          <button
                            key={o.v}
                            type="button"
                            role="radio"
                            aria-checked={strategy === o.v}
                            disabled={working}
                            onClick={() => setStrategy(o.v)}
                            className={cn(
                              "rounded-xl border px-3.5 py-2 text-sm font-medium transition-colors",
                              strategy === o.v ? "border-[#7c3aed] bg-[#f5f3ff] text-[#6d28d9]" : "border-[#e2e8f0] text-[#475569] hover:border-[#c4b5fd]"
                            )}
                          >
                            {o.label}
                          </button>
                        ))}
                      </div>
                      <ul className="max-h-48 space-y-1 overflow-auto text-sm">
                        {report.duplicateGroups.slice(0, PREVIEW_LIMIT).map((g) => (
                          <li key={g.email} className="flex flex-wrap gap-x-2 text-[#475569]">
                            <span className="font-medium text-[#0f172a]">{g.email}</span>
                            <span>rows {g.rows.join(", ")}</span>
                            <span className="text-[#94a3b8]">→ {g.keptRow ? `keeping row ${g.keptRow}` : "skipping all"}</span>
                          </li>
                        ))}
                      </ul>
                    </Panel>
                  )}

                  {hasCategoryColumn && (missingCategoryLabels.length > 0 || report.categoriesToCreate.length > 0) && (
                    <Panel title="Categories that don't exist for this event yet" icon={Tag} tone="info">
                      <div className="mb-3 flex flex-wrap gap-2">
                        {(createCategories ? report.categoriesToCreate : missingCategoryLabels).map((label) => (
                          <span key={label} className="rounded-full border border-blue-200 bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-700">
                            {label}
                          </span>
                        ))}
                      </div>
                      <label className="flex cursor-pointer items-center gap-2 text-sm text-[#334155]">
                        <Checkbox checked={createCategories} disabled={working} onCheckedChange={(c) => setCreateCategories(c === true)} />
                        Create these categories during the import
                      </label>
                      {!createCategories && <p className="mt-2 text-xs text-[#64748b]">Those attendees will be imported as "General".</p>}
                    </Panel>
                  )}

                  {report.nameWarnings.length > 0 && (
                    <Panel title="Possible duplicate people (imported, just flagged)" icon={Info} tone="info">
                      <p className="mb-3 text-sm text-[#64748b]">
                        These names appear with different emails. Two different people can share a name, so they'll be imported — check them afterwards.
                      </p>
                      <ul className="max-h-48 space-y-1 overflow-auto text-sm">
                        {report.nameWarnings.slice(0, PREVIEW_LIMIT).map((w) => (
                          <li key={w.name + w.rows.join()} className="text-[#475569]">
                            <span className="font-medium text-[#0f172a]">{w.name}</span>
                            {w.rows.length > 1 && <> · rows {w.rows.join(", ")}</>}
                            {w.emails.length > 1 && <> · {w.emails.join(", ")}</>}
                            {w.alsoRegistered && <span className="text-amber-600"> · someone with this name is already registered</span>}
                          </li>
                        ))}
                      </ul>
                    </Panel>
                  )}

                  {report.errors.length > 0 && (
                    <Panel title={`${plural(report.errors.length, "row")} will be skipped`} icon={AlertTriangle} tone="warn">
                      <IssuesTable issues={report.errors} />
                      <Button variant="ghost" size="sm" className="mt-2" onClick={() => downloadReport(report.errors)}>
                        <Download /> Download skipped rows
                      </Button>
                    </Panel>
                  )}

                  {report.errors.length === 0 && report.duplicateGroups.length === 0 && (
                    <div className="flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                      <CheckCircle2 className="h-4 w-4" /> Every row looks good.
                    </div>
                  )}
                </>
              )}

              <div className="flex justify-between">
                <Button variant="outline" onClick={() => setStep("map")} disabled={working}>
                  <ArrowLeft /> Back
                </Button>
                <Button onClick={confirmImport} disabled={working || !report || report.willImport === 0}>
                  {working ? <Loader2 className="animate-spin" /> : <Check />}
                  {report ? `Import ${plural(report.willImport, "attendee")}` : "Import"}
                </Button>
              </div>
            </div>
          )}

          {/* ───── Step 4: Done ───── */}
          {step === "done" && result && (
            <div className="space-y-6">
              <div className="flex flex-col items-center rounded-2xl border border-emerald-200 bg-white px-6 py-12 text-center">
                <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50">
                  <CheckCircle2 className="h-8 w-8 text-emerald-500" />
                </div>
                <h2 className="text-xl font-bold text-[#0f172a]">{plural(result.inserted, "attendee")} imported</h2>
                <p className="mt-1 text-sm text-[#64748b]">
                  Each one has a ticket. {result.skipped > 0 ? `${plural(result.skipped, "row")} were skipped.` : "Nothing was skipped."}
                  {result.categoriesToCreate.length > 0 && ` New categories: ${result.categoriesToCreate.join(", ")}.`}
                </p>
                <div className="mt-6 flex flex-wrap justify-center gap-2">
                  {result.errors.length > 0 && (
                    <Button variant="outline" onClick={() => downloadReport(result.errors)}>
                      <Download /> Download skipped rows
                    </Button>
                  )}
                  <Button variant="outline" onClick={startOver}>
                    Import another file
                  </Button>
                  <Button onClick={() => navigate(`/dashboard/registrations${eventQuery}`)}>
                    View registrations <ArrowRight />
                  </Button>
                </div>
              </div>
              {result.errors.length > 0 && (
                <Panel title="Skipped rows" icon={AlertTriangle} tone="warn">
                  <IssuesTable issues={result.errors} />
                </Panel>
              )}
            </div>
          )}
        </>
      )}
    </div>
  )
}