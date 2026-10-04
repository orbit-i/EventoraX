import { useState, useEffect } from 'react';
import Header from '@/components/ui/dashboard/header';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Calendar as CalendarIcon, 
  MapPin, 
  Users, 
  Plus, 
  Search, 
  Edit3, 
  Trash2, 
  Ticket, 
  CheckCircle, 
  X
} from 'lucide-react';
import { api } from '@/services/api';

export default function Events() {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState('All');

  // Modal States
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editEvent, setEditEvent] = useState<any | null>(null);
  const [attendeesModalEvent, setAttendeesModalEvent] = useState<any | null>(null);
  const [attendees, setAttendees] = useState<any[]>([]);
  const [attendeesLoading, setAttendeesLoading] = useState(false);

  // New Attendee Form in Modal
  const [newAttendee, setNewAttendee] = useState({ name: '', email: '', phone: '', ticketType: 'General Admission' });
  const [submittingAttendee, setSubmittingAttendee] = useState(false);

  // Form State
  const [form, setForm] = useState({
    title: '',
    category: 'Conference',
    eventType: 'in-person',
    venueName: '',
    venueAddress: '',
    virtualLink: '',
    startDate: '',
    startTime: '09:00',
    endDate: '',
    endTime: '17:00',
    price: 0,
    capacity: 500,
    description: '',
  });

  const loadEvents = async () => {
    setLoading(true);
    try {
      const res = await api.events.list({
        search: search || undefined,
        category: selectedCategory !== 'All' ? selectedCategory : undefined,
        status: selectedStatus !== 'All' ? selectedStatus : undefined,
      });
      if (res.success) {
        setEvents(res.events || []);
      }
    } catch (err) {
      console.error('Failed to load events:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEvents();
  }, [search, selectedCategory, selectedStatus]);

  const handleOpenCreate = () => {
    setEditEvent(null);
    setForm({
      title: '',
      category: 'Conference',
      eventType: 'in-person',
      venueName: '',
      venueAddress: '',
      virtualLink: '',
      startDate: new Date().toISOString().split('T')[0],
      startTime: '09:00',
      endDate: '',
      endTime: '17:00',
      price: 0,
      capacity: 500,
      description: '',
    });
    setCreateModalOpen(true);
  };

  const handleOpenEdit = (event: any) => {
    setEditEvent(event);
    setForm({
      title: event.title || '',
      category: event.category || 'Conference',
      eventType: event.event_type || 'in-person',
      venueName: event.venue_name || '',
      venueAddress: event.venue_address || '',
      virtualLink: event.virtual_link || '',
      startDate: event.start_date ? event.start_date.split('T')[0] : '',
      startTime: event.start_time || '09:00',
      endDate: event.end_date ? event.end_date.split('T')[0] : '',
      endTime: event.end_time || '17:00',
      price: event.price || 0,
      capacity: event.capacity || 500,
      description: event.description || '',
    });
    setCreateModalOpen(true);
  };

  const handleSaveEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editEvent) {
        await api.events.update(editEvent.id, form);
      } else {
        await api.events.create(form);
      }
      setCreateModalOpen(false);
      loadEvents();
    } catch (err: any) {
      alert(err.message || 'Error saving event.');
    }
  };

  const handleDeleteEvent = async (id: number, title: string) => {
    if (!confirm(`Are you sure you want to delete the event "${title}"?`)) return;
    try {
      await api.events.delete(id);
      loadEvents();
    } catch (err: any) {
      alert(err.message || 'Failed to delete event.');
    }
  };

  const handleOpenAttendees = async (event: any) => {
    setAttendeesModalEvent(event);
    setAttendeesLoading(true);
    try {
      const res = await api.events.getAttendees(event.id);
      if (res.success) {
        setAttendees(res.attendees || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setAttendeesLoading(false);
    }
  };

  const handleAddAttendee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!attendeesModalEvent) return;
    setSubmittingAttendee(true);
    try {
      const res = await api.events.register(attendeesModalEvent.id, newAttendee);
      if (res.success) {
        // Refresh attendees
        const updated = await api.events.getAttendees(attendeesModalEvent.id);
        setAttendees(updated.attendees || []);
        setNewAttendee({ name: '', email: '', phone: '', ticketType: 'General Admission' });
        loadEvents();
      }
    } catch (err: any) {
      alert(err.message || 'Failed to register attendee.');
    } finally {
      setSubmittingAttendee(false);
    }
  };

  const categories = ['All', 'Conference', 'Workshop', 'Networking', 'Other'];
  const statuses = ['All', 'upcoming', 'ongoing', 'completed', 'cancelled'];

  return (
    <div className="min-h-screen pb-12">
      <Header title="Events Management" />

      <div className="p-6 space-y-6">
        {/* Actions Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-[#0f172a]">Your Organized Events</h2>
            <p className="text-sm text-[#64748b]">Create, manage, and monitor real-time ticket registrations</p>
          </div>
          <Button 
            onClick={handleOpenCreate}
            className="bg-[#7c3aed] hover:bg-[#6d28d9] text-white rounded-xl shadow-lg shadow-[#7c3aed]/25 flex items-center gap-2 h-11 px-5"
          >
            <Plus className="w-5 h-5" />
            Create Event
          </Button>
        </div>

        {/* Filters */}
        <div className="bg-white p-4 rounded-2xl border border-[#e9e4ff] shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#94a3b8]" />
            <input
              type="text"
              placeholder="Search events by title, description, or venue..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#e9e4ff] bg-[#faf8ff] text-sm text-[#0f172a] focus:outline-none focus:ring-2 focus:ring-[#7c3aed]/30 focus:border-[#7c3aed] transition-all"
            />
          </div>

          {/* Categories */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                  selectedCategory === cat
                    ? 'bg-[#7c3aed] text-white shadow-sm'
                    : 'bg-[#f5f3ff] text-[#64748b] hover:text-[#7c3aed]'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Status */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-[#94a3b8] font-medium hidden sm:inline">Status:</span>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-3 py-2 rounded-xl border border-[#e9e4ff] bg-white text-xs font-medium text-[#0f172a] focus:outline-none focus:border-[#7c3aed]"
            >
              {statuses.map((st) => (
                <option key={st} value={st}>
                  {st.charAt(0).toUpperCase() + st.slice(1)}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Events Grid */}
        {loading ? (
          <div className="py-20 text-center">
            <div className="w-8 h-8 border-3 border-[#7c3aed] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-sm text-[#64748b]">Loading events from database...</p>
          </div>
        ) : events.length === 0 ? (
          <div className="bg-white rounded-2xl border border-dashed border-[#ddd6fe] p-12 text-center">
            <div className="w-14 h-14 bg-[#f5f3ff] rounded-2xl flex items-center justify-center text-[#7c3aed] mx-auto mb-4">
              <CalendarIcon className="w-7 h-7" />
            </div>
            <h3 className="text-lg font-bold text-[#0f172a] mb-1">No Events Found</h3>
            <p className="text-sm text-[#64748b] max-w-sm mx-auto mb-6">
              {search || selectedCategory !== 'All' 
                ? 'No events match your current filter criteria. Try clearing search filters.'
                : 'You have not created any events yet. Click below to publish your first event!'}
            </p>
            <Button onClick={handleOpenCreate} className="bg-[#7c3aed] hover:bg-[#6d28d9] text-white rounded-xl">
              <Plus className="w-4 h-4 mr-2" />
              Create First Event
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.map((ev) => {
              const attendeesPercent = ev.capacity > 0 ? Math.min(100, Math.round((ev.registered_count / ev.capacity) * 100)) : 0;
              const isFree = !ev.price || parseFloat(ev.price) === 0;

              return (
                <Card 
                  key={ev.id} 
                  className="border-[#e9e4ff] hover:border-[#c4b5fd] shadow-sm hover:shadow-xl hover:shadow-[#7c3aed]/10 transition-all duration-300 flex flex-col justify-between overflow-hidden group"
                >
                  <CardContent className="p-6 space-y-4">
                    {/* Header badge & price */}
                    <div className="flex items-center justify-between gap-2">
                      <Badge className="bg-[#f5f3ff] text-[#7c3aed] border border-[#ddd6fe] font-semibold text-xs">
                        {ev.category}
                      </Badge>
                      <div className="flex items-center gap-1.5 font-bold text-sm text-[#0f172a]">
                        {isFree ? (
                          <span className="text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded-lg text-xs">FREE</span>
                        ) : (
                          <span className="bg-[#f5f3ff] text-[#7c3aed] px-2.5 py-0.5 rounded-lg border border-[#e9e4ff] text-xs font-bold">
                            ${ev.price}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Title & Description */}
                    <div>
                      <h3 className="font-heading font-bold text-lg text-[#0f172a] group-hover:text-[#7c3aed] transition-colors line-clamp-1">
                        {ev.title}
                      </h3>
                      <p className="text-xs text-[#64748b] mt-1.5 line-clamp-2 leading-relaxed">
                        {ev.description || 'No description provided for this event.'}
                      </p>
                    </div>

                    {/* Meta info */}
                    <div className="space-y-2 pt-2 border-t border-[#f1eeff] text-xs text-[#475569]">
                      <div className="flex items-center gap-2">
                        <CalendarIcon className="w-3.5 h-3.5 text-[#7c3aed]" />
                        <span>
                          {ev.start_date ? new Date(ev.start_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : 'Date TBD'} 
                          {ev.start_time && ` • ${ev.start_time}`}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 truncate">
                        <MapPin className="w-3.5 h-3.5 text-[#7c3aed] shrink-0" />
                        <span className="truncate">
                          {ev.venue_name || (ev.event_type === 'virtual' ? 'Virtual Online Event' : 'Venue TBA')}
                        </span>
                      </div>
                    </div>

                    {/* Capacity Progress */}
                    <div className="space-y-1.5 pt-1">
                      <div className="flex justify-between text-xs font-medium">
                        <span className="text-[#64748b] flex items-center gap-1">
                          <Users className="w-3 h-3 text-[#7c3aed]" />
                          Attendees
                        </span>
                        <span className="text-[#0f172a] font-bold">
                          {ev.registered_count} / {ev.capacity}
                        </span>
                      </div>
                      <Progress value={attendeesPercent} className="h-2 bg-[#f3f0ff]" />
                    </div>

                    {/* Actions */}
                    <div className="pt-3 border-t border-[#f1eeff] flex items-center justify-between gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleOpenAttendees(ev)}
                        className="text-xs bg-[#faf8ff] text-[#7c3aed] border-[#e9e4ff] hover:bg-[#7c3aed] hover:text-white rounded-lg flex items-center gap-1.5"
                      >
                        <Ticket className="w-3.5 h-3.5" />
                        Attendees ({ev.registered_count})
                      </Button>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleOpenEdit(ev)}
                          title="Edit Event"
                          className="p-2 rounded-lg text-[#64748b] hover:text-[#7c3aed] hover:bg-[#f5f3ff] transition-colors"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteEvent(ev.id, ev.title)}
                          title="Delete Event"
                          className="p-2 rounded-lg text-[#64748b] hover:text-red-600 hover:bg-red-50 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* CREATE / EDIT EVENT MODAL */}
      {createModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-[#e9e4ff] overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-[#e9e4ff] flex items-center justify-between bg-[#faf8ff]">
              <div>
                <h3 className="font-bold text-lg text-[#0f172a]">
                  {editEvent ? 'Edit Event' : 'Create New Event'}
                </h3>
                <p className="text-xs text-[#64748b]">Configure your event details and ticketing</p>
              </div>
              <button
                onClick={() => setCreateModalOpen(false)}
                className="p-1 rounded-lg text-[#94a3b8] hover:text-[#0f172a] hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEvent} className="p-6 space-y-4 overflow-y-auto flex-1">
              <div>
                <label className="text-xs font-semibold text-[#0f172a] block mb-1">Event Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. AI Innovation Summit 2025"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#e9e4ff] text-sm focus:outline-none focus:ring-2 focus:ring-[#7c3aed]/30 focus:border-[#7c3aed]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-[#0f172a] block mb-1">Category</label>
                  <select
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#e9e4ff] text-sm bg-white focus:outline-none focus:border-[#7c3aed]"
                  >
                    <option value="Conference">Conference</option>
                    <option value="Workshop">Workshop</option>
                    <option value="Networking">Networking</option>
                    <option value="Concert">Concert</option>
                    <option value="Webinar">Webinar</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-[#0f172a] block mb-1">Event Format</label>
                  <select
                    value={form.eventType}
                    onChange={(e) => setForm({ ...form, eventType: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#e9e4ff] text-sm bg-white focus:outline-none focus:border-[#7c3aed]"
                  >
                    <option value="in-person">In-Person Venue</option>
                    <option value="virtual">Virtual / Online</option>
                    <option value="hybrid">Hybrid</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-[#0f172a] block mb-1">Venue Name / Location</label>
                  <input
                    type="text"
                    placeholder="e.g. Convention Center or Zoom"
                    value={form.venueName}
                    onChange={(e) => setForm({ ...form, venueName: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#e9e4ff] text-sm focus:outline-none focus:border-[#7c3aed]"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-[#0f172a] block mb-1">Venue Address / Virtual URL</label>
                  <input
                    type="text"
                    placeholder="Address or Meeting Link"
                    value={form.venueAddress || form.virtualLink}
                    onChange={(e) => setForm({ ...form, venueAddress: e.target.value, virtualLink: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#e9e4ff] text-sm focus:outline-none focus:border-[#7c3aed]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="text-xs font-semibold text-[#0f172a] block mb-1">Start Date *</label>
                  <input
                    type="date"
                    required
                    value={form.startDate}
                    onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-[#e9e4ff] text-xs focus:outline-none focus:border-[#7c3aed]"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-[#0f172a] block mb-1">Start Time</label>
                  <input
                    type="time"
                    value={form.startTime}
                    onChange={(e) => setForm({ ...form, startTime: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-[#e9e4ff] text-xs focus:outline-none focus:border-[#7c3aed]"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-[#0f172a] block mb-1">Ticket Price ($)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0 for free"
                    value={form.price}
                    onChange={(e) => setForm({ ...form, price: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 rounded-xl border border-[#e9e4ff] text-xs focus:outline-none focus:border-[#7c3aed]"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-[#0f172a] block mb-1">Capacity</label>
                  <input
                    type="number"
                    min="1"
                    value={form.capacity}
                    onChange={(e) => setForm({ ...form, capacity: parseInt(e.target.value, 10) || 500 })}
                    className="w-full px-3 py-2 rounded-xl border border-[#e9e4ff] text-xs focus:outline-none focus:border-[#7c3aed]"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-[#0f172a] block mb-1">Description</label>
                <textarea
                  rows={3}
                  placeholder="Provide an overview of the event agenda, keynote speakers, or perks..."
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#e9e4ff] text-sm focus:outline-none focus:border-[#7c3aed] resize-none"
                />
              </div>

              <div className="pt-3 border-t border-[#e9e4ff] flex justify-end gap-3">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setCreateModalOpen(false)}
                  className="rounded-xl border-[#e9e4ff]"
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  className="bg-[#7c3aed] hover:bg-[#6d28d9] text-white rounded-xl shadow-md"
                >
                  {editEvent ? 'Save Changes' : 'Publish Event'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ATTENDEES MODAL */}
      {attendeesModalEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-3xl rounded-2xl shadow-2xl border border-[#e9e4ff] overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-[#e9e4ff] flex items-center justify-between bg-[#faf8ff]">
              <div>
                <h3 className="font-bold text-lg text-[#0f172a]">
                  Attendees: {attendeesModalEvent.title}
                </h3>
                <p className="text-xs text-[#64748b]">
                  {attendees.length} registered participant{attendees.length !== 1 ? 's' : ''}
                </p>
              </div>
              <button
                onClick={() => setAttendeesModalEvent(null)}
                className="p-1 rounded-lg text-[#94a3b8] hover:text-[#0f172a] hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6 overflow-y-auto flex-1">
              {/* Quick Add Attendee / Walk-in */}
              <div className="bg-[#faf8ff] p-4 rounded-xl border border-[#e9e4ff]">
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#7c3aed] mb-3">
                  + Register On-Site / Walk-in Attendee
                </h4>
                <form onSubmit={handleAddAttendee} className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                  <input
                    type="text"
                    required
                    placeholder="Full Name"
                    value={newAttendee.name}
                    onChange={(e) => setNewAttendee({ ...newAttendee, name: e.target.value })}
                    className="px-3 py-2 rounded-xl border border-[#e9e4ff] text-xs bg-white focus:outline-none focus:border-[#7c3aed]"
                  />
                  <input
                    type="email"
                    required
                    placeholder="Email"
                    value={newAttendee.email}
                    onChange={(e) => setNewAttendee({ ...newAttendee, email: e.target.value })}
                    className="px-3 py-2 rounded-xl border border-[#e9e4ff] text-xs bg-white focus:outline-none focus:border-[#7c3aed]"
                  />
                  <input
                    type="text"
                    placeholder="Phone"
                    value={newAttendee.phone}
                    onChange={(e) => setNewAttendee({ ...newAttendee, phone: e.target.value })}
                    className="px-3 py-2 rounded-xl border border-[#e9e4ff] text-xs bg-white focus:outline-none focus:border-[#7c3aed]"
                  />
                  <Button
                    type="submit"
                    disabled={submittingAttendee}
                    className="bg-[#7c3aed] hover:bg-[#6d28d9] text-white rounded-xl text-xs h-9"
                  >
                    {submittingAttendee ? 'Adding...' : 'Issue Ticket'}
                  </Button>
                </form>
              </div>

              {/* Attendees List */}
              {attendeesLoading ? (
                <div className="py-12 text-center text-sm text-[#64748b]">
                  Loading registered attendees...
                </div>
              ) : attendees.length === 0 ? (
                <div className="text-center py-10 border border-dashed border-[#e9e4ff] rounded-xl">
                  <Ticket className="w-8 h-8 text-[#94a3b8] mx-auto mb-2" />
                  <p className="text-sm font-semibold text-[#0f172a]">No Attendees Registered Yet</p>
                  <p className="text-xs text-[#64748b] mt-1">Register walk-in attendees above or share your event link.</p>
                </div>
              ) : (
                <div className="border border-[#e9e4ff] rounded-xl overflow-hidden shadow-sm">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#f5f3ff] border-b border-[#e9e4ff] text-[#475569] font-bold">
                      <tr>
                        <th className="p-3">Attendee</th>
                        <th className="p-3">Email & Phone</th>
                        <th className="p-3">Ticket Code</th>
                        <th className="p-3">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#e9e4ff]">
                      {attendees.map((att) => (
                        <tr key={att.id} className="hover:bg-[#faf8ff] transition-colors">
                          <td className="p-3 font-semibold text-[#0f172a]">
                            {att.name}
                          </td>
                          <td className="p-3 text-[#64748b]">
                            <div>{att.email}</div>
                            {att.phone && <div className="text-[11px] text-[#94a3b8]">{att.phone}</div>}
                          </td>
                          <td className="p-3 font-mono text-[11px] text-[#7c3aed] font-semibold">
                            {att.ticket_code}
                          </td>
                          <td className="p-3">
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                              <CheckCircle className="w-3 h-3" />
                              {att.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="px-6 py-3 border-t border-[#e9e4ff] bg-[#faf8ff] flex justify-end">
              <Button
                variant="outline"
                onClick={() => setAttendeesModalEvent(null)}
                className="rounded-xl border-[#e9e4ff]"
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
