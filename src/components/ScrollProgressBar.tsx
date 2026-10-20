import { useEffect, useRef } from 'react';

export default function ScrollProgressBar() {
  const barRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let ticking = false;

    const updateProgress = () => {
      const totalScroll = document.documentElement.scrollTop || document.body.scrollTop;
      const windowHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
      if (windowHeight > 0 && barRef.current) {
        const scrolled = Math.min(1, Math.max(0, totalScroll / windowHeight));
        barRef.current.style.transform = `scaleX(${scrolled})`;
      }
      ticking = false;
    };

    const handleScroll = () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(updateProgress);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    updateProgress();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div 
      className="fixed top-0 left-0 w-full h-[3px] z-[999] pointer-events-none no-print origin-left"
      role="progressbar"
      aria-label="Page reading and scroll progress"
    >
      <div 
        ref={barRef}
        className="h-full w-full bg-gradient-to-r from-blue-600 via-indigo-600 to-sky-400 origin-left will-change-transform shadow-xs shadow-blue-500/50"
        style={{ transform: 'scaleX(0)' }}
      />
    </div>
  );
}
