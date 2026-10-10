import { ChevronDown, Check } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { StatusBadge } from "@/components/app/StatusBadge"
import { REGISTRATION_STATUS } from "@/lib/status"
import type { RegistrationStatus } from "@/types/registration"

const HELP: Record<RegistrationStatus, string> = {
  REGISTERED: "Signed up, event not attended yet",
  ATTENDED: "Showed up",
  ABSENT: "Didn't show up (keeps the seat)",
  CANCELLED: "Withdrew — frees the seat",
}

/** A status badge that opens a menu to change the status (read-only badge for viewers). */
export function StatusMenu({
  value,
  onChange,
  disabled,
}: {
  value: RegistrationStatus
  onChange: (next: RegistrationStatus) => void
  disabled?: boolean
}) {
  if (disabled) return <StatusBadge kind="registration" value={value} />

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className="group inline-flex items-center gap-0.5 rounded-full outline-none focus-visible:ring-2 focus-visible:ring-[#7c3aed]/30"
        onClick={(e) => e.stopPropagation()}
        aria-label={`Status: ${REGISTRATION_STATUS[value]?.label}. Change status`}
      >
        <StatusBadge kind="registration" value={value} className="group-hover:brightness-95" />
        <ChevronDown className="h-3.5 w-3.5 text-[#94a3b8] group-hover:text-[#7c3aed]" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-64" onClick={(e) => e.stopPropagation()}>
        <DropdownMenuLabel className="text-xs text-[#64748b]">Change status</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {(Object.keys(REGISTRATION_STATUS) as RegistrationStatus[]).map((status) => (
          <DropdownMenuItem key={status} onSelect={() => status !== value && onChange(status)} className="items-start gap-2 py-2">
            <span className="mt-0.5 w-4">{status === value && <Check className="h-4 w-4 text-[#7c3aed]" />}</span>
            <span>
              <StatusBadge kind="registration" value={status} />
              <span className="mt-1 block text-xs text-[#64748b]">{HELP[status]}</span>
            </span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}