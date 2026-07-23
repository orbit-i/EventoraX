import { useEffect } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Link } from 'react-router';
import { Check, X, HelpCircle, Sparkles } from 'lucide-react';

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
      <section className="bg-[#f3f0ff] py-20 md:py-32 text-center">
        <div className="content-max">
          <p className="font-body text-sm uppercase tracking-[0.1em] mb-4 text-[#a78bfa] font-semibold">Pricing</p>
          <h1 className="font-heading text-4xl md:text-6xl font-bold tracking-[-0.02em] mb-6 text-[#0f172a]">
            Simple, transparent pricing
          </h1>
          <p className="font-body text-lg md:text-xl max-w-2xl mx-auto text-[#64748b] leading-relaxed">
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
                className={`scroll-reveal rounded-2xl p-8 transition-all duration-300 ${
                  plan.active
                    ? 'border-2 border-[#7c3aed] shadow-xl shadow-[#7c3aed]/10 scale-105 z-10'
                    : 'border border-[#e9e4ff] hover:border-[#c4b5fd] hover:shadow-lg'
                }`}
                style={{
                  background: plan.active ? '#f5f3ff' : '#FFFFFF',
                  transitionDelay: `${i * 100}ms`,
                }}
              >
                {plan.active && (
                  <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold mb-4 text-white bg-[#7c3aed] shadow-sm shadow-[#7c3aed]/20">
                    <Sparkles size={12} />
                    Most Popular
                  </div>
                )}
                <h3 className="font-heading text-2xl font-bold mb-1 text-[#0f172a]">{plan.name}</h3>
                <p className="font-body text-sm mb-6 text-[#475569]">{plan.description}</p>
                <div className="flex items-baseline mb-8">
                  <span className="font-heading text-5xl font-bold text-[#0f172a]">{plan.price}</span>
                  <span className="font-body text-lg ml-1 text-[#94a3b8]">{plan.period}</span>
                </div>
                <ul className="space-y-3 mb-8">
                  {plan.features.map((f, fi) => (
                    <li key={fi} className="flex items-center gap-3">
                      {f.included ? (
                        <div className="w-5 h-5 rounded-full bg-[#f0fdf4] flex items-center justify-center flex-shrink-0">
                          <Check size={14} className="text-[#16a34a]" />
                        </div>
                      ) : (
                        <div className="w-5 h-5 rounded-full bg-[#f8fafc] flex items-center justify-center flex-shrink-0">
                          <X size={14} className="text-[#cbd5e1]" />
                        </div>
                      )}
                      <span className={`font-body text-sm ${f.included ? 'text-[#0f172a]' : 'text-[#94a3b8]'}`}>
                        {f.text}
                      </span>
                    </li>
                  ))}
                </ul>
                <Link
                  to="/register"
                  className={`block w-full text-center py-3.5 rounded-xl font-body font-semibold transition-all duration-200 ${
                    plan.active
                      ? 'bg-[#7c3aed] text-white shadow-lg shadow-[#7c3aed]/25 hover:bg-[#6d28d9] hover:shadow-xl hover:shadow-[#7c3aed]/30 hover:-translate-y-0.5 active:translate-y-0'
                      : 'border-2 border-[#e2e8f0] text-[#0f172a] hover:border-[#c4b5fd] hover:bg-[#f5f3ff] hover:text-[#7c3aed]'
                  }`}
                >
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Comparison Table */}
      <section className="bg-[#f5f3ff] section-padding">
        <div className="content-max">
          <h2 className="font-heading text-3xl md:text-4xl font-bold text-center mb-12 tracking-[-0.02em] text-[#0f172a]">
            Feature comparison
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full max-w-4xl mx-auto bg-white rounded-2xl border border-[#e9e4ff] shadow-sm overflow-hidden">
              <thead>
                <tr className="border-b-2 border-[#7c3aed] bg-[#f5f3ff]">
                  <th className="text-left py-4 px-6 font-body text-sm font-semibold text-[#0f172a]">Feature</th>
                  <th className="text-center py-4 px-6 font-body text-sm font-semibold text-[#0f172a]">Starter</th>
                  <th className="text-center py-4 px-6 font-body text-sm font-semibold text-[#7c3aed]">Pro</th>
                  <th className="text-center py-4 px-6 font-body text-sm font-semibold text-[#0f172a]">Enterprise</th>
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
                  <tr key={i} className="border-b border-[#e9e4ff] last:border-b-0 hover:bg-[#faf8ff] transition-colors duration-150">
                    <td className="py-4 px-6 font-body text-sm font-medium text-[#0f172a]">{row[0]}</td>
                    <td className="text-center py-4 px-6 font-body text-sm text-[#64748b]">{row[1]}</td>
                    <td className="text-center py-4 px-6 font-body text-sm font-semibold text-[#7c3aed]">{row[2]}</td>
                    <td className="text-center py-4 px-6 font-body text-sm text-[#0f172a]">{row[3]}</td>
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
          <h2 className="font-heading text-3xl md:text-4xl font-bold text-center mb-12 tracking-[-0.02em] text-[#0f172a]">
            Billing questions
          </h2>
          <div className="max-w-3xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6">
            {faqs.map((faq, i) => (
              <div key={i} className="scroll-reveal p-6 rounded-2xl border border-[#e9e4ff] bg-[#faf8ff] hover:shadow-md transition-all duration-200">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#f5f3ff] flex items-center justify-center flex-shrink-0">
                    <HelpCircle size={18} className="text-[#7c3aed]" />
                  </div>
                  <div>
                    <h4 className="font-body text-base font-semibold mb-2 text-[#0f172a]">{faq.q}</h4>
                    <p className="font-body text-sm text-[#475569] leading-relaxed">{faq.a}</p>
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