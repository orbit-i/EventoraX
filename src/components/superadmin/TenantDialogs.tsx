import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { toast } from "sonner"
import { Building2, CalendarPlus, Check, Copy, Loader2, Ban, Trash2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { SelectField, TextareaField, TextField } from "@/components/ui/form-fields"
import { applyServerErrors } from "@/components/app/form/serverErrors"
import { FormError } from "@/components/auth/AuthShell"
import { api, errorMessage } from "@/lib/api"
import { emailSchema } from "@/lib/validation"
import { formatDate, formatMoney } from "@/lib/format"
import type { CreatedTenant, PlanRow } from "@/types/superadmin"

const DAY = 24 * 60 * 60 * 1000

/** Shows a secret once with a copy button. */
export function OneTimeSecret({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false)
  async function copy() {
    try {
      await navigator.clipboard.writeText(value)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast.error("Couldn't copy. Select the text and copy it yourself.")
    }
  }
  return (
    <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-amber-800">{label}</p>
      <div className="mt-2 flex items-center gap-2">
        <code className="flex-1 select-all break-all rounded-lg bg-white px-3 py-2 font-mono text-sm text-[#0f172a] ring-1 ring-amber-200">{value}</code>
        <Button type="button" size="sm" variant="outline" onClick={() => void copy()}>
          {copied ? <Check /> : <Copy />} {copied ? "Copied" : "Copy"}
        </Button>
      </div>
      <p className="mt-2 text-xs text-amber-800">This is shown only once. Share it privately. They should change it after logging in.</p>
    </div>
  )
}

// ─────────────────────────── Add tenant ───────────────────────────

const createSchema = z.object({
  orgName: z.string().trim().min(2, "Enter the organization's name").max(150),
  orgEmail: z.union([z.literal(""), emailSchema]),
  phone: z.string().trim().max(30),
  adminName: z.string().trim().min(2, "Enter the admin's full name").max(100),
  adminEmail: emailSchema,
  planId: z.string().min(1, "Choose a plan"),
  status: z.enum(["trial", "active"]),
  days: z.coerce.number<string>().int("Whole days only").min(1, "At least 1 day").max(3650, "At most 10 years"),
})
type CreateValues = z.input<typeof createSchema>

export function CreateTenantDialog({
  open,
  onOpenChange,
  plans,
  onCreated,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  plans: PlanRow[]
  onCreated: (tenantId: string) => void
}) {
  const [formError, setFormError] = useState<string | null>(null)
  const [created, setCreated] = useState<CreatedTenant | null>(null)
  const defaults: CreateValues = { orgName: "", orgEmail: "", phone: "", adminName: "", adminEmail: "", planId: plans[0]?.id ?? "", status: "trial", days: "1" }
  const {
    register,
    handleSubmit,
    reset,
    setError,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<CreateValues, unknown, z.output<typeof createSchema>>({ resolver: zodResolver(createSchema), defaultValues: defaults })

  useEffect(() => {
    if (open) {
      reset({ ...defaults, planId: plans[0]?.id ?? "" })
      setFormError(null)
      setCreated(null)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, reset, plans])

  const status = watch("status")

  async function onSubmit(values: z.output<typeof createSchema>) {
    setFormError(null)
    try {
      const res = await api.post<CreatedTenant>("/superadmin/tenants", values)
      setCreated(res)
      toast.success(`${res.organization.name} added`)
    } catch (err) {
      setFormError(applyServerErrors(err, setError))
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !isSubmitting && onOpenChange(o)}>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{created ? "Organization added" : "Add a tenant"}</DialogTitle>
          <DialogDescription>
            {created
              ? `${created.admin.name} can now log in with the email and temporary password below.`
              : "Create an organization and its first admin by hand (for example after an offline payment). No email is sent."}
          </DialogDescription>
        </DialogHeader>

        {created ? (
          <div className="space-y-4">
            <div className="rounded-xl border border-[#e9e4ff] bg-[#faf8ff] p-4 text-sm">
              <p className="font-semibold text-[#0f172a]">{created.organization.name}</p>
              <p className="text-[#64748b]">Admin: {created.admin.email}</p>
            </div>
            <OneTimeSecret label="Temporary password" value={created.temporaryPassword} />
          </div>
        ) : (
          <form id="create-tenant" onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
            {formError && <FormError message={formError} />}
            <TextField label="Organization name" required autoFocus placeholder="e.g. FAST Islamabad Computing Society" error={errors.orgName?.message} {...register("orgName")} />
            <div className="grid gap-4 sm:grid-cols-2">
              <TextField label="Organization email" type="email" placeholder="Same as the admin's if empty" error={errors.orgEmail?.message} {...register("orgEmail")} />
              <TextField label="Phone" placeholder="+92 300 1234567" error={errors.phone?.message} {...register("phone")} />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <TextField label="Admin's full name" required error={errors.adminName?.message} {...register("adminName")} />
              <TextField label="Admin's email" type="email" required error={errors.adminEmail?.message} {...register("adminEmail")} />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <SelectField
                label="Plan"
                required
                options={plans.map((p) => ({ value: p.id, label: `${p.name} · ${formatMoney(p.price)}/yr${p.isVisible ? "" : " (hidden)"}` }))}
                error={errors.planId?.message}
                {...register("planId")}
              />
              <SelectField
                label="Start as"
                options={[
                  { value: "trial", label: "Free trial" },
                  { value: "active", label: "Paid (active)" },
                ]}
                {...register("status", {
                  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => setValue("days", e.target.value === "active" ? "365" : "1"),
                })}
              />
            </div>
            <TextField
              label={status === "active" ? "Paid for (days)" : "Trial length (days)"}
              type="number"
              min={1}
              required
              helper={status === "active" ? "365 = one year" : "The platform default trial is set in System settings"}
              error={errors.days?.message}
              {...register("days")}
            />
          </form>
        )}

        <DialogFooter>
          {created ? (
            <>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Close
              </Button>
              <Button
                onClick={() => {
                  onOpenChange(false)
                  onCreated(created.organization.id)
                }}
              >
                <Building2 /> Open organization
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button type="submit" form="create-tenant" disabled={isSubmitting || plans.length === 0}>
                {isSubmitting && <Loader2 className="animate-spin" />} Add tenant
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ─────────────────────────── Change plan ───────────────────────────

export function ChangePlanDialog({
  tenant,
  plans,
  onOpenChange,
  onDone,
}: {
  tenant: { id: string; name: string; plan: { id: string; name: string } | null } | null
  plans: PlanRow[]
  onOpenChange: (open: boolean) => void
  onDone: () => void
}) {
  const [planId, setPlanId] = useState("")
  const [saving, setSaving] = useState(false)
  useEffect(() => setPlanId(tenant?.plan?.id ?? plans[0]?.id ?? ""), [tenant, plans])

  async function save() {
    if (!tenant) return
    setSaving(true)
    try {
      await api.post(`/superadmin/tenants/${tenant.id}/plan`, { planId })
      toast.success(`${tenant.name} is now on ${plans.find((p) => p.id === planId)?.name}`)
      onOpenChange(false)
      onDone()
    } catch (err) {
      toast.error(errorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={tenant !== null} onOpenChange={(o) => !saving && onOpenChange(o)}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Change plan</DialogTitle>
          <DialogDescription>
            {tenant?.name} is on <strong>{tenant?.plan?.name ?? "no plan"}</strong>. The end date doesn't change. Use "Extend" for that.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2" role="radiogroup" aria-label="Plan">
          {plans.map((p) => (
            <label
              key={p.id}
              className={cn(
                "flex cursor-pointer items-center justify-between gap-3 rounded-xl border p-3 transition-colors",
                planId === p.id ? "border-[#7c3aed] bg-[#faf8ff] ring-1 ring-[#7c3aed]" : "border-[#e9e4ff] hover:border-[#c4b5fd]"
              )}
            >
              <span className="flex items-center gap-3">
                <input type="radio" name="plan" checked={planId === p.id} onChange={() => setPlanId(p.id)} className="accent-[#7c3aed]" />
                <span>
                  <span className="block text-sm font-medium text-[#0f172a]">
                    {p.name} {!p.isVisible && <span className="text-xs text-[#94a3b8]">(hidden)</span>}
                  </span>
                  <span className="block text-xs text-[#64748b]">
                    {p.maxAdmins ?? "Unlimited"} admins · {p.maxManagers ?? "unlimited"} managers
                  </span>
                </span>
              </span>
              <span className="text-sm font-semibold text-[#0f172a]">{formatMoney(p.price)}</span>
            </label>
          ))}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={() => void save()} disabled={saving || !planId || planId === tenant?.plan?.id}>
            {saving && <Loader2 className="animate-spin" />} Change plan
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ─────────────────────────── Extend ───────────────────────────

const PRESETS = [7, 30, 90, 365]

export function ExtendDialog({
  tenant,
  onOpenChange,
  onDone,
}: {
  tenant: { id: string; name: string; status: string; subscriptionEndsAt: string } | null
  onOpenChange: (open: boolean) => void
  onDone: () => void
}) {
  const [days, setDays] = useState("7")
  const [mode, setMode] = useState<"days" | "date">("days")
  const [until, setUntil] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (tenant) {
      setDays(tenant.status === "trial" ? "7" : "30")
      setMode("days")
      setUntil("")
      setError(null)
    }
  }, [tenant])

  const currentEnd = tenant ? new Date(tenant.subscriptionEndsAt).getTime() : Date.now()
  const base = Math.max(Date.now(), currentEnd)
  const n = Number(days)
  const preview = mode === "days" ? (Number.isInteger(n) && n > 0 ? new Date(base + n * DAY) : null) : until ? new Date(`${until}T23:59:59`) : null

  async function save() {
    if (!tenant) return
    setError(null)
    setSaving(true)
    try {
      await api.post(`/superadmin/tenants/${tenant.id}/extend`, mode === "days" ? { days: n } : { until })
      toast.success(`${tenant.name} now runs until ${formatDate(preview)}`)
      onOpenChange(false)
      onDone()
    } catch (err) {
      setError(errorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={tenant !== null} onOpenChange={(o) => !saving && onOpenChange(o)}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{tenant?.status === "trial" ? "Extend trial" : "Extend plan"}</DialogTitle>
          <DialogDescription>
            {tenant?.name} currently {currentEnd < Date.now() ? "ended" : "ends"} on <strong>{formatDate(tenant?.subscriptionEndsAt)}</strong>. Days are added to
            the later of today and that date.
          </DialogDescription>
        </DialogHeader>
        {error && <FormError message={error} />}
        <div className="flex gap-1 rounded-lg bg-[#f5f3ff] p-1" role="tablist">
          {(["days", "date"] as const).map((m) => (
            <button
              key={m}
              type="button"
              role="tab"
              aria-selected={mode === m}
              onClick={() => setMode(m)}
              className={cn("flex-1 rounded-md px-3 py-1.5 text-sm font-medium", mode === m ? "bg-white text-[#7c3aed] shadow-sm" : "text-[#64748b]")}
            >
              {m === "days" ? "Add days" : "Pick an end date"}
            </button>
          ))}
        </div>
        {mode === "days" ? (
          <div className="space-y-3">
            <div className="flex flex-wrap gap-2">
              {PRESETS.map((p) => (
                <Button key={p} type="button" size="sm" variant={days === String(p) ? "secondary" : "outline"} onClick={() => setDays(String(p))}>
                  +{p} days
                </Button>
              ))}
            </div>
            <TextField label="Days to add" type="number" min={1} max={3650} value={days} onChange={(e) => setDays(e.target.value)} />
          </div>
        ) : (
          <TextField label="New end date" type="date" value={until} min={new Date().toISOString().slice(0, 10)} onChange={(e) => setUntil(e.target.value)} />
        )}
        <p className="text-sm text-[#475569]">
          New end date: <strong>{preview ? formatDate(preview) : "—"}</strong>
          {tenant?.status === "expired" && " · the organization will be unlocked."}
        </p>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={() => void save()} disabled={saving || !preview}>
            {saving ? <Loader2 className="animate-spin" /> : <CalendarPlus />} Extend
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ─────────────────────────── Suspend ───────────────────────────

export function SuspendDialog({
  tenant,
  onOpenChange,
  onDone,
}: {
  tenant: { id: string; name: string } | null
  onOpenChange: (open: boolean) => void
  onDone: () => void
}) {
  const [reason, setReason] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  useEffect(() => {
    setReason("")
    setError(null)
  }, [tenant])

  async function save() {
    if (!tenant) return
    if (reason.trim().length < 3) {
      setError("Tell the organization why (they'll see this)")
      return
    }
    setSaving(true)
    try {
      await api.post(`/superadmin/tenants/${tenant.id}/suspend`, { reason: reason.trim() })
      toast.success(`${tenant.name} suspended`)
      onOpenChange(false)
      onDone()
    } catch (err) {
      setError(errorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={tenant !== null} onOpenChange={(o) => !saving && onOpenChange(o)}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Suspend {tenant?.name}?</DialogTitle>
          <DialogDescription>Everyone in this organization is locked out until you reactivate it. Nothing is deleted.</DialogDescription>
        </DialogHeader>
        <TextareaField
          label="Reason"
          required
          rows={3}
          placeholder="e.g. Payment reference could not be verified"
          value={reason}
          onChange={(e) => {
            setReason(e.target.value)
            setError(null)
          }}
          error={error ?? undefined}
        />
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={() => void save()} disabled={saving}>
            {saving ? <Loader2 className="animate-spin" /> : <Ban />} Suspend
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ─────────────────────────── Delete ───────────────────────────

export function DeleteTenantDialog({
  tenant,
  onOpenChange,
  onDone,
}: {
  tenant: { id: string; name: string } | null
  onOpenChange: (open: boolean) => void
  onDone: () => void
}) {
  const [typed, setTyped] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  useEffect(() => {
    setTyped("")
    setError(null)
  }, [tenant])

  async function remove() {
    if (!tenant) return
    setSaving(true)
    try {
      await api.delete(`/superadmin/tenants/${tenant.id}`, { body: { confirm: typed.trim() } })
      toast.success(`${tenant.name} was deleted`)
      onOpenChange(false)
      onDone()
    } catch (err) {
      setError(errorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={tenant !== null} onOpenChange={(o) => !saving && onOpenChange(o)}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Delete {tenant?.name} permanently?</DialogTitle>
          <DialogDescription>
            This removes the organization, its team, events, registrations, certificates, payments and uploaded files. <strong>It can't be undone.</strong>{" "}
            Suspending is usually the better choice.
          </DialogDescription>
        </DialogHeader>
        <TextField
          label={`Type "${tenant?.name ?? ""}" to confirm`}
          value={typed}
          autoComplete="off"
          onChange={(e) => {
            setTyped(e.target.value)
            setError(null)
          }}
          error={error ?? undefined}
        />
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={() => void remove()} disabled={saving || typed.trim() !== tenant?.name}>
            {saving ? <Loader2 className="animate-spin" /> : <Trash2 />} Delete forever
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
