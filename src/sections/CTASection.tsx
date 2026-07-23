import { Link } from 'react-router';

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
        <Link
          to="/register"
          className="inline-flex items-center justify-center px-10 py-4 rounded-xl font-body font-semibold text-lg text-white bg-[#7c3aed] shadow-xl shadow-[#7c3aed]/25 hover:bg-[#6d28d9] hover:shadow-2xl hover:shadow-[#7c3aed]/30 hover:-translate-y-1 active:translate-y-0 transition-all duration-200"
        >
          Start Free Trial
        </Link>
      </div>
    </section>
  );
}