import { useEffect, useState } from "react"
import { Link } from "react-router"
import { toast } from "sonner"
import { BookOpen, Check, Copy, KeyRound, Loader2, Lock, Plus, ShieldOff, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { SelectField, TextField } from "@/components/ui/form-fields"
import { PageHeader } from "@/components/app/PageHeader"
import { ServerTable, type Column } from "@/components/app/ServerTable"
import { RowActions } from "@/components/app/RowActions"
import { EmptyState, ErrorState } from "@/components/app/States"
import { useConfirm } from "@/components/app/ConfirmDialog"
import { FormError } from "@/components/auth/AuthShell"
import { OneTimeSecret } from "@/components/superadmin/TenantDialogs"
import { useAuth } from "@/context/AuthContext"
import { useApi } from "@/hooks/useApi"
import { ApiError, api, errorMessage } from "@/lib/api"
import { formatDate, formatRelative } from "@/lib/format"

interface ApiTokenRow {
  id: string
  name: string
  prefix: string
  lastUsedAt: string | null
  expiresAt: string | null
  revokedAt: string | null
  createdAt: string
  createdBy: string | null
}

const BASE_URL = `${window.location.origin}/api/v1/ext`

function statusOf(t: ApiTokenRow) {
  if (t.revokedAt) return { label: "Revoked", cls: "bg-slate-100 text-slate-600" }
  if (t.expiresAt && new Date(t.expiresAt).getTime() < Date.now()) return { label: "Expired", cls: "bg-amber-50 text-amber-700" }
  return { label: "Active", cls: "bg-emerald-50 text-emerald-700" }
}

function CreateTokenDialog({ open, onOpenChange, onCreated }: { open: boolean; onOpenChange: (o: boolean) => void; onCreated: () => void }) {
  const [name, setName] = useState("")
  const [expiry, setExpiry] = useState("90")
  const [error, setError] = useState<string | null>(null)
  const [fieldError, setFieldError] = useState<string | undefined>()
  const [saving, setSaving] = useState(false)
  const [token, setToken] = useState<string | null>(null)

  useEffect(() => {
    if (open) {
      setName("")
      setExpiry("90")
      setError(null)
      setFieldError(undefined)
      setToken(null)
    }
  }, [open])

  async function create() {
    setError(null)
    setFieldError(undefined)
    if (name.trim().length < 2) return setFieldError("Give the token a name, e.g. “Website sign-up form”")
    setSaving(true)
    try {
      const res = await api.post<{ token: string }>("/api-tokens", { name: name.trim(), expiresInDays: expiry === "never" ? null : Number(expiry) })
      setToken(res.token)
      onCreated()
    } catch (err) {
      if (err instanceof ApiError && err.fieldErrors?.name) setFieldError(err.fieldErrors.name)
      else setError(errorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !saving && onOpenChange(o)}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{token ? "Copy your token now" : "Create an API token"}</DialogTitle>
          <DialogDescription>
            {token ? "For your security it is shown only once. Store it like a password: anyone with it can use your organization's API." : "Use one token per system, so you can revoke one without breaking the others."}
          </DialogDescription>
        </DialogHeader>
        {token ? (
          <OneTimeSecret label="API token" value={token} />
        ) : (
          <div className="space-y-4">
            {error && <FormError message={error} />}
            <TextField label="Name" required autoFocus placeholder="e.g. University portal" value={name} onChange={(e) => setName(e.target.value)} error={fieldError} />
            <SelectField
              label="Expires"
              value={expiry}
              onChange={(e) => setExpiry(e.target.value)}
              options={[
                { value: "30", label: "In 30 days" },
                { value: "90", label: "In 90 days" },
                { value: "365", label: "In 1 year" },
                { value: "never", label: "Never" },
              ]}
            />
          </div>
        )}
        <DialogFooter>
          {token ? (
            <Button onClick={() => onOpenChange(false)}>I've copied it</Button>
          ) : (
            <>
              <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
                Cancel
              </Button>
              <Button onClick={() => void create()} disabled={saving}>
                {saving ? <Loader2 className="animate-spin" /> : <KeyRound />} Create token
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default function ApiPage() {
  const { organization } = useAuth()
  const confirm = useConfirm()
  const hasApi = (organization?.plan?.features as Record<string, unknown> | null | undefined)?.restApi === true
  const list = useApi<ApiTokenRow[]>(hasApi ? "/api-tokens" : null)
  const [open, setOpen] = useState(false)
  const [copied, setCopied] = useState(false)

  async function copyBase() {
    try {
      await navigator.clipboard.writeText(BASE_URL)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast.error("Couldn't copy")
    }
  }

  async function revoke(t: ApiTokenRow) {
    const ok = await confirm({
      title: `Revoke “${t.name}”?`,
      description: "Any system using this token stops working immediately. This can't be undone. Create a new token instead.",
      confirmLabel: "Revoke token",
      tone: "danger",
    })
    if (!ok) return
    try {
      await api.post(`/api-tokens/${t.id}/revoke`)
      toast.success(`“${t.name}” revoked`)
      list.reload()
    } catch (err) {
      toast.error(errorMessage(err))
    }
  }

  const header = (
    <PageHeader
      title="API"
      description="Connect your own systems with API tokens."
      breadcrumbs={[{ label: "Dashboard", to: "/dashboard" }, { label: "API" }]}
      actions={
        <>
          <Button variant="outline" asChild>
            <Link to="/developers" target="_blank">
              <BookOpen /> API documentation
            </Link>
          </Button>
          {hasApi && (
            <Button onClick={() => setOpen(true)}>
              <Plus /> Create token
            </Button>
          )}
        </>
      }
    />
  )

  if (!hasApi) {
    return (
      <>
        {header}
        <EmptyState
          icon={Lock}
          title="The API is part of the Enterprise plan"
          description="With Enterprise you can create API tokens to list events, add registrations, check people in and read certificates from your own systems."
          action={
            <Button asChild>
              <Link to="/dashboard/billing">
                <Sparkles /> See plans
              </Link>
            </Button>
          }
        />
      </>
    )
  }

  const columns: Column<ApiTokenRow>[] = [
    {
      key: "name",
      header: "Token",
      cell: (t) => (
        <div className="min-w-0">
          <p className="truncate font-medium text-[#0f172a]">{t.name}</p>
          <p className="font-mono text-xs text-[#94a3b8]">{t.prefix}…</p>
        </div>
      ),
    },
    {
      key: "status",
      header: "Status",
      cell: (t) => {
        const s = statusOf(t)
        return <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${s.cls}`}>{s.label}</span>
      },
    },
    { key: "used", header: "Last used", hideBelow: "sm", cell: (t) => <span className="text-xs text-[#64748b]">{t.lastUsedAt ? formatRelative(t.lastUsedAt) : "Never"}</span> },
    { key: "expires", header: "Expires", hideBelow: "md", cell: (t) => <span className="text-xs text-[#64748b]">{t.expiresAt ? formatDate(t.expiresAt) : "Never"}</span> },
    {
      key: "created",
      header: "Created",
      hideBelow: "lg",
      cell: (t) => (
        <span className="text-xs text-[#64748b]">
          {formatDate(t.createdAt)}
          {t.createdBy && ` · ${t.createdBy}`}
        </span>
      ),
    },
    {
      key: "actions",
      header: "",
      align: "right",
      cell: (t) => <RowActions label={`Actions for ${t.name}`} actions={[{ label: "Revoke", icon: ShieldOff, destructive: true, hidden: Boolean(t.revokedAt), onClick: () => void revoke(t) }]} />,
    },
  ]

  return (
    <>
      {header}
      <div className="mb-6 grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-[#e9e4ff] bg-white p-5 shadow-sm">
          <p className="text-sm font-semibold text-[#0f172a]">Base URL</p>
          <div className="mt-2 flex items-center gap-2">
            <code className="min-w-0 flex-1 truncate rounded-lg bg-[#faf8ff] px-3 py-2 font-mono text-sm text-[#334155] ring-1 ring-[#e9e4ff]">{BASE_URL}</code>
            <Button size="sm" variant="outline" onClick={() => void copyBase()}>
              {copied ? <Check /> : <Copy />} {copied ? "Copied" : "Copy"}
            </Button>
          </div>
        </div>
        <div className="rounded-2xl border border-[#e9e4ff] bg-white p-5 text-sm text-[#475569] shadow-sm">
          <p className="font-semibold text-[#0f172a]">How to call it</p>
          <code className="mt-2 block break-all rounded-lg bg-slate-900 px-3 py-2 font-mono text-xs text-slate-100">curl {BASE_URL}/events -H "Authorization: Bearer evx_live_…"</code>
          <p className="mt-2 text-xs text-[#94a3b8]">Limit: 120 requests per minute per token. Everything a token does shows in your Activity log.</p>
        </div>
      </div>

      {list.error ? (
        <ErrorState message={list.error} onRetry={list.reload} />
      ) : !list.loading && (list.data ?? []).length === 0 ? (
        <EmptyState
          icon={KeyRound}
          title="No API tokens yet"
          description="Create a token for each system you want to connect."
          action={
            <Button onClick={() => setOpen(true)}>
              <Plus /> Create token
            </Button>
          }
        />
      ) : (
        <ServerTable columns={columns} rows={list.data ?? []} rowKey={(t) => t.id} loading={list.loading} />
      )}

      <CreateTokenDialog open={open} onOpenChange={setOpen} onCreated={list.reload} />
    </>
  )
}
