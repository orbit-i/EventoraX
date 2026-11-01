import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Calendar, 
  MapPin, 
  Ticket, 
  Search, 
  Sparkles, 
  Building, 
  CheckCircle2, 
  ChevronRight,
  ShieldCheck,
  Clock,
  ChevronDown,
  ChevronUp,
  Copy,
  Check,
  Video,
  Image as ImageIcon
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { 
  SadaPayBadge,
  NayaPayBadge
} from '@/components/payment/PaymentLogos';

export interface DirectoryEvent {
  id: number;
  title: string;
  organizer_name: string;
  category: string;
  event_type: string;
  start_date: string;
  end_date: string;
  location: string;
  city: string;
  banner_url: string;
  video_url?: string;
  videos?: string | string[];
  gallery_images?: string | string[];
  is_official?: number;
  description: string;
  agenda?: string | any[];
  speakers?: string | any[];
  ticket_tiers?: string | any[];
  contact_email?: string;
  contact_phone?: string;
  is_approved?: number;
  is_featured?: number;
  views_count?: number;
}

interface TicketTier {
  id: string;
  name: string;
  price_pkr: number;
  price_usd: number;
  perks: string[];
  available: number;
  sold: number;
}

export default function EventsDirectory() {
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const initialQuery = searchParams.get('search') || '';

  const [events, setEvents] = useState<DirectoryEvent[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedCity, setSelectedCity] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>(initialQuery);
  const [timeFilter, setTimeFilter] = useState<'all' | 'upcoming' | 'running' | 'past'>('all');
  const [expandedDescMap, setExpandedDescMap] = useState<Record<number, boolean>>({});
  const [detailsEvent, setDetailsEvent] = useState<DirectoryEvent | null>(null);

  // Booking Modal State
  const [bookingEvent, setBookingEvent] = useState<DirectoryEvent | null>(null);
  const [selectedTier, setSelectedTier] = useState<TicketTier | null>(null);
  const [attendeeName, setAttendeeName] = useState('');
  const [attendeeEmail, setAttendeeEmail] = useState('');
  const [attendeePhone, setAttendeePhone] = useState('');
  const [attendeeOrg, setAttendeeOrg] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'sadapay' | 'nayapay'>('sadapay');
  const [transactionId, setTransactionId] = useState('');
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState<any | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Merchant accounts info state (SadaPay & NayaPay ONLY)
  const [gateways, setGateways] = useState<any>({
    sadapay: { 
      account_title: 'ORBIT-I Private Limited', 
      account_number: '03190375751', 
      iban: 'PK03SADA0000003190375751' 
    },
    nayapay: { 
      account_title: 'ORBIT-I Private Limited', 
      account_number: '03190375751', 
      nayapay_id: 'orbit-i@nayapay' 
    }
  });

  useEffect(() => {
    fetchDirectoryEvents();
    fetchGateways();
  }, []);

  const fetchDirectoryEvents = async () => {
    try {
      const res = await fetch('/api/directory-events');
      if (res.ok) {
        const data = await res.json();
        setEvents(data.events || []);
      } else {
        setEvents([]);
      }
    } catch {
      setEvents([]);
    }
  };

  const fetchGateways = async () => {
    try {
      const res = await fetch('/api/public/merchant-gateways');
      if (res.ok) {
        const data = await res.json();
        if (data.gateways) setGateways(data.gateways);
      }
    } catch {}
  };

  const parseTiers = (tiersData: any): TicketTier[] => {
    if (!tiersData) return [];
    if (Array.isArray(tiersData)) return tiersData;
    try {
      const parsed = JSON.parse(tiersData);
      if (Array.isArray(parsed)) return parsed;
    } catch {}
    return [];
  };

  const getEventTimingStatus = (startDate: string, endDate?: string) => {
    const now = new Date();
    const start = new Date(startDate);
    const end = new Date(endDate || startDate);
    // If end date is missing or same as start, treat duration as 6 hours
    const effectiveEnd = (endDate && endDate !== startDate) 
      ? end 
      : new Date(start.getTime() + 6 * 60 * 60 * 1000);

    if (start <= now && effectiveEnd >= now) {
      return { status: 'running', label: 'Running / Ongoing Now', badgeClass: 'bg-emerald-500 text-white animate-pulse' };
    } else if (start > now) {
      return { status: 'upcoming', label: 'Upcoming Event', badgeClass: 'bg-blue-600 text-white' };
    } else {
      return { status: 'past', label: 'Past Event', badgeClass: 'bg-slate-600 text-white' };
    }
  };

  const upcomingCount = events.filter(e => getEventTimingStatus(e.start_date, e.end_date).status === 'upcoming').length;
  const runningCount = events.filter(e => getEventTimingStatus(e.start_date, e.end_date).status === 'running').length;
  const pastCount = events.filter(e => getEventTimingStatus(e.start_date, e.end_date).status === 'past').length;

  const filteredEvents = events.filter(e => {
    const matchesCat = selectedCategory === 'All' || (e.category || '').toLowerCase().includes(selectedCategory.toLowerCase());
    const matchesCity = selectedCity === 'All' || (e.city || '').toLowerCase().includes(selectedCity.toLowerCase());
    const matchesSearch = !searchQuery || 
      (e.title || '').toLowerCase().includes(searchQuery.toLowerCase()) || 
      (e.organizer_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (e.location || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (e.description || '').toLowerCase().includes(searchQuery.toLowerCase());

    const timing = getEventTimingStatus(e.start_date, e.end_date);
    const matchesTime = timeFilter === 'all' || timing.status === timeFilter;

    return matchesCat && matchesCity && matchesSearch && matchesTime;
  });

  const toggleExpandDesc = (id: number) => {
    setExpandedDescMap(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const openBookingModal = (event: DirectoryEvent) => {
    const tiers = parseTiers(event.ticket_tiers);
    setBookingEvent(event);
    setSelectedTier(tiers[0] || null);
    setBookingSuccess(null);
    setTransactionId('');
  };

  const handleCopy = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleBookTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookingEvent || !selectedTier) return;
    if (!attendeeName || !attendeeEmail || !attendeePhone) {
      alert('Please fill in your name, email, and mobile number.');
      return;
    }
    if (selectedTier.price_pkr > 0 && !transactionId.trim()) {
      alert('Please enter your Transaction ID (TID) from your SadaPay or NayaPay receipt to confirm your ticket.');
      return;
    }

    try {
      setBookingLoading(true);
      const res = await fetch(`/api/directory-events/${bookingEvent.id}/book`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tier_id: selectedTier.id,
          attendee_name: attendeeName,
          attendee_email: attendeeEmail,
          attendee_phone: attendeePhone,
          attendee_org: attendeeOrg,
          payment_method: paymentMethod,
          transaction_id: transactionId.trim().toUpperCase()
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setBookingSuccess(data.booking);
      } else {
        alert(data.message || 'Booking submission failed. Please try again.');
      }
    } catch {
      alert('Network error while processing booking. Please try again.');
    } finally {
      setBookingLoading(false);
    }
  };

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString('en-PK', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      });
    } catch {
      return dateStr;
    }
  };

  const formatDateTime = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleString('en-PK', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit'
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="min-h-screen bg-[#faf8ff] pb-24">
      {/* Hero Header */}
      <section className="relative pt-20 pb-14 overflow-hidden bg-gradient-to-b from-white via-[#f5f3ff] to-[#faf8ff] border-b border-[#e9e4ff]">
        <div className="content-max relative z-10 text-center max-w-4xl mx-auto px-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#ede9fe] text-[#7c3aed] text-xs font-bold uppercase tracking-wider mb-5">
            <Sparkles className="w-3.5 h-3.5" />
            Verified &amp; Admin-Approved Events
          </div>

          <h1 className="font-heading text-4xl sm:text-5xl font-black text-[#0f172a] tracking-tight leading-tight">
            Discover Tech Summits, Medical Seminars &amp;{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#7c3aed] to-[#2563eb]">
              Executive Masterclasses
            </span>
          </h1>

          <p className="mt-4 text-base sm:text-lg text-[#64748b] max-w-2xl mx-auto">
            Browse upcoming, running, and past conferences. Book delegate passes securely with SadaPay &amp; NayaPay digital payment rails.
          </p>

          {/* Search & Quick Filter Bar */}
          <div className="mt-10 bg-white p-3 rounded-2xl border border-[#e9e4ff] shadow-lg shadow-[#7c3aed]/5 flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-[#94a3b8] absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search event title, organizer or keywords..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#f8fafc] border border-transparent focus:border-[#7c3aed] focus:bg-white text-sm outline-none transition-all"
              />
            </div>

            <div className="flex gap-2">
              <select
                value={selectedCity}
                onChange={(e) => setSelectedCity(e.target.value)}
                className="px-3.5 py-2.5 rounded-xl bg-[#f8fafc] border border-transparent text-xs sm:text-sm font-semibold text-[#334155] outline-none"
              >
                <option value="All">All Cities</option>
                <option value="Islamabad">Islamabad</option>
                <option value="Karachi">Karachi</option>
                <option value="Lahore">Lahore</option>
                <option value="Rawalpindi">Rawalpindi</option>
                <option value="Peshawar">Peshawar</option>
                <option value="Nawabshah">Nawabshah</option>
              </select>

              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-3.5 py-2.5 rounded-xl bg-[#f8fafc] border border-transparent text-xs sm:text-sm font-semibold text-[#334155] outline-none"
              >
                <option value="All">All Categories</option>
                <option value="Technology">Technology &amp; AI</option>
                <option value="Medical">Medical &amp; Healthcare</option>
                <option value="FinTech">FinTech &amp; Banking</option>
                <option value="CyberSecurity">CyberSecurity</option>
                <option value="Education">Education &amp; Academic</option>
              </select>
            </div>
          </div>
        </div>
      </section>

      {/* VIP Organizer Showcase Banner */}
      <div className="content-max px-4 mt-8">
        <div className="bg-gradient-to-r from-[#1e1b4b] via-[#2e1065] to-[#0f172a] rounded-2xl p-4 sm:p-5 text-white flex flex-col sm:flex-row items-center justify-between gap-4 shadow-lg shadow-purple-950/20 border border-purple-500/25">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0 border border-amber-400/30">
              <Sparkles className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <div className="font-heading text-sm sm:text-base font-bold flex items-center gap-2">
                <span>Organizing an upcoming conference or workshop?</span>
                <span className="hidden sm:inline-block text-[10px] uppercase font-black px-2 py-0.5 rounded-full bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950">
                  Verified Showcase
                </span>
              </div>
              <p className="text-xs text-purple-200/80 mt-0.5">
                List your event details &amp; ticket price. Admin reviews and approves your submission with direct SadaPay &amp; NayaPay payouts.
              </p>
            </div>
          </div>
          <Link
            to="/list-event"
            className="shrink-0 px-4 py-2 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-bold text-xs shadow-md transition-all flex items-center gap-1.5"
          >
            <span>List Your Event</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* Events Listing Area */}
      <div className="content-max px-4 mt-8">
        {/* Time Status Tabs: All, Upcoming, Running, Past */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6 pb-3 border-b border-slate-200/80">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setTimeFilter('all')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                timeFilter === 'all'
                  ? 'bg-[#7c3aed] text-white shadow-sm'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              All Events ({events.length})
            </button>
            <button
              type="button"
              onClick={() => setTimeFilter('upcoming')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                timeFilter === 'upcoming'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              Upcoming Events ({upcomingCount})
            </button>
            <button
              type="button"
              onClick={() => setTimeFilter('running')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                timeFilter === 'running'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Running / Ongoing ({runningCount})
            </button>
            <button
              type="button"
              onClick={() => setTimeFilter('past')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                timeFilter === 'past'
                  ? 'bg-slate-700 text-white shadow-sm'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              Past Events ({pastCount})
            </button>
          </div>

          <div className="text-xs text-[#64748b] font-medium flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            Verified tickets with instant QR validation
          </div>
        </div>

        {filteredEvents.length === 0 ? (
          <div className="bg-white rounded-3xl p-10 md:p-14 text-center border border-slate-200/80 shadow-sm max-w-2xl mx-auto my-12">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-100 to-blue-100 text-purple-700 flex items-center justify-center mx-auto mb-5 shadow-xs">
              <Calendar className="w-8 h-8 text-[#7c3aed]" />
            </div>
            <h3 className="font-heading text-2xl font-bold text-slate-900 mb-2">
              No Events Found in this Filter
            </h3>
            <p className="font-body text-sm text-slate-600 max-w-md mx-auto leading-relaxed mb-6">
              There are currently no events matching the selected timing or search category. You can list your event now with instant attendee registration and verified SadaPay/NayaPay payment rails.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <Link
                to="/list-event"
                className="px-5 py-2.5 rounded-xl bg-[#7c3aed] hover:bg-[#6d28d9] text-white font-bold text-xs shadow-md shadow-[#7c3aed]/25 flex items-center gap-1.5 transition-all"
              >
                <Sparkles className="w-4 h-4 text-amber-300" />
                Submit Your Event
              </Link>
              <button
                type="button"
                onClick={() => { setTimeFilter('all'); setSelectedCategory('All'); setSelectedCity('All'); setSearchQuery(''); }}
                className="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-all"
              >
                Reset Filters
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredEvents.map((evt) => {
              const tiers = parseTiers(evt.ticket_tiers);
              const minPrice = tiers.length > 0 ? Math.min(...tiers.map(t => t.price_pkr)) : 0;
              const isVip = Number(evt.is_featured) === 1;
              const timing = getEventTimingStatus(evt.start_date, evt.end_date);
              const isDescExpanded = !!expandedDescMap[evt.id];

              return (
                <div
                  key={evt.id}
                  className={`bg-white rounded-3xl transition-all duration-300 overflow-hidden flex flex-col group ${
                    isVip
                      ? 'border-2 border-amber-400/80 shadow-lg shadow-amber-500/10 ring-2 ring-amber-400/20'
                      : 'border border-[#e9e4ff] shadow-sm hover:shadow-xl hover:shadow-[#7c3aed]/10'
                  }`}
                >
                  {/* Banner */}
                  <div className="relative h-48 overflow-hidden bg-slate-100">
                    <img
                      src={evt.banner_url}
                      alt={evt.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/25 to-transparent" />
                    
                    <div className="absolute top-3 left-3 flex flex-wrap gap-1.5 z-10">
                      {Boolean(evt.is_official) && (
                        <span className="px-2.5 py-1 rounded-full bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white text-[10px] font-black uppercase tracking-wider flex items-center gap-1 shadow-md border border-white/20">
                          <ShieldCheck className="w-3 h-3 text-cyan-200" />
                          Official Event
                        </span>
                      )}
                      {isVip && (
                        <span className="px-2.5 py-1 rounded-full bg-gradient-to-r from-amber-500 to-amber-600 text-white text-[10px] font-black uppercase tracking-wider flex items-center gap-1 shadow-md">
                          <Sparkles className="w-3 h-3 text-amber-200 animate-pulse" />
                          Featured Spotlight
                        </span>
                      )}
                      {(evt.video_url || (Array.isArray(evt.videos) && evt.videos.length > 0)) && (
                        <span className="px-2 py-0.5 rounded-full bg-purple-950/80 backdrop-blur-md text-purple-200 text-[10px] font-bold flex items-center gap-1 border border-purple-500/30">
                          <Video className="w-2.5 h-2.5 text-purple-300" />
                          Video
                        </span>
                      )}
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold shadow-xs ${timing.badgeClass}`}>
                        {timing.label}
                      </span>
                      <span className="px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md text-white text-[11px] font-bold">
                        {evt.category}
                      </span>
                    </div>

                    <div className="absolute bottom-3 left-3 right-3 text-white flex items-center justify-between">
                      <div className="text-xs font-semibold text-[#c4b5fd] flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        {formatDate(evt.start_date)}
                      </div>
                      <div className="text-[11px] text-slate-300 font-medium">
                        {evt.city}
                      </div>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-5 flex-1 flex flex-col">
                    <div className="text-xs font-bold text-[#64748b] flex items-center gap-1 mb-1">
                      <Building className="w-3.5 h-3.5 text-[#7c3aed]" />
                      {evt.organizer_name}
                    </div>

                    <h3 className="font-heading text-lg font-bold text-[#0f172a] leading-snug mb-2">
                      {evt.title}
                    </h3>

                    <div className="text-xs text-[#64748b] flex items-center gap-1.5 mb-3">
                      <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                      <span className="truncate">{evt.location}</span>
                    </div>

                    {/* Expandable / Readable Full Description */}
                    <div className="mb-4">
                      <p className={`text-xs text-[#475569] leading-relaxed ${isDescExpanded ? '' : 'line-clamp-2'}`}>
                        {evt.description}
                      </p>
                      {evt.description && evt.description.length > 90 && (
                        <button
                          type="button"
                          onClick={() => toggleExpandDesc(evt.id)}
                          className="mt-1 text-[11px] font-bold text-[#7c3aed] hover:text-[#6d28d9] inline-flex items-center gap-0.5"
                        >
                          {isDescExpanded ? (
                            <>Show less <ChevronUp className="w-3 h-3" /></>
                          ) : (
                            <>Read full description <ChevronDown className="w-3 h-3" /></>
                          )}
                        </button>
                      )}
                    </div>

                    {/* Tier Pricing Badge & Actions */}
                    <div className="mt-auto pt-4 border-t border-[#f1edff] flex items-center justify-between gap-2">
                      <div>
                        <div className="text-[10px] uppercase font-bold text-[#94a3b8]">Passes from</div>
                        <div className="text-sm font-black text-[#0f172a]">
                          PKR {minPrice.toLocaleString()}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setDetailsEvent(evt)}
                          className="h-8 px-2.5 rounded-xl text-xs font-semibold border-slate-200 hover:bg-slate-50"
                        >
                          Details
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => openBookingModal(evt)}
                          className="h-8 px-3.5 rounded-xl bg-[#7c3aed] text-white hover:bg-[#6d28d9] font-bold text-xs flex items-center gap-1.5 shadow-md shadow-[#7c3aed]/20"
                        >
                          <Ticket className="w-3.5 h-3.5" />
                          Book Ticket
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Event Details Modal */}
      {detailsEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-[#e9e4ff] shadow-2xl p-6 sm:p-8">
            <div className="flex items-center justify-between pb-4 border-b border-[#f1edff]">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#7c3aed]">
                  {detailsEvent.category} &bull; {detailsEvent.event_type}
                </span>
                <h3 className="text-xl font-bold text-[#0f172a] mt-0.5">{detailsEvent.title}</h3>
                <div className="text-xs text-slate-500 mt-1 flex items-center gap-1.5">
                  <Building className="w-3.5 h-3.5 text-[#7c3aed]" />
                  <span>Organized by <strong>{detailsEvent.organizer_name}</strong></span>
                </div>
              </div>
              <button
                onClick={() => setDetailsEvent(null)}
                className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 flex items-center justify-center font-bold"
              >
                ✕
              </button>
            </div>

            <div className="mt-4 space-y-4">
              {Boolean(detailsEvent.is_official) && (
                <div className="p-3 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white flex items-center justify-between gap-3 shadow-md">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-cyan-300 shrink-0" />
                    <div>
                      <div className="text-xs font-black uppercase tracking-wider">Official Platform Event</div>
                      <div className="text-[11px] text-blue-100">Organized &amp; Endorsed by Eventrye / ORBIT-I for All</div>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-white/20 text-white text-[10px] font-bold uppercase tracking-wider">
                    Verified Host
                  </span>
                </div>
              )}

              <img
                src={detailsEvent.banner_url}
                alt={detailsEvent.title}
                className="w-full h-52 object-cover rounded-2xl border border-slate-200"
              />

              {/* Video Player in Details Modal */}
              {Boolean(detailsEvent.video_url || (Array.isArray(detailsEvent.videos) && detailsEvent.videos.length > 0)) && (() => {
                const vid = detailsEvent.video_url || (Array.isArray(detailsEvent.videos) ? detailsEvent.videos[0] : '');
                const isDirect = vid.endsWith('.mp4') || vid.endsWith('.webm') || vid.includes('/uploads/videos/');
                return (
                  <div className="p-3 rounded-2xl bg-slate-950 text-white border border-slate-800 space-y-2">
                    <span className="text-[11px] font-bold text-indigo-300 uppercase tracking-wider flex items-center gap-1.5">
                      <Video className="w-3.5 h-3.5" /> Event Promo / Teaser Video
                    </span>
                    <div className="rounded-xl overflow-hidden bg-black">
                      {isDirect ? (
                        <video src={vid} controls className="w-full max-h-[220px] object-contain bg-black" />
                      ) : (
                        <div className="aspect-video w-full">
                          <iframe
                            src={vid.includes('youtube.com/watch?v=') ? vid.replace('watch?v=', 'embed/') : vid}
                            title="Event Video"
                            allowFullScreen
                            className="w-full h-full border-0"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                );
              })()}

              {/* Photo Gallery in Details Modal */}
              {Boolean(detailsEvent.gallery_images && (Array.isArray(detailsEvent.gallery_images) ? detailsEvent.gallery_images.length > 0 : JSON.parse(detailsEvent.gallery_images || '[]').length > 0)) && (() => {
                const imgs = Array.isArray(detailsEvent.gallery_images) ? detailsEvent.gallery_images : JSON.parse(detailsEvent.gallery_images as string || '[]');
                return (
                  <div className="space-y-2">
                    <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                      <ImageIcon className="w-3.5 h-3.5 text-blue-600" /> Photo Gallery &amp; Venue Shots
                    </span>
                    <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                      {imgs.map((src: string, i: number) => (
                        <a key={i} href={src} target="_blank" rel="noreferrer" className="aspect-square rounded-xl overflow-hidden border border-slate-200 hover:border-purple-500 transition-all">
                          <img src={src} alt={`Venue ${i}`} className="w-full h-full object-cover" />
                        </a>
                      ))}
                    </div>
                  </div>
                );
              })()}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-slate-50 p-4 rounded-2xl border border-slate-100">
                <div className="flex items-center gap-2 text-slate-700">
                  <Calendar className="w-4 h-4 text-[#7c3aed]" />
                  <span><strong>Starts:</strong> {formatDateTime(detailsEvent.start_date)}</span>
                </div>
                <div className="flex items-center gap-2 text-slate-700">
                  <Clock className="w-4 h-4 text-[#7c3aed]" />
                  <span><strong>Ends:</strong> {formatDateTime(detailsEvent.end_date)}</span>
                </div>
                <div className="sm:col-span-2 flex items-center gap-2 text-slate-700">
                  <MapPin className="w-4 h-4 text-rose-500 shrink-0" />
                  <span><strong>Venue:</strong> {detailsEvent.location}, {detailsEvent.city}</span>
                </div>
              </div>

              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 mb-2">
                  Full Description &amp; Event Scope
                </h4>
                <div className="text-xs sm:text-sm text-slate-600 leading-relaxed whitespace-pre-line bg-white p-4 rounded-2xl border border-slate-100">
                  {detailsEvent.description}
                </div>
              </div>

              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 mb-2">
                  Available Ticket Tiers
                </h4>
                <div className="space-y-2">
                  {parseTiers(detailsEvent.ticket_tiers).map((tier) => (
                    <div key={tier.id} className="p-3 rounded-xl border border-slate-200 flex items-center justify-between text-xs">
                      <div>
                        <div className="font-bold text-slate-900">{tier.name}</div>
                        <div className="text-[11px] text-slate-500">{tier.perks.join(' • ')}</div>
                      </div>
                      <div className="font-black text-[#7c3aed] text-sm">
                        PKR {tier.price_pkr.toLocaleString()}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => setDetailsEvent(null)}
                  className="rounded-xl px-4 text-xs"
                >
                  Close
                </Button>
                <Button
                  onClick={() => {
                    const evt = detailsEvent;
                    setDetailsEvent(null);
                    openBookingModal(evt);
                  }}
                  className="rounded-xl bg-[#7c3aed] hover:bg-[#6d28d9] text-white px-5 text-xs font-bold"
                >
                  <Ticket className="w-3.5 h-3.5 mr-1" />
                  Proceed to Book Ticket
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Booking / Checkout Modal (SadaPay & NayaPay ONLY) */}
      {bookingEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-xl w-full max-h-[92vh] overflow-y-auto border border-[#e9e4ff] shadow-2xl p-6 sm:p-8">
            <div className="flex items-center justify-between pb-4 border-b border-[#f1edff]">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#7c3aed]">Verified Ticket Registration</span>
                <h3 className="text-lg font-bold text-[#0f172a] mt-0.5">{bookingEvent.title}</h3>
              </div>
              <button
                onClick={() => setBookingEvent(null)}
                className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 flex items-center justify-center font-bold"
              >
                ✕
              </button>
            </div>

            {bookingSuccess ? (
              /* Success Screen */
              <div className="py-8 text-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-10 h-10" />
                </div>
                <h3 className="text-2xl font-black text-[#0f172a]">Registration Confirmed!</h3>
                <p className="text-xs sm:text-sm text-[#475569] max-w-sm mx-auto">
                  Your ticket has been registered. Present this reference code at the registration gate for your instant ID pass.
                </p>

                <div className="p-4 rounded-2xl bg-[#f8fafc] border border-slate-200 text-left max-w-md mx-auto space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Booking Reference:</span>
                    <span className="font-mono font-bold text-[#7c3aed]">{bookingSuccess.booking_ref}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Attendee Name:</span>
                    <span className="font-bold text-slate-900">{bookingSuccess.attendee_name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Ticket Pass:</span>
                    <span className="font-bold text-slate-900">{bookingSuccess.tier_name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Amount Paid:</span>
                    <span className="font-bold text-emerald-700">PKR {Number(bookingSuccess.amount_pkr || 0).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Payment Gateway:</span>
                    <span className="font-bold uppercase text-slate-700">{bookingSuccess.payment_method}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Security Ticket Code:</span>
                    <span className="font-mono font-bold text-blue-700">{bookingSuccess.ticket_code}</span>
                  </div>
                </div>

                <div className="pt-2">
                  <Button
                    onClick={() => setBookingEvent(null)}
                    className="w-full py-2.5 rounded-xl bg-[#7c3aed] text-white font-bold text-xs"
                  >
                    Done &amp; Close
                  </Button>
                </div>
              </div>
            ) : (
              /* Booking Form */
              <form onSubmit={handleBookTicket} className="mt-5 space-y-5">
                {/* 1. Select Ticket Tier */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                    1. Select Ticket Tier
                  </label>
                  <div className="grid grid-cols-1 gap-2.5">
                    {parseTiers(bookingEvent.ticket_tiers).map((tier) => (
                      <div
                        key={tier.id}
                        onClick={() => setSelectedTier(tier)}
                        className={`p-3.5 rounded-2xl border cursor-pointer transition-all ${
                          selectedTier?.id === tier.id
                            ? 'border-[#7c3aed] bg-[#fcfaff] ring-2 ring-[#7c3aed]/20 shadow-sm'
                            : 'border-slate-200 hover:border-slate-300 bg-white'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="font-bold text-sm text-slate-900">{tier.name}</div>
                          <div className="text-sm font-black text-[#7c3aed]">PKR {tier.price_pkr.toLocaleString()}</div>
                        </div>
                        <div className="mt-1 flex flex-wrap gap-1.5">
                          {tier.perks.map((p, idx) => (
                            <span key={idx} className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md">
                              ✓ {p}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 2. Attendee Information */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                    2. Attendee Credentials
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <input
                      type="text"
                      placeholder="Full Name *"
                      required
                      value={attendeeName}
                      onChange={(e) => setAttendeeName(e.target.value)}
                      className="px-3.5 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm outline-none focus:border-[#7c3aed]"
                    />
                    <input
                      type="email"
                      placeholder="Email Address *"
                      required
                      value={attendeeEmail}
                      onChange={(e) => setAttendeeEmail(e.target.value)}
                      className="px-3.5 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm outline-none focus:border-[#7c3aed]"
                    />
                    <input
                      type="tel"
                      placeholder="Mobile / WhatsApp (03xx) *"
                      required
                      value={attendeePhone}
                      onChange={(e) => setAttendeePhone(e.target.value)}
                      className="px-3.5 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm outline-none focus:border-[#7c3aed]"
                    />
                    <input
                      type="text"
                      placeholder="Organization / University"
                      value={attendeeOrg}
                      onChange={(e) => setAttendeeOrg(e.target.value)}
                      className="px-3.5 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm outline-none focus:border-[#7c3aed]"
                    />
                  </div>
                </div>

                {/* 3. Official Payment Gateway (SadaPay & NayaPay ONLY) */}
                {selectedTier && selectedTier.price_pkr > 0 && (
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                      3. Pay with SadaPay or NayaPay (ORBIT-I Official Accounts)
                    </label>

                    {/* Method Selector */}
                    <div className="grid grid-cols-2 gap-3 mb-3">
                      <button
                        type="button"
                        onClick={() => setPaymentMethod('sadapay')}
                        className={`p-3 rounded-2xl border text-center transition-all flex items-center justify-center gap-2 ${
                          paymentMethod === 'sadapay'
                            ? 'border-[#00A389] bg-teal-50 text-teal-900 font-bold ring-2 ring-[#00A389]/30 shadow-sm'
                            : 'border-slate-200 text-slate-600 hover:border-teal-300'
                        }`}
                      >
                        <SadaPayBadge className="w-5 h-5" />
                        <span className="text-xs font-bold">SadaPay</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setPaymentMethod('nayapay')}
                        className={`p-3 rounded-2xl border text-center transition-all flex items-center justify-center gap-2 ${
                          paymentMethod === 'nayapay'
                            ? 'border-[#FF5C00] bg-orange-50 text-orange-900 font-bold ring-2 ring-[#FF5C00]/30 shadow-sm'
                            : 'border-slate-200 text-slate-600 hover:border-orange-300'
                        }`}
                      >
                        <NayaPayBadge className="w-5 h-5" />
                        <span className="text-xs font-bold">NayaPay</span>
                      </button>
                    </div>

                    {/* Instruction Box */}
                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-2">
                      {paymentMethod === 'sadapay' && (
                        <>
                          <div className="font-bold text-teal-800 flex items-center justify-between">
                            <span>SadaPay Account / Mobile:</span>
                            <span className="font-mono text-sm">{gateways.sadapay?.account_number || '03190375751'}</span>
                          </div>
                          <div className="text-slate-600">
                            Account Title: <strong>{gateways.sadapay?.account_title || 'ORBIT-I Private Limited'}</strong>
                          </div>
                          <div className="text-slate-600">
                            IBAN: <span className="font-mono text-[11px]">{gateways.sadapay?.iban || 'PK03SADA0000003190375751'}</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleCopy(gateways.sadapay?.account_number || '03190375751', 'sadapay_num')}
                            className="inline-flex items-center gap-1 text-[11px] font-bold text-teal-700 bg-teal-100/60 px-2.5 py-1 rounded-lg"
                          >
                            {copiedField === 'sadapay_num' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                            {copiedField === 'sadapay_num' ? 'Number Copied!' : 'Copy SadaPay Number'}
                          </button>
                        </>
                      )}

                      {paymentMethod === 'nayapay' && (
                        <>
                          <div className="font-bold text-orange-800 flex items-center justify-between">
                            <span>NayaPay ID / Mobile:</span>
                            <span className="font-mono text-sm">{gateways.nayapay?.nayapay_id || 'orbit-i@nayapay'}</span>
                          </div>
                          <div className="text-slate-600">
                            Account Title: <strong>{gateways.nayapay?.account_title || 'ORBIT-I Private Limited'}</strong>
                          </div>
                          <div className="text-slate-600">
                            Mobile #: <span className="font-mono text-[11px]">{gateways.nayapay?.account_number || '03190375751'}</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleCopy(gateways.nayapay?.nayapay_id || 'orbit-i@nayapay', 'nayapay_id')}
                            className="inline-flex items-center gap-1 text-[11px] font-bold text-orange-700 bg-orange-100/60 px-2.5 py-1 rounded-lg"
                          >
                            {copiedField === 'nayapay_id' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                            {copiedField === 'nayapay_id' ? 'ID Copied!' : 'Copy NayaPay ID'}
                          </button>
                        </>
                      )}

                      <p className="text-slate-500 text-[11px] pt-1 border-t border-slate-200/80">
                        Transfer <strong>PKR {selectedTier.price_pkr.toLocaleString()}</strong> to the account above, then enter the Transaction ID (TID) from your banking receipt below.
                      </p>
                    </div>

                    <div className="mt-3">
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Transaction ID (TID) / Reference Number *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. SADA-119922 or NAYA-887766"
                        value={transactionId}
                        onChange={(e) => setTransactionId(e.target.value)}
                        className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm font-mono uppercase font-bold outline-none focus:border-[#7c3aed]"
                      />
                    </div>
                  </div>
                )}

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                  <div className="text-xs text-slate-500">
                    Total: <strong className="text-slate-900 text-sm">PKR {selectedTier?.price_pkr?.toLocaleString() || 0}</strong>
                  </div>
                  <Button
                    type="submit"
                    disabled={bookingLoading}
                    className="px-5 py-2.5 rounded-xl bg-[#7c3aed] text-white hover:bg-[#6d28d9] font-bold text-xs shadow-md shadow-[#7c3aed]/20"
                  >
                    {bookingLoading ? 'Registering...' : 'Confirm Ticket Registration'}
                  </Button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
