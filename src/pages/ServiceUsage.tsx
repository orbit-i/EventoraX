import { Link } from 'react-router-dom';
import { Server, ShieldCheck, Zap, AlertTriangle, CheckCircle2, Calendar, Mail, Phone, MessageCircle } from 'lucide-react';

export default function ServiceUsage() {
  const currentYear = new Date().getFullYear();

  return (
    <main className="font-body">
      <section className="bg-gradient-to-b from-blue-50/60 to-white py-14 md:py-20">
        <div className="content-max max-w-4xl mx-auto px-4">
          <div className="flex items-center gap-2 mb-3">
            <span className="font-body text-xs uppercase tracking-[0.1em] px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 font-bold border border-emerald-200 flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-emerald-600" />
              Infrastructure &amp; Operations
            </span>
          </div>
          <h1 className="font-heading text-3xl sm:text-4xl md:text-5xl font-black tracking-tight mb-4 text-[#0f172a]">
            Service Usage &amp; Fair Use Policy
          </h1>

          {/* Last updated badge */}
          <div className="flex items-center gap-2 text-xs text-slate-500 mb-8">
            <Calendar className="w-4 h-4 text-blue-600" />
            <span>Last updated &amp; effective: <strong>October 2026</strong> • Governed by ORBIT-I Private Limited</span>
          </div>

          <div className="bg-white rounded-3xl p-6 sm:p-10 border border-slate-200 shadow-xl shadow-slate-900/5 space-y-8">
            <div className="text-xs text-slate-500 font-medium border-b border-slate-100 pb-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
              <span>Production Infrastructure SLA: 99.9% Uptime Commitment</span>
              <span className="text-emerald-600 font-bold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> All Systems Operational
              </span>
            </div>

            <section className="space-y-3">
              <h2 className="text-lg font-bold text-[#0f172a] flex items-center gap-2">
                <Server className="w-5 h-5 text-blue-600" />
                1. High-Concurrency &amp; Multi-Million User Scaling
              </h2>
              <p className="text-sm text-[#475569] leading-relaxed">
                EventoraX utilizes an asynchronous event-driven core designed to handle high-traffic surges during peak ticketing, live seminars, and viral registrations. Automated micro-batching, in-memory rate token limiters, and optimized database connection pooling ensure zero downtime during sudden viral attendance spikes.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-lg font-bold text-[#0f172a]">2. Fair Use Limits per Subscription Tier</h2>
              <div className="overflow-x-auto rounded-2xl border border-slate-200 mt-2">
                <table className="w-full text-left text-xs min-w-[500px]">
                  <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200">
                    <tr>
                      <th className="p-3">Plan Tier</th>
                      <th className="p-3">Event Limit</th>
                      <th className="p-3">Attendee Registrations</th>
                      <th className="p-3">API Concurrency</th>
                      <th className="p-3">Branded Public Portal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-[#334155]">
                    <tr>
                      <td className="p-3 font-bold text-[#0f172a]">Starter</td>
                      <td className="p-3">Up to 10 Active</td>
                      <td className="p-3">500 total</td>
                      <td className="p-3">60 req/min</td>
                      <td className="p-3 text-emerald-600 font-semibold">Standard Portal</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-bold text-blue-600">Professional</td>
                      <td className="p-3">Up to 25 Active</td>
                      <td className="p-3">5,000 / month</td>
                      <td className="p-3">300 req/min</td>
                      <td className="p-3 text-emerald-600 font-semibold">Custom Branding + Colors</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-bold text-indigo-700">Enterprise</td>
                      <td className="p-3">500+ Active</td>
                      <td className="p-3">50,000+ / month</td>
                      <td className="p-3">1,200 req/min</td>
                      <td className="p-3 text-emerald-600 font-semibold">Full White-label &amp; Domain</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>

            <section className="space-y-3">
              <h2 className="text-lg font-bold text-[#0f172a] flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-600" />
                3. Cyber Security &amp; Attack Mitigation
              </h2>
              <p className="text-sm text-[#475569] leading-relaxed">
                EventoraX includes built-in protection against the top OWASP vulnerabilities:
              </p>
              <ul className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs text-[#475569] pt-1">
                <li className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
                  <strong className="text-slate-900 block mb-0.5">DDoS &amp; Traffic Floods</strong>
                  Automated IP token-bucket throttling sheds malicious spikes without affecting authentic ticket seekers.
                </li>
                <li className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
                  <strong className="text-slate-900 block mb-0.5">SQL Injection &amp; XSS</strong>
                  Parameterized queries, strict type parsing, and HTML escaping neutralize injection payloads.
                </li>
                <li className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
                  <strong className="text-slate-900 block mb-0.5">Tenant Isolation Enforcement</strong>
                  Cryptographic JWT validation guarantees no cross-tenant query leaks; client accounts cannot access superadmin panels.
                </li>
                <li className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
                  <strong className="text-slate-900 block mb-0.5">Tamper-Proof Verification</strong>
                  Every certificate and badge contains SHA-256 cryptographic signatures verified by ORBIT-I Private Limited.
                </li>
              </ul>
            </section>

            <section className="space-y-3">
              <h2 className="text-lg font-bold text-[#0f172a] flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-500" />
                4. Prohibited System Abuse
              </h2>
              <p className="text-sm text-[#475569] leading-relaxed">
                Attempting to scrape private attendee rosters, reverse-engineer encryption keys, bypass tenant authorization, or flood ticket reservations with automated bots will result in permanent workspace suspension and IP firewall quarantine.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-lg font-bold text-[#0f172a]">5. Service Level Agreement (SLA) &amp; Contacts</h2>
              <p className="text-sm text-[#475569] leading-relaxed">
                For paid Enterprise tiers, EventoraX commits to a 99.9% monthly uptime guarantee. For infrastructure questions or custom SLA agreements:
              </p>
              <div className="flex flex-wrap gap-4 text-sm font-semibold pt-2">
                <a href="mailto:eventorax@orbit-i.tech" className="inline-flex items-center gap-1.5 text-blue-600 hover:underline">
                  <Mail className="w-4 h-4" />
                  <span>eventorax@orbit-i.tech</span>
                </a>
                <a href="tel:+923190375751" className="inline-flex items-center gap-1.5 text-emerald-600 hover:underline">
                  <Phone className="w-4 h-4" />
                  <span>+92 3190375751</span>
                </a>
                <a href="https://wa.me/923190375751" target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-emerald-600 hover:underline">
                  <MessageCircle className="w-4 h-4" />
                  <span>WhatsApp SLA Desk</span>
                </a>
              </div>
            </section>

            <div className="pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
              <span className="text-xs text-slate-500">
                &copy; {currentYear} EventoraX • Developed &amp; Maintained by ORBIT-I Private Limited
              </span>
              <Link to="/terms" className="text-xs text-blue-600 font-bold hover:underline">
                Terms of Service &rarr;
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
