import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {  Search } from "lucide-react";
import { toast } from "sonner";

const mockUsers = [
  { id: 1, name: "Ahmad Ali", email: "ahmad@fast.edu", org: "FAST University", role: "admin", status: "active" },
  { id: 2, name: "Fatima Khan", email: "fatima@lgs.edu", org: "LGS", role: "manager", status: "active" },
  { id: 3, name: "Bilal Hassan", email: "bilal@nust.edu", org: "NUST", role: "admin", status: "active" },
  { id: 4, name: "Zara Ahmed", email: "zara@techcorp.pk", org: "TechCorp", role: "viewer", status: "disabled" },
];

export default function Users() {
  const [search, setSearch] = useState("");
  const filtered = mockUsers.filter(u =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">All Users</h1>
        <p className="text-slate-400">Users across the platform</p>
      </div>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <Input placeholder="Search users..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 bg-slate-800 border-slate-600 text-white" />
      </div>
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader><CardTitle className="text-white">User List</CardTitle></CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-slate-700">
                <th className="text-left py-3 px-4 text-slate-400">Name</th>
                <th className="text-left py-3 px-4 text-slate-400">Email</th>
                <th className="text-left py-3 px-4 text-slate-400">Organization</th>
                <th className="text-left py-3 px-4 text-slate-400">Role</th>
                <th className="text-left py-3 px-4 text-slate-400">Status</th>
                <th className="text-right py-3 px-4 text-slate-400">Actions</th>
              </tr></thead>
              <tbody>
                {filtered.map(u => (
                  <tr key={u.id} className="border-b border-slate-700/50">
                    <td className="py-3 px-4 text-white">{u.name}</td>
                    <td className="py-3 px-4 text-slate-400">{u.email}</td>
                    <td className="py-3 px-4 text-slate-400">{u.org}</td>
                    <td className="py-3 px-4"><span className="text-xs bg-blue-900 text-blue-300 px-2 py-0.5 rounded-full">{u.role}</span></td>
                    <td className="py-3 px-4"><span className={`text-xs ${u.status === "active" ? "text-green-400" : "text-red-400"}`}>{u.status}</span></td>
                    <td className="py-3 px-4 text-right">
                      <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white" onClick={() => toast.info("Reset password email sent!")}>Reset Password</Button>
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
