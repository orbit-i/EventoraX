import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Sparkles,
  CheckCircle2,
  Calendar,
  Building2,
  Phone,
  CreditCard,
  Send,
  AlertCircle,
  Copy,
  Check,
  Wallet,
  ShieldCheck
} from 'lucide-react';
import api from '../services/api';

interface Plan {
  id: string;
  name: string;
  badge: string;
  popular?: boolean;
  is_vip?: boolean;
  listing_fee_pkr: number;
  listing_fee_usd: number;
  commission_rate_percent: number;
  commission_fixed_pkr: number;
  tagline: string;
  payout_schedule: string;
  features: string[];
}

const fallbackPlans: Plan[] = [
  {
    id: 'standard',
    name: 'Standard Community Listing',
    badge: 'Starter',
    listing_fee_pkr: 999,
    listing_fee_usd: 4,
    commission_rate_percent: 5.0,
    commission_fixed_pkr: 15,
    tagline: 'Ideal for tech communities, university societies, and local seminars',
    payout_schedule: '48-72 hours post-event',
    features: [
      'Public listing on Eventrye Marketplace upon Admin Approval',
      'Automated dynamic QR code passes & mobile check-in scanning',
      'Instant attendee payments via SadaPay & NayaPay',
      'Standard attendee analytics & downloadable CSV exports',
      'Automated digital ticket dispatch & confirmation receipts',
      'Review and activation by ORBIT-I Administration'
    ]
  },
  {
    id: 'featured',
    name: 'Featured Spotlight',
    badge: 'Most Popular',
    popular: true,
    listing_fee_pkr: 4999,
    listing_fee_usd: 19,
    commission_rate_percent: 3.5,
    commission_fixed_pkr: 0,
    tagline: 'Best for tech conferences, professional symposiums, and masterclasses',
    payout_schedule: 'Fast 24-hour turnaround',
    features: [
      'Everything in Standard Community Listing',
      'Priority Admin Approval & Verified Badge',
      'Featured placement on Homepage Spotlight & Directory header',
      'Dedicated social media shoutout across ORBIT-I networks',
      'Direct payouts to your SadaPay or NayaPay account',
      'Priority WhatsApp & phone organizer support desk'
    ]
  },
  {
    id: 'vip',
    name: 'VIP Showcase & Enterprise Partner',
    badge: 'VIP Showcase',
    is_vip: true,
    listing_fee_pkr: 14999,
    listing_fee_usd: 55,
    commission_rate_percent: 2.5,
    commission_fixed_pkr: 0,
    tagline: 'For major annual summits, national hackathons, and multi-track expos',
    payout_schedule: 'Instant Same-Day Settlement',
    features: [
      'Everything in Featured Spotlight',
      'Instant Priority Admin Fast-Track Approval',
      'Permanent sticky hero banner placement across all directory pages',
      'VIP Gold Verified Organizer Shield on event page & tickets',
      'Tamper-evident SHA-256 digital passport passes & ID cards',
      'Lowest 2.5% platform commission on all ticket sales',
      '24/7 VIP dedicated account manager & on-call technician'
    ]
  }
];

const fallbackAccounts = {
  sadapay: {
    title: 'ORBIT-I Private Limited',
    account_number: '03190375751',
    iban: 'PK03SADA0000003190375751'
  },
  nayapay: {
    title: 'ORBIT-I Private Limited',
    nayapay_id: 'orbit-i@nayapay',
    account_number: '03190375751'
  },
  currency: 'PKR',
  support_whatsapp: '+923190375751',
  support_email: 'eventrye@orbit-i.tech'
};

