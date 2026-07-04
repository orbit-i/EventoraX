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
    <div className="border-b" style={{ borderColor: '#E8F4FD' }}>
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between py-6 text-left group"
      >
        <span className="font-body text-lg font-medium pr-4" style={{ color: '#1B2A4A' }}>
          {question}
        </span>
        <ChevronDown
          size={20}
          className="flex-shrink-0 transition-transform duration-300"
          style={{
            color: '#A0B4CC',
            transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
          }}
        />
      </button>
      <div
        className="overflow-hidden transition-all duration-300"
        style={{
          maxHeight: isOpen ? 200 : 0,
          opacity: isOpen ? 1 : 0,
        }}
      >
        <p className="font-body text-base pb-6" style={{ color: '#A0B4CC' }}>
          {answer}
        </p>
      </div>
    </div>
  );
}

export default function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <section className="bg-[#F5FAFF] section-padding">
      <div className="content-max">
        <p className="font-body text-sm uppercase tracking-[0.1em] mb-4 text-center" style={{ color: '#A0B4CC' }}>
          FAQ
        </p>

        {/* 3D Text Reveal */}
        <div className="text-center mb-12 md:mb-16">
          <div className="font-heading font-medium leading-[1.1] tracking-[-0.02em]" style={{ color: '#1B2A4A', fontSize: 'clamp(3rem, 10vw, 6rem)' }}>
            <TextReveal3D text="Got" />
          </div>
          <div className="font-heading font-medium leading-[1.1] tracking-[-0.02em]" style={{ color: '#1B2A4A', fontSize: 'clamp(3rem, 10vw, 6rem)' }}>
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
