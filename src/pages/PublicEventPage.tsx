import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  Calendar, 
  MapPin, 
  Clock, 
  Globe, 
  Share2, 
  CheckCircle2, 
  ShieldCheck, 
  ArrowRight, 
  Download, 
  Copy, 
  Check, 
  CreditCard, 
  Smartphone, 
  AlertCircle,
  X,
  Ticket,
  Printer,
  Image as ImageIcon,
  Video as VideoIcon,
  Play,
  Maximize2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import BrandLogo from '@/components/BrandLogo';
import { api } from '@/services/api';
import { printElement, downloadElementAsImage } from '@/lib/printUtils';
import { toast } from 'sonner';

export default function PublicEventPage() {
  const { slug } = useParams<{ slug: string }>();
  const [event, setEvent] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [currency, setCurrency] = useState<'USD' | 'PKR'>('USD');

  // Registration Modal State
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [ticketTier, setTicketTier] = useState('General Admission');
  const [regForm, setRegForm] = useState({
    name: '',
    email: '',
    phone: '',
    organization: '',
    designation: '',
    paymentMethod: 'free'
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [registeredAttendee, setRegisteredAttendee] = useState<any | null>(null);
  const [isDownloadingImage, setIsDownloadingImage] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  // Countdown timer
  const [timeLeft, setTimeLeft] = useState<{ days: number; hours: number; minutes: number; seconds: number }>({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0
  });

  useEffect(() => {
    async function fetchEvent() {
      if (!slug) return;
      setLoading(true);
      setError(null);
      try {
        const res = await api.events.getPublic(slug);
        if (res.success && res.event) {
          setEvent(res.event);
        } else {
          setError('Event not found or has been made private.');
        }
      } catch (err: any) {
        // Fallback: search in list
        try {
          const listRes = await api.events.list({ limit: 100 });
          const match = listRes.events.find((e: any) => e.slug === slug || String(e.id) === slug);
          if (match) {
            setEvent(match);
          } else {
            setError(err.message || 'Event not found.');
          }
        } catch {
          setError('Failed to load event details.');
        }
      } finally {
        setLoading(false);
      }
    }
    fetchEvent();
  }, [slug]);

  // Countdown calculation
  useEffect(() => {
    if (!event?.start_date) return;
    const target = new Date(`${event.start_date.split('T')[0]}T${event.start_time || '09:00'}:00`).getTime();

    const interval = setInterval(() => {
      const now = new Date().getTime();
      const diff = target - now;

      if (diff <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        clearInterval(interval);
      } else {
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);
        setTimeLeft({ days, hours, minutes, seconds });
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [event]);

  const handleCopyNoticeLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleShareWhatsApp = () => {
    if (!event) return;
    const text = encodeURIComponent(
      `🎉 You are cordially invited to *${event.title}*!\n\n` +
      `📅 Date: ${new Date(event.start_date).toLocaleDateString()} at ${event.start_time}\n` +
      `📍 Venue: ${event.venue_name || 'Online'}\n` +
      `🎟️ Register your official pass here: ${window.location.href}\n\n` +
      `Powered by Eventrye`
    );
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!event) return;
    setIsSubmitting(true);

    try {
      const res = await api.events.register(event.id, {
        name: regForm.name,
        email: regForm.email,
        phone: regForm.phone,
        ticketType: ticketTier,
        organization: regForm.organization,
        designation: regForm.designation,
        currency,
        paymentMethod: isFree ? 'free' : regForm.paymentMethod
      });

      if (res.success && res.registration) {
        setRegisteredAttendee(res.registration);

        // Real-Time Event Sync: Broadcast new attendee to dashboard
        try {
          if (typeof BroadcastChannel !== 'undefined') {
            const bc = new BroadcastChannel('eventrye_realtime_events');
            bc.postMessage({
              type: 'NEW_ATTENDEE_REGISTERED',
              eventId: event.id,
              eventTitle: event.title,
              attendee: res.registration,
              timestamp: new Date().toISOString()
            });
            bc.close();
          }
        } catch {}

        try {
          localStorage.setItem('evx_realtime_sync', JSON.stringify({
            eventId: event.id,
            eventTitle: event.title,
            attendeeName: regForm.name,
            time: Date.now()
          }));
        } catch {}
      } else {
        alert(res.message || 'Registration failed.');
      }
    } catch (err: any) {
      alert(err.message || 'Registration failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#faf8ff]">
        <div className="text-center">
          <div className="w-10 h-10 border-3 border-[#1d4ed8] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm font-semibold text-slate-600">Loading Official Public Event...</p>
        </div>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#faf8ff] px-4">
        <div className="max-w-md w-full bg-white p-8 rounded-3xl border border-slate-200 text-center shadow-lg">
          <AlertCircle className="w-12 h-12 text-rose-500 mx-auto mb-3" />
          <h2 className="text-2xl font-bold font-heading text-slate-900">Event Not Available</h2>
          <p className="text-sm text-slate-600 mt-2 mb-6">{error || 'This event does not exist or may have been unlisted.'}</p>
          <Link to="/" className="inline-block px-5 py-2.5 rounded-xl bg-[#1d4ed8] text-white text-xs font-bold">
            Back to Eventrye Home
          </Link>
        </div>
      </div>
    );
  }

  const isFree = !event.price || parseFloat(event.price) === 0;
  const priceUsd = Math.round(parseFloat(event.price_usd || event.price || 0));
  const pricePkr = Math.round(parseFloat(event.price_pkr || priceUsd * 280 || 0));
  const displayPrice = isFree ? 'Free' : currency === 'USD' ? `$${priceUsd}` : `PKR ${pricePkr.toLocaleString()}`;

  const sponsorsList = Array.isArray(event.sponsors) ? event.sponsors : [];
  const agendaList = Array.isArray(event.agenda) ? event.agenda : [];

  let galleryList: string[] = [];
  if (Array.isArray(event.gallery_images)) {
    galleryList = event.gallery_images;
  } else if (typeof event.gallery_images === 'string' && event.gallery_images.trim()) {
    try { galleryList = JSON.parse(event.gallery_images); } catch {}
  }

  let videoList: string[] = [];
  if (Array.isArray(event.videos)) {
    videoList = event.videos;
  } else if (typeof event.videos === 'string' && event.videos.trim()) {
    try { videoList = JSON.parse(event.videos); } catch {}
  } else if (event.video_url) {
    videoList = [event.video_url];
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 antialiased">
      {/* Top Navigation Bar */}
      <nav className="bg-white/90 backdrop-blur-md border-b border-slate-200 sticky top-0 z-40 px-4 py-3">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <BrandLogo size="md" />

          <div className="flex items-center gap-2 sm:gap-3">
            {/* Currency switch */}
            <div className="inline-flex rounded-xl p-0.5 bg-slate-100 border border-slate-200 text-xs">
              <button
                onClick={() => setCurrency('USD')}
                className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                  currency === 'USD' ? 'bg-[#1d4ed8] text-white' : 'text-slate-600'
                }`}
              >
                USD ($)
              </button>
              <button
                onClick={() => setCurrency('PKR')}
                className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                  currency === 'PKR' ? 'bg-[#1d4ed8] text-white' : 'text-slate-600'
                }`}
              >
                PKR (Rs)
              </button>
            </div>

            <Button
              onClick={() => setIsRegisterOpen(true)}
              className="bg-[#1d4ed8] hover:bg-[#1e40af] text-white rounded-xl px-4 py-2 text-xs font-bold shadow-md shadow-blue-600/20 flex items-center gap-1.5"
            >
              <Ticket className="w-3.5 h-3.5" />
              Register Pass
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Banner Section */}
      <section className="relative overflow-hidden bg-slate-950 text-white">
        {/* Background Image with Gradient Overlay */}
        <div className="absolute inset-0 z-0 opacity-30">
          <img
            src={event.banner_image || 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=1600&q=80'}
            alt={event.title}
            className="w-full h-full object-cover"
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/80 to-transparent z-0" />

        <div className="max-w-6xl mx-auto px-4 py-16 md:py-24 relative z-10">
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <Badge className="bg-blue-600/90 text-white font-bold text-xs uppercase tracking-wider px-3 py-1">
              {event.category || 'Event'}
            </Badge>
            <Badge className="bg-slate-800 text-blue-200 border border-slate-700 text-xs capitalize">
              {event.format || event.event_type || 'In-Person'} Format
            </Badge>
            {event.type && (
              <Badge className="bg-slate-800 text-amber-300 border border-slate-700 text-xs capitalize">
                {event.type}
              </Badge>
            )}
            {isFree ? (
              <Badge className="bg-emerald-500/90 text-white font-bold text-xs">
                FREE ATTENDANCE
              </Badge>
            ) : (
              <Badge className="bg-purple-600/90 text-white font-bold text-xs">
                {displayPrice}
              </Badge>
            )}
          </div>

          <h1 className="font-heading text-3xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-white mb-6 max-w-4xl leading-tight">
            {event.title}
          </h1>

          <p className="text-base sm:text-lg text-slate-300 max-w-2xl leading-relaxed mb-8">
            {event.description || 'Join regional and international participants for an unforgettable experience.'}
          </p>

          {/* Metadata Quick Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/15 max-w-3xl mb-8">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-600/30 flex items-center justify-center text-blue-300">
                <Calendar className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[11px] text-slate-400 block uppercase font-bold tracking-wider">Date</span>
                <span className="text-xs font-bold text-white">
                  {new Date(event.start_date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-600/30 flex items-center justify-center text-blue-300">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[11px] text-slate-400 block uppercase font-bold tracking-wider">Time</span>
                <span className="text-xs font-bold text-white">
                  {event.start_time || '09:00'} - {event.end_time || '17:00'}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-600/30 flex items-center justify-center text-blue-300">
                <MapPin className="w-5 h-5" />
              </div>
              <div className="truncate">
                <span className="text-[11px] text-slate-400 block uppercase font-bold tracking-wider">Location</span>
                <span className="text-xs font-bold text-white truncate block">
                  {event.city ? `${event.venue_name || 'Venue'}, ${event.city}` : event.venue_name || 'Online Live'}
                </span>
              </div>
            </div>
          </div>

          {/* Countdown & Action */}
          <div className="flex flex-wrap items-center justify-between gap-6 pt-4 border-t border-white/15 max-w-3xl">
            {/* Countdown Tiles */}
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="bg-white/10 backdrop-blur-md px-3 py-2 rounded-xl text-center min-w-[54px] border border-white/10">
                <span className="font-heading text-lg sm:text-2xl font-extrabold text-white block">{timeLeft.days}</span>
                <span className="text-[10px] text-slate-400 uppercase font-bold">Days</span>
              </div>
              <div className="bg-white/10 backdrop-blur-md px-3 py-2 rounded-xl text-center min-w-[54px] border border-white/10">
                <span className="font-heading text-lg sm:text-2xl font-extrabold text-white block">{timeLeft.hours}</span>
                <span className="text-[10px] text-slate-400 uppercase font-bold">Hours</span>
              </div>
              <div className="bg-white/10 backdrop-blur-md px-3 py-2 rounded-xl text-center min-w-[54px] border border-white/10">
                <span className="font-heading text-lg sm:text-2xl font-extrabold text-white block">{timeLeft.minutes}</span>
                <span className="text-[10px] text-slate-400 uppercase font-bold">Mins</span>
              </div>
              <div className="bg-white/10 backdrop-blur-md px-3 py-2 rounded-xl text-center min-w-[54px] border border-white/10">
                <span className="font-heading text-lg sm:text-2xl font-extrabold text-white block">{timeLeft.seconds}</span>
                <span className="text-[10px] text-slate-400 uppercase font-bold">Secs</span>
              </div>
            </div>

            {/* CTAs */}
            <div className="flex items-center gap-3">
              <Button
                onClick={() => setIsRegisterOpen(true)}
                className="bg-[#1d4ed8] hover:bg-[#1e40af] text-white font-bold rounded-2xl px-6 py-6 text-sm shadow-xl shadow-blue-500/30 flex items-center gap-2"
              >
                <span>Book Pass ({displayPrice})</span>
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Main Body Grid */}
      <main className="max-w-6xl mx-auto px-4 py-12 grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column (2 cols): Details, Agenda, Sponsors, Policies */}
        <div className="lg:col-span-2 space-y-10">
          {/* Share Notice Banner */}
          <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 p-5 rounded-2xl border border-blue-200 flex flex-wrap items-center justify-between gap-4">
            <div>
              <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <Share2 className="w-4 h-4 text-[#1d4ed8]" />
                Share & Forward Official Event Notice
              </h3>
              <p className="text-xs text-slate-600 mt-0.5">
                Invite friends, teams, and attendees directly via WhatsApp or copy direct link.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleShareWhatsApp}
                className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm"
              >
                <Smartphone className="w-3.5 h-3.5" />
                WhatsApp Forward
              </button>
              <button
                onClick={handleCopyNoticeLink}
                className="px-3.5 py-2 rounded-xl bg-white border border-slate-300 hover:bg-slate-50 text-slate-800 text-xs font-bold flex items-center gap-1.5"
              >
                {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                {copiedLink ? 'Link Copied' : 'Copy Notice Link'}
              </button>
            </div>
          </div>

          {/* Official Media Showcase: Event Photo Gallery & Videos */}
          {(galleryList.length > 0 || videoList.length > 0) && (
            <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xs space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-4">
                <div>
                  <h3 className="text-xl font-bold font-heading text-slate-900 flex items-center gap-2">
                    <ImageIcon className="w-5 h-5 text-[#1d4ed8]" />
                    Event Media Showcase & Highlights
                  </h3>
                  <p className="text-xs text-slate-500">Official photo gallery, venue previews, and video stream</p>
                </div>
                <div className="flex items-center gap-2">
                  {galleryList.length > 0 && (
                    <Badge variant="outline" className="text-xs font-semibold text-blue-700 border-blue-200 bg-blue-50">
                      {galleryList.length} Photo{galleryList.length !== 1 ? 's' : ''}
                    </Badge>
                  )}
                  {videoList.length > 0 && (
                    <Badge variant="outline" className="text-xs font-semibold text-indigo-700 border-indigo-200 bg-indigo-50">
                      {videoList.length} Video{videoList.length !== 1 ? 's' : ''}
                    </Badge>
                  )}
                </div>
              </div>

              {/* Video Clips Player */}
              {videoList.length > 0 && (
                <div className="space-y-3">
                  <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                    <VideoIcon className="w-3.5 h-3.5 text-indigo-600" />
                    Featured Event Video & Clips
                  </span>
                  <div className="grid grid-cols-1 gap-4">
                    {videoList.map((vidUrl: string, idx: number) => {
                      const isDirect = vidUrl.endsWith('.mp4') || vidUrl.endsWith('.webm') || vidUrl.includes('/uploads/videos/');
                      return (
                        <div key={idx} className="rounded-2xl overflow-hidden border border-slate-200 bg-slate-950 shadow-md">
                          {isDirect ? (
                            <video
                              src={vidUrl}
                              controls
                              preload="metadata"
                              className="w-full max-h-[420px] object-contain bg-black"
                            />
                          ) : (
                            <div className="aspect-video w-full">
                              <iframe
                                src={vidUrl.includes('youtube.com/watch?v=') ? vidUrl.replace('watch?v=', 'embed/') : vidUrl}
                                title={`Event Video ${idx + 1}`}
                                allowFullScreen
                                className="w-full h-full border-0"
                              />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Photo Gallery Grid */}
              {galleryList.length > 0 && (
                <div className="space-y-3">
                  <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                    <ImageIcon className="w-3.5 h-3.5 text-blue-600" />
                    Official Photo Gallery
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                    {galleryList.map((imgUrl: string, idx: number) => (
                      <div
                        key={idx}
                        onClick={() => setSelectedImage(imgUrl)}
                        className="group relative aspect-video rounded-xl overflow-hidden border border-slate-200 bg-slate-100 cursor-pointer shadow-xs hover:shadow-md transition-all"
                      >
                        <img
                          src={imgUrl}
                          alt={`Event Photo ${idx + 1}`}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                          <Maximize2 className="w-5 h-5 drop-shadow-md" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Agenda & Sessions */}
          {agendaList.length > 0 && (
            <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold font-heading text-slate-900">Event Schedule & Agenda</h3>
                  <p className="text-xs text-slate-500">Comprehensive itinerary of sessions, keynotes, and breaks</p>
                </div>
                <Badge variant="outline" className="text-xs font-semibold">
                  {agendaList.length} Sessions
                </Badge>
              </div>

              <div className="space-y-4 pt-2">
                {agendaList.map((session: any, idx: number) => (
                  <div key={idx} className="flex gap-4 p-3.5 rounded-2xl bg-slate-50 border border-slate-100 hover:border-blue-200 transition-colors">
                    <div className="text-xs font-extrabold text-[#1d4ed8] min-w-[70px] pt-0.5 font-mono">
                      {session.time}
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-900">{session.title}</h4>
                      {session.speaker && (
                        <p className="text-xs text-slate-500 mt-0.5 font-medium">Speaker: {session.speaker}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 10+ Sponsors & Partners Wall */}
          {sponsorsList.length > 0 && (
            <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold font-heading text-slate-900">Official Sponsors & Partners</h3>
                  <p className="text-xs text-slate-500">Supported by industry leaders and regional organizations</p>
                </div>
                <Badge className="bg-blue-100 text-blue-800 text-xs">
                  {sponsorsList.length}+ Sponsors
                </Badge>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 pt-2">
                {sponsorsList.map((sponsor: any, idx: number) => (
                  <a
                    key={idx}
                    href={sponsor.website || '#'}
                    target="_blank"
                    rel="noreferrer"
                    className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 hover:bg-white hover:border-blue-300 hover:shadow-md transition-all flex flex-col items-center justify-center text-center group"
                  >
                    <div className="w-12 h-12 flex items-center justify-center mb-2 overflow-hidden">
                      <img
                        src={sponsor.logo}
                        alt={sponsor.name}
                        className="max-h-10 max-w-full object-contain filter group-hover:scale-105 transition-transform"
                      />
                    </div>
                    <span className="text-xs font-bold text-slate-900 block truncate w-full">{sponsor.name}</span>
                    <span className="text-[10px] text-slate-500 block uppercase font-semibold">{sponsor.tier}</span>
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Refund & Cancellation Policies */}
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xs space-y-4">
            <h3 className="text-xl font-bold font-heading text-slate-900">Policies & Terms</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-slate-600">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                <span className="font-bold text-slate-900 block mb-1">Cancellation Policy</span>
                <p className="leading-relaxed">
                  {event.cancellation_policy || 'Organizers reserve the right to reschedule or update speaker schedules. Registered participants will receive automatic notices.'}
                </p>
              </div>
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                <span className="font-bold text-slate-900 block mb-1">Refund Policy</span>
                <p className="leading-relaxed">
                  {event.refund_policy || (isFree ? 'Free event: no financial commitments or refund processing required.' : 'Paid tickets are non-refundable within 7 days of event date unless explicitly postponed.')}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column (1 col): Venue Card, Organizer Profile, Registration Card */}
        <div className="space-y-6">
          {/* Ticket Booking Card */}
          <div className="bg-white p-6 rounded-3xl border-2 border-[#1d4ed8] shadow-xl shadow-blue-500/10 space-y-4">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <span className="text-xs font-bold text-slate-500 uppercase">Admission Pass</span>
              <span className="text-2xl font-extrabold text-[#1d4ed8] font-heading">{displayPrice}</span>
            </div>

            <div className="space-y-2 text-xs text-slate-600">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Instant Digital QR Ticket & Printable ID Card</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Camera QR Check-in Pass</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Verified SHA-256 Event Certificate eligibility</span>
              </div>
            </div>

            <Button
              onClick={() => setIsRegisterOpen(true)}
              className="w-full bg-[#1d4ed8] hover:bg-[#1e40af] text-white font-bold rounded-2xl py-6 text-sm shadow-lg shadow-blue-600/25 flex items-center justify-center gap-2"
            >
              <Ticket className="w-4 h-4" />
              <span>Register Now</span>
            </Button>
          </div>

          {/* Organizer Profile Card */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">Event Organizer</h4>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-200 overflow-hidden flex items-center justify-center">
                <img
                  src={event.organizer_logo || '/images/eventrye-logo-concept9.jpg'}
                  alt={event.organizer_name || 'Organizer'}
                  className="w-full h-full object-cover"
                />
              </div>
              <div>
                <h5 className="font-bold text-sm text-slate-900">{event.organizer_name || 'Eventrye Verified Host'}</h5>
                <span className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Verified Organization
                </span>
              </div>
            </div>
            {event.organizer_bio && (
              <p className="text-xs text-slate-600 leading-relaxed">{event.organizer_bio}</p>
            )}
            <div className="pt-2 border-t border-slate-100 text-xs space-y-1 text-slate-500">
              {event.organizer_email && <div>Email: <span className="text-slate-900 font-medium">{event.organizer_email}</span></div>}
              {event.organizer_phone && <div>Phone: <span className="text-slate-900 font-medium">{event.organizer_phone}</span></div>}
            </div>
          </div>

          {/* Venue & Location Details */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">Venue Details</h4>
            <div className="space-y-1 text-xs">
              <div className="font-bold text-sm text-slate-900">{event.venue_name || 'Venue TBA'}</div>
              {event.venue_address && <div className="text-slate-600">{event.venue_address}</div>}
              {event.city && <div className="text-slate-500">{event.city}, {event.country || 'Pakistan'}</div>}
              {event.virtual_link && (
                <div className="pt-2 text-blue-600 font-bold flex items-center gap-1">
                  <Globe className="w-3.5 h-3.5" />
                  Live Broadcast Link Provided Post-Registration
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* REGISTRATION & CHECKOUT MODAL */}
      {isRegisterOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-6">
            {/* Header */}
            <div className="bg-gradient-to-r from-[#1d4ed8] to-[#2563eb] text-white p-6 relative">
              <button
                onClick={() => {
                  setIsRegisterOpen(false);
                  setRegisteredAttendee(null);
                }}
                className="absolute top-5 right-5 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white"
              >
                <X className="w-5 h-5" />
              </button>
              <h3 className="text-2xl font-bold font-heading">
                {registeredAttendee ? 'Pass Issued Successfully!' : `Register for ${event.title}`}
              </h3>
              <p className="text-xs text-blue-100 mt-1">
                {registeredAttendee ? 'Save your Attendee ID Card below for venue access.' : 'Fill out your attendee details to receive your ID badge.'}
              </p>
            </div>

            {!registeredAttendee ? (
              <form onSubmit={handleRegisterSubmit} className="p-6 space-y-5">
                {/* Ticket Tier Selector */}
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1.5">Select Ticket Tier</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setTicketTier('General Admission')}
                      className={`p-3 rounded-2xl border text-left text-xs font-bold transition-all ${
                        ticketTier === 'General Admission'
                          ? 'border-[#1d4ed8] bg-blue-50/60 ring-2 ring-blue-500/20 text-[#1d4ed8]'
                          : 'border-slate-200 text-slate-700 hover:border-blue-300'
                      }`}
                    >
                      General Admission
                      <span className="block text-[11px] text-slate-500 font-normal mt-0.5">{displayPrice}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setTicketTier('VIP Access Pass')}
                      className={`p-3 rounded-2xl border text-left text-xs font-bold transition-all ${
                        ticketTier === 'VIP Access Pass'
                          ? 'border-[#1d4ed8] bg-blue-50/60 ring-2 ring-blue-500/20 text-[#1d4ed8]'
                          : 'border-slate-200 text-slate-700 hover:border-blue-300'
                      }`}
                    >
                      VIP Access Pass
                      <span className="block text-[11px] text-slate-500 font-normal mt-0.5">
                        {isFree ? 'Free VIP' : currency === 'USD' ? `$${priceUsd + 25}` : `PKR ${(pricePkr + 7000).toLocaleString()}`}
                      </span>
                    </button>
                  </div>
                </div>

                {/* Attendee Form Fields */}
                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">Full Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Usman Tariq"
                      value={regForm.name}
                      onChange={(e) => setRegForm({ ...regForm, name: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">Email Address *</label>
                      <input
                        type="email"
                        required
                        placeholder="usman@example.com"
                        value={regForm.email}
                        onChange={(e) => setRegForm({ ...regForm, email: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">Phone / WhatsApp</label>
                      <input
                        type="text"
                        placeholder="+92 300 1234567"
                        value={regForm.phone}
                        onChange={(e) => setRegForm({ ...regForm, phone: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">Organization / Institute</label>
                      <input
                        type="text"
                        placeholder="e.g. National Incubation Center"
                        value={regForm.organization}
                        onChange={(e) => setRegForm({ ...regForm, organization: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">Designation / Role</label>
                      <input
                        type="text"
                        placeholder="e.g. Software Engineer"
                        value={regForm.designation}
                        onChange={(e) => setRegForm({ ...regForm, designation: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Payment Options (if paid) */}
                {!isFree && (
                  <div className="space-y-2 pt-2 border-t border-slate-100">
                    <label className="text-xs font-bold text-slate-700 block">Select Payment Method</label>
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        type="button"
                        onClick={() => setRegForm({ ...regForm, paymentMethod: 'card' })}
                        className={`p-2.5 rounded-xl border text-center text-xs font-bold ${
                          regForm.paymentMethod === 'card' ? 'border-[#1d4ed8] bg-blue-50 text-[#1d4ed8]' : 'border-slate-200'
                        }`}
                      >
                        <CreditCard className="w-4 h-4 mx-auto mb-1" />
                        Card (Stripe)
                      </button>
                      <button
                        type="button"
                        onClick={() => setRegForm({ ...regForm, paymentMethod: 'jazzcash' })}
                        className={`p-2.5 rounded-xl border text-center text-xs font-bold ${
                          regForm.paymentMethod === 'jazzcash' ? 'border-red-600 bg-red-50 text-red-600' : 'border-slate-200'
                        }`}
                      >
                        <Smartphone className="w-4 h-4 mx-auto mb-1 text-red-600" />
                        JazzCash
                      </button>
                      <button
                        type="button"
                        onClick={() => setRegForm({ ...regForm, paymentMethod: 'easypaisa' })}
                        className={`p-2.5 rounded-xl border text-center text-xs font-bold ${
                          regForm.paymentMethod === 'easypaisa' ? 'border-emerald-600 bg-emerald-50 text-emerald-600' : 'border-slate-200'
                        }`}
                      >
                        <Smartphone className="w-4 h-4 mx-auto mb-1 text-emerald-600" />
                        Easypaisa
                      </button>
                    </div>
                  </div>
                )}

                <div className="pt-2 border-t border-slate-200 flex items-center justify-between">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsRegisterOpen(false)}
                    className="rounded-xl px-5 text-xs"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="bg-[#1d4ed8] hover:bg-[#1e40af] text-white font-bold rounded-xl px-6 h-11 text-xs shadow-md shadow-blue-600/25 flex items-center gap-2"
                  >
                    {isSubmitting ? 'Issuing Pass...' : `Confirm Registration (${displayPrice})`}
                  </Button>
                </div>
              </form>
            ) : (
              /* INSTANT ATTENDEE ID CARD / BADGE PREVIEW */
              <div className="p-6 text-center space-y-6">
                <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto">
                  <Check className="w-7 h-7 stroke-[3]" />
                </div>

                <div>
                  <h4 className="text-xl font-bold font-heading text-slate-900">Registration Confirmed!</h4>
                  <p className="text-xs text-slate-600 mt-1">
                    Your official badge is ready. Present this QR code or badge at the check-in desk.
                  </p>
                </div>

                {/* Printable ID Card Badge Component */}
                <div 
                  id="public-event-pass-card"
                  className="w-full max-w-[320px] mx-auto text-white rounded-3xl p-6 border-2 border-blue-400 shadow-2xl relative overflow-hidden text-center min-h-[520px] flex flex-col justify-between"
                  style={{
                    background: 'linear-gradient(180deg, #0f172a 0%, #0b1329 50%, #0f172a 100%)',
                    backgroundColor: '#0f172a',
                    color: '#ffffff',
                    borderColor: '#60a5fa',
                    boxShadow: '0 25px 50px -12px rgba(15, 23, 42, 0.45)',
                    pageBreakInside: 'avoid',
                    breakInside: 'avoid'
                  }}
                >
                  {/* Lanyard punch hole indicator */}
                  <div 
                    className="w-12 h-3 rounded-full mx-auto mb-3 border shrink-0"
                    style={{ backgroundColor: '#020617', borderColor: '#334155' }}
                  />

                  {/* Event Title */}
                  <div className="shrink-0">
                    <div className="text-[11px] font-black tracking-widest text-blue-300 uppercase truncate mb-0.5">
                      {event.title}
                    </div>
                    <div className="text-[9px] text-slate-300">
                      {event.venue_name || 'Eventrye Venue'} • {new Date(event.start_date).toLocaleDateString()}
                    </div>
                  </div>

                  {/* Avatar / Photo placeholder */}
                  <div className="my-auto py-2">
                    <div 
                      className="w-18 h-18 rounded-2xl p-1 mx-auto mb-2 shadow-lg"
                      style={{ background: 'linear-gradient(135deg, #2563eb 0%, #6366f1 50%, #9333ea 100%)' }}
                    >
                      <div 
                        className="w-full h-full rounded-xl flex items-center justify-center font-bold text-xl text-white"
                        style={{ backgroundColor: '#0f172a' }}
                      >
                        {String(registeredAttendee?.name || 'AT').split(/\s+/).map((n: string) => n[0] || '').filter(Boolean).slice(0, 2).join('').toUpperCase() || 'AT'}
                      </div>
                    </div>

                    {/* Attendee Name & Designation */}
                    <h5 className="font-heading font-extrabold text-lg text-white truncate px-1">
                      {registeredAttendee.name}
                    </h5>
                    <p className="text-[11px] text-blue-200 truncate mt-0.5 font-medium">
                      {registeredAttendee.designation || 'Participant'}
                    </p>
                    <p className="text-[10px] text-slate-300 truncate">
                      {registeredAttendee.organization || 'Attendee'}
                    </p>

                    {/* Tier Badge */}
                    <div className="my-2.5">
                      <span 
                        className="inline-block px-3.5 py-1 rounded-full text-[10px] font-extrabold tracking-wider uppercase text-white shadow-sm"
                        style={{ backgroundColor: '#2563eb', color: '#ffffff' }}
                      >
                        {registeredAttendee.ticketType || 'VIP ACCESS PASS'}
                      </span>
                    </div>

                    {/* Real Scannable QR Code */}
                    <div 
                      className="p-2 rounded-2xl inline-block shadow-md my-1"
                      style={{ backgroundColor: '#ffffff' }}
                    >
                      <img
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(`${window.location.origin}/verify?code=${registeredAttendee.ticketCode}`)}`}
                        alt="Event Pass QR"
                        width="64"
                        height="64"
                        className="w-16 h-16 object-contain rounded-md"
                        style={{ width: '64px', height: '64px', minWidth: '64px', minHeight: '64px' }}
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64"><rect width="64" height="64" fill="white"/><rect x="6" y="6" width="20" height="20" fill="black"/><rect x="10" y="10" width="12" height="12" fill="white"/><rect x="14" y="14" width="4" height="4" fill="black"/><rect x="38" y="6" width="20" height="20" fill="black"/><rect x="42" y="10" width="12" height="12" fill="white"/><rect x="46" y="14" width="4" height="4" fill="black"/><rect x="6" y="38" width="20" height="20" fill="black"/><rect x="10" y="42" width="12" height="12" fill="white"/><rect x="14" y="46" width="4" height="4" fill="black"/></svg>`;
                        }}
                      />
                    </div>

                    {/* Barcode lines */}
                    <div className="mt-1 flex flex-col items-center">
                      <div className="h-3.5 flex items-center justify-center gap-0.5 max-w-[160px] mx-auto opacity-80">
                        {[2, 1, 3, 1, 2, 4, 1, 3, 2, 1, 4, 2, 1, 3, 2, 1].map((w, i) => (
                          <span
                            key={i}
                            className="h-full rounded-xs"
                            style={{ width: `${w * 1.4}px`, backgroundColor: '#ffffff' }}
                          />
                        ))}
                      </div>
                      <div className="text-[10px] font-mono text-blue-200 mt-1 font-bold tracking-wider">
                        {registeredAttendee.ticketCode}
                      </div>
                    </div>
                  </div>

                  {/* Pass Footer */}
                  <div 
                    className="pt-2.5 border-t text-[9px] flex items-center justify-between shrink-0"
                    style={{ borderColor: 'rgba(255, 255, 255, 0.15)', color: '#94a3b8' }}
                  >
                    <span className="font-bold" style={{ color: '#34d399' }}>VERIFIED PASS</span>
                    <span style={{ color: '#cbd5e1' }}>Eventrye Platform</span>
                  </div>
                </div>

                {/* Badge Actions */}
                <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5 pt-2">
                  <Button
                    onClick={async () => {
                      setIsDownloadingImage(true);
                      toast.info('Generating high-resolution ID Badge image...');
                      const ok = await downloadElementAsImage(
                        'public-event-pass-card', 
                        `${registeredAttendee.name.replace(/\s+/g, '_')}_Eventrye_Pass.png`,
                        3
                      );
                      setIsDownloadingImage(false);
                      if (ok) {
                        toast.success('ID Badge image saved successfully!');
                      } else {
                        toast.error('Failed to capture badge image. Please use Print / PDF option.');
                      }
                    }}
                    disabled={isDownloadingImage}
                    className="rounded-xl text-xs font-bold w-full sm:w-auto flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-md shadow-blue-500/25 h-11 px-4 cursor-pointer"
                  >
                    <Download className="w-4 h-4" />
                    {isDownloadingImage ? 'Generating Image...' : 'Save Badge (HD Image)'}
                  </Button>

                  <Button
                    onClick={() => printElement('public-event-pass-card', `${registeredAttendee.name} - ${event.title} Pass`)}
                    variant="outline"
                    className="rounded-xl text-xs font-bold w-full sm:w-auto flex items-center gap-2 h-11 px-4 border-slate-300 hover:bg-slate-50 text-slate-700 cursor-pointer"
                  >
                    <Printer className="w-4 h-4 text-blue-600" />
                    Print / Save PDF
                  </Button>

                  <Button
                    onClick={() => {
                      setIsRegisterOpen(false);
                      setRegisteredAttendee(null);
                    }}
                    variant="ghost"
                    className="rounded-xl text-xs font-semibold w-full sm:w-auto h-11 px-3 text-slate-500 hover:text-slate-900"
                  >
                    Done
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Lightbox Photo Modal */}
      {selectedImage && (
        <div 
          onClick={() => setSelectedImage(null)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in duration-200"
        >
          <div className="relative max-w-4xl max-h-[90vh] flex flex-col items-center">
            <button
              onClick={() => setSelectedImage(null)}
              className="absolute -top-12 right-0 p-2 text-white hover:text-slate-300 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
            <img
              src={selectedImage}
              alt="Enlarged Event Preview"
              className="max-w-full max-h-[85vh] object-contain rounded-2xl shadow-2xl border border-white/20"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}
    </div>
  );
}
