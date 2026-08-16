import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold tracking-wide transition-all duration-300 ease-out disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:ring-4 focus-visible:ring-[#7c3aed]/30 focus-visible:ring-offset-2",
  {
    variants: {
      variant: {
               default:
  "relative inline-flex items-center justify-center h-14 px-10 rounded-[28px] font-semibold text-[#7c3aed] bg-[#f5f7fb] border border-white/70 overflow-hidden transition-all duration-300 shadow-[10px_10px_25px_rgba(91,33,182,0.45),-10px_-10px_25px_rgba(255,255,255,0.95),inset_0_-4px_8px_rgba(0,0,0,0.08)] hover:-translate-y-1 hover:shadow-[12px_12px_30px_rgba(163,177,198,0.5),-12px_-12px_30px_rgba(255,255,255,1),0_0_25px_rgba(124,58,237,0.6)] active:translate-y-0 focus-visible:ring-4 focus-visible:ring-cyan-300/40",
        destructive:
  "relative inline-flex items-center justify-center h-14 px-10 rounded-[28px] font-semibold text-[#991b1b] bg-[#fef2f2] border border-[#fecaca] overflow-hidden transition-all duration-300 shadow-[8px_8px_20px_rgba(220,38,38,0.20),-8px_-8px_20px_rgba(255,255,255,0.95)] hover:bg-[#fee2e2] hover:border-[#dc2626] hover:text-[#7f1d1d] hover:-translate-y-1 hover:shadow-[10px_10px_28px_rgba(220,38,38,0.30),-10px_-10px_28px_rgba(255,255,255,1),0_0_20px_rgba(239,68,68,0.35)] active:translate-y-0 focus-visible:ring-4 focus-visible:ring-red-400/30",
        outline:
          "border-2 border-[#e2e8f0] bg-white text-[#0f172a] shadow-sm hover:border-[#c4b5fd] hover:bg-[#f5f3ff] hover:text-[#7c3aed] hover:-translate-y-0.5 active:translate-y-0",
        secondary:
  "relative inline-flex items-center justify-center h-14 px-10 rounded-[28px] font-semibold text-[#7c3aed] bg-white border border-[#c4b5fd] overflow-hidden transition-all duration-300 shadow-[8px_8px_20px_rgba(91,33,182,0.18),-8px_-8px_20px_rgba(255,255,255,0.95)] hover:bg-[#f5f3ff] hover:border-[#7c3aed] hover:text-[#5b21b6] hover:-translate-y-1 hover:shadow-[10px_10px_28px_rgba(91,33,182,0.28),-10px_-10px_28px_rgba(255,255,255,1),0_0_18px_rgba(124,58,237,0.30)] active:translate-y-0 focus-visible:ring-4 focus-visible:ring-[#a855f7]/30",
        ghost:
          "text-[#64748b] hover:bg-[#f5f3ff] hover:text-[#7c3aed] hover:-translate-y-0.5 active:translate-y-0",
        link: "text-[#7c3aed] underline-offset-4 hover:underline font-medium",
      },
      size: {
        default: "h-10 px-6 py-2.5 has-[>svg]:px-5",
        sm: "h-9 rounded-lg gap-1.5 px-4 py-2 has-[>svg]:px-3.5 text-xs",
        lg: "h-12 px-8 py-3 has-[>svg]:px-7 text-base",
        icon: "size-10",
        "icon-sm": "size-9 rounded-lg",
        "icon-lg": "size-11 rounded-xl",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot : "button"

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }