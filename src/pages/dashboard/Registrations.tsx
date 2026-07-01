import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Search, Download, CheckCircle, XCircle, FileUp } from "lucide-react";
import { toast } from "sonner";

const statusColors: Record<string, string> = {
  registered: "bg-blue-100 text-blue-700",
  attended: "bg-green-100 text-green-700",
  absent: "bg-red-100 text-red-700",
  cancelled: "bg-slate-100 text-slate-500",
};

const mockRegs = [
  { id: 1, refNo: "REG-001", name: "Ali Khan", email: "ali@example.com", phone: "+92-300-1234567", department: "CS", category: "general", status: "registered" },
  { id: 2, refNo: "REG-002", name: "Sara Ahmed", email: "sara@example.com", phone: "+92-300-7654321", department: "EE", category: "student", status: "attended" },
  { id: 3, refNo: "REG-003", name: "Usman Ali", email: "usman@example.com", phone: "+92-300-1112223", department: "CS", category: "general", status: "registered" },
  { id: 4, refNo: "REG-004", name: "Ayesha Malik", email: "ayesha@example.com", phone: "+92-300-4445556", department: "BA", category: "vip", status: "absent" },
  { id: 5, refNo: "REG-005", name: "Bilal Hassan", email: "bilal@example.com", phone: "+92-300-7778889", department: "CS", category: "general", status: "registered" },
];

export default function Registrations() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [regs, setRegs] = useState(mockRegs);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState({ name: "", email: "", phone: "", department: "", category: "general" });

  const filtered = regs.filter(r => {
    const matchesSearch = r.name.toLowerCase().includes(search.toLowerCase()) || r.email.toLowerCase().includes(search.toLowerCase()) || r.refNo.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "all" || r.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    const refNo = `REG-${String(regs.length + 1).padStart(3, "0")}`;
    setRegs([{ id: regs.length + 1, refNo, ...formData, status: "registered" }, ...regs]);
    setDialogOpen(false);
    setFormData({ name: "", email: "", phone: "", department: "", category: "general" });
    toast.success("Attendee added!");
  };

  const handleStatusChange = (id: number, newStatus: string) => {
    setRegs(regs.map(r => r.id === id ? { ...r, status: newStatus } : r));
    toast.success("Status updated!");
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Registrations</h1>
          <p className="text-slate-500">Manage event attendees</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => toast.info("CSV import coming soon!")}>
            <FileUp className="h-4 w-4 mr-2" />
            Import CSV
          </Button>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-blue-500 hover:bg-blue-600 text-white">
                <Plus className="h-4 w-4 mr-2" />
                Add Attendee
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader><DialogTitle>Add Attendee Manually</DialogTitle></DialogHeader>
              <form onSubmit={handleCreate} className="space-y-4 mt-4">
                <Input placeholder="Full Name" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required />
                <Input type="email" placeholder="Email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} required />
                <Input placeholder="Phone" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
                <Input placeholder="Department" value={formData.department} onChange={e => setFormData({...formData, department: e.target.value})} />
                <Button type="submit" className="w-full bg-blue-500 hover:bg-blue-600 text-white">Add Attendee</Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input placeholder="Search by name, email, or ref#..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="registered">Registered</SelectItem>
            <SelectItem value="attended">Attended</SelectItem>
            <SelectItem value="absent">Absent</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" onClick={() => toast.info("Export coming soon!")}>
          <Download className="h-4 w-4 mr-2" />
          Export
        </Button>
      </div>

      <Card className="border-blue-100">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50">
                  <th className="text-left py-3 px-4 font-medium text-slate-500">Ref#</th>
                  <th className="text-left py-3 px-4 font-medium text-slate-500">Name</th>
                  <th className="text-left py-3 px-4 font-medium text-slate-500">Email</th>
                  <th className="text-left py-3 px-4 font-medium text-slate-500">Dept</th>
                  <th className="text-left py-3 px-4 font-medium text-slate-500">Category</th>
                  <th className="text-left py-3 px-4 font-medium text-slate-500">Status</th>
                  <th className="text-right py-3 px-4 font-medium text-slate-500">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(r => (
                  <tr key={r.id} className="border-b border-slate-50 hover:bg-blue-50/30">
                    <td className="py-3 px-4 font-mono text-xs text-slate-500">{r.refNo}</td>
                    <td className="py-3 px-4 font-medium text-slate-800">{r.name}</td>
                    <td className="py-3 px-4 text-slate-500">{r.email}</td>
                    <td className="py-3 px-4 text-slate-500">{r.department}</td>
                    <td className="py-3 px-4">
                      <span className="capitalize text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">{r.category}</span>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[r.status]}`}>{r.status}</span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {r.status === "registered" && (
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-green-500" title="Mark Attended" onClick={() => handleStatusChange(r.id, "attended")}>
                            <CheckCircle className="h-4 w-4" />
                          </Button>
                        )}
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500" title="Mark Absent" onClick={() => handleStatusChange(r.id, "absent")}>
                          <XCircle className="h-4 w-4" />
                        </Button>
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
