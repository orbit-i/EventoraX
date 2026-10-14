import { useState, useEffect } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Check, X, Sparkles, CreditCard } from 'lucide-react';
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
      'Multi-Role Team Collaborators',
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
      'Full White-Labeling (Remove EventoraX)',
      'Custom Domain (events.yourdomain.com)',
      'Multi-Tenant Workspaces Isolation',
      'Tamper-Proof Public Verification Portal',
      'Dedicated Account Manager & 99.9% SLA',
      'Priority 24/7 Phone & Email Support',
    ],
  },
];

const faqs = [
  { q: 'How does Multi-Tenancy work in EventoraX?', a: 'Every organizer gets an isolated workspace with partitioned events, attendees, team permissions, custom branding, and settings. You can also manage multiple client workspaces from a single login.' },
  { q: 'Can I sell EventoraX to my clients under my own brand (White-Label)?', a: 'Yes! On the Enterprise plan, you can attach custom domains, upload your own logo, set custom theme colors, and remove all EventoraX branding.' },
  { q: 'Which payment methods are supported for Pakistani and international organizations?', a: 'We natively support Pakistani local gateways including JazzCash, Easypaisa, Raast Instant Pay, and Direct Bank Transfer (Meezan, HBL, Alfalah), as well as international Credit/Debit cards via Stripe.' },
  { q: 'Is there a free trial?', a: 'Yes! Every tier includes a 14-day free trial. You can start right away without committing.' },
];

export default function Pricing() {
  const [currency, setCurrency] = useState<'USD' | 'PKR'>('USD');
  const [isAnnual, setIsAnnual] = useState(false);
  const [selectedPlanModal, setSelectedPlanModal] = useState<PlanData | null>(null);
  const [plans, setPlans] = useState<PlanData[]>(plansData);

  useEffect(() => {
    api.billing.getPlans().then((res) => {
      if (res && res.plans && Array.isArray(res.plans)) {
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
        if (mapped.length > 0) {
          setPlans(mapped);
        }
      }
    }).catch(() => {});
  }, []);

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

    const reveals = document.querySelectorAll('.scroll-reveal');
    reveals.forEach((el) => {
      gsap.fromTo(
        el,
        { opacity: 0.1, y: 20 },
        {
          opacity: 1,
          y: 0,
          duration: 0.5,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: el,
            start: 'top 92%',
            once: true,
          },
        }
      );
    });

    const fallbackTimer = setTimeout(() => {
      document.querySelectorAll('.scroll-reveal').forEach((el) => {
        (el as HTMLElement).style.opacity = '1';
        (el as HTMLElement).style.transform = 'none';
      });
    }, 800);

    return () => {
      clearTimeout(fallbackTimer);
      ScrollTrigger.getAll().forEach((st) => st.kill());
    };
  }, []);

  return (
    <main className="pt-14 bg-[#f8fafc]">
      {/* Hero */}
      <section className="bg-gradient-to-b from-[#eff6ff] to-[#f8fafc] py-16 md:py-24 text-center px-4">
        <div className="max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white border border-blue-200 text-xs font-bold text-[#1d4ed8] mb-5 shadow-xs">
            <Sparkles className="w-4 h-4 text-[#2563eb]" />
            Transparent &amp; Predictable Pricing
          </div>
          <h1 className="font-heading text-4xl md:text-6xl font-extrabold tracking-tight text-slate-900 mb-6">
            Simple pricing for organizers &amp; communities
          </h1>
          <p className="text-base md:text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed mb-8">
            Host standalone events, generate instant attendee ID cards, run QR check-in, and issue tamper-evident certificates with ease.
          </p>

          {/* Currency & Annual Switcher Bar */}
          <div className="flex flex-wrap items-center justify-center gap-4 bg-white p-3 rounded-2xl shadow-sm border border-slate-200 max-w-lg mx-auto">
            {/* Currency Toggle */}
            <div className="inline-flex rounded-xl p-1 bg-slate-100 border border-slate-200">
              <button
                onClick={() => setCurrency('USD')}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  currency === 'USD' ? 'bg-[#1d4ed8] text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                USD ($)
              </button>
              <button
                onClick={() => setCurrency('PKR')}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  currency === 'PKR' ? 'bg-[#1d4ed8] text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                PKR (Rs)
              </button>
            </div>

            {/* Annual Billing Toggle */}
            <div className="inline-flex items-center gap-2">
              <span className={`text-xs font-semibold ${!isAnnual ? 'text-slate-900' : 'text-slate-500'}`}>Monthly</span>
              <button
                onClick={() => setIsAnnual(!isAnnual)}
                className={`w-12 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors ${
                  isAnnual ? 'bg-[#1d4ed8]' : 'bg-slate-300'
                }`}
              >
                <div
                  className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                    isAnnual ? 'translate-x-6' : 'translate-x-0'
                  }`}
                />
              </button>
              <span className={`text-xs font-semibold flex items-center gap-1 ${isAnnual ? 'text-[#1d4ed8]' : 'text-slate-500'}`}>
                Annual
                <span className="bg-emerald-100 text-emerald-800 text-[10px] font-extrabold px-1.5 py-0.5 rounded-full">Save 20%</span>
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Cards Grid */}
      <section className="py-12 px-4 max-w-6xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 justify-center items-stretch">
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
                className={`scroll-reveal rounded-3xl p-6 sm:p-8 transition-all duration-300 flex flex-col justify-between ${
                  isPopular
                    ? 'border-2 border-[#1d4ed8] shadow-2xl shadow-blue-500/15 bg-gradient-to-b from-blue-50/50 to-white relative ring-1 ring-[#1d4ed8]'
                    : 'border border-slate-200 hover:border-blue-300 hover:shadow-lg bg-white'
                }`}
              >
                <div>
                  {plan.badge && (
                    <span className="inline-block px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-[#1d4ed8] text-white mb-4 shadow-sm">
                      {plan.badge}
                    </span>
                  )}
                  <h3 className="font-heading text-2xl font-bold text-slate-900 mb-2">{plan.name}</h3>
                  <p className="text-xs text-slate-600 mb-6 min-h-[32px]">{plan.description}</p>

                  <div className="flex items-baseline gap-1 mb-6">
                    <span className="font-heading text-3xl sm:text-4xl font-extrabold text-slate-900">{displayPrice}</span>
                    <span className="text-xs text-slate-500 font-medium">{period}</span>
                  </div>

                  {isAnnual && !isFree && (
                    <div className="text-[11px] font-semibold text-emerald-600 mb-4 bg-emerald-50 px-2.5 py-1 rounded-lg">
                      Billed annually (Includes 20% discount)
                    </div>
                  )}

                  <ul className="space-y-3 pt-4 border-t border-slate-100 mb-8">
                    {plan.features.map((feature, j) => (
                      <li key={j} className="flex items-center gap-2.5 text-xs">
                        <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span className="text-slate-700 font-medium">{feature}</span>
                      </li>
                    ))}
                    {/* Exclusions for starter */}
                    {isFree && (
                      <>
                        <li className="flex items-center gap-2.5 text-xs text-slate-400">
                          <X className="w-4 h-4 text-slate-300 shrink-0" />
                          <span>Custom White-labeling</span>
                        </li>
                        <li className="flex items-center gap-2.5 text-xs text-slate-400">
                          <X className="w-4 h-4 text-slate-300 shrink-0" />
                          <span>Custom Domain (CNAME)</span>
                        </li>
                      </>
                    )}
                    {plan.name === 'Professional' && (
                      <>
                        <li className="flex items-center gap-2.5 text-xs text-slate-400">
                          <X className="w-4 h-4 text-slate-300 shrink-0" />
                          <span>Custom Domain (CNAME)</span>
                        </li>
                      </>
                    )}
                  </ul>
                </div>

                <button
                  onClick={() => setSelectedPlanModal(plan)}
                  className={`w-full py-3 rounded-xl font-bold text-xs text-center transition-all cursor-pointer ${
                    isPopular
                      ? 'bg-[#1d4ed8] text-white shadow-lg shadow-blue-600/25 hover:bg-[#1e40af]'
                      : 'bg-slate-100 text-[#1d4ed8] hover:bg-blue-50 border border-slate-200'
                  }`}
                >
                  {isFree ? 'Get Started Free' : isPopular ? 'Start Pro Trial' : 'Upgrade to Enterprise'}
                </button>
              </div>
            );
          })}
        </div>

        {/* Payment Gateways Showcase Bar */}
        <div className="mt-16 bg-white p-6 rounded-3xl border border-slate-200 text-center shadow-xs">
          <div className="flex items-center justify-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-wider mb-4">
            <CreditCard className="w-4 h-4 text-[#1d4ed8]" />
            Supported Global & Local Pakistani Payment Methods
          </div>
          <div className="flex flex-wrap items-center justify-center gap-2.5 sm:gap-4 text-xs font-bold text-slate-700">
            <div className="px-3.5 py-2 rounded-xl bg-white border border-slate-200 flex items-center gap-2 shadow-xs hover:border-slate-300 transition-all">
              <img src="/images/payments/jazzcash.png" alt="JazzCash" className="h-5 w-auto object-contain" />
              <span className="font-bold text-slate-800">JazzCash</span>
            </div>
            <div className="px-3.5 py-2 rounded-xl bg-white border border-slate-200 flex items-center gap-2 shadow-xs hover:border-slate-300 transition-all">
              <img src="/images/payments/easypaisa.png" alt="Easypaisa" className="h-5 w-auto object-contain" />
              <span className="font-bold text-slate-800">Easypaisa</span>
            </div>
            <div className="px-3.5 py-2 rounded-xl bg-white border border-slate-200 flex items-center gap-2 shadow-xs hover:border-slate-300 transition-all">
              <img src="/images/payments/meezan.png" alt="Meezan Bank" className="h-5.5 w-auto object-contain" />
              <span className="font-bold text-slate-800">Meezan IBFT</span>
            </div>
            <div className="px-3.5 py-2 rounded-xl bg-white border border-slate-200 flex items-center gap-2 shadow-xs hover:border-slate-300 transition-all">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 animate-pulse" />
              <span className="font-bold text-[#0B5D34]">Raast SBP Instant</span>
            </div>
            <div className="px-3.5 py-2 rounded-xl bg-white border border-slate-200 flex items-center gap-2 shadow-xs hover:border-slate-300 transition-all">
              <span className="font-bold text-slate-800">PayFast / Visa / MasterCard</span>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 px-4 bg-slate-50 border-t border-slate-200">
        <div className="max-w-3xl mx-auto space-y-6">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-extrabold text-slate-900 font-heading">Frequently Asked Questions</h2>
            <p className="text-sm text-slate-600 mt-2">Everything you need to know about EventoraX Event Platform</p>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, i) => (
              <div key={i} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
                <h4 className="text-base font-bold text-slate-900 mb-2">{faq.q}</h4>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Subscription Checkout Modal */}
      {selectedPlanModal && (
        <SubscriptionCheckoutModal
          isOpen={!!selectedPlanModal}
          onClose={() => setSelectedPlanModal(null)}
          selectedPlan={selectedPlanModal}
          initialCurrency={currency}
          initialAnnual={isAnnual}
        />
      )}
    </main>
  );
}