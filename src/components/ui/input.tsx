import * as React from "react"

import { cn } from "@/lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "file:text-[#7c3aed] placeholder:text-[#94a3b8] selection:bg-[#7c3aed] selection:text-white border-[#e9e4ff] h-10 w-full min-w-0 rounded-xl border bg-white px-4 py-2 text-sm shadow-sm transition-all duration-200 outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
        "focus-visible:border-[#7c3aed] focus-visible:ring-2 focus-visible:ring-[#7c3aed]/30 focus-visible:ring-offset-1",
        "aria-invalid:ring-2 aria-invalid:ring-[#dc2626]/20 aria-invalid:border-[#dc2626]",
        "hover:border-[#c4b5fd]",
        className
      )}
      {...props}
    />
  )
}

export { Input }