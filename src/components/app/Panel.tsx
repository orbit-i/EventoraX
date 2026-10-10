import type { ReactNode } from "react"
import { Link } from "react-router"
import { ArrowRight } from "lucide-react"
import { cn } from "@/lib/utils"

/** White card with a title row — the building block of dashboard pages (Overview, Analytics, Contact). */
export function Panel({
  title,
  description,
  action,
  children,
  className,
}: {
  title: string
  description?: ReactNode
  action?: ReactNode
  children: ReactNode
  className?: string
}) {
  return (
    <section className={cn("rounded-2xl border border-[#e9e4ff] bg-white p-5 shadow-sm", className)}>
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-base font-semibold text-[#0f172a]">{title}</h2>
          {description && <p className="mt-0.5 text-sm text-[#64748b]">{description}</p>}
        </div>
        {action}
      </div>
      {children}
    </section>
  )
}

/** "See all →" link for a Panel's action slot. */
export function PanelLink({ to, children }: { to: string; children: ReactNode }) {
  return (
    <Link to={to} className="inline-flex shrink-0 items-center gap-1 text-sm font-medium text-[#7c3aed] hover:underline">
      {children} <ArrowRight className="h-3.5 w-3.5" />
    </Link>
  )
}
