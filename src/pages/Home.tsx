import { useEffect } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import HeroSection from '../sections/HeroSection';
import TrustedBySection from '../sections/TrustedBySection';
import StatsSection from '../sections/StatsSection';
import HowItWorksSection from '../sections/HowItWorksSection';
import FeaturesSection from '../sections/FeaturesSection';
import PricingSection from '../sections/PricingSection';
import TestimonialsSection from '../sections/TestimonialsSection';
import FAQSection from '../sections/FAQSection';
import CTASection from '../sections/CTASection';

gsap.registerPlugin(ScrollTrigger);

export default function Home() {
  useEffect(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

    const reveals = document.querySelectorAll('.scroll-reveal');
    reveals.forEach((el, index) => {
      gsap.from(el, {
        scrollTrigger: {
          trigger: el,
          start: 'top 85%',
        },
        opacity: 0,
        y: 40,
        duration: 0.6,
        ease: 'power2.out',
        delay: (index % 3) * 0.1,
      });
    });

    return () => {
      ScrollTrigger.getAll().forEach((st) => st.kill());
    };
  }, []);

  return (
    <main className="min-h-screen bg-gradient-to-b from-[#f5f3ff] via-[#faf8ff] to-[#f3f0ff]">
      <HeroSection />
      <TrustedBySection />
      <StatsSection />
      <HowItWorksSection />
      <FeaturesSection />
      <PricingSection />
      <TestimonialsSection />
      <FAQSection />
      <CTASection />
    </main>
  );
}