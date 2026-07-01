import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Award, Search, Download, Eye, RotateCcw, FileText } from "lucide-react";
import { toast } from "sonner";

const mockCerts = [
  { id: 1, name: "Ali Khan", event: "Tech Conference 2025", verifyCode: "abc123def456", type: "Participation", issueDate: "2025-06-01", downloads: 3, status: "active" },
  { id: 2, name: "Sara Ahmed", event: "Annual Summit", verifyCode: "ghi789jkl012", type: "Achievement", issueDate: "2025-06-01", downloads: 1, status: "active" },
  { id: 3, name: "Usman Ali", event: "Tech Conference 2025", verifyCode: "mno345pqr678", type: "Participation", issueDate: "2025-06-15", downloads: 0, status: "active" },
  { id: 4, name: "Ayesha Malik", event: "Workshop on AI", verifyCode: "stu901vwx234", type: "Completion", issueDate: "2025-05-20", downloads: 5, status: "revoked" },
];

export default function Certificates() {
  const [search, setSearch] = useState("");
  const [certs, setCerts] = useState(mockCerts);

  const filtered = certs.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.verifyCode.toLowerCase().includes(search.toLowerCase()) ||
    c.event.toLowerCase().includes(search.toLowerCase())
  );

  const handleRevoke = (id: number) => {
    setCerts(certs.map(c => c.id === id ? { ...c, status: "revoked" as const } : c));
    toast.success("Certificate revoked!");
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Certificates</h1>
          <p className="text-slate-500">Generate and manage certificates</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => toast.info("Bulk generate coming soon!")}>
            <FileText className="h-4 w-4 mr-2" />
            Bulk Generate
          </Button>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <Input placeholder="Search by name, event, or verify code..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map(cert => (
          <Card key={cert.id} className={`border ${cert.status === "revoked" ? "border-red-200 opacity-60" : "border-blue-100"}`}>
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between">
                <CardTitle className="text-base">{cert.name}</CardTitle>
                <Badge variant={cert.status === "active" ? "default" : "destructive"} className={cert.status === "active" ? "bg-green-100 text-green-700 hover:bg-green-100" : ""}>
                  {cert.status === "active" ? "Active" : "Revoked"}
                </Badge>
              </div>
              <p className="text-sm text-slate-500">{cert.event}</p>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <Award className="h-3 w-3" />
                {cert.type} | Issued: {cert.issueDate}
              </div>
              <div className="text-xs font-mono text-slate-400 bg-slate-50 p-2 rounded">
                {cert.verifyCode}
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="flex-1" onClick={() => toast.info("Preview coming soon!")}>
                  <Eye className="h-3 w-3 mr-1" /> Preview
                </Button>
                <Button variant="outline" size="sm" className="flex-1" onClick={() => toast.success("Downloading...")}>
                  <Download className="h-3 w-3 mr-1" /> PDF
                </Button>
                {cert.status === "active" && (
                  <Button variant="outline" size="sm" className="text-red-500 hover:text-red-600" onClick={() => handleRevoke(cert.id)}>
                    <RotateCcw className="h-3 w-3" />
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
