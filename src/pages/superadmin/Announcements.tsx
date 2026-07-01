import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Megaphone, Send, Clock } from "lucide-react";
import { toast } from "sonner";

const pastAnnouncements = [
  { id: 1, title: "Platform Update v1.1", target: "all", sentAt: "2025-06-15", status: "sent" },
  { id: 2, title: "Enterprise Features", target: "enterprise", sentAt: "2025-06-10", status: "sent" },
];

export default function Announcements() {
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [target, setTarget] = useState("all");

  const handleSend = () => {
    if (!title || !message) { toast.error("Please fill all fields!"); return; }
    toast.success(`Announcement sent to ${target}!`);
    setTitle(""); setMessage("");
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold text-white">Announcements</h1>
        <p className="text-slate-400">Send announcements to tenants</p>
      </div>

      <Card className="bg-slate-800 border-slate-700">
        <CardHeader><CardTitle className="text-white flex items-center gap-2"><Megaphone className="h-5 w-5 text-amber-500" />New Announcement</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <Input placeholder="Announcement Title" value={title} onChange={e => setTitle(e.target.value)} className="bg-slate-700 border-slate-600 text-white" />
          <Textarea placeholder="Announcement Message..." value={message} onChange={e => setMessage(e.target.value)} rows={4} className="bg-slate-700 border-slate-600 text-white" />
          <Select value={target} onValueChange={setTarget}>
            <SelectTrigger className="bg-slate-700 border-slate-600 text-white"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Tenants</SelectItem>
              <SelectItem value="pro">Pro Only</SelectItem>
              <SelectItem value="enterprise">Enterprise Only</SelectItem>
            </SelectContent>
          </Select>
          <div className="flex gap-2">
            <Button className="bg-blue-500 hover:bg-blue-600 text-white" onClick={handleSend}><Send className="h-4 w-4 mr-2" />Send Now</Button>
            <Button variant="outline" className="border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-white" onClick={() => toast.info("Schedule feature coming soon!")}><Clock className="h-4 w-4 mr-2" />Schedule</Button>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-slate-800 border-slate-700">
        <CardHeader><CardTitle className="text-white">History</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {pastAnnouncements.map(a => (
            <div key={a.id} className="p-4 rounded-lg bg-slate-700/50 flex items-center justify-between">
              <div>
                <p className="text-white font-medium">{a.title}</p>
                <p className="text-sm text-slate-400">Target: {a.target} | Sent: {a.sentAt}</p>
              </div>
              <span className="text-xs bg-green-900 text-green-300 px-2 py-0.5 rounded-full">{a.status}</span>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
