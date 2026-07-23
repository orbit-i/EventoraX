import { useEffect, useRef, useState } from 'react';

interface StatItemProps {
  value: number;
  suffix: string;
  label: string;
  prefix?: string;
}

function StatItem({ value, suffix, label, prefix = '' }: StatItemProps) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const hasAnimated = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimated.current) {
          hasAnimated.current = true;
          const duration = 1500;
          const startTime = performance.now();

          const animate = (currentTime: number) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            setCount(Math.floor(eased * value));

            if (progress < 1) {
              requestAnimationFrame(animate);
            }
          };
          requestAnimationFrame(animate);
        }
      },
      { threshold: 0.5 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [value]);

  return (
    <div ref={ref} className="text-center bg-white rounded-2xl p-6 md:p-8 border border-[#e9e4ff] shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300">
      <div className="font-heading text-4xl md:text-5xl font-bold bg-gradient-to-r from-[#7c3aed] to-[#a78bfa] bg-clip-text text-transparent">
        {prefix}
        {count.toLocaleString()}
        {suffix}
      </div>
      <p className="font-body text-sm mt-3 text-[#64748b] font-medium">
        {label}
      </p>
    </div>
  );
}

const stats = [
  { value: 5200, suffix: '+', label: 'Events Hosted' },
  { value: 180000, suffix: '+', label: 'Certificates Issued' },
  { value: 350, suffix: '+', label: 'Organizations' },
  { value: 99.9, suffix: '%', label: 'Uptime' },
];

export default function StatsSection() {
  return (
    <section className="bg-[#f3f0ff] py-14 md:py-20">
      <div className="content-max">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
          {stats.map((stat, i) => (
            <StatItem key={i} {...stat} />
          ))}
        </div>
      </div>
    </section>
  );
}