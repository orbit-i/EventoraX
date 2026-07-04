import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

interface ScrollRevealProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  y?: number;
  duration?: number;
}

export default function ScrollReveal({
  children,
  className = '',
  delay = 0,
  y = 30,
  duration = 0.5,
}: ScrollRevealProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

    gsap.from(el, {
      scrollTrigger: {
        trigger: el,
        start: 'top 85%',
      },
      opacity: 0,
      y,
      duration,
      delay,
      ease: 'power1.out',
    });
  }, [delay, y, duration]);

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}
