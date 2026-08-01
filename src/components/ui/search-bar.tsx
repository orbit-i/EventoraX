import * as React from "react"
import { Search, X } from "lucide-react"

import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"

interface SearchBarProps {
  placeholder?: string
  onSearch: (value: string) => void
  /** Delay in ms before onSearch fires after typing stops. Default 300ms. */
  debounceMs?: number
  className?: string
}

function SearchBar({
  placeholder = "Search...",
  onSearch,
  debounceMs = 300,
  className,
}: SearchBarProps) {
  const [value, setValue] = React.useState("")

  React.useEffect(() => {
    const timer = setTimeout(() => {
      onSearch(value)
    }, debounceMs)

    return () => clearTimeout(timer)
  }, [value, debounceMs, onSearch])

  const handleClear = () => {
    setValue("")
    onSearch("")
  }

  return (
    <div className={cn("relative w-full max-w-sm", className)}>
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94a3b8]" />
      <Input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder}
        className="pl-10 pr-9"
      />
      {value && (
        <button
          type="button"
          onClick={handleClear}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-[#94a3b8] hover:text-[#7c3aed] transition-colors"
          aria-label="Clear search"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  )
}

export { SearchBar }