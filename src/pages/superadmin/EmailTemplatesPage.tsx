import { useEffect, useMemo, useRef, useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { toast } from "sonner"
import { Bold, Braces, CheckCircle2, Heading2, Italic, Link2, Loader2, MousePointerClick, Pilcrow, PlugZap, RotateCcw, Send, Server, XCircle } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { PasswordField, TextField } from "@/components/ui/form-fields"
import { PageHeader } from "@/components/app/PageHeader"
import { SegmentedTabs } from "@/components/app/SegmentedTabs"
import { ErrorState } from "@/components/app/States"
import { useConfirm } from "@/components/app/ConfirmDialog"
import { FormSection, FullWidth } from "@/components/app/form/FormLayout"
import { applyServerErrors } from "@/components/app/form/serverErrors"
import { FormError } from "@/components/auth/AuthShell"
import { SaveBar } from "@/components/settings/shared"
import { useAuth } from "@/context/AuthContext"
import { useApi } from "@/hooks/useApi"
import { useUrlState } from "@/hooks/useUrlState"
import { useUnsavedChanges } from "@/hooks/useUnsavedChanges"
import { api, errorMessage } from "@/lib/api"
import { formatRelative } from "@/lib/format"

interface TemplateRow {
  type: string
  name: string
  description: string
  usedFor: string
  variables: { key: string; description: string; sample: string }[]
  subject: string
  bodyHtml: string
  defaultSubject: string
  defaultBodyHtml: string
  isCustom: boolean
  updatedAt: string | null
  updatedBy: string | null
}

interface SmtpInfo {
  host: string
  port: number
  user: string
  from: string
  hasPassword: boolean
  status: { mode: "settings" | "env" | "console"; host: string | null; user: string | null }
}

const MODE_TEXT = {
  settings: "Using the SMTP server saved below.",
  env: "Using the SMTP server from backend/.env (nothing saved here yet).",
  console: "No SMTP server: emails are only printed in the backend terminal.",
}

// ─────────────────────────── Template editor ───────────────────────────

function ToolbarButton({ label, icon: Icon, onClick }: { label: string; icon: typeof Bold; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} title={label} aria-label={label} className="rounded-md p-1.5 text-[#475569] hover:bg-[#f5f3ff] hover:text-[#7c3aed]">
      <Icon className="h-4 w-4" />
    </button>
  )
}

