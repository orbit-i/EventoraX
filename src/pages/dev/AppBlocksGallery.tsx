import { useState } from "react"
import { useForm, Controller } from "react-hook-form"
import { CalendarDays, CheckCircle2, Copy, Pencil, Trash2, UserCheck, Users, XCircle, Plus, Download } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { TextField } from "@/components/ui/form-fields"
import { PageHeader } from "@/components/app/PageHeader"
import { StatsRow } from "@/components/app/StatCard"
import { Toolbar, SearchInput, FilterSelect, FilterChips, ViewToggle } from "@/components/app/Toolbar"
import { ServerTable, type Column } from "@/components/app/ServerTable"
import { PaginationBar } from "@/components/app/PaginationBar"
import { BulkActionBar } from "@/components/app/BulkActionBar"
import { RowActions } from "@/components/app/RowActions"
import { StatusBadge } from "@/components/app/StatusBadge"
import { CardGrid } from "@/components/app/CardGrid"
import { EmptyState, NoResults, ErrorState } from "@/components/app/States"
import { useConfirm } from "@/components/app/ConfirmDialog"
import { RoleGate } from "@/components/app/RoleGate"
import { EventPicker } from "@/components/app/EventPicker"
import { FormSection, FullWidth, SwitchField, FormFooter } from "@/components/app/form/FormLayout"
import { ImageUploadField } from "@/components/app/form/ImageUploadField"
import { statusOptions, statusLabel } from "@/lib/status"

type Row = { id: string; name: string; email: string; status: string; category: string }

const STATUSES = ["REGISTERED", "ATTENDED", "ABSENT", "CANCELLED"]
const ALL_ROWS: Row[] = Array.from({ length: 37 }, (_, i) => ({
  id: `r${i + 1}`,
  name: `Attendee ${i + 1}`,
  email: `attendee${i + 1}@test.com`,
  status: STATUSES[i % 4]!,
  category: i % 3 === 0 ? "VIP" : "General",
}))

/** Preview of the dashboard building blocks (Phase 7.5). Shown inside /dev/components. */
export default function AppBlocksGallery() {
  const confirm = useConfirm()
  const [search, setSearch] = useState("")
  const [status, setStatus] = useState("")
  const [view, setView] = useState<"table" | "grid">("table")
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(10)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [eventId, setEventId] = useState("")

  const filtered = ALL_ROWS.filter(
    (r) => (!search || r.name.toLowerCase().includes(search.toLowerCase())) && (!status || r.status === status)
  )
  const pageRows = filtered.slice((page - 1) * limit, page * limit)

  const columns: Column<Row>[] = [
    { key: "name", header: "Name", cell: (r) => <span className="font-medium text-[#0f172a]">{r.name}</span> },
    { key: "email", header: "Email", cell: (r) => r.email, hideBelow: "md" },
    { key: "category", header: "Category", cell: (r) => r.category, hideBelow: "lg" },
    { key: "status", header: "Status", cell: (r) => <StatusBadge kind="registration" value={r.status} /> },
    {
      key: "actions",
      header: "",
      align: "right",
      cell: (r) => (
        <RowActions
          actions={[
            { label: "Edit", icon: Pencil, onClick: () => toast(`Edit ${r.name}`) },
            { label: "Duplicate", icon: Copy, onClick: () => toast("Duplicated") },
            { label: "Delete", icon: Trash2, destructive: true, separatorBefore: true, onClick: () => void askDelete(r) },
          ]}
        />
      ),
    },
  ]

  async function askDelete(r: Row) {
    const ok = await confirm({
      title: `Delete ${r.name}?`,
      description: "Their ticket is deleted too. This can't be undone.",
      confirmLabel: "Delete",
      tone: "danger",
    })
    if (ok) toast.success(`${r.name} deleted`)
  }

  const toggleRow = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })

  const form = useForm<{ name: string; website: string; photo: string | null; visible: boolean }>({
    defaultValues: { name: "", website: "", photo: null, visible: true },
  })

  return (
    <div className="space-y-12 border-t-4 border-[#7c3aed] pt-10">
      <h1 className="text-3xl font-bold text-[#0f172a]">Dashboard building blocks</h1>

      <section className="space-y-4">
        <h2 className="text-lg font-bold text-[#0f172a]">Page header + event picker + stats</h2>
        <PageHeader
          title="Registrations"
          description="Everyone registered for the selected event."
          breadcrumbs={[{ label: "Dashboard", to: "/dashboard" }, { label: "Registrations" }]}
          actions={
            <>
              <Button variant="outline">
                <Download /> Export
              </Button>
              <RoleGate need="write" fallback={<span className="text-xs text-[#94a3b8]">(log in as admin to see "Add attendee")</span>}>
                <Button>
                  <Plus /> Add attendee
                </Button>
              </RoleGate>
            </>
          }
        />
        <EventPicker value={eventId} onChange={setEventId} className="mb-6" />
        <StatsRow
          items={[
            { label: "Registered", value: 128, icon: Users, accent: "blue", hint: "of 200 seats" },
            { label: "Attended", value: 96, icon: UserCheck, accent: "green", hint: "75% attendance" },
            { label: "Absent", value: 22, icon: XCircle, accent: "amber" },
            { label: "Cancelled", value: 10, icon: CalendarDays, accent: "slate" },
          ]}
        />
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-bold text-[#0f172a]">Toolbar, chips, bulk bar, table, pagination</h2>
        <Toolbar end={<ViewToggle value={view} onChange={setView} />}>
          <SearchInput value={search} onChange={(v) => (setSearch(v), setPage(1))} placeholder="Search name or email…" />
          <FilterSelect value={status} onChange={(v) => (setStatus(v), setPage(1))} options={statusOptions("registration")} allLabel="All statuses" />
        </Toolbar>
        <FilterChips
          filters={[
            ...(search ? [{ key: "search", label: `Search: "${search}"`, onRemove: () => setSearch("") }] : []),
            ...(status ? [{ key: "status", label: `Status: ${statusLabel("registration", status)}`, onRemove: () => setStatus("") }] : []),
          ]}
          onClearAll={() => (setSearch(""), setStatus(""))}
        />
        <BulkActionBar count={selected.size} onClear={() => setSelected(new Set())}>
          <Button size="sm" variant="secondary" onClick={() => toast.success("Marked attended")}>
            <CheckCircle2 /> Mark attended
          </Button>
          <Button size="sm" variant="secondary">Cancel</Button>
          <Button size="sm" variant="danger">
            <Trash2 /> Delete
          </Button>
        </BulkActionBar>
                {filtered.length === 0 ? (
          <NoResults onClear={() => (setSearch(""), setStatus(""))} />
        ) : view === "grid" ? (
          <CardGrid>
            {pageRows.map((r) => (
              <div key={r.id} className="space-y-3 rounded-2xl border border-[#e9e4ff] bg-white p-5 shadow-sm">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#ede9fe] font-bold text-[#7c3aed]">
                      {r.name.split(" ")[1]}
                    </div>
                    <div>
                      <p className="font-medium text-[#0f172a]">{r.name}</p>
                      <p className="text-xs text-[#64748b]">{r.email}</p>
                    </div>
                  </div>
                  <RowActions actions={[{ label: "Edit", icon: Pencil, onClick: () => toast(`Edit ${r.name}`) }]} />
                </div>
                <div className="flex gap-2">
                  <StatusBadge kind="registration" value={r.status} />
                  <span className="text-xs text-[#94a3b8]">{r.category}</span>
                </div>
              </div>
            ))}
          </CardGrid>
        ) : (
          <ServerTable
            columns={columns}
            rows={pageRows}
            rowKey={(r) => r.id}
            selectedIds={selected}
            onToggleRow={toggleRow}
            onToggleAll={(checked) =>
              setSelected((prev) => {
                const next = new Set(prev)
                pageRows.forEach((r) => (checked ? next.add(r.id) : next.delete(r.id)))
                return next
              })
            }
            onRowClick={(r) => toast(`Open ${r.name}`)}
          />
        )}
        <PaginationBar page={page} limit={limit} total={filtered.length} onPageChange={setPage} onLimitChange={(n) => (setLimit(n), setPage(1))} />
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-bold text-[#0f172a]">Badges</h2>
        <div className="flex flex-wrap gap-2">
          {["DRAFT", "PUBLISHED", "ONGOING", "COMPLETED", "ARCHIVED"].map((s) => (
            <StatusBadge key={s} kind="event" value={s} />
          ))}
          {["OFFLINE", "ONLINE", "HYBRID"].map((s) => (
            <StatusBadge key={s} kind="mode" value={s} />
          ))}
          {["PLATINUM", "GOLD", "SILVER", "BRONZE"].map((s) => (
            <StatusBadge key={s} kind="tier" value={s} />
          ))}
          <StatusBadge kind="visibility" value={true} />
          <StatusBadge kind="visibility" value={false} />
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <EmptyState title="No speakers yet" description="Add the people speaking at this event." action={<Button size="sm"><Plus /> Add speaker</Button>} compact />
        <NoResults onClear={() => toast("Cleared")} />
        <ErrorState message="Couldn't load registrations." onRetry={() => toast("Retrying…")} />
      </section>

      <section>
        <h2 className="mb-4 text-lg font-bold text-[#0f172a]">Form template</h2>
        <form
          onSubmit={form.handleSubmit(async () => {
            await new Promise((r) => setTimeout(r, 800))
            form.setError("website", { type: "server", message: "Must be a full link starting with http:// or https://" })
            toast.error("Please fix the highlighted fields.")
          })}
          className="space-y-6"
        >
          <FormSection title="Basics" description="Shown on the public event page.">
            <TextField label="Sponsor name" required error={form.formState.errors.name?.message} {...form.register("name", { required: "Name is required" })} />
            <TextField label="Website" placeholder="https://…" error={form.formState.errors.website?.message} {...form.register("website")} />
            <FullWidth>
              <Controller
                control={form.control}
                name="photo"
                render={({ field }) => (
                  <ImageUploadField label="Logo" kind="sponsor" value={field.value} onChange={field.onChange} />
                )}
              />
            </FullWidth>
            <FullWidth>
              <Controller
                control={form.control}
                name="visible"
                render={({ field }) => (
                  <SwitchField
                    label="Show on public event page"
                    description="Visitors will see this sponsor on the event's page."
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                )}
              />
            </FullWidth>
          </FormSection>
          <div className="px-6">
            <FormFooter submitting={form.formState.isSubmitting} onCancel={() => form.reset()} dirty={form.formState.isDirty} />
          </div>
        </form>
      </section>
    </div>
  )
}