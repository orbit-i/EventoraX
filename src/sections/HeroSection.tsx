import { Link } from 'react-router-dom';
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
          className="font-heading font-extrabold leading-[1.08] tracking-[-0.03em] text-[#0f172a]"
          style={{ fontSize: 'clamp(2.5rem, 6vw, 4.25rem)' }}
        >
          Plan • Manage • Experience
          <br />
          <span className="bg-gradient-to-r from-[#1d4ed8] via-[#2563eb] to-[#38bdf8] bg-clip-text text-transparent">
            Automated Certificate & Event SaaS
          </span>
        </h1>

        {/* Subtext */}
        <p
          className="font-body font-normal mt-5 max-w-[580px] mx-auto text-[#475569] text-lg sm:text-xl leading-relaxed"
        >
          Create world-class events and automate tamper-evident certificate issuance with visual canvas editing, bulk generation, and 1:1 email delivery.
        </p>

        {/* CTAs */}
        <div className="flex flex-wrap items-center justify-center gap-4 mt-8">
          <Link
            to="/register"
            className="inline-flex items-center justify-center px-8 py-3.5 bg-[#1d4ed8] text-white font-bold rounded-xl shadow-lg shadow-[#1d4ed8]/25 hover:bg-[#1e40af] hover:shadow-xl hover:shadow-[#1d4ed8]/35 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 text-sm sm:text-base"
          >
            Start 14-Day Free Trial
          </Link>
          <Link
            to="/verify"
            className="inline-flex items-center justify-center px-6 py-3.5 bg-white/90 backdrop-blur-md border-2 border-[#cbd5e1] hover:border-[#1d4ed8] text-[#1e40af] font-bold rounded-xl shadow-sm hover:bg-[#eff6ff] transition-all duration-200 text-sm sm:text-base"
          >
            Verify a Certificate
          </Link>
        </div>
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