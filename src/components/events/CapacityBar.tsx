import { cn } from "@/lib/utils"

/** "45 / 200 registered" with a bar that turns amber near capacity and red when full. */
export function CapacityBar({ registered, max, compact }: { registered: number; max: number | null; compact?: boolean }) {
  if (max === null || max === 0) {
    return (
      <p className="text-xs text-[#64748b]">
        <span className="font-semibold text-[#0f172a]">{registered.toLocaleString()}</span> registered · no limit
      </p>
    )
  }
  const pct = Math.min(100, Math.round((registered / max) * 100))
  const color = pct >= 100 ? "bg-rose-500" : pct >= 85 ? "bg-amber-500" : "bg-[#7c3aed]"
  return (
    <div className={cn("space-y-1", compact ? "min-w-[110px]" : "")}>
      <p className="text-xs text-[#64748b]">
        <span className="font-semibold text-[#0f172a]">{registered.toLocaleString()}</span> / {max.toLocaleString()}
        {pct >= 100 ? " · Full" : ""}
      </p>
      <div className="h-1.5 overflow-hidden rounded-full bg-[#ede9fe]">
        <div className={cn("h-full rounded-full transition-all", color)} style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}