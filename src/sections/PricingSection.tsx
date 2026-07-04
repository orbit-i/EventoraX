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
      className="section-padding blueprint-grid"
    >
      <div className="content-max text-center">
        <h2 className="font-heading text-3xl md:text-5xl font-medium text-white mb-4 tracking-[-0.02em]">
          Simple pricing, powerful features
        </h2>
        <p className="font-body text-lg md:text-xl font-light mb-12 md:mb-16" style={{ color: '#A0B4CC' }}>
          Start free. Scale as you grow.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
          {plans.map((plan, i) => (
            <div
              key={i}
              className={`plan-card rounded-3xl p-8 md:p-10 text-left transition-all duration-300 ${
                plan.active
                  ? 'border-2 border-[#4A9CFF]'
                  : 'border border-dashed border-[rgba(74,156,255,0.3)] hover:border-solid hover:border-[#4A9CFF]'
              }`}
              style={{
                background: 'rgba(255,255,255,0.05)',
                backdropFilter: 'blur(16px)',
                boxShadow: plan.active ? '0 0 40px rgba(74,156,255,0.2)' : undefined,
              }}
            >
              {plan.active && (
                <div className="inline-block px-3 py-1 rounded-full text-xs font-medium mb-4 bg-[#4A9CFF] text-white">
                  Most Popular
                </div>
              )}
              <h3 className="font-heading text-2xl font-medium text-white mb-1">
                {plan.name}
              </h3>
              <p className="font-body text-sm mb-6" style={{ color: '#A0B4CC' }}>
                {plan.description}
              </p>

              <div className="flex items-baseline mb-8">
                <span className="font-heading text-5xl font-medium text-white">
                  {plan.price}
                </span>
                <span className="font-body text-lg ml-1" style={{ color: '#A0B4CC' }}>
                  {plan.period}
                </span>
              </div>

              <ul className="space-y-3 mb-8">
                {plan.features.map((feature, fi) => (
                  <li key={fi} className="flex items-center gap-3">
                    {feature.included ? (
                      <Check size={18} style={{ color: '#C8F0E4' }} />
                    ) : (
                      <X size={18} style={{ color: '#A0B4CC', opacity: 0.4 }} />
                    )}
                    <span
                      className="font-body text-sm"
                      style={{ color: feature.included ? '#FFFFFF' : '#A0B4CC', opacity: feature.included ? 1 : 0.6 }}
                    >
                      {feature.text}
                    </span>
                  </li>
                ))}
              </ul>

              <Link
                to="/register"
                className={`block w-full text-center py-3.5 rounded-full font-body font-medium transition-all duration-300 hover:scale-[1.02] ${
                  plan.active
                    ? 'bg-[#4A9CFF] text-white hover:bg-[#3A8CEF]'
                    : 'bg-transparent border border-[rgba(255,255,255,0.2)] text-white hover:bg-white/5'
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
