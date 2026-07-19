"use client"

import * as React from "react"
import * as RadioGroupPrimitive from "@radix-ui/react-radio-group"
import { CircleIcon } from "lucide-react"

import { cn } from "@/lib/utils"

function RadioGroup({
  className,
  ...props
}: React.ComponentProps<typeof RadioGroupPrimitive.Root>) {
  return (
    <RadioGroupPrimitive.Root
      data-slot="radio-group"
      className={cn("grid gap-2.5", className)}
      {...props}
    />
  )
}

function RadioGroupItem({
  className,
  ...props
}: React.ComponentProps<typeof RadioGroupPrimitive.Item>) {
  return (
    <RadioGroupPrimitive.Item
      data-slot="radio-group-item"
      className={cn(
        "border-2 border-[#ddd6fe] text-[#7c3aed] focus-visible:border-[#7c3aed] focus-visible:ring-2 focus-visible:ring-[#7c3aed]/30 aria-invalid:ring-2 aria-invalid:ring-[#dc2626]/20 aria-invalid:border-[#dc2626] bg-white aspect-square size-5 shrink-0 rounded-full shadow-sm transition-all duration-200 outline-none hover:border-[#c4b5fd] hover:bg-[#f5f3ff] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:border-[#ddd6fe] disabled:hover:bg-white data-[state=checked]:border-[#7c3aed] data-[state=checked]:shadow-md data-[state=checked]:shadow-[#7c3aed]/20",
        className
      )}
      {...props}
    >
      <RadioGroupPrimitive.Indicator
        data-slot="radio-group-indicator"
        className="relative flex items-center justify-center"
      >
        <CircleIcon className="fill-[#7c3aed] text-[#7c3aed] absolute top-1/2 left-1/2 size-2.5 -translate-x-1/2 -translate-y-1/2" />
      </RadioGroupPrimitive.Indicator>
    </RadioGroupPrimitive.Item>
  )
}

export { RadioGroup, RadioGroupItem }