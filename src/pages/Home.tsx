import { useEffect } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import HeroSection from '@/components/home/HeroSection';
import TrustedBySection from '@/components/home/TrustedBySection';
import StatsSection from '@/components/home/StatsSection';
import HowItWorksSection from '@/components/home/HowItWorksSection';
import FeaturesSection from '@/components/home/FeaturesSection';
import PricingSection from '@/components/home/PricingSection';
import TestimonialsSection from '@/components/home/TestimonialsSection';
import FAQSection from '@/components/home/FAQSection';
import CTASection from '@/components/home/CTASection';
import { useApi } from '@/hooks/useApi';
import type { WebsiteContent } from '@/types/website';

gsap.registerPlugin(ScrollTrigger);

export default function Home() {
  const site = useApi<WebsiteContent>('/platform/website');
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
      <TrustedBySection logos={site.data?.logos ?? []} />
      <StatsSection stats={site.data?.stats ?? null} />
      <HowItWorksSection />
      <FeaturesSection />
      <PricingSection />
      <TestimonialsSection items={site.data?.testimonials ?? []} />
      <FAQSection />
      <CTASection />
    </main>
  );
}