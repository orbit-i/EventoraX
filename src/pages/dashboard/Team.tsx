import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Shield, User, Eye, Plus, Mail } from "lucide-react";
import { toast } from "sonner";

const roleIcons: Record<string, typeof Shield> = {
  admin: Shield,
  manager: User,
  viewer: Eye,
};

const mockTeam = [
  { id: 1, name: "Ahmad Ali", email: "ahmad@org.com", role: "admin", status: "active" },
  { id: 2, name: "Fatima Khan", email: "fatima@org.com", role: "manager", status: "active" },
  { id: 3, name: "Bilal Hassan", email: "bilal@org.com", role: "manager", status: "active" },
  { id: 4, name: "Zara Ahmed", email: "zara@org.com", role: "viewer", status: "invited" },
];

export default function Team() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("manager");

  const handleInvite = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success(`Invitation sent to ${inviteEmail}!`);
    setDialogOpen(false);
    setInviteEmail("");
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Team Members</h1>
          <p className="text-slate-500">Manage your organization team</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-blue-500 hover:bg-blue-600 text-white"><Plus className="h-4 w-4 mr-2" />Invite Member</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle>Invite Team Member</DialogTitle></DialogHeader>
            <form onSubmit={handleInvite} className="space-y-4 mt-4">
              <Input type="email" placeholder="Email address" value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} required />
              <Select value={inviteRole} onValueChange={setInviteRole}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="manager">Manager</SelectItem>
                  <SelectItem value="viewer">Viewer</SelectItem>
                </SelectContent>
              </Select>
              <Button type="submit" className="w-full bg-blue-500 hover:bg-blue-600 text-white">Send Invitation</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Role Limits Info */}
      <div className="grid grid-cols-3 gap-4">
        {[{ role: "Admin", used: 1, max: 3 }, { role: "Manager", used: 2, max: 7 }, { role: "Viewer", used: 1, max: "Unlimited" }].map(r => (
          <Card key={r.role} className="border-blue-100">
            <CardContent className="p-4 text-center">
              <p className="text-sm text-slate-500">{r.role}s</p>
              <p className="text-xl font-bold text-slate-900">{r.used} / {r.max}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Members */}
      <div className="space-y-3">
        {mockTeam.map(m => {
          const RoleIcon = roleIcons[m.role];
          return (
            <Card key={m.id} className="border-blue-100">
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                    <RoleIcon className="h-5 w-5 text-blue-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-slate-800">{m.name}</p>
                    <p className="text-sm text-slate-500 flex items-center gap-1"><Mail className="h-3 w-3" />{m.email}</p>
                  </div>
                  <span className={`text-xs font-medium capitalize px-2 py-0.5 rounded-full ${
                    m.role === "admin" ? "bg-blue-100 text-blue-700" :
                    m.role === "manager" ? "bg-green-100 text-green-700" :
                    "bg-slate-100 text-slate-600"
                  }`}>{m.role}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    m.status === "active" ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"
                  }`}>{m.status}</span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
