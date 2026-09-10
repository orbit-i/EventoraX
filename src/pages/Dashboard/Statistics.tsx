import Header from "@/components/ui/dashboard/header"
import StatCard from "@/components/ui/dashboard/StatCard"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Calendar, Users, Ticket, Star, BarChart3, TrendingUp } from "lucide-react"

const stats = [
  { title: "Events Hosted",   value: "156",   change: "+24 this month",    icon: Calendar, trend: "up" as const },
  { title: "Total Attendees", value: "12.5K", change: "+18% vs last month", icon: Users,    trend: "up" as const },
  { title: "Tickets Sold",    value: "8,432", change: "+32% conversion",   icon: Ticket,   trend: "up" as const },
  { title: "Avg Rating",      value: "4.8",   change: "Top 5% platform",   icon: Star,     trend: "up" as const },
]

const events = [
  { name: "Conference 2024",  pct: 85 },
  { name: "Workshop Series",  pct: 70 },
  { name: "Networking Night", pct: 55 },
  { name: "Product Launch",   pct: 40 },
]

const months = [
  { label: "Jan", height: 40 },
  { label: "Feb", height: 52 },
  { label: "Mar", height: 64 },
  { label: "Apr", height: 76 },
  { label: "May", height: 88 },
  { label: "Jun", height: 100 },
]

export default function Statistics() {
  return (
    <div>
      <Header title="Statistics" />
      <div className="p-6 space-y-6">

        {/* ── Stat cards row ─────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat) => (
            <StatCard key={stat.title} {...stat} />
          ))}
        </div>

        {/* ── Analytics panels ───────────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* Event Performance */}
          <Card variant="default">
            <CardHeader
              icon={<BarChart3 className="w-4 h-4" />}
              accentStrip
            >
              <CardTitle>Event Performance</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {events.map((event, i) => (
                <div key={event.name} className="flex items-center gap-4">
                  {/* Rank badge */}
                  <div className="w-7 h-7 rounded-lg bg-gradient-to-b from-[#f5f3ff] to-[#ede9fe] border border-[#ddd6fe] flex items-center justify-center text-[#7c3aed] font-bold text-xs shrink-0">
                    {i + 1}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1.5">
                      <p className="text-sm font-semibold text-[#0f172a] truncate">{event.name}</p>
                      <span className="text-sm font-bold text-[#7c3aed] ml-3 shrink-0">{event.pct}%</span>
                    </div>
                    {/* Progress bar */}
                    <div className="h-1.5 w-full rounded-full bg-[#f0ebff] overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-[#7c3aed] to-[#a78bfa] transition-all duration-500"
                        style={{ width: `${event.pct}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Monthly Growth */}
          <Card variant="default">
            <CardHeader
              icon={<TrendingUp className="w-4 h-4" />}
              accentStrip
            >
              <CardTitle>Monthly Growth</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-end justify-between gap-2 h-44">
                {months.map((m) => (
                  <div key={m.label} className="flex flex-col items-center gap-2 flex-1 h-full justify-end">
                    <div
                      className="w-full rounded-t-xl bg-gradient-to-t from-[#7c3aed] to-[#a78bfa] transition-all duration-500 hover:from-[#6d28d9] hover:to-[#8b5cf6]"
                      style={{ height: `${m.height}%` }}
                    />
                    <span className="text-xs text-[#94a3b8] font-medium">{m.label}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

        </div>
      </div>
    </div>
  )
}