function Editor({ template, onSaved, onDirtyChange }: { template: TemplateRow; onSaved: () => void; onDirtyChange: (d: boolean) => void }) {
  const confirm = useConfirm()
  const { user } = useAuth()
  const [subject, setSubject] = useState(template.subject)
  const [body, setBody] = useState(template.bodyHtml)
  const [errors, setErrors] = useState<{ subject?: string; bodyHtml?: string }>({})
  const [busy, setBusy] = useState<"save" | "reset" | "test" | null>(null)
  const [preview, setPreview] = useState<{ subject: string; html: string } | null>(null)
  const [previewError, setPreviewError] = useState<string | null>(null)
  const textarea = useRef<HTMLTextAreaElement>(null)

  const dirty = subject !== template.subject || body !== template.bodyHtml
  useEffect(() => onDirtyChange(dirty), [dirty, onDirtyChange])

  // Live preview with sample values (debounced, so typing stays smooth).
  useEffect(() => {
    const handle = setTimeout(() => {
      api
        .post<{ subject: string; html: string }>(`/superadmin/emails/${template.type}/preview`, { subject: subject || "(no subject)", bodyHtml: body.length >= 10 ? body : `${body}          ` })
        .then((p) => (setPreview(p), setPreviewError(null)))
        .catch((err) => setPreviewError(errorMessage(err, "Couldn't render the preview.")))
    }, 400)
    return () => clearTimeout(handle)
  }, [subject, body, template.type])

  /** Wraps the selected text (or inserts at the cursor). */
  function insert(before: string, after = "") {
    const el = textarea.current
    if (!el) return
    const { selectionStart: a, selectionEnd: b } = el
    const next = body.slice(0, a) + before + body.slice(a, b) + after + body.slice(b)
    setBody(next)
    requestAnimationFrame(() => {
      el.focus()
      el.setSelectionRange(a + before.length, b + before.length)
    })
  }

  function addLink() {
    const url = window.prompt("Link address (https://…)", "https://")
    if (url && /^https?:\/\/\S+$/.test(url)) insert(`<a href="${url}" style="color:#7c3aed">`, "</a>")
  }

  const linkVars = template.variables.filter((v) => /link/i.test(v.key))

  async function save() {
    setErrors({})
    setBusy("save")
    try {
      await api.put(`/superadmin/emails/${template.type}`, { subject, bodyHtml: body })
      toast.success(`${template.name} email saved`)
      onSaved()
    } catch (err) {
      const fe = (err as { fieldErrors?: Record<string, string> }).fieldErrors
      if (fe) setErrors(fe)
      else toast.error(errorMessage(err))
    } finally {
      setBusy(null)
    }
  }

  async function reset() {
    const ok = await confirm({
      title: `Reset the ${template.name} email?`,
      description: "Your changes are thrown away and the built-in EventoraX text is used again.",
      confirmLabel: "Reset to default",
      tone: "danger",
    })
    if (!ok) return
    setBusy("reset")
    try {
      await api.delete(`/superadmin/emails/${template.type}`)
      toast.success("Back to the default text")
      onSaved()
    } catch (err) {
      toast.error(errorMessage(err))
    } finally {
      setBusy(null)
    }
  }

  async function sendTest() {
    const ok = await confirm({
      title: "Send a test email?",
      description: `The current version (with sample values) is sent to ${user?.email}. Make sure that's a real inbox you can read.`,
      confirmLabel: "Send test",
    })
    if (!ok) return
    setBusy("test")
    try {
      const res = await api.post<{ sentTo: string; mode: string }>(`/superadmin/emails/${template.type}/test`, { subject, bodyHtml: body })
      toast.success(res.mode === "console" ? "Printed in the backend terminal (no SMTP server)" : `Test sent to ${res.sentTo}`)
    } catch (err) {
      toast.error(errorMessage(err))
    } finally {
      setBusy(null)
    }
  }

  return (
    <div className="space-y-4">
      <form
        onSubmit={(e) => {
          e.preventDefault()
          void save()
        }}
        noValidate
        className="rounded-2xl border border-[#e9e4ff] bg-white p-5 shadow-sm"
      >
        <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold text-[#0f172a]">{template.name}</h2>
            <p className="text-sm text-[#64748b]">{template.description}</p>
            <p className="mt-1 text-xs text-[#94a3b8]">
              Sent from: {template.usedFor}
              {template.isCustom && template.updatedAt && ` · edited ${formatRelative(template.updatedAt)}${template.updatedBy ? ` by ${template.updatedBy}` : ""}`}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={() => void sendTest()} disabled={Boolean(busy)}>
              {busy === "test" ? <Loader2 className="animate-spin" /> : <Send />} Send test to me
            </Button>
            {template.isCustom && (
              <Button variant="outline" size="sm" onClick={() => void reset()} disabled={Boolean(busy)}>
                <RotateCcw /> Reset to default
              </Button>
            )}
          </div>
        </div>

        <TextField label="Subject" value={subject} onChange={(e) => setSubject(e.target.value)} error={errors.subject} />

        <div className="mt-4">
          <p className="mb-1.5 text-sm font-semibold text-[#0f172a]">Email body (HTML)</p>
          <div className="flex flex-wrap items-center gap-0.5 rounded-t-xl border border-b-0 border-[#e2e8f0] bg-[#faf8ff] px-2 py-1">
            <ToolbarButton label="Heading" icon={Heading2} onClick={() => insert('<h2 style="margin-top:0">', "</h2>")} />
            <ToolbarButton label="Paragraph" icon={Pilcrow} onClick={() => insert("<p>", "</p>")} />
            <ToolbarButton label="Bold" icon={Bold} onClick={() => insert("<strong>", "</strong>")} />
            <ToolbarButton label="Italic" icon={Italic} onClick={() => insert("<em>", "</em>")} />
            <ToolbarButton label="Link" icon={Link2} onClick={addLink} />
            <span className="mx-1 h-5 w-px bg-[#e2e8f0]" />
            <DropdownMenu>
              <DropdownMenuTrigger className="flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-[#475569] hover:bg-[#f5f3ff] hover:text-[#7c3aed]">
                <Braces className="h-4 w-4" /> Insert value
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-72">
                <DropdownMenuLabel>Values for this email</DropdownMenuLabel>
                {template.variables.map((v) => (
                  <DropdownMenuItem key={v.key} onSelect={() => insert(v.key === "message" ? "{{{message}}}" : `{{${v.key}}}`)}>
                    <span className="font-mono text-xs text-[#7c3aed]">{`{{${v.key}}}`}</span>
                    <span className="ml-auto truncate pl-2 text-xs text-[#94a3b8]">{v.description}</span>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
            {linkVars.length > 0 && (
              <DropdownMenu>
                <DropdownMenuTrigger className="flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-[#475569] hover:bg-[#f5f3ff] hover:text-[#7c3aed]">
                  <MousePointerClick className="h-4 w-4" /> Button
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start">
                  <DropdownMenuLabel>A big button that opens…</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {linkVars.map((v) => (
                    <DropdownMenuItem key={v.key} onSelect={() => insert(`{{button "Open" ${v.key}}}`)}>
                      {v.description}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
          <textarea
            ref={textarea}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={14}
            spellCheck={false}
            aria-invalid={Boolean(errors.bodyHtml)}
            className={cn(
              "w-full rounded-b-xl border border-[#e2e8f0] bg-white px-3 py-2.5 font-mono text-xs leading-relaxed text-[#0f172a] outline-none focus:border-[#a855f7] focus:ring-2 focus:ring-[#a855f7]/30",
              errors.bodyHtml && "border-rose-400"
            )}
          />
          {errors.bodyHtml && <p className="mt-1 text-xs font-medium text-rose-500">{errors.bodyHtml}</p>}
          <p className="mt-1 text-xs text-[#94a3b8]">
            <code>{"{{name}}"}</code> inserts a value · <code>{'{{button "Label" link}}'}</code> adds a button · the purple header and footer are added automatically.
          </p>
        </div>
        <SaveBar
          dirty={dirty}
          submitting={busy === "save"}
          onDiscard={() => {
            setSubject(template.subject)
            setBody(template.bodyHtml)
            setErrors({})
          }}
          label="Save template"
        />
      </form>
      <div className="rounded-2xl border border-[#e9e4ff] bg-white p-5 shadow-sm">
        <div className="mb-3 flex items-center justify-between gap-2">
          <h3 className="text-sm font-semibold text-[#0f172a]">Preview</h3>
          <span className="text-xs text-[#94a3b8]">with sample values</span>
        </div>
        {previewError ? (
          <p className="text-sm text-rose-600">{previewError}</p>
        ) : !preview ? (
          <Skeleton className="h-96 rounded-xl" />
        ) : (
          <>
            <p className="mb-2 text-sm">
              <span className="text-[#64748b]">Subject:</span> <strong className="text-[#0f172a]">{preview.subject}</strong>
            </p>
            {/* sandbox: scripts in the template never run */}
            <iframe title="Email preview" sandbox="allow-same-origin" srcDoc={preview.html} className="h-[28rem] w-full rounded-xl border border-[#e9e4ff] bg-white" />
          </>
        )}
      </div>
    </div>
  )
}

// ─────────────────────────── SMTP ───────────────────────────

const smtpSchema = z.object({
  host: z.string().trim().min(3, "Enter the SMTP server, e.g. smtp.gmail.com"),
  port: z.string().trim().refine((v) => /^\d+$/.test(v) && Number(v) > 0 && Number(v) < 65536, "Enter a valid port, e.g. 587"),
  user: z.string().trim().min(1, "Enter the username"),
  pass: z.string(),
  from: z.string().trim().max(200),
})
type SmtpValues = z.infer<typeof smtpSchema>

function SmtpPanel({ onDirtyChange }: { onDirtyChange: (d: boolean) => void }) {
  const confirm = useConfirm()
  const { data, error, reload } = useApi<SmtpInfo>("/superadmin/smtp")
  const [formError, setFormError] = useState<string | null>(null)
  const [check, setCheck] = useState<{ ok: boolean; message: string } | null>(null)
  const [checking, setChecking] = useState(false)
  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isDirty, isSubmitting },
  } = useForm<SmtpValues>({ resolver: zodResolver(smtpSchema) })

  const defaults = useMemo(() => (data ? { host: data.host, port: String(data.port), user: data.user, pass: "", from: data.from } : undefined), [data])
  useEffect(() => {
    if (defaults) reset(defaults)
  }, [defaults, reset])
  useEffect(() => onDirtyChange(isDirty), [isDirty, onDirtyChange])

  async function onSubmit(v: SmtpValues) {
    setFormError(null)
    try {
      await api.put("/superadmin/smtp", { ...v, port: Number(v.port), pass: v.pass || undefined })
      toast.success("SMTP server saved", { description: "New emails use it straight away." })
      setCheck(null)
      reload()
    } catch (err) {
      setFormError(applyServerErrors(err, setError))
    }
  }

  async function verify() {
    setChecking(true)
    try {
      setCheck(await api.post<{ ok: boolean; message: string }>("/superadmin/smtp/verify"))
    } catch (err) {
      setCheck({ ok: false, message: errorMessage(err) })
    } finally {
      setChecking(false)
    }
  }

  async function forget() {
    const ok = await confirm({ title: "Forget the saved SMTP server?", description: "Emails go back to the server in backend/.env (or the terminal if there is none).", confirmLabel: "Forget it", tone: "danger" })
    if (!ok) return
    try {
      await api.delete("/superadmin/smtp")
      toast.success("Using backend/.env again")
      reload()
    } catch (err) {
      toast.error(errorMessage(err))
    }
  }

  if (error) return <ErrorState message={error} onRetry={reload} />
  if (!data) return <Skeleton className="h-80 rounded-2xl" />

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-6">
      <div className={cn("flex flex-wrap items-center gap-3 rounded-2xl border p-4 text-sm", data.status.mode === "console" ? "border-amber-200 bg-amber-50 text-amber-900" : "border-[#e9e4ff] bg-white text-[#334155]")}>
        <Server className="h-5 w-5 shrink-0 text-[#7c3aed]" />
        <div className="flex-1">
          <p className="font-medium">{MODE_TEXT[data.status.mode]}</p>
          {data.status.host && (
            <p className="text-xs text-[#64748b]">
              {data.status.host} · {data.status.user}
            </p>
          )}
        </div>
        <Button type="button" variant="outline" size="sm" onClick={() => void verify()} disabled={checking}>
          {checking ? <Loader2 className="animate-spin" /> : <PlugZap />} Test connection
        </Button>
      </div>
      {check && (
        <div className={cn("flex items-start gap-2 rounded-xl border p-3 text-sm", check.ok ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-rose-200 bg-rose-50 text-rose-800")}>
          {check.ok ? <CheckCircle2 className="mt-0.5 h-4 w-4" /> : <XCircle className="mt-0.5 h-4 w-4" />} {check.message}
        </div>
      )}
      {formError && <FormError message={formError} />}
      <FormSection title="SMTP server" description="Saved here, it overrides backend/.env. For Gmail use smtp.gmail.com, port 587 and an app password.">
        <TextField label="Server" required placeholder="smtp.gmail.com" error={errors.host?.message} {...register("host")} />
        <TextField label="Port" required inputMode="numeric" placeholder="587" helper="587 (STARTTLS) or 465 (SSL)" error={errors.port?.message} {...register("port")} />
        <TextField label="Username" required autoComplete="off" error={errors.user?.message} {...register("user")} />
        <PasswordField
          label="Password"
          autoComplete="new-password"
          placeholder={data.hasPassword ? "•••••••• (saved — leave empty to keep)" : ""}
          error={errors.pass?.message}
          {...register("pass")}
        />
        <FullWidth>
          <TextField label="From" placeholder={'"EventoraX" <no-reply@eventorax.com>'} helper="Empty = the username" error={errors.from?.message} {...register("from")} />
        </FullWidth>
        <FullWidth>
          <SaveBar dirty={isDirty} submitting={isSubmitting} onDiscard={() => defaults && reset(defaults)} label="Save server" />
        </FullWidth>
      </FormSection>
      {data.status.mode === "settings" && (
        <Button type="button" variant="ghost" className="text-rose-600 hover:bg-rose-50 hover:text-rose-700" onClick={() => void forget()}>
          Forget the saved server
        </Button>
      )}
    </form>
  )
}

// ─────────────────────────── Page ───────────────────────────

export default function EmailTemplatesPage() {
  const confirm = useConfirm()
  const { data, error, initialLoading, reload } = useApi<TemplateRow[]>("/superadmin/emails")
  const { values, set } = useUrlState({ tab: "templates", type: "WELCOME" })
  const [editorDirty, setEditorDirty] = useState(false)
  const [smtpDirty, setSmtpDirty] = useState(false)
  useUnsavedChanges(editorDirty || smtpDirty)

  const templates = data ?? []
  const current = templates.find((t) => t.type === values.type) ?? templates[0]

  async function pick(type: string) {
    if (type === current?.type) return
    if (editorDirty) {
      const leave = await confirm({ title: "Discard unsaved changes?", description: "You've edited this email but haven't saved it.", confirmLabel: "Discard changes", tone: "danger" })
      if (!leave) return
    }
    setEditorDirty(false)
    set({ type })
  }

  return (
    <>
      <PageHeader
        title="Email templates"
        description="Edit the emails EventoraX sends, preview them and send yourself a test. Set the SMTP server they go through."
        breadcrumbs={[{ label: "Superadmin", to: "/superadmin" }, { label: "Email templates" }]}
      />
      <SegmentedTabs
        value={values.tab}
        onChange={(tab) => set({ tab })}
        options={[
          { value: "templates", label: "Templates", dot: editorDirty },
          { value: "smtp", label: "SMTP server", dot: smtpDirty },
        ]}
      />
      <div className={cn(values.tab !== "smtp" && "hidden")}>
        <SmtpPanel onDirtyChange={setSmtpDirty} />
      </div>
      <div className={cn(values.tab !== "templates" && "hidden")}>
        {error ? (
          <ErrorState message={error} onRetry={reload} />
        ) : initialLoading || !current ? (
          <Skeleton className="h-96 rounded-2xl" />
        ) : (
          <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
            <nav aria-label="Email templates" className="space-y-1 self-start rounded-2xl border border-[#e9e4ff] bg-white p-2 shadow-sm">
              {templates.map((t) => (
                <button
                  key={t.type}
                  type="button"
                  onClick={() => void pick(t.type)}
                  aria-current={t.type === current.type ? "true" : undefined}
                  className={cn(
                    "flex w-full items-center justify-between gap-2 rounded-xl px-3 py-2 text-left text-sm transition-colors",
                    t.type === current.type ? "bg-[#7c3aed] text-white" : "text-[#334155] hover:bg-[#f5f3ff]"
                  )}
                >
                  <span className="truncate">{t.name}</span>
                  {t.isCustom && <span className={cn("rounded-full px-1.5 py-0.5 text-[10px] font-semibold", t.type === current.type ? "bg-white/20" : "bg-[#ede9fe] text-[#6d28d9]")}>Edited</span>}
                </button>
              ))}
            </nav>
            <Editor key={`${current.type}-${current.updatedAt ?? "default"}`} template={current} onSaved={reload} onDirtyChange={setEditorDirty} />
          </div>
        )}
      </div>
    </>
  )
}
