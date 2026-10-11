import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { toast } from "sonner"
import { Check, Eye, EyeOff, Layers, Loader2, Pencil, Plus, Trash2, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Skeleton } from "@/components/ui/skeleton"
import { Switch } from "@/components/ui/switch"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { TextField, TextareaField } from "@/components/ui/form-fields"
import { PageHeader } from "@/components/app/PageHeader"
import { EmptyState, ErrorState } from "@/components/app/States"
import { useConfirm } from "@/components/app/ConfirmDialog"
import { applyServerErrors } from "@/components/app/form/serverErrors"
import { FormError } from "@/components/auth/AuthShell"
import { FEATURE_LABELS } from "@/components/billing/paymentInfo"
import { useApi } from "@/hooks/useApi"
import { api, errorMessage } from "@/lib/api"
import { formatMoney, plural } from "@/lib/format"
import type { PlanRow } from "@/types/superadmin"

const FEATURE_KEYS = Object.keys(FEATURE_LABELS)

// Empty limit field = unlimited
const limitField = z
  .string()
  .trim()
  .refine((v) => v === "" || (/^\d+$/.test(v) && Number(v) <= 10000), "A whole number, or leave empty for unlimited")

const schema = z.object({
  name: z.string().trim().min(2, "Give the plan a name").max(50),
  price: z.string().trim().refine((v) => /^\d+(\.\d{1,2})?$/.test(v), "Enter the yearly price in PKR, e.g. 20000"),
  maxAdmins: limitField,
  maxManagers: limitField,
  description: z.string().trim().max(300),
  sortOrder: z.string().trim().refine((v) => /^\d+$/.test(v), "A whole number"),
})
type Values = z.infer<typeof schema>

