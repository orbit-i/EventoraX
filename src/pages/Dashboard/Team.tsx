import { useState, useEffect } from 'react';
import Header from "@/components/ui/dashboard/header";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Mail, UserPlus, Trash2, X } from "lucide-react";
import { api } from "@/services/api";

const statusColors = {
  active: "bg-green-100 text-green-700 border-green-200",
  away: "bg-amber-100 text-amber-700 border-amber-200",
  offline: "bg-gray-100 text-gray-600 border-gray-200",
};

export default function Team() {
  const [team, setTeam] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', role: 'Event Coordinator', status: 'active' });
  const [submitting, setSubmitting] = useState(false);

  const fetchTeam = async () => {
    setLoading(true);
    try {
      const res = await api.team.get();
      if (res.success) {
        setTeam(res.team || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeam();
  }, []);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await api.team.invite(form);
      if (res.success) {
        setInviteModalOpen(false);
        setForm({ name: '', email: '', role: 'Event Coordinator', status: 'active' });
        fetchTeam();
      }
    } catch (err: any) {
      alert(err.message || 'Failed to add team member.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRemove = async (id: number, name: string) => {
    if (!confirm(`Are you sure you want to remove ${name} from your team?`)) return;
    try {
      await api.team.remove(id);
      fetchTeam();
    } catch (err: any) {
      alert(err.message || 'Failed to remove team member.');
    }
  };

  return (
    <div>
      <Header title="Team Management" />
      <div className="p-6 space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-[#0f172a]">Team Members</h2>
            <p className="text-sm text-[#475569]">Manage your organizing team and role permissions</p>
          </div>
          <Button 
            onClick={() => setInviteModalOpen(true)}
            className="bg-[#7c3aed] hover:bg-[#6d28d9] text-white rounded-xl shadow-lg shadow-[#7c3aed]/25"
          >
            <UserPlus className="w-4 h-4 mr-2" />
            Invite Member
          </Button>
        </div>

        <Card className="border-[#e9e4ff] shadow-sm">
          <CardContent className="p-0">
            {loading ? (
              <div className="p-8 text-center text-sm text-[#64748b]">Loading team members...</div>
            ) : team.length === 0 ? (
              <div className="p-8 text-center text-sm text-[#64748b]">No team members added yet.</div>
            ) : (
              team.map((member, index) => (
                <div 
                  key={member.id || member.email} 
                  className={`flex items-center gap-4 p-4 ${index !== team.length - 1 ? 'border-b border-[#e9e4ff]' : ''} hover:bg-[#faf8ff] transition-colors`}
                >
                  <Avatar className="w-10 h-10">
                    <AvatarFallback className="bg-gradient-to-br from-[#7c3aed] to-[#a78bfa] text-white font-bold text-xs">
                      {member.initials || 'TM'}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-[#0f172a]">{member.name}</p>
                    <p className="text-xs text-[#94a3b8] truncate">{member.email}</p>
                  </div>

                  <Badge 
                    variant="outline" 
                    className={`${statusColors[member.status as keyof typeof statusColors] || 'bg-gray-100'} capitalize text-xs`}
                  >
                    {member.status}
                  </Badge>

                  <p className="text-sm text-[#475569] hidden sm:block w-32 truncate">{member.role}</p>

                  <div className="flex items-center gap-1">
                    <a
                      href={`mailto:${member.email}`}
                      className="p-2 rounded-lg hover:bg-[#f5f3ff] text-[#64748b] hover:text-[#7c3aed] transition-colors"
                      title="Send email"
                    >
                      <Mail className="w-4 h-4" />
                    </a>
                    <button
                      onClick={() => handleRemove(member.id, member.name)}
                      className="p-2 rounded-lg hover:bg-red-50 text-[#64748b] hover:text-red-600 transition-colors"
                      title="Remove member"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {/* INVITE MEMBER MODAL */}
      {inviteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-[#e9e4ff] overflow-hidden">
            <div className="px-6 py-4 border-b border-[#e9e4ff] flex items-center justify-between bg-[#faf8ff]">
              <div>
                <h3 className="font-bold text-base text-[#0f172a]">Invite Team Member</h3>
                <p className="text-xs text-[#64748b]">Add a member to help manage your events</p>
              </div>
              <button onClick={() => setInviteModalOpen(false)} className="p-1 rounded-lg text-[#94a3b8] hover:text-slate-900">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleInvite} className="p-6 space-y-4">
              <div>
                <label className="text-xs font-semibold text-[#0f172a] block mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Sarah Jenkins"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#e9e4ff] text-sm focus:outline-none focus:ring-2 focus:ring-[#7c3aed]/30 focus:border-[#7c3aed]"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-[#0f172a] block mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  placeholder="sarah@company.com"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#e9e4ff] text-sm focus:outline-none focus:ring-2 focus:ring-[#7c3aed]/30 focus:border-[#7c3aed]"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-[#0f172a] block mb-1">Role / Designation</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Stage Manager, Tech Lead"
                  value={form.role}
                  onChange={(e) => setForm({ ...form, role: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#e9e4ff] text-sm focus:outline-none focus:ring-2 focus:ring-[#7c3aed]/30 focus:border-[#7c3aed]"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-[#0f172a] block mb-1">Availability Status</label>
                <select
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#e9e4ff] text-sm bg-white focus:outline-none focus:border-[#7c3aed]"
                >
                  <option value="active">Active</option>
                  <option value="away">Away</option>
                  <option value="offline">Offline</option>
                </select>
              </div>

              <div className="pt-2 flex justify-end gap-3">
                <Button type="button" variant="outline" onClick={() => setInviteModalOpen(false)} className="rounded-xl border-[#e9e4ff]">
                  Cancel
                </Button>
                <Button type="submit" disabled={submitting} className="bg-[#7c3aed] hover:bg-[#6d28d9] text-white rounded-xl shadow-md">
                  {submitting ? 'Adding...' : 'Send Invitation'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}