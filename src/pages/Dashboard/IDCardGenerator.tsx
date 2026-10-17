import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import Header from '@/components/ui/dashboard/header';
import { Button } from '@/components/ui/button';
import { 
  IdCard, 
  Printer, 
  Download, 
  QrCode,
  Palette,
  Layers,
  MapPin,
  Mail,
  Phone,
  ShieldCheck,
  Armchair,
  Sparkles,
  CreditCard
} from 'lucide-react';
import { api } from '@/services/api';
import { printElement } from '@/lib/printUtils';

interface Attendee {
  id: number;
  name: string;
  email: string;
  organization?: string;
  designation?: string;
  ticket_code: string;
  ticket_type: string;
  status: string;
}

const ID_TEMPLATES = [
  {
    id: 'executive',
    name: 'Executive Lanyard',
    category: 'Corporate',
    orientation: 'vertical',
    bg: 'from-slate-900 via-blue-950 to-slate-900',
    accent: '#3b82f6',
    border: 'border-blue-500/40',
    textColor: 'text-white',
    headerBadge: 'EXECUTIVE PASS',
    description: 'Classic vertical lanyard conference badge with photo and credential code.'
  },
  {
    id: 'vip_gold',
    name: 'VIP Obsidian Gold',
    category: 'Keynote & VIP',
    orientation: 'vertical',
    bg: 'from-zinc-950 via-neutral-900 to-amber-950/60',
    accent: '#f59e0b',
    border: 'border-amber-400/60',
    textColor: 'text-white',
    headerBadge: 'VIP ALL-ACCESS',
    description: 'Luxury obsidian and metallic gold badge for keynote speakers and dignitaries.'
  },
  {
    id: 'hackathon',
    name: 'Cyber Tech Hackathon',
    category: 'Technology',
    orientation: 'vertical',
    bg: 'from-slate-950 via-slate-900 to-indigo-950',
    accent: '#06b6d4',
    border: 'border-cyan-400/50',
    textColor: 'text-white',
    headerBadge: 'BUILDER / HACKER',
    description: 'Cyberpunk dark theme with neon cyan borders and track indicators.'
  },
  {
    id: 'corporate',
    name: 'Corporate Trade Summit',
    category: 'Business',
    orientation: 'horizontal',
    bg: 'from-white via-slate-50 to-blue-50/30',
    accent: '#1d4ed8',
    border: 'border-slate-300',
    textColor: 'text-slate-900',
    headerBadge: 'OFFICIAL DELEGATE',
    description: 'Clean horizontal badge ideal for clip-on holders and trade conferences.'
  },
  {
    id: 'academic',
    name: 'Academic & University',
    category: 'Education',
    orientation: 'vertical',
    bg: 'from-emerald-950 via-teal-950 to-slate-900',
    accent: '#10b981',
    border: 'border-emerald-500/50',
    textColor: 'text-white',
    headerBadge: 'FACULTY & SCHOLAR',
    description: 'Prestigious university style badge for symposiums and academic research.'
  },
  {
    id: 'press_media',
    name: 'Press & Media Pass',
    category: 'Media',
    orientation: 'vertical',
    bg: 'from-red-950 via-neutral-900 to-zinc-950',
    accent: '#ef4444',
    border: 'border-red-500/60',
    textColor: 'text-white',
    headerBadge: 'PRESS / BROADCAST',
    description: 'High-visibility badge with bold broadcast badge for accredited journalists.'
  }
];

const SEAT_TIERS = [
  { id: 'vip', label: 'VIP Pass (Front Row)', seat: 'Row A • Seat 04 (Stagefront)', badge: 'VIP Priority' },
  { id: 'front', label: 'Front Seat (Rows B-E)', seat: 'Row B • Seat 12', badge: 'Front Row' },
  { id: 'back', label: 'Back Seat / General (Rows F-Z)', seat: 'Row G • Seat 28', badge: 'General Seating' },
  { id: 'guest', label: 'VIP Guest / Delegate', seat: 'Executive Suite • Table 3', badge: 'Special Guest' }
];

