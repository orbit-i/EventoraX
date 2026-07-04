import { useEffect } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Link } from 'react-router';
import { Check, X, HelpCircle } from 'lucide-react';

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
      { text: 'Analytics dashboard', included: false },
      { text: 'API access', included: false },
      { text: 'White-label', included: false },
      { text: 'Priority support', included: false },
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
      { text: 'Analytics dashboard', included: true },
      { text: 'API access', included: false },
      { text: 'White-label', included: false },
      { text: 'Priority support', included: true },
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
      { text: 'Onboarding training', included: true },
      { text: 'Priority support', included: true },
    ],
    active: false,
    cta: 'Contact Sales',
  },
];

const faqs = [
  { q: 'Can I switch plans later?', a: 'Yes, you can upgrade or downgrade your plan at any time. Changes take effect immediately.' },
  { q: 'Is there a free trial?', a: 'Yes! Every paid plan includes a 14-day free trial. No credit card required to start.' },
  { q: 'What payment methods do you accept?', a: 'We accept all major credit cards, PayPal, and bank transfers for annual plans.' },
  { q: 'Can I cancel anytime?', a: 'Absolutely. You can cancel your subscription at any time with no cancellation fees.' },
];

export default function Pricing() {
  useEffect(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

    const reveals = document.querySelectorAll('.scroll-reveal');
    reveals.forEach((el) => {
      gsap.from(el, {
        scrollTrigger: { trigger: el, start: 'top 85%' },
        opacity: 0, y: 30, duration: 0.5, ease: 'power1.out',
      });
    });
    return () => { ScrollTrigger.getAll().forEach((st) => st.kill()); };
  }, []);

  return (
    <main className="pt-14">
      {/* Hero */}
      <section className="bg-[#F5FAFF] py-20 md:py-32 text-center">
        <div className="content-max">
          <p className="font-body text-sm uppercase tracking-[0.1em] mb-4" style={{ color: '#A0B4CC' }}>Pricing</p>
          <h1 className="font-heading text-4xl md:text-6xl font-medium tracking-[-0.02em] mb-6" style={{ color: '#1B2A4A' }}>
            Simple, transparent pricing
          </h1>
          <p className="font-body text-lg md:text-xl max-w-2xl mx-auto" style={{ color: '#A0B4CC' }}>
            Start free. Scale as you grow. No hidden fees, no surprises.
          </p>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="bg-white section-padding">
        <div className="content-max">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 max-w-5xl mx-auto">
            {plans.map((plan, i) => (
              <div
                key={i}
                className={`scroll-reveal rounded-3xl p-8 transition-all duration-300 ${
                  plan.active
                    ? 'border-2 border-[#4A9CFF] shadow-lg'
                    : 'border border-[#E8F4FD] hover:border-[#4A9CFF]'
                }`}
                style={{
                  background: plan.active ? '#F5FAFF' : '#FFFFFF',
                  boxShadow: plan.active ? '0 8px 32px rgba(74,156,255,0.12)' : undefined,
                  transitionDelay: `${i * 100}ms`,
                }}
              >
                {plan.active && (
                  <div className="inline-block px-3 py-1 rounded-full text-xs font-medium mb-4 text-white" style={{ backgroundColor: '#4A9CFF' }}>
                    Most Popular
                  </div>
                )}
                <h3 className="font-heading text-2xl font-medium mb-1" style={{ color: '#1B2A4A' }}>{plan.name}</h3>
                <p className="font-body text-sm mb-6" style={{ color: '#A0B4CC' }}>{plan.description}</p>
                <div className="flex items-baseline mb-8">
                  <span className="font-heading text-5xl font-medium" style={{ color: '#1B2A4A' }}>{plan.price}</span>
                  <span className="font-body text-lg ml-1" style={{ color: '#A0B4CC' }}>{plan.period}</span>
                </div>
                <ul className="space-y-3 mb-8">
                  {plan.features.map((f, fi) => (
                    <li key={fi} className="flex items-center gap-3">
                      {f.included ? (
                        <Check size={18} style={{ color: '#2A8B6F' }} />
                      ) : (
                        <X size={18} style={{ color: '#A0B4CC', opacity: 0.4 }} />
                      )}
                      <span className="font-body text-sm" style={{ color: f.included ? '#1B2A4A' : '#A0B4CC', opacity: f.included ? 1 : 0.6 }}>
                        {f.text}
                      </span>
                    </li>
                  ))}
                </ul>
                <Link
                  to="/register"
                  className={`block w-full text-center py-3.5 rounded-full font-body font-medium transition-all duration-300 hover:scale-[1.02] ${
                    plan.active
                      ? 'text-white'
                      : 'border hover:bg-[#F5FAFF]'
                  }`}
                  style={plan.active ? { backgroundColor: '#4A9CFF' } : { borderColor: '#E8F4FD', color: '#1B2A4A' }}
                >
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Comparison Table */}
      <section className="bg-[#F5FAFF] section-padding">
        <div className="content-max">
          <h2 className="font-heading text-3xl md:text-4xl font-medium text-center mb-12 tracking-[-0.02em]" style={{ color: '#1B2A4A' }}>
            Feature comparison
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full max-w-4xl mx-auto">
              <thead>
                <tr className="border-b-2" style={{ borderColor: '#4A9CFF' }}>
                  <th className="text-left py-4 px-4 font-body text-sm font-medium" style={{ color: '#1B2A4A' }}>Feature</th>
                  <th className="text-center py-4 px-4 font-body text-sm font-medium" style={{ color: '#1B2A4A' }}>Starter</th>
                  <th className="text-center py-4 px-4 font-body text-sm font-medium" style={{ color: '#4A9CFF' }}>Pro</th>
                  <th className="text-center py-4 px-4 font-body text-sm font-medium" style={{ color: '#1B2A4A' }}>Enterprise</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ['Attendees', 'Up to 50', 'Unlimited', 'Unlimited'],
                  ['Events', '1', '10', 'Unlimited'],
                  ['Certificates', 'Basic', 'Custom', 'Custom'],
                  ['QR Ticketing', '—', 'Included', 'Included'],
                  ['Analytics', '—', 'Full', 'Full'],
                  ['Custom Branding', '—', 'Included', 'Full White-label'],
                  ['API Access', '—', '—', 'Full'],
                  ['Support', 'Email', 'Priority', 'Dedicated'],
                ].map((row, i) => (
                  <tr key={i} className="border-b" style={{ borderColor: '#E8F4FD' }}>
                    <td className="py-4 px-4 font-body text-sm" style={{ color: '#1B2A4A' }}>{row[0]}</td>
                    <td className="text-center py-4 px-4 font-body text-sm" style={{ color: '#A0B4CC' }}>{row[1]}</td>
                    <td className="text-center py-4 px-4 font-body text-sm font-medium" style={{ color: '#4A9CFF' }}>{row[2]}</td>
                    <td className="text-center py-4 px-4 font-body text-sm" style={{ color: '#1B2A4A' }}>{row[3]}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="bg-white section-padding">
        <div className="content-max">
          <h2 className="font-heading text-3xl md:text-4xl font-medium text-center mb-12 tracking-[-0.02em]" style={{ color: '#1B2A4A' }}>
            Billing questions
          </h2>
          <div className="max-w-3xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6">
            {faqs.map((faq, i) => (
              <div key={i} className="scroll-reveal p-6 rounded-2xl border" style={{ borderColor: '#E8F4FD', backgroundColor: '#F5FAFF' }}>
                <div className="flex items-start gap-3">
                  <HelpCircle size={20} className="flex-shrink-0 mt-0.5" style={{ color: '#4A9CFF' }} />
                  <div>
                    <h4 className="font-body text-base font-medium mb-2" style={{ color: '#1B2A4A' }}>{faq.q}</h4>
                    <p className="font-body text-sm" style={{ color: '#A0B4CC' }}>{faq.a}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
