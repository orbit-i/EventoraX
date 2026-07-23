import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const alertVariants = cva(
  "relative w-full rounded-xl border px-5 py-4 text-sm grid has-[>svg]:grid-cols-[calc(var(--spacing)*4)_1fr] grid-cols-[0_1fr] has-[>svg]:gap-x-3 gap-y-1 items-start [&>svg]:size-5 [&>svg]:translate-y-0.5 [&>svg]:text-current shadow-sm",
  {
    variants: {
      variant: {
        default: "bg-[#f5f3ff] border-[#ddd6fe] text-[#7c3aed] [&>svg]:text-[#7c3aed]",
        destructive:
          "bg-[#fef2f2] border-[#fecaca] text-[#dc2626] [&>svg]:text-[#dc2626] *:data-[slot=alert-description]:text-[#ef4444]/90",
        success:
          "bg-[#f0fdf4] border-[#bbf7d0] text-[#16a34a] [&>svg]:text-[#16a34a] *:data-[slot=alert-description]:text-[#22c55e]/90",
        warning:
          "bg-[#fffbeb] border-[#fde68a] text-[#d97706] [&>svg]:text-[#d97706] *:data-[slot=alert-description]:text-[#f59e0b]/90",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function Alert({
  className,
  variant,
  ...props
}: React.ComponentProps<"div"> & VariantProps<typeof alertVariants>) {
  return (
    <div
      data-slot="alert"
      role="alert"
      className={cn(alertVariants({ variant }), className)}
      {...props}
    />
  )
}

function AlertTitle({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="alert-title"
      className={cn(
        "col-start-2 line-clamp-1 min-h-4 font-bold text-[#0f172a] tracking-tight",
        className
      )}
      {...props}
    />
  )
}

function AlertDescription({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="alert-description"
      className={cn(
        "text-[#475569] col-start-2 grid justify-items-start gap-1 text-sm [&_p]:leading-relaxed",
        className
      )}
      {...props}
    />
  )
}

export { Alert, AlertTitle, AlertDescription }