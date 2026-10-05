import { ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

/** "Showing 21–40 of 132" · rows per page · previous / next. */
export function PaginationBar({
  page,
  limit,
  total,
  onPageChange,
  onLimitChange,
  limitOptions = [10, 20, 50, 100],
}: {
  page: number
  limit: number
  total: number
  onPageChange: (page: number) => void
  onLimitChange?: (limit: number) => void
  limitOptions?: number[]
}) {
  if (total === 0) return null
  const pages = Math.max(1, Math.ceil(total / limit))
  const from = (page - 1) * limit + 1
  const to = Math.min(total, page * limit)

  return (
    <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm text-[#64748b]">
      <p>
        Showing <span className="font-medium text-[#0f172a]">{from.toLocaleString()}</span>–
        <span className="font-medium text-[#0f172a]">{to.toLocaleString()}</span> of{" "}
        <span className="font-medium text-[#0f172a]">{total.toLocaleString()}</span>
      </p>
      <div className="flex items-center gap-3">
        {onLimitChange && (
          <div className="flex items-center gap-2">
            <span className="hidden sm:inline">Rows</span>
            <Select value={String(limit)} onValueChange={(v) => onLimitChange(Number(v))}>
              <SelectTrigger className="h-9 w-20 bg-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {limitOptions.map((n) => (
                  <SelectItem key={n} value={String(n)}>
                    {n}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
        <div className="flex items-center gap-1">
          <Button variant="outline" size="icon-sm" disabled={page <= 1} onClick={() => onPageChange(page - 1)} aria-label="Previous page">
            <ChevronLeft />
          </Button>
          <span className="min-w-[72px] text-center">
            Page {page} of {pages}
          </span>
          <Button variant="outline" size="icon-sm" disabled={page >= pages} onClick={() => onPageChange(page + 1)} aria-label="Next page">
            <ChevronRight />
          </Button>
        </div>
      </div>
    </div>
  )
}