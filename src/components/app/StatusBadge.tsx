import { cn } from "@/lib/utils"
import { STATUS_MAPS, TONE_CLASSES, type StatusKind } from "@/lib/status"

/** <StatusBadge kind="registration" value="ATTENDED" /> → green "Attended" pill */
export function StatusBadge({
  kind,
  value,
  className,
}: {
  kind: StatusKind
  value: string | boolean | null | undefined
  className?: string
}) {
  if (value === null || value === undefined) return null
  const meta = STATUS_MAPS[kind][String(value)] ?? { label: String(value), tone: "slate" as const }
  const tone = TONE_CLASSES[meta.tone]
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-2.5 py-0.5 text-xs font-medium",
        tone.badge,
        className
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", tone.dot)} />
      {meta.label}
    </span>
  )
}
