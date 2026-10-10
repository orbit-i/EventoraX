import { useState } from "react"
import { toast } from "sonner"
import { Check, Clock, CreditCard, ExternalLink, Loader2, Receipt, Sparkles, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { PageHeader } from "@/components/app/PageHeader"
import { Panel } from "@/components/app/Panel"
import { ServerTable, type Column } from "@/components/app/ServerTable"
import { PaginationBar } from "@/components/app/PaginationBar"
import { ErrorState } from "@/components/app/States"
import { StatusBadge } from "@/components/app/StatusBadge"
import { useConfirm } from "@/components/app/ConfirmDialog"
import { PayDialog } from "@/components/billing/PayDialog"
import { FEATURE_LABELS, METHOD_LABEL, PaymentAccountsList } from "@/components/billing/paymentInfo"
import { useAuth } from "@/context/AuthContext"
import { useApi } from "@/hooks/useApi"
import { useUrlState } from "@/hooks/useUrlState"
import { api, buildQuery, errorMessage } from "@/lib/api"
import { formatDate, formatPKR, formatRelative, formatTimeLeft } from "@/lib/format"
import type { BillingOverview, Payment } from "@/types/billing"

function seatsLine(max: number | null, role: string) {
  return max === null ? `Unlimited ${role}s` : `Up to ${max} ${role}${max === 1 ? "" : "s"}`
}

function CurrentPlan({ billing }: { billing: BillingOverview }) {
  const { status, subscriptionEndsAt, plan } = billing.organization
  const msLeft = new Date(subscriptionEndsAt).getTime() - Date.now()
  const expired = status === "expired" || msLeft <= 0
  const soon = !expired && msLeft < 14 * 24 * 60 * 60 * 1000

  return (
    <section
      className={cn(
        "mb-6 flex flex-wrap items-center gap-5 rounded-2xl border bg-white p-5 shadow-sm",
        expired ? "border-rose-200" : soon ? "border-amber-200" : "border-[#e9e4ff]"
      )}
    >
      <div className={cn("flex h-12 w-12 items-center justify-center rounded-2xl", expired ? "bg-rose-50 text-rose-600" : "bg-[#f5f3ff] text-[#7c3aed]")}>
        <CreditCard className="h-6 w-6" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="text-lg font-semibold text-[#0f172a]">{plan?.name ?? "No plan"}</h2>
          <StatusBadge kind="org" value={status} />
        </div>
        <p className={cn("text-sm", expired ? "font-medium text-rose-600" : soon ? "font-medium text-amber-700" : "text-[#64748b]")}>
          {expired
            ? `Expired on ${formatDate(subscriptionEndsAt)}. Renew to unlock events, registrations and everything else.`
            : status === "trial"
              ? `Free trial — ends ${formatDate(subscriptionEndsAt)} (${formatTimeLeft(msLeft)} left)`
              : `Paid until ${formatDate(subscriptionEndsAt)} (${formatTimeLeft(msLeft)} left)`}
        </p>
      </div>
      {plan && (
        <div className="text-right text-sm text-[#64748b]">
          <p className="font-semibold text-[#0f172a]">{formatPKR(plan.price)} / year</p>
          <p>
            {seatsLine(plan.maxAdmins, "admin")} · {seatsLine(plan.maxManagers, "manager")}
          </p>
        </div>
      )}
    </section>
  )
}

function PendingPayment({ payment, onCancelled }: { payment: Payment; onCancelled: () => void }) {
  const confirm = useConfirm()
  const [busy, setBusy] = useState(false)

  async function cancel() {
    const ok = await confirm({
      title: "Cancel this payment?",
      description: "Use this if you entered the wrong details. You can submit the payment again straight away. Any money you sent is not affected — contact support if you need a refund.",
      confirmLabel: "Cancel payment",
      cancelLabel: "Keep it",
      tone: "danger",
    })
    if (!ok) return
    setBusy(true)
    try {
      await api.delete(`/billing/payments/${payment.id}`)
      toast.success("Payment cancelled")
      onCancelled()
    } catch (err) {
      toast.error(errorMessage(err))
      setBusy(false)
    }
  }

  return (
    <section className="mb-6 rounded-2xl border border-amber-200 bg-amber-50/60 p-5">
      <div className="flex flex-wrap items-start gap-4">
        <Clock className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
        <div className="min-w-0 flex-1">
          <h2 className="font-semibold text-[#0f172a]">Payment waiting for confirmation</h2>
          <p className="text-sm text-[#64748b]">Submitted {formatRelative(payment.createdAt)}. We usually confirm within one working day and email you.</p>
          <dl className="mt-3 grid gap-x-6 gap-y-2 text-sm sm:grid-cols-4">
            <div>
              <dt className="text-xs text-[#94a3b8]">Plan</dt>
              <dd className="font-medium text-[#0f172a]">{payment.plan?.name ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-xs text-[#94a3b8]">Amount</dt>
              <dd className="font-medium text-[#0f172a]">{formatPKR(payment.amount)}</dd>
            </div>
            <div>
              <dt className="text-xs text-[#94a3b8]">Method</dt>
              <dd className="text-[#334155]">{METHOD_LABEL[payment.method]}</dd>
            </div>
            <div>
              <dt className="text-xs text-[#94a3b8]">Reference</dt>
              <dd className="font-mono text-[#334155]">{payment.referenceNo ?? "—"}</dd>
            </div>
          </dl>
        </div>
        <div className="flex gap-2">
          {payment.proofUrl && (
            <Button asChild variant="outline" size="sm">
              <a href={payment.proofUrl} target="_blank" rel="noopener noreferrer">
                <Receipt /> Receipt
              </a>
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={cancel} disabled={busy} className="text-rose-700 hover:bg-rose-50 hover:text-rose-800">
            {busy ? <Loader2 className="animate-spin" /> : <X />} Cancel
          </Button>
        </div>
      </div>
    </section>
  )
}

function PlanCards({ billing, onChoose }: { billing: BillingOverview; onChoose: (planId: string) => void }) {
  const currentId = billing.organization.plan?.id
  const paidCurrent = billing.organization.status === "active" || billing.organization.status === "expired"
  const blocked = Boolean(billing.pendingPayment)

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {billing.plans.map((plan) => {
        const features = (plan.features ?? {}) as Record<string, unknown>
        const isCurrent = plan.id === currentId
        const top = plan.sortOrder === Math.max(...billing.plans.map((p) => p.sortOrder))
        return (
          <div
            key={plan.id}
            className={cn("relative flex flex-col rounded-2xl border bg-white p-5 shadow-sm", isCurrent ? "border-[#7c3aed] ring-1 ring-[#7c3aed]" : "border-[#e9e4ff]")}
          >
            {isCurrent && <span className="absolute -top-2.5 left-5 rounded-full bg-[#7c3aed] px-2.5 py-0.5 text-[11px] font-semibold text-white">Current plan</span>}
            <div className="flex items-baseline justify-between gap-3">
              <h3 className="flex items-center gap-1.5 text-lg font-semibold text-[#0f172a]">
                {plan.name} {top && <Sparkles className="h-4 w-4 text-amber-500" />}
              </h3>
              <p>
                <span className="text-2xl font-bold text-[#0f172a]">{formatPKR(plan.price)}</span>
                <span className="text-sm text-[#64748b]"> / year</span>
              </p>
            </div>
            <p className="mt-1 text-sm text-[#64748b]">
              {seatsLine(plan.maxAdmins, "admin")} · {seatsLine(plan.maxManagers, "manager")} · unlimited viewers
            </p>
            <ul className="mt-4 flex-1 space-y-1.5 text-sm">
              {Object.entries(FEATURE_LABELS).map(([key, label]) => {
                const included = features[key] === true
                return (
                  <li key={key} className={cn("flex items-center gap-2", included ? "text-[#334155]" : "text-[#cbd5e1] line-through")}>
                    {included ? <Check className="h-4 w-4 text-emerald-600" /> : <X className="h-4 w-4" />}
                    {label}
                  </li>
                )
              })}
            </ul>
            <Button className="mt-5 w-full" variant={isCurrent ? "outline" : "default"} disabled={blocked} onClick={() => onChoose(plan.id)}>
              {isCurrent ? (paidCurrent ? "Renew for another year" : `Pay for ${plan.name}`) : `Switch to ${plan.name}`}
            </Button>
          </div>
        )
      })}
    </div>
  )
}

export default function BillingPage() {
  const { refresh } = useAuth()
  const overview = useApi<BillingOverview>("/billing")
  const { values, set } = useUrlState({ page: "1" })
  const page = Number(values.page) || 1
  const history = useApi<Payment[]>(`/billing/payments${buildQuery({ page, limit: 10 })}`)
  const [payPlanId, setPayPlanId] = useState<string | null>(null)

  function reloadAll() {
    overview.reload()
    history.reload()
    void refresh() // the sidebar plan card and banners read the organization from AuthContext
  }

  const billing = overview.data

  const columns: Column<Payment>[] = [
    { key: "date", header: "Date", cell: (p) => <span className="whitespace-nowrap text-[#334155]">{formatDate(p.createdAt)}</span> },
    { key: "plan", header: "Plan", cell: (p) => <span className="font-medium text-[#0f172a]">{p.plan?.name ?? "—"}</span> },
    { key: "amount", header: "Amount", align: "right", cell: (p) => <span className="tabular-nums">{formatPKR(p.amount)}</span> },
    { key: "method", header: "Method", hideBelow: "md", cell: (p) => METHOD_LABEL[p.method] },
    { key: "ref", header: "Reference", hideBelow: "lg", cell: (p) => <span className="font-mono text-xs text-[#64748b]">{p.referenceNo ?? "—"}</span> },
    {
      key: "period",
      header: "Covers",
      hideBelow: "lg",
      cell: (p) => (p.periodStart && p.periodEnd ? `${formatDate(p.periodStart)} – ${formatDate(p.periodEnd)}` : <span className="text-[#cbd5e1]">—</span>),
    },
    { key: "status", header: "Status", cell: (p) => <StatusBadge kind="payment" value={p.status} /> },
    {
      key: "receipt",
      header: <span className="sr-only">Receipt</span>,
      align: "right",
      cell: (p) =>
        p.proofUrl ? (
          <a href={p.proofUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-[#7c3aed] hover:underline">
            Receipt <ExternalLink className="h-3 w-3" />
          </a>
        ) : null,
    },
  ]

  return (
    <>
      <PageHeader
        title="Billing & plan"
        description="Your subscription, how to pay, and your payment history. All prices are in PKR per year."
        breadcrumbs={[{ label: "Dashboard", to: "/dashboard" }, { label: "Billing" }]}
      />

      {overview.error ? (
        <ErrorState message={overview.error} onRetry={overview.reload} />
      ) : !billing ? (
        <div className="space-y-6">
          <Skeleton className="h-24 rounded-2xl" />
          <div className="grid gap-4 md:grid-cols-2">
            <Skeleton className="h-96 rounded-2xl" />
            <Skeleton className="h-96 rounded-2xl" />
          </div>
        </div>
      ) : (
        <>
          <CurrentPlan billing={billing} />
          {billing.pendingPayment && <PendingPayment payment={billing.pendingPayment} onCancelled={reloadAll} />}

          <div className="grid gap-6 xl:grid-cols-3">
            <div className="xl:col-span-2">
              <h2 className="mb-3 text-base font-semibold text-[#0f172a]">Plans</h2>
              {billing.pendingPayment && (
                <p className="mb-3 text-sm text-[#64748b]">You can choose a plan again once the pending payment is confirmed or cancelled.</p>
              )}
              <PlanCards billing={billing} onChoose={setPayPlanId} />
            </div>
            <Panel title="How to pay" description="Pay by JazzCash, Easypaisa or bank transfer, then submit the transaction ID here.">
              <PaymentAccountsList accounts={billing.paymentAccounts} support={billing.support} />
              <ol className="mt-4 list-decimal space-y-1 pl-5 text-sm text-[#64748b]">
                <li>Choose a plan and send the exact amount.</li>
                <li>Submit the transaction ID with a receipt screenshot.</li>
                <li>We confirm within one working day and your plan is extended by a year.</li>
              </ol>
            </Panel>
          </div>

          <section className="mt-8">
            <h2 className="mb-3 text-base font-semibold text-[#0f172a]">Payment history</h2>
            {history.error ? (
              <ErrorState message={history.error} onRetry={history.reload} />
            ) : !history.loading && (history.data ?? []).length === 0 ? (
              <p className="rounded-2xl border border-dashed border-[#e2dcff] bg-white p-6 text-center text-sm text-[#94a3b8]">No payments yet.</p>
            ) : (
              <>
                <ServerTable columns={columns} rows={history.data ?? []} rowKey={(p) => p.id} loading={history.loading} skeletonRows={3} />
                {history.meta && <PaginationBar page={page} limit={10} total={history.meta.total} onPageChange={(p) => set({ page: String(p) })} />}
              </>
            )}
          </section>

          <PayDialog planId={payPlanId} billing={billing} onOpenChange={(open) => !open && setPayPlanId(null)} onSubmitted={reloadAll} />
        </>
      )}
    </>
  )
}
