import { Link } from 'react-router';
import { ChevronDown } from 'lucide-react';
import OceanCanvas from '../components/OceanCanvas';

export default function HeroSection() {
  return (
    <section
      className="relative w-full overflow-hidden"
      style={{ height: '100vh' }}
    >
      {/* Ocean Canvas Background */}
      <OceanCanvas />

      {/* Gradient Overlay for text readability */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          zIndex: 1,
          background:
            'radial-gradient(ellipse 70% 50% at 50% 50%, rgba(243,240,255,0.7) 0%, rgba(243,240,255,0) 100%)',
        }}
      />

      {/* Hero Content */}
      <div
        className="absolute inset-0 flex flex-col items-center justify-center text-center px-4"
        style={{ zIndex: 2 }}
      >
        {/* Badge */}
        <div
          className="inline-flex items-center gap-2 px-5 py-2 rounded-full text-sm font-semibold mb-6 bg-white/80 backdrop-blur-md border border-[#e9e4ff] shadow-sm text-[#7c3aed]"
        >
          <img
            src="/images/logo-orbit.png"
            alt="ORBIT-I"
            className="h-4 w-auto"
          />
          Proudly made by ORBIT-I
        </div>

        {/* Headline */}
        <h1
          className="font-heading font-bold leading-[1.1] tracking-[-0.02em] text-[#0f172a]"
          style={{ fontSize: 'clamp(2.5rem, 6vw, 4rem)' }}
        >
          Where
          <br />
          Every Moment
          <br />
          Becomes a Memory
        </h1>

        {/* Subtext */}
        <p
          className="font-body font-normal mt-6 max-w-[480px] mx-auto text-[#475569] text-xl leading-relaxed"
        >
          An event management platform for modern organizers. Built by ORBIT-I — turning ideas into impact.
        </p>

        {/* CTA */}
        <Link
          to="/register"
          className="inline-flex items-center justify-center px-8 py-3.5 bg-[#7c3aed] text-white font-semibold rounded-xl shadow-lg shadow-[#7c3aed]/25 hover:bg-[#6d28d9] hover:shadow-xl hover:shadow-[#7c3aed]/30 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 mt-8 text-base"
        >
          Start Free Trial
        </Link>
      </div>

      {/* Scroll Indicator */}
      <div
        className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 animate-float text-[#94a3b8]"
        style={{ zIndex: 2 }}
      >
        <span className="font-body text-xs tracking-wider font-medium">Scroll</span>
        <ChevronDown size={20} />
      </div>
    </section>
  );
}