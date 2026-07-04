import { Link } from 'react-router';

export default function CTASection() {
  return (
    <section
      className="py-20 md:py-28 text-center relative overflow-hidden"
      style={{
        background: 'radial-gradient(ellipse 80% 60% at 50% 50%, #CCE5FF 0%, #A8D4FF 100%)',
      }}
    >
      <div className="content-max relative z-10">
        <h2
          className="font-heading text-3xl md:text-5xl font-medium mb-4 tracking-[-0.02em]"
          style={{ color: '#1B2A4A' }}
        >
          Ready to create your next great event?
        </h2>
        <p
          className="font-body text-base md:text-lg mb-8"
          style={{ color: '#1B2A4A', opacity: 0.7 }}
        >
          Join thousands of organizers who trust EventoraX.
        </p>
        <Link
          to="/register"
          className="inline-flex items-center justify-center px-10 py-4 rounded-full font-body font-medium text-lg transition-all duration-200 hover:scale-[1.03]"
          style={{ backgroundColor: '#4A9CFF', color: '#FFFFFF' }}
        >
          Start Free Trial
        </Link>
      </div>
    </section>
  );
}
