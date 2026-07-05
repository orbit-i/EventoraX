"use client"

import * as React from "react"
import * as LabelPrimitive from "@radix-ui/react-label"

import { cn } from "@/lib/utils"

function Label({
  className,
  ...props
}: React.ComponentProps<typeof LabelPrimitive.Root>) {
  return (
    <LabelPrimitive.Root
      data-slot="label"
      className={cn(
        "flex items-center gap-2 text-sm leading-none font-semibold text-[#0f172a] select-none transition-colors duration-200 group-data-[disabled=true]:pointer-events-none group-data-[disabled=true]:opacity-50 peer-disabled:cursor-not-allowed peer-disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-[#7c3aed]/30 focus-visible:ring-offset-2 rounded-sm",
        className
      )}
      {...props}
    />
  )
}

export { Label }