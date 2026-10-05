import type { LucideIcon } from "lucide-react"
import { MoreHorizontal } from "lucide-react"
import { Link } from "react-router"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export interface RowAction {
  label: string
  icon?: LucideIcon
  onClick?: () => void
  to?: string
  destructive?: boolean
  disabled?: boolean
  hidden?: boolean
  /** Draw a divider above this item */
  separatorBefore?: boolean
}

/** The "⋯" menu at the end of a row or card. */
export function RowActions({ actions, label = "Actions" }: { actions: RowAction[]; label?: string }) {
  const visible = actions.filter((a) => !a.hidden)
  if (visible.length === 0) return null

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon-sm" aria-label={label} onClick={(e) => e.stopPropagation()}>
          <MoreHorizontal />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-44" onClick={(e) => e.stopPropagation()}>
        {visible.map((action) => {
          const Icon = action.icon
          const content = (
            <>
              {Icon && <Icon className="h-4 w-4" />}
              {action.label}
            </>
          )
          return (
            <div key={action.label}>
              {action.separatorBefore && <DropdownMenuSeparator />}
              {action.to ? (
                <DropdownMenuItem asChild disabled={action.disabled}>
                  <Link to={action.to}>{content}</Link>
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem
                  disabled={action.disabled}
                  onSelect={() => action.onClick?.()}
                  variant={action.destructive ? "destructive" : "default"}
                >
                  {content}
                </DropdownMenuItem>
              )}
            </div>
          )
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}