import { Link } from "react-router";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Calendar, Users, Award, Plus, TrendingUp, Clock,
} from "lucide-react";

const stats = [
  { title: "Total Events", value: "12", icon: Calendar, color: "text-blue-500", bg: "bg-blue-50" },
  { title: "Registrations", value: "348", icon: Users, color: "text-green-500", bg: "bg-green-50" },
  { title: "Certificates", value: "156", icon: Award, color: "text-amber-500", bg: "bg-amber-50" },
  { title: "Team Members", value: "5", icon: Users, color: "text-purple-500", bg: "bg-purple-50" },
];

const quickActions = [
  { label: "Create Event", to: "/dashboard/events", icon: Plus, color: "bg-blue-500 hover:bg-blue-600" },
  { label: "Add Attendee", to: "/dashboard/registrations", icon: Users, color: "bg-green-500 hover:bg-green-600" },
  { label: "Generate Certs", to: "/dashboard/certificates", icon: Award, color: "bg-amber-500 hover:bg-amber-600" },
];

const recentEvents = [
  { name: "Tech Conference 2025", date: "2025-07-15", status: "upcoming", registrations: 120 },
  { name: "Workshop on AI", date: "2025-07-20", status: "draft", registrations: 0 },
  { name: "Annual Summit", date: "2025-06-01", status: "completed", registrations: 250 },
  { name: "Career Fair", date: "2025-08-05", status: "upcoming", registrations: 78 },
];

const upcomingEvents = [
  { name: "Tech Conference 2025", date: "Jul 15, 2025", daysLeft: 14 },
  { name: "Career Fair", date: "Aug 5, 2025", daysLeft: 35 },
];

export default function Dashboard() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
        <p className="text-slate-500">Welcome back! Here&apos;s what&apos;s happening.</p>
      </div>

      {/* Trial Warning (demo) */}
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Clock className="h-5 w-5 text-amber-500" />
          <div>
            <p className="text-sm font-medium text-amber-800">Trial ends in 12 hours</p>
            <p className="text-xs text-amber-600">Upgrade to keep your data and continue using all features.</p>
          </div>
        </div>
        <Link to="/dashboard/billing">
          <Button size="sm" className="bg-amber-500 hover:bg-amber-600 text-white">Upgrade Plan</Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s) => (
          <Card key={s.title} className="border-blue-100">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500">{s.title}</p>
                  <p className="text-3xl font-bold text-slate-900 mt-1">{s.value}</p>
                </div>
                <div className={`w-12 h-12 rounded-lg ${s.bg} flex items-center justify-center`}>
                  <s.icon className={`h-6 w-6 ${s.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="flex flex-wrap gap-3">
        {quickActions.map((a) => (
          <Link key={a.label} to={a.to}>
            <Button className={`${a.color} text-white`}>
              <a.icon className="h-4 w-4 mr-2" />
              {a.label}
            </Button>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Events */}
        <Card className="lg:col-span-2 border-blue-100">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Calendar className="h-5 w-5 text-blue-500" />
              Recent Events
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100">
                    <th className="text-left py-2 px-3 text-slate-500 font-medium">Name</th>
                    <th className="text-left py-2 px-3 text-slate-500 font-medium">Date</th>
                    <th className="text-left py-2 px-3 text-slate-500 font-medium">Status</th>
                    <th className="text-left py-2 px-3 text-slate-500 font-medium">Regs</th>
                  </tr>
                </thead>
                <tbody>
                  {recentEvents.map((e) => (
                    <tr key={e.name} className="border-b border-slate-50 hover:bg-blue-50/30">
                      <td className="py-2 px-3 font-medium text-slate-800">{e.name}</td>
                      <td className="py-2 px-3 text-slate-500">{e.date}</td>
                      <td className="py-2 px-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          e.status === "upcoming" ? "bg-blue-100 text-blue-700" :
                          e.status === "completed" ? "bg-green-100 text-green-700" :
                          "bg-slate-100 text-slate-600"
                        }`}>
                          {e.status}
                        </span>
                      </td>
                      <td className="py-2 px-3 text-slate-500">{e.registrations}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Upcoming Events */}
        <Card className="border-blue-100">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-blue-500" />
              Upcoming
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {upcomingEvents.map((e) => (
              <div key={e.name} className="p-3 rounded-lg bg-slate-50 border border-slate-100">
                <p className="font-medium text-slate-800">{e.name}</p>
                <p className="text-sm text-slate-500">{e.date}</p>
                <p className="text-xs text-blue-500 mt-1">{e.daysLeft} days left</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
