"use client"

import * as React from "react"
import * as TabsPrimitive from "@radix-ui/react-tabs"

import { cn } from "@/lib/utils"

function Tabs({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Root>) {
  return (
    <TabsPrimitive.Root
      data-slot="tabs"
      className={cn("flex flex-col gap-2.5", className)}
      {...props}
    />
  )
}

function TabsList({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.List>) {
  return (
    <TabsPrimitive.List
      data-slot="tabs-list"
      className={cn(
        "bg-[#f5f3ff] text-[#64748b] inline-flex h-10 w-fit items-center justify-center rounded-xl p-1",
        className
      )}
      {...props}
    />
  )
}

function TabsTrigger({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Trigger>) {
  return (
    <TabsPrimitive.Trigger
      data-slot="tabs-trigger"
      className={cn(
        "data-[state=active]:bg-white data-[state=active]:text-[#7c3aed] data-[state=active]:shadow-sm data-[state=active]:shadow-[#7c3aed]/10 data-[state=active]:border-[#e9e4ff] focus-visible:border-[#7c3aed] focus-visible:ring-2 focus-visible:ring-[#7c3aed]/30 focus-visible:outline-none text-[#64748b] inline-flex h-[calc(100%-2px)] flex-1 items-center justify-center gap-2 rounded-lg border border-transparent px-3 py-1.5 text-sm font-semibold whitespace-nowrap transition-all duration-200 focus-visible:ring-offset-1 disabled:pointer-events-none disabled:opacity-50 hover:text-[#7c3aed] [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4 [&_svg]:text-[#c4b5fd]",
        className
      )}
      {...props}
    />
  )
}

function TabsContent({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Content>) {
  return (
    <TabsPrimitive.Content
      data-slot="tabs-content"
      className={cn("flex-1 outline-none mt-2", className)}
      {...props}
    />
  )
}

export { Tabs, TabsList, TabsTrigger, TabsContent }