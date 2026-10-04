import { Link } from 'react-router';
import { ChevronDown } from 'lucide-react';
import OceanCanvas from '../components/OceanCanvas';
import { Button } from "@/components/ui/button";

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
  className="absolute inset-0 flex flex-col items-center justify-center text-center px-4 pt-24"
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
      <Button size="lg" asChild className="mt-8">
        <Link to="/register">Start Free Trial</Link>
      </Button>

      {/* Scroll Indicator */}
      <div className="flex flex-col items-center gap-1 mt-6 animate-float text-[#94a3b8]">
        <span className="font-body text-xs tracking-wider font-medium">Scroll</span>
        <ChevronDown size={20} />
      </div>
      </div>

    </section>
  );
}