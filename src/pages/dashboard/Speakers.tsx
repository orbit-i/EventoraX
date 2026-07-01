import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Mic2, Plus, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";

const mockSpeakers = [
  { id: 1, name: "Dr. Sarah Chen", title: "AI Research Lead", company: "Google", topic: "Future of AI", linkedIn: "sarahchen" },
  { id: 2, name: "Prof. James Wilson", title: "Dean of Engineering", company: "MIT", topic: "Innovation in Education", linkedIn: "jwilson" },
];

export default function Speakers() {
  const [speakers, setSpeakers] = useState(mockSpeakers);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ name: "", title: "", company: "", topic: "", linkedIn: "" });

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    setSpeakers([...speakers, { id: speakers.length + 1, ...form }]);
    setDialogOpen(false);
    setForm({ name: "", title: "", company: "", topic: "", linkedIn: "" });
    toast.success("Speaker added!");
  };

  const handleDelete = (id: number) => {
    setSpeakers(speakers.filter(s => s.id !== id));
    toast.success("Speaker removed!");
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Speakers</h1>
          <p className="text-slate-500">Manage event speakers</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-blue-500 hover:bg-blue-600 text-white"><Plus className="h-4 w-4 mr-2" />Add Speaker</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle>Add Speaker</DialogTitle></DialogHeader>
            <form onSubmit={handleAdd} className="space-y-4 mt-4">
              <Input placeholder="Name" value={form.name} onChange={e => setForm({...form, name: e.target.value})} required />
              <Input placeholder="Title" value={form.title} onChange={e => setForm({...form, title: e.target.value})} />
              <Input placeholder="Company" value={form.company} onChange={e => setForm({...form, company: e.target.value})} />
              <Input placeholder="Topic" value={form.topic} onChange={e => setForm({...form, topic: e.target.value})} />
              <Input placeholder="LinkedIn URL" value={form.linkedIn} onChange={e => setForm({...form, linkedIn: e.target.value})} />
              <Button type="submit" className="w-full bg-blue-500 hover:bg-blue-600 text-white">Add Speaker</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {speakers.map(s => (
          <Card key={s.id} className="border-blue-100">
            <CardContent className="p-5">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                  <Mic2 className="h-6 w-6 text-blue-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-slate-800">{s.name}</p>
                  <p className="text-sm text-slate-500">{s.title} at {s.company}</p>
                  <p className="text-sm text-blue-600 mt-1">Topic: {s.topic}</p>
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
