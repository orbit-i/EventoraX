import { useEffect, useState, type ReactNode } from "react"
import { LayoutGrid, List, Search, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

/** Container for search + filters above a list. */
export function Toolbar({ children, end }: { children: ReactNode; end?: ReactNode }) {
  return (
    <div className="mb-4 flex flex-wrap items-center gap-3">
      <div className="flex flex-1 flex-wrap items-center gap-3">{children}</div>
      {end && <div className="flex items-center gap-2">{end}</div>}
    </div>
  )
}

/** Search box that waits until you stop typing (300 ms) before searching. */
export function SearchInput({
  value,
  onChange,
  placeholder = "Search…",
  className,
}: {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
}) {
  const [draft, setDraft] = useState(value)

  // Keep in sync when the value changes from outside (e.g. "Clear filters").
  useEffect(() => setDraft(value), [value])

  useEffect(() => {
    if (draft === value) return
    const timer = setTimeout(() => onChange(draft.trim()), 300)
    return () => clearTimeout(timer)
  }, [draft, value, onChange])

  return (
    <div className={cn("relative w-full sm:w-72", className)}>
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#94a3b8]" />
      <Input
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        placeholder={placeholder}
        className="h-10 bg-white pl-9 pr-9"
        aria-label={placeholder}
      />
      {draft && (
        <button
          type="button"
          onClick={() => {
            setDraft("")
            onChange("")
          }}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-md p-0.5 text-[#94a3b8] hover:text-[#475569]"
          aria-label="Clear search"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  )
}

const ALL = "__all__"

/** Dropdown filter. An empty value means "All". */
export function FilterSelect({
  value,
  onChange,
  options,
  allLabel,
  className,
}: {
  value: string
  onChange: (value: string) => void
  options: { value: string; label: string }[]
  allLabel: string
  className?: string
}) {
  return (
    <Select value={value || ALL} onValueChange={(v) => onChange(v === ALL ? "" : v)}>
      <SelectTrigger className={cn("h-10 w-full bg-white sm:w-44", className)}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={ALL}>{allLabel}</SelectItem>
        {options.map((o) => (
          <SelectItem key={o.value} value={o.value}>
            {o.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

export interface ActiveFilter {
  key: string
  label: string
  onRemove: () => void
}

/** Shows active filters as removable chips, plus "Clear all". */
export function FilterChips({ filters, onClearAll }: { filters: ActiveFilter[]; onClearAll: () => void }) {
  if (filters.length === 0) return null
  return (
    <div className="mb-4 flex flex-wrap items-center gap-2">
      {filters.map((f) => (
        <span
          key={f.key}
          className="inline-flex items-center gap-1 rounded-full border border-[#e9e4ff] bg-[#f5f3ff] py-1 pl-3 pr-1.5 text-xs font-medium text-[#6d28d9]"
        >
          {f.label}
          <button
            type="button"
            onClick={f.onRemove}
            className="rounded-full p-0.5 hover:bg-[#ede9fe]"
            aria-label={`Remove filter ${f.label}`}
          >
            <X className="h-3 w-3" />
          </button>
        </span>
      ))}
      <button type="button" onClick={onClearAll} className="text-xs font-medium text-[#64748b] hover:text-[#7c3aed] hover:underline">
        Clear all
      </button>
    </div>
  )
}

/** Switch between table and card views. */
export function ViewToggle({ value, onChange }: { value: "table" | "grid"; onChange: (v: "table" | "grid") => void }) {
  return (
    <div className="inline-flex rounded-xl border border-[#e2e8f0] bg-white p-1" role="group" aria-label="View">
      {(
        [
          { v: "table", icon: List, label: "Table view" },
          { v: "grid", icon: LayoutGrid, label: "Card view" },
        ] as const
      ).map(({ v, icon: Icon, label }) => (
        <button
          key={v}
          type="button"
          onClick={() => onChange(v)}
          aria-label={label}
          aria-pressed={value === v}
          className={cn(
            "rounded-lg p-1.5 transition-colors",
            value === v ? "bg-[#7c3aed] text-white" : "text-[#64748b] hover:text-[#7c3aed]"
          )}
        >
          <Icon className="h-4 w-4" />
        </button>
      ))}
    </div>
  )
}