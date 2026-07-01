import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, TrendingUp, Users, Award, Calendar } from "lucide-react";

const monthlyData = [
  { month: "Jan", registrations: 45 },
  { month: "Feb", registrations: 62 },
  { month: "Mar", registrations: 38 },
  { month: "Apr", registrations: 85 },
  { month: "May", registrations: 120 },
  { month: "Jun", registrations: 95 },
];

const eventStatusData = [
  { label: "Draft", value: 2, color: "bg-slate-400" },
  { label: "Upcoming", value: 3, color: "bg-blue-500" },
  { label: "Completed", value: 5, color: "bg-green-500" },
  { label: "Archived", value: 2, color: "bg-slate-300" },
];

export default function Analytics() {
  const maxReg = Math.max(...monthlyData.map(d => d.registrations));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Analytics</h1>
        <p className="text-slate-500">Event performance insights</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { title: "Total Events", value: "12", icon: Calendar, color: "text-blue-500" },
          { title: "Total Registrations", value: "348", icon: Users, color: "text-green-500" },
          { title: "Certificates Issued", value: "156", icon: Award, color: "text-amber-500" },
          { title: "Attendance Rate", value: "78%", icon: TrendingUp, color: "text-purple-500" },
        ].map(s => (
          <Card key={s.title} className="border-blue-100">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500">{s.title}</p>
                  <p className="text-2xl font-bold text-slate-900 mt-1">{s.value}</p>
                </div>
                <s.icon className={`h-8 w-8 ${s.color}`} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-blue-100">
          <CardHeader><CardTitle className="text-lg flex items-center gap-2"><BarChart3 className="h-5 w-5 text-blue-500" />Monthly Registrations</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-3">
              {monthlyData.map(d => (
                <div key={d.month} className="flex items-center gap-3">
                  <span className="text-sm text-slate-500 w-10">{d.month}</span>
                  <div className="flex-1 h-6 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-500 rounded-full transition-all" style={{ width: `${(d.registrations / maxReg) * 100}%` }} />
                  </div>
                  <span className="text-sm font-medium text-slate-700 w-8 text-right">{d.registrations}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="border-blue-100">
          <CardHeader><CardTitle className="text-lg flex items-center gap-2"><BarChart3 className="h-5 w-5 text-blue-500" />Events by Status</CardTitle></CardHeader>
          <CardContent>
            <div className="flex items-end gap-4 h-40 mb-4">
              {eventStatusData.map(d => (
                <div key={d.label} className="flex-1 flex flex-col items-center gap-2">
                  <span className="text-sm font-medium text-slate-700">{d.value}</span>
                  <div className={`w-full rounded-t-lg ${d.color}`} style={{ height: `${(d.value / 5) * 100}%` }} />
                </div>
              ))}
            </div>
            <div className="flex justify-center gap-4">
              {eventStatusData.map(d => (
                <div key={d.label} className="flex items-center gap-1.5">
                  <div className={`w-3 h-3 rounded-full ${d.color}`} />
                  <span className="text-xs text-slate-500">{d.label}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
