import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Handshake, Plus, Globe } from "lucide-react";
import { toast } from "sonner";

const tierColors: Record<string, string> = {
  platinum: "bg-slate-100 text-slate-800 border-slate-300",
  gold: "bg-amber-50 text-amber-700 border-amber-200",
  silver: "bg-slate-50 text-slate-600 border-slate-200",
  bronze: "bg-orange-50 text-orange-700 border-orange-200",
};

const mockSponsors = [
  { id: 1, name: "TechCorp Pakistan", tier: "platinum", website: "techcorp.pk" },
  { id: 2, name: "Cloud Solutions", tier: "gold", website: "cloudsolutions.pk" },
  { id: 3, name: "DevStudio", tier: "silver", website: "devstudio.pk" },
];

export default function Sponsors() {
  const [sponsors, setSponsors] = useState(mockSponsors);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ name: "", tier: "bronze", website: "" });

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    setSponsors([...sponsors, { id: sponsors.length + 1, ...form }]);
    setDialogOpen(false);
    setForm({ name: "", tier: "bronze", website: "" });
    toast.success("Sponsor added!");
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Sponsors</h1>
          <p className="text-slate-500">Manage event sponsors</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-blue-500 hover:bg-blue-600 text-white"><Plus className="h-4 w-4 mr-2" />Add Sponsor</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle>Add Sponsor</DialogTitle></DialogHeader>
            <form onSubmit={handleAdd} className="space-y-4 mt-4">
              <Input placeholder="Sponsor Name" value={form.name} onChange={e => setForm({...form, name: e.target.value})} required />
              <Select value={form.tier} onValueChange={v => setForm({...form, tier: v})}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="platinum">Platinum</SelectItem>
                  <SelectItem value="gold">Gold</SelectItem>
                  <SelectItem value="silver">Silver</SelectItem>
                  <SelectItem value="bronze">Bronze</SelectItem>
                </SelectContent>
              </Select>
              <Input placeholder="Website" value={form.website} onChange={e => setForm({...form, website: e.target.value})} />
              <Button type="submit" className="w-full bg-blue-500 hover:bg-blue-600 text-white">Add Sponsor</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {sponsors.map(s => (
          <Card key={s.id} className={`border ${tierColors[s.tier]}`}>
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-2">
                <Handshake className="h-6 w-6" />
                <span className={`text-xs font-medium capitalize px-2 py-0.5 rounded-full ${tierColors[s.tier]}`}>{s.tier}</span>
              </div>
              <p className="font-semibold">{s.name}</p>
              {s.website && (
                <a href={`https://${s.website}`} target="_blank" rel="noopener noreferrer" className="text-sm flex items-center gap-1 mt-1 hover:underline">
                  <Globe className="h-3 w-3" />{s.website}
                </a>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
