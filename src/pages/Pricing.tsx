import { Link } from 'react-router';
import { HelpCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { PaymentBadges, PlanCards, PlanComparison, usePublicPlans, useTrialDays } from '@/components/public/plans';

export default function Pricing() {
  const { plans, loading, error } = usePublicPlans();
  const trialDays = useTrialDays();
  const trial = `${trialDays} ${trialDays === 1 ? 'day' : 'days'}`;

  const faqs = [
    {
      q: 'How does the free trial work?',
      a: `Sign up and you get the full Pro plan free for ${trial}. No payment details are needed. When it ends, your data stays safe — you just can't create new things until you pay.`,
    },
    {
      q: 'How do I pay?',
      a: 'From your Billing page: send the yearly amount by JazzCash, Easypaisa or bank transfer, then enter the transaction ID (and a screenshot of the receipt if you have one). We confirm it, usually within one working day.',
    },
    {
      q: 'Is it monthly or yearly?',
      a: 'Yearly. One payment covers 12 months. If you renew before your plan ends, the new year is added on top — you never lose days.',
    },
    {
      q: 'Can I switch from Pro to Enterprise?',
      a: 'Yes. Pay for Enterprise from the Billing page, or contact us and we will move you over. Your events, attendees and certificates stay exactly as they are.',
    },
    {
      q: 'What happens if I don’t renew?',
      a: 'Your organization becomes read-only: you can still log in, see your overview, change settings and renew. Nothing is deleted. Public certificate verification keeps working.',
    },
    {
      q: 'Can I cancel?',
      a: 'There is nothing to cancel — plans don’t renew automatically. If you no longer need EventoraX, simply don’t pay for the next year. You can also delete your organization from Settings.',
    },
  ];

  return (
    <main className="pt-14">
      {/* Hero */}
      <section className="bg-[#f3f0ff] py-20 md:py-28 text-center">
        <div className="content-max">
          <p className="font-body text-sm uppercase tracking-[0.1em] mb-4 text-[#a78bfa] font-semibold">Pricing</p>
          <h1 className="font-heading text-4xl md:text-6xl font-bold tracking-[-0.02em] mb-6 text-[#0f172a]">
            Simple, transparent pricing
          </h1>
          <p className="font-body text-lg md:text-xl max-w-2xl mx-auto text-[#64748b] leading-relaxed">
            One yearly price in Pakistani rupees. Unlimited events and attendees on every plan. Start with a {trialDays}-day free trial.
          </p>
          <PaymentBadges className="mt-8" />
        </div>
      </section>

      {/* Plans */}
      <section className="bg-white section-padding">
        <div className="content-max">
          <PlanCards plans={plans} loading={loading} error={error} />
        </div>
      </section>

      {/* Comparison */}
      <section className="bg-[#f5f3ff] section-padding">
        <div className="content-max">
          <h2 className="font-heading text-3xl md:text-4xl font-bold text-center mb-12 tracking-[-0.02em] text-[#0f172a]">
            Feature comparison
          </h2>
          {loading ? <Skeleton className="mx-auto h-96 max-w-4xl rounded-2xl" /> : plans.length > 0 && <PlanComparison plans={plans} />}
        </div>
      </section>

      {/* FAQ */}
      <section className="bg-white section-padding">
        <div className="content-max">
          <h2 className="font-heading text-3xl md:text-4xl font-bold text-center mb-12 tracking-[-0.02em] text-[#0f172a]">
            Billing questions
          </h2>
          <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6">
            {faqs.map((faq) => (
              <div key={faq.q} className="p-6 rounded-2xl border border-[#e9e4ff] bg-[#faf8ff]">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#f5f3ff] flex items-center justify-center flex-shrink-0">
                    <HelpCircle size={18} className="text-[#7c3aed]" />
                  </div>
                  <div>
                    <h3 className="font-body text-base font-semibold mb-2 text-[#0f172a]">{faq.q}</h3>
                    <p className="font-body text-sm text-[#475569] leading-relaxed">{faq.a}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-[#f3f0ff] py-20 text-center">
        <div className="content-max">
          <h2 className="font-heading text-3xl md:text-4xl font-bold mb-4 tracking-[-0.02em] text-[#0f172a]">Try everything free for {trial}</h2>
          <p className="font-body text-base mb-8 text-[#64748b]">No payment details needed. Set up your first event in minutes.</p>
          <Button asChild size="lg">
            <Link to="/register">Start free trial</Link>
          </Button>
        </div>
      </section>
    </main>
  );
}
