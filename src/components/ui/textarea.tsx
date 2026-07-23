import * as React from "react"

import { cn } from "@/lib/utils"

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "border-[#e9e4ff] placeholder:text-[#94a3b8] focus-visible:border-[#7c3aed] focus-visible:ring-2 focus-visible:ring-[#7c3aed]/30 aria-invalid:ring-2 aria-invalid:ring-[#dc2626]/20 aria-invalid:border-[#dc2626] bg-white flex field-sizing-content min-h-20 w-full rounded-xl border px-4 py-3 text-sm shadow-sm transition-all duration-200 outline-none focus-visible:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50 hover:border-[#c4b5fd] resize-y",
        className
      )}
      {...props}
    />
  )
}

export { Textarea }