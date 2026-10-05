import { cn } from "@/lib/utils"

export interface SegmentOption {
  value: string
  label: string
  count?: number
}

/** A row of tab-like buttons for the main filter of a page (e.g. All · Drafts · Upcoming …). */
export function SegmentedTabs({
  value,
  onChange,
  options,
  className,
}: {
  value: string
  onChange: (value: string) => void
  options: SegmentOption[]
  className?: string
}) {
  return (
    <div
      role="tablist"
      className={cn("mb-4 flex gap-1 overflow-x-auto rounded-2xl border border-[#e9e4ff] bg-white p-1", className)}
    >
      {options.map((o) => {
        const active = o.value === value
        return (
          <button
            key={o.value || "all"}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(o.value)}
            className={cn(
              "flex shrink-0 items-center gap-2 rounded-xl px-3.5 py-2 text-sm font-medium transition-colors",
              active ? "bg-[#7c3aed] text-white shadow-sm" : "text-[#64748b] hover:bg-[#f5f3ff] hover:text-[#7c3aed]"
            )}
          >
            {o.label}
            {o.count !== undefined && (
              <span
                className={cn(
                  "rounded-full px-1.5 py-0.5 text-[11px] tabular-nums",
                  active ? "bg-white/20 text-white" : "bg-[#f1f5f9] text-[#64748b]"
                )}
              >
                {o.count.toLocaleString()}
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}