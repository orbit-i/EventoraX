import type { ReactNode } from "react"
import type { LucideIcon } from "lucide-react"
import { AlertCircle, Inbox, RotateCw, SearchX } from "lucide-react"
import { Button } from "@/components/ui/button"

/** "Nothing here yet" — with an optional call to action. */
export function EmptyState({
  icon: Icon = Inbox,
  title,
  description,
  action,
  compact,
}: {
  icon?: LucideIcon
  title: string
  description?: ReactNode
  action?: ReactNode
  compact?: boolean
}) {
  return (
    <div
      className={`flex flex-col items-center justify-center rounded-2xl border border-dashed border-[#e2dcff] bg-white text-center ${
        compact ? "px-6 py-10" : "px-6 py-16"
      }`}
    >
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#f5f3ff] text-[#7c3aed]">
        <Icon className="h-6 w-6" />
      </div>
      <h3 className="text-base font-semibold text-[#0f172a]">{title}</h3>
      {description && <p className="mt-1 max-w-sm text-sm text-[#64748b]">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  )
}

/** Filters matched nothing — offers to clear them. */
export function NoResults({ onClear }: { onClear?: () => void }) {
  return (
    <EmptyState
      icon={SearchX}
      title="No results match your filters"
      description="Try a different search term or clear the filters."
      action={
        onClear && (
          <Button variant="outline" size="sm" onClick={onClear}>
            Clear filters
          </Button>
        )
      }
      compact
    />
  )
}

/** Loading failed — explains and offers Retry. */
export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-rose-200 bg-rose-50/50 px-6 py-12 text-center">
      <AlertCircle className="mb-3 h-8 w-8 text-rose-500" />
      <h3 className="text-base font-semibold text-[#0f172a]">Something went wrong</h3>
      <p className="mt-1 max-w-sm text-sm text-[#64748b]">{message}</p>
      {onRetry && (
        <Button variant="outline" size="sm" className="mt-5" onClick={onRetry}>
          <RotateCw className="h-4 w-4" /> Try again
        </Button>
      )}
    </div>
  )
}