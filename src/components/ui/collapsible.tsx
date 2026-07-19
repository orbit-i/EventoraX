import * as React from "react"
import * as CollapsiblePrimitive from "@radix-ui/react-collapsible"
import { cn } from "@/lib/utils"

function Collapsible({
  ...props
}: React.ComponentProps<typeof CollapsiblePrimitive.Root>) {
  return <CollapsiblePrimitive.Root data-slot="collapsible" {...props} />
}

function CollapsibleTrigger({
  className,
  ...props
}: React.ComponentProps<typeof CollapsiblePrimitive.CollapsibleTrigger>) {
  return (
    <CollapsiblePrimitive.CollapsibleTrigger
      data-slot="collapsible-trigger"
      className={cn(
        "flex items-center justify-between w-full px-5 py-4 rounded-xl text-left text-sm font-semibold text-[#0f172a] transition-all duration-200 hover:bg-[#f5f3ff] hover:text-[#7c3aed] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7c3aed]/30 focus-visible:ring-offset-2 [&[data-state=open]]:bg-[#f5f3ff] [&[data-state=open]]:text-[#7c3aed] [&[data-state=open]]:rounded-b-none",
        className
      )}
      {...props}
    />
  )
}

function CollapsibleContent({
  className,
  ...props
}: React.ComponentProps<typeof CollapsiblePrimitive.CollapsibleContent>) {
  return (
    <CollapsiblePrimitive.CollapsibleContent
      data-slot="collapsible-content"
      className={cn(
        "overflow-hidden text-sm text-[#475569] data-[state=closed]:animate-collapsible-up data-[state=open]:animate-collapsible-down border-l-2 border-[#ddd6fe] ml-5 pl-5",
        className
      )}
      {...props}
    />
  )
}

export { Collapsible, CollapsibleTrigger, CollapsibleContent }