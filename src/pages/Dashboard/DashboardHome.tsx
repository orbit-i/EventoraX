import Header from "@/components/ui/dashboard/header"
import StatCard from "@/components/ui/dashboard/StatCard"
import { Calendar, Users, DollarSign, TrendingUp } from "lucide-react"

const stats = [
  { title: "Total Events", value: "2,847", change: "+12.5%", icon: Calendar, trend: "up" as const },
  { title: "Attendees", value: "45,231", change: "+8.2%", icon: Users, trend: "up" as const },
  { title: "Revenue", value: "$124,500", change: "+23.1%", icon: DollarSign, trend: "up" as const },
  { title: "Active Now", value: "1,234", change: "+5.4%", icon: TrendingUp, trend: "up" as const },
]

export default function DashboardHome() {
  return (
    <div>
      <Header title="Dashboard Overview" />
      <div className="p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat) => (
            <StatCard key={stat.title} {...stat} />
          ))}
        </div>
      </div>
    </div>
  )
}