import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Sparkles,
  Crown,
  CheckCircle2,
  Calendar,
  Building2,
  Phone,
  DollarSign,
  CreditCard,
  Send,
  AlertCircle,
  Copy,
  Check,
  Wallet
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
    listing_fee_pkr: 0,
    listing_fee_usd: 0,
    commission_rate_percent: 5.0,
    commission_fixed_pkr: 15,
    tagline: 'Ideal for university societies, free meetups, and local workshops',
    payout_schedule: '48-72 hours post-event',
    features: [
      'Public listing on EventoraX Directory & Marketplace',
      'Automated dynamic QR code passes & mobile check-in scanning',
      'Instant attendee payments via SBP Raast, JazzCash, Easypaisa & Cards',
      'Standard attendee analytics & downloadable CSV exports',
      'Automated email confirmation & receipt dispatch',
      'Standard email organizer support desk'
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
      'Featured placement on Homepage Spotlight & Directory header',
      'Dedicated social media shoutout across ORBIT-I networks',
      'Targeted email blast to 10,000+ verified active attendees',
      'Custom branded Canva certificate design template',
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
    tagline: 'For major annual summits, national hackathons, concerts, and multi-track expos',
    payout_schedule: 'Instant Same-Day Settlement',
    features: [
      'Everything in Featured Spotlight',
      'Permanent sticky hero banner placement across all directory pages',
      'VIP Gold Verified Organizer Shield on event page & tickets',
      'Dedicated on-ground hardware QR gate app & hardware scanner assistance',
      'Tamper-evident SHA-256 digital passport passes & ID cards',
      'Custom branded portal URL (e.g. yourevent.eventorax.orbit-i.tech)',
      'Lowest 2.5% platform commission on all ticket sales',
      '24/7 VIP dedicated account director & on-call technician'
    ]
  }
];

