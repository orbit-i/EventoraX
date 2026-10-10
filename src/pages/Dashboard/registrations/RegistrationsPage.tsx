import { useEffect, useMemo, useState } from "react"
import { useNavigate } from "react-router"
import {
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  CircleSlash,
  Download,
  FileSpreadsheet,
  FileText,
  Mail,
  Pencil,
  RotateCcw,
  Trash2,
  Upload,
  UserCheck,
  UserPlus,
  Users,
  UserX,
  XCircle,
} from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { PageHeader } from "@/components/app/PageHeader"
import { EventPicker } from "@/components/app/EventPicker"
import { StatsRow } from "@/components/app/StatCard"
import { SegmentedTabs } from "@/components/app/SegmentedTabs"
import { Toolbar, SearchInput, FilterSelect, FilterChips, type ActiveFilter } from "@/components/app/Toolbar"
import { ServerTable, type Column } from "@/components/app/ServerTable"
import { PaginationBar } from "@/components/app/PaginationBar"
import { BulkActionBar } from "@/components/app/BulkActionBar"
import { RowActions } from "@/components/app/RowActions"
import { EmptyState, ErrorState, NoResults } from "@/components/app/States"
import { RoleGate } from "@/components/app/RoleGate"
import { useConfirm } from "@/components/app/ConfirmDialog"
import { StatusMenu } from "@/components/registrations/StatusMenu"
import { EmailAttendeesDialog } from "@/components/registrations/EmailAttendeesDialog"
import { useApi } from "@/hooks/useApi"
import { useUrlState } from "@/hooks/useUrlState"
import { useSelectedEvent } from "@/hooks/useSelectedEvent"
import { useCan } from "@/lib/permissions"
import { api, buildQuery, errorMessage } from "@/lib/api"
import { formatDate, plural } from "@/lib/format"
import { statusLabel, statusOptions } from "@/lib/status"
import type { EventCategory, EventItem, EventStats } from "@/types/event"
import type { BulkAction, BulkResult, Registration, RegistrationStatus } from "@/types/registration"

const VIA_SHORT = { WEB: "Online", ADMIN: "Organizer", CSV_IMPORT: "CSV", API: "API" } as const

const BULK_LABELS: Record<BulkAction, string> = {
  mark_attended: "marked as attended",
  mark_absent: "marked as absent",
  mark_registered: "reset to registered",
  cancel: "cancelled",
  restore: "restored",
  delete: "deleted",
}

