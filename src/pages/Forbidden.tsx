import { Link } from 'react-router-dom';
import { ShieldAlert, Home, LogIn, MessageCircle, Lock, ArrowLeft } from 'lucide-react';
import BrandLogo from '@/components/BrandLogo';

export default function Forbidden() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-b from-slate-900 via-[#0f172a] to-slate-950 px-4 py-16 text-white relative overflow-hidden">
      {/* Background Glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-red-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-md w-full text-center relative z-10">
        <div className="mb-6 flex justify-center">
          <BrandLogo variant="full" size="lg" theme="dark" />
        </div>

        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-bold mb-4">
          <ShieldAlert className="w-3.5 h-3.5" />
          HTTP 403 • Access Restricted
        </div>

        <h1 className="font-heading text-6xl sm:text-7xl font-extrabold mb-2 tracking-tight bg-gradient-to-r from-red-500 via-rose-400 to-amber-400 bg-clip-text text-transparent">
          403
        </h1>
        
        <h2 className="font-heading text-xl sm:text-2xl font-bold mb-3 text-slate-100">
          Access Forbidden / Unauthorized Area
        </h2>
        
        <p className="font-body text-xs sm:text-sm text-slate-400 leading-relaxed mb-8">
          You do not have permission to access this secure resource. Your account role or IP address lacks clearance for this workspace partition or SuperAdmin gateway.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
          <Link
            to="/"
            className="flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-lg shadow-blue-600/25 transition-all"
          >
            <Home className="w-4 h-4" />
            Home Portal
          </Link>
          <Link
            to="/login"
            className="flex items-center justify-center gap-2 px-4 py-3 bg-white/10 hover:bg-white/15 text-white font-bold text-xs rounded-xl border border-white/20 transition-all"
          >
            <LogIn className="w-4 h-4" />
            Sign in as Authorized Role
          </Link>
        </div>

        <div className="p-4 rounded-2xl bg-white/5 border border-white/10 text-left text-xs text-slate-300 space-y-1.5 mb-6">
          <div className="flex items-center gap-2 font-bold text-slate-200">
            <Lock className="w-4 h-4 text-amber-400 shrink-0" />
            State Bank SBP 2026 Security Sentinel Active
          </div>
          <p className="text-[11px] text-slate-400">
            If you are an authorized administrator, verify your session token or sign in with your elevated credentials via the Platform Master Gateway.
          </p>
        </div>

        <div className="pt-6 border-t border-white/10 flex flex-wrap items-center justify-center gap-3 text-xs text-slate-400">
          <Link to="/" className="inline-flex items-center gap-1.5 text-blue-400 hover:underline font-bold">
            <ArrowLeft className="w-3.5 h-3.5" /> Back Home
          </Link>
          <span>•</span>
          <a
            href="https://wa.me/923190375751"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 text-emerald-400 hover:underline font-bold"
          >
            <MessageCircle className="w-3.5 h-3.5" /> Support (+92 3190375751)
          </a>
        </div>
      </div>
    </main>
  );
}
