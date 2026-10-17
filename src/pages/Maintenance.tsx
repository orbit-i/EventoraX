import { Link } from 'react-router-dom';
import { Hammer, Clock, MessageCircle, Mail, ArrowLeft, ShieldCheck, CheckCircle } from 'lucide-react';
import BrandLogo from '@/components/BrandLogo';

export default function Maintenance() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-[#f8fafc] via-[#eff6ff] to-[#e0e7ff] flex flex-col justify-between py-12 px-4 sm:px-6">
      {/* Top Header */}
      <div className="max-w-4xl mx-auto w-full flex items-center justify-between">
        <Link to="/">
          <BrandLogo variant="compact" size="md" showTagline={false} />
        </Link>
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">
          <Clock className="w-3.5 h-3.5" />
          Scheduled Upgrade Window
        </span>
      </div>

      {/* Main Card */}
      <div className="max-w-2xl mx-auto w-full my-auto text-center py-8">
        <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-[#1d4ed8] to-[#3b82f6] text-white flex items-center justify-center mx-auto mb-6 shadow-xl shadow-blue-500/20 animate-bounce duration-1000">
          <Hammer className="w-10 h-10" />
        </div>

        <h1 className="text-3xl sm:text-5xl font-extrabold text-[#0f172a] tracking-tight mb-4 font-heading">
          System Maintenance &amp; Upgrades
        </h1>

        <p className="text-base sm:text-lg text-[#475569] max-w-xl mx-auto leading-relaxed mb-8">
          Eventrye engine is currently undergoing performance optimizations, database indexing, and 24/7 security hardening to ensure maximum reliability for your events.
        </p>

        {/* Live Status Indicators */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-lg mx-auto mb-10 text-left">
          <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs">
            <span className="text-[11px] font-bold text-slate-500 block mb-1">Public Verification</span>
            <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-600">
              <CheckCircle className="w-3.5 h-3.5" />
              100% Operational
            </div>
          </div>
          <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs">
            <span className="text-[11px] font-bold text-slate-500 block mb-1">Digital ID Badges</span>
            <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-600">
              <CheckCircle className="w-3.5 h-3.5" />
              High Availability
            </div>
          </div>
          <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs">
            <span className="text-[11px] font-bold text-slate-500 block mb-1">Est. Completion</span>
            <div className="flex items-center gap-1.5 text-xs font-bold text-blue-600">
              <Clock className="w-3.5 h-3.5" />
              Under 15 Minutes
            </div>
          </div>
        </div>

        {/* Urgent Contact Bar */}
        <div className="bg-white/80 backdrop-blur-md rounded-2xl p-6 border border-slate-200 shadow-sm max-w-lg mx-auto mb-8">
          <h3 className="text-sm font-bold text-slate-900 mb-2">Need Immediate Event Assistance?</h3>
          <p className="text-xs text-slate-500 mb-4">Our dedicated event support engineers are available on WhatsApp and email 24/7.</p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <a
              href="https://wa.me/923190375751"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#25D366] hover:bg-[#128C7E] text-white text-xs font-bold shadow-md transition-colors"
            >
              <MessageCircle className="w-4 h-4" />
              WhatsApp Support (+92 3190375751)
            </a>
            <a
              href="mailto:eventrye@orbit-i.tech"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-md transition-colors"
            >
              <Mail className="w-4 h-4" />
              eventrye@orbit-i.tech
            </a>
          </div>
        </div>

        <div>
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-xs font-bold text-[#1d4ed8] hover:underline"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Eventrye Homepage
          </Link>
        </div>
      </div>

      {/* Footer */}
      <div className="max-w-4xl mx-auto w-full text-center text-xs text-slate-400 border-t border-slate-200 pt-4 flex flex-col sm:flex-row items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 text-slate-500 font-medium">
          <ShieldCheck className="w-4 h-4 text-[#1d4ed8]" />
          Protected by ORBIT-I 24/7 Monitoring Engine
        </div>
        <div>
          Direct Line: <a href="tel:+923190375751" className="text-slate-600 font-bold hover:underline">+92 3190375751</a>
        </div>
      </div>
    </main>
  );
}
