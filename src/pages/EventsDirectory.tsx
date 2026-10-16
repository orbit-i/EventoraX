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
  ShieldCheck
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { 
  EasypaisaBadge, 
  JazzCashBadge, 
  RaastBadge, 
  BankTransferBadge
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

  // Booking Modal State
  const [bookingEvent, setBookingEvent] = useState<DirectoryEvent | null>(null);
  const [selectedTier, setSelectedTier] = useState<TicketTier | null>(null);
  const [attendeeName, setAttendeeName] = useState('');
  const [attendeeEmail, setAttendeeEmail] = useState('');
  const [attendeePhone, setAttendeePhone] = useState('');
  const [attendeeOrg, setAttendeeOrg] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'easypaisa' | 'jazzcash' | 'raast' | 'bank' | 'card'>('easypaisa');
  const [transactionId, setTransactionId] = useState('');
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState<any | null>(null);

  // Merchant accounts info state
  const [gateways, setGateways] = useState<any>({
    easypaisa: { account_title: 'ORBIT-I Private Limited', account_number: '03190375751' },
    jazzcash: { account_title: 'ORBIT-I Private Limited', account_number: '03001234567', till_id: 'JC-ORBIT-8899' },
    raast: { account_title: 'ORBIT-I Private Limited', raast_id: '03190375751', iban: 'PK45MEZN0001234567890101' },
    bank_transfer: { bank_name: 'Meezan Bank Limited', account_title: 'ORBIT-I Private Limited', account_number: '01020304050607', iban: 'PK45MEZN0001234567890101' }
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

  const filteredEvents = events.filter(e => {
    const matchesCat = selectedCategory === 'All' || e.category.toLowerCase().includes(selectedCategory.toLowerCase());
    const matchesCity = selectedCity === 'All' || e.city.toLowerCase().includes(selectedCity.toLowerCase());
    const matchesSearch = !searchQuery || 
      e.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
      e.organizer_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.location.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesCity && matchesSearch;
  });

  const openBookingModal = (event: DirectoryEvent) => {
    const tiers = parseTiers(event.ticket_tiers);
    setBookingEvent(event);
    setSelectedTier(tiers[0] || null);
    setBookingSuccess(null);
    setTransactionId('');
  };

  const handleBookTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookingEvent || !selectedTier) return;
    if (!attendeeName || !attendeeEmail || !attendeePhone) {
      alert('Please fill in your name, email, and mobile number.');
      return;
    }
    if (selectedTier.price_pkr > 0 && !transactionId) {
      alert('Please enter the Transaction ID (TID) from your banking receipt to confirm your ticket pass.');
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
          transaction_id: transactionId
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

  return (
    <div className="min-h-screen bg-[#faf8ff] pb-24">
      {/* Hero Header */}
      <section className="relative pt-20 pb-14 overflow-hidden bg-gradient-to-b from-white via-[#f5f3ff] to-[#faf8ff] border-b border-[#e9e4ff]">
        <div className="content-max relative z-10 text-center max-w-4xl mx-auto px-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#ede9fe] text-[#7c3aed] text-xs font-bold uppercase tracking-wider mb-5">
            <Sparkles className="w-3.5 h-3.5" />
            Verified 3rd-Party Events & Seminars
          </div>

          <h1 className="font-heading text-4xl sm:text-5xl font-black text-[#0f172a] tracking-tight leading-tight">
            Discover Tech Summits, Medical Seminars &{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#7c3aed] to-[#2563eb]">
              Executive Masterclasses
            </span>
          </h1>

          <p className="mt-4 text-base sm:text-lg text-[#64748b] max-w-2xl mx-auto">
            Browse upcoming conferences powered by EventoraX. Book delegate passes with verified Pakistani payment rails: Easypaisa, JazzCash, Raast & Meezan Bank.
          </p>

          {/* Search & Quick Filter Bar */}
          <div className="mt-10 bg-white p-3 rounded-2xl border border-[#e9e4ff] shadow-lg shadow-[#7c3aed]/5 flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-[#94a3b8] absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search event title, organizer or topic..."
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
              </select>

              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-3.5 py-2.5 rounded-xl bg-[#f8fafc] border border-transparent text-xs sm:text-sm font-semibold text-[#334155] outline-none"
              >
                <option value="All">All Categories</option>
                <option value="Technology">Technology & AI</option>
                <option value="Medical">Medical & Healthcare</option>
                <option value="FinTech">FinTech & Banking</option>
                <option value="CyberSecurity">CyberSecurity</option>
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
                <span>Organizing an upcoming conference or seminar?</span>
                <span className="hidden sm:inline-block text-[10px] uppercase font-black px-2 py-0.5 rounded-full bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950">
                  VIP Showcase
                </span>
              </div>
              <p className="text-xs text-purple-200/80 mt-0.5">
                Feature your event to thousands of attendees, sell passes via verified Pakistani payment rails &amp; get instant payouts.
              </p>
            </div>
          </div>
          <Link
            to="/list-event"
            className="shrink-0 px-4 py-2 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-bold text-xs shadow-md transition-all flex items-center gap-1.5"
          >
            <span>List Your Event (+ VIP)</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* Events Listing */}
      <div className="content-max px-4 mt-10">
        <div className="flex items-center justify-between mb-6">
          <div className="text-sm font-bold text-[#334155]">
            Showing <span className="text-[#7c3aed]">{filteredEvents.length}</span> Upcoming Events
          </div>
          <div className="text-xs text-[#64748b] font-medium flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            All passes issued with tamper-evident QR code
          </div>
        </div>

        {filteredEvents.length === 0 ? (
          <div className="bg-white rounded-3xl p-10 md:p-14 text-center border border-slate-200/80 shadow-sm max-w-2xl mx-auto my-12">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-100 to-blue-100 text-purple-700 flex items-center justify-center mx-auto mb-5 shadow-xs">
              <Calendar className="w-8 h-8 text-[#7c3aed]" />
            </div>
            <h3 className="font-heading text-2xl font-bold text-slate-900 mb-2">
              No Public Events Listed Yet
            </h3>
            <p className="font-body text-sm text-slate-600 max-w-md mx-auto leading-relaxed mb-6">
              All demo and placeholder events have been removed. Are you organizing a summit, conference, or workshop? Publish your event with instant attendee registration, dynamic QR passes, and verified local payment rails.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <Link
                to="/list-event"
                className="px-6 py-3 rounded-xl bg-[#7c3aed] hover:bg-[#6d28d9] text-white font-bold text-sm shadow-md shadow-[#7c3aed]/25 flex items-center gap-2 transition-all hover:-translate-y-0.5"
              >
                <Sparkles className="w-4 h-4 text-amber-300" />
                List Your Event (+ VIP Showcase)
              </Link>
              <Link
                to="/"
                className="px-6 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm transition-all"
              >
                Back to Home
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredEvents.map((evt) => {
            const tiers = parseTiers(evt.ticket_tiers);
            const minPrice = tiers.length > 0 ? Math.min(...tiers.map(t => t.price_pkr)) : 0;
            const isVip = evt.is_featured === 1;

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
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                  
                  <div className="absolute top-3 left-3 flex flex-wrap gap-1.5 z-10">
                    {isVip && (
                      <span className="px-2.5 py-1 rounded-full bg-gradient-to-r from-amber-500 to-amber-600 text-white text-[10px] font-black uppercase tracking-wider flex items-center gap-1 shadow-md">
                        <Sparkles className="w-3 h-3 text-amber-200 animate-pulse" />
                        VIP Spotlight
                      </span>
                    )}
                    <span className="px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md text-white text-[11px] font-bold">
                      {evt.category}
                    </span>
                    <span className="px-2.5 py-1 rounded-full bg-[#7c3aed] text-white text-[11px] font-bold">
                      {evt.event_type}
                    </span>
                  </div>

                  <div className="absolute bottom-3 left-3 right-3 text-white">
                    <div className="text-xs font-semibold text-[#c4b5fd] flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      {formatDate(evt.start_date)}
                    </div>
                  </div>
                </div>

                {/* Content */}
                <div className="p-5 flex-1 flex flex-col">
                  <div className="text-xs font-bold text-[#64748b] flex items-center gap-1 mb-1">
                    <Building className="w-3.5 h-3.5 text-[#7c3aed]" />
                    {evt.organizer_name}
                  </div>

                  <h3 className="font-heading text-lg font-bold text-[#0f172a] leading-snug line-clamp-2 mb-2">
                    {evt.title}
                  </h3>

                  <div className="text-xs text-[#64748b] flex items-center gap-1.5 mb-3">
                    <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                    <span className="truncate">{evt.location}</span>
                  </div>

                  <p className="text-xs text-[#475569] leading-relaxed line-clamp-2 mb-4">
                    {evt.description}
                  </p>

                  {/* Tier Pricing Badge & Actions */}
                  <div className="mt-auto pt-4 border-t border-[#f1edff] flex items-center justify-between">
                    <div>
                      <div className="text-[10px] uppercase font-bold text-[#94a3b8]">Passes from</div>
                      <div className="text-sm font-black text-[#0f172a]">
                        PKR {minPrice.toLocaleString()}
                      </div>
                    </div>

                    <Button
                      onClick={() => openBookingModal(evt)}
                      className="px-4 py-2 rounded-xl bg-[#7c3aed] text-white hover:bg-[#6d28d9] font-bold text-xs flex items-center gap-1.5 shadow-md shadow-[#7c3aed]/20"
                    >
                      <Ticket className="w-3.5 h-3.5" />
                      Get Tickets
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        )}
      </div>

      {/* Booking / Checkout Modal */}
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
                    <span className="text-slate-500">Ticket Pass Code:</span>
                    <span className="font-mono font-bold text-slate-900">{bookingSuccess.ticket_code}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Attendee:</span>
                    <span className="font-bold text-slate-800">{bookingSuccess.attendee_name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Tier:</span>
                    <span className="font-bold text-slate-800">{bookingSuccess.tier_name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Amount Paid:</span>
                    <span className="font-bold text-emerald-600">PKR {bookingSuccess.amount_pkr.toLocaleString()}</span>
                  </div>
                </div>

                <div className="pt-4">
                  <Button
                    onClick={() => setBookingEvent(null)}
                    className="w-full py-3 rounded-xl bg-[#7c3aed] text-white font-bold text-sm"
                  >
                    Done & Close
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
                      className="px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm outline-none focus:border-[#7c3aed]"
                    />
                    <input
                      type="email"
                      placeholder="Email Address *"
                      required
                      value={attendeeEmail}
                      onChange={(e) => setAttendeeEmail(e.target.value)}
                      className="px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm outline-none focus:border-[#7c3aed]"
                    />
                    <input
                      type="tel"
                      placeholder="Mobile / WhatsApp (03xx) *"
                      required
                      value={attendeePhone}
                      onChange={(e) => setAttendeePhone(e.target.value)}
                      className="px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm outline-none focus:border-[#7c3aed]"
                    />
                    <input
                      type="text"
                      placeholder="Organization / University"
                      value={attendeeOrg}
                      onChange={(e) => setAttendeeOrg(e.target.value)}
                      className="px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm outline-none focus:border-[#7c3aed]"
                    />
                  </div>
                </div>

                {/* 3. Official Merchant Payment Gateway Details */}
                {selectedTier && selectedTier.price_pkr > 0 && (
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                      3. Pay via Official Pakistani Gateway (ORBIT-I Merchant Accounts)
                    </label>

                    {/* Method Selector Tabs */}
                    <div className="grid grid-cols-4 gap-2 mb-3">
                      <button
                        type="button"
                        onClick={() => setPaymentMethod('easypaisa')}
                        className={`p-2 rounded-xl border text-center transition-all ${
                          paymentMethod === 'easypaisa'
                            ? 'border-emerald-600 bg-emerald-50 text-emerald-800 font-bold'
                            : 'border-slate-200 text-slate-600'
                        }`}
                      >
                        <EasypaisaBadge className="w-5 h-5 mx-auto mb-1" />
                        <span className="text-[10px] block">Easypaisa</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setPaymentMethod('jazzcash')}
                        className={`p-2 rounded-xl border text-center transition-all ${
                          paymentMethod === 'jazzcash'
                            ? 'border-red-600 bg-red-50 text-red-800 font-bold'
                            : 'border-slate-200 text-slate-600'
                        }`}
                      >
                        <JazzCashBadge className="w-5 h-5 mx-auto mb-1" />
                        <span className="text-[10px] block">JazzCash</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setPaymentMethod('raast')}
                        className={`p-2 rounded-xl border text-center transition-all ${
                          paymentMethod === 'raast'
                            ? 'border-emerald-700 bg-emerald-50 text-emerald-900 font-bold'
                            : 'border-slate-200 text-slate-600'
                        }`}
                      >
                        <RaastBadge className="w-5 h-5 mx-auto mb-1" />
                        <span className="text-[10px] block">Raast</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setPaymentMethod('bank')}
                        className={`p-2 rounded-xl border text-center transition-all ${
                          paymentMethod === 'bank'
                            ? 'border-blue-700 bg-blue-50 text-blue-900 font-bold'
                            : 'border-slate-200 text-slate-600'
                        }`}
                      >
                        <BankTransferBadge className="w-5 h-5 mx-auto mb-1" />
                        <span className="text-[10px] block">Meezan Bank</span>
                      </button>
                    </div>

                    {/* Authentic Merchant Instruction Box */}
                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-1.5">
                      {paymentMethod === 'easypaisa' && (
                        <>
                          <div className="font-bold text-emerald-800 flex items-center justify-between">
                            <span>Easypaisa Account:</span>
                            <span className="font-mono text-sm">{gateways.easypaisa?.account_number || '03190375751'}</span>
                          </div>
                          <div className="text-slate-600">Account Title: <strong>{gateways.easypaisa?.account_title || 'ORBIT-I Private Limited'}</strong></div>
                          <p className="text-slate-500 text-[11px] pt-1">
                            Send PKR {selectedTier.price_pkr.toLocaleString()} via Easypaisa App. Then enter the 11-digit Transaction ID below.
                          </p>
                        </>
                      )}

                      {paymentMethod === 'jazzcash' && (
                        <>
                          <div className="font-bold text-red-800 flex items-center justify-between">
                            <span>JazzCash Till / Wallet:</span>
                            <span className="font-mono text-sm">{gateways.jazzcash?.account_number || '03001234567'}</span>
                          </div>
                          <div className="text-slate-600">Account Title: <strong>{gateways.jazzcash?.account_title || 'ORBIT-I Private Limited'}</strong></div>
                          <p className="text-slate-500 text-[11px] pt-1">
                            Send amount via JazzCash App. Enter Transaction Reference / TID below.
                          </p>
                        </>
                      )}

                      {paymentMethod === 'raast' && (
                        <>
                          <div className="font-bold text-emerald-900 flex items-center justify-between">
                            <span>SBP Raast ID:</span>
                            <span className="font-mono text-sm">{gateways.raast?.raast_id || '03190375751'}</span>
                          </div>
                          <div className="text-slate-600">Account Title: <strong>{gateways.raast?.account_title || 'ORBIT-I Private Limited'}</strong></div>
                          <div className="text-slate-600 text-[11px] font-mono">IBAN: {gateways.raast?.iban || 'PK45MEZN0001234567890101'}</div>
                        </>
                      )}

                      {paymentMethod === 'bank' && (
                        <>
                          <div className="font-bold text-blue-900">
                            Bank: {gateways.bank_transfer?.bank_name || 'Meezan Bank Limited'}
                          </div>
                          <div className="text-slate-600">Title: <strong>{gateways.bank_transfer?.account_title || 'ORBIT-I Private Limited'}</strong></div>
                          <div className="text-slate-700 font-mono text-[11px]">Account #: {gateways.bank_transfer?.account_number || '01020304050607'}</div>
                          <div className="text-slate-700 font-mono text-[11px]">IBAN: {gateways.bank_transfer?.iban || 'PK45MEZN0001234567890101'}</div>
                        </>
                      )}

                      {/* Transaction ID input */}
                      <div className="pt-2">
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">
                          Enter Transaction Reference (TID) from SMS / App Receipt: *
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. 10984572910"
                          value={transactionId}
                          onChange={(e) => setTransactionId(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono text-xs bg-white outline-none focus:border-[#7c3aed]"
                        />
                      </div>
                    </div>
                  </div>
                )}

                <div className="pt-2">
                  <Button
                    type="submit"
                    disabled={bookingLoading}
                    className="w-full py-3 rounded-xl bg-[#7c3aed] hover:bg-[#6d28d9] text-white font-bold text-sm shadow-lg shadow-[#7c3aed]/25 flex items-center justify-center gap-2"
                  >
                    {bookingLoading ? (
                      'Processing...'
                    ) : (
                      <>
                        <ShieldCheck className="w-4 h-4" />
                        Confirm Booking ({selectedTier ? `PKR ${selectedTier.price_pkr.toLocaleString()}` : 'Free'})
                      </>
                    )}
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
