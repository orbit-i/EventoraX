import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Eye, Pause, Trash2 } from "lucide-react";


const mockTenants = [
  { id: 1, name: "FAST University", plan: "Enterprise", status: "active", trialEnd: "N/A", created: "2025-01-15" },
  { id: 2, name: "LGS Gulberg", plan: "Pro", status: "active", trialEnd: "N/A", created: "2025-02-20" },
  { id: 3, name: "TechCorp Pakistan", plan: "Enterprise", status: "trial", trialEnd: "2025-07-02", created: "2025-06-30" },
  { id: 4, name: "NUST", plan: "Pro", status: "active", trialEnd: "N/A", created: "2025-03-10" },
  { id: 5, name: "Careem Pakistan", plan: "Enterprise", status: "suspended", trialEnd: "N/A", created: "2024-12-01" },
];

const statusColors: Record<string, string> = {
  active: "bg-green-100 text-green-700",
  trial: "bg-blue-100 text-blue-700",
  expired: "bg-amber-100 text-amber-700",
  suspended: "bg-red-100 text-red-700",
};

export default function Tenants() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [tenants] = useState(mockTenants);

  const filtered = tenants.filter(t => {
    const matchesSearch = t.name.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "all" || t.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Tenants</h1>
          <p className="text-slate-400">Manage all organizations</p>
        </div>
      </div>
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input placeholder="Search tenants..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 bg-slate-800 border-slate-600 text-white" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40 bg-slate-800 border-slate-600 text-white"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="trial">Trial</SelectItem>
            <SelectItem value="expired">Expired</SelectItem>
            <SelectItem value="suspended">Suspended</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <Card className="bg-slate-800 border-slate-700">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-slate-700">
                <th className="text-left py-3 px-4 text-slate-400 font-medium">Organization</th>
                <th className="text-left py-3 px-4 text-slate-400 font-medium">Plan</th>
                <th className="text-left py-3 px-4 text-slate-400 font-medium">Status</th>
                <th className="text-left py-3 px-4 text-slate-400 font-medium">Trial End</th>
                <th className="text-left py-3 px-4 text-slate-400 font-medium">Created</th>
                <th className="text-right py-3 px-4 text-slate-400 font-medium">Actions</th>
              </tr></thead>
              <tbody>
                {filtered.map(t => (
                  <tr key={t.id} className="border-b border-slate-700/50 hover:bg-slate-700/30">
                    <td className="py-3 px-4 font-medium text-white">{t.name}</td>
                    <td className="py-3 px-4"><Badge variant="outline" className="border-blue-500 text-blue-400">{t.plan}</Badge></td>
                    <td className="py-3 px-4"><span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[t.status]}`}>{t.status}</span></td>
                    <td className="py-3 px-4 text-slate-400">{t.trialEnd}</td>
                    <td className="py-3 px-4 text-slate-400">{t.created}</td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-white"><Eye className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-amber-400"><Pause className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-red-400"><Trash2 className="h-4 w-4" /></Button>
                      </div>
                    </td>
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
