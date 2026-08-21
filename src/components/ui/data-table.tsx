"use client"

import * as React from "react"
import {
  ArrowUp,
  ArrowDown,
  ChevronsUpDown,
  ChevronLeft,
  ChevronRight,
  Inbox,
} from "lucide-react"
import { cn } from "@/lib/utils"
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table"

// ─── Types ────────────────────────────────────────────────────────────────────

export type SortDirection = "asc" | "desc" | null

export interface ColumnDef<TData> {
  /** Unique key — must match a key of TData or be a custom string for render-only columns */
  key: string
  /** Column header label */
  label: string
  /** Whether this column is sortable. Defaults to false. */
  sortable?: boolean
  /** Optional custom cell renderer. Receives the full row object. */
  render?: (row: TData) => React.ReactNode
  /** Optional className applied to both <th> and <td> for this column */
  className?: string
  /** Set to true to hide this column on mobile (adds `hidden sm:table-cell`) */
  hideOnMobile?: boolean
}

export interface DataTableProps<TData> {
  /** Column definitions */
  columns: ColumnDef<TData>[]
  /** Row data */
  data: TData[]
  /** Key extractor — must return a unique stable string/number per row */
  rowKey: (row: TData) => string | number
  /** Show loading skeleton instead of data */
  loading?: boolean
  /** Number of skeleton rows to show while loading */
  skeletonRows?: number
  /** Available page-size options for the "Rows per page" selector */
  pageSizeOptions?: number[]
  /** Initial page size. Defaults to first item in pageSizeOptions. */
  defaultPageSize?: number
  /** Optional className for the outer wrapper */
  className?: string
  /** Optional slot rendered in the toolbar area (e.g. a search input or action button) */
  toolbar?: React.ReactNode
  /** Empty state title override */
  emptyTitle?: string
  /** Empty state description override */
  emptyDescription?: string
}

// ─── Sort icon helper ─────────────────────────────────────────────────────────

function SortIcon({ direction }: { direction: SortDirection }) {
  if (direction === "asc")
    return <ArrowUp className="w-3.5 h-3.5 text-[#7c3aed]" />
  if (direction === "desc")
    return <ArrowDown className="w-3.5 h-3.5 text-[#7c3aed]" />
  return <ChevronsUpDown className="w-3.5 h-3.5 text-[#c4b5fd] group-hover:text-[#a78bfa]" />
}

// ─── Skeleton row ─────────────────────────────────────────────────────────────

function SkeletonRow({ colCount }: { colCount: number }) {
  return (
    <TableRow className="animate-pulse border-b border-[#e9e4ff]">
      {Array.from({ length: colCount }).map((_, i) => (
        <TableCell key={i} className="py-3.5">
          <div
            className={cn(
              "h-4 rounded-lg bg-gradient-to-r from-[#f5f3ff] via-[#ede9fe] to-[#f5f3ff]",
              "bg-[length:200%_100%] animate-[shimmer_1.5s_infinite]",
              // vary widths for a more natural look
              i === 0 ? "w-32" : i % 3 === 0 ? "w-20" : "w-24"
            )}
          />
        </TableCell>
      ))}
    </TableRow>
  )
}

// ─── Empty state ──────────────────────────────────────────────────────────────

function EmptyState({
  title,
  description,
}: {
  title: string
  description: string
}) {
  return (
    <tr>
      <td colSpan={999}>
        <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
          {/* Icon container — neumorphic inset well */}
          <div
            className={cn(
              "w-16 h-16 rounded-2xl flex items-center justify-center mb-4",
              "bg-gradient-to-b from-[#f5f3ff] to-[#ede9fe]",
              "shadow-[inset_0_2px_4px_rgba(0,0,0,0.04),inset_0_1px_2px_rgba(0,0,0,0.02)]",
              "border border-[#e9e4ff]"
            )}
          >
            <Inbox className="w-7 h-7 text-[#c4b5fd]" />
          </div>
          <p className="font-heading text-base font-bold text-[#0f172a] mb-1">{title}</p>
          <p className="font-body text-sm text-[#94a3b8] max-w-xs">{description}</p>
        </div>
      </td>
    </tr>
  )
}

// ─── Rows-per-page selector ───────────────────────────────────────────────────

function PageSizeSelector({
  value,
  options,
  onChange,
}: {
  value: number
  options: number[]
  onChange: (n: number) => void
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="font-body text-xs text-[#64748b] whitespace-nowrap">Rows per page</span>
      <select
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className={cn(
          "h-8 rounded-xl border border-[#e9e4ff] px-2 pr-7 text-xs font-medium text-[#0f172a]",
          "bg-gradient-to-b from-white to-[#faf8ff]",
          "shadow-[inset_0_1px_3px_rgba(0,0,0,0.04)]",
          "appearance-none cursor-pointer outline-none",
          "focus:border-[#a855f7] focus:ring-2 focus:ring-[#a855f7]/30",
          "transition-all duration-200",
          // custom chevron via background image trick — use a simple SVG arrow
          "bg-[url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23a78bfa' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E\")] bg-no-repeat bg-[right_6px_center]"
        )}
      >
        {options.map((n) => (
          <option key={n} value={n}>
            {n}
          </option>
        ))}
      </select>
    </div>
  )
}

