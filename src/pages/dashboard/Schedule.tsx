import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Clock, Plus, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";

const mockSessions = [
  { id: 1, title: "Opening Keynote", speaker: "Dr. Sarah Chen", timeStart: "09:00", timeEnd: "10:00", location: "Main Hall" },
  { id: 2, title: "AI Workshop", speaker: "Prof. James Wilson", timeStart: "10:30", timeEnd: "12:00", location: "Room A" },
  { id: 3, title: "Panel Discussion", speaker: "Multiple Speakers", timeStart: "13:00", timeEnd: "14:30", location: "Main Hall" },
];

export default function Schedule() {
  const [sessions, setSessions] = useState(mockSessions);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ title: "", speaker: "", timeStart: "", timeEnd: "", location: "" });

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    setSessions([...sessions, { id: sessions.length + 1, ...form }]);
    setDialogOpen(false);
    setForm({ title: "", speaker: "", timeStart: "", timeEnd: "", location: "" });
    toast.success("Session added!");
  };

  const handleDelete = (id: number) => {
    setSessions(sessions.filter(s => s.id !== id));
    toast.success("Session removed!");
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Schedule</h1>
          <p className="text-slate-500">Manage event agenda</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-blue-500 hover:bg-blue-600 text-white"><Plus className="h-4 w-4 mr-2" />Add Session</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle>Add Session</DialogTitle></DialogHeader>
            <form onSubmit={handleAdd} className="space-y-4 mt-4">
              <Input placeholder="Session Title" value={form.title} onChange={e => setForm({...form, title: e.target.value})} required />
              <Input placeholder="Speaker Name" value={form.speaker} onChange={e => setForm({...form, speaker: e.target.value})} />
              <div className="grid grid-cols-2 gap-3">
                <Input type="time" placeholder="Start Time" value={form.timeStart} onChange={e => setForm({...form, timeStart: e.target.value})} required />
                <Input type="time" placeholder="End Time" value={form.timeEnd} onChange={e => setForm({...form, timeEnd: e.target.value})} required />
              </div>
              <Input placeholder="Location / Room" value={form.location} onChange={e => setForm({...form, location: e.target.value})} />
              <Button type="submit" className="w-full bg-blue-500 hover:bg-blue-600 text-white">Add Session</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>
      <div className="space-y-3">
        {sessions.map(s => (
          <Card key={s.id} className="border-blue-100">
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                <div className="text-center min-w-[70px]">
                  <Clock className="h-5 w-5 text-blue-500 mx-auto mb-1" />
                  <p className="text-xs font-medium text-slate-600">{s.timeStart}</p>
                  <p className="text-xs text-slate-400">{s.timeEnd}</p>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-slate-800">{s.title}</p>
                  <p className="text-sm text-slate-500">{s.speaker}</p>
                  <p className="text-xs text-blue-500 mt-0.5">{s.location}</p>
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" className="h-8 w-8"><Pencil className="h-4 w-4 text-slate-400" /></Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleDelete(s.id)}><Trash2 className="h-4 w-4 text-red-400" /></Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
