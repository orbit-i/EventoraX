import type { LucideIcon } from "lucide-react"
import { ArrowUpRight, ArrowDownRight } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"

interface StatCardProps {
  title: string
  value: string
  change: string
  icon: LucideIcon
  trend: "up" | "down"
}

export default function StatCard({ title, value, change, icon: Icon, trend }: StatCardProps) {
  const isPositive = trend === "up"

  return (
    <Card className="border-[#e9e4ff] shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300">
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div className="space-y-3">
            <p className="text-sm font-medium text-[#475569]">{title}</p>
            <p className="text-2xl font-bold text-[#0f172a]">{value}</p>
            <div className={cn(
              "inline-flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full",
              isPositive ? "bg-green-50 text-green-600" : "bg-red-50 text-red-600"
            )}>
              {isPositive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
              {change}
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-[#f5f3ff] flex items-center justify-center">
            <Icon className="w-5 h-5 text-[#7c3aed]" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}