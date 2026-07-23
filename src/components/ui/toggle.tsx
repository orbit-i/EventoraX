import * as React from "react"
import * as TogglePrimitive from "@radix-ui/react-toggle"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const toggleVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded-xl text-sm font-semibold hover:bg-[#f5f3ff] hover:text-[#7c3aed] disabled:pointer-events-none disabled:opacity-50 data-[state=on]:bg-[#7c3aed] data-[state=on]:text-white data-[state=on]:shadow-md data-[state=on]:shadow-[#7c3aed]/20 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 [&_svg]:shrink-0 focus-visible:ring-2 focus-visible:ring-[#7c3aed]/30 focus-visible:ring-offset-1 outline-none transition-all duration-200 aria-invalid:ring-2 aria-invalid:ring-[#dc2626]/20 aria-invalid:border-[#dc2626] whitespace-nowrap",
  {
    variants: {
      variant: {
        default: "bg-transparent text-[#0f172a]",
        outline:
          "border-2 border-[#e9e4ff] bg-white shadow-sm hover:border-[#c4b5fd] hover:bg-[#f5f3ff] hover:text-[#7c3aed] data-[state=on]:border-[#7c3aed]",
      },
      size: {
        default: "h-10 px-3 min-w-10",
        sm: "h-9 px-2.5 min-w-9",
        lg: "h-11 px-3.5 min-w-11",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Toggle({
  className,
  variant,
  size,
  ...props
}: React.ComponentProps<typeof TogglePrimitive.Root> &
  VariantProps<typeof toggleVariants>) {
  return (
    <TogglePrimitive.Root
      data-slot="toggle"
      className={cn(toggleVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Toggle, toggleVariants }