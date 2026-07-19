import { useState, useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ChevronDown } from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

const faqs = [
  {
    q: 'Is there a free trial?',
    a: 'Yes! Start with our Starter plan — no credit card required. Upgrade anytime.',
  },
  {
    q: 'Can I white-label the platform?',
    a: 'Absolutely. Enterprise plans include full white-labeling with your brand.',
  },
  {
    q: 'How does certificate verification work?',
    a: 'Each certificate has a unique verification code. Anyone can verify authenticity instantly.',
  },
  {
    q: 'Is my data secure?',
    a: 'We use enterprise-grade encryption and full tenant isolation. Your data is never shared.',
  },
  {
    q: 'Can I import attendee lists?',
    a: 'Yes — import via CSV, Excel, or connect your CRM directly.',
  },
];

function TextReveal3D({ text }: { text: string }) {
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

    return () => { tl.kill(); };
  }, []);

  return (
    <div ref={containerRef} className="perspective-text">
      {text.split('').map((char, i) => {
        const group = i % 2 === 0 ? 0 : 1;
        const displayChar = char.trim() === '' ? '\u00A0' : char;
        return (
          <span
            key={i}
            className="char-3d inline-block preserve-3d"
            data-group={group}
          >
            {displayChar}
          </span>
        );
      })}
    </div>
  );
}

function FAQItem({ question, answer, isOpen, onToggle }: {
  question: string;
  answer: string;
  isOpen: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="bg-white rounded-xl border border-[#e9e4ff] shadow-sm hover:shadow-md transition-all duration-200 mb-3 overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-5 md:p-6 text-left group"
      >
        <span className="font-body text-base md:text-lg font-semibold pr-4 text-[#0f172a] group-hover:text-[#7c3aed] transition-colors duration-200">
          {question}
        </span>
        <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-[#f5f3ff] flex items-center justify-center group-hover:bg-[#ede9fe] transition-colors duration-200">
          <ChevronDown
            size={18}
            className="text-[#7c3aed] transition-transform duration-300"
            style={{
              transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
            }}
          />
        </div>
      </button>
      <div
        className="overflow-hidden transition-all duration-300 ease-out"
        style={{
          maxHeight: isOpen ? 200 : 0,
          opacity: isOpen ? 1 : 0,
        }}
      >
        <p className="font-body text-sm md:text-base pb-5 md:pb-6 px-5 md:px-6 text-[#475569] leading-relaxed">
          {answer}
        </p>
      </div>
    </div>
  );
}

export default function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <section className="bg-[#f3f0ff] section-padding">
      <div className="content-max">
        <p className="font-body text-sm uppercase tracking-[0.1em] mb-4 text-center text-[#7c3aed] font-semibold">
          FAQ
        </p>

        {/* 3D Text Reveal */}
        <div className="text-center mb-12 md:mb-16">
          <div className="font-heading font-bold leading-[1.1] tracking-[-0.02em] text-[#0f172a]" style={{ fontSize: 'clamp(3rem, 10vw, 6rem)' }}>
            <TextReveal3D text="Got" />
          </div>
          <div className="font-heading font-bold leading-[1.1] tracking-[-0.02em] text-[#0f172a]" style={{ fontSize: 'clamp(3rem, 10vw, 6rem)' }}>
            <TextReveal3D text="questions?" />
          </div>
        </div>

        {/* Accordion */}
        <div className="max-w-[800px] mx-auto">
          {faqs.map((faq, i) => (
            <FAQItem
              key={i}
              question={faq.q}
              answer={faq.a}
              isOpen={openIndex === i}
              onToggle={() => setOpenIndex(openIndex === i ? null : i)}
            />
          ))}
        </div>
      </div>
    </section>
  );
}