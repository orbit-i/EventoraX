import type { ReactNode } from "react"
import { Skeleton } from "@/components/ui/skeleton"

/** Responsive grid of cards with a loading skeleton. */
export function CardGrid({ children, loading, skeletonCount = 6 }: { children: ReactNode; loading?: boolean; skeletonCount?: number }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {loading
        ? Array.from({ length: skeletonCount }, (_, i) => (
            <div key={i} className="space-y-3 rounded-2xl border border-[#e9e4ff] bg-white p-5">
              <div className="flex items-center gap-3">
                <Skeleton className="h-12 w-12 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </div>
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-2/3" />
            </div>
          ))
        : children}
    </div>
  )
}