import type { ReactNode } from "react"
import { X } from "lucide-react"
import { Button } from "@/components/ui/button"

/** Appears above a list when rows are selected. */
export function BulkActionBar({
  count,
  onClear,
  children,
}: {
  count: number
  onClear: () => void
  children: ReactNode
}) {
  if (count === 0) return null
  return (
    <div
      role="region"
      aria-label="Bulk actions"
      className="sticky top-2 z-20 mb-4 flex flex-wrap items-center gap-2 rounded-2xl border border-[#c4b5fd] bg-[#f5f3ff] px-4 py-2.5 shadow-md shadow-[#7c3aed]/10"
    >
      <span className="mr-2 text-sm font-semibold text-[#5b21b6]">{count.toLocaleString()} selected</span>
      <div className="flex flex-1 flex-wrap items-center gap-2">{children}</div>
      <Button variant="ghost" size="sm" onClick={onClear}>
        <X /> Clear
      </Button>
    </div>
  )
}