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
    // ScrollReveal for all .scroll-reveal elements
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

    const reveals = document.querySelectorAll('.scroll-reveal');
    reveals.forEach((el) => {
      gsap.from(el, {
        scrollTrigger: {
          trigger: el,
          start: 'top 85%',
        },
        opacity: 0,
        y: 30,
        duration: 0.5,
        ease: 'power1.out',
      });
    });

    return () => {
      ScrollTrigger.getAll().forEach((st) => st.kill());
    };
  }, []);

  return (
    <main>
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
