import { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Phone, Mail, Send, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function FloatingContactButton() {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  return (
    <div ref={menuRef} className="fixed bottom-6 left-6 z-40 no-print font-body">
      {/* Contact Options Popover */}
      {open && (
        <div className="mb-3 w-72 sm:w-80 bg-white/98 backdrop-blur-2xl rounded-3xl border border-slate-200/90 shadow-2xl shadow-slate-900/15 p-4 animate-in slide-in-from-bottom-3 fade-in duration-200">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h4 className="text-sm font-bold text-slate-900 font-heading">EventoraX Support</h4>
              <p className="text-[11px] text-slate-500">Official assistance active 24/7</p>
            </div>
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold border border-emerald-200">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Online
            </div>
          </div>

          <div className="flex flex-col gap-2 mt-3">
            {/* WhatsApp */}
            <a
              href="https://wa.me/923190375751"
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setOpen(false)}
              className="flex items-center justify-between p-2.5 rounded-2xl bg-emerald-50/80 hover:bg-emerald-100/90 text-emerald-950 border border-emerald-200/70 transition-all group"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-xs">
                  <MessageCircle className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900">WhatsApp Chat</div>
                  <div className="text-[11px] text-emerald-800 font-medium">+92 3190375751</div>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-emerald-600 group-hover:translate-x-0.5 transition-transform" />
            </a>

            {/* Direct Phone Call */}
            <a
              href="tel:+923190375751"
              onClick={() => setOpen(false)}
              className="flex items-center justify-between p-2.5 rounded-2xl bg-slate-50 hover:bg-blue-50/80 text-slate-800 border border-slate-200/80 hover:border-blue-200 transition-all group"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                  <Phone className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900">Direct Phone Line</div>
                  <div className="text-[11px] text-slate-500">+92 3190375751</div>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
            </a>

            {/* Email */}
            <a
              href="mailto:eventorax@orbit-i.tech"
              onClick={() => setOpen(false)}
              className="flex items-center justify-between p-2.5 rounded-2xl bg-slate-50 hover:bg-indigo-50/80 text-slate-800 border border-slate-200/80 hover:border-indigo-200 transition-all group"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                  <Mail className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900">Official Email</div>
                  <div className="text-[11px] text-slate-500">eventorax@orbit-i.tech</div>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
            </a>

            {/* In-app Contact page */}
            <Link
              to="/contact"
              onClick={() => setOpen(false)}
              className="flex items-center justify-between p-2.5 rounded-2xl bg-purple-50 hover:bg-purple-100 text-purple-950 border border-purple-200 transition-all group"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-purple-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                  <Send className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900">Send Inquiry Form</div>
                  <div className="text-[11px] text-purple-800">Customized deployment &amp; quotes</div>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-purple-600 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>
        </div>
      )}

      {/* Main Floating Trigger Button */}
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-label={open ? 'Close support options' : 'Open instant support options'}
        aria-expanded={open}
        className="flex items-center gap-2.5 px-4 py-3 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold text-xs shadow-xl shadow-blue-600/30 hover:shadow-2xl hover:shadow-blue-600/40 hover:scale-105 active:scale-95 transition-all duration-200 group cursor-pointer border border-white/20"
      >
        <span className="relative flex h-2.5 w-2.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-400" />
        </span>
        {open ? (
          <>
            <span>Close</span>
            <X className="w-4 h-4" />
          </>
        ) : (
          <>
            <MessageCircle className="w-4 h-4" />
            <span className="hidden sm:inline">Need Help? Chat 24/7</span>
            <span className="sm:hidden">Help</span>
          </>
        )}
      </button>
    </div>
  );
}
