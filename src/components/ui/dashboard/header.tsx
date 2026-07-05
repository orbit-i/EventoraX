import { Bell, Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

interface HeaderProps {
  title: string
}

export default function Header({ title }: HeaderProps) {
  return (
    <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-[#e9e4ff] px-6 py-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[#0f172a]">{title}</h1>
        
        <div className="flex items-center gap-4">
          <div className="relative hidden sm:block">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94a3b8]" />
            <Input 
              placeholder="Search..." 
              className="pl-10 w-64 bg-[#f5f3ff] border-[#e9e4ff] focus:bg-white"
            />
          </div>

          <Button 
            variant="ghost" 
            size="icon"
            className="relative rounded-xl hover:bg-[#f5f3ff] text-[#64748b] hover:text-[#7c3aed]"
          >
            <Bell className="w-5 h-5" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-[#dc2626] rounded-full" />
          </Button>
        </div>
      </div>
    </header>
  )
}