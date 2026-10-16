import React from 'react';
import { cn } from '@/lib/utils';

interface BrandLogoProps {
  className?: string;
  variant?: 'full' | 'compact' | 'icon' | 'badge';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  theme?: 'dark' | 'light' | 'auto';
  showTagline?: boolean;
}

export const BrandLogo: React.FC<BrandLogoProps> = ({
  className = '',
  variant = 'compact',
  size = 'md',
  theme = 'auto',
  showTagline = false
}) => {
  const sizeClasses = {
    sm: 'w-6 h-6 rounded-lg',
    md: 'w-8 h-8 rounded-xl',
    lg: 'w-10 h-10 rounded-2xl',
    xl: 'w-14 h-14 rounded-2xl'
  };

  const textSizes = {
    sm: 'text-base',
    md: 'text-lg',
    lg: 'text-2xl',
    xl: 'text-3xl'
  };

  // Official Brand App Icon
  const iconImg = (
    <img 
      src="/images/eventorax-app-icon.png" 
      alt="EventoraX Official Icon" 
      loading="eager"
      decoding="async"
      className={cn(
        "object-cover shrink-0 shadow-md shadow-blue-600/20 transition-transform duration-200 group-hover:scale-105",
        sizeClasses[size]
      )}
      onError={(e) => {
        // Fallback to logo.png or gradient if needed
        (e.target as HTMLImageElement).src = '/logo.png';
      }}
    />
  );

  // Icon Only
  if (variant === 'icon') {
    return (
      <div className={cn("inline-flex items-center justify-center select-none", className)}>
        {iconImg}
      </div>
    );
  }

  // Full Graphic Logo
  if (variant === 'full') {
    return (
      <div className={cn("flex flex-col items-start gap-1 select-none", className)}>
        <div className="flex items-center gap-3">
          {iconImg}
          <div className="flex flex-col">
            <span className={cn(
              "font-extrabold tracking-tight font-heading leading-tight",
              theme === 'dark' ? "text-white" : "text-[#0f172a]",
              textSizes[size]
            )}>
              Eventora<span className="text-[#2563eb]">X</span>
            </span>
            {showTagline && (
              <span className="text-[10px] tracking-[0.2em] font-bold text-[#64748b] uppercase">
                Plan • Manage • Experience
              </span>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Badge Variant
  if (variant === 'badge') {
    return (
      <div className={cn("inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50 border border-blue-200/80 shadow-xs", className)}>
        <img 
          src="/images/eventorax-app-icon.png" 
          alt="EX" 
          className="w-4 h-4 rounded-md object-cover"
        />
        <span className="text-xs font-bold tracking-tight text-[#1d4ed8]">
          Eventora<span className="text-[#2563eb]">X</span>
        </span>
      </div>
    );
  }

  // Compact Variant (Default Brand Component)
  const isDark = theme === 'dark';

  return (
    <div className={cn("flex items-center gap-2.5 select-none group", className)}>
      {iconImg}

      {/* Brand Text & Tagline */}
      <div className="flex flex-col">
        <div className="flex items-baseline">
          <span className={cn(
            "font-extrabold tracking-tight font-heading leading-tight",
            isDark ? "text-white" : "text-[#0f172a]",
            textSizes[size]
          )}>
            Eventora
            <span className="bg-gradient-to-r from-[#2563eb] to-[#38bdf8] bg-clip-text text-transparent">
              X
            </span>
          </span>
        </div>
        {showTagline && (
          <span className="text-[9px] tracking-[0.2em] font-bold text-[#64748b] uppercase">
            Plan • Manage • Experience
          </span>
        )}
      </div>
    </div>
  );
};

export default BrandLogo;
