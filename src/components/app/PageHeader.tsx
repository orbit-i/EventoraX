import type { ReactNode } from "react"
import { Link } from "react-router"
import { ChevronRight } from "lucide-react"

export interface Crumb {
  label: string
  to?: string
}

/** Title area used at the top of every dashboard page. */
export function PageHeader({
  title,
  description,
  breadcrumbs,
  actions,
  badge,
}: {
  title: ReactNode
  description?: ReactNode
  breadcrumbs?: Crumb[]
  actions?: ReactNode
  badge?: ReactNode
}) {
  return (
    <div className="mb-6 space-y-2">
      {breadcrumbs && breadcrumbs.length > 0 && (
        <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-1 text-xs text-[#64748b]">
          {breadcrumbs.map((crumb, i) => (
            <span key={`${crumb.label}-${i}`} className="flex items-center gap-1">
              {i > 0 && <ChevronRight className="h-3 w-3 text-[#cbd5e1]" />}
              {crumb.to ? (
                <Link to={crumb.to} className="hover:text-[#7c3aed] hover:underline">
                  {crumb.label}
                </Link>
              ) : (
                <span className="font-medium text-[#334155]">{crumb.label}</span>
              )}
            </span>
          ))}
        </nav>
      )}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0 space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-[#0f172a]">{title}</h1>
            {badge}
          </div>
          {description && <p className="text-sm text-[#64748b]">{description}</p>}
        </div>
        {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
      </div>
    </div>
  )
}