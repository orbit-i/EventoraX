import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold transition-all duration-200 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:ring-2 focus-visible:ring-[#7c3aed]/30 focus-visible:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "bg-[#7c3aed] text-white shadow-lg shadow-[#7c3aed]/25 hover:bg-[#6d28d9] hover:shadow-xl hover:shadow-[#7c3aed]/30 hover:-translate-y-0.5 active:translate-y-0",
        primary:
          "bg-[#7c3aed] text-white shadow-lg shadow-[#7c3aed]/25 hover:bg-[#6d28d9] hover:shadow-xl hover:shadow-[#7c3aed]/30 hover:-translate-y-0.5 active:translate-y-0",
        destructive:
          "bg-[#dc2626] text-white shadow-lg shadow-red-500/20 hover:bg-[#b91c1c] hover:shadow-xl hover:shadow-red-500/25 hover:-translate-y-0.5 active:translate-y-0",
        danger:
          "bg-[#dc2626] text-white shadow-lg shadow-red-500/20 hover:bg-[#b91c1c] hover:shadow-xl hover:shadow-red-500/25 hover:-translate-y-0.5 active:translate-y-0",
        outline:
          "border-2 border-[#e2e8f0] bg-white text-[#0f172a] shadow-sm hover:border-[#c4b5fd] hover:bg-[#f5f3ff] hover:text-[#7c3aed] hover:-translate-y-0.5 active:translate-y-0",
        secondary:
          "bg-[#f5f3ff] text-[#7c3aed] border border-[#e9e4ff] shadow-sm hover:bg-[#ede9fe] hover:-translate-y-0.5 active:translate-y-0",
        ghost:
          "text-[#64748b] hover:bg-[#f5f3ff] hover:text-[#7c3aed] hover:-translate-y-0.5 active:translate-y-0",
        link: "text-[#7c3aed] underline-offset-4 hover:underline font-medium",
      },
      size: {
        default: "h-10 px-6 py-2.5 has-[>svg]:px-5",
        sm: "h-9 rounded-lg gap-1.5 px-4 py-2 has-[>svg]:px-3.5 text-xs",
        lg: "h-12 rounded-xl px-8 py-3 has-[>svg]:px-7 text-base",
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