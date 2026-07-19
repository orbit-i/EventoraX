import { Link } from 'react-router';
import { Check, X } from 'lucide-react';
import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const plans = [
  {
    name: 'Starter',
    price: 'Free',
    period: '',
    description: 'Perfect for getting started',
    features: [
      { text: 'Up to 50 attendees', included: true },
      { text: '1 event at a time', included: true },
      { text: 'Basic certificates', included: true },
      { text: 'Email support', included: true },
      { text: 'Custom branding', included: false },
      { text: 'QR ticketing', included: false },
      { text: 'API access', included: false },
      { text: 'White-label', included: false },
    ],
    active: false,
    cta: 'Get Started Free',
  },
  {
    name: 'Pro',
    price: '$29',
    period: '/month',
    description: 'Best for growing organizers',
    features: [
      { text: 'Unlimited attendees', included: true },
      { text: '10 events', included: true },
      { text: 'Custom certificates', included: true },
      { text: 'QR tickets', included: true },
      { text: 'Priority support', included: true },
      { text: 'Custom branding', included: true },
      { text: 'API access', included: false },
      { text: 'White-label', included: false },
    ],
    active: true,
    cta: 'Start Pro Trial',
  },
  {
    name: 'Enterprise',
    price: '$99',
    period: '/month',
    description: 'For large organizations',
    features: [
      { text: 'Everything in Pro', included: true },
      { text: 'Unlimited events', included: true },
      { text: 'White-label', included: true },
      { text: 'Full API access', included: true },
      { text: 'Dedicated support', included: true },
      { text: 'SSO integration', included: true },
      { text: 'Custom domains', included: true },
      { text: 'SLA guarantee', included: true },
    ],
    active: false,
    cta: 'Contact Sales',
  },
];

export default function PricingSection() {
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

    const cards = el.querySelectorAll('.plan-card');
    cards.forEach((card, i) => {
      gsap.from(card, {
        scrollTrigger: { trigger: card, start: 'top 85%' },
        opacity: 0,
        y: 40,
        duration: 0.5,
        delay: i * 0.1,
        ease: 'power1.out',
      });
    });
  }, []);

  return (
    <section
      ref={sectionRef}
      className="section-padding bg-[#f3f0ff]"
    >
      <div className="content-max text-center">
        <h2 className="font-heading text-3xl md:text-5xl font-bold text-[#0f172a] mb-4 tracking-[-0.02em]">
          Simple pricing, powerful features
        </h2>
        <p className="font-body text-lg md:text-xl mb-12 md:mb-16 text-[#64748b]">
          Start free. Scale as you grow.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
          {plans.map((plan, i) => (
            <div
              key={i}
              className={`plan-card rounded-2xl p-8 md:p-10 text-left transition-all duration-300 hover:-translate-y-1 ${
                plan.active
                  ? 'border-2 border-[#7c3aed] bg-white shadow-xl shadow-[#7c3aed]/10 scale-105 z-10'
                  : 'border border-dashed border-[#ddd6fe] bg-white/80 hover:border-solid hover:border-[#c4b5fd] hover:bg-white hover:shadow-lg'
              }`}
            >
              {plan.active && (
                <div className="inline-block px-3 py-1 rounded-full text-xs font-semibold mb-4 bg-[#7c3aed] text-white shadow-sm shadow-[#7c3aed]/20">
                  Most Popular
                </div>
              )}
              <h3 className="font-heading text-2xl font-bold text-[#0f172a] mb-1">
                {plan.name}
              </h3>
              <p className="font-body text-sm mb-6 text-[#475569]">
                {plan.description}
              </p>

              <div className="flex items-baseline mb-8">
                <span className="font-heading text-5xl font-bold text-[#0f172a]">
                  {plan.price}
                </span>
                <span className="font-body text-lg ml-1 text-[#94a3b8]">
                  {plan.period}
                </span>
              </div>

              <ul className="space-y-3.5 mb-8">
                {plan.features.map((feature, fi) => (
                  <li key={fi} className="flex items-center gap-3">
                    {feature.included ? (
                      <div className="w-5 h-5 rounded-full bg-[#f5f3ff] flex items-center justify-center flex-shrink-0">
                        <Check size={14} className="text-[#7c3aed]" />
                      </div>
                    ) : (
                      <div className="w-5 h-5 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                        <X size={14} className="text-[#cbd5e1]" />
                      </div>
                    )}
                    <span
                      className="font-body text-sm"
                      style={{ color: feature.included ? '#0f172a' : '#94a3b8', opacity: feature.included ? 1 : 0.6 }}
                    >
                      {feature.text}
                    </span>
                  </li>
                ))}
              </ul>

              <Link
                to="/register"
                className={`block w-full text-center py-3.5 rounded-xl font-body font-semibold transition-all duration-200 ${
                  plan.active
                    ? 'bg-[#7c3aed] text-white shadow-lg shadow-[#7c3aed]/25 hover:bg-[#6d28d9] hover:shadow-xl hover:shadow-[#7c3aed]/30 hover:-translate-y-0.5'
                    : 'bg-white border-2 border-[#e9e4ff] text-[#0f172a] hover:border-[#c4b5fd] hover:bg-[#f5f3ff] hover:text-[#7c3aed]'
                }`}
              >
                {plan.cta}
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}