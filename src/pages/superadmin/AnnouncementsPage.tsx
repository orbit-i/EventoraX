import { useEffect, useState } from "react"
import { Controller, useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { toast } from "sonner"
import { Bell, CalendarClock, Clock, Eye, FileText, Loader2, Mail, Megaphone, Pencil, Plus, Send, Trash2, Undo2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { SelectField, TextField, TextareaField } from "@/components/ui/form-fields"
import { PageHeader } from "@/components/app/PageHeader"
import { SegmentedTabs } from "@/components/app/SegmentedTabs"
import { ServerTable, type Column } from "@/components/app/ServerTable"
import { PaginationBar } from "@/components/app/PaginationBar"
import { RowActions, type RowAction } from "@/components/app/RowActions"
import { StatusBadge } from "@/components/app/StatusBadge"
import { EmptyState, ErrorState } from "@/components/app/States"
import { useConfirm } from "@/components/app/ConfirmDialog"
import { applyServerErrors } from "@/components/app/form/serverErrors"
import { FormError } from "@/components/auth/AuthShell"
import { useApi } from "@/hooks/useApi"
import { useUrlState } from "@/hooks/useUrlState"
import { api, buildQuery, errorMessage } from "@/lib/api"
import { fromDatetimeLocal, toDatetimeLocal } from "@/lib/date"
import { formatDateTime, formatRelative, plural } from "@/lib/format"
import type { AnnouncementRow, PlanRow } from "@/types/superadmin"

type Mode = "now" | "schedule" | "draft"

const schema = z
  .object({
    title: z.string().trim().min(3, "Give it a title (3+ characters)").max(120, "At most 120 characters"),
    body: z.string().trim().min(5, "Write the message").max(5000, "At most 5,000 characters"),
    targetPlanId: z.string(),
    sendInApp: z.boolean(),
    sendEmail: z.boolean(),
    mode: z.enum(["now", "schedule", "draft"]),
    scheduledAt: z.string(),
  })
  .refine((v) => v.sendInApp || v.sendEmail, { message: "Choose at least one way to deliver it", path: ["sendInApp"] })
  .refine((v) => v.mode !== "schedule" || (v.scheduledAt && new Date(v.scheduledAt).getTime() > Date.now() + 60_000), {
    message: "Pick a time at least a minute from now",
    path: ["scheduledAt"],
  })
type Values = z.infer<typeof schema>

const MODES: { value: Mode; label: string; hint: string; icon: typeof Send }[] = [
  { value: "now", label: "Send now", hint: "Goes out immediately", icon: Send },
  { value: "schedule", label: "Schedule", hint: "Sends automatically later", icon: CalendarClock },
  { value: "draft", label: "Save as draft", hint: "Nothing is sent yet", icon: FileText },
]

function Audience({ row }: { row: AnnouncementRow }) {
  return <span className="text-sm text-[#475569]">{row.targetPlan ? `${row.targetPlan.name} plan only` : "All organizations"}</span>
}

function AnnouncementDialog({
  open,
  onOpenChange,
  editing,
  plans,
  onSaved,
}: {
  open: boolean
  onOpenChange: (o: boolean) => void
  editing: AnnouncementRow | null
  plans: PlanRow[]
  onSaved: () => void
}) {
  const confirm = useConfirm()
  const [formError, setFormError] = useState<string | null>(null)
  const {
    register,
    control,
    handleSubmit,
    reset,
    watch,
    setError,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<Values>({ resolver: zodResolver(schema) })

  useEffect(() => {
    if (!open) return
    setFormError(null)
    reset({
      title: editing?.title ?? "",
      body: editing?.body ?? "",
      targetPlanId: editing?.targetPlanId ?? "",
      sendInApp: editing?.sendInApp ?? true,
      sendEmail: editing?.sendEmail ?? false,
      mode: editing?.status === "SCHEDULED" ? "schedule" : editing ? "draft" : "now",
      scheduledAt: editing?.scheduledAt ? toDatetimeLocal(editing.scheduledAt) : "",
    })
  }, [open, editing, reset])

  const mode = watch("mode")
  const planId = watch("targetPlanId")
  const title = watch("title")
  const body = watch("body")
  const sendEmail = watch("sendEmail")
  const reach = useApi<{ organizations: number; admins: number; members: number }>(open ? `/superadmin/announcements/audience${buildQuery({ planId })}` : null)

  async function onSubmit(v: Values) {
    setFormError(null)
    if (v.mode === "now") {
      const r = reach.data
      const ok = await confirm({
        title: `Send "${v.title}" now?`,
        description: r
          ? `It reaches ${plural(r.organizations, "organization")}: ${v.sendInApp ? `${plural(r.members, "person", "people")} in the app` : ""}${v.sendInApp && v.sendEmail ? " and " : ""}${v.sendEmail ? `${plural(r.admins, "admin")} by email` : ""}. This can't be unsent.`
          : "This can't be unsent.",
        confirmLabel: "Send now",
      })
      if (!ok) return
    }
    const body = {
      title: v.title,
      body: v.body,
      targetPlanId: v.targetPlanId || null,
      sendInApp: v.sendInApp,
      sendEmail: v.sendEmail,
      mode: v.mode,
      scheduledAt: v.mode === "schedule" ? fromDatetimeLocal(v.scheduledAt) : undefined,
    }
    try {
      const saved = editing ? await api.patch<AnnouncementRow>(`/superadmin/announcements/${editing.id}`, body) : await api.post<AnnouncementRow>("/superadmin/announcements", body)
      toast.success(
        v.mode === "now" ? `Sent to ${plural(saved.orgCount, "organization")}` : v.mode === "schedule" ? `Scheduled for ${formatDateTime(saved.scheduledAt)}` : "Draft saved",
        { description: v.mode === "now" && v.sendEmail ? "Emails go out in the background." : undefined }
      )
      onOpenChange(false)
      onSaved()
    } catch (err) {
      setFormError(applyServerErrors(err, setError))
    }
  }

  async function close() {
    if (isDirty && !isSubmitting) {
      const leave = await confirm({ title: "Discard this announcement?", description: "What you've written will be lost.", confirmLabel: "Discard", tone: "danger" })
      if (!leave) return
    }
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={(o) => (o ? onOpenChange(true) : void close())}>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>{editing ? "Edit announcement" : "New announcement"}</DialogTitle>
          <DialogDescription>Tell organizations about new features, planned maintenance or anything important.</DialogDescription>
        </DialogHeader>
        <form id="announcement-form" onSubmit={handleSubmit(onSubmit)} noValidate className="grid gap-6 md:grid-cols-[1fr_260px]">
          <div className="space-y-4">
            {formError && <FormError message={formError} />}
            <TextField label="Title" required autoFocus placeholder="e.g. New: print ID cards for your attendees" error={errors.title?.message} {...register("title")} />
            <TextareaField label="Message" required rows={6} placeholder="Plain text. Leave an empty line between paragraphs." helper={`${body?.length ?? 0}/5,000`} error={errors.body?.message} {...register("body")} />
            <SelectField
              label="Who receives it"
              options={[{ value: "", label: "All organizations" }, ...plans.map((p) => ({ value: p.id, label: `${p.name} plan only` }))]}
              helper={reach.data ? `${plural(reach.data.organizations, "organization")} · ${plural(reach.data.members, "person", "people")} · ${plural(reach.data.admins, "admin")} (suspended ones are skipped)` : "…"}
              {...register("targetPlanId")}
            />
            <div>
              <p className="mb-2 text-sm font-semibold text-[#0f172a]">Deliver by</p>
              <div className="grid gap-2 sm:grid-cols-2">
                <Controller
                  control={control}
                  name="sendInApp"
                  render={({ field }) => (
                    <label className="flex cursor-pointer items-start gap-2.5 rounded-xl border border-[#e9e4ff] bg-[#faf8ff] p-3">
                      <Checkbox checked={field.value} onCheckedChange={(c) => field.onChange(c === true)} className="mt-0.5" />
                      <span>
                        <span className="flex items-center gap-1.5 text-sm font-medium text-[#0f172a]">
                          <Bell className="h-3.5 w-3.5" /> In the dashboard
                        </span>
                        <span className="block text-xs text-[#64748b]">Everyone in the organization sees it under the bell</span>
                      </span>
                    </label>
                  )}
                />
                <Controller
                  control={control}
                  name="sendEmail"
                  render={({ field }) => (
                    <label className="flex cursor-pointer items-start gap-2.5 rounded-xl border border-[#e9e4ff] bg-[#faf8ff] p-3">
                      <Checkbox checked={field.value} onCheckedChange={(c) => field.onChange(c === true)} className="mt-0.5" />
                      <span>
                        <span className="flex items-center gap-1.5 text-sm font-medium text-[#0f172a]">
                          <Mail className="h-3.5 w-3.5" /> By email
                        </span>
                        <span className="block text-xs text-[#64748b]">To each organization's admins (Announcement template)</span>
                      </span>
                    </label>
                  )}
                />
              </div>
              {errors.sendInApp?.message && <p className="mt-1 text-xs font-medium text-rose-500">{errors.sendInApp.message}</p>}
            </div>
            <Controller
              control={control}
              name="mode"
              render={({ field }) => (
                <div>
                  <p className="mb-2 text-sm font-semibold text-[#0f172a]">When</p>
                  <div className="grid gap-2 sm:grid-cols-3" role="radiogroup" aria-label="When">
                    {MODES.map((m) => (
                      <button
                        key={m.value}
                        type="button"
                        role="radio"
                        aria-checked={field.value === m.value}
                        onClick={() => field.onChange(m.value)}
                        className={cn(
                          "rounded-xl border p-3 text-left transition-colors",
                          field.value === m.value ? "border-[#7c3aed] bg-[#faf8ff] ring-1 ring-[#7c3aed]" : "border-[#e9e4ff] hover:border-[#c4b5fd]"
                        )}
                      >
                        <m.icon className="h-4 w-4 text-[#7c3aed]" />
                        <span className="mt-1 block text-sm font-medium text-[#0f172a]">{m.label}</span>
                        <span className="block text-xs text-[#64748b]">{m.hint}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            />
            {mode === "schedule" && <TextField label="Send at" type="datetime-local" required min={toDatetimeLocal(new Date().toISOString())} error={errors.scheduledAt?.message} {...register("scheduledAt")} />}
            {sendEmail && <p className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">Emails are real: every admin of the chosen organizations receives one.</p>}
          </div>

          <div>
            <p className="mb-2 text-sm font-semibold text-[#0f172a]">Preview in the bell</p>
            <div className="rounded-xl border border-[#e9e4ff] bg-white p-3 shadow-sm">
              <div className="flex gap-3">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#ede9fe] text-[#7c3aed]">
                  <Megaphone className="h-4 w-4" />
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-[#0f172a]">{title || "Your title"}</p>
                  <p className="mt-0.5 line-clamp-4 whitespace-pre-line text-xs text-[#64748b]">{body || "Your message…"}</p>
                  <p className="mt-1 text-[11px] text-[#94a3b8]">EventoraX team · just now</p>
                </div>
              </div>
            </div>
          </div>
        </form>
        <DialogFooter>
          <Button variant="outline" onClick={() => void close()} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" form="announcement-form" disabled={isSubmitting}>
            {isSubmitting ? <Loader2 className="animate-spin" /> : mode === "now" ? <Send /> : mode === "schedule" ? <CalendarClock /> : <FileText />}
            {mode === "now" ? "Send now" : mode === "schedule" ? "Schedule" : "Save draft"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function ViewDialog({ row, onOpenChange }: { row: AnnouncementRow | null; onOpenChange: (o: boolean) => void }) {
  return (
    <Dialog open={row !== null} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{row?.title}</DialogTitle>
          <DialogDescription>
            {row?.sentAt ? `Sent ${formatDateTime(row.sentAt)}` : row?.scheduledAt ? `Scheduled for ${formatDateTime(row.scheduledAt)}` : "Draft"}
            {row?.createdBy && ` · by ${row.createdBy}`}
          </DialogDescription>
        </DialogHeader>
        <p className="whitespace-pre-line rounded-xl border border-[#e9e4ff] bg-[#faf8ff] p-4 text-sm text-[#334155]">{row?.body}</p>
        {row?.status === "SENT" && (
          <p className="text-sm text-[#64748b]">
            Reached {plural(row.orgCount, "organization")}
            {row.sendEmail && ` · ${plural(row.emailCount, "email")} sent`}
            {row.sendInApp && " · shown in the dashboard bell"}
          </p>
        )}
      </DialogContent>
    </Dialog>
  )
}

export default function AnnouncementsPage() {
  const confirm = useConfirm()
  const { values, set } = useUrlState({ status: "", new: "", page: "1", limit: "20" })
  const page = Number(values.page) || 1
  const limit = Number(values.limit) || 20
  const list = useApi<AnnouncementRow[]>(`/superadmin/announcements${buildQuery({ status: values.status, page, limit })}`)
  const statsQ = useApi<{ DRAFT: number; SCHEDULED: number; SENT: number; total: number }>("/superadmin/announcements/stats")
  const plansQ = useApi<PlanRow[]>("/superadmin/plans")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<AnnouncementRow | null>(null)
  const [viewing, setViewing] = useState<AnnouncementRow | null>(null)

  useEffect(() => {
    if (values.new === "1") {
      setEditing(null)
      setDialogOpen(true)
      set({ new: "" })
    }
  }, [values.new, set])

  const rows = list.data ?? []
  const stats = statsQ.data

  function refresh() {
    list.reload()
    statsQ.reload()
  }

  async function act(row: AnnouncementRow, action: "send" | "unschedule" | "delete") {
    const prompts = {
      send: { title: `Send "${row.title}" now?`, description: "It goes out immediately and can't be unsent.", confirmLabel: "Send now" },
      unschedule: { title: "Cancel the schedule?", description: "It becomes a draft; nothing is sent.", confirmLabel: "Cancel schedule" },
      delete: { title: `Delete "${row.title}"?`, description: "This draft is removed for good.", confirmLabel: "Delete", tone: "danger" as const },
    }
    if (!(await confirm(prompts[action]))) return
    try {
      if (action === "delete") await api.delete(`/superadmin/announcements/${row.id}`)
      else await api.post(`/superadmin/announcements/${row.id}/${action}`)
      toast.success(action === "send" ? "Announcement sent" : action === "unschedule" ? "Moved back to drafts" : "Draft deleted")
      refresh()
    } catch (err) {
      toast.error(errorMessage(err))
    }
  }

  const actionsFor = (r: AnnouncementRow): RowAction[] => [
    { label: "View", icon: Eye, onClick: () => setViewing(r) },
    { label: "Edit", icon: Pencil, hidden: r.status === "SENT", onClick: () => (setEditing(r), setDialogOpen(true)) },
    { label: "Send now", icon: Send, hidden: r.status === "SENT", onClick: () => void act(r, "send") },
    { label: "Cancel schedule", icon: Undo2, hidden: r.status !== "SCHEDULED", onClick: () => void act(r, "unschedule") },
    { label: "Delete", icon: Trash2, destructive: true, separatorBefore: true, hidden: r.status === "SENT", onClick: () => void act(r, "delete") },
  ]

  const columns: Column<AnnouncementRow>[] = [
    {
      key: "title",
      header: "Announcement",
      cell: (r) => (
        <div className="min-w-0">
          <p className="truncate font-medium text-[#0f172a]">{r.title}</p>
          <p className="truncate text-xs text-[#94a3b8]">{r.body}</p>
        </div>
      ),
    },
    { key: "audience", header: "Audience", hideBelow: "md", cell: (r) => <Audience row={r} /> },
    {
      key: "channels",
      header: "Channels",
      hideBelow: "lg",
      cell: (r) => (
        <span className="flex items-center gap-2 text-[#64748b]">
          {r.sendInApp && <Bell className="h-4 w-4" aria-label="In the dashboard" />}
          {r.sendEmail && <Mail className="h-4 w-4" aria-label="By email" />}
        </span>
      ),
    },
    { key: "status", header: "Status", cell: (r) => <StatusBadge kind="announcement" value={r.status} /> },
    {
      key: "when",
      header: "When",
      hideBelow: "sm",
      cell: (r) => (
        <div className="text-xs">
          <p className="text-[#334155]">{r.sentAt ? formatRelative(r.sentAt) : r.scheduledAt ? formatDateTime(r.scheduledAt) : "—"}</p>
          {r.status === "SENT" && (
            <p className="text-[#94a3b8]">
              {plural(r.orgCount, "org")}
              {r.sendEmail ? ` · ${plural(r.emailCount, "email")}` : ""}
            </p>
          )}
          {r.status === "SCHEDULED" && (
            <p className="inline-flex items-center gap-1 text-amber-700">
              <Clock className="h-3 w-3" /> sends automatically
            </p>
          )}
        </div>
      ),
    },
    { key: "actions", header: "", align: "right", cell: (r) => <RowActions actions={actionsFor(r)} label={`Actions for ${r.title}`} /> },
  ]

  return (
    <>
      <PageHeader
        title="Announcements"
        description="Send news to organizations by email or in the app."
        breadcrumbs={[{ label: "Superadmin", to: "/superadmin" }, { label: "Announcements" }]}
        actions={
          <Button onClick={() => (setEditing(null), setDialogOpen(true))}>
            <Plus /> New announcement
          </Button>
        }
      />
      <SegmentedTabs
        value={values.status}
        onChange={(status) => set({ status })}
        options={[
          { value: "", label: "All", count: stats?.total },
          { value: "SENT", label: "Sent", count: stats?.SENT },
          { value: "SCHEDULED", label: "Scheduled", count: stats?.SCHEDULED },
          { value: "DRAFT", label: "Drafts", count: stats?.DRAFT },
        ]}
      />
      {list.error ? (
        <ErrorState message={list.error} onRetry={list.reload} />
      ) : !list.loading && rows.length === 0 ? (
        <EmptyState
          icon={Megaphone}
          title={values.status ? "Nothing here" : "No announcements yet"}
          description="Announce new features, maintenance windows or price changes to every organization."
          action={
            <Button onClick={() => (setEditing(null), setDialogOpen(true))}>
              <Plus /> New announcement
            </Button>
          }
        />
      ) : (
        <>
          <ServerTable columns={columns} rows={rows} rowKey={(r) => r.id} loading={list.loading} onRowClick={setViewing} />
          {list.meta && <PaginationBar page={page} limit={limit} total={list.meta.total} onPageChange={(p) => set({ page: String(p) })} onLimitChange={(l) => set({ limit: String(l) })} />}
        </>
      )}
      <AnnouncementDialog open={dialogOpen} onOpenChange={setDialogOpen} editing={editing} plans={plansQ.data ?? []} onSaved={refresh} />
      <ViewDialog row={viewing} onOpenChange={(o) => !o && setViewing(null)} />
    </>
  )
}
