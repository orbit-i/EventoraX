import type { ReactNode } from "react"
import { cn } from "@/lib/utils"
import { Checkbox } from "@/components/ui/checkbox"
import { Skeleton } from "@/components/ui/skeleton"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

export interface Column<T> {
  key: string
  header: ReactNode
  cell: (row: T) => ReactNode
  /** Hide on small screens */
  hideBelow?: "sm" | "md" | "lg"
  align?: "left" | "right" | "center"
  className?: string
}

const HIDE: Record<NonNullable<Column<unknown>["hideBelow"]>, string> = {
  sm: "hidden sm:table-cell",
  md: "hidden md:table-cell",
  lg: "hidden lg:table-cell",
}

const ALIGN = { left: "text-left", right: "text-right", center: "text-center" } as const

/**
 * Table for data that is paginated by the server.
 * Optional row selection (for bulk actions) and row click (open details).
 */
export function ServerTable<T>({
  columns,
  rows,
  rowKey,
  loading,
  selectedIds,
  onToggleRow,
  onToggleAll,
  onRowClick,
  skeletonRows = 6,
}: {
  columns: Column<T>[]
  rows: T[]
  rowKey: (row: T) => string
  loading?: boolean
  selectedIds?: Set<string>
  onToggleRow?: (id: string) => void
  onToggleAll?: (checked: boolean) => void
  onRowClick?: (row: T) => void
  skeletonRows?: number
}) {
  const selectable = Boolean(selectedIds && onToggleRow)
  const allSelected = selectable && rows.length > 0 && rows.every((r) => selectedIds!.has(rowKey(r)))
  const someSelected = selectable && rows.some((r) => selectedIds!.has(rowKey(r)))

  return (
    <div className="overflow-hidden rounded-2xl border border-[#e9e4ff] bg-white shadow-sm">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-[#faf8ff] hover:bg-[#faf8ff]">
              {selectable && (
                <TableHead className="w-10">
                  <Checkbox
                    checked={allSelected ? true : someSelected ? "indeterminate" : false}
                    onCheckedChange={(checked) => onToggleAll?.(checked === true)}
                    aria-label="Select all on this page"
                  />
                </TableHead>
              )}
              {columns.map((col) => (
                <TableHead
                  key={col.key}
                  className={cn(
                    "text-xs font-semibold uppercase tracking-wide text-[#64748b]",
                    col.hideBelow && HIDE[col.hideBelow],
                    ALIGN[col.align ?? "left"],
                    col.className
                  )}
                >
                  {col.header}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading && rows.length === 0
              ? Array.from({ length: skeletonRows }, (_, i) => (
                  <TableRow key={`skeleton-${i}`}>
                    {selectable && (
                      <TableCell>
                        <Skeleton className="h-4 w-4" />
                      </TableCell>
                    )}
                    {columns.map((col) => (
                      <TableCell key={col.key} className={cn(col.hideBelow && HIDE[col.hideBelow])}>
                        <Skeleton className="h-4 w-full max-w-[160px]" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              : rows.map((row) => {
                  const id = rowKey(row)
                  const selected = selectedIds?.has(id) ?? false
                  return (
                    <TableRow
                      key={id}
                      data-state={selected ? "selected" : undefined}
                      onClick={onRowClick ? () => onRowClick(row) : undefined}
                      className={cn(
                        "transition-colors",
                        onRowClick && "cursor-pointer",
                        selected ? "bg-[#f5f3ff]" : "hover:bg-[#faf8ff]",
                        loading && "opacity-60"
                      )}
                    >
                      {selectable && (
                        <TableCell onClick={(e) => e.stopPropagation()}>
                          <Checkbox
                            checked={selected}
                            onCheckedChange={() => onToggleRow!(id)}
                            aria-label="Select row"
                          />
                        </TableCell>
                      )}
                      {columns.map((col) => (
                        <TableCell
                          key={col.key}
                          className={cn(col.hideBelow && HIDE[col.hideBelow], ALIGN[col.align ?? "left"], col.className)}
                        >
                          {col.cell(row)}
                        </TableCell>
                      ))}
                    </TableRow>
                  )
                })}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}