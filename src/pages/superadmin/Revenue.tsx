import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DollarSign, Download } from "lucide-react";
import { toast } from "sonner";

const transactions = [
  { id: 1, org: "FAST University", plan: "Enterprise", amount: "25,000", date: "2025-06-15", method: "Bank Transfer", status: "completed" },
  { id: 2, org: "LGS Gulberg", plan: "Pro", amount: "20,000", date: "2025-06-14", method: "JazzCash", status: "completed" },
  { id: 3, org: "TechCorp", plan: "Enterprise", amount: "25,000", date: "2025-06-10", method: "Easypaisa", status: "pending" },
];

const monthlyRevenue = [
  { month: "Jan", amount: 180000 }, { month: "Feb", amount: 220000 }, { month: "Mar", amount: 195000 },
  { month: "Apr", amount: 250000 }, { month: "May", amount: 310000 }, { month: "Jun", amount: 280000 },
];

export default function Revenue() {
  const maxRev = Math.max(...monthlyRevenue.map(d => d.amount));

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Revenue & Payments</h1>
          <p className="text-slate-400">Track platform revenue</p>
        </div>
        <Button variant="outline" className="border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-white" onClick={() => toast.success("Exporting CSV...")}>
          <Download className="h-4 w-4 mr-2" />Export CSV
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[{ label: "This Month", value: "PKR 280,000" }, { label: "This Year", value: "PKR 1.4M" }, { label: "All Time", value: "PKR 3.2M" }].map(s => (
          <Card key={s.label} className="bg-slate-800 border-slate-700">
            <CardContent className="p-6">
              <DollarSign className="h-8 w-8 text-green-500 mb-2" />
              <p className="text-sm text-slate-400">{s.label}</p>
              <p className="text-2xl font-bold text-white">{s.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="bg-slate-800 border-slate-700">
        <CardHeader><CardTitle className="text-white">Monthly Revenue</CardTitle></CardHeader>
        <CardContent>
          <div className="flex items-end gap-3 h-40">
            {monthlyRevenue.map(d => (
              <div key={d.month} className="flex-1 flex flex-col items-center gap-1">
                <span className="text-xs text-slate-400">{(d.amount / 1000).toFixed(0)}k</span>
                <div className="w-full bg-blue-500 rounded-t transition-all" style={{ height: `${(d.amount / maxRev) * 100}%` }} />
                <span className="text-xs text-slate-500">{d.month}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="bg-slate-800 border-slate-700">
        <CardHeader><CardTitle className="text-white">Transactions</CardTitle></CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-slate-700">
                <th className="text-left py-3 px-4 text-slate-400">Organization</th>
                <th className="text-left py-3 px-4 text-slate-400">Plan</th>
                <th className="text-left py-3 px-4 text-slate-400">Amount</th>
                <th className="text-left py-3 px-4 text-slate-400">Method</th>
                <th className="text-left py-3 px-4 text-slate-400">Status</th>
              </tr></thead>
              <tbody>
                {transactions.map(t => (
                  <tr key={t.id} className="border-b border-slate-700/50">
                    <td className="py-3 px-4 text-white">{t.org}</td>
                    <td className="py-3 px-4 text-slate-400">{t.plan}</td>
                    <td className="py-3 px-4 text-white font-medium">PKR {t.amount}</td>
                    <td className="py-3 px-4 text-slate-400">{t.method}</td>
                    <td className="py-3 px-4"><span className={`text-xs font-medium ${t.status === "completed" ? "text-green-400" : "text-amber-400"}`}>{t.status}</span></td>
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
