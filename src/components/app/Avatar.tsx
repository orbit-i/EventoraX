import { cn } from "@/lib/utils"

const SIZES = { sm: "h-8 w-8 text-xs", md: "h-11 w-11 text-sm", lg: "h-16 w-16 text-lg" } as const

/** Round photo, or the person's initials when there's no photo. */
export function Avatar({ name, src, size = "md", className }: { name: string; src?: string | null; size?: keyof typeof SIZES; className?: string }) {
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase()

  return src ? (
    <img src={src} alt="" className={cn("shrink-0 rounded-full object-cover", SIZES[size], className)} />
  ) : (
    <div
      aria-hidden
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#ede9fe] to-[#ddd6fe] font-bold text-[#6d28d9]",
        SIZES[size],
        className
      )}
    >
      {initials || "?"}
    </div>
  )
}