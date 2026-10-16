import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
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
  X,
  Camera,
  ExternalLink,
  Copy,
  Check,
  IdCard
} from 'lucide-react';
import AttendanceScannerModal from '@/components/AttendanceScannerModal';
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
  const [scannerModalEvent, setScannerModalEvent] = useState<any | null>(null);
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [attendees, setAttendees] = useState<any[]>([]);
  const [attendeesLoading, setAttendeesLoading] = useState(false);

  // New Attendee Form in Modal
  const [newAttendee, setNewAttendee] = useState({ 
    name: '', 
    email: '', 
    phone: '', 
    ticketType: 'General Admission',
    organization: '',
    designation: ''
  });
  const [submittingAttendee, setSubmittingAttendee] = useState(false);

  // Form State
  const [form, setForm] = useState({
    title: '',
    category: 'Conference',
    eventType: 'in-person',
    format: 'in-person',
    type: 'Conference',
    country: 'Pakistan',
    city: 'Nawabshah',
    venueName: '',
    venueAddress: '',
    virtualLink: '',
    startDate: '',
    startTime: '09:00',
    endDate: '',
    endTime: '17:00',
    price: 0,
    pricePkr: 0,
    currency: 'USD',
    capacity: 500,
    description: '',
    organizerName: '',
    organizerEmail: '',
    organizerPhone: '',
    organizerBio: '',
    refundPolicy: 'Full 100% refund available up to 7 days before event start.',
    cancellationPolicy: 'In case of postponement or cancellation, all tickets are automatically refunded.',
    bannerImage: ''
  });

  // Real-time notification banner state
  const [realtimeNotification, setRealtimeNotification] = useState<string | null>(null);

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

  // Real-Time Cross-Tab & Polling Attendee Synchronization
  useEffect(() => {
    let bc: BroadcastChannel | null = null;
    try {
      if (typeof BroadcastChannel !== 'undefined') {
        bc = new BroadcastChannel('eventorax_realtime_events');
        bc.onmessage = (msg) => {
          if (msg.data && msg.data.type === 'NEW_ATTENDEE_REGISTERED') {
            const { eventTitle, attendee, eventId } = msg.data;
            setRealtimeNotification(`🎉 Live Update: ${attendee.name} applied for "${eventTitle}"!`);
            setTimeout(() => setRealtimeNotification(null), 5000);
            
            // Silently refresh events list
            api.events.list({
              search: search || undefined,
              category: selectedCategory !== 'All' ? selectedCategory : undefined,
              status: selectedStatus !== 'All' ? selectedStatus : undefined,
            }).then((res) => {
              if (res.success && res.events) setEvents(res.events);
            }).catch(() => {});

            // If attendee modal is open for this event, refresh attendees
            if (attendeesModalEvent && attendeesModalEvent.id === eventId) {
              api.events.getAttendees(eventId).then((r) => {
                if (r.success) setAttendees(r.attendees || []);
              }).catch(() => {});
            }
          }
        };
      }
    } catch {}

    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'evx_realtime_sync' && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          setRealtimeNotification(`🎉 Live Update: ${parsed.attendeeName} registered for "${parsed.eventTitle}"!`);
          setTimeout(() => setRealtimeNotification(null), 5000);
          loadEvents();
        } catch {}
      }
    };
    window.addEventListener('storage', handleStorage);

    // Continuous 4-second polling heartbeat to ensure multi-device real-time sync
    const interval = setInterval(() => {
      api.events.list({
        search: search || undefined,
        category: selectedCategory !== 'All' ? selectedCategory : undefined,
        status: selectedStatus !== 'All' ? selectedStatus : undefined,
      }).then((res) => {
        if (res.success && res.events) {
          setEvents(res.events);
        }
      }).catch(() => {});

      if (attendeesModalEvent?.id) {
        api.events.getAttendees(attendeesModalEvent.id).then((res) => {
          if (res.success && res.attendees) {
            setAttendees(res.attendees);
          }
        }).catch(() => {});
      }
    }, 4000);

    return () => {
      if (bc) bc.close();
      window.removeEventListener('storage', handleStorage);
      clearInterval(interval);
    };
  }, [attendeesModalEvent, search, selectedCategory, selectedStatus]);

  const handleOpenCreate = () => {
    setEditEvent(null);
    setForm({
      title: '',
      category: 'Conference',
      eventType: 'in-person',
      format: 'in-person',
      type: 'Conference',
      country: 'Pakistan',
      city: 'Nawabshah',
      venueName: '',
      venueAddress: '',
      virtualLink: '',
      startDate: new Date().toISOString().split('T')[0],
      startTime: '09:00',
      endDate: '',
      endTime: '17:00',
      price: 0,
      pricePkr: 0,
      currency: 'USD',
      capacity: 500,
      description: '',
      organizerName: 'EventoraX Organization',
      organizerEmail: 'events@eventorax.com',
      organizerPhone: '+92 300 1234567',
      organizerBio: 'Verified event organizer delivering premier hybrid summits.',
      refundPolicy: 'Full refund available up to 7 days before event start.',
      cancellationPolicy: 'Full automatic refund if event is rescheduled or canceled.',
      bannerImage: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=1200&q=80'
    });
    setCreateModalOpen(true);
  };

  const handleOpenEdit = (event: any) => {
    setEditEvent(event);
    setForm({
      title: event.title || '',
      category: event.category || 'Conference',
      eventType: event.event_type || 'in-person',
      format: event.format || event.event_type || 'in-person',
      type: event.type || 'Conference',
      country: event.country || 'Pakistan',
      city: event.city || 'Nawabshah',
      venueName: event.venue_name || '',
      venueAddress: event.venue_address || '',
      virtualLink: event.virtual_link || '',
      startDate: event.start_date ? event.start_date.split('T')[0] : '',
      startTime: event.start_time || '09:00',
      endDate: event.end_date ? event.end_date.split('T')[0] : '',
      endTime: event.end_time || '17:00',
      price: event.price || 0,
      pricePkr: event.price_pkr || Math.round((event.price || 0) * 280),
      currency: event.currency || 'USD',
      capacity: event.capacity || 500,
      description: event.description || '',
      organizerName: event.organizer_name || '',
      organizerEmail: event.organizer_email || '',
      organizerPhone: event.organizer_phone || '',
      organizerBio: event.organizer_bio || '',
      refundPolicy: event.refund_policy || '',
      cancellationPolicy: event.cancellation_policy || '',
      bannerImage: event.banner_image || ''
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
        const updated = await api.events.getAttendees(attendeesModalEvent.id);
        setAttendees(updated.attendees || []);
        setNewAttendee({ 
          name: '', 
          email: '', 
          phone: '', 
          ticketType: 'General Admission',
          organization: '',
          designation: ''
        });
        loadEvents();
      }
    } catch (err: any) {
      alert(err.message || 'Failed to register attendee.');
    } finally {
      setSubmittingAttendee(false);
    }
  };

  const handleCopyPublicLink = (slug: string, id: number) => {
    const url = `${window.location.origin}/e/${slug}`;
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const categories = ['All', 'Conference', 'Workshop', 'Networking', 'Webinar', 'Other'];
  const statuses = ['All', 'upcoming', 'ongoing', 'completed', 'cancelled'];

  return (
    <div className="min-h-screen pb-16">
      <Header title="Events Management" />

      <div className="p-6 space-y-6 max-w-7xl mx-auto">
        {/* Real-time live update notification banner */}
        {realtimeNotification && (
          <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-800 dark:text-emerald-300 px-4 py-3 rounded-2xl flex items-center justify-between shadow-xs animate-in fade-in slide-in-from-top-2 duration-300">
            <div className="flex items-center gap-2.5">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </span>
              <span className="text-sm font-semibold">{realtimeNotification}</span>
            </div>
            <button 
              onClick={() => setRealtimeNotification(null)}
              className="text-xs text-emerald-700 hover:text-emerald-900 font-bold ml-4"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Actions Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-[#0f172a] font-heading">Your Organized Events</h2>
            <p className="text-sm text-[#64748b]">Publish events, scan QR check-in badges, and view public landing pages</p>
          </div>
          <div className="flex items-center gap-2">
            <Link to="/dashboard/id-cards">
              <Button 
                variant="outline"
                className="rounded-xl border-[#e9e4ff] text-[#1d4ed8] hover:bg-blue-50 flex items-center gap-2 h-11 px-4 text-xs font-bold"
              >
                <IdCard className="w-4 h-4" />
                ID Cards Hub
              </Button>
            </Link>
            <Button 
              onClick={handleOpenCreate}
              className="bg-[#1d4ed8] hover:bg-[#1e40af] text-white rounded-xl shadow-lg shadow-blue-600/25 flex items-center gap-2 h-11 px-5 text-xs font-bold"
            >
              <Plus className="w-4 h-4" />
              Create & Publish Event
            </Button>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#94a3b8]" />
            <input
              type="text"
              placeholder="Search events by title, description, or venue..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 bg-slate-50 text-sm text-[#0f172a] focus:outline-none focus:ring-2 focus:ring-[#1d4ed8]/30 focus:border-[#1d4ed8] transition-all"
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
                    ? 'bg-[#1d4ed8] text-white shadow-xs'
                    : 'bg-slate-100 text-[#64748b] hover:text-[#1d4ed8]'
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
              className="px-3 py-2 rounded-xl border border-slate-300 bg-white text-xs font-medium text-[#0f172a] focus:outline-none focus:border-[#1d4ed8]"
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
            <div className="w-8 h-8 border-3 border-[#1d4ed8] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-sm text-[#64748b]">Loading events from database...</p>
          </div>
        ) : events.length === 0 ? (
          <div className="bg-white rounded-3xl border border-dashed border-slate-300 p-12 text-center">
            <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center text-[#1d4ed8] mx-auto mb-4">
              <CalendarIcon className="w-7 h-7" />
            </div>
            <h3 className="text-lg font-bold text-[#0f172a] mb-1">No Events Found</h3>
            <p className="text-sm text-[#64748b] max-w-sm mx-auto mb-6">
              {search || selectedCategory !== 'All' 
                ? 'No events match your current filter criteria. Try clearing search filters.'
                : 'You have not created any events yet. Click below to publish your first event!'}
            </p>
            <Button onClick={handleOpenCreate} className="bg-[#1d4ed8] hover:bg-[#1e40af] text-white rounded-xl">
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
                  className="border-slate-200 hover:border-blue-400 shadow-xs hover:shadow-xl hover:shadow-blue-600/10 transition-all duration-300 flex flex-col justify-between overflow-hidden group bg-white rounded-3xl"
                >
                  <CardContent className="p-6 space-y-4">
                    {/* Header badge & price */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5">
                        <Badge className="bg-blue-50 text-[#1d4ed8] border border-blue-200 font-semibold text-xs">
                          {ev.category}
                        </Badge>
                        <Badge variant="outline" className="text-[10px] text-slate-500 capitalize">
                          {ev.format || ev.event_type || 'In-Person'}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-1.5 font-bold text-sm text-[#0f172a]">
                        {isFree ? (
                          <span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-lg text-xs">FREE</span>
                        ) : (
                          <span className="bg-blue-50 text-[#1d4ed8] px-2.5 py-0.5 rounded-lg border border-blue-200 text-xs font-bold">
                            ${ev.price} {ev.price_pkr ? `/ PKR ${ev.price_pkr.toLocaleString()}` : ''}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Title & Description */}
                    <div>
                      <h3 className="font-heading font-bold text-lg text-[#0f172a] group-hover:text-[#1d4ed8] transition-colors line-clamp-1">
                        {ev.title}
                      </h3>
                      <p className="text-xs text-[#64748b] mt-1.5 line-clamp-2 leading-relaxed">
                        {ev.description || 'No description provided for this event.'}
                      </p>
                    </div>

                    {/* Meta info */}
                    <div className="space-y-2 pt-2 border-t border-slate-100 text-xs text-[#475569]">
                      <div className="flex items-center gap-2">
                        <CalendarIcon className="w-3.5 h-3.5 text-[#1d4ed8]" />
                        <span>
                          {ev.start_date ? new Date(ev.start_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : 'Date TBD'} 
                          {ev.start_time && ` • ${ev.start_time}`}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 truncate">
                        <MapPin className="w-3.5 h-3.5 text-[#1d4ed8] shrink-0" />
                        <span className="truncate">
                          {ev.venue_name || (ev.event_type === 'virtual' ? 'Virtual Online Event' : 'Venue TBA')}
                        </span>
                      </div>
                    </div>

                    {/* Capacity Progress */}
                    <div className="space-y-1.5 pt-1">
                      <div className="flex justify-between text-xs font-medium">
                        <span className="text-[#64748b] flex items-center gap-1">
                          <Users className="w-3 h-3 text-[#1d4ed8]" />
                          Attendees
                        </span>
                        <span className="text-[#0f172a] font-bold">
                          {ev.registered_count} / {ev.capacity}
                        </span>
                      </div>
                      <Progress value={attendeesPercent} className="h-2 bg-slate-100" />
                    </div>

                    {/* Fast Actions Bar: Public Page + QR Check-in */}
                    <div className="pt-2 flex items-center justify-between gap-1.5">
                      {/* View Public Page Link */}
                      <a
                        href={`/e/${ev.slug}`}
                        target="_blank"
                        rel="noreferrer"
                        className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-blue-50 text-[#1d4ed8] text-[11px] font-bold flex items-center gap-1 transition-colors"
                        title="Open Public Event Landing Page"
                      >
                        <ExternalLink className="w-3 h-3" />
                        Public Page
                      </a>

                      {/* Copy Notice Link */}
                      <button
                        onClick={() => handleCopyPublicLink(ev.slug, ev.id)}
                        className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-bold flex items-center gap-1 transition-colors"
                        title="Copy Public Notice URL"
                      >
                        {copiedId === ev.id ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                        {copiedId === ev.id ? 'Copied' : 'Share'}
                      </button>

                      {/* Live QR Scanner Button */}
                      <button
                        onClick={() => setScannerModalEvent(ev)}
                        className="px-2.5 py-1.5 rounded-lg bg-blue-50 hover:bg-[#1d4ed8] text-[#1d4ed8] hover:text-white text-[11px] font-bold flex items-center gap-1 transition-colors"
                        title="Open Live Camera QR Scanner"
                      >
                        <Camera className="w-3 h-3" />
                        QR Check-in
                      </button>
                    </div>

                    {/* Footer Actions */}
                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleOpenAttendees(ev)}
                        className="text-xs bg-slate-50 text-slate-800 border-slate-200 hover:bg-[#1d4ed8] hover:text-white rounded-lg flex items-center gap-1.5"
                      >
                        <Ticket className="w-3.5 h-3.5" />
                        Attendees ({ev.registered_count})
                      </Button>

                      <div className="flex items-center gap-1">
                        <Link to="/dashboard/id-cards" title="Generate ID Badges">
                          <button className="p-2 rounded-lg text-slate-500 hover:text-[#1d4ed8] hover:bg-blue-50 transition-colors">
                            <IdCard className="w-4 h-4" />
                          </button>
                        </Link>
                        <button
                          onClick={() => handleOpenEdit(ev)}
                          title="Edit Event"
                          className="p-2 rounded-lg text-slate-500 hover:text-[#1d4ed8] hover:bg-blue-50 transition-colors"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteEvent(ev.id, ev.title)}
                          title="Delete Event"
                          className="p-2 rounded-lg text-slate-500 hover:text-red-600 hover:bg-red-50 transition-colors"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-3xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div>
                <h3 className="font-bold text-lg text-slate-900 font-heading">
                  {editEvent ? 'Edit Event Details' : 'Create & Publish New Event'}
                </h3>
                <p className="text-xs text-slate-500">
                  Configure complete event metadata, sponsors, dual PKR/USD pricing, and location
                </p>
              </div>
              <button
                onClick={() => setCreateModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-900 hover:bg-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEvent} className="p-6 space-y-5 overflow-y-auto flex-1 text-xs">
              {/* Event Title */}
              <div>
                <label className="font-bold text-slate-800 block mb-1">Event Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. South Asia AI & Web Developers Summit 2026"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Event Category, Format, & Type */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="font-bold text-slate-800 block mb-1">Category</label>
                  <select
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white"
                  >
                    <option value="Conference">Conference</option>
                    <option value="Workshop">Workshop</option>
                    <option value="Networking">Networking</option>
                    <option value="Webinar">Webinar</option>
                    <option value="Summit">Summit</option>
                    <option value="Hackathon">Hackathon</option>
                    <option value="Gala">Gala / Awards</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-800 block mb-1">Event Format</label>
                  <select
                    value={form.eventType}
                    onChange={(e) => setForm({ ...form, eventType: e.target.value, format: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white"
                  >
                    <option value="in-person">In-Person Physical Venue</option>
                    <option value="virtual">Virtual / Online Broadcast</option>
                    <option value="hybrid">Hybrid (Both Venue + Virtual)</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-800 block mb-1">Event Type</label>
                  <select
                    value={form.type}
                    onChange={(e) => setForm({ ...form, type: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white"
                  >
                    <option value="Conference">Conference</option>
                    <option value="Seminar">Seminar</option>
                    <option value="Webinar">Webinar</option>
                    <option value="Workshop">Workshop</option>
                    <option value="Hackathon">Hackathon</option>
                    <option value="Gala">Gala</option>
                    <option value="Expo">Expo / Showcase</option>
                  </select>
                </div>
              </div>

              {/* Location: Country, City, Venue Name & Address */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-800 block mb-1">Country</label>
                  <input
                    type="text"
                    placeholder="e.g. Pakistan, United States, UAE"
                    value={form.country}
                    onChange={(e) => setForm({ ...form, country: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-800 block mb-1">City</label>
                  <input
                    type="text"
                    placeholder="e.g. Islamabad, Lahore, Karachi, Dubai"
                    value={form.city}
                    onChange={(e) => setForm({ ...form, city: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-800 block mb-1">Venue Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Jinnah Convention Centre or Zoom Hall"
                    value={form.venueName}
                    onChange={(e) => setForm({ ...form, venueName: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-800 block mb-1">Street Address / Virtual Link</label>
                  <input
                    type="text"
                    placeholder="Address or https://zoom.us/..."
                    value={form.venueAddress || form.virtualLink}
                    onChange={(e) => setForm({ ...form, venueAddress: e.target.value, virtualLink: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white"
                  />
                </div>
              </div>

              {/* Date, Time, Capacity, Dual Pricing */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                <div>
                  <label className="font-bold text-slate-800 block mb-1">Start Date *</label>
                  <input
                    type="date"
                    required
                    value={form.startDate}
                    onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                    className="w-full px-2.5 py-2 rounded-xl border border-slate-300 text-xs"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-800 block mb-1">Start Time</label>
                  <input
                    type="time"
                    value={form.startTime}
                    onChange={(e) => setForm({ ...form, startTime: e.target.value })}
                    className="w-full px-2.5 py-2 rounded-xl border border-slate-300 text-xs"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-800 block mb-1">Price (USD $)</label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    placeholder="0 = Free"
                    value={form.price}
                    onChange={(e) => setForm({ ...form, price: parseFloat(e.target.value) || 0 })}
                    className="w-full px-2.5 py-2 rounded-xl border border-slate-300 text-xs"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-800 block mb-1">Price (PKR Rs)</label>
                  <input
                    type="number"
                    min="0"
                    step="100"
                    placeholder="0 = Free"
                    value={form.pricePkr}
                    onChange={(e) => setForm({ ...form, pricePkr: parseFloat(e.target.value) || 0 })}
                    className="w-full px-2.5 py-2 rounded-xl border border-slate-300 text-xs"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-800 block mb-1">Capacity</label>
                  <input
                    type="number"
                    min="1"
                    value={form.capacity}
                    onChange={(e) => setForm({ ...form, capacity: parseInt(e.target.value, 10) || 500 })}
                    className="w-full px-2.5 py-2 rounded-xl border border-slate-300 text-xs"
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="font-bold text-slate-800 block mb-1">Event Description & Highlights</label>
                <textarea
                  rows={3}
                  placeholder="Provide an overview of the event, keynotes, perks, and learning objectives..."
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs resize-none"
                />
              </div>

              {/* Organizer Information */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                <span className="font-bold text-slate-900 block">Organizer Profile Details</span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="text-[11px] text-slate-600 block mb-1">Organizer Name</label>
                    <input
                      type="text"
                      placeholder="e.g. TechVentures Pakistan"
                      value={form.organizerName}
                      onChange={(e) => setForm({ ...form, organizerName: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-slate-600 block mb-1">Organizer Email</label>
                    <input
                      type="email"
                      placeholder="events@techventures.pk"
                      value={form.organizerEmail}
                      onChange={(e) => setForm({ ...form, organizerEmail: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-slate-600 block mb-1">Organizer Phone</label>
                    <input
                      type="text"
                      placeholder="+92 300 1234567"
                      value={form.organizerPhone}
                      onChange={(e) => setForm({ ...form, organizerPhone: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white"
                    />
                  </div>
                </div>
              </div>

              {/* Policies: Cancellation & Refund */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-800 block mb-1">Refund Policy Notice</label>
                  <input
                    type="text"
                    placeholder="e.g. 100% refund up to 7 days before event start"
                    value={form.refundPolicy}
                    onChange={(e) => setForm({ ...form, refundPolicy: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-800 block mb-1">Cancellation Policy Notice</label>
                  <input
                    type="text"
                    placeholder="e.g. In case of cancellation, all tickets refunded"
                    value={form.cancellationPolicy}
                    onChange={(e) => setForm({ ...form, cancellationPolicy: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
                  />
                </div>
              </div>

              {/* Modal Buttons */}
              <div className="pt-3 border-t border-slate-200 flex justify-end gap-3">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setCreateModalOpen(false)}
                  className="rounded-xl border-slate-300 text-xs"
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  className="bg-[#1d4ed8] hover:bg-[#1e40af] text-white rounded-xl text-xs font-bold px-6"
                >
                  {editEvent ? 'Save Changes' : 'Publish Event Live'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ATTENDEES MODAL */}
      {attendeesModalEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-3xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div>
                <h3 className="font-bold text-lg text-slate-900 font-heading">
                  Attendees: {attendeesModalEvent.title}
                </h3>
                <p className="text-xs text-slate-500">
                  {attendees.length} registered participant{attendees.length !== 1 ? 's' : ''}
                </p>
              </div>
              <button
                onClick={() => setAttendeesModalEvent(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-900 hover:bg-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6 overflow-y-auto flex-1">
              {/* Quick Add Attendee / Walk-in */}
              <div className="bg-blue-50/60 p-4 rounded-2xl border border-blue-200">
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#1d4ed8] mb-3">
                  + Register On-Site / Walk-in Attendee
                </h4>
                <form onSubmit={handleAddAttendee} className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                  <input
                    type="text"
                    required
                    placeholder="Full Name"
                    value={newAttendee.name}
                    onChange={(e) => setNewAttendee({ ...newAttendee, name: e.target.value })}
                    className="px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white"
                  />
                  <input
                    type="email"
                    required
                    placeholder="Email"
                    value={newAttendee.email}
                    onChange={(e) => setNewAttendee({ ...newAttendee, email: e.target.value })}
                    className="px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white"
                  />
                  <input
                    type="text"
                    placeholder="Phone"
                    value={newAttendee.phone}
                    onChange={(e) => setNewAttendee({ ...newAttendee, phone: e.target.value })}
                    className="px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white"
                  />
                  <Button
                    type="submit"
                    disabled={submittingAttendee}
                    className="bg-[#1d4ed8] hover:bg-[#1e40af] text-white rounded-xl text-xs h-9 font-bold"
                  >
                    {submittingAttendee ? 'Adding...' : 'Issue Pass'}
                  </Button>
                </form>
              </div>

              {/* Attendees List */}
              {attendeesLoading ? (
                <div className="py-12 text-center text-sm text-slate-500">
                  Loading registered attendees...
                </div>
              ) : attendees.length === 0 ? (
                <div className="text-center py-10 border border-dashed border-slate-300 rounded-2xl">
                  <Ticket className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                  <p className="text-sm font-semibold text-slate-900">No Attendees Registered Yet</p>
                  <p className="text-xs text-slate-500 mt-1">Register walk-in attendees above or share your event link.</p>
                </div>
              ) : (
                <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold">
                      <tr>
                        <th className="p-3">Attendee</th>
                        <th className="p-3">Email & Phone</th>
                        <th className="p-3">Ticket Code</th>
                        <th className="p-3">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {attendees.map((att) => (
                        <tr key={att.id} className="hover:bg-slate-50 transition-colors">
                          <td className="p-3 font-semibold text-slate-900">
                            {att.name}
                          </td>
                          <td className="p-3 text-slate-600">
                            <div>{att.email}</div>
                            {att.phone && <div className="text-[11px] text-slate-400">{att.phone}</div>}
                          </td>
                          <td className="p-3 font-mono text-[11px] text-[#1d4ed8] font-bold">
                            {att.ticket_code}
                          </td>
                          <td className="p-3">
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
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

            <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 flex justify-end">
              <Button
                variant="outline"
                onClick={() => setAttendeesModalEvent(null)}
                className="rounded-xl border-slate-300 text-xs"
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* LIVE CAMERA QR SCANNER MODAL */}
      {scannerModalEvent && (
        <AttendanceScannerModal
          isOpen={!!scannerModalEvent}
          onClose={() => setScannerModalEvent(null)}
          event={scannerModalEvent}
          onAttendeeUpdated={loadEvents}
        />
      )}
    </div>
  );
}
