import Header from "@/components/ui/dashboard/header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function Charts() {
  return (
    <div>
      <Header title="Charts & Analytics" />
      <div className="p-6 space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Bar Chart */}
          <Card className="border-[#e9e4ff] shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg font-bold text-[#0f172a]">Event Attendance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64 flex items-end justify-between gap-3 px-2">
                {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day, i) => (
                  <div key={day} className="flex flex-col items-center gap-2 flex-1">
                    <div 
                      className="w-full bg-gradient-to-t from-[#7c3aed] to-[#a78bfa] rounded-t-lg"
                      style={{ height: `${30 + i * 10}%` }}
                    />
                    <span className="text-xs text-[#475569] font-medium">{day}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Pie Chart */}
          <Card className="border-[#e9e4ff] shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg font-bold text-[#0f172a]">Event Categories</CardTitle>
            </CardHeader>
            <CardContent className="flex items-center justify-center gap-8">
              <div className="relative w-40 h-40">
                <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                  <circle cx="50" cy="50" r="35" fill="none" stroke="#e9e4ff" strokeWidth="20" />
                  <circle cx="50" cy="50" r="35" fill="none" stroke="#7c3aed" strokeWidth="20" strokeDasharray="55 220" />
                  <circle cx="50" cy="50" r="35" fill="none" stroke="#a78bfa" strokeWidth="20" strokeDasharray="45 220" strokeDashoffset="-55" />
                  <circle cx="50" cy="50" r="35" fill="none" stroke="#ddd6fe" strokeWidth="20" strokeDasharray="40 220" strokeDashoffset="-100" />
                  <circle cx="50" cy="50" r="35" fill="none" stroke="#ede9fe" strokeWidth="20" strokeDasharray="80 220" strokeDashoffset="-140" />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-2xl font-bold text-[#0f172a]">24</span>
                </div>
              </div>
              <div className="space-y-3">
                {[
                  { label: "Conferences", color: "#7c3aed", value: "30%" },
                  { label: "Workshops", color: "#a78bfa", value: "20%" },
                  { label: "Networking", color: "#ddd6fe", value: "18%" },
                  { label: "Others", color: "#ede9fe", value: "32%" },
                ].map((item) => (
                  <div key={item.label} className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="text-sm text-[#475569]">{item.label}</span>
                    <span className="text-sm font-bold text-[#0f172a]">{item.value}</span>
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