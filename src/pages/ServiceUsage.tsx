import { Link } from 'react-router-dom';
import { Server, ShieldCheck, Zap, AlertTriangle, CheckCircle2 } from 'lucide-react';

export default function ServiceUsage() {
  return (
    <main className="pt-14">
      <section className="bg-[#f3f0ff] py-20 md:py-28">
        <div className="content-max max-w-4xl mx-auto">
          <div className="flex items-center gap-2 mb-4">
            <span className="font-body text-xs uppercase tracking-[0.1em] px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-700 font-bold flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5" />
              Infrastructure & Operations
            </span>
          </div>
          <h1 className="font-heading text-4xl md:text-5xl font-black tracking-[-0.02em] mb-4 text-[#0f172a]">
            Service Usage &amp; Fair Use Policy
          </h1>
          <p className="text-sm text-[#64748b] mb-8">
            Operational guidelines, system rate limits, high-concurrency capabilities, and SLA commitments for production deployment.
          </p>

          <div className="bg-white rounded-3xl p-8 md:p-12 border border-[#e9e4ff] shadow-xl shadow-[#7c3aed]/5 space-y-8">
            <div className="text-xs text-[#94a3b8] font-medium border-b border-[#f1f5f9] pb-4 flex items-center justify-between">
              <span>Production Version: v1.0.0 • Infrastructure SLA: 99.9% Uptime</span>
              <span className="text-emerald-600 font-bold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Systems Fully Operational
              </span>
            </div>

            <section className="space-y-3">
              <h2 className="text-lg font-bold text-[#0f172a] flex items-center gap-2">
                <Server className="w-5 h-5 text-[#7c3aed]" />
                1. High-Concurrency &amp; Multi-Million User Scaling
              </h2>
              <p className="text-sm text-[#475569] leading-relaxed">
                EventoraX utilizes an asynchronous event-driven core designed to handle high-traffic surges during peak ticketing, live seminars, and viral registrations. Automated micro-batching, in-memory rate token limiters, and optimized database connection pooling ensure zero downtime during sudden viral attendance spikes.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-lg font-bold text-[#0f172a]">2. Fair Use Limits per Subscription Tier</h2>
              <div className="overflow-x-auto rounded-2xl border border-slate-200 mt-2">
                <table className="w-full text-left text-xs">
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
                      <td className="p-3">Up to 3 Active</td>
                      <td className="p-3">500 / month</td>
                      <td className="p-3">60 req/min</td>
                      <td className="p-3 text-emerald-600 font-semibold">Standard Portal</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-bold text-[#7c3aed]">Professional</td>
                      <td className="p-3">Up to 25 Active</td>
                      <td className="p-3">10,000 / month</td>
                      <td className="p-3">300 req/min</td>
                      <td className="p-3 text-emerald-600 font-semibold">Custom Branding + Colors</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-bold text-indigo-700">Enterprise</td>
                      <td className="p-3">Unlimited</td>
                      <td className="p-3">100,000+ / month</td>
                      <td className="p-3">1,200 req/min</td>
                      <td className="p-3 text-emerald-600 font-semibold">Full White-label &amp; Domain</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-bold text-blue-700">PaaS Developer</td>
                      <td className="p-3">Dedicated Cluster</td>
                      <td className="p-3">Millions Concurrency</td>
                      <td className="p-3">Custom Quota</td>
                      <td className="p-3 text-emerald-600 font-semibold">Headless API &amp; SDK</td>
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
                <li className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <strong className="text-slate-900 block mb-0.5">DDoS &amp; Traffic Floods</strong>
                  Automated IP token-bucket throttling sheds malicious spikes without affecting authentic ticket seekers.
                </li>
                <li className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <strong className="text-slate-900 block mb-0.5">SQL Injection &amp; XSS</strong>
                  Parameterized queries, strict type parsing, and HTML escaping neutralize injection payloads.
                </li>
                <li className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <strong className="text-slate-900 block mb-0.5">Tenant Isolation Enforcement</strong>
                  Cryptographic JWT validation guarantees no cross-tenant query leaks; client accounts cannot access superadmin panels.
                </li>
                <li className="p-3 rounded-xl bg-slate-50 border border-slate-200">
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
              <h2 className="text-lg font-bold text-[#0f172a]">5. Service Level Agreement (SLA)</h2>
              <p className="text-sm text-[#475569] leading-relaxed">
                For paid Enterprise and PaaS tiers, EventoraX commits to a 99.9% monthly uptime guarantee. Scheduled maintenance windows are announced at least 48 hours in advance and executed during off-peak hours.
              </p>
            </section>

            <div className="pt-6 border-t border-[#f1f5f9] flex items-center justify-between">
              <span className="text-xs text-[#94a3b8]">
                &copy; 2026 EventoraX • Developed &amp; Maintained by ORBIT-I Private Limited
              </span>
              <Link to="/terms" className="text-xs text-[#7c3aed] font-bold hover:underline">
                Terms of Service &rarr;
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
