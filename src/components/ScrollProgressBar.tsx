import { useState, useEffect } from 'react';

export default function ScrollProgressBar() {
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const totalScroll = document.documentElement.scrollTop || document.body.scrollTop;
      const windowHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
      if (windowHeight > 0) {
        const scrolled = (totalScroll / windowHeight) * 100;
        setScrollProgress(Math.min(100, Math.max(0, scrolled)));
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  if (scrollProgress <= 0) return null;

  return (
    <div 
      className="fixed top-0 left-0 w-full h-[3px] z-[999] pointer-events-none no-print"
      role="progressbar"
      aria-valuenow={Math.round(scrollProgress)}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label="Page reading and scroll progress"
    >
      <div 
        className="h-full bg-gradient-to-r from-blue-600 via-indigo-600 to-sky-400 transition-[width] duration-150 ease-out shadow-xs shadow-blue-500/50"
        style={{ width: `${scrollProgress}%` }}
      />
    </div>
  );
}
