import { useEffect, useRef, useState } from 'react';

interface StatItemProps {
  value: number;
  suffix: string;
  label: string;
  color: string;
  prefix?: string;
}

function StatItem({ value, suffix, label, color, prefix = '' }: StatItemProps) {
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
    <div ref={ref} className="text-center">
      <div
        className="font-heading text-4xl md:text-5xl font-normal"
        style={{ color }}
      >
        {prefix}
        {count.toLocaleString()}
        {suffix}
      </div>
      <p className="font-body text-sm mt-2" style={{ color: '#A0B4CC' }}>
        {label}
      </p>
    </div>
  );
}

const stats = [
  { value: 5200, suffix: '+', label: 'Events Hosted', color: '#FF9EAA' },
  { value: 180000, suffix: '+', label: 'Certificates Issued', color: '#4A9CFF' },
  { value: 350, suffix: '+', label: 'Organizations', color: '#4A9CFF' },
  { value: 99.9, suffix: '%', label: 'Uptime', color: '#2A8B6F', prefix: '' },
];

export default function StatsSection() {
  return (
    <section className="bg-[#F5FAFF] py-14 md:py-16">
      <div className="content-max">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-6">
          {stats.map((stat, i) => (
            <StatItem key={i} {...stat} />
          ))}
        </div>
      </div>
    </section>
  );
}
