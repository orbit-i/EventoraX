import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Building2, Users, Award, DollarSign, TrendingUp, AlertTriangle, Plus, FileText, Send } from "lucide-react";
import { Link } from "react-router";


const stats = [
  { title: "Total Tenants", value: "156", sub: "12 active trials", icon: Building2, color: "text-blue-500", bg: "bg-blue-50" },
  { title: "Total Users", value: "892", sub: "Across all tenants", icon: Users, color: "text-green-500", bg: "bg-green-50" },
  { title: "Certificates", value: "12.4K", sub: "All time issued", icon: Award, color: "text-amber-500", bg: "bg-amber-50" },
  { title: "Revenue", value: "PKR 3.2M", sub: "All time", icon: DollarSign, color: "text-purple-500", bg: "bg-purple-50" },
];

const alerts = [
  { type: "warning", message: "3 trials expire today", icon: AlertTriangle },
  { type: "error", message: "2 failed payments detected", icon: AlertTriangle },
];

export default function SuperadminDashboard() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Superadmin Dashboard</h1>
        <p className="text-slate-400">Platform overview and management</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(s => (
          <Card key={s.title} className="bg-slate-800 border-slate-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-400">{s.title}</p>
                  <p className="text-2xl font-bold text-white mt-1">{s.value}</p>
                  <p className="text-xs text-slate-500 mt-1">{s.sub}</p>
                </div>
                <div className={`w-12 h-12 rounded-lg ${s.bg} flex items-center justify-center`}>
                  <s.icon className={`h-6 w-6 ${s.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Alerts */}
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader><CardTitle className="text-lg text-white flex items-center gap-2"><AlertTriangle className="h-5 w-5 text-amber-500" />Alerts</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {alerts.map((a, i) => (
              <div key={i} className={`p-3 rounded-lg ${a.type === "error" ? "bg-red-900/30 border border-red-800" : "bg-amber-900/30 border border-amber-800"}`}>
                <p className="text-sm text-slate-300">{a.message}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader><CardTitle className="text-lg text-white">Quick Actions</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            <Link to="/superadmin/tenants">
              <Button variant="outline" className="w-full border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-white justify-start">
                <Plus className="h-4 w-4 mr-2" /> Add Tenant
              </Button>
            </Link>
            <Link to="/superadmin/security">
              <Button variant="outline" className="w-full border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-white justify-start">
                <FileText className="h-4 w-4 mr-2" /> View Logs
              </Button>
            </Link>
            <Link to="/superadmin/announcements">
              <Button variant="outline" className="w-full border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-white justify-start">
                <Send className="h-4 w-4 mr-2" /> Send Announcement
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Recent Signups */}
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader><CardTitle className="text-lg text-white flex items-center gap-2"><TrendingUp className="h-5 w-5 text-green-500" />New Signups (This Month)</CardTitle></CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-white mb-2">23</div>
            <p className="text-sm text-slate-400">+15% from last month</p>
            <div className="mt-4 h-16 flex items-end gap-1">
              {[40, 65, 45, 80, 55, 90, 70, 85, 60, 75, 50, 95].map((h, i) => (
                <div key={i} className="flex-1 bg-blue-500/60 rounded-t" style={{ height: `${h}%` }} />
              ))}
            </div>
            <p className="text-xs text-slate-500 mt-2 text-center">Last 12 months</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
