import { Link } from 'react-router';
import { PaymentBadges, PlanCards, usePublicPlans, useTrialDays } from '@/components/public/plans';

/** Home page pricing: the real plans from the database (Superadmin → Plans & pricing). */
export default function PricingSection() {
  const { plans, loading, error } = usePublicPlans();
  const trialDays = useTrialDays();

  return (
    <section className="section-padding bg-[#f3f0ff]">
      <div className="content-max text-center">
        <h2 className="font-heading text-3xl md:text-5xl font-bold text-[#0f172a] mb-4 tracking-[-0.02em]">
          Simple yearly pricing in PKR
        </h2>
        <p className="font-body text-lg md:text-xl mb-12 md:mb-16 text-[#64748b]">
          Every feature you need, one price per year. Try it free for {trialDays} {trialDays === 1 ? 'day' : 'days'}, no card needed.
        </p>
        <PlanCards plans={plans} loading={loading} error={error} />
        <PaymentBadges className="mt-10" />
        <Link to="/pricing" className="mt-6 inline-block font-body text-sm font-semibold text-[#7c3aed] hover:underline">
          Compare plans feature by feature →
        </Link>
      </div>
    </section>
  );
}
