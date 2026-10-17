import { useState, useEffect } from 'react';
import Header from "@/components/ui/dashboard/header";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Mail, UserPlus, Trash2, Pencil, X, Check, Upload, Phone, Shield } from "lucide-react";
import { api } from "@/services/api";

const statusColors = {
  active: "bg-emerald-100 text-emerald-800 border-emerald-200",
  away: "bg-amber-100 text-amber-800 border-amber-200",
  offline: "bg-slate-100 text-slate-600 border-slate-200",
};

export default function Team() {
  const [team, setTeam] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState<string | null>(null);

  // Invite modal state
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [inviteForm, setInviteForm] = useState({
    name: '',
    email: '',
    role: 'Event Coordinator',
    status: 'active',
    phone: '',
    avatar_url: ''
  });
  const [submittingInvite, setSubmittingInvite] = useState(false);

  // Edit modal state
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState({
    name: '',
    email: '',
    role: '',
    status: 'active',
    phone: '',
    avatar_url: ''
  });
  const [submittingEdit, setSubmittingEdit] = useState(false);

  const fetchTeam = async () => {
    setLoading(true);
    try {
      const res = await api.team.get();
      if (res.success) {
        setTeam(res.team || []);
      }
    } catch (err) {
      console.error('Error fetching team:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeam();
  }, []);

  const showToast = (msg: string) => {
    setFeedback(msg);
    setTimeout(() => setFeedback(null), 3500);
  };

  const handleAvatarUpload = async (file: File, isEdit: boolean) => {
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const base64Data = reader.result as string;
        const res = await api.upload.media({
          base64Data,
          filename: file.name,
          folder: 'avatars'
        });
        if (res.success && res.url) {
          if (isEdit) {
            setEditForm(prev => ({ ...prev, avatar_url: res.url }));
          } else {
            setInviteForm(prev => ({ ...prev, avatar_url: res.url }));
          }
        }
      } catch (err: any) {
        alert(err.message || 'Failed to upload avatar photo.');
      }
    };
    reader.readAsDataURL(file);
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingInvite(true);
    try {
      const res = await api.team.invite(inviteForm);
      if (res.success) {
        setInviteModalOpen(false);
        setInviteForm({
          name: '',
          email: '',
          role: 'Event Coordinator',
          status: 'active',
          phone: '',
          avatar_url: ''
        });
        showToast('Team member added successfully!');
        fetchTeam();
      }
    } catch (err: any) {
      alert(err.message || 'Failed to add team member.');
    } finally {
      setSubmittingInvite(false);
    }
  };

  const openEditModal = (member: any) => {
    setEditingId(member.id);
    setEditForm({
      name: member.name || '',
      email: member.email || '',
      role: member.role || 'Event Coordinator',
      status: member.status || 'active',
      phone: member.phone || '',
      avatar_url: member.avatar_url || ''
    });
    setEditModalOpen(true);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingId) return;
    setSubmittingEdit(true);
    try {
      const res = await api.team.update(editingId, editForm);
      if (res.success) {
        setEditModalOpen(false);
        setEditingId(null);
        showToast('Team member updated successfully!');
        fetchTeam();
      }
    } catch (err: any) {
      alert(err.message || 'Failed to update team member.');
    } finally {
      setSubmittingEdit(false);
    }
  };

  const handleRemove = async (id: number, name: string) => {
    if (!confirm(`Are you sure you want to remove ${name} from your team?`)) return;
    setTeam(prev => prev.filter(m => m.id !== id));
    try {
      await api.team.remove(id);
      showToast(`${name} removed from organization team.`);
    } catch (err: any) {
      console.warn('Backend sync:', err);
      fetchTeam();
    }
  };

  return (
    <div>
      <Header title="Team Management" />
      <div className="p-6 space-y-6">
        {/* Toast Notification */}
        {feedback && (
          <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2 shadow-xs animate-in fade-in">
            <Check className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{feedback}</span>
          </div>
        )}

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-[#0f172a]">Team Members &amp; Staff</h2>
            <p className="text-xs text-[#475569]">Manage organization staff, roles, and event permissions</p>
          </div>
          <Button 
            onClick={() => setInviteModalOpen(true)}
            className="bg-[#7c3aed] hover:bg-[#6d28d9] text-white rounded-xl shadow-md shadow-[#7c3aed]/20 text-xs font-bold"
          >
            <UserPlus className="w-4 h-4 mr-2" />
            Add Team Member
          </Button>
        </div>

        <Card className="border-[#e9e4ff] shadow-sm rounded-2xl overflow-hidden bg-white">
          <CardContent className="p-0">
            {loading ? (
              <div className="p-12 text-center text-xs text-[#64748b]">Loading team members...</div>
            ) : team.length === 0 ? (
              <div className="p-12 text-center space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center mx-auto">
                  <Shield className="w-6 h-6" />
                </div>
                <p className="text-sm font-semibold text-slate-800">No team members added yet.</p>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Invite co-organizers, badge scanners, and stage managers to collaborate on your events.
                </p>
                <Button 
                  onClick={() => setInviteModalOpen(true)}
                  className="bg-[#7c3aed] text-white rounded-xl text-xs font-bold mt-2"
                >
                  <UserPlus className="w-4 h-4 mr-1.5" />
                  Add First Member
                </Button>
              </div>
            ) : (
              <div className="divide-y divide-[#f3f0ff]">
                {team.map((member) => {
                  const safeName = String(member.name || 'Team Member');
                  const initials = safeName
                    .split(/\s+/)
                    .map((n: string) => n[0] || '')
                    .filter(Boolean)
                    .slice(0, 2)
                    .join('')
                    .toUpperCase() || 'TM';

                  return (
                    <div 
                      key={member.id || member.email} 
                      className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 hover:bg-[#faf8ff] transition-colors"
                    >
                      <div className="flex items-center gap-3.5 min-w-0">
                        <Avatar className="w-11 h-11 border border-purple-200 shadow-2xs">
                          {member.avatar_url && <AvatarImage src={member.avatar_url} alt={safeName} className="object-cover" />}
                          <AvatarFallback className="bg-gradient-to-br from-[#7c3aed] to-[#3b82f6] text-white font-bold text-xs">
                            {initials}
                          </AvatarFallback>
                        </Avatar>
                        
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-bold text-[#0f172a] truncate">{safeName}</p>
                            <Badge 
                              variant="outline" 
                              className={`${statusColors[member.status as keyof typeof statusColors] || 'bg-slate-100'} capitalize text-[10px] px-2 py-0.2`}
                            >
                              {member.status || 'Active'}
                            </Badge>
                          </div>
                          <p className="text-xs text-[#64748b] truncate">{member.email}</p>
                          {member.phone && (
                            <p className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                              <Phone className="w-3 h-3" /> {member.phone}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-100">
                        <span className="text-xs font-medium text-slate-600 bg-slate-100 px-2.5 py-1 rounded-lg">
                          {member.role || 'Event Coordinator'}
                        </span>

                        <div className="flex items-center gap-1">
                          <a
                            href={`mailto:${member.email}`}
                            className="p-2 rounded-xl hover:bg-[#f5f3ff] text-[#64748b] hover:text-[#7c3aed] transition-colors"
                            title="Send email"
                          >
                            <Mail className="w-4 h-4" />
                          </a>

                          {/* EDIT MEMBER BUTTON */}
                          <button
                            onClick={() => openEditModal(member)}
                            className="p-2 rounded-xl hover:bg-blue-50 text-[#64748b] hover:text-blue-600 transition-colors"
                            title="Edit member"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>

                          {/* REMOVE MEMBER BUTTON */}
                          <button
                            onClick={() => handleRemove(member.id, safeName)}
                            className="p-2 rounded-xl hover:bg-red-50 text-[#64748b] hover:text-red-600 transition-colors"
                            title="Remove member"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* INVITE / ADD MEMBER MODAL */}
      {inviteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-[#e9e4ff] overflow-hidden">
            <div className="px-6 py-4 border-b border-[#e9e4ff] flex items-center justify-between bg-[#faf8ff]">
              <div>
                <h3 className="font-bold text-base text-[#0f172a]">Add Team Member</h3>
                <p className="text-xs text-[#64748b]">Add an organizer, manager, or badge scanner</p>
              </div>
              <button onClick={() => setInviteModalOpen(false)} className="p-1 rounded-lg text-[#94a3b8] hover:text-slate-900">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleInvite} className="p-6 space-y-4">
              <div>
                <label className="text-xs font-semibold text-[#0f172a] block mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Sarah Jenkins"
                  value={inviteForm.name}
                  onChange={(e) => setInviteForm({ ...inviteForm, name: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border border-[#e9e4ff] text-xs focus:outline-none focus:border-[#7c3aed]"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-[#0f172a] block mb-1">Email Address *</label>
                <input
                  type="email"
                  required
                  placeholder="sarah@company.com"
                  value={inviteForm.email}
                  onChange={(e) => setInviteForm({ ...inviteForm, email: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border border-[#e9e4ff] text-xs focus:outline-none focus:border-[#7c3aed]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-[#0f172a] block mb-1">Role / Designation *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Stage Manager"
                    value={inviteForm.role}
                    onChange={(e) => setInviteForm({ ...inviteForm, role: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border border-[#e9e4ff] text-xs focus:outline-none focus:border-[#7c3aed]"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-[#0f172a] block mb-1">Status</label>
                  <select
                    value={inviteForm.status}
                    onChange={(e) => setInviteForm({ ...inviteForm, status: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border border-[#e9e4ff] text-xs bg-white focus:outline-none focus:border-[#7c3aed]"
                  >
                    <option value="active">Active</option>
                    <option value="away">Away</option>
                    <option value="offline">Offline</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-[#0f172a] block mb-1">Phone Number (Optional)</label>
                <input
                  type="tel"
                  placeholder="+92 300 1234567"
                  value={inviteForm.phone}
                  onChange={(e) => setInviteForm({ ...inviteForm, phone: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border border-[#e9e4ff] text-xs focus:outline-none focus:border-[#7c3aed]"
                />
              </div>

              {/* Avatar Photo Upload */}
              <div>
                <label className="text-xs font-semibold text-[#0f172a] block mb-1">Member Photo / Avatar</label>
                <div className="flex items-center gap-3">
                  {inviteForm.avatar_url ? (
                    <img src={inviteForm.avatar_url} alt="Avatar Preview" className="w-10 h-10 rounded-xl object-cover border border-purple-200" />
                  ) : (
                    <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold text-xs">
                      AV
                    </div>
                  )}
                  <label className="cursor-pointer py-1.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors">
                    <Upload className="w-3.5 h-3.5" />
                    Upload Photo
                    <input 
                      type="file" 
                      accept="image/*" 
                      className="hidden" 
                      onChange={(e) => e.target.files?.[0] && handleAvatarUpload(e.target.files[0], false)} 
                    />
                  </label>
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-3">
                <Button type="button" variant="outline" onClick={() => setInviteModalOpen(false)} className="rounded-xl border-[#e9e4ff] text-xs">
                  Cancel
                </Button>
                <Button type="submit" disabled={submittingInvite} className="bg-[#7c3aed] hover:bg-[#6d28d9] text-white rounded-xl text-xs font-bold">
                  {submittingInvite ? 'Saving...' : 'Add Member'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT MEMBER MODAL */}
      {editModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-[#e9e4ff] overflow-hidden">
            <div className="px-6 py-4 border-b border-[#e9e4ff] flex items-center justify-between bg-[#faf8ff]">
              <div>
                <h3 className="font-bold text-base text-[#0f172a]">Edit Team Member</h3>
                <p className="text-xs text-[#64748b]">Update member details, role, or contact info</p>
              </div>
              <button onClick={() => setEditModalOpen(false)} className="p-1 rounded-lg text-[#94a3b8] hover:text-slate-900">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdate} className="p-6 space-y-4">
              <div>
                <label className="text-xs font-semibold text-[#0f172a] block mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border border-[#e9e4ff] text-xs focus:outline-none focus:border-[#7c3aed]"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-[#0f172a] block mb-1">Email Address *</label>
                <input
                  type="email"
                  required
                  value={editForm.email}
                  onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border border-[#e9e4ff] text-xs focus:outline-none focus:border-[#7c3aed]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-[#0f172a] block mb-1">Role / Designation *</label>
                  <input
                    type="text"
                    required
                    value={editForm.role}
                    onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border border-[#e9e4ff] text-xs focus:outline-none focus:border-[#7c3aed]"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-[#0f172a] block mb-1">Status</label>
                  <select
                    value={editForm.status}
                    onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border border-[#e9e4ff] text-xs bg-white focus:outline-none focus:border-[#7c3aed]"
                  >
                    <option value="active">Active</option>
                    <option value="away">Away</option>
                    <option value="offline">Offline</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-[#0f172a] block mb-1">Phone Number</label>
                <input
                  type="tel"
                  placeholder="+92 300 1234567"
                  value={editForm.phone}
                  onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border border-[#e9e4ff] text-xs focus:outline-none focus:border-[#7c3aed]"
                />
              </div>

              {/* Avatar Photo Upload */}
              <div>
                <label className="text-xs font-semibold text-[#0f172a] block mb-1">Member Photo / Avatar</label>
                <div className="flex items-center gap-3">
                  {editForm.avatar_url ? (
                    <img src={editForm.avatar_url} alt="Avatar" className="w-10 h-10 rounded-xl object-cover border border-purple-200" />
                  ) : (
                    <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold text-xs">
                      AV
                    </div>
                  )}
                  <label className="cursor-pointer py-1.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors">
                    <Upload className="w-3.5 h-3.5" />
                    Change Photo
                    <input 
                      type="file" 
                      accept="image/*" 
                      className="hidden" 
                      onChange={(e) => e.target.files?.[0] && handleAvatarUpload(e.target.files[0], true)} 
                    />
                  </label>
                  {editForm.avatar_url && (
                    <button
                      type="button"
                      onClick={() => setEditForm(prev => ({ ...prev, avatar_url: '' }))}
                      className="text-xs text-red-500 hover:underline"
                    >
                      Remove
                    </button>
                  )}
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-3">
                <Button type="button" variant="outline" onClick={() => setEditModalOpen(false)} className="rounded-xl border-[#e9e4ff] text-xs">
                  Cancel
                </Button>
                <Button type="submit" disabled={submittingEdit} className="bg-[#7c3aed] hover:bg-[#6d28d9] text-white rounded-xl text-xs font-bold">
                  {submittingEdit ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}