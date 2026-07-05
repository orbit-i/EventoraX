"use client"

import * as React from "react"
import * as AspectRatioPrimitive from "@radix-ui/react-aspect-ratio"
import { cn } from "@/lib/utils"

function AspectRatio({
  className,
  ...props
}: React.ComponentProps<typeof AspectRatioPrimitive.Root>) {
  return (
    <AspectRatioPrimitive.Root
      data-slot="aspect-ratio"
      className={cn(
        "relative overflow-hidden rounded-2xl border border-[#e9e4ff] bg-[#f5f3ff] shadow-sm",
        className
      )}
      {...props}
    />
  )
}

export { AspectRatio }
