import Header from "@/components/ui/dashboard/header"
import StatCard from "@/components/ui/dashboard/StatCard"
import { Calendar, Users, Ticket, Star } from "lucide-react"

const stats = [
  { title: "Events Hosted", value: "156", change: "+24 this month", icon: Calendar, trend: "up" as const },
  { title: "Total Attendees", value: "12.5K", change: "+18% vs last month", icon: Users, trend: "up" as const },
  { title: "Tickets Sold", value: "8,432", change: "+32% conversion", icon: Ticket, trend: "up" as const },
  { title: "Avg Rating", value: "4.8", change: "Top 5% platform", icon: Star, trend: "up" as const },
]

export default function Statistics() {
  return (
    <div>
      <Header title="Statistics" />
      <div className="p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat) => (
            <StatCard key={stat.title} {...stat} />
          ))}
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl border border-[#e9e4ff] p-6 shadow-sm">
            <h3 className="text-lg font-bold text-[#0f172a] mb-4">Event Performance</h3>
            <div className="space-y-4">
              {["Conference 2024", "Workshop Series", "Networking Night", "Product Launch"].map((event, i) => (
                <div key={event} className="flex items-center gap-4">
                  <div className="w-8 h-8 rounded-lg bg-[#f5f3ff] flex items-center justify-center text-[#7c3aed] font-bold text-sm">
                    {i + 1}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-[#0f172a]">{event}</p>
                    <div className="w-full h-2 bg-[#f5f3ff] rounded-full mt-1 overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-[#7c3aed] to-[#a78bfa] rounded-full"
                        style={{ width: `${85 - i * 15}%` }}
                      />
                    </div>
                  </div>
                  <span className="text-sm font-bold text-[#7c3aed]">{85 - i * 15}%</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-[#e9e4ff] p-6 shadow-sm">
            <h3 className="text-lg font-bold text-[#0f172a] mb-4">Monthly Growth</h3>
            <div className="flex items-end justify-between h-48 gap-2">
              {["Jan", "Feb", "Mar", "Apr", "May", "Jun"].map((month, i) => (
                <div key={month} className="flex flex-col items-center gap-2 flex-1">
                  <div 
                    className="w-full bg-gradient-to-t from-[#7c3aed] to-[#a78bfa] rounded-t-lg"
                    style={{ height: `${40 + i * 12}%` }}
                  />
                  <span className="text-xs text-[#475569] font-medium">{month}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}