const fallbackAccounts = {
  bank_name: 'Meezan Bank Limited',
  account_title: 'ORBIT-I Private Limited',
  account_number: '01020304050607',
  iban: 'PK36MEZN0001020304050607',
  raast_id: 'orbit-i@raast',
  raast_phone: '03190375751',
  jazzcash_till: '03190375751',
  easypaisa_account: '03190375751',
  currency: 'PKR',
  support_whatsapp: '+923190375751',
  support_email: 'eventorax@orbit-i.tech'
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
    payout_bank_name: 'Meezan Bank',
    payout_account_title: '',
    payout_account_number: '',
    payout_raast_id: '',
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
    payment_method: 'raast',
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
      setErrorMsg('Please enter your name, email, and event title.');
      return;
    }

    if (selectedPlan.listing_fee_pkr > 0 && !formData.payment_reference.trim()) {
      setErrorMsg(`Please enter your transaction reference ID or proof for the ${selectedPlan.name} fee payment.`);
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
    <main className="min-h-screen bg-[#f8fafc] pt-14 pb-24">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-[#f8fafc] via-[#eff6ff]/40 to-white py-16 md:py-20 border-b border-[#e2e8f0]">
        <div className="content-max text-center relative z-10 px-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 text-[#1d4ed8] text-xs font-bold uppercase tracking-wider mb-5 border border-blue-200/80 shadow-xs">
            <Sparkles className="w-4 h-4 text-amber-500" />
            <span>EventoraX Public Marketplace &bull; VIP Showcase Available</span>
          </div>

          <h1 className="font-heading text-3xl sm:text-5xl md:text-6xl font-extrabold tracking-tight mb-5 text-[#0f172a] max-w-4xl mx-auto leading-tight">
            Publish Your Event &amp;{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#1d4ed8] via-[#4338ca] to-[#7c3aed]">
              Maximize Attendee Turnout
            </span>
          </h1>

          <p className="font-body text-sm sm:text-base md:text-lg max-w-3xl mx-auto text-[#475569] leading-relaxed mb-8">
            Host national tech summits, medical conferences, hackathons, and corporate seminars. Enjoy bank-grade dynamic QR ticketing, instant Pakistani payment gateways (Raast, JazzCash, Easypaisa &amp; Cards), and direct automated bank payouts with low platform commissions.
          </p>

          {/* Quick Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 max-w-4xl mx-auto mt-6">
            <div className="p-4 rounded-2xl bg-white border border-[#e2e8f0] shadow-xs hover:border-slate-300 transition-all">
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Platform Commission</div>
              <div className="font-heading text-xl sm:text-2xl font-black text-[#1d4ed8] mt-1">From 2.5%</div>
            </div>
            <div className="p-4 rounded-2xl bg-white border border-[#e2e8f0] shadow-xs hover:border-slate-300 transition-all">
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Payment Rails</div>
              <div className="font-heading text-xl sm:text-2xl font-black text-[#4338ca] mt-1">Raast &amp; Cards</div>
            </div>
            <div className="p-4 rounded-2xl bg-white border border-[#e2e8f0] shadow-xs hover:border-slate-300 transition-all">
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Tamper-Evident Passes</div>
              <div className="font-heading text-xl sm:text-2xl font-black text-emerald-600 mt-1">Fraud-Proof QR</div>
            </div>
            <div className="p-4 rounded-2xl bg-white border border-[#e2e8f0] shadow-xs hover:border-slate-300 transition-all">
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Direct Settlement</div>
              <div className="font-heading text-xl sm:text-2xl font-black text-amber-600 mt-1">Same-Day / 24h</div>
            </div>
          </div>
        </div>
      </section>

      {/* How Financial Flow & Commission Works */}
      <section className="py-14 sm:py-16 bg-white border-b border-[#e2e8f0]">
        <div className="content-max px-4">
          <div className="text-center max-w-3xl mx-auto mb-10">
            <span className="text-xs font-bold uppercase tracking-wider text-[#1d4ed8] bg-blue-50 px-3 py-1 rounded-full border border-blue-200">
              Clear &amp; Transparent Economics
            </span>
            <h2 className="font-heading text-2xl sm:text-3xl md:text-4xl font-bold text-slate-900 mt-3">
              How Listing &amp; Ticket Payouts Work
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-2">
              We manage the payment gateways, fraud prevention, and credential dispatch so your team can focus on running a great event.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
            <div className="p-5 rounded-2xl bg-[#f8fafc] border border-slate-200 flex flex-col hover:border-blue-300 hover:shadow-xs transition-all">
              <div className="w-8 h-8 rounded-xl bg-[#1d4ed8] text-white flex items-center justify-center font-bold text-sm mb-3 shadow-xs">
                1
              </div>
              <h3 className="font-heading font-bold text-sm sm:text-base text-slate-900 mb-1.5">Choose Listing Plan</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Select Standard (Free), Featured (Rs 4,999), or VIP Showcase (Rs 14,999). Fill in your event specifications and your bank/Raast details.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-[#f8fafc] border border-slate-200 flex flex-col hover:border-blue-300 hover:shadow-xs transition-all">
              <div className="w-8 h-8 rounded-xl bg-[#4338ca] text-white flex items-center justify-center font-bold text-sm mb-3 shadow-xs">
                2
              </div>
              <h3 className="font-heading font-bold text-sm sm:text-base text-slate-900 mb-1.5">Listing Fee (If Applicable)</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                For Featured or VIP plans, pay the one-time listing fee to ORBIT-I via Raast, Meezan Bank, or Wallets and enter your reference ID.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-[#f8fafc] border border-slate-200 flex flex-col hover:border-blue-300 hover:shadow-xs transition-all">
              <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold text-sm mb-3 shadow-xs">
                3
              </div>
              <h3 className="font-heading font-bold text-sm sm:text-base text-slate-900 mb-1.5">Go Live &amp; Sell Tickets</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Your event goes live in the EventoraX Directory. Attendees buy passes instantly with verified local Pakistani payment rails.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-[#f8fafc] border border-slate-200 flex flex-col hover:border-blue-300 hover:shadow-xs transition-all">
              <div className="w-8 h-8 rounded-xl bg-amber-600 text-white flex items-center justify-center font-bold text-sm mb-3 shadow-xs">
                4
              </div>
              <h3 className="font-heading font-bold text-sm sm:text-base text-slate-900 mb-1.5">Automated Bank Payout</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                We deduct the low platform commission (from 2.5%) and deposit your net ticket proceeds directly into your registered bank account.
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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8 items-stretch max-w-6xl mx-auto mb-14">
          {plans.map((p) => {
            const isSelected = selectedPlanId === p.id;
            const isVipTier = p.is_vip || p.id === 'vip';

            return (
              <div
                key={p.id}
                onClick={() => setSelectedPlanId(p.id)}
                className={`cursor-pointer rounded-3xl p-6 sm:p-8 transition-all duration-300 flex flex-col justify-between relative ${
                  isSelected
                    ? isVipTier
                      ? 'bg-white border-2 border-amber-500 shadow-xl ring-4 ring-amber-500/10 -translate-y-1'
                      : 'bg-white border-2 border-[#1d4ed8] shadow-xl ring-4 ring-blue-500/10 -translate-y-1'
                    : isVipTier
                    ? 'bg-gradient-to-b from-amber-50/30 to-white border border-amber-200/80 shadow-xs hover:border-amber-400 hover:shadow-md'
                    : 'bg-white border border-[#e2e8f0] shadow-xs hover:border-slate-300 hover:shadow-md'
                }`}
              >
                {p.popular && !isVipTier && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3.5 py-1 rounded-full bg-[#1d4ed8] text-white text-[11px] font-bold uppercase tracking-wider shadow-sm">
                    {p.badge}
                  </div>
                )}
                {isVipTier && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-gradient-to-r from-amber-500 to-amber-600 text-white text-xs font-black uppercase tracking-wider shadow-md flex items-center gap-1.5">
                    <Crown className="w-3.5 h-3.5" />
                    <span>VIP Spotlight Showcase</span>
                  </div>
                )}

                <div>
                  <div className="flex items-center justify-between mb-3 mt-1">
                    <h3 className="font-heading text-lg sm:text-xl font-bold text-slate-900">{p.name}</h3>
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                      isSelected
                        ? isVipTier ? 'border-amber-500 bg-amber-500' : 'border-[#1d4ed8] bg-[#1d4ed8]'
                        : 'border-slate-300'
                    }`}>
                      {isSelected && <div className="w-2 h-2 rounded-full bg-white" />}
                    </div>
                  </div>

                  <p className="text-xs text-slate-500 leading-relaxed mb-5">{p.tagline}</p>

                  <div className={`p-4 rounded-2xl mb-6 border ${isVipTier ? 'bg-amber-50/50 border-amber-200/70' : 'bg-slate-50 border-slate-100'}`}>
                    <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Upfront Listing Fee</div>
                    <div className="font-heading text-2xl sm:text-3xl font-black text-slate-900 mt-1">
                      {p.listing_fee_pkr === 0 ? 'Rs. 0 Free' : `Rs. ${p.listing_fee_pkr.toLocaleString()}`}
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

        {/* Official Receiving Accounts Card */}
        {selectedPlan.listing_fee_pkr > 0 && (
          <div className="max-w-4xl mx-auto mb-14 p-6 sm:p-8 rounded-3xl bg-slate-900 text-white shadow-xl border border-slate-700">
            <div className="flex flex-wrap items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-800">
              <div>
                <span className="px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 text-xs font-bold uppercase tracking-wider border border-blue-500/30">
                  Official EventoraX Receiving Accounts
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
              {/* Bank Account */}
              <div className="p-4 rounded-2xl bg-white/5 border border-white/10 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <img
                      src="/images/payments/meezan.png"
                      alt="Meezan Bank"
                      className="h-5 w-auto object-contain"
                      style={{ maxHeight: '20px', maxWidth: '60px' }}
                    />
                    <span className="font-bold text-blue-300">Meezan Bank Direct Deposit</span>
                  </div>
                  <div className="text-slate-300 mt-2">Title: <span className="text-white font-medium">{accounts.account_title}</span></div>
                  <div className="text-slate-300">Account #: <span className="text-white font-mono">{accounts.account_number}</span></div>
                  <div className="text-slate-300">IBAN: <span className="text-white font-mono break-all">{accounts.iban}</span></div>
                </div>
                <button
                  type="button"
                  onClick={() => handleCopy(accounts.iban, 'iban')}
                  className="mt-4 self-start inline-flex items-center gap-1.5 text-xs font-bold text-blue-300 hover:text-white bg-white/10 px-3 py-1 rounded-lg border border-white/10 transition-colors"
                >
                  {copiedField === 'iban' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  {copiedField === 'iban' ? 'IBAN Copied!' : 'Copy IBAN'}
                </button>
              </div>

              {/* SBP Raast & Mobile Wallets */}
              <div className="p-4 rounded-2xl bg-white/5 border border-white/10 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="font-bold text-emerald-400">Instant Raast &amp; Mobile Wallets</span>
                  </div>
                  <div className="text-slate-300 mt-2">SBP Raast ID: <span className="text-white font-medium">{accounts.raast_id}</span></div>
                  <div className="text-slate-300">Raast Phone: <span className="text-white font-mono">{accounts.raast_phone}</span></div>
                  <div className="text-slate-300">JazzCash / Easypaisa: <span className="text-white font-mono">{accounts.jazzcash_till}</span></div>
                  <div className="text-slate-300">WhatsApp Proof: <span className="text-emerald-400 font-mono">{accounts.support_whatsapp}</span></div>
                </div>
                <button
                  type="button"
                  onClick={() => handleCopy(accounts.raast_phone, 'raast')}
                  className="mt-4 self-start inline-flex items-center gap-1.5 text-xs font-bold text-emerald-300 hover:text-white bg-white/10 px-3 py-1 rounded-lg border border-white/10 transition-colors"
                >
                  {copiedField === 'raast' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  {copiedField === 'raast' ? 'Raast Number Copied!' : 'Copy Raast Number'}
                </button>
              </div>
            </div>

            <p className="text-[11px] text-slate-400 mt-4 leading-relaxed">
              * Note: After transferring the fee, please enter your Transaction ID (TID) or banking reference into the form below for automatic verification.
            </p>
          </div>
        )}

        {/* Event Submission Form */}
        <div className="max-w-4xl mx-auto bg-white rounded-3xl p-8 sm:p-12 border border-[#e2e8f0] shadow-xl">
          <div className="mb-8 pb-6 border-b border-slate-100 flex flex-wrap items-center justify-between gap-4">
            <div>
              <h3 className="font-heading text-2xl font-bold text-slate-900">Event Submission & Listing Form</h3>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                Selected Plan: <span className="font-bold text-purple-700">{selectedPlan.name}</span> (Fee: {selectedPlan.listing_fee_pkr === 0 ? 'Rs 0 Free' : `Rs ${selectedPlan.listing_fee_pkr.toLocaleString()}`} • Commission: {selectedPlan.commission_rate_percent}%)
              </p>
            </div>
            <div className="px-3 py-1 rounded-full bg-purple-50 text-purple-700 text-xs font-bold">
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
                <Building2 className="w-4 h-4" /> 1. Organizer & Organization Profile
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

            {/* 2. Payout Account Details (Where we send ticket money minus commission) */}
            <div className="p-5 rounded-2xl bg-[#f5f3ff] border border-purple-100">
              <h4 className="font-heading text-sm font-bold uppercase tracking-wider text-purple-900 mb-2 flex items-center gap-2">
                <Wallet className="w-4 h-4 text-purple-700" /> 2. Your Bank / Raast Account for Ticket Payouts
              </h4>
              <p className="text-xs text-slate-600 mb-4">
                When attendees purchase tickets on EventoraX, we deduct our platform commission ({selectedPlan.commission_rate_percent}%) and disburse the remaining ticket revenue directly into this account.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Bank Name</label>
                  <input
                    type="text"
                    value={formData.payout_bank_name}
                    onChange={(e) => setFormData({ ...formData, payout_bank_name: e.target.value })}
                    placeholder="e.g. Meezan Bank, HBL, UBL"
                    className="w-full px-4 py-2 text-xs rounded-xl border border-slate-200 bg-white focus:outline-none focus:border-purple-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Account Title</label>
                  <input
                    type="text"
                    value={formData.payout_account_title}
                    onChange={(e) => setFormData({ ...formData, payout_account_title: e.target.value })}
                    placeholder="e.g. Tech Horizons Pvt Ltd"
                    className="w-full px-4 py-2 text-xs rounded-xl border border-slate-200 bg-white focus:outline-none focus:border-purple-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">IBAN / Account # / Raast ID</label>
                  <input
                    type="text"
                    value={formData.payout_account_number}
                    onChange={(e) => setFormData({ ...formData, payout_account_number: e.target.value })}
                    placeholder="PK... or 03001234567"
                    className="w-full px-4 py-2 text-xs rounded-xl border border-slate-200 bg-white focus:outline-none focus:border-purple-600 font-mono"
                  />
                </div>
              </div>
            </div>

            {/* 3. Event Details */}
            <div>
              <h4 className="font-heading text-sm font-bold uppercase tracking-wider text-purple-700 mb-4 flex items-center gap-2">
                <Calendar className="w-4 h-4" /> 3. Event Information & Agenda
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Event Title *</label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="e.g. Pakistan AI & Cloud Developers Summit 2026"
                    className="w-full px-4 py-2.5 text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-purple-600 focus:ring-2 focus:ring-purple-100"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-4 py-2.5 text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-purple-600 bg-white"
                  >
                    <option>Technology & AI</option>
                    <option>Medical & Healthcare</option>
                    <option>FinTech & Banking</option>
                    <option>CyberSecurity</option>
                    <option>Business & Entrepreneurship</option>
                    <option>University & Student</option>
                    <option>Music, Arts & Festival</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Event Format</label>
                  <select
                    value={formData.event_type}
                    onChange={(e) => setFormData({ ...formData, event_type: e.target.value })}
                    className="w-full px-4 py-2.5 text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-purple-600 bg-white"
                  >
                    <option>In-Person Summit</option>
                    <option>Hands-on Workshop</option>
                    <option>Accredited Seminar</option>
                    <option>Hackathon & CTF</option>
                    <option>Concert & Live Show</option>
                    <option>Virtual / Online Webinar</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Start Date & Time</label>
                  <input
                    type="datetime-local"
                    value={formData.start_date}
                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                    className="w-full px-4 py-2.5 text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-purple-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">End Date & Time</label>
                  <input
                    type="datetime-local"
                    value={formData.end_date}
                    onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                    className="w-full px-4 py-2.5 text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-purple-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">City</label>
                  <select
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className="w-full px-4 py-2.5 text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-purple-600 bg-white"
                  >
                    <option>Islamabad</option>
                    <option>Lahore</option>
                    <option>Karachi</option>
                    <option>Rawalpindi</option>
                    <option>Peshawar</option>
                    <option>Quetta</option>
                    <option>Faisalabad</option>
                    <option>Online Virtual</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Venue Location Address</label>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    placeholder="e.g. Pak-China Friendship Centre / Marriott Hotel"
                    className="w-full px-4 py-2.5 text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-purple-600"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Event Description & Highlights</label>
                  <textarea
                    rows={3}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Tell attendees what this event is about, key speakers, topics, and why they should attend..."
                    className="w-full px-4 py-2.5 text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-purple-600"
                  />
                </div>
              </div>

              {/* Banner Presets */}
              <div className="mb-4">
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Choose Banner Poster Image or Paste URL</label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {presetBanners.map((p, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setFormData({ ...formData, banner_url: p.url })}
                      className={`px-3 py-1 text-xs rounded-lg border transition-all ${
                        formData.banner_url === p.url ? 'bg-purple-100 border-purple-500 text-purple-700 font-bold' : 'bg-slate-50 border-slate-200 text-slate-600'
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
                <input
                  type="url"
                  value={formData.banner_url}
                  onChange={(e) => setFormData({ ...formData, banner_url: e.target.value })}
                  placeholder="https://..."
                  className="w-full px-4 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:border-purple-600"
                />
              </div>
            </div>

            {/* 4. Ticket Pricing */}
            <div className="p-5 rounded-2xl bg-white border border-slate-200">
              <h4 className="font-heading text-sm font-bold uppercase tracking-wider text-purple-700 mb-3 flex items-center gap-2">
                <DollarSign className="w-4 h-4" /> 4. Ticket Tier Setup
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Ticket Pass Name</label>
                  <input
                    type="text"
                    value={formData.ticket_name}
                    onChange={(e) => setFormData({ ...formData, ticket_name: e.target.value })}
                    placeholder="e.g. Professional Delegate"
                    className="w-full px-4 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-purple-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Price per Ticket (PKR)</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.ticket_price_pkr}
                    onChange={(e) => setFormData({ ...formData, ticket_price_pkr: Number(e.target.value) })}
                    placeholder="e.g. 2500 (0 for free)"
                    className="w-full px-4 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-purple-600 font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Seat Capacity</label>
                  <input
                    type="number"
                    min="1"
                    value={formData.ticket_capacity}
                    onChange={(e) => setFormData({ ...formData, ticket_capacity: Number(e.target.value) })}
                    placeholder="e.g. 250"
                    className="w-full px-4 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-purple-600"
                  />
                </div>
              </div>
            </div>

            {/* 5. Listing Fee Payment Reference (For Featured and VIP) */}
            {selectedPlan.listing_fee_pkr > 0 && (
              <div className="p-5 rounded-2xl bg-amber-50/60 border border-amber-200">
                <h4 className="font-heading text-sm font-bold uppercase tracking-wider text-amber-900 mb-2 flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-amber-700" /> 5. Listing Fee Payment Proof (Rs. {selectedPlan.listing_fee_pkr.toLocaleString()})
                </h4>
                <p className="text-xs text-amber-800 mb-4">
                  Please transfer Rs. {selectedPlan.listing_fee_pkr.toLocaleString()} to ORBIT-I via Raast ({accounts.raast_phone}) or Meezan Bank ({accounts.account_number}) and enter your Transaction / Reference ID below.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-amber-900 mb-1">Payment Channel Used *</label>
                    <select
                      value={formData.payment_method}
                      onChange={(e) => setFormData({ ...formData, payment_method: e.target.value })}
                      className="w-full px-4 py-2 text-sm rounded-xl border border-amber-300 focus:outline-none focus:border-amber-600 bg-white"
                    >
                      <option value="raast">SBP Raast Instant Pay</option>
                      <option value="meezan_bank">Meezan Bank Direct Transfer</option>
                      <option value="jazzcash">JazzCash Till / Mobile Account</option>
                      <option value="easypaisa">Easypaisa Merchant Till</option>
                      <option value="card">Online Credit / Debit Card</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-amber-900 mb-1">Transaction ID / Reference Number *</label>
                    <input
                      type="text"
                      required
                      value={formData.payment_reference}
                      onChange={(e) => setFormData({ ...formData, payment_reference: e.target.value })}
                      placeholder="e.g. RAAST-88992211 or MB-776655"
                      className="w-full px-4 py-2 text-sm rounded-xl border border-amber-300 focus:outline-none focus:border-amber-600 bg-white font-mono uppercase"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Submission Action */}
            <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-xs text-slate-500">
                By submitting, you agree to EventoraX Listing Terms & Commission Policy ({selectedPlan.commission_rate_percent}% on ticket sales).
              </div>
              <button
                type="submit"
                disabled={submitting}
                className="w-full sm:w-auto px-10 py-4 rounded-xl font-heading font-bold text-base text-white bg-[#7c3aed] hover:bg-[#6d28d9] shadow-xl shadow-[#7c3aed]/30 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {submitting ? (
                  <>Processing Event Submission...</>
                ) : (
                  <>
                    <Send className="w-5 h-5" /> Submit Event Listing Now
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
          <div className="bg-white rounded-3xl p-8 max-w-lg w-full shadow-2xl border border-purple-100 text-center">
            <div className="w-16 h-16 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <span className="px-3 py-1 rounded-full bg-purple-100 text-purple-700 text-xs font-bold uppercase tracking-wider">
              {submittedResult.plan.name}
            </span>

            <h3 className="font-heading text-2xl font-bold text-slate-900 mt-3 mb-2">
              Event Listing Submitted Successfully!
            </h3>

            <p className="text-xs sm:text-sm text-slate-600 mb-6">
              Thank you, <span className="font-semibold">{submittedResult.organizer}</span>. Your event <span className="font-semibold text-slate-800">&quot;{submittedResult.title}&quot;</span> has been received and queued for priority review.
            </p>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 mb-6 text-left space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500">Reference Tracking Code:</span>
                <span className="font-mono font-bold text-purple-700">{submittedResult.reference_code}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500">Platform Commission:</span>
                <span className="font-bold text-slate-800">{submittedResult.plan.commission_rate_percent}%</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500">Payout Turnaround:</span>
                <span className="font-bold text-emerald-700">{submittedResult.plan.payout_schedule}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500">Approval Status:</span>
                <span className="font-semibold text-amber-700">Review in progress (Under 4h)</span>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <Link
                to="/events-directory"
                className="w-full py-3 rounded-xl font-heading font-bold text-sm bg-[#7c3aed] text-white hover:bg-[#6d28d9] shadow-md transition-all"
              >
                View Events Directory
              </Link>
              <a
                href={`https://wa.me/923190375751?text=Hi%20EventoraX,%20I%20have%20submitted%20my%20event%20listing%20with%20reference%20${submittedResult.reference_code}`}
                target="_blank"
                rel="noreferrer"
                className="w-full py-2.5 rounded-xl font-heading font-bold text-xs bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-all flex items-center justify-center gap-1.5"
              >
                <Phone className="w-3.5 h-3.5" /> Contact ORBIT-I Review Desk via WhatsApp
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
