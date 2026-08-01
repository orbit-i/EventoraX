import * as React from "react"
import { ChevronUp, ChevronDown, ChevronsUpDown, ChevronLeft, ChevronRight } from "lucide-react"

import { cn } from "@/lib/utils"
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"

export type DataTableColumn<T> = {
  key: keyof T
  header: string
  sortable?: boolean
  render?: (row: T) => React.ReactNode
}

type SortDirection = "asc" | "desc" | null

interface DataTableProps<T> {
  columns: DataTableColumn<T>[]
  data: T[]
  pageSize?: number
  className?: string
}

function DataTable<T extends Record<string, unknown>>({
  columns,
  data,
  pageSize = 5,
  className,
}: DataTableProps<T>) {
  const [sortKey, setSortKey] = React.useState<keyof T | null>(null)
  const [sortDirection, setSortDirection] = React.useState<SortDirection>(null)
  const [page, setPage] = React.useState(1)

  const handleSort = (key: keyof T) => {
    if (sortKey !== key) {
      setSortKey(key)
      setSortDirection("asc")
    } else if (sortDirection === "asc") {
      setSortDirection("desc")
    } else if (sortDirection === "desc") {
      setSortKey(null)
      setSortDirection(null)
    } else {
      setSortDirection("asc")
    }
    setPage(1)
  }

  const sortedData = React.useMemo(() => {
    if (!sortKey || !sortDirection) return data

    return [...data].sort((a, b) => {
      const aVal = a[sortKey]
      const bVal = b[sortKey]

      if (aVal == null) return 1
      if (bVal == null) return -1

      if (typeof aVal === "number" && typeof bVal === "number") {
        return sortDirection === "asc" ? aVal - bVal : bVal - aVal
      }

      const aStr = String(aVal).toLowerCase()
      const bStr = String(bVal).toLowerCase()
      return sortDirection === "asc"
        ? aStr.localeCompare(bStr)
        : bStr.localeCompare(aStr)
    })
  }, [data, sortKey, sortDirection])

  const totalPages = Math.max(1, Math.ceil(sortedData.length / pageSize))
  const currentPage = Math.min(page, totalPages)
  const paginatedData = sortedData.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  )

  const renderSortIcon = (col: DataTableColumn<T>) => {
    if (col.sortable === false) return null
    if (sortKey !== col.key) {
      return <ChevronsUpDown className="size-3.5 text-[#c4b5fd]" />
    }
    if (sortDirection === "asc") return <ChevronUp className="size-3.5" />
    if (sortDirection === "desc") return <ChevronDown className="size-3.5" />
    return <ChevronsUpDown className="size-3.5 text-[#c4b5fd]" />
  }

  return (
    <div className={cn("w-full space-y-4", className)}>
      <Table>
        <TableHeader>
          <TableRow>
            {columns.map((col) => (
              <TableHead
                key={String(col.key)}
                className={cn(
                  col.sortable !== false && "cursor-pointer select-none"
                )}
                onClick={() => col.sortable !== false && handleSort(col.key)}
              >
                <span className="inline-flex items-center gap-1">
                  {col.header}
                  {renderSortIcon(col)}
                </span>
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {paginatedData.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={columns.length}
                className="text-center text-[#94a3b8] py-8"
              >
                No data available
              </TableCell>
            </TableRow>
          ) : (
            paginatedData.map((row, i) => (
              <TableRow key={i}>
                {columns.map((col) => (
                  <TableCell key={String(col.key)}>
                    {col.render ? col.render(row) : String(row[col.key] ?? "")}
                  </TableCell>
                ))}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      {sortedData.length > pageSize && (
        <div className="flex items-center justify-between px-1">
          <p className="text-sm text-[#64748b]">
            Page {currentPage} of {totalPages}
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage === 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              <ChevronLeft className="size-4" />
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage === totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            >
              Next
              <ChevronRight className="size-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

export { DataTable }