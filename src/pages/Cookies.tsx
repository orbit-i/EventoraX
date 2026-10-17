import { Link } from 'react-router-dom';
import { Cookie, ShieldCheck, Calendar, Mail, Phone, MessageCircle } from 'lucide-react';

export default function Cookies() {
  const currentYear = new Date().getFullYear();

  return (
    <main className="font-body">
      <section className="bg-gradient-to-b from-blue-50/60 to-white py-14 md:py-20">
        <div className="content-max max-w-4xl mx-auto px-4">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-bold border border-blue-200 mb-3">
            <Cookie className="w-3.5 h-3.5 text-blue-600" />
            Compliance &amp; Cookies
          </div>
          <h1 className="font-heading text-3xl sm:text-4xl md:text-5xl font-black tracking-tight mb-4 text-[#0f172a]">
            Cookie &amp; Local Storage Policy
          </h1>
          
          {/* Last updated badge */}
          <div className="flex items-center gap-2 text-xs text-slate-500 mb-8">
            <Calendar className="w-4 h-4 text-blue-600" />
            <span>Last updated &amp; effective: <strong>October 2026</strong> • Governed by ORBIT-I Private Limited</span>
          </div>

          <div className="bg-white rounded-3xl p-6 sm:p-10 border border-slate-200 shadow-xl shadow-slate-900/5 space-y-8">
            <section className="space-y-3">
              <h2 className="text-lg font-bold text-[#0f172a] flex items-center gap-2">
                <Cookie className="w-5 h-5 text-blue-600" />
                1. What Are Cookies and Local Storage?
              </h2>
              <p className="text-sm text-[#475569] leading-relaxed">
                Cookies and browser local storage are small data files placed on your device when you visit websites. They enable Eventrye to remember your session, workspace credentials, tenant preferences, and keep you securely logged into your organizer dashboard without asking for credentials on every page visit.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-lg font-bold text-[#0f172a]">2. Categories of Cookies We Use</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1.5">
                  <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">Strictly Essential</span>
                  <h3 className="text-sm font-bold text-[#0f172a]">Authentication &amp; Tenant Session</h3>
                  <p className="text-xs text-[#64748b]">
                    JWT tokens and isolated tenant identifiers required to authorize dashboard access and prevent cross-tenant privilege leaks.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1.5">
                  <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider">Functional</span>
                  <h3 className="text-sm font-bold text-[#0f172a]">User Preferences &amp; UI State</h3>
                  <p className="text-xs text-[#64748b]">
                    Remembers sidebar collapsed state, active canvas zoom in Design Studio, and active event filters.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1.5">
                  <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider">Security</span>
                  <h3 className="text-sm font-bold text-[#0f172a]">CSRF &amp; Rate Limiting Protection</h3>
                  <p className="text-xs text-[#64748b]">
                    Tokens that detect bot bursts, DDoS spikes, and replay attacks across public event registration endpoints.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1.5">
                  <span className="text-xs font-bold text-amber-600 uppercase tracking-wider">Verification</span>
                  <h3 className="text-sm font-bold text-[#0f172a]">Cryptographic Cache</h3>
                  <p className="text-xs text-[#64748b]">
                    Caches public tamper-evident certificate checks temporarily for instantaneous offline-tolerant validation.
                  </p>
                </div>
              </div>
            </section>

            <section className="space-y-3">
              <h2 className="text-lg font-bold text-[#0f172a]">3. Third-Party Trackers &amp; Advertising</h2>
              <p className="text-sm text-[#475569] leading-relaxed">
                Eventrye does NOT sell your data, nor do we run predatory cross-site tracking scripts. Telemetry is strictly operational, anonymous, and maintained solely to uphold system reliability and 99.9% uptime.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-lg font-bold text-[#0f172a]">4. How to Manage Cookies</h2>
              <p className="text-sm text-[#475569] leading-relaxed">
                You can configure your browser to refuse all cookies or notify you when a cookie is sent. However, because authentication tokens are stored locally, blocking essential cookies will prevent you from logging into your organizer dashboard or generating live credentials.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-lg font-bold text-[#0f172a]">5. Questions &amp; Data Protection Desk</h2>
              <p className="text-sm text-[#475569] leading-relaxed">
                If you have inquiries regarding our cookie architecture or data processing practices, please contact our compliance desk:
              </p>
              <div className="flex flex-wrap gap-4 text-sm font-semibold pt-2">
                <a href="mailto:eventrye@orbit-i.tech" className="inline-flex items-center gap-1.5 text-blue-600 hover:underline">
                  <Mail className="w-4 h-4" />
                  <span>eventrye@orbit-i.tech</span>
                </a>
                <a href="tel:+923190375751" className="inline-flex items-center gap-1.5 text-emerald-600 hover:underline">
                  <Phone className="w-4 h-4" />
                  <span>+92 3190375751</span>
                </a>
                <a href="https://wa.me/923190375751" target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-emerald-600 hover:underline">
                  <MessageCircle className="w-4 h-4" />
                  <span>WhatsApp Support</span>
                </a>
              </div>
            </section>

            <div className="pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
              <span className="text-xs text-slate-500">
                &copy; {currentYear} Eventrye • Powered by ORBIT-I Private Limited
              </span>
              <Link to="/privacy" className="text-xs text-blue-600 font-bold hover:underline flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" />
                Read Full Privacy Policy
              </Link>
            </div>
          </div>

          <div className="mt-8 text-center">
            <Link to="/" className="font-body text-sm font-semibold text-blue-600 hover:underline">
              &larr; Back to Home
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
