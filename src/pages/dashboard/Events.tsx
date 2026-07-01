import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Search, Pencil, Copy, Trash2 } from "lucide-react";
import { toast } from "sonner";

const statusColors: Record<string, string> = {
  draft: "bg-slate-100 text-slate-600",
  upcoming: "bg-blue-100 text-blue-700",
  active: "bg-green-100 text-green-700",
  completed: "bg-emerald-100 text-emerald-700",
  archived: "bg-slate-100 text-slate-500",
};

const mockEvents = [
  { id: 1, name: "Tech Conference 2025", date: "2025-07-15", mode: "hybrid", status: "upcoming", registrations: 120 },
  { id: 2, name: "AI Workshop", date: "2025-07-20", mode: "online", status: "draft", registrations: 0 },
  { id: 3, name: "Annual Summit", date: "2025-06-01", mode: "physical", status: "completed", registrations: 250 },
  { id: 4, name: "Career Fair 2025", date: "2025-08-05", mode: "physical", status: "upcoming", registrations: 78 },
  { id: 5, name: "DevFest Karachi", date: "2025-09-10", mode: "hybrid", status: "draft", registrations: 0 },
];

export default function Events() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [events, setEvents] = useState(mockEvents);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "", mode: "physical" as string, startDate: "", venue: "", description: "",
  });

  const filtered = events.filter(e => {
    const matchesSearch = e.name.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "all" || e.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    const newEvent = {
      id: events.length + 1,
      name: formData.name,
      date: formData.startDate,
      mode: formData.mode,
      status: "draft",
      registrations: 0,
    };
    setEvents([newEvent, ...events]);
    setDialogOpen(false);
    setFormData({ name: "", mode: "physical", startDate: "", venue: "", description: "" });
    toast.success("Event created successfully!");
  };

  const handleDelete = (id: number) => {
    setEvents(events.filter(e => e.id !== id));
    toast.success("Event deleted!");
  };

  const handleDuplicate = (event: typeof mockEvents[0]) => {
    const copy = { ...event, id: events.length + 1, name: `${event.name} (Copy)`, status: "draft" as const, registrations: 0 };
    setEvents([copy, ...events]);
    toast.success("Event duplicated!");
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Events</h1>
          <p className="text-slate-500">Manage your events</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-blue-500 hover:bg-blue-600 text-white">
              <Plus className="h-4 w-4 mr-2" />
              Create Event
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Create New Event</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4 mt-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Event Name</label>
                <Input value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Mode</label>
                <Select value={formData.mode} onValueChange={v => setFormData({...formData, mode: v})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="physical">Physical</SelectItem>
                    <SelectItem value="online">Online</SelectItem>
                    <SelectItem value="hybrid">Hybrid</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Start Date</label>
                <Input type="date" value={formData.startDate} onChange={e => setFormData({...formData, startDate: e.target.value})} required />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Venue</label>
                <Input value={formData.venue} onChange={e => setFormData({...formData, venue: e.target.value})} placeholder="Location or meeting link" />
              </div>
              <Button type="submit" className="w-full bg-blue-500 hover:bg-blue-600 text-white">Create Event</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input placeholder="Search events..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="upcoming">Upcoming</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Events Table */}
      <Card className="border-blue-100">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50">
                  <th className="text-left py-3 px-4 font-medium text-slate-500">Name</th>
                  <th className="text-left py-3 px-4 font-medium text-slate-500">Date</th>
                  <th className="text-left py-3 px-4 font-medium text-slate-500">Mode</th>
                  <th className="text-left py-3 px-4 font-medium text-slate-500">Status</th>
                  <th className="text-left py-3 px-4 font-medium text-slate-500">Regs</th>
                  <th className="text-right py-3 px-4 font-medium text-slate-500">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(e => (
                  <tr key={e.id} className="border-b border-slate-50 hover:bg-blue-50/30">
                    <td className="py-3 px-4 font-medium text-slate-800">{e.name}</td>
                    <td className="py-3 px-4 text-slate-500">{e.date}</td>
                    <td className="py-3 px-4">
                      <span className="capitalize text-slate-600">{e.mode}</span>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[e.status]}`}>
                        {e.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-500">{e.registrations}</td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-blue-600">
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-blue-600" onClick={() => handleDuplicate(e)}>
                          <Copy className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-red-600" onClick={() => handleDelete(e.id)}>
                          <Trash2 className="h-4 w-4" />
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
