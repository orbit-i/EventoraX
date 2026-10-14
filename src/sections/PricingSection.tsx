import { useState, useEffect, useRef } from 'react';
import { Check, Sparkles, CreditCard } from 'lucide-react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import SubscriptionCheckoutModal, { type PlanData } from '@/components/SubscriptionCheckoutModal';
import { api } from '@/services/api';

gsap.registerPlugin(ScrollTrigger);

const plansData: PlanData[] = [
  {
    name: 'Starter',
    priceUsdMonthly: 36,
    pricePkrMonthly: 10000,
    description: 'Perfect for small events, meetups, training & initial credential testing',
    badge: 'Trial Available',
    features: [
      '10 Events included (Trial: 2 events)',
      'Up to 500 total attendees (Trial: 40 attendees)',
      '520 ID Passes & Certificates (Trial: 50 certs)',
      'Instant QR Code Verification',
      'Digital QR Ticketing & ID Card Designer',
      'Analytics Dashboard & Attendance Reports',
      'Renewal / Repurchase upon quota exhaustion',
    ],
  },
  {
    name: 'Professional',
    priceUsdMonthly: 49,
    pricePkrMonthly: 13800,
    description: 'Best for frequent event organizers, bootcamps & training centers',
    badge: 'Most Popular',
    features: [
      'Up to 5,000 attendees & 25 events',
      'Bulk Certificate Automation (2,500 certs/mo)',
      'CSV / Excel Recipient Auto-Merge',
      'High-Res PNG, PDF & Batch ZIP Downloads',
      'Individual Email Dispatch & Delivery Tracking',
      'Custom Brand Colors & Branded Portal (/t/slug)',
      'Team Collaborators & Multi-Role Permissions',
      'Real-time Check-in Scanner',
    ],
  },
  {
    name: 'Enterprise',
    priceUsdMonthly: 299,
    pricePkrMonthly: 83000,
    description: 'For universities, government, agencies & global conferences',
    badge: 'Enterprise White-Label',
    features: [
      '50,000+ attendees & 500 events',
      'Unlimited Certificate & ID Badge Generation',
      'Full White-Labeling (Custom CNAME & Domain)',
      'Multi-Tenant Workspaces & Role Isolation',
      'Tamper-Proof Public Verification Portal',
      'Dedicated Account SLA & Priority Support',
      '24/7 Priority Phone & Email Assistance',
    ],
  },
];