const presetBanners = [
  { label: 'Tech & AI Summit', url: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1200&auto=format&fit=crop&q=80' },
  { label: 'Healthcare & Science', url: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=1200&auto=format&fit=crop&q=80' },
  { label: 'Business & FinTech', url: 'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?w=1200&auto=format&fit=crop&q=80' },
  { label: 'Concert & Culture', url: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=1200&auto=format&fit=crop&q=80' },
  { label: 'Startup Hackathon', url: 'https://images.unsplash.com/photo-1515187029135-18ee286d815b?w=1200&auto=format&fit=crop&q=80' }
];

export default function ListYourEvent() {
  const [plans, setPlans] = useState<Plan[]>(fallbackPlans);
  const [accounts, setAccounts] = useState(fallbackAccounts);
  const [selectedPlanId, setSelectedPlanId] = useState<string>('featured');
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    organizer_name: '',
    organizer_org: '',
    organizer_email: '',
    organizer_phone: '',
    payout_channel: 'sadapay',
    payout_account_title: '',
    payout_account_number: '',
    title: '',
    category: 'Technology & AI',
    event_type: 'In-Person Summit',
    start_date: '2026-11-15T09:00',
    end_date: '2026-11-15T18:00',
    location: '',
    city: 'Islamabad',
    banner_url: presetBanners[0].url,
    description: '',
    ticket_name: 'General Delegate Pass',
    ticket_price_pkr: 2500,
    ticket_capacity: 200,
    payment_method: 'sadapay',
    payment_reference: '',
    notes: ''
  });

  const [submitting, setSubmitting] = useState(false);
  const [submittedResult, setSubmittedResult] = useState<any | null>(null);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    api.directoryEvents.getPlans()
      .then(res => {
        if (res?.success && Array.isArray(res.plans) && res.plans.length > 0) {
          setPlans(res.plans);
        }
        if (res?.accounts) {
          setAccounts(res.accounts);
        }
      })
      .catch(() => {
        // Fallback remains active
      });
  }, []);

  const selectedPlan = plans.find(p => p.id === selectedPlanId) || plans[1];

  const handleCopy = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!formData.title.trim() || !formData.organizer_name.trim() || !formData.organizer_email.trim()) {
      setErrorMsg('Please enter your organizer name, official email, and event title.');
      return;
    }

    if (!formData.payment_reference.trim()) {
      setErrorMsg(`Please enter your Transaction ID (TID) from your SadaPay or NayaPay receipt for the ${selectedPlan.name} listing fee (Rs. ${selectedPlan.listing_fee_pkr.toLocaleString()}).`);
      return;
    }

    setSubmitting(true);

    try {
      const payload = {
        ...formData,
        plan_id: selectedPlan.id,
        listing_fee_pkr: selectedPlan.listing_fee_pkr,
        commission_rate_percent: selectedPlan.commission_rate_percent,
        ticket_tiers: [
          {
            id: 'standard',
            name: formData.ticket_name || 'General Admission',
            price_pkr: Number(formData.ticket_price_pkr || 0),
            price_usd: Math.round((Number(formData.ticket_price_pkr || 0) / 280) * 10) / 10,
            perks: ['Full Event Access', 'Digital QR Pass', 'Tamper-Evident Certificate'],
            available: Number(formData.ticket_capacity || 100),
            sold: 0
          }
        ]
      };

      const res = await api.directoryEvents.submitListing(payload);

      if (res?.success) {
        setSubmittedResult({
          reference_code: res.reference_code,
          plan: selectedPlan,
          title: formData.title,
          organizer: formData.organizer_name
        });
      } else {
        setErrorMsg(res?.message || 'Failed to submit event listing.');
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Network error occurred while submitting event.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#f8fafc] pb-24 font-body">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-[#f8fafc] via-[#eff6ff]/40 to-white py-16 md:py-20 border-b border-[#e2e8f0]">
        <div className="content-max text-center relative z-10 px-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 text-[#1d4ed8] text-xs font-bold uppercase tracking-wider mb-5 border border-blue-200/80 shadow-xs">
            <Sparkles className="w-4 h-4 text-amber-500" />
            <span>Eventrye Public Marketplace &bull; Admin Approval &amp; Verified Listing</span>
          </div>

          <h1 className="font-heading text-3xl sm:text-5xl md:text-6xl font-extrabold tracking-tight mb-5 text-[#0f172a] max-w-4xl mx-auto leading-tight">
            Publish Your Event &amp;{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#1d4ed8] via-[#4338ca] to-[#7c3aed]">
              Maximize Attendee Turnout
            </span>
          </h1>

          <p className="font-body text-sm sm:text-base md:text-lg max-w-3xl mx-auto text-[#475569] leading-relaxed mb-8">
            Host national tech summits, medical conferences, hackathons, and corporate seminars. Enjoy bank-grade dynamic QR ticketing, instant Pakistani payment gateways (SadaPay &amp; NayaPay), and direct automated payouts with low platform commissions.
          </p>

          {/* Quick Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 max-w-4xl mx-auto mt-6">
            <div className="p-4 rounded-2xl bg-white border border-[#e2e8f0] shadow-xs hover:border-slate-300 transition-all">
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Platform Commission</div>
              <div className="font-heading text-xl sm:text-2xl font-black text-[#1d4ed8] mt-1">From 2.5%</div>
            </div>
            <div className="p-4 rounded-2xl bg-white border border-[#e2e8f0] shadow-xs hover:border-slate-300 transition-all">
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Payment Rails</div>
              <div className="font-heading text-xl sm:text-2xl font-black text-[#4338ca] mt-1">SadaPay &amp; NayaPay</div>
            </div>
            <div className="p-4 rounded-2xl bg-white border border-[#e2e8f0] shadow-xs hover:border-slate-300 transition-all">
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Tamper-Evident Passes</div>
              <div className="font-heading text-xl sm:text-2xl font-black text-emerald-600 mt-1">Fraud-Proof QR</div>
            </div>
            <div className="p-4 rounded-2xl bg-white border border-[#e2e8f0] shadow-xs hover:border-slate-300 transition-all">
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Admin Verification</div>
              <div className="font-heading text-xl sm:text-2xl font-black text-amber-600 mt-1">100% Verified</div>
            </div>
          </div>
        </div>
      </section>

      {/* How Financial Flow & Commission Works */}
      <section className="py-14 sm:py-16 bg-white border-b border-[#e2e8f0]">
        <div className="content-max px-4">
          <div className="text-center max-w-3xl mx-auto mb-10">
            <span className="text-xs font-bold uppercase tracking-wider text-[#1d4ed8] bg-blue-50 px-3 py-1 rounded-full border border-blue-200">
              Clear &amp; Transparent Process
            </span>
            <h2 className="font-heading text-2xl sm:text-3xl md:text-4xl font-bold text-slate-900 mt-3">
              How Listing, Payment &amp; Approval Work
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-2">
              Payment is necessary for listing. All events are reviewed by Eventrye Administration to ensure high quality and prevent fraudulent listings.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
            <div className="p-5 rounded-2xl bg-[#f8fafc] border border-slate-200 flex flex-col hover:border-blue-300 hover:shadow-xs transition-all">
              <div className="w-8 h-8 rounded-xl bg-[#1d4ed8] text-white flex items-center justify-center font-bold text-sm mb-3 shadow-xs">
                1
              </div>
              <h3 className="font-heading font-bold text-sm sm:text-base text-slate-900 mb-1.5">Enter Event &amp; Ticket Price</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Provide comprehensive event details, dates, venue, ticket tiers, and your payout SadaPay/NayaPay account.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-[#f8fafc] border border-slate-200 flex flex-col hover:border-blue-300 hover:shadow-xs transition-all">
              <div className="w-8 h-8 rounded-xl bg-[#4338ca] text-white flex items-center justify-center font-bold text-sm mb-3 shadow-xs">
                2
              </div>
              <h3 className="font-heading font-bold text-sm sm:text-base text-slate-900 mb-1.5">Pay Listing Fee</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Transfer the listing fee via SadaPay or NayaPay to ORBIT-I and enter your Transaction ID (TID) reference.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-[#f8fafc] border border-slate-200 flex flex-col hover:border-blue-300 hover:shadow-xs transition-all">
              <div className="w-8 h-8 rounded-xl bg-amber-600 text-white flex items-center justify-center font-bold text-sm mb-3 shadow-xs">
                3
              </div>
              <h3 className="font-heading font-bold text-sm sm:text-base text-slate-900 mb-1.5">Admin Review &amp; Approval</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Our Admin verifies your payment and event details. Without Admin Approval, no event can appear in the directory.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-[#f8fafc] border border-slate-200 flex flex-col hover:border-blue-300 hover:shadow-xs transition-all">
              <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold text-sm mb-3 shadow-xs">
                4
              </div>
              <h3 className="font-heading font-bold text-sm sm:text-base text-slate-900 mb-1.5">Go Live &amp; Direct Payout</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Once approved, attendees buy tickets via SadaPay/NayaPay. Revenue is disbursed directly to your registered wallet.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Plan Selection Cards */}
      <section className="py-14 sm:py-18 content-max px-4">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <span className="text-xs font-bold uppercase tracking-wider text-[#1d4ed8] bg-blue-50 px-3 py-1 rounded-full border border-blue-200">
            Select Your Listing Tier
          </span>
          <h2 className="font-heading text-2xl sm:text-4xl md:text-5xl font-bold tracking-tight text-[#0f172a] mt-3">
            Choose Visibility &amp; Commission Level
          </h2>
          <p className="font-body text-xs sm:text-sm md:text-base text-[#475569] mt-2">
            Select the package that matches your event size, audience reach, and VIP promotion goals.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 max-w-6xl mx-auto mb-12">
          {plans.map((p) => {
            const isSelected = selectedPlanId === p.id;
            const isVipTier = p.id === 'vip';

            return (
              <div
                key={p.id}
                onClick={() => setSelectedPlanId(p.id)}
                className={`relative rounded-3xl p-6 sm:p-8 flex flex-col justify-between cursor-pointer transition-all duration-300 ${
                  isSelected
                    ? isVipTier
                      ? 'bg-gradient-to-b from-white via-amber-50/40 to-amber-100/30 border-2 border-amber-500 shadow-xl shadow-amber-500/15 ring-2 ring-amber-400/20'
                      : 'bg-white border-2 border-[#1d4ed8] shadow-xl shadow-blue-600/15 ring-2 ring-blue-600/20'
                    : 'bg-white border border-[#e2e8f0] hover:border-slate-300 shadow-sm'
                }`}
              >
                {p.popular && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-[#1d4ed8] text-white text-[11px] font-bold uppercase tracking-wider shadow-sm">
                    {p.badge}
                  </span>
                )}
                {isVipTier && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-gradient-to-r from-amber-500 to-amber-600 text-white text-[11px] font-bold uppercase tracking-wider shadow-sm flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-amber-200" />
                    {p.badge}
                  </span>
                )}

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-heading text-lg sm:text-xl font-bold text-slate-900">{p.name}</h3>
                    <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${isSelected ? (isVipTier ? 'border-amber-600 bg-amber-600 text-white' : 'border-[#1d4ed8] bg-[#1d4ed8] text-white') : 'border-slate-300'}`}>
                      {isSelected && <Check className="w-3 h-3" />}
                    </div>
                  </div>
                  <p className="text-xs text-slate-500 min-h-[36px] mb-5">{p.tagline}</p>

                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 mb-6">
                    <div className="text-[11px] text-slate-500 uppercase tracking-wider font-semibold">One-Time Listing Fee</div>
                    <div className="font-heading text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">
                      Rs. {p.listing_fee_pkr.toLocaleString()}
                      {p.listing_fee_usd > 0 && <span className="text-xs font-semibold text-slate-400 ml-1.5">/ ${p.listing_fee_usd}</span>}
                    </div>
                    <div className="mt-3 pt-3 border-t border-slate-200/60 flex items-center justify-between">
                      <span className="text-xs font-semibold text-slate-600">Ticket Commission:</span>
                      <span className="font-heading text-sm font-bold text-slate-900">
                        {p.commission_rate_percent}%
                        {p.commission_fixed_pkr > 0 && ` + Rs. ${p.commission_fixed_pkr}`}
                      </span>
                    </div>
                    <div className="mt-1 flex items-center justify-between">
                      <span className="text-[11px] text-slate-500">Payout Schedule:</span>
                      <span className="text-[11px] font-bold text-slate-700">{p.payout_schedule}</span>
                    </div>
                  </div>

                  <div className="space-y-2.5 mb-8">
                    <p className="text-[11px] font-bold text-slate-900 uppercase tracking-wider">What&apos;s Included:</p>
                    {p.features.map((feat, idx) => (
                      <div key={idx} className="flex items-start gap-2.5 text-xs text-slate-700">
                        <CheckCircle2 className={`w-3.5 h-3.5 flex-shrink-0 mt-0.5 ${isVipTier ? 'text-amber-500' : 'text-[#1d4ed8]'}`} />
                        <span>{feat}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedPlanId(p.id)}
                  className={`w-full py-2.5 sm:py-3 rounded-xl font-heading font-bold text-xs sm:text-sm transition-all ${
                    isSelected
                      ? isVipTier
                        ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-lg shadow-amber-500/25'
                        : 'bg-[#1d4ed8] text-white shadow-lg shadow-blue-600/25'
                      : 'bg-slate-100 text-slate-800 hover:bg-slate-200'
                  }`}
                >
                  {isSelected ? '✓ Selected Tier' : 'Select Tier'}
                </button>
              </div>
            );
          })}
        </div>

        {/* Official Receiving Accounts Card (SadaPay & NayaPay ONLY) */}
        <div className="max-w-4xl mx-auto mb-14 p-6 sm:p-8 rounded-3xl bg-slate-900 text-white shadow-xl border border-slate-700">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-800">
            <div>
              <span className="px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 text-xs font-bold uppercase tracking-wider border border-blue-500/30">
                Official Eventrye Receiving Accounts (SadaPay &amp; NayaPay)
              </span>
              <h3 className="font-heading text-lg sm:text-2xl font-bold mt-2 text-white">
                Pay Listing Fee: Rs. {selectedPlan.listing_fee_pkr.toLocaleString()} ({selectedPlan.name})
              </h3>
            </div>
            <div className="text-xs text-slate-300 bg-white/10 px-3.5 py-1.5 rounded-xl border border-white/10">
              ORBIT-I Private Limited
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            {/* SadaPay Receiving Account */}
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#00A389]" />
                  <span className="font-bold text-teal-300">SadaPay Business &amp; Personal</span>
                </div>
                <div className="text-slate-300 mt-2">Title: <span className="text-white font-medium">{accounts?.sadapay?.title || 'ORBIT-I Private Limited'}</span></div>
                <div className="text-slate-300">Account / Mobile #: <span className="text-white font-mono">{accounts?.sadapay?.account_number || '03190375751'}</span></div>
                <div className="text-slate-300">IBAN: <span className="text-white font-mono break-all">{accounts?.sadapay?.iban || 'PK03SADA0000003190375751'}</span></div>
              </div>
              <button
                type="button"
                onClick={() => handleCopy(accounts?.sadapay?.account_number || '03190375751', 'sadapay')}
                className="mt-4 self-start inline-flex items-center gap-1.5 text-xs font-bold text-teal-300 hover:text-white bg-white/10 px-3 py-1 rounded-lg border border-white/10 transition-colors"
              >
                {copiedField === 'sadapay' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                {copiedField === 'sadapay' ? 'SadaPay Copied!' : 'Copy SadaPay Number'}
              </button>
            </div>

            {/* NayaPay Receiving Account */}
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#FF5C00]" />
                  <span className="font-bold text-orange-400">NayaPay Wallet &amp; Visa</span>
                </div>
                <div className="text-slate-300 mt-2">Title: <span className="text-white font-medium">{accounts?.nayapay?.title || 'ORBIT-I Private Limited'}</span></div>
                <div className="text-slate-300">NayaPay ID: <span className="text-white font-mono">{accounts?.nayapay?.nayapay_id || 'orbit-i@nayapay'}</span></div>
                <div className="text-slate-300">Mobile #: <span className="text-white font-mono">{accounts?.nayapay?.account_number || '03190375751'}</span></div>
                <div className="text-slate-300">WhatsApp Proof: <span className="text-emerald-400 font-mono">+92 319 0375751</span></div>
              </div>
              <button
                type="button"
                onClick={() => handleCopy(accounts?.nayapay?.nayapay_id || 'orbit-i@nayapay', 'nayapay')}
                className="mt-4 self-start inline-flex items-center gap-1.5 text-xs font-bold text-orange-400 hover:text-white bg-white/10 px-3 py-1 rounded-lg border border-white/10 transition-colors"
              >
                {copiedField === 'nayapay' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                {copiedField === 'nayapay' ? 'NayaPay ID Copied!' : 'Copy NayaPay ID'}
              </button>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-blue-500/10 border border-blue-500/20 mt-4 text-[11px] text-blue-200 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-blue-400 shrink-0" />
            <span>
              <strong>Admin Approval Notice:</strong> After transferring the listing fee, enter your Transaction ID (TID) below. Your event will be reviewed and approved by Eventrye Administration before appearing publicly.
            </span>
          </div>
        </div>

        {/* Event Submission Form */}
        <div className="max-w-4xl mx-auto bg-white rounded-3xl p-6 sm:p-10 border border-[#e2e8f0] shadow-xl">
          <div className="mb-8 pb-6 border-b border-slate-100 flex flex-wrap items-center justify-between gap-4">
            <div>
              <h3 className="font-heading text-xl sm:text-2xl font-bold text-slate-900">Event Submission &amp; Listing Form</h3>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                Selected Plan: <span className="font-bold text-purple-700">{selectedPlan.name}</span> (Fee: Rs. {selectedPlan.listing_fee_pkr.toLocaleString()} • Commission: {selectedPlan.commission_rate_percent}%)
              </p>
            </div>
            <div className="px-3 py-1 rounded-full bg-purple-50 text-purple-700 text-xs font-bold border border-purple-200">
              Verified by ORBIT-I
            </div>
          </div>

          {errorMsg && (
            <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* 1. Organizer Information */}
            <div>
              <h4 className="font-heading text-sm font-bold uppercase tracking-wider text-purple-700 mb-4 flex items-center gap-2">
                <Building2 className="w-4 h-4" /> 1. Organizer &amp; Organization Profile
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Organizer Full Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.organizer_name}
                    onChange={(e) => setFormData({ ...formData, organizer_name: e.target.value })}
                    placeholder="e.g. Dr. Asad Khan / Sarah Ali"
                    className="w-full px-4 py-2.5 text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-purple-600 focus:ring-2 focus:ring-purple-100"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Company / Society / Brand Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.organizer_org}
                    onChange={(e) => setFormData({ ...formData, organizer_org: e.target.value })}
                    placeholder="e.g. CodePakistan / Indus Tech Club"
                    className="w-full px-4 py-2.5 text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-purple-600 focus:ring-2 focus:ring-purple-100"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Official Contact Email *</label>
                  <input
                    type="email"
                    required
                    value={formData.organizer_email}
                    onChange={(e) => setFormData({ ...formData, organizer_email: e.target.value })}
                    placeholder="organizer@yourorg.com"
                    className="w-full px-4 py-2.5 text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-purple-600 focus:ring-2 focus:ring-purple-100"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">WhatsApp / Phone Number *</label>
                  <input
                    type="tel"
                    required
                    value={formData.organizer_phone}
                    onChange={(e) => setFormData({ ...formData, organizer_phone: e.target.value })}
                    placeholder="+92 300 1234567"
                    className="w-full px-4 py-2.5 text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-purple-600 focus:ring-2 focus:ring-purple-100"
                  />
                </div>
              </div>
            </div>

            {/* 2. Payout Account Details (SadaPay & NayaPay ONLY) */}
            <div className="p-5 rounded-2xl bg-[#f5f3ff] border border-purple-100">
              <h4 className="font-heading text-sm font-bold uppercase tracking-wider text-purple-900 mb-2 flex items-center gap-2">
                <Wallet className="w-4 h-4 text-purple-700" /> 2. Your SadaPay or NayaPay Account for Ticket Payouts
              </h4>
              <p className="text-xs text-slate-600 mb-4">
                When attendees purchase tickets on Eventrye, we deduct the platform commission ({selectedPlan.commission_rate_percent}%) and disburse your ticket proceeds directly into your SadaPay or NayaPay wallet.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Payout Channel *</label>
                  <select
                    value={formData.payout_channel}
                    onChange={(e) => setFormData({ ...formData, payout_channel: e.target.value })}
                    className="w-full px-4 py-2 text-xs rounded-xl border border-slate-200 bg-white focus:outline-none focus:border-purple-600 font-semibold"
                  >
                    <option value="sadapay">SadaPay Account / IBAN</option>
                    <option value="nayapay">NayaPay ID / Mobile</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Account Title *</label>
                  <input
                    type="text"
                    required
                    value={formData.payout_account_title}
                    onChange={(e) => setFormData({ ...formData, payout_account_title: e.target.value })}
                    placeholder="e.g. Asad Khan / Tech Horizons"
                    className="w-full px-4 py-2 text-xs rounded-xl border border-slate-200 bg-white focus:outline-none focus:border-purple-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">SadaPay Number/IBAN or NayaPay ID *</label>
                  <input
                    type="text"
                    required
                    value={formData.payout_account_number}
                    onChange={(e) => setFormData({ ...formData, payout_account_number: e.target.value })}
                    placeholder="03190375751 or name@nayapay"
                    className="w-full px-4 py-2 text-xs rounded-xl border border-slate-200 bg-white focus:outline-none focus:border-purple-600 font-mono"
                  />
                </div>
              </div>
            </div>

            {/* 3. Event Details */}
            <div>
              <h4 className="font-heading text-sm font-bold uppercase tracking-wider text-purple-700 mb-4 flex items-center gap-2">
                <Calendar className="w-4 h-4" /> 3. Event Information &amp; Schedule
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Event Title *</label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="e.g. Pakistan AI &amp; Cloud Developers Summit 2026"
                    className="w-full px-4 py-2.5 text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-purple-600 focus:ring-2 focus:ring-purple-100"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Category *</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-4 py-2.5 text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-purple-600 bg-white"
                  >
                    <option value="Technology & AI">Technology &amp; AI</option>
                    <option value="Medical & Healthcare">Medical &amp; Healthcare</option>
                    <option value="FinTech & Banking">FinTech &amp; Banking</option>
                    <option value="CyberSecurity">CyberSecurity</option>
                    <option value="Education & Academic">Education &amp; Academic</option>
                    <option value="Startup & Business">Startup &amp; Business</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Event Format *</label>
                  <select
                    value={formData.event_type}
                    onChange={(e) => setFormData({ ...formData, event_type: e.target.value })}
                    className="w-full px-4 py-2.5 text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-purple-600 bg-white"
                  >
                    <option value="In-Person Summit">In-Person Summit / Conference</option>
                    <option value="Hybrid Conference">Hybrid (In-Person + Live Stream)</option>
                    <option value="Executive Masterclass">Executive Masterclass</option>
                    <option value="National Hackathon">National Hackathon</option>
                    <option value="Academic Symposium">Academic Symposium</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Start Date &amp; Time *</label>
                  <input
                    type="datetime-local"
                    required
                    value={formData.start_date}
                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                    className="w-full px-4 py-2.5 text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-purple-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">End Date &amp; Time *</label>
                  <input
                    type="datetime-local"
                    required
                    value={formData.end_date}
                    onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                    className="w-full px-4 py-2.5 text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-purple-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">City *</label>
                  <select
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className="w-full px-4 py-2.5 text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-purple-600 bg-white"
                  >
                    <option value="Islamabad">Islamabad</option>
                    <option value="Karachi">Karachi</option>
                    <option value="Lahore">Lahore</option>
                    <option value="Rawalpindi">Rawalpindi</option>
                    <option value="Peshawar">Peshawar</option>
                    <option value="Faisalabad">Faisalabad</option>
                    <option value="Nawabshah">Nawabshah</option>
                    <option value="Multan">Multan</option>
                    <option value="Quetta">Quetta</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Full Venue Address *</label>
                  <input
                    type="text"
                    required
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    placeholder="e.g. Serena Hotel, Khayaban-e-Suhrawardy, Islamabad"
                    className="w-full px-4 py-2.5 text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-purple-600"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Banner Image URL</label>
                  <input
                    type="url"
                    value={formData.banner_url}
                    onChange={(e) => setFormData({ ...formData, banner_url: e.target.value })}
                    placeholder="https://..."
                    className="w-full px-4 py-2.5 text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-purple-600"
                  />
                  <div className="flex flex-wrap gap-2 mt-2">
                    <span className="text-[11px] text-slate-500 self-center">Preset Cover Themes:</span>
                    {presetBanners.map((p, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setFormData({ ...formData, banner_url: p.url })}
                        className="text-[11px] px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-purple-100 text-slate-700 hover:text-purple-700 transition-colors"
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Event Detailed Description &amp; Agenda *</label>
                  <textarea
                    rows={4}
                    required
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Describe what attendees will learn, keynote speakers, networking sessions, and certificate eligibility..."
                    className="w-full px-4 py-2.5 text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-purple-600"
                  />
                </div>
              </div>
            </div>

            {/* 4. Ticket Pricing & Capacity */}
            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200">
              <h4 className="font-heading text-sm font-bold uppercase tracking-wider text-slate-800 mb-2 flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-slate-600" /> 4. Ticket Pricing &amp; Capacity
              </h4>
              <p className="text-xs text-slate-500 mb-4">
                Define the ticket pass name and proper price in PKR that delegates will pay via SadaPay/NayaPay.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Ticket Pass Title *</label>
                  <input
                    type="text"
                    required
                    value={formData.ticket_name}
                    onChange={(e) => setFormData({ ...formData, ticket_name: e.target.value })}
                    placeholder="e.g. Standard Delegate Pass"
                    className="w-full px-4 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-purple-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Ticket Price (PKR) *</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={formData.ticket_price_pkr}
                    onChange={(e) => setFormData({ ...formData, ticket_price_pkr: Number(e.target.value) })}
                    placeholder="e.g. 2500"
                    className="w-full px-4 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-purple-600 font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Seat Capacity *</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={formData.ticket_capacity}
                    onChange={(e) => setFormData({ ...formData, ticket_capacity: Number(e.target.value) })}
                    placeholder="e.g. 250"
                    className="w-full px-4 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-purple-600"
                  />
                </div>
              </div>
            </div>

            {/* 5. Listing Fee Payment Reference (SadaPay & NayaPay ONLY) */}
            <div className="p-5 rounded-2xl bg-amber-50/70 border border-amber-200">
              <h4 className="font-heading text-sm font-bold uppercase tracking-wider text-amber-900 mb-2 flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-amber-700" /> 5. Listing Fee Payment Proof (Rs. {selectedPlan.listing_fee_pkr.toLocaleString()})
              </h4>
              <p className="text-xs text-amber-800 mb-4">
                Please transfer Rs. {selectedPlan.listing_fee_pkr.toLocaleString()} to ORBIT-I via <strong>SadaPay (03190375751)</strong> or <strong>NayaPay (orbit-i@nayapay)</strong> and enter your Transaction / Reference ID below. Admin will verify your payment before approving your event.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-amber-900 mb-1">Payment Channel Used *</label>
                  <select
                    value={formData.payment_method}
                    onChange={(e) => setFormData({ ...formData, payment_method: e.target.value })}
                    className="w-full px-4 py-2 text-sm rounded-xl border border-amber-300 focus:outline-none focus:border-amber-600 bg-white font-semibold"
                  >
                    <option value="sadapay">SadaPay (03190375751 / PK03SADA0000003190375751)</option>
                    <option value="nayapay">NayaPay (orbit-i@nayapay / 03190375751)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-amber-900 mb-1">Transaction ID / Reference (TID) *</label>
                  <input
                    type="text"
                    required
                    value={formData.payment_reference}
                    onChange={(e) => setFormData({ ...formData, payment_reference: e.target.value })}
                    placeholder="e.g. SADA-992211 or NAYA-887766"
                    className="w-full px-4 py-2 text-sm rounded-xl border border-amber-300 focus:outline-none focus:border-amber-600 bg-white font-mono uppercase font-bold"
                  />
                </div>
              </div>
            </div>

            {/* Submission Action */}
            <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-slate-100">
              <div className="text-xs text-slate-500">
                Payment verified by Admin prior to public listing. Platform commission: {selectedPlan.commission_rate_percent}%.
              </div>
              <button
                type="submit"
                disabled={submitting}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl font-heading font-bold text-xs sm:text-sm text-white bg-[#7c3aed] hover:bg-[#6d28d9] shadow-md shadow-[#7c3aed]/20 transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                {submitting ? (
                  <>Submitting...</>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" /> Submit Event
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </section>

      {/* Confirmation Modal */}
      {submittedResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl border border-purple-100 text-center">
            <div className="w-16 h-16 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <span className="px-3 py-1 rounded-full bg-purple-100 text-purple-700 text-xs font-bold uppercase tracking-wider">
              {submittedResult.plan.name}
            </span>

            <h3 className="font-heading text-xl sm:text-2xl font-bold text-slate-900 mt-3 mb-2">
              Event Submitted for Admin Approval!
            </h3>

            <p className="text-xs sm:text-sm text-slate-600 mb-6 leading-relaxed">
              Thank you, <span className="font-semibold text-slate-800">{submittedResult.organizer}</span>. Your event <span className="font-semibold text-slate-800">&quot;{submittedResult.title}&quot;</span> has been queued. Once Admin verifies your SadaPay/NayaPay payment, your event will be approved and published live on the directory.
            </p>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 mb-6 text-left space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500">Tracking Reference:</span>
                <span className="font-mono font-bold text-purple-700">{submittedResult.reference_code}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500">Commission Rate:</span>
                <span className="font-bold text-slate-800">{submittedResult.plan.commission_rate_percent}%</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500">Payout Channel:</span>
                <span className="font-bold text-slate-800">SadaPay &amp; NayaPay Direct</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500">Approval Status:</span>
                <span className="font-semibold text-amber-700">Awaiting Admin Verification</span>
              </div>
            </div>

            <div className="flex flex-col gap-2.5">
              <Link
                to="/events-directory"
                className="w-full py-2.5 rounded-xl font-heading font-bold text-xs sm:text-sm bg-[#7c3aed] text-white hover:bg-[#6d28d9] shadow-md transition-all text-center"
              >
                View Events Directory
              </Link>
              <a
                href={`https://wa.me/923190375751?text=Hi%20Eventrye,%20I%20have%20submitted%20my%20event%20listing%20with%20reference%20${submittedResult.reference_code}`}
                target="_blank"
                rel="noreferrer"
                className="w-full py-2.5 rounded-xl font-heading font-bold text-xs bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-all flex items-center justify-center gap-1.5"
              >
                <Phone className="w-3.5 h-3.5" /> WhatsApp Support (+92 319 0375751)
              </a>
              <button
                type="button"
                onClick={() => setSubmittedResult(null)}
                className="text-xs text-slate-500 hover:text-slate-800 pt-1"
              >
                Close Window
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
