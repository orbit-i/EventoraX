import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Shield, Download, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

const logs = [
  { id: 1, user: "admin@orbit-i.com", action: "Login", ip: "192.168.1.1", time: "2025-07-01 08:30" },
  { id: 2, user: "admin@orbit-i.com", action: "Updated plan", ip: "192.168.1.1", time: "2025-07-01 09:15" },
  { id: 3, user: "unknown", action: "Failed login", ip: "203.0.113.1", time: "2025-07-01 07:45" },
];

export default function Security() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Security & Activity</h1>
        <p className="text-slate-400">Monitor platform security</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[{ label: "Total Logins Today", value: "45" }, { label: "Failed Attempts", value: "3" }, { label: "Active Sessions", value: "12" }].map(s => (
          <Card key={s.label} className="bg-slate-800 border-slate-700">
            <CardContent className="p-6">
              <Shield className="h-8 w-8 text-blue-500 mb-2" />
              <p className="text-sm text-slate-400">{s.label}</p>
              <p className="text-2xl font-bold text-white">{s.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="bg-slate-800 border-slate-700">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-white flex items-center gap-2"><AlertTriangle className="h-5 w-5 text-amber-500" />Activity Log</CardTitle>
          <Button variant="outline" size="sm" className="border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-white" onClick={() => toast.success("Exporting...")}>
            <Download className="h-4 w-4 mr-2" />Export
          </Button>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-slate-700">
                <th className="text-left py-3 px-4 text-slate-400">User</th>
                <th className="text-left py-3 px-4 text-slate-400">Action</th>
                <th className="text-left py-3 px-4 text-slate-400">IP Address</th>
                <th className="text-left py-3 px-4 text-slate-400">Time</th>
              </tr></thead>
              <tbody>
                {logs.map(l => (
                  <tr key={l.id} className="border-b border-slate-700/50">
                    <td className="py-3 px-4 text-white">{l.user}</td>
                    <td className="py-3 px-4 text-slate-400">{l.action}</td>
                    <td className="py-3 px-4 font-mono text-xs text-slate-500">{l.ip}</td>
                    <td className="py-3 px-4 text-slate-400">{l.time}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