export default function PricingSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const [currency, setCurrency] = useState<'USD' | 'PKR'>('USD');
  const [isAnnual, setIsAnnual] = useState(false);
  const [selectedPlanModal, setSelectedPlanModal] = useState<PlanData | null>(null);
  const [plans, setPlans] = useState<PlanData[]>(plansData);

  useEffect(() => {
    api.billing.getPlans().then((res) => {
      if (res && res.plans && Array.isArray(res.plans) && res.plans.length > 0) {
        const mapped: PlanData[] = res.plans.map((p: any) => {
          const fallback = plansData.find(f => f.name.toLowerCase() === (p.name || '').toLowerCase()) || plansData[0];
          let features: string[] = [];
          if (Array.isArray(p.features) && p.features.length > 0) {
            features = p.features;
          } else if (typeof p.features === 'string' && p.features.trim().startsWith('[')) {
            try { features = JSON.parse(p.features); } catch { features = fallback.features; }
          } else if (typeof p.features === 'string' && p.features.trim().length > 0) {
            features = p.features.split('\n').filter(Boolean);
          } else {
            features = fallback.features;
          }

          return {
            name: p.name || fallback.name,
            priceUsdMonthly: Number(p.price_usd_monthly || p.monthly_price || fallback.priceUsdMonthly),
            pricePkrMonthly: Number(p.price_pkr_monthly || fallback.pricePkrMonthly),
            description: p.description || fallback.description,
            badge: p.badge || p.tag || fallback.badge,
            features: features.length > 0 ? features : fallback.features
          };
        });
        setPlans(mapped);
      }
    }).catch(() => {});
  }, []);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const cards = el.querySelectorAll('.plan-card');
    cards.forEach((card) => {
      (card as HTMLElement).style.opacity = '1';
      (card as HTMLElement).style.transform = 'none';
    });
  }, [plans]);

  return (
    <section
      ref={sectionRef}
      className="section-padding bg-gradient-to-b from-blue-50/50 via-white to-slate-50 px-4"
    >
      <div className="max-w-7xl mx-auto text-center">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white border border-blue-200 text-xs font-bold text-[#1d4ed8] mb-4 shadow-xs">
          <Sparkles className="w-3.5 h-3.5" />
          Transparent &amp; Simple Pricing
        </div>
        <h2 className="font-heading text-3xl md:text-5xl font-extrabold text-[#0f172a] mb-4 tracking-[-0.02em]">
          Simple pricing, limitless scale
        </h2>
        <p className="font-body text-base md:text-lg mb-8 text-[#64748b] max-w-2xl mx-auto">
          Start free with community events. Upgrade as an organizer for custom branding, badge printing, and unlimited scale.
        </p>

        {/* Currency & Billing Toggle */}
        <div className="flex flex-wrap items-center justify-center gap-4 bg-white p-2.5 rounded-2xl shadow-sm border border-slate-200 max-w-md mx-auto mb-12">
          <div className="inline-flex rounded-xl p-1 bg-slate-100 border border-slate-200">
            <button
              onClick={() => setCurrency('USD')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                currency === 'USD' ? 'bg-[#1d4ed8] text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              USD ($)
            </button>
            <button
              onClick={() => setCurrency('PKR')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                currency === 'PKR' ? 'bg-[#1d4ed8] text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              PKR (Rs)
            </button>
          </div>

          <div className="inline-flex items-center gap-2">
            <span className={`text-xs font-semibold ${!isAnnual ? 'text-slate-900' : 'text-slate-500'}`}>Monthly</span>
            <button
              onClick={() => setIsAnnual(!isAnnual)}
              className={`w-11 h-5.5 flex items-center rounded-full p-0.5 cursor-pointer transition-colors ${
                isAnnual ? 'bg-[#1d4ed8]' : 'bg-slate-300'
              }`}
            >
              <div
                className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                  isAnnual ? 'translate-x-5.5' : 'translate-x-0'
                }`}
              />
            </button>
            <span className={`text-xs font-semibold flex items-center gap-1 ${isAnnual ? 'text-[#1d4ed8]' : 'text-slate-500'}`}>
              Annual
              <span className="bg-emerald-100 text-emerald-800 text-[10px] font-extrabold px-1.5 py-0.2 rounded-full">-20%</span>
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 max-w-6xl mx-auto gap-8 justify-center items-stretch text-left">
          {plans.map((plan, i) => {
            const isFree = plan.priceUsdMonthly === 0;
            const multiplier = isAnnual ? 0.8 : 1.0;
            const priceUsd = Math.round(plan.priceUsdMonthly * multiplier);
            const pricePkr = Math.round(plan.pricePkrMonthly * multiplier);
            const displayPrice = isFree ? 'Free' : currency === 'USD' ? `$${priceUsd}` : `PKR ${pricePkr.toLocaleString()}`;
            const period = isFree ? '' : '/month';
            const isPopular = plan.badge === 'Most Popular';

            return (
              <div
                key={i}
                className={`plan-card rounded-3xl p-6 sm:p-8 transition-all duration-300 flex flex-col justify-between ${
                  isPopular
                    ? 'border-2 border-[#1d4ed8] shadow-2xl shadow-blue-500/15 bg-white relative ring-1 ring-[#1d4ed8]'
                    : 'border border-[#e9e4ff] hover:border-[#c4b5fd] hover:shadow-lg bg-white'
                }`}
              >
                <div>
                  {plan.badge && (
                    <span className="inline-block px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#1d4ed8] text-white mb-3">
                      {plan.badge}
                    </span>
                  )}
                  <h3 className="font-heading text-xl font-bold text-[#0f172a] mb-1">{plan.name}</h3>
                  <p className="font-body text-xs text-[#64748b] mb-4 min-h-[32px]">{plan.description}</p>
                  
                  <div className="flex items-baseline gap-1 mb-6">
                    <span className="font-heading text-3xl font-extrabold text-[#0f172a]">{displayPrice}</span>
                    <span className="font-body text-xs text-[#64748b]">{period}</span>
                  </div>

                  <ul className="space-y-2.5 pt-4 border-t border-[#f3f0ff] mb-8">
                    {plan.features.map((feature, j) => (
                      <li key={j} className="flex items-center gap-2 text-xs">
                        <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span className="text-[#334155] font-medium">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <button
                  onClick={() => setSelectedPlanModal(plan)}
                  className={`w-full py-2.5 rounded-xl font-bold text-xs text-center transition-all cursor-pointer ${
                    isPopular
                      ? 'bg-[#1d4ed8] text-white shadow-lg shadow-blue-600/25 hover:bg-[#1e40af]'
                      : 'bg-blue-50/70 text-[#1d4ed8] border border-blue-200 hover:bg-blue-100'
                  }`}
                >
                  {isFree ? 'Get Started Free' : isPopular ? 'Start Pro Trial' : 'Select Plan'}
                </button>
              </div>
            );
          })}
        </div>

        {/* Payment Methods Footer Strip */}
        <div className="mt-12 flex flex-wrap items-center justify-center gap-2 sm:gap-3 text-xs font-semibold text-slate-600">
          <span className="flex items-center gap-1.5 text-slate-800 font-bold mr-1">
            <CreditCard className="w-4 h-4 text-[#1d4ed8]" />
            Official Real-Time Gateways:
          </span>
          <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-xs hover:border-slate-300 transition-all">
            <img
              src="/images/payments/jazzcash.png"
              alt="JazzCash"
              className="h-5 w-auto max-w-[65px] object-contain shrink-0"
              style={{ height: '20px', maxHeight: '20px', maxWidth: '65px', objectFit: 'contain' }}
              loading="lazy"
            />
            <span className="font-bold text-slate-800 text-[11px]">JazzCash</span>
          </div>
          <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-xs hover:border-slate-300 transition-all">
            <img
              src="/images/payments/easypaisa.png"
              alt="Easypaisa"
              className="h-5 w-auto max-w-[65px] object-contain shrink-0"
              style={{ height: '20px', maxHeight: '20px', maxWidth: '65px', objectFit: 'contain' }}
              loading="lazy"
            />
            <span className="font-bold text-slate-800 text-[11px]">Easypaisa</span>
          </div>
          <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-xs hover:border-slate-300 transition-all">
            <img
              src="/images/payments/meezan.png"
              alt="Meezan Bank"
              className="h-5 w-auto max-w-[65px] object-contain shrink-0"
              style={{ height: '20px', maxHeight: '20px', maxWidth: '65px', objectFit: 'contain' }}
              loading="lazy"
            />
            <span className="font-bold text-slate-800 text-[11px]">Meezan IBFT</span>
          </div>
          <div className="flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-xs hover:border-slate-300 transition-all">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
            <span className="font-bold text-[#0B5D34] text-[11px]">Raast Instant</span>
          </div>
          <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-xs hover:border-slate-300 transition-all">
            <span className="font-bold text-slate-800 text-[11px]">PayFast / Visa / Mastercard</span>
          </div>
        </div>
      </div>

      {selectedPlanModal && (
        <SubscriptionCheckoutModal
          isOpen={!!selectedPlanModal}
          onClose={() => setSelectedPlanModal(null)}
          selectedPlan={selectedPlanModal}
          initialCurrency={currency}
          initialAnnual={isAnnual}
        />
      )}
    </section>
  );
}