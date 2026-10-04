import { Link } from 'react-router';
import { Button } from '@/components/ui/button';

export default function CTASection() {
  return (
    <section
      className="py-20 md:py-28 text-center relative overflow-hidden"
      style={{
        background: 'radial-gradient(ellipse 80% 60% at 50% 50%, #ede9fe 0%, #ddd6fe 100%)',
      }}
    >
      {/* Decorative circles */}
      <div className="absolute top-0 left-0 w-72 h-72 bg-[#7c3aed]/10 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-[#a78bfa]/10 rounded-full blur-3xl translate-x-1/3 translate-y-1/3" />

      <div className="content-max relative z-10">
        <h2 className="font-heading text-3xl md:text-5xl font-bold mb-4 tracking-[-0.02em] text-[#0f172a]">
          Ready to create your next great event?
        </h2>
        <p className="font-body text-base md:text-lg mb-8 text-[#475569]">
          Join thousands of organizers who trust EventoraX.
        </p>
                <Button asChild variant="default" size="lg">
          <Link to="/register">Start Free Trial</Link>
        </Button>

      </div>
    </section>
  );
}