import { useState } from "react"
import { Bell, Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu"

interface HeaderProps {
  title: string
  onSearch?: (value: string) => void
}

const notifications = [
  { id: 1, text: "New registration for Tech Summit 2026", time: "5m ago" },
  { id: 2, text: "Certificate batch generation completed", time: "1h ago" },
  { id: 3, text: "Your team member Ali joined the workspace", time: "3h ago" },
]

export default function Header({ title, onSearch }: HeaderProps) {
  const [query, setQuery] = useState("")

  const handleChange = (value: string) => {
    setQuery(value)
    onSearch?.(value)
  }

  return (
    <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-[#e9e4ff] px-6 py-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[#0f172a]">{title}</h1>
        
        <div className="flex items-center gap-4">
          <div className="relative hidden sm:block">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94a3b8]" />
            <Input 
              placeholder="Search..." 
              value={query}
              onChange={(e) => handleChange(e.target.value)}
              className="pl-10 w-64 bg-[#f5f3ff] border-[#e9e4ff] focus:bg-white"
            />
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="relative rounded-xl hover:bg-[#f5f3ff] text-[#64748b] hover:text-[#7c3aed]"
              >
                <Bell className="w-5 h-5" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-[#dc2626] rounded-full" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
              <DropdownMenuLabel>Notifications</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {notifications.map((n) => (
                <DropdownMenuItem key={n.id} className="flex flex-col items-start gap-0.5 py-2.5">
                  <span className="text-sm text-[#0f172a]">{n.text}</span>
                  <span className="text-xs text-[#94a3b8]">{n.time}</span>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}