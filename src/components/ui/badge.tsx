import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center justify-center rounded-full border px-2.5 py-0.5 text-xs font-semibold w-fit whitespace-nowrap shrink-0 [&>svg]:size-3.5 gap-1.5 [&>svg]:pointer-events-none transition-all duration-200 overflow-hidden hover:-translate-y-0.5",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-[#7c3aed] text-white shadow-sm shadow-[#7c3aed]/20 [a&]:hover:bg-[#6d28d9]",
        secondary:
          "border-transparent bg-[#f5f3ff] text-[#7c3aed] [a&]:hover:bg-[#ede9fe]",
        destructive:
          "border-transparent bg-[#dc2626] text-white shadow-sm shadow-red-500/20 [a&]:hover:bg-[#b91c1c]",
        outline:
          "border-[#ddd6fe] text-[#7c3aed] bg-white [a&]:hover:bg-[#f5f3ff] [a&]:hover:border-[#c4b5fd]",
        success:
          "border-transparent bg-[#16a34a] text-white shadow-sm shadow-green-500/20 [a&]:hover:bg-[#15803d]",
        warning:
          "border-transparent bg-[#d97706] text-white shadow-sm shadow-amber-500/20 [a&]:hover:bg-[#b45309]",
        info:
          "border-transparent bg-[#2563eb] text-white shadow-sm shadow-blue-500/20 [a&]:hover:bg-[#1d4ed8]",
        ghost:
          "border-transparent bg-transparent text-[#64748b] [a&]:hover:bg-[#f5f3ff] [a&]:hover:text-[#7c3aed]",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function Badge({
  className,
  variant,
  asChild = false,
  ...props
}: React.ComponentProps<"span"> &
  VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : "span"

  return (
    <Comp
      data-slot="badge"
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  )
}

export { Badge, badgeVariants }