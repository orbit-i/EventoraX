import { Link } from 'react-router-dom';
import { Cookie, ShieldCheck } from 'lucide-react';

export default function Cookies() {
  return (
    <main className="pt-14">
      <section className="bg-[#f3f0ff] py-20 md:py-28">
        <div className="content-max max-w-4xl mx-auto">
          <div className="flex items-center gap-2 mb-4">
            <span className="font-body text-xs uppercase tracking-[0.1em] px-2.5 py-1 rounded-full bg-[#7c3aed]/10 text-[#7c3aed] font-bold">
              Compliance & Privacy
            </span>
          </div>
          <h1 className="font-heading text-4xl md:text-5xl font-black tracking-[-0.02em] mb-4 text-[#0f172a]">
            Cookie Policy
          </h1>
          <p className="text-sm text-[#64748b] mb-8">
            Transparent disclosure of how EventoraX uses cookies and browser storage to deliver multi-tenant event management services.
          </p>

          <div className="bg-white rounded-3xl p-8 md:p-12 border border-[#e9e4ff] shadow-xl shadow-[#7c3aed]/5 space-y-8">
            <div className="text-xs text-[#94a3b8] font-medium border-b border-[#f1f5f9] pb-4">
              Effective Date: January 1, 2026 • Governed by ORBIT-I Private Limited
            </div>

            <section className="space-y-3">
              <h2 className="text-lg font-bold text-[#0f172a] flex items-center gap-2">
                <Cookie className="w-5 h-5 text-[#7c3aed]" />
                1. What Are Cookies and Local Storage?
              </h2>
              <p className="text-sm text-[#475569] leading-relaxed">
                Cookies and browser local storage are small data files placed on your device when you visit websites. They enable EventoraX to remember your session, workspace credentials, tenant preferences, and keep you securely logged into your organizer dashboard without asking for credentials on every page visit.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-lg font-bold text-[#0f172a]">2. Categories of Cookies We Use</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                <div className="p-4 rounded-2xl bg-[#faf8ff] border border-[#e9e4ff] space-y-1.5">
                  <span className="text-xs font-bold text-[#7c3aed] uppercase tracking-wider">Strictly Essential</span>
                  <h3 className="text-sm font-bold text-[#0f172a]">Authentication & Tenant Session</h3>
                  <p className="text-xs text-[#64748b]">
                    JWT tokens and isolated tenant identifiers required to authorize dashboard access and prevent cross-tenant privilege leaks.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-[#faf8ff] border border-[#e9e4ff] space-y-1.5">
                  <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">Functional</span>
                  <h3 className="text-sm font-bold text-[#0f172a]">User Preferences & UI State</h3>
                  <p className="text-xs text-[#64748b]">
                    Remembers sidebar collapsed state, active canvas zoom in Design Studio, and active event filters.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-[#faf8ff] border border-[#e9e4ff] space-y-1.5">
                  <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider">Security</span>
                  <h3 className="text-sm font-bold text-[#0f172a]">CSRF & Rate Limiting Protection</h3>
                  <p className="text-xs text-[#64748b]">
                    Tokens that detect bot bursts, DDoS spikes, and replay attacks across public event registration endpoints.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-[#faf8ff] border border-[#e9e4ff] space-y-1.5">
                  <span className="text-xs font-bold text-amber-600 uppercase tracking-wider">Verification</span>
                  <h3 className="text-sm font-bold text-[#0f172a]">Cryptographic Cache</h3>
                  <p className="text-xs text-[#64748b]">
                    Caches public tamper-evident certificate checks temporarily for instantaneous offline-tolerant validation.
                  </p>
                </div>
              </div>
            </section>

            <section className="space-y-3">
              <h2 className="text-lg font-bold text-[#0f172a]">3. Third-Party Trackers & Advertising</h2>
              <p className="text-sm text-[#475569] leading-relaxed">
                EventoraX does NOT sell your data, nor do we run third-party cross-site advertising trackers (e.g. ad networks or brokers). All telemetry is strictly operational, anonymous, and maintained solely to uphold system reliability and 99.9% uptime.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-lg font-bold text-[#0f172a]">4. How to Manage Cookies</h2>
              <p className="text-sm text-[#475569] leading-relaxed">
                You can configure your browser to refuse all cookies or notify you when a cookie is sent. However, because authentication tokens are stored locally, blocking essential cookies will prevent you from logging into your organizer dashboard or generating live credentials.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-lg font-bold text-[#0f172a]">5. Questions & Data Protection Officer</h2>
              <p className="text-sm text-[#475569] leading-relaxed">
                If you have inquiries regarding our cookie architecture or data processing practices, please contact our compliance desk at{' '}
                <a href="mailto:eventorax@orbit-i.tech" className="text-[#7c3aed] font-semibold underline">
                  eventorax@orbit-i.tech
                </a>{' '}
                or reach our WhatsApp helpline at{' '}
                <a href="https://wa.me/923190375751" target="_blank" rel="noreferrer" className="text-emerald-600 font-semibold underline">
                  +92 3190375751
                </a>.
              </p>
            </section>

            <div className="pt-6 border-t border-[#f1f5f9] flex items-center justify-between">
              <span className="text-xs text-[#94a3b8]">
                &copy; 2026 EventoraX • Powered by ORBIT-I Private Limited
              </span>
              <Link to="/privacy" className="text-xs text-[#7c3aed] font-bold hover:underline flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" />
                Read Full Privacy Policy
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