export default function RegistrationsPage() {
  const navigate = useNavigate()
  const can = useCan()
  const confirm = useConfirm()
  const [eventId, setEventId] = useSelectedEvent()
  const { values, set, reset } = useUrlState({ status: "", categoryId: "", search: "", page: "1", limit: "20" })
  const page = Number(values.page) || 1
  const limit = Number(values.limit) || 20

  // Selection: id → status (so we know whether "Restore" applies), kept across pages.
  const [selected, setSelected] = useState<Map<string, RegistrationStatus>>(new Map())
  const [emailIds, setEmailIds] = useState<string[] | null>(null)
  const [busy, setBusy] = useState(false)

  const listPath = eventId
    ? `/registrations${buildQuery({
        eventId,
        status: values.status,
        categoryId: values.categoryId,
        search: values.search,
        page,
        limit,
      })}`
    : null

  const list = useApi<Registration[]>(listPath)
  const statsQ = useApi<EventStats>(eventId ? `/events/${eventId}/stats` : null)
  const eventQ = useApi<EventItem>(eventId ? `/events/${eventId}` : null)
  const categoriesQ = useApi<EventCategory[]>(eventId ? `/categories${buildQuery({ eventId })}` : null)

  const rows = list.data ?? []
  const total = list.meta?.total ?? 0
  const reg = statsQ.data?.registrations
  const archived = eventQ.data?.status === "ARCHIVED"
  const write = can("write") && !archived
  const hasFilters = Boolean(values.search || values.categoryId)

  // A different event or filter → start with nothing selected.
  const filterKey = `${eventId}|${values.status}|${values.categoryId}|${values.search}`
  useEffect(() => setSelected(new Map()), [filterKey])

  const refresh = () => {
    list.reload()
    statsQ.reload()
  }

  // ── Single status change, with Undo ──
  async function changeStatus(r: Registration, next: RegistrationStatus, undoing = false) {
    const previous = r.status
    try {
      await api.patch(`/registrations/${r.id}/status`, { status: next })
      refresh()
      if (!undoing) {
        toast.success(`${r.name} is now ${statusLabel("registration", next).toLowerCase()}`, {
          action: { label: "Undo", onClick: () => void changeStatus({ ...r, status: next }, previous, true) },
        })
      }
    } catch (err) {
      toast.error(errorMessage(err))
    }
  }

  async function deleteOne(r: Registration) {
    const ok = await confirm({
      title: `Delete ${r.name}?`,
      description: "Their registration and ticket are permanently deleted. To keep a record, cancel the registration instead.",
      confirmLabel: "Delete",
      tone: "danger",
    })
    if (!ok) return
    try {
      await api.delete(`/registrations/${r.id}`)
      toast.success(`${r.name} deleted`)
      refresh()
    } catch (err) {
      toast.error(errorMessage(err))
    }
  }

  // ── Bulk actions ──
  const selectedIds = useMemo(() => [...selected.keys()], [selected])
  const selectedCancelled = useMemo(() => [...selected.values()].filter((s) => s === "CANCELLED").length, [selected])

  async function runBulk(action: BulkAction) {
    const count = selectedIds.length
    if (action === "delete") {
      const ok = await confirm({
        title: `Delete ${plural(count, "registration")}?`,
        description: "Their registrations and tickets are permanently deleted. To keep records, cancel them instead.",
        confirmLabel: `Delete ${count}`,
        tone: "danger",
      })
      if (!ok) return
    }
    if (action === "cancel") {
      const ok = await confirm({
        title: `Cancel ${plural(count, "registration")}?`,
        description: "Their seats are freed and they won't receive certificates or event emails. You can restore them later.",
        confirmLabel: "Cancel registrations",
        cancelLabel: "Keep them",
        tone: "danger",
      })
      if (!ok) return
    }

    setBusy(true)
    try {
      const res = await api.post<BulkResult>("/registrations/bulk", { action, ids: selectedIds })
      const skippedNote =
        res.skipped > 0
          ? action === "restore"
            ? ` (${res.skipped} weren't cancelled)`
            : action === "delete"
              ? ""
              : ` (${res.skipped} skipped — cancelled registrations aren't changed)`
          : ""
      toast.success(`${plural(res.affected, "registration")} ${BULK_LABELS[action]}${skippedNote}`)
      setSelected(new Map())
      refresh()
    } catch (err) {
      toast.error(errorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  async function exportFile(format: "csv" | "xlsx", onlySelected: boolean) {
    if (!eventId) return
    try {
      await api.download(
        `/registrations/export${buildQuery({
          eventId,
          format,
          status: onlySelected ? undefined : values.status,
          ids: onlySelected ? selectedIds.join(",") : undefined,
        })}`,
        `registrations.${format}`
      )
      toast.success("Export downloaded")
    } catch (err) {
      toast.error(errorMessage(err, "Export failed."))
    }
  }

  // ── Table ──
  const columns: Column<Registration>[] = [
    {
      key: "attendee",
      header: "Attendee",
      cell: (r) => (
        <div className="min-w-0">
          <p className="truncate font-medium text-[#0f172a]">{r.name}</p>
          <p className="truncate text-xs text-[#94a3b8]">{r.email}</p>
        </div>
      ),
    },
    {
      key: "ref",
      header: "Ref / Ticket",
      hideBelow: "lg",
      cell: (r) => (
        <div className="font-mono text-xs">
          <p className="text-[#334155]">{r.refNo}</p>
          <p className="text-[#94a3b8]">{r.ticket?.ticketNo ?? "—"}</p>
        </div>
      ),
    },
    {
      key: "category",
      header: "Category",
      hideBelow: "md",
      cell: (r) => <span className="text-sm text-[#475569]">{r.category?.label ?? "General"}</span>,
    },
    {
      key: "status",
      header: "Status",
      cell: (r) => <StatusMenu value={r.status} disabled={!write} onChange={(next) => void changeStatus(r, next)} />,
    },
    {
      key: "checkin",
      header: "Checked in",
      hideBelow: "lg",
      align: "center",
      cell: (r) =>
        r.ticket?.isUsed ? (
          <CheckCircle2 className="mx-auto h-4 w-4 text-emerald-500" aria-label="Checked in" />
        ) : (
          <span className="text-[#cbd5e1]">—</span>
        ),
    },
    {
      key: "registered",
      header: "Registered",
      hideBelow: "md",
      cell: (r) => (
        <div className="whitespace-nowrap text-xs">
          <p className="text-[#334155]">{formatDate(r.registrationDate)}</p>
          <p className="text-[#94a3b8]">via {VIA_SHORT[r.registeredVia]}</p>
        </div>
      ),
    },
    {
      key: "actions",
      header: "",
      align: "right",
      cell: (r) => (
        <RowActions
          actions={[
            { label: "Edit", icon: Pencil, to: `/dashboard/registrations/${r.id}/edit`, hidden: !write },
            { label: "Send email", icon: Mail, hidden: !write || r.status === "CANCELLED", onClick: () => setEmailIds([r.id]) },
            {
              label: "Cancel registration",
              icon: CircleSlash,
              hidden: !write || r.status === "CANCELLED",
              separatorBefore: true,
              onClick: () => void changeStatus(r, "CANCELLED"),
            },
            {
              label: "Restore registration",
              icon: RotateCcw,
              hidden: !write || r.status !== "CANCELLED",
              separatorBefore: true,
              onClick: () => void changeStatus(r, "REGISTERED"),
            },
            { label: "Delete", icon: Trash2, destructive: true, hidden: !write, onClick: () => void deleteOne(r) },
          ]}
        />
      ),
    },
  ]

  const categoryOptions = (categoriesQ.data ?? []).map((c) => ({ value: c.id, label: c.label }))
  const categoryName = categoryOptions.find((c) => c.value === values.categoryId)?.label

  const chips: ActiveFilter[] = [
    ...(values.search ? [{ key: "search", label: `Search: "${values.search}"`, onRemove: () => set({ search: "" }) }] : []),
    ...(values.categoryId ? [{ key: "cat", label: `Category: ${categoryName ?? "…"}`, onRemove: () => set({ categoryId: "" }) }] : []),
  ]

  const eventQuery = eventId ? `?eventId=${eventId}` : ""

  return (
    <>
      <PageHeader
        title="Registrations"
        description="Everyone registered for the selected event, with their tickets and attendance."
        breadcrumbs={[{ label: "Dashboard", to: "/dashboard" }, { label: "Registrations" }]}
        actions={
          eventId && (
            <>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" disabled={!reg || reg.total === 0}>
                    <Download /> Export <ChevronDown />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel className="text-xs text-[#64748b]">
                    {values.status ? `${statusLabel("registration", values.status)} only` : "All registrations"}
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onSelect={() => void exportFile("xlsx", false)}>
                    <FileSpreadsheet className="h-4 w-4" /> Excel (.xlsx)
                  </DropdownMenuItem>
                  <DropdownMenuItem onSelect={() => void exportFile("csv", false)}>
                    <FileText className="h-4 w-4" /> CSV
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <RoleGate need="write">
                {!archived && (
                  <>
                    <Button variant="outline" onClick={() => navigate(`/dashboard/registrations/import${eventQuery}`)}>
                      <Upload /> Import CSV
                    </Button>
                    <Button onClick={() => navigate(`/dashboard/registrations/new${eventQuery}`)}>
                      <UserPlus /> Add attendee
                    </Button>
                  </>
                )}
              </RoleGate>
            </>
          )
        }
      />

      <EventPicker value={eventId} onChange={setEventId} className="mb-6" />

      {!eventId ? (
        <EmptyState icon={CalendarDays} title="Choose an event" description="Pick an event above to see who registered." />
      ) : (
        <>
          {archived && (
            <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              This event is archived — registrations can be viewed and exported but not changed.
            </div>
          )}

          <StatsRow
            loading={!reg}
            items={[
              {
                label: "Registered",
                value: reg?.REGISTERED,
                icon: Users,
                accent: "blue",
                hint: reg?.maxAttendees ? `${reg.active} of ${reg.maxAttendees} seats taken` : `${reg?.active ?? 0} active`,
              },
              { label: "Attended", value: reg?.ATTENDED, icon: UserCheck, accent: "green", hint: `${reg?.attendanceRate ?? 0}% attendance` },
              { label: "Absent", value: reg?.ABSENT, icon: UserX, accent: "amber" },
              { label: "Cancelled", value: reg?.CANCELLED, icon: XCircle, accent: "slate", hint: "seats freed" },
            ]}
          />

          <SegmentedTabs
            value={values.status}
            onChange={(status) => set({ status })}
            options={[
              { value: "", label: "All", count: reg?.total },
              ...statusOptions("registration").map((o) => ({
                ...o,
                count: reg ? (reg[o.value as RegistrationStatus] ?? 0) : undefined,
              })),
            ]}
          />

          <Toolbar>
            <SearchInput value={values.search} onChange={(search) => set({ search })} placeholder="Search name, email or ref no…" />
            {categoryOptions.length > 0 && (
              <FilterSelect value={values.categoryId} onChange={(categoryId) => set({ categoryId })} options={categoryOptions} allLabel="All categories" />
            )}
          </Toolbar>

          <FilterChips filters={chips} onClearAll={() => reset(["eventId", "status"])} />

          {write && (
            <BulkActionBar count={selected.size} onClear={() => setSelected(new Map())}>
              <Button size="sm" variant="secondary" disabled={busy} onClick={() => void runBulk("mark_attended")}>
                <UserCheck /> Attended
              </Button>
              <Button size="sm" variant="secondary" disabled={busy} onClick={() => void runBulk("mark_absent")}>
                <UserX /> Absent
              </Button>
              <Button size="sm" variant="secondary" disabled={busy} onClick={() => setEmailIds(selectedIds)}>
                <Mail /> Email
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button size="sm" variant="secondary" disabled={busy}>
                    More <ChevronDown />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onSelect={() => void runBulk("mark_registered")}>
                    <RotateCcw className="h-4 w-4" /> Reset to registered
                  </DropdownMenuItem>
                  <DropdownMenuItem onSelect={() => void runBulk("cancel")}>
                    <CircleSlash className="h-4 w-4" /> Cancel registrations
                  </DropdownMenuItem>
                  {selectedCancelled > 0 && (
                    <DropdownMenuItem onSelect={() => void runBulk("restore")}>
                      <RotateCcw className="h-4 w-4" /> Restore {selectedCancelled} cancelled
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onSelect={() => void exportFile("xlsx", true)}>
                    <FileSpreadsheet className="h-4 w-4" /> Export selected (Excel)
                  </DropdownMenuItem>
                  <DropdownMenuItem onSelect={() => void exportFile("csv", true)}>
                    <FileText className="h-4 w-4" /> Export selected (CSV)
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem variant="destructive" onSelect={() => void runBulk("delete")}>
                    <Trash2 className="h-4 w-4" /> Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </BulkActionBar>
          )}

          {list.error ? (
            <ErrorState message={list.error} onRetry={list.reload} />
          ) : !list.loading && rows.length === 0 ? (
            hasFilters ? (
              <NoResults onClear={() => reset(["eventId", "status"])} />
            ) : (
              <EmptyState
                icon={Users}
                title={values.status ? `No ${statusLabel("registration", values.status).toLowerCase()} attendees` : "No registrations yet"}
                description={values.status ? undefined : "Add attendees one by one, or import a whole list from a CSV file."}
                compact
                action={
                  !values.status &&
                  write && (
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => navigate(`/dashboard/registrations/import${eventQuery}`)}>
                        <Upload /> Import CSV
                      </Button>
                      <Button size="sm" onClick={() => navigate(`/dashboard/registrations/new${eventQuery}`)}>
                        <UserPlus /> Add attendee
                      </Button>
                    </div>
                  )
                }
              />
            )
          ) : (
            <ServerTable
              columns={columns}
              rows={rows}
              rowKey={(r) => r.id}
              loading={list.loading}
              selectedIds={write ? new Set(selected.keys()) : undefined}
              onToggleRow={
                write
                  ? (id) =>
                      setSelected((prev) => {
                        const next = new Map(prev)
                        const row = rows.find((r) => r.id === id)
                        if (next.has(id)) next.delete(id)
                        else if (row) next.set(id, row.status)
                        return next
                      })
                  : undefined
              }
              onToggleAll={(checked) =>
                setSelected((prev) => {
                  const next = new Map(prev)
                  rows.forEach((r) => (checked ? next.set(r.id, r.status) : next.delete(r.id)))
                  return next
                })
              }
              onRowClick={write ? (r) => navigate(`/dashboard/registrations/${r.id}/edit`) : undefined}
            />
          )}

          <PaginationBar
            page={page}
            limit={limit}
            total={total}
            onPageChange={(p) => set({ page: String(p) })}
            onLimitChange={(n) => set({ limit: String(n) })}
          />
        </>
      )}

      <EmailAttendeesDialog open={emailIds !== null} onOpenChange={(o) => !o && setEmailIds(null)} ids={emailIds ?? []} onSent={() => setSelected(new Map())} />
    </>
  )
}