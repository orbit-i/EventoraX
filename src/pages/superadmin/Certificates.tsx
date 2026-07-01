import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Search } from "lucide-react";

const mockCerts = [
  { id: 1, name: "Ali Khan", event: "Tech Conference 2025", org: "FAST University", verifyCode: "abc123", status: "active" },
  { id: 2, name: "Sara Ahmed", event: "Annual Summit", org: "LGS", verifyCode: "def456", status: "active" },
  { id: 3, name: "Usman Ali", event: "Workshop", org: "NUST", verifyCode: "ghi789", status: "revoked" },
];

export default function SuperadminCertificates() {
  const [search, setSearch] = useState("");
  const filtered = mockCerts.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.verifyCode.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">All Certificates</h1>
        <p className="text-slate-400">Certificates across all tenants</p>
      </div>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <Input placeholder="Search by name or verify code..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 bg-slate-800 border-slate-600 text-white" />
      </div>
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader><CardTitle className="text-white">Certificate List</CardTitle></CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-slate-700">
                <th className="text-left py-3 px-4 text-slate-400">Name</th>
                <th className="text-left py-3 px-4 text-slate-400">Event</th>
                <th className="text-left py-3 px-4 text-slate-400">Organization</th>
                <th className="text-left py-3 px-4 text-slate-400">Verify Code</th>
                <th className="text-left py-3 px-4 text-slate-400">Status</th>
              </tr></thead>
              <tbody>
                {filtered.map(c => (
                  <tr key={c.id} className="border-b border-slate-700/50">
                    <td className="py-3 px-4 text-white">{c.name}</td>
                    <td className="py-3 px-4 text-slate-400">{c.event}</td>
                    <td className="py-3 px-4 text-slate-400">{c.org}</td>
                    <td className="py-3 px-4 font-mono text-xs text-slate-500">{c.verifyCode}</td>
                    <td className="py-3 px-4"><span className={`text-xs font-medium ${c.status === "active" ? "text-green-400" : "text-red-400"}`}>{c.status}</span></td>
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
