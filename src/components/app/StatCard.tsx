import type { LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { Skeleton } from "@/components/ui/skeleton"

const ACCENTS = {
  purple: "bg-violet-50 text-violet-600",
  blue: "bg-blue-50 text-blue-600",
  green: "bg-emerald-50 text-emerald-600",
  amber: "bg-amber-50 text-amber-600",
  red: "bg-rose-50 text-rose-600",
  slate: "bg-slate-100 text-slate-600",
} as const

export type StatAccent = keyof typeof ACCENTS

export interface StatItem {
  label: string
  value: number | string | null | undefined
  icon: LucideIcon
  accent?: StatAccent
  /** Small line under the number, e.g. "of 200 seats" */
  hint?: string
}

export function StatCard({ label, value, icon: Icon, accent = "purple", hint, loading }: StatItem & { loading?: boolean }) {
  return (
    <div className="rounded-2xl border border-[#e9e4ff] bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 space-y-1">
          <p className="truncate text-xs font-medium uppercase tracking-wide text-[#64748b]">{label}</p>
          {loading ? (
            <Skeleton className="h-7 w-16" />
          ) : (
            <p className="text-2xl font-bold tabular-nums text-[#0f172a]">
              {typeof value === "number" ? value.toLocaleString() : value ?? "—"}
            </p>
          )}
          {hint && !loading && <p className="truncate text-xs text-[#94a3b8]">{hint}</p>}
        </div>
        <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-xl", ACCENTS[accent])}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  )
}

/** A row of 2–4 stat cards. Shows skeletons while loading. */
export function StatsRow({ items, loading }: { items: StatItem[]; loading?: boolean }) {
  return (
    <div
      className={cn(
        "mb-6 grid gap-4",
        items.length >= 4 ? "grid-cols-2 lg:grid-cols-4" : items.length === 3 ? "grid-cols-1 sm:grid-cols-3" : "grid-cols-2"
      )}
    >
      {items.map((item) => (
        <StatCard key={item.label} {...item} loading={loading} />
      ))}
    </div>
  )
}