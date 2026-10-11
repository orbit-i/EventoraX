import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { 
  Calendar, 
  MapPin, 
  Ticket, 
  CheckCircle, 
  Sparkles, 
  X,
  Copy,
  Check,
  Armchair,
  Printer,
  ShieldCheck,
  Search
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { api } from "@/services/api";

const PASS_TIERS = [
  { id: 'vip', name: 'VIP Pass (Front Row)', seat: 'Row A • Stagefront VIP', extraPrice: 50 },
  { id: 'front', name: 'Front Seat (Rows B-E)', seat: 'Row B • Seat 14', extraPrice: 20 },
  { id: 'general', name: 'General Admission', seat: 'General Seating Area', extraPrice: 0 }
];

export default function PublicTenantPortal() {
  const { slug } = useParams<{ slug: string }>();
  const [tenant, setTenant] = useState<any | null>(null);
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [copiedLink, setCopiedLink] = useState(false);

  // Registration Modal State
  const [selectedEvent, setSelectedEvent] = useState<any | null>(null);
  const [attendeeName, setAttendeeName] = useState("");
  const [attendeeEmail, setAttendeeEmail] = useState("");
  const [attendeePhone, setAttendeePhone] = useState("");
  const [selectedTier, setSelectedTier] = useState(PASS_TIERS[0].id);
  const [registering, setRegistering] = useState(false);
  const [registrationSuccess, setRegistrationSuccess] = useState<any | null>(null);
  const [idCardFace, setIdCardFace] = useState<'front' | 'back'>('front');

  useEffect(() => {
    const fetchPortal = async () => {
      if (!slug) return;
      setLoading(true);
      setError(null);
      try {
        const res = await api.tenants.getPublicPortal(slug);
        if (res.success) {
          setTenant(res.tenant);
          setEvents(res.events || []);

          // Dynamic SEO Meta updates for Google Indexing
          document.title = `${res.tenant.name} — Official Public Event & Seminar Portal | EventoraX`;
          
          let metaDesc = document.querySelector('meta[name="description"]');
          if (!metaDesc) {
            metaDesc = document.createElement('meta');
            metaDesc.setAttribute('name', 'description');
            document.head.appendChild(metaDesc);
          }
          metaDesc.setAttribute(
            'content', 
            `Browse official events, conferences, and seminars hosted by ${res.tenant.name}. Register online and receive instant verified ID passes.`
          );

          // Add Google Structured JSON-LD Schema
          const existingScript = document.getElementById('event-jsonld-schema');
          if (existingScript) existingScript.remove();

          const script = document.createElement('script');
          script.id = 'event-jsonld-schema';
          script.type = 'application/ld+json';
          script.textContent = JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Organization",
            "name": res.tenant.name,
            "url": window.location.href,
            "logo": res.tenant.logo_url || "https://eventorax.orbit-i.tech/favicon.png",
            "department": (res.events || []).map((e: any) => ({
              "@type": "Event",
              "name": e.title,
              "startDate": e.start_date,
              "eventAttendanceMode": "https://schema.org/OfflineEventAttendanceMode",
              "eventStatus": "https://schema.org/EventScheduled",
              "location": {
                "@type": "Place",
                "name": e.venue_name || "Official Venue",
                "address": {
                  "@type": "PostalAddress",
                  "addressLocality": e.city || "Islamabad",
                  "addressCountry": "PK"
                }
              },
              "description": e.description || e.title,
              "offers": {
                "@type": "Offer",
                "price": e.price || "0",
                "priceCurrency": "USD",
                "availability": "https://schema.org/InStock"
              }
            }))
          });
          document.head.appendChild(script);
        } else {
          setError("Organization portal not found.");
        }
      } catch (err: any) {
        setError(err.message || "Failed to load organization portal.");
      } finally {
        setLoading(false);
      }
    };

    fetchPortal();

    return () => {
      const script = document.getElementById('event-jsonld-schema');
      if (script) script.remove();
    };
  }, [slug]);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleShareWhatsApp = () => {
    const text = encodeURIComponent(`Explore upcoming events and register for passes at ${tenant?.name || 'our portal'}: ${window.location.href}`);
    window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
  };

  const handleShareTwitter = () => {
    const text = encodeURIComponent(`Check out official events hosted by ${tenant?.name || 'our organization'}: ${window.location.href} via @EventoraX`);
    window.open(`https://twitter.com/intent/tweet?text=${text}`, '_blank');
  };

  const currentTierObj = PASS_TIERS.find(t => t.id === selectedTier) || PASS_TIERS[0];
  const totalPrice = (selectedEvent?.price || 0) + (currentTierObj.extraPrice || 0);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEvent || !attendeeName || !attendeeEmail) return;

    setRegistering(true);
    try {
      const res = await api.events.register(selectedEvent.id, {
        name: attendeeName,
        email: attendeeEmail,
        phone: attendeePhone,
        ticketType: `${currentTierObj.name} (${currentTierObj.seat})`
      });

      if (res.success && res.registration) {
        setRegistrationSuccess({
          ...res.registration,
          tier: currentTierObj.name,
          seat: currentTierObj.seat,
          totalPrice,
          phone: attendeePhone
        });
        // Update local count
        setEvents(prev => prev.map(ev => ev.id === selectedEvent.id ? { ...ev, registered_count: (ev.registered_count || 0) + 1 } : ev));
      }
    } catch (err: any) {
      alert(err.message || "Failed to complete registration.");
    } finally {
      setRegistering(false);
    }
  };

  const primaryColor = tenant?.primary_color || "#1d4ed8";

  const filteredEvents = events.filter(e => 
    e.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (e.description && e.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (e.city && e.city.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-[#faf8ff] flex items-center justify-center">
        <div className="w-10 h-10 border-3 border-[#1d4ed8] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !tenant) {
    return (
      <div className="min-h-screen bg-[#faf8ff] flex items-center justify-center p-6 text-center">
        <div className="max-w-md bg-white p-8 rounded-3xl border border-[#e9e4ff] shadow-xl space-y-4">
          <div className="w-16 h-16 rounded-full bg-red-50 text-red-600 flex items-center justify-center mx-auto">
            <X className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-[#0f172a]">Portal Unavailable</h2>
          <p className="text-sm text-[#64748b]">{error || "This organization does not exist or has been suspended."}</p>
          <Link to="/">
            <Button className="mt-2 bg-[#1d4ed8] text-white rounded-xl">Return to EventoraX Home</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] text-[#0f172a]">
      {/* Branded Navigation Bar */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            {tenant.logo_url ? (
              <img src={tenant.logo_url} alt={tenant.name} className="w-10 h-10 rounded-2xl object-cover shadow-sm" />
            ) : (
              <div 
                className="w-10 h-10 rounded-2xl flex items-center justify-center text-white font-black text-base shadow-md"
                style={{ backgroundColor: primaryColor }}
              >
                {tenant.name.slice(0, 2).toUpperCase()}
              </div>
            )}
            <div>
              <h1 className="text-lg font-extrabold tracking-tight text-[#0f172a]">{tenant.name}</h1>
              <p className="text-xs text-slate-500">Official Events &amp; Seminars Hub</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopyLink}
              className="text-xs rounded-xl flex items-center gap-1.5 border-slate-200"
            >
              {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              {copiedLink ? "Link Copied" : "Share URL"}
            </Button>
            <Link to="/">
              <span className="hidden sm:inline text-xs text-slate-400 hover:text-blue-600 pl-2">
                Powered by <strong>EventoraX</strong>
              </span>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Banner with Custom Branding */}
      <section 
        className="relative py-16 px-6 text-white overflow-hidden shadow-inner"
        style={{
          background: `linear-gradient(135deg, ${primaryColor} 0%, #0f172a 100%)`
        }}
      >
        <div className="max-w-6xl mx-auto relative z-10 space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            Verified Organization Portal • Live Google Indexed
          </div>
          <h2 className="text-3xl sm:text-5xl font-black tracking-tight">{tenant.name}</h2>
          <p className="text-sm sm:text-base text-white/85 max-w-2xl leading-relaxed">
            Welcome to our official public event &amp; seminar registration portal. Explore upcoming keynotes, reserve VIP / Front Seat passes, and download your verified entry ID card.
          </p>

          <div className="pt-2 flex flex-wrap items-center gap-4 text-xs text-white/90">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-blue-200" />
              <span><strong>{events.length}</strong> Listed Events</span>
            </div>
            <div className="flex items-center gap-2">
              <Ticket className="w-4 h-4 text-blue-200" />
              <span>Instant Live ID Passes &amp; QR Codes</span>
            </div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-300" />
              <span>Verified by ORBIT-I Private Limited</span>
            </div>
          </div>

          {/* Social Share Bar */}
          <div className="pt-3 flex items-center gap-2">
            <span className="text-xs text-white/70">Share this page:</span>
            <button
              onClick={handleShareWhatsApp}
              className="px-3 py-1 rounded-lg bg-emerald-600/80 hover:bg-emerald-600 text-white text-xs font-semibold flex items-center gap-1 transition-all"
            >
              WhatsApp
            </button>
            <button
              onClick={handleShareTwitter}
              className="px-3 py-1 rounded-lg bg-sky-600/80 hover:bg-sky-600 text-white text-xs font-semibold flex items-center gap-1 transition-all"
            >
              Twitter / X
            </button>
            <button
              onClick={handleCopyLink}
              className="px-3 py-1 rounded-lg bg-white/20 hover:bg-white/30 text-white text-xs font-semibold flex items-center gap-1 transition-all"
            >
              {copiedLink ? "Copied!" : "Copy Page Link"}
            </button>
          </div>
        </div>
      </section>

      {/* Events Listing */}
      <main className="max-w-6xl mx-auto px-6 py-12">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div>
            <h3 className="text-2xl font-bold text-[#0f172a]">Upcoming Seminars &amp; Events</h3>
            <p className="text-xs text-slate-500">Select an event below to book your verified live ID pass</p>
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <Input
              placeholder="Search by event title, topic or city..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 text-xs rounded-xl border-slate-200 bg-white"
            />
          </div>
        </div>

        {filteredEvents.length === 0 ? (
          <div className="p-16 text-center bg-white rounded-3xl border border-slate-200 shadow-xs">
            <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h4 className="text-lg font-bold text-[#0f172a]">No Public Events Scheduled</h4>
            <p className="text-xs text-slate-500 mt-1">
              {searchQuery ? "No events match your search query." : "Please check back soon for upcoming seminar announcements."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredEvents.map((ev) => (
              <div 
                key={ev.id}
                className="bg-white rounded-3xl border border-slate-200 shadow-xs hover:shadow-xl hover:-translate-y-1 transition-all duration-200 overflow-hidden flex flex-col"
              >
                {/* Event Top Bar */}
                <div 
                  className="h-3 w-full"
                  style={{ backgroundColor: primaryColor }}
                />

                <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <Badge className="bg-blue-50 text-blue-700 text-[10px] font-bold">
                        {ev.category || "Seminar"}
                      </Badge>
                      <span className="text-xs font-black text-[#0f172a]">
                        {ev.price > 0 ? `$${ev.price}` : "FREE RSVP"}
                      </span>
                    </div>

                    <h4 className="text-base font-bold text-[#0f172a] leading-snug line-clamp-2">
                      {ev.title}
                    </h4>

                    <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                      {ev.description || "Join us for this premier seminar and networking conference."}
                    </p>
                  </div>

                  <div className="space-y-2 pt-3 border-t border-slate-100 text-xs text-slate-600">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-3.5 h-3.5 text-blue-600" />
                      <span>{new Date(ev.start_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })} · {ev.start_time}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5 text-blue-600" />
                      <span className="truncate">{ev.venue_name || "Official Venue"} • {ev.city || "Islamabad"}</span>
                    </div>
                  </div>

                  <Button
                    onClick={() => {
                      setSelectedEvent(ev);
                      setRegistrationSuccess(null);
                      setIdCardFace('front');
                    }}
                    className="w-full text-white font-bold text-xs h-10 rounded-xl shadow-md"
                    style={{ backgroundColor: primaryColor }}
                  >
                    <Ticket className="w-4 h-4 mr-1.5" />
                    Apply &amp; Get Live Pass
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Registration & Live ID Pass Generation Modal */}
      {selectedEvent && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 my-8">
            {registrationSuccess ? (
              // ================= LIVE ID PASS GENERATION SUCCESS SCREEN =================
              <div className="space-y-5">
                <div className="text-center">
                  <div className="w-14 h-14 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-2">
                    <CheckCircle className="w-7 h-7" />
                  </div>
                  <h3 className="text-2xl font-black text-[#0f172a]">Registration Confirmed! 🎉</h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Your official live credential and dual-sided ID pass have been successfully generated.
                  </p>
                </div>

                {/* Respectful VIP Dispatch Notice */}
                <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200 text-left space-y-1">
                  <div className="flex items-center gap-1.5 text-amber-900 text-xs font-bold">
                    <Sparkles className="w-4 h-4 text-amber-600" />
                    VIP Pass Delivery Confirmation
                  </div>
                  <p className="text-[11px] text-amber-800 leading-relaxed">
                    <strong>Mohtaram {registrationSuccess.name}:</strong> Aapka official ID Card pass generate ho chuka hai. Aapko full pass details aur access instructions aapke email (<strong>{attendeeEmail}</strong>) {attendeePhone && `aur WhatsApp (${attendeePhone})`} par provide kar di jayengi.
                  </p>
                </div>

                {/* Toggle Card Face Button */}
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700">Live Card View:</span>
                  <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
                    <button
                      onClick={() => setIdCardFace('front')}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                        idCardFace === 'front' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-600'
                      }`}
                    >
                      Front Side
                    </button>
                    <button
                      onClick={() => setIdCardFace('back')}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                        idCardFace === 'back' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-600'
                      }`}
                    >
                      Back Side (VIP Rules)
                    </button>
                  </div>
                </div>

                {/* ================= INTERACTIVE DUAL-SIDED ID PASS PREVIEW ================= */}
                {idCardFace === 'front' ? (
                  /* FRONT FACE */
                  <div className="rounded-3xl p-6 bg-gradient-to-b from-slate-900 via-blue-950 to-slate-950 text-white text-center border-2 border-blue-500/40 shadow-xl relative overflow-hidden">
                    <div className="w-12 h-2.5 bg-black/60 rounded-full mx-auto mb-3 border border-white/20" />
                    
                    <div className="flex items-center justify-between text-[9px] font-extrabold uppercase tracking-wider mb-2 px-1">
                      <span className="text-blue-300">{tenant.name}</span>
                      <span className="px-2 py-0.5 rounded bg-white/10">FRONT PASS</span>
                    </div>

                    <div className="text-xs font-black uppercase text-blue-400 mb-1 truncate">
                      {selectedEvent.title}
                    </div>

                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-500 to-indigo-600 p-1 mx-auto my-2 shadow-md">
                      <div className="w-full h-full rounded-xl bg-slate-900 flex items-center justify-center font-bold text-lg text-white">
                        {registrationSuccess.name.slice(0, 2).toUpperCase()}
                      </div>
                    </div>

                    <h4 className="text-base font-extrabold text-white truncate">{registrationSuccess.name}</h4>
                    <p className="text-xs text-blue-300 font-semibold">{registrationSuccess.tier}</p>

                    <div className="my-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-white/10 text-[10px] font-bold text-amber-300 border border-white/15">
                      <Armchair className="w-3 h-3 text-amber-400" />
                      <span>{registrationSuccess.seat}</span>
                    </div>

                    <div className="bg-white p-2.5 rounded-2xl inline-block my-2">
                      <div className="w-16 h-16 flex items-center justify-center text-slate-900 font-mono text-xs font-bold border border-slate-200 rounded-lg">
                        [QR-PASS]
                      </div>
                    </div>

                    <div className="text-center font-mono text-[9px] text-blue-300 font-bold tracking-widest">
                      CODE: {registrationSuccess.ticketCode}
                    </div>

                    <div className="mt-3 pt-2.5 border-t border-white/10 text-[8px] text-slate-400 flex items-center justify-between">
                      <span>SECURE CREDENTIAL</span>
                      <span className="font-semibold text-slate-300">
                        Powered by EventoraX • Verified by ORBIT-I Private Limited
                      </span>
                    </div>
                  </div>
                ) : (
                  /* BACK FACE */
                  <div className="rounded-3xl p-6 bg-gradient-to-b from-slate-950 via-slate-900 to-indigo-950 text-white text-left border-2 border-indigo-500/40 shadow-xl space-y-3">
                    <div className="w-12 h-2.5 bg-black/60 rounded-full mx-auto mb-2 border border-white/20" />

                    <div className="flex items-center justify-between text-[9px] font-extrabold uppercase tracking-wider">
                      <span className="text-indigo-300">Accreditation Back Face</span>
                      <span className="px-2 py-0.5 rounded bg-white/10">BACK PASS</span>
                    </div>

                    <div className="p-3 rounded-2xl bg-white/10 border border-white/15 text-[10px] text-slate-200 space-y-1">
                      <div className="font-bold text-amber-300 uppercase">VIP Dispatch &amp; Entry Notice:</div>
                      <p>
                        Aapka physical pass badge aur digital QR gate accreditation aapke registered contact details par provide kar diya gaya hai.
                      </p>
                    </div>

                    <div className="text-[9px] text-slate-300 space-y-1">
                      <div className="font-bold text-white uppercase">Venue Entry Rules:</div>
                      <ul className="list-disc pl-3.5 space-y-0.5">
                        <li>Show this QR pass or physical lanyard badge at the security gate.</li>
                        <li>Seating: <strong>{registrationSuccess.seat}</strong>.</li>
                        <li>Non-transferable official pass.</li>
                      </ul>
                    </div>

                    <div className="pt-2 border-t border-white/10 flex items-center justify-between text-[8px] text-slate-400">
                      <span className="text-emerald-400 font-bold">VERIFIED AUTHENTIC</span>
                      <span>Issued by EventoraX &amp; ORBIT-I Private Limited</span>
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center gap-3 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => window.print()}
                    className="flex-1 rounded-xl text-xs h-11 border-slate-300 flex items-center justify-center gap-1.5"
                  >
                    <Printer className="w-4 h-4" />
                    Print / Download ID Pass
                  </Button>
                  <Button
                    type="button"
                    onClick={() => setSelectedEvent(null)}
                    className="flex-1 text-white font-bold text-xs h-11 rounded-xl shadow-md"
                    style={{ backgroundColor: primaryColor }}
                  >
                    Done &amp; Close
                  </Button>
                </div>
              </div>
            ) : (
              // ================= REGISTRATION FORM =================
              <div>
                <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                  <div>
                    <h3 className="text-lg font-bold text-[#0f172a]">Book Event Ticket &amp; ID Pass</h3>
                    <p className="text-xs text-slate-500">{selectedEvent.title}</p>
                  </div>
                  <button 
                    onClick={() => setSelectedEvent(null)}
                    className="p-1 rounded-lg text-slate-400 hover:text-[#0f172a]"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <form onSubmit={handleRegister} className="mt-5 space-y-4">
                  <div>
                    <label className="text-xs font-bold text-[#0f172a] block mb-1">Full Name *</label>
                    <Input
                      required
                      placeholder="e.g. Dr. Muhammad Ali"
                      value={attendeeName}
                      onChange={(e) => setAttendeeName(e.target.value)}
                      className="rounded-xl border-slate-200 text-xs h-10"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-[#0f172a] block mb-1">Email Address *</label>
                    <Input
                      type="email"
                      required
                      placeholder="e.g. ali@example.com"
                      value={attendeeEmail}
                      onChange={(e) => setAttendeeEmail(e.target.value)}
                      className="rounded-xl border-slate-200 text-xs h-10"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-[#0f172a] block mb-1">WhatsApp / Phone Number</label>
                    <Input
                      placeholder="+92 300 1234567"
                      value={attendeePhone}
                      onChange={(e) => setAttendeePhone(e.target.value)}
                      className="rounded-xl border-slate-200 text-xs h-10"
                    />
                    <p className="text-[10px] text-slate-400 mt-1">Official ID card pass will also be sent to this WhatsApp number.</p>
                  </div>

                  {/* Pass & Seating Tier Selection */}
                  <div>
                    <label className="text-xs font-bold text-[#0f172a] block mb-1.5">
                      Select Seating &amp; Pass Tier
                    </label>
                    <div className="space-y-2">
                      {PASS_TIERS.map((tier) => (
                        <label
                          key={tier.id}
                          className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                            selectedTier === tier.id
                              ? 'border-blue-600 bg-blue-50/70 text-blue-900 ring-2 ring-blue-500/20'
                              : 'border-slate-200 hover:border-slate-300 bg-white'
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <input
                              type="radio"
                              name="tier"
                              value={tier.id}
                              checked={selectedTier === tier.id}
                              onChange={() => setSelectedTier(tier.id)}
                              className="text-blue-600"
                            />
                            <div>
                              <div className="text-xs font-bold">{tier.name}</div>
                              <div className="text-[10px] text-slate-500">{tier.seat}</div>
                            </div>
                          </div>
                          <span className="text-xs font-bold">
                            {tier.extraPrice > 0 ? `+$${tier.extraPrice}` : "Included"}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Price Summary */}
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-600">Total Pass Amount:</span>
                    <span className="font-black text-sm text-[#0f172a]">
                      {totalPrice > 0 ? `$${totalPrice}.00` : "Free RSVP"}
                    </span>
                  </div>

                  <div className="flex items-center justify-end gap-3 pt-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setSelectedEvent(null)}
                      className="rounded-xl text-xs h-10"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={registering}
                      className="text-white font-bold text-xs h-10 px-6 rounded-xl shadow-md"
                      style={{ backgroundColor: primaryColor }}
                    >
                      {registering ? "Generating Pass..." : "Confirm & Generate Pass"}
                    </Button>
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
