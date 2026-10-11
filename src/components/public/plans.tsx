import { Link } from "react-router"
import { Banknote, Check, Smartphone, Sparkles, Wallet, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { Skeleton } from "@/components/ui/skeleton"
import { FEATURE_LABELS } from "@/components/billing/paymentInfo"
import { usePlatform } from "@/context/PlatformContext"
import { useApi } from "@/hooks/useApi"
import { formatMoney, plural } from "@/lib/format"

/** GET /plans — the plans the superadmin shows on the pricing page */
export interface PublicPlan {
  id: string
  name: string
  price: string
  currency: string
  maxAdmins: number | null
  maxManagers: number | null
  description: string | null
  features: Record<string, boolean | number> | null
}

const FEATURE_KEYS = Object.keys(FEATURE_LABELS)

export function usePublicPlans() {
  const q = useApi<PublicPlan[]>("/plans")
  return { plans: q.data ?? [], loading: q.initialLoading, error: q.error }
}

/** "1-day" / "7-day" from System settings → Trial length. */
export function useTrialDays() {
  return usePlatform().platform?.trialDays ?? 1
}

/** The plan to highlight: "Pro" if there is one, else the first. */
function featuredId(plans: PublicPlan[]) {
  return (plans.find((p) => p.name.toLowerCase() === "pro") ?? plans[0])?.id
}

function seats(p: PublicPlan) {
  const admins = p.maxAdmins === null ? "Unlimited admins" : plural(p.maxAdmins, "admin")
  const managers = p.maxManagers === null ? "unlimited managers" : plural(p.maxManagers, "manager")
  return `${admins} · ${managers}`
}

export function PlanCards({ plans, loading, error }: { plans: PublicPlan[]; loading: boolean; error: string | null }) {
  const trialDays = useTrialDays()
  if (loading) {
    return (
      <div className="mx-auto grid max-w-4xl grid-cols-1 gap-6 md:grid-cols-2">
        <Skeleton className="h-[30rem] rounded-2xl" />
        <Skeleton className="h-[30rem] rounded-2xl" />
      </div>
    )
  }
  if (error || plans.length === 0) {
    return (
      <p className="mx-auto max-w-md rounded-2xl border border-[#e9e4ff] bg-white p-6 text-center font-body text-[#475569]">
        Prices couldn't be loaded right now. Please{" "}
        <Link to="/contact" className="font-semibold text-[#7c3aed] hover:underline">
          contact us
        </Link>{" "}
        for a quote.
      </p>
    )
  }
  const featured = featuredId(plans)
  return (
    <div className={cn("mx-auto grid grid-cols-1 gap-6 md:gap-8", plans.length === 1 ? "max-w-md" : plans.length === 2 ? "max-w-4xl md:grid-cols-2" : "max-w-6xl md:grid-cols-3")}>
      {plans.map((plan) => {
        const top = plan.id === featured
        return (
          <div
            key={plan.id}
            className={cn(
              "flex flex-col rounded-2xl bg-white p-8 text-left transition-all duration-300 hover:-translate-y-1 md:p-10",
              top ? "border-2 border-[#7c3aed] shadow-xl shadow-[#7c3aed]/10" : "border border-[#e9e4ff] hover:border-[#c4b5fd] hover:shadow-lg"
            )}
          >
            <div className="mb-4 flex flex-wrap gap-2">
              {top && (
                <span className="inline-flex items-center gap-1 rounded-full bg-[#7c3aed] px-3 py-1 text-xs font-semibold text-white">
                  <Sparkles size={12} /> Most popular
                </span>
              )}
              <span className="inline-flex rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">{trialDays}-day free trial</span>
            </div>
            <h3 className="mb-1 font-heading text-2xl font-bold text-[#0f172a]">{plan.name}</h3>
            {plan.description && <p className="font-body text-sm text-[#475569]">{plan.description}</p>}
            <div className="mb-2 mt-6 flex items-baseline">
              <span className="font-heading text-4xl font-bold text-[#0f172a] md:text-5xl">{formatMoney(plan.price)}</span>
              <span className="ml-1 font-body text-lg text-[#94a3b8]">/year</span>
            </div>
            <p className="mb-8 font-body text-sm text-[#64748b]">{seats(plan)} · unlimited events and attendees</p>
            <ul className="mb-8 space-y-3">
              {FEATURE_KEYS.map((key) => {
                const included = plan.features?.[key] === true
                return (
                  <li key={key} className="flex items-center gap-3">
                    <span className={cn("flex h-5 w-5 shrink-0 items-center justify-center rounded-full", included ? "bg-[#f5f3ff]" : "bg-gray-100")}>
                      {included ? <Check size={14} className="text-[#7c3aed]" /> : <X size={14} className="text-[#cbd5e1]" />}
                    </span>
                    <span className={cn("font-body text-sm", included ? "text-[#0f172a]" : "text-[#94a3b8]")}>{FEATURE_LABELS[key]}</span>
                  </li>
                )
              })}
            </ul>
            <Link
              to="/register"
              className={cn(
                "mt-auto block w-full rounded-xl py-3.5 text-center font-body font-semibold transition-all duration-200",
                top
                  ? "bg-[#7c3aed] text-white shadow-lg shadow-[#7c3aed]/25 hover:-translate-y-0.5 hover:bg-[#6d28d9]"
                  : "border-2 border-[#e9e4ff] bg-white text-[#0f172a] hover:border-[#c4b5fd] hover:bg-[#f5f3ff] hover:text-[#7c3aed]"
              )}
            >
              Start {trialDays}-day free trial
            </Link>
          </div>
        )
      })}
    </div>
  )
}

/** JazzCash / Easypaisa / bank transfer — the only ways to pay (no cards). */
export function PaymentBadges({ className }: { className?: string }) {
  const items = [
    { icon: Smartphone, label: "JazzCash" },
    { icon: Wallet, label: "Easypaisa" },
    { icon: Banknote, label: "Bank transfer" },
  ]
  return (
    <div className={cn("flex flex-wrap items-center justify-center gap-3", className)}>
      <span className="font-body text-sm text-[#64748b]">Pay with</span>
      {items.map((i) => (
        <span key={i.label} className="inline-flex items-center gap-1.5 rounded-full border border-[#e9e4ff] bg-white px-3 py-1.5 font-body text-sm font-medium text-[#0f172a]">
          <i.icon size={15} className="text-[#7c3aed]" /> {i.label}
        </span>
      ))}
    </div>
  )
}

/** Feature-by-feature table of every visible plan. */
export function PlanComparison({ plans }: { plans: PublicPlan[] }) {
  const featured = featuredId(plans)
  const rows: { label: string; value: (p: PublicPlan) => React.ReactNode }[] = [
    { label: "Price per year", value: (p) => formatMoney(p.price) },
    { label: "Admins", value: (p) => (p.maxAdmins === null ? "Unlimited" : p.maxAdmins) },
    { label: "Managers", value: (p) => (p.maxManagers === null ? "Unlimited" : p.maxManagers) },
    { label: "Viewers", value: () => "Unlimited" },
    { label: "Events and attendees", value: () => "Unlimited" },
    { label: "Certificate designs", value: () => "60" },
    { label: "ID card templates", value: () => "4" },
    ...FEATURE_KEYS.filter((k) => k !== "unlimitedEvents" && k !== "unlimitedAttendees").map((key) => ({
      label: FEATURE_LABELS[key]!,
      value: (p: PublicPlan) => (p.features?.[key] === true ? <Check size={18} className="mx-auto text-emerald-600" aria-label="Included" /> : <X size={18} className="mx-auto text-slate-300" aria-label="Not included" />),
    })),
  ]
  return (
    <div className="overflow-x-auto">
      <table className="mx-auto w-full max-w-4xl overflow-hidden rounded-2xl border border-[#e9e4ff] bg-white shadow-sm">
        <thead>
          <tr className="border-b-2 border-[#7c3aed] bg-[#f5f3ff]">
            <th className="px-6 py-4 text-left font-body text-sm font-semibold text-[#0f172a]">Feature</th>
            {plans.map((p) => (
              <th key={p.id} className={cn("px-6 py-4 text-center font-body text-sm font-semibold", p.id === featured ? "text-[#7c3aed]" : "text-[#0f172a]")}>
                {p.name}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.label} className="border-b border-[#e9e4ff] last:border-b-0 hover:bg-[#faf8ff]">
              <td className="px-6 py-3.5 font-body text-sm font-medium text-[#0f172a]">{r.label}</td>
              {plans.map((p) => (
                <td key={p.id} className="px-6 py-3.5 text-center font-body text-sm text-[#475569]">
                  {r.value(p)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
