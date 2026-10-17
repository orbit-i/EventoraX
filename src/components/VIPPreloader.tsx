import React from 'react';

interface VIPPreloaderProps {
  statusText?: string;
  className?: string;
  isFullScreen?: boolean;
}

export const VIPPreloader: React.FC<VIPPreloaderProps> = ({
  statusText = 'Loading Eventrye VIP Cloud...',
  className = '',
  isFullScreen = true
}) => {
  return (
    <div
      className={`flex flex-col items-center justify-center bg-radial from-[#0d152b] to-[#060913] text-white select-none ${
        isFullScreen ? 'fixed inset-0 z-50' : 'w-full py-16'
      } ${className}`}
    >
      {/* Ambient Glow */}
      <div className="absolute w-72 h-72 rounded-full bg-blue-600/20 blur-3xl pointer-events-none animate-pulse" />

      {/* Rotating Ring & Logo */}
      <div className="relative w-24 h-24 flex items-center justify-center mb-6">
        <div className="absolute -inset-1.5 rounded-[28px] bg-gradient-to-tr from-blue-600 via-sky-400 to-purple-600 animate-spin opacity-80 blur-xs" style={{ animationDuration: '4s' }} />
        <div className="relative w-24 h-24 rounded-3xl bg-[#090e1a] border border-white/10 flex items-center justify-center shadow-2xl shadow-blue-900/40 overflow-hidden">
          <img
            src="/logo.png"
            alt="Eventrye"
            className="w-16 h-16 object-contain filter drop-shadow-[0_0_12px_rgba(56,189,248,0.5)]"
          />
        </div>
      </div>

      {/* Brand Title */}
      <div className="flex items-baseline gap-0.5 text-2xl font-black tracking-tight mb-2 font-heading">
        <span className="text-white">Event</span>
        <span className="bg-gradient-to-r from-sky-400 to-indigo-400 bg-clip-text text-transparent">rye</span>
      </div>

      {/* VIP Badge */}
      <div className="flex items-center gap-2 mb-5">
        <span className="text-[10px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-amber-500/15 border border-amber-400/40 text-amber-200 shadow-xs">
          VIP PLATFORM
        </span>
        <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
          Enterprise Cloud
        </span>
      </div>

      {/* Animated Loading Bar */}
      <div className="w-56 h-1 rounded-full bg-white/10 overflow-hidden mb-3">
        <div className="h-full w-2/3 bg-gradient-to-r from-blue-500 via-sky-400 to-purple-500 rounded-full animate-[shimmer_1.5s_infinite_linear] shadow-sm shadow-blue-500/50" />
      </div>

      {/* Status */}
      <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest animate-pulse">
        {statusText}
      </p>
    </div>
  );
};

export default VIPPreloader;
