import { Link } from 'react-router-dom';
import { Calendar, Shield, Mail, Phone, MessageCircle } from 'lucide-react';

export default function Terms() {
  return (
    <main className="font-body">
      <section className="bg-gradient-to-b from-blue-50/60 to-white py-14 md:py-20">
        <div className="content-max max-w-4xl mx-auto px-4">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-bold border border-blue-200 mb-3">
            <Shield className="w-3.5 h-3.5 text-blue-600" />
            Legal Agreement
          </div>
          <h1 className="font-heading text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight mb-4 text-[#0f172a]">
            Terms of Service
          </h1>
          
          {/* Last updated badge */}
          <div className="flex items-center gap-2 text-xs text-slate-500 mb-8">
            <Calendar className="w-4 h-4 text-blue-600" />
            <span>Last updated &amp; effective: <strong>October 2026</strong></span>
          </div>

          <div className="bg-white rounded-3xl p-6 sm:p-10 border border-slate-200 shadow-xl shadow-slate-900/5">
            <div className="space-y-6 text-slate-600 leading-relaxed text-sm sm:text-base">
              <div>
                <h2 className="font-heading text-lg sm:text-xl font-bold mb-2 text-[#0f172a]">1. Acceptance of Terms</h2>
                <p>
                  By accessing or using Eventrye (&ldquo;the Service&rdquo;), you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use the Service. The Service is owned and operated by ORBIT-I Private Limited.
                </p>
              </div>

              <div>
                <h2 className="font-heading text-lg sm:text-xl font-bold mb-2 text-[#0f172a]">2. Description of Service</h2>
                <p>
                  Eventrye is a multi-tenant SaaS platform for managing events, including registration, ticketing, Canva-style visual credential generation, digital ID badges, and analytics. We reserve the right to modify, suspend, or discontinue parts of the Service with reasonable notice.
                </p>
              </div>

              <div>
                <h2 className="font-heading text-lg sm:text-xl font-bold mb-2 text-[#0f172a]">3. User Accounts</h2>
                <p>
                  You must provide accurate and complete information when creating an account. You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account.
                </p>
              </div>

              <div>
                <h2 className="font-heading text-lg sm:text-xl font-bold mb-2 text-[#0f172a]">4. Subscription and Payments</h2>
                <p>
                  Certain features require a paid subscription. Payments are processed securely via supported channels (SBP Raast, JazzCash, Easypaisa, Meezan Bank, and Credit/Debit Cards). You may cancel your subscription at any time. Refunds are governed by our written SLA policy.
                </p>
              </div>

              <div>
                <h2 className="font-heading text-lg sm:text-xl font-bold mb-2 text-[#0f172a]">5. Data Ownership</h2>
                <p>
                  You retain ownership of all event attendee rosters and custom media uploaded to the Service. By using the Service, you grant us a license to process and deliver your certificates, passes, and event data solely for providing the Service.
                </p>
              </div>

              <div>
                <h2 className="font-heading text-lg sm:text-xl font-bold mb-2 text-[#0f172a]">6. Prohibited Activities &amp; 24/7 Security Sentinel</h2>
                <p>
                  Eventrye enforces a zero-tolerance policy against illegal, fraudulent, or deceptive practices. Users may NOT use the platform to generate counterfeit academic degrees, fraudulent governmental credentials, phishing campaigns, or illegal gambling activities. All platform activity is scanned 24/7 by automated compliance sentinels. Violating accounts are immediately terminated without refund and referred to relevant authorities.
                </p>
              </div>

              <div>
                <h2 className="font-heading text-lg sm:text-xl font-bold mb-2 text-[#0f172a]">7. Role Separation and Superadmin Access</h2>
                <p>
                  Client organizations and event organizers are strictly isolated tenants. No client organization shall hold, acquire, or attempt to access Platform Superadmin control panels or system administrative APIs. Unauthorized access attempts trigger automated security quarantine and audit logging.
                </p>
              </div>

              <div>
                <h2 className="font-heading text-lg sm:text-xl font-bold mb-2 text-[#0f172a]">8. Limitation of Liability</h2>
                <p>
                  ORBIT-I shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising out of or relating to your use of the Service.
                </p>
              </div>

              <div>
                <h2 className="font-heading text-lg sm:text-xl font-bold mb-2 text-[#0f172a]">9. Governing Law</h2>
                <p>
                  These Terms shall be governed by and construed in accordance with the laws of Pakistan. Any disputes shall be resolved in the relevant courts of Nawabshah, Sindh.
                </p>
              </div>

              <div className="pt-4 border-t border-slate-100">
                <h2 className="font-heading text-lg sm:text-xl font-bold mb-3 text-[#0f172a]">10. Official Contact &amp; Legal Support</h2>
                <p className="mb-4">
                  For legal inquiries or clarifications concerning these Terms, reach our legal desk:
                </p>
                <div className="flex flex-wrap gap-4 text-sm font-semibold">
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
              </div>
            </div>
          </div>

          <div className="mt-8 text-center">
            <Link to="/" className="font-body text-sm text-blue-600 hover:underline font-semibold">
              &larr; Back to Home
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}