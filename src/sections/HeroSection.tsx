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
            'radial-gradient(ellipse 70% 50% at 50% 50%, rgba(255,255,255,0.55) 0%, rgba(255,255,255,0) 100%)',
        }}
      />

      {/* Hero Content */}
      <div
        className="absolute inset-0 flex flex-col items-center justify-center text-center px-4"
        style={{ zIndex: 2 }}
      >
        {/* Badge */}
        <div
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm mb-6"
          style={{
            background: 'rgba(255,255,255,0.2)',
            backdropFilter: 'blur(16px)',
            border: '1px solid rgba(255,255,255,0.3)',
            color: '#1B2A4A',
          }}
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
          className="font-heading font-normal leading-[1.1] tracking-[-0.02em]"
          style={{ color: '#1B2A4A', fontSize: 'clamp(2.5rem, 6vw, 4rem)' }}
        >
          Where
          <br />
          Every Moment
          <br />
          Becomes a Memory
        </h1>

        {/* Subtext */}
        <p
          className="font-body font-light mt-6 max-w-[480px] mx-auto"
          style={{ color: '#1B2A4A', fontSize: '1.25rem' }}
        >
          An event management platform for modern organizers. Built by ORBIT-I —
          turning ideas into impact.
        </p>

        {/* CTA */}
        <Link
          to="/register"
          className="btn-primary mt-8 text-base"
        >
          Start Free Trial
        </Link>
      </div>

      {/* Scroll Indicator */}
      <div
        className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 animate-float"
        style={{ zIndex: 2, color: '#1B2A4A', opacity: 0.5 }}
      >
        <span className="font-body text-xs tracking-wider">Scroll</span>
        <ChevronDown size={20} />
      </div>
    </section>
  );
}