// ─── Main DataTable component ─────────────────────────────────────────────────

export function DataTable<TData extends Record<string, unknown>>({
  columns,
  data,
  rowKey,
  loading = false,
  skeletonRows = 5,
  pageSizeOptions = [5, 10, 25, 50],
  defaultPageSize,
  className,
  toolbar,
  emptyTitle = "No data found",
  emptyDescription = "There are no records to display right now.",
}: DataTableProps<TData>) {
  // ── Sort state ──────────────────────────────────────────────────────────────
  const [sortKey, setSortKey] = React.useState<string | null>(null)
  const [sortDir, setSortDir] = React.useState<SortDirection>(null)

  const handleSort = (key: string) => {
    if (sortKey !== key) {
      setSortKey(key)
      setSortDir("asc")
    } else if (sortDir === "asc") {
      setSortDir("desc")
    } else if (sortDir === "desc") {
      setSortKey(null)
      setSortDir(null)
    }
  }

  // ── Sorting logic ───────────────────────────────────────────────────────────
  const sortedData = React.useMemo(() => {
    if (!sortKey || !sortDir) return data
    return [...data].sort((a, b) => {
      const aVal = a[sortKey]
      const bVal = b[sortKey]
      // Numeric sort
      if (typeof aVal === "number" && typeof bVal === "number") {
        return sortDir === "asc" ? aVal - bVal : bVal - aVal
      }
      // String sort
      const aStr = String(aVal ?? "").toLowerCase()
      const bStr = String(bVal ?? "").toLowerCase()
      if (aStr < bStr) return sortDir === "asc" ? -1 : 1
      if (aStr > bStr) return sortDir === "asc" ? 1 : -1
      return 0
    })
  }, [data, sortKey, sortDir])

  // ── Pagination state ────────────────────────────────────────────────────────
  const initialPageSize = defaultPageSize ?? pageSizeOptions[0]
  const [pageSize, setPageSize] = React.useState(initialPageSize)
  const [currentPage, setCurrentPage] = React.useState(1)

  // Reset to page 1 whenever sort or page size changes
  React.useEffect(() => { setCurrentPage(1) }, [sortKey, sortDir, pageSize])

  const totalRows = sortedData.length
  const totalPages = Math.max(1, Math.ceil(totalRows / pageSize))
  const safePage = Math.min(currentPage, totalPages)

  const pagedData = React.useMemo(() => {
    const start = (safePage - 1) * pageSize
    return sortedData.slice(start, start + pageSize)
  }, [sortedData, safePage, pageSize])

  // ── Page number buttons (max 5 shown with ellipsis) ─────────────────────────
  const pageNumbers = React.useMemo(() => {
    if (totalPages <= 5) return Array.from({ length: totalPages }, (_, i) => i + 1)
    if (safePage <= 3) return [1, 2, 3, 4, null, totalPages]
    if (safePage >= totalPages - 2) return [1, null, totalPages - 3, totalPages - 2, totalPages - 1, totalPages]
    return [1, null, safePage - 1, safePage, safePage + 1, null, totalPages]
  }, [totalPages, safePage])

  // ── Range label ─────────────────────────────────────────────────────────────
  const rangeStart = totalRows === 0 ? 0 : (safePage - 1) * pageSize + 1
  const rangeEnd = Math.min(safePage * pageSize, totalRows)

  return (
    <div className={cn("flex flex-col gap-0 rounded-2xl border border-[#e9e4ff] shadow-sm overflow-hidden", className)}>

      {/* ── Toolbar ──────────────────────────────────────────────────────────── */}
      {toolbar && (
        <div className="flex items-center justify-between px-4 py-3 bg-white border-b border-[#e9e4ff]">
          {toolbar}
        </div>
      )}

      {/* ── Scrollable table area ─────────────────────────────────────────────── */}
      <div className="overflow-x-auto">
        <table className="w-full caption-bottom text-sm">

          {/* Sticky header */}
          <thead className="sticky top-0 z-10 bg-[#f5f3ff] border-b-2 border-[#e9e4ff]">
            <tr>
              {columns.map((col) => {
                const isActive = sortKey === col.key
                const isSortable = col.sortable ?? false

                return (
                  <th
                    key={col.key}
                    aria-sort={
                      isActive && sortDir === "asc"
                        ? "ascending"
                        : isActive && sortDir === "desc"
                        ? "descending"
                        : "none"
                    }
                    className={cn(
                      "h-11 px-4 text-left align-middle",
                      "font-semibold text-xs uppercase tracking-wider whitespace-nowrap",
                      // Active column gets stronger purple, inactive gets muted purple
                      isActive ? "text-[#7c3aed]" : "text-[#a78bfa]",
                      isSortable && "cursor-pointer select-none",
                      col.hideOnMobile && "hidden sm:table-cell",
                      col.className
                    )}
                    onClick={isSortable ? () => handleSort(col.key) : undefined}
                  >
                    {isSortable ? (
                      <span className="group inline-flex items-center gap-1.5">
                        {col.label}
                        <SortIcon direction={isActive ? sortDir : null} />
                      </span>
                    ) : (
                      col.label
                    )}
                  </th>
                )
              })}
            </tr>
          </thead>

          <tbody className="bg-white divide-y divide-[#e9e4ff] [&>tr:last-child]:border-0">
            {/* Loading skeleton */}
            {loading && (
              Array.from({ length: skeletonRows }).map((_, i) => (
                <SkeletonRow key={i} colCount={columns.length} />
              ))
            )}

            {/* Empty state */}
            {!loading && pagedData.length === 0 && (
              <EmptyState title={emptyTitle} description={emptyDescription} />
            )}

            {/* Data rows */}
            {!loading && pagedData.map((row, rowIdx) => (
              <tr
                key={rowKey(row)}
                className={cn(
                  "group transition-colors duration-150",
                  // Zebra stripe — even rows get very subtle lavender tint
                  rowIdx % 2 === 1 ? "bg-[#faf8ff]" : "bg-white",
                  // Row hover — overrides stripe + adds left accent via box-shadow trick
                  "hover:bg-[#f5f3ff]",
                  // Left border accent on hover via a pseudo-element-like approach
                  "relative"
                )}
              >
                {columns.map((col) => (
                  <td
                    key={col.key}
                    className={cn(
                      "px-4 py-3.5 align-middle text-[#0f172a]",
                      // Left accent bar on the first cell of each hovered row
                      col === columns[0] && [
                        "border-l-2 border-transparent",
                        "group-hover:border-[#a78bfa]",
                        "transition-colors duration-150",
                      ],
                      col.hideOnMobile && "hidden sm:table-cell",
                      col.className
                    )}
                  >
                    {col.render
                      ? col.render(row)
                      : String(row[col.key] ?? "—")}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ── Pagination footer ─────────────────────────────────────────────────── */}
      <div
        className={cn(
          "flex flex-wrap items-center justify-between gap-3",
          "px-4 py-3 bg-white border-t border-[#e9e4ff]",
          "text-xs font-body"
        )}
      >
        {/* Left — rows per page + range label */}
        <div className="flex items-center gap-4">
          <PageSizeSelector
            value={pageSize}
            options={pageSizeOptions}
            onChange={(n) => { setPageSize(n); setCurrentPage(1) }}
          />
          <span className="text-[#94a3b8] hidden sm:inline">
            {totalRows === 0
              ? "No results"
              : `${rangeStart}–${rangeEnd} of ${totalRows}`}
          </span>
        </div>

        {/* Right — page controls */}
        <div className="flex items-center gap-1">
          {/* Previous */}
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={safePage === 1}
            aria-label="Previous page"
            className={cn(
              "inline-flex items-center gap-1 h-8 px-2.5 rounded-xl text-xs font-medium",
              "border border-[#e9e4ff] bg-white text-[#64748b]",
              "transition-all duration-200",
              "hover:bg-[#f5f3ff] hover:text-[#7c3aed] hover:border-[#c4b5fd]",
              "disabled:opacity-40 disabled:pointer-events-none"
            )}
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Prev</span>
          </button>

          {/* Page number pills */}
          {pageNumbers.map((page, i) =>
            page === null ? (
              <span key={`ellipsis-${i}`} className="px-1 text-[#c4b5fd] select-none">
                …
              </span>
            ) : (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                aria-current={page === safePage ? "page" : undefined}
                className={cn(
                  "h-8 w-8 rounded-xl text-xs font-semibold",
                  "transition-all duration-200",
                  page === safePage
                    ? [
                        "bg-gradient-to-b from-[#f0e9ff] to-[#ede9fe]",
                        "text-[#7c3aed] border border-[#c4b5fd]",
                        "shadow-[inset_0_1px_3px_rgba(124,58,237,0.08)]",
                      ]
                    : [
                        "text-[#64748b] border border-transparent",
                        "hover:bg-[#f5f3ff] hover:text-[#7c3aed] hover:border-[#e9e4ff]",
                      ]
                )}
              >
                {page}
              </button>
            )
          )}

          {/* Next */}
          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={safePage === totalPages}
            aria-label="Next page"
            className={cn(
              "inline-flex items-center gap-1 h-8 px-2.5 rounded-xl text-xs font-medium",
              "border border-[#e9e4ff] bg-white text-[#64748b]",
              "transition-all duration-200",
              "hover:bg-[#f5f3ff] hover:text-[#7c3aed] hover:border-[#c4b5fd]",
              "disabled:opacity-40 disabled:pointer-events-none"
            )}
          >
            <span className="hidden sm:inline">Next</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  )
}
