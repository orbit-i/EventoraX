import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, Building2, Calendar, Award } from "lucide-react";

const monthlyOrgs = [12, 15, 8, 20, 18, 25, 22, 30, 28, 35, 32, 40];
const months = ["Jul", "Aug", "Sep", "Oct", "Nov", "Dec", "Jan", "Feb", "Mar", "Apr", "May", "Jun"];

export default function SuperadminAnalytics() {
  const maxVal = Math.max(...monthlyOrgs);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Platform Analytics</h1>
        <p className="text-slate-400">Comprehensive platform insights</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[{ title: "New Orgs This Month", value: "23", icon: Building2 }, { title: "Events This Month", value: "45", icon: Calendar }, { title: "Certs This Month", value: "1,234", icon: Award }].map(s => (
          <Card key={s.title} className="bg-slate-800 border-slate-700">
            <CardContent className="p-6">
              <s.icon className="h-8 w-8 text-blue-500 mb-2" />
              <p className="text-sm text-slate-400">{s.title}</p>
              <p className="text-2xl font-bold text-white">{s.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="bg-slate-800 border-slate-700">
        <CardHeader><CardTitle className="text-white flex items-center gap-2"><BarChart3 className="h-5 w-5 text-blue-500" />Monthly New Organizations</CardTitle></CardHeader>
        <CardContent>
          <div className="flex items-end gap-2 h-48">
            {monthlyOrgs.map((v, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                <span className="text-xs text-slate-400">{v}</span>
                <div className="w-full bg-blue-500 rounded-t" style={{ height: `${(v / maxVal) * 100}%` }} />
                <span className="text-xs text-slate-500">{months[i]}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