function PlanDialog({ plan, open, onOpenChange, onSaved }: { plan: PlanRow | null; open: boolean; onOpenChange: (o: boolean) => void; onSaved: () => void }) {
  const [features, setFeatures] = useState<Record<string, boolean>>({})
  const [visible, setVisible] = useState(true)
  const [formError, setFormError] = useState<string | null>(null)
  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<Values>({ resolver: zodResolver(schema) })

  useEffect(() => {
    if (!open) return
    reset({
      name: plan?.name ?? "",
      price: plan ? String(Number(plan.price)) : "",
      maxAdmins: plan?.maxAdmins == null ? "" : String(plan.maxAdmins),
      maxManagers: plan?.maxManagers == null ? "" : String(plan.maxManagers),
      description: plan?.description ?? "",
      sortOrder: String(plan?.sortOrder ?? 0),
    })
    setFeatures(Object.fromEntries(FEATURE_KEYS.map((k) => [k, plan ? plan.features?.[k] === true : true])))
    setVisible(plan?.isVisible ?? false)
    setFormError(null)
  }, [open, plan, reset])

  async function onSubmit(v: Values) {
    setFormError(null)
    const body = {
      name: v.name,
      price: Number(v.price),
      maxAdmins: v.maxAdmins === "" ? null : Number(v.maxAdmins),
      maxManagers: v.maxManagers === "" ? null : Number(v.maxManagers),
      description: v.description || null,
      sortOrder: Number(v.sortOrder),
      features,
      isVisible: visible,
    }
    try {
      if (plan) await api.patch(`/superadmin/plans/${plan.id}`, body)
      else await api.post("/superadmin/plans", body)
      toast.success(plan ? `${v.name} saved` : `${v.name} plan created`)
      onOpenChange(false)
      onSaved()
    } catch (err) {
      setFormError(applyServerErrors(err, setError))
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !isSubmitting && onOpenChange(o)}>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{plan ? `Edit ${plan.name}` : "New plan"}</DialogTitle>
          <DialogDescription>
            {plan && plan.tenantCount > 0
              ? `${plural(plan.tenantCount, "organization")} on this plan. A new price applies to their next payment; limits apply straight away to new invites.`
              : "Prices are per year, in PKR."}
          </DialogDescription>
        </DialogHeader>
        <form id="plan-form" onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
          {formError && <FormError message={formError} />}
          <div className="grid gap-4 sm:grid-cols-2">
            <TextField label="Name" required autoFocus error={errors.name?.message} {...register("name")} />
            <TextField label="Price per year (PKR)" required inputMode="decimal" placeholder="20000" error={errors.price?.message} {...register("price")} />
            <TextField label="Max admins" placeholder="Unlimited" helper="Leave empty for unlimited" error={errors.maxAdmins?.message} {...register("maxAdmins")} />
            <TextField label="Max managers" placeholder="Unlimited" helper="Leave empty for unlimited" error={errors.maxManagers?.message} {...register("maxManagers")} />
          </div>
          <TextareaField label="Short description" rows={2} placeholder="Shown on the pricing page, e.g. For university societies" error={errors.description?.message} {...register("description")} />
          <div>
            <p className="mb-2 text-sm font-semibold text-[#0f172a]">Features</p>
            <div className="grid gap-2 sm:grid-cols-2">
              {FEATURE_KEYS.map((k) => (
                <label key={k} className="flex cursor-pointer items-center gap-2.5 rounded-xl border border-[#e9e4ff] bg-[#faf8ff] px-3 py-2 text-sm text-[#334155]">
                  <Checkbox checked={features[k] === true} onCheckedChange={(c) => setFeatures((f) => ({ ...f, [k]: c === true }))} />
                  {FEATURE_LABELS[k]}
                </label>
              ))}
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="flex cursor-pointer items-center justify-between gap-3 rounded-xl border border-[#e9e4ff] bg-[#faf8ff] p-3">
              <span>
                <span className="block text-sm font-medium text-[#0f172a]">Show on pricing page</span>
                <span className="block text-xs text-[#64748b]">Hidden plans can still be given to tenants by you.</span>
              </span>
              <Switch checked={visible} onCheckedChange={setVisible} />
            </label>
            <TextField label="Order" helper="Lower numbers are shown first" inputMode="numeric" error={errors.sortOrder?.message} {...register("sortOrder")} />
          </div>
        </form>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" form="plan-form" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="animate-spin" />} {plan ? "Save plan" : "Create plan"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default function PlansPage() {
  const confirm = useConfirm()
  const { data, error, initialLoading, reload } = useApi<PlanRow[]>("/superadmin/plans")
  const [editing, setEditing] = useState<PlanRow | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const plans = data ?? []

  function openEditor(plan: PlanRow | null) {
    setEditing(plan)
    setDialogOpen(true)
  }

  async function setVisibility(plan: PlanRow, isVisible: boolean, quiet = false) {
    try {
      await api.patch(`/superadmin/plans/${plan.id}`, { isVisible })
      if (!quiet) {
        toast.success(isVisible ? `${plan.name} is shown on the pricing page` : `${plan.name} is hidden from the pricing page`, {
          action: { label: "Undo", onClick: () => void setVisibility(plan, !isVisible, true).then(reload) },
        })
      }
      reload()
    } catch (err) {
      toast.error(errorMessage(err))
    }
  }

  async function remove(plan: PlanRow) {
    const ok = await confirm({
      title: `Delete the ${plan.name} plan?`,
      description: "It disappears from the pricing page and from your plan lists. Past payments keep their amounts.",
      confirmLabel: "Delete plan",
      tone: "danger",
    })
    if (!ok) return
    try {
      await api.delete(`/superadmin/plans/${plan.id}`)
      toast.success(`${plan.name} deleted`)
      reload()
    } catch (err) {
      toast.error(errorMessage(err))
    }
  }

  return (
    <>
      <PageHeader
        title="Plans & pricing"
        description="What each plan costs and includes. Visible plans appear on the public pricing page and the Billing page."
        breadcrumbs={[{ label: "Superadmin", to: "/superadmin" }, { label: "Plans & pricing" }]}
        actions={
          <Button onClick={() => openEditor(null)}>
            <Plus /> New plan
          </Button>
        }
      />

      {error ? (
        <ErrorState message={error} onRetry={reload} />
      ) : initialLoading ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <Skeleton className="h-64 rounded-2xl" />
          <Skeleton className="h-64 rounded-2xl" />
        </div>
      ) : plans.length === 0 ? (
        <EmptyState icon={Layers} title="No plans yet" description="Create a plan so organizations can subscribe." action={<Button onClick={() => openEditor(null)}><Plus /> New plan</Button>} />
      ) : (
        <>
          <div className="mb-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {plans.map((p) => (
              <section key={p.id} className={cn("flex flex-col rounded-2xl border bg-white p-5 shadow-sm", p.isVisible ? "border-[#e9e4ff]" : "border-dashed border-slate-300")}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-semibold text-[#0f172a]">{p.name}</h2>
                    <p className="text-2xl font-bold text-[#0f172a]">
                      {formatMoney(p.price)}
                      <span className="text-sm font-normal text-[#64748b]"> / year</span>
                    </p>
                  </div>
                  <span className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium", p.isVisible ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600")}>
                    {p.isVisible ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />} {p.isVisible ? "Public" : "Hidden"}
                  </span>
                </div>
                {p.description && <p className="mt-1 text-sm text-[#64748b]">{p.description}</p>}
                <p className="mt-3 text-sm text-[#475569]">
                  {p.maxAdmins ?? "Unlimited"} admins · {p.maxManagers ?? "unlimited"} managers
                </p>
                <p className="text-sm font-medium text-[#7c3aed]">{plural(p.tenantCount, "organization")} on this plan</p>
                <div className="mt-auto flex flex-wrap items-center gap-2 pt-4">
                  <Button size="sm" variant="outline" onClick={() => openEditor(p)}>
                    <Pencil /> Edit
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => void setVisibility(p, !p.isVisible)}>
                    {p.isVisible ? <EyeOff /> : <Eye />} {p.isVisible ? "Hide" : "Show"}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="ml-auto text-rose-600 hover:bg-rose-50 hover:text-rose-700"
                    onClick={() => void remove(p)}
                    disabled={p.tenantCount > 0}
                    title={p.tenantCount > 0 ? "Move its organizations to another plan first (or hide it)" : undefined}
                  >
                    <Trash2 /> Delete
                  </Button>
                </div>
              </section>
            ))}
          </div>

          <section className="overflow-x-auto rounded-2xl border border-[#e9e4ff] bg-white shadow-sm">
            <table className="w-full text-sm">
              <caption className="px-5 pt-4 text-left text-base font-semibold text-[#0f172a]">Feature matrix</caption>
              <thead>
                <tr className="border-b border-[#f1f5f9] text-left text-xs uppercase tracking-wide text-[#64748b]">
                  <th className="px-5 py-3 font-semibold">Feature</th>
                  {plans.map((p) => (
                    <th key={p.id} className="px-4 py-3 text-center font-semibold">
                      {p.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {FEATURE_KEYS.map((k) => (
                  <tr key={k} className="border-b border-[#f8fafc] last:border-0">
                    <td className="px-5 py-2.5 text-[#334155]">{FEATURE_LABELS[k]}</td>
                    {plans.map((p) => (
                      <td key={p.id} className="px-4 py-2.5 text-center">
                        {p.features?.[k] === true ? <Check className="mx-auto h-4 w-4 text-emerald-600" aria-label="Included" /> : <X className="mx-auto h-4 w-4 text-slate-300" aria-label="Not included" />}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        </>
      )}

      <PlanDialog plan={editing} open={dialogOpen} onOpenChange={setDialogOpen} onSaved={reload} />
    </>
  )
}
