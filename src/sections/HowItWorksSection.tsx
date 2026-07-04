import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { CalendarPlus, Users, Award } from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

const steps = [
  {
    icon: CalendarPlus,
    title: '1. Create',
    desc: 'Set up your event in minutes with customizable forms, ticketing, and scheduling.',
  },
  {
    icon: Users,
    title: '2. Manage',
    desc: 'Track registrations, send reminders, and manage attendance — all in one place.',
  },
  {
    icon: Award,
    title: '3. Deliver',
    desc: 'Generate certificates, ID cards, and QR tickets automatically.',
  },
];

function TextReveal3D({ text, className = '', style }: { text: string; className?: string; style?: React.CSSProperties }) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

    const chars = el.querySelectorAll('.char-3d');

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: el,
        start: 'top 75%',
        toggleActions: 'play none none none',
      },
    });

    chars.forEach((char, i) => {
      const group = parseInt((char as HTMLElement).dataset.group || '0');
      const rotationY = group === 0 ? -70 : 70;
      tl.from(
        char,
        {
          opacity: 0,
          rotateY: rotationY,
          duration: 0.6,
          ease: 'back.out(1.5)',
        },
        i * 0.02
      );
    });

    return () => {
      tl.kill();
    };
  }, []);

  const words = text.split(' ');
  let charIndex = 0;

  return (
    <div ref={containerRef} className={`perspective-text ${className}`} style={style}>
      {words.map((word, wi) => (
        <span key={wi} style={{ display: 'inline-block', whiteSpace: 'pre' }}>
          {word.split('').map((char) => {
            const group = charIndex % 2 === 0 ? 0 : 1;
            const isWhitespace = char.trim() === '';
            const displayChar = isWhitespace ? '\u00A0' : char;
            charIndex++;
            return (
              <span
                key={charIndex}
                className="char-3d inline-block preserve-3d"
                data-group={group}
              >
                {displayChar}
              </span>
            );
          })}
          {wi < words.length - 1 && (
            <span className="char-3d inline-block preserve-3d" data-group={charIndex % 2 === 0 ? 0 : 1}>
              {'\u00A0'}
            </span>
          )}
          {(() => { charIndex++; return null; })()}
        </span>
      ))}
    </div>
  );
}

export default function HowItWorksSection() {
  return (
    <section className="bg-white section-padding text-center">
      <div className="content-max">
        <p className="font-body text-sm uppercase tracking-[0.1em] mb-4" style={{ color: '#A0B4CC' }}>
          How It Works
        </p>

        {/* 3D Text Reveal */}
        <div className="space-y-1 mb-16">
          <TextReveal3D
            text="Create your event."
            className="font-heading font-medium leading-[1.1] tracking-[-0.02em]"
            style={{ color: '#1B2A4A', fontSize: 'clamp(2rem, 8vw, 4rem)' }}
          />
          <TextReveal3D
            text="Register attendees."
            className="font-heading font-medium leading-[1.1] tracking-[-0.02em]"
            style={{ color: '#1B2A4A', fontSize: 'clamp(2rem, 8vw, 4rem)' }}
          />
          <TextReveal3D
            text="Issue certificates."
            className="font-heading font-medium leading-[1.1] tracking-[-0.02em]"
            style={{ color: '#1B2A4A', fontSize: 'clamp(2rem, 8vw, 4rem)' }}
          />
        </div>

        {/* Steps */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {steps.map((step, i) => {
            const Icon = step.icon;
            return (
              <div
                key={i}
                className="scroll-reveal bg-[#F5FAFF] rounded-3xl p-8 md:p-10 text-left transition-all duration-300 hover:-translate-y-1"
                style={{ transitionDelay: `${i * 100}ms` }}
              >
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center mb-5"
                  style={{ backgroundColor: '#CCE5FF', color: '#4A9CFF' }}
                >
                  <Icon size={24} />
                </div>
                <h3 className="font-heading text-2xl font-medium mb-3" style={{ color: '#1B2A4A' }}>
                  {step.title}
                </h3>
                <p className="font-body text-base" style={{ color: '#A0B4CC' }}>
                  {step.desc}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