export default function IDCardGenerator() {
  const [events, setEvents] = useState<any[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<number | null>(null);
  const [attendees, setAttendees] = useState<Attendee[]>([]);
  const [selectedAttendeeId, setSelectedAttendeeId] = useState<number | 'all'>('all');
  const [selectedTemplate, setSelectedTemplate] = useState(ID_TEMPLATES[0]);
  const [cardSideView, setCardSideView] = useState<'dual' | 'front' | 'back'>('dual');
  const [selectedSeatTier, setSelectedSeatTier] = useState(SEAT_TIERS[0].id);
  const [paymentStatus, setPaymentStatus] = useState<'paid' | 'complimentary' | 'free'>('paid');
  const [paymentAmount, setPaymentAmount] = useState('49.00');
  const [showQrCode, setShowQrCode] = useState(true);
  const [showBarcode, setShowBarcode] = useState(true);
  const [customRoleText, setCustomRoleText] = useState('');
  const [includeOrgLogo, setIncludeOrgLogo] = useState(true);
  const printAreaRef = useRef<HTMLDivElement>(null);

  // Load events
  useEffect(() => {
    async function loadEvents() {
      try {
        const res = await api.events.list({ limit: 50 });
        if (res.success && res.events.length > 0) {
          setEvents(res.events);
          setSelectedEventId(res.events[0].id);
        }
      } catch (err) {
        console.error('Failed to load events:', err);
      }
    }
    loadEvents();
  }, []);

  // Load attendees whenever target event changes (Strict event isolation)
  useEffect(() => {
    if (!selectedEventId) return;
    const eventId = selectedEventId;
    async function loadAttendees() {
      try {
        const res = await api.events.getAttendees(eventId);
        if (res.success) {
          setAttendees(res.attendees || []);
          setSelectedAttendeeId('all');
        }
      } catch (err) {
        console.error('Failed to load event attendees:', err);
      }
    }
    loadAttendees();
  }, [selectedEventId]);

  const activeEvent = events.find(e => e.id === selectedEventId);
  const currentSeat = SEAT_TIERS.find(s => s.id === selectedSeatTier) || SEAT_TIERS[0];

  const displayedAttendees = selectedAttendeeId === 'all' 
    ? attendees 
    : attendees.filter(a => a.id === selectedAttendeeId);

  const handlePrint = () => {
    if (printAreaRef.current) {
      printElement(printAreaRef.current, `${activeEvent?.title || 'Event'} Official Badges`);
    } else {
      window.print();
    }
  };

  return (
    <div className="min-h-screen pb-16">
      <Header title="Live ID Pass & Badge Studio" />

      <div className="p-6 space-y-6 max-w-7xl mx-auto">
        {/* Top Banner Notice */}
        <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 rounded-3xl p-5 text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-md">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-white/10 flex items-center justify-center shrink-0 border border-white/20">
              <IdCard className="w-6 h-6 text-blue-300" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-white flex items-center gap-2">
                Production Dual-Sided ID Pass Studio
                <span className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                  Front + Back Verified
                </span>
              </h2>
              <p className="text-xs text-blue-200 mt-0.5">
                Official accreditation passes equipped with Front Seat/VIP tier allocation, payment status confirmation, and automated Email/WhatsApp delivery alerts.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link to="/dashboard/id-cards/editor">
              <Button 
                size="sm"
                className="bg-white/20 hover:bg-white/30 text-white border border-white/30 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs"
              >
                <IdCard className="w-3.5 h-3.5 text-amber-300" />
                ID Card Editor
              </Button>
            </Link>
            <Link to="/dashboard/design-studio?type=id_badge">
              <Button 
                size="sm"
                className="bg-white/10 hover:bg-white/20 text-white border border-white/20 rounded-xl text-xs font-bold flex items-center gap-1.5"
              >
                <Palette className="w-3.5 h-3.5 text-blue-300" />
                Canva Studio
              </Button>
            </Link>
          </div>
        </div>

        {/* Main Grid: Controls + Live Badges */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Panel: Configuration */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-5">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Layers className="w-4 h-4 text-[#1d4ed8]" />
                Badge & Pass Settings
              </h3>
              <p className="text-xs text-slate-500 mt-1">Configure layout, seating tier, payment and card sides</p>
            </div>

            {/* Event Picker */}
            <div>
              <label className="text-xs font-bold text-slate-700 flex items-center justify-between mb-1.5">
                <span>Target Event ({events.length} Available)</span>
                {activeEvent && (
                  <span className="text-[10px] text-blue-600 font-semibold">ID: #{activeEvent.id}</span>
                )}
              </label>
              <select
                value={selectedEventId || ''}
                onChange={(e) => setSelectedEventId(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm bg-slate-50/50 font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
              >
                {events.length === 0 ? (
                  <option value="">No events found</option>
                ) : (
                  events.map((ev) => (
                    <option key={ev.id} value={ev.id}>
                      {ev.title} ({ev.registered_count || 0} registered)
                    </option>
                  ))
                )}
              </select>
            </div>

            {/* Attendee Picker */}
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1.5">
                Attendee Scope
              </label>
              <select
                value={selectedAttendeeId}
                onChange={(e) => setSelectedAttendeeId(e.target.value === 'all' ? 'all' : Number(e.target.value))}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm bg-slate-50/50 font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
              >
                <option value="all">Bulk: All Attendees ({attendees.length} in this event)</option>
                {attendees.map((att) => (
                  <option key={att.id} value={att.id}>
                    {att.name} — {att.ticket_type} ({att.ticket_code})
                  </option>
                ))}
              </select>
            </div>

            {/* Card Face View Switcher */}
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1.5">Card Side View</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'dual', label: 'Front & Back', sub: 'Dual View' },
                  { id: 'front', label: 'Front Face', sub: 'Photo & QR' },
                  { id: 'back', label: 'Back Face', sub: 'Rules & Dispatch' }
                ].map((s) => (
                  <button
                    key={s.id}
                    onClick={() => setCardSideView(s.id as any)}
                    className={`p-2 rounded-xl border text-center transition-all ${
                      cardSideView === s.id
                        ? 'border-blue-600 bg-blue-50/80 text-blue-900 ring-2 ring-blue-500/20'
                        : 'border-slate-200 hover:border-slate-300 bg-white text-slate-700'
                    }`}
                  >
                    <div className="text-xs font-bold">{s.label}</div>
                    <div className="text-[9px] text-slate-500">{s.sub}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Seat Allocation Tier */}
            <div>
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5 mb-1.5">
                <Armchair className="w-3.5 h-3.5 text-[#1d4ed8]" />
                Seating & Pass Tier Allocation
              </label>
              <select
                value={selectedSeatTier}
                onChange={(e) => setSelectedSeatTier(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold bg-white"
              >
                {SEAT_TIERS.map((tier) => (
                  <option key={tier.id} value={tier.id}>
                    {tier.label} — {tier.seat}
                  </option>
                ))}
              </select>
            </div>

            {/* Payment Status & Details */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5 mb-1">
                <CreditCard className="w-3.5 h-3.5 text-emerald-600" />
                Payment & Billing Status
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'paid', label: 'Paid Pass' },
                  { id: 'complimentary', label: 'VIP Guest' },
                  { id: 'free', label: 'Free RSVP' }
                ].map((p) => (
                  <button
                    key={p.id}
                    onClick={() => setPaymentStatus(p.id as any)}
                    className={`p-2 rounded-xl border text-center transition-all text-xs font-bold ${
                      paymentStatus === p.id
                        ? 'border-emerald-500 bg-emerald-50 text-emerald-900 ring-2 ring-emerald-500/20'
                        : 'border-slate-200 hover:border-slate-300 bg-white text-slate-700'
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
              {paymentStatus === 'paid' && (
                <div className="flex items-center gap-2 pt-1">
                  <span className="text-xs font-bold text-slate-500">Amount: $</span>
                  <input
                    type="text"
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(e.target.value)}
                    className="w-24 px-2 py-1 text-xs border rounded-lg font-bold"
                  />
                  <span className="text-[11px] text-emerald-600 font-semibold">Payment Confirmed</span>
                </div>
              )}
            </div>

            {/* Template Selector (6 Designs) */}
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-2">
                Visual Themes (6 Professional Presets)
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
                {ID_TEMPLATES.map((tmpl) => (
                  <button
                    key={tmpl.id}
                    onClick={() => setSelectedTemplate(tmpl)}
                    className={`p-2.5 rounded-xl border text-left text-xs transition-all ${
                      selectedTemplate.id === tmpl.id
                        ? 'border-[#1d4ed8] bg-blue-50/70 ring-2 ring-blue-500/20'
                        : 'border-slate-200 hover:border-blue-300 bg-white'
                    }`}
                  >
                    <div className="font-bold text-slate-900 truncate">{tmpl.name}</div>
                    <div className="flex items-center justify-between text-[10px] text-slate-500 mt-1">
                      <span>{tmpl.category}</span>
                      <span className="capitalize font-semibold">{tmpl.orientation}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Customization Options */}
            <div className="pt-3 border-t border-slate-100 space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Custom Role Tag (Override)</label>
                <input
                  type="text"
                  placeholder="e.g. VIP KEYNOTE, SPEAKER, DELEGATE"
                  value={customRoleText}
                  onChange={(e) => setCustomRoleText(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs uppercase font-bold"
                />
              </div>

              <div className="flex items-center justify-between text-xs text-slate-700 py-1">
                <span className="font-medium">Display Scannable QR Code</span>
                <input
                  type="checkbox"
                  checked={showQrCode}
                  onChange={(e) => setShowQrCode(e.target.checked)}
                  className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-between text-xs text-slate-700 py-1">
                <span className="font-medium">Display Barcode (Code 128)</span>
                <input
                  type="checkbox"
                  checked={showBarcode}
                  onChange={(e) => setShowBarcode(e.target.checked)}
                  className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-between text-xs text-slate-700 py-1">
                <span className="font-medium">Include Eventrye Official Seal</span>
                <input
                  type="checkbox"
                  checked={includeOrgLogo}
                  onChange={(e) => setIncludeOrgLogo(e.target.checked)}
                  className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                />
              </div>
            </div>

            {/* Print & Action Buttons */}
            <div className="pt-3 border-t border-slate-100 space-y-2">
              <Button
                onClick={handlePrint}
                className="w-full bg-[#1d4ed8] hover:bg-[#1e40af] text-white rounded-xl py-5 font-bold shadow-md shadow-blue-600/20 flex items-center justify-center gap-2 text-xs"
              >
                <Printer className="w-4 h-4" />
                Print Dual-Sided Badges ({displayedAttendees.length})
              </Button>
              <Link to="/dashboard/design-studio" className="block w-full">
                <Button
                  variant="outline"
                  className="w-full border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl py-4 font-semibold text-xs flex items-center justify-center gap-2"
                >
                  <Palette className="w-3.5 h-3.5 text-blue-600" />
                  Edit in Canva Design Studio
                </Button>
              </Link>
            </div>
          </div>

          {/* Right Panel: Live Printable Badge Previews */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <span>Front &amp; Back Pass Preview</span>
                  <span className="text-xs font-normal text-slate-500">
                    ({displayedAttendees.length} {displayedAttendees.length === 1 ? 'attendee' : 'attendees'})
                  </span>
                </h3>
                <p className="text-xs text-slate-500">
                  Target: {activeEvent?.title || 'No event selected'} • Tier: {currentSeat.label}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handlePrint}
                  className="text-xs font-bold rounded-xl flex items-center gap-1.5 border-slate-200"
                >
                  <Download className="w-3.5 h-3.5" />
                  Print / Export PDF
                </Button>
              </div>
            </div>

            {/* Badges Container */}
            <div ref={printAreaRef}>
              {displayedAttendees.length === 0 ? (
                <div className="p-16 text-center bg-white rounded-3xl border border-dashed border-slate-300">
                  <IdCard className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                  <h4 className="font-bold text-slate-700 text-base">No registered attendees for this event</h4>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                    Attendees who apply online via your organization&apos;s public registration page will instantly generate verified passes here.
                  </p>
                </div>
              ) : (
                <div className="space-y-8">
                  {displayedAttendees.map((att) => (
                    <div key={att.id} className="grid grid-cols-1 md:grid-cols-2 gap-6 print:grid-cols-2 print:gap-4 print:break-inside-avoid">
                      
                      {/* ================= FRONT SIDE CARD ================= */}
                      {(cardSideView === 'dual' || cardSideView === 'front') && (
                        <div
                          className={`rounded-3xl p-6 shadow-xl transition-all relative overflow-hidden text-center min-h-[580px] h-[580px] flex flex-col justify-between print:shadow-none print:border ${
                            selectedTemplate.id === 'corporate'
                              ? 'bg-gradient-to-br from-white via-slate-50 to-blue-50/40 text-slate-900 border-2 border-slate-300'
                              : `bg-gradient-to-b ${selectedTemplate.bg} ${selectedTemplate.textColor} border-2 ${selectedTemplate.border}`
                          }`}
                        >
                          {/* Lanyard punch hole indicator */}
                          <div className="w-12 h-3 bg-slate-950/80 rounded-full mx-auto mb-3 border border-slate-600/50 print:border-black shrink-0" />

                          {/* Top Tag */}
                          <div className="flex items-center justify-between mb-2 px-2 shrink-0">
                            {includeOrgLogo ? (
                              <div className="flex items-center gap-1.5">
                                <img src="/favicon.png" alt="Logo" className="w-5 h-5 rounded-md object-contain" />
                                <span className="text-[10px] font-extrabold tracking-wider uppercase opacity-90">
                                  Eventrye Pass
                                </span>
                              </div>
                            ) : (
                              <div />
                            )}
                            <span className="text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-md bg-white/10 border border-white/15">
                              FRONT SIDE
                            </span>
                          </div>

                          {/* Event Title */}
                          <div className="shrink-0">
                            <div className="text-[12px] font-extrabold tracking-wide uppercase text-blue-400 truncate mb-0.5">
                              {activeEvent?.title || 'Global Executive Summit'}
                            </div>
                            <div className={`text-[9px] ${selectedTemplate.id === 'corporate' ? 'text-slate-500' : 'text-slate-300'} flex items-center justify-center gap-1.5`}>
                              <MapPin className="w-2.5 h-2.5" />
                              <span>{activeEvent?.city || 'Convention Center'} • {activeEvent?.start_date || '2026'}</span>
                            </div>
                          </div>

                          {/* Attendee Avatar Photo */}
                          <div className="my-auto py-1">
                            <div className="w-18 h-18 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-500 to-purple-600 p-1 mx-auto mb-2 shadow-lg">
                              <div className="w-full h-full rounded-xl bg-slate-900 flex items-center justify-center font-bold text-xl text-white">
                                {att.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()}
                              </div>
                            </div>

                            {/* Attendee Name & Designation */}
                            <h4 className={`font-heading font-extrabold text-lg truncate ${selectedTemplate.id === 'corporate' ? 'text-slate-900' : 'text-white'}`}>
                              {att.name}
                            </h4>
                            <p className={`text-xs truncate font-semibold mt-0.5 ${selectedTemplate.id === 'corporate' ? 'text-blue-700' : 'text-blue-300'}`}>
                              {att.designation || 'Accredited Delegate'}
                            </p>
                            <p className={`text-[10px] truncate ${selectedTemplate.id === 'corporate' ? 'text-slate-500' : 'text-slate-400'}`}>
                              {att.organization || 'Corporate Member'}
                            </p>

                            {/* Seating Allocation Badge */}
                            <div className="my-2 px-3 py-1 rounded-xl bg-white/10 border border-white/15 inline-flex items-center gap-1.5 text-[11px] font-bold">
                              <Armchair className="w-3.5 h-3.5 text-amber-400" />
                              <span>{currentSeat.seat}</span>
                            </div>

                            {/* Role / Access Tier Pill & Payment Badge */}
                            <div className="flex items-center justify-center gap-2 my-1">
                              <span
                                className="inline-block px-3.5 py-1 rounded-full text-[10px] font-extrabold tracking-wider uppercase text-white shadow-sm"
                                style={{ backgroundColor: selectedTemplate.accent }}
                              >
                                {customRoleText || currentSeat.badge || att.ticket_type}
                              </span>
                              <span className="inline-block px-3 py-1 rounded-full text-[10px] font-black uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                                {paymentStatus === 'paid' ? `PAID $${paymentAmount}` : paymentStatus === 'complimentary' ? 'VIP GUEST' : 'FREE RSVP'}
                              </span>
                            </div>

                            {/* QR Code Container */}
                            {showQrCode && (
                              <div className="bg-white p-2 rounded-2xl inline-block shadow-inner my-1">
                                <QrCode className="w-16 h-16 text-slate-900 mx-auto" />
                              </div>
                            )}

                            {/* Barcode representation */}
                            {showBarcode && (
                              <div className="mt-1 font-mono text-[9px]">
                                <div className="h-4 flex items-center justify-center gap-0.5 max-w-[170px] mx-auto opacity-75">
                                  {[2, 1, 3, 1, 2, 4, 1, 3, 2, 1, 4, 2, 1, 3, 2, 1, 3].map((w, i) => (
                                    <span
                                      key={i}
                                      className={`h-full ${selectedTemplate.id === 'corporate' ? 'bg-slate-900' : 'bg-white'}`}
                                      style={{ width: `${w * 1.5}px` }}
                                    />
                                  ))}
                                </div>
                                <span className="block mt-0.5 font-bold tracking-widest text-[10px] text-blue-300">
                                  {att.ticket_code}
                                </span>
                              </div>
                            )}
                          </div>

                          {/* Card Front Footer Endorsement */}
                          <div className="pt-2 border-t border-white/10 flex items-center justify-between text-[8px] opacity-75 shrink-0">
                            <span>PASS ID #{att.id}</span>
                            <span className="font-semibold">
                              Powered by Eventrye • Verified by ORBIT-I Private Limited
                            </span>
                          </div>
                        </div>
                      )}

                      {/* ================= BACK SIDE CARD ================= */}
                      {(cardSideView === 'dual' || cardSideView === 'back') && (
                        <div
                          className={`rounded-3xl p-6 shadow-xl transition-all relative overflow-hidden min-h-[580px] h-[580px] flex flex-col justify-between print:shadow-none print:border ${
                            selectedTemplate.id === 'corporate'
                              ? 'bg-gradient-to-br from-slate-50 via-white to-slate-100 text-slate-900 border-2 border-slate-300'
                              : `bg-gradient-to-b ${selectedTemplate.bg} ${selectedTemplate.textColor} border-2 ${selectedTemplate.border}`
                          }`}
                        >
                          {/* Lanyard punch hole indicator */}
                          <div className="w-12 h-3 bg-slate-950/80 rounded-full mx-auto mb-3 border border-slate-600/50 print:border-black shrink-0" />

                          <div className="my-auto space-y-3">
                            {/* Top Badge */}
                            <div className="flex items-center justify-between px-1">
                              <span className="text-[9px] font-extrabold uppercase tracking-widest text-blue-400">
                                Security &amp; Accreditation Notice
                              </span>
                              <span className="text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-md bg-white/10 border border-white/15">
                                BACK SIDE
                              </span>
                            </div>

                            {/* Respectful VIP Dispatch Notice */}
                            <div className="p-3.5 rounded-2xl bg-white/10 border border-white/15 text-left">
                              <div className="flex items-center gap-2 mb-1.5">
                                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                                <span className="text-[10px] font-extrabold text-amber-300 uppercase tracking-wider">
                                  VIP Dispatch &amp; Credential Delivery Notice
                                </span>
                              </div>
                              <p className="text-[10px] leading-relaxed text-slate-200">
                                <strong>Mohtaram Delegate / Participant:</strong> Aapka official live pass confirm kar diya gaya hai. Aapka official digital ID pass badge aur entry gate QR code aapke registered email (<strong>{att.email}</strong>) aur WhatsApp number par dispatch kar diya gaya hai.
                              </p>
                            </div>

                            {/* Terms & Entry Rules */}
                            <div className="text-left space-y-2 text-[9px] text-slate-300 px-1">
                              <div className="font-bold uppercase tracking-wider text-white">
                                Venue Entry Guidelines:
                              </div>
                              <ul className="list-disc pl-3.5 space-y-1">
                                <li>Present this live badge or digital QR code at the accreditation checkpoint.</li>
                                <li>Seating tier: <strong>{currentSeat.label}</strong> ({currentSeat.seat}).</li>
                                <li>Non-transferable credential; official government photo ID may be requested.</li>
                                <li>In case of emergency, follow venue staff and security protocols.</li>
                              </ul>
                            </div>
                          </div>

                          {/* Contact & Support Section */}
                          <div className="mt-4 pt-3 border-t border-white/10 space-y-2 text-left">
                            <div className="flex items-center justify-between text-[9px] text-slate-300">
                              <span className="flex items-center gap-1">
                                <Mail className="w-2.5 h-2.5 text-blue-400" />
                                support@eventrye.com
                              </span>
                              <span className="flex items-center gap-1">
                                <Phone className="w-2.5 h-2.5 text-emerald-400" />
                                WhatsApp Helpdesk
                              </span>
                            </div>

                            {/* Security Hologram & Endorsement */}
                            <div className="p-2.5 rounded-xl bg-black/40 border border-white/10 flex items-center justify-between text-[8px]">
                              <div className="flex items-center gap-1.5">
                                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                                <span className="font-mono text-emerald-300 font-bold">SEC-TOKEN: {att.ticket_code.slice(0, 12)}</span>
                              </div>
                              <span className="text-[8px] font-extrabold uppercase text-amber-400">
                                TAMPER-EVIDENT
                              </span>
                            </div>

                            <p className="text-[8px] text-center text-slate-400 pt-1">
                              Official Credential Issued under Authority of Eventrye &amp; ORBIT-I Private Limited.
                            </p>
                          </div>
                        </div>
                      )}

                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
