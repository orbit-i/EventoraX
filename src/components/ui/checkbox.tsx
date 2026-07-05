"use client"

import * as React from "react"
import * as CheckboxPrimitive from "@radix-ui/react-checkbox"
import { CheckIcon } from "lucide-react"

import { cn } from "@/lib/utils"

function Checkbox({
  className,
  ...props
}: React.ComponentProps<typeof CheckboxPrimitive.Root>) {
  return (
    <CheckboxPrimitive.Root
      data-slot="checkbox"
      className={cn(
        "peer size-5 shrink-0 rounded-lg border-2 border-[#ddd6fe] bg-white shadow-sm transition-all duration-200 outline-none hover:border-[#c4b5fd] hover:bg-[#f5f3ff] data-[state=checked]:bg-[#7c3aed] data-[state=checked]:text-white data-[state=checked]:border-[#7c3aed] data-[state=checked]:shadow-md data-[state=checked]:shadow-[#7c3aed]/20 focus-visible:ring-2 focus-visible:ring-[#7c3aed]/30 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-[#ddd6fe] disabled:hover:bg-white",
        className
      )}
      {...props}
    >
      <CheckboxPrimitive.Indicator
        data-slot="checkbox-indicator"
        className="grid place-content-center text-current transition-none"
      >
        <CheckIcon className="size-3.5 stroke-[3]" />
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  )
}

export { Checkbox }