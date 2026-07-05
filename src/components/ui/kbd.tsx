import { cn } from "@/lib/utils"

function Kbd({ className, ...props }: React.ComponentProps<"kbd">) {
  return (
    <kbd
      data-slot="kbd"
      className={cn(
        "bg-[#f5f3ff] text-[#7c3aed] border border-[#ddd6fe] pointer-events-none inline-flex h-6 w-fit min-w-6 items-center justify-center gap-1 rounded-lg px-1.5 font-sans text-xs font-semibold select-none shadow-sm",
        "[&_svg:not([class*='size-'])]:size-3.5 [&_svg]:text-[#a78bfa]",
        "[[data-slot=tooltip-content]_&]:bg-[#7c3aed]/20 [[data-slot=tooltip-content]_&]:text-white",
        className
      )}
      {...props}
    />
  )
}

function KbdGroup({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="kbd-group"
      className={cn("inline-flex items-center gap-1.5 flex-wrap", className)}
      {...props}
    />
  )
}

export { Kbd, KbdGroup }