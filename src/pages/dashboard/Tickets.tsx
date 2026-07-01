import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search, QrCode, Download, ScanLine } from "lucide-react";
import { toast } from "sonner";

const mockTickets = [
  { id: 1, ticketNo: "TIX-001", attendee: "Ali Khan", event: "Tech Conference 2025", type: "free", isUsed: false },
  { id: 2, ticketNo: "TIX-002", attendee: "Sara Ahmed", event: "Tech Conference 2025", type: "free", isUsed: true },
  { id: 3, ticketNo: "TIX-003", attendee: "Usman Ali", event: "Annual Summit", type: "vip", isUsed: false },
  { id: 4, ticketNo: "TIX-004", attendee: "Ayesha Malik", event: "Annual Summit", type: "free", isUsed: true },
];

export default function Tickets() {
  const [search, setSearch] = useState("");
  const [tickets] = useState(mockTickets);

  const filtered = tickets.filter(t =>
    t.attendee.toLowerCase().includes(search.toLowerCase()) ||
    t.ticketNo.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">QR Tickets</h1>
          <p className="text-slate-500">Manage event tickets and QR scanning</p>
        </div>
        <Button className="bg-blue-500 hover:bg-blue-600 text-white" onClick={() => toast.info("QR Scanner opening...")}>
          <ScanLine className="h-4 w-4 mr-2" />
          Open Scanner
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <Input placeholder="Search by attendee or ticket number..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.map(t => (
          <Card key={t.id} className="border-blue-100">
            <CardContent className="p-5">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="font-semibold text-slate-800">{t.attendee}</p>
                  <p className="text-sm text-slate-500">{t.event}</p>
                </div>
                <Badge variant={t.isUsed ? "secondary" : "default"} className={!t.isUsed ? "bg-green-100 text-green-700 hover:bg-green-100" : ""}>
                  {t.isUsed ? "Used" : "Unused"}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <div className="text-xs font-mono text-slate-400">{t.ticketNo}</div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => toast.info("Showing QR code...")}>
                    <QrCode className="h-3 w-3 mr-1" /> View QR
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => toast.success("Downloading ticket...")}>
                    <Download className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
