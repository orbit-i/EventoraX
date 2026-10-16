import { Link } from 'react-router-dom';
import { Calendar, ShieldCheck, Mail, Phone, MessageCircle } from 'lucide-react';

export default function Privacy() {
  return (
    <main className="font-body">
      <section className="bg-gradient-to-b from-blue-50/60 to-white py-14 md:py-20">
        <div className="content-max max-w-4xl mx-auto px-4">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-bold border border-blue-200 mb-3">
            <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
            Privacy Policy
          </div>
          <h1 className="font-heading text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight mb-4 text-[#0f172a]">
            Privacy &amp; Data Protection Policy
          </h1>

          {/* Last updated badge */}
          <div className="flex items-center gap-2 text-xs text-slate-500 mb-8">
            <Calendar className="w-4 h-4 text-blue-600" />
            <span>Last updated &amp; effective: <strong>October 2026</strong></span>
          </div>

          <div className="bg-white rounded-3xl p-6 sm:p-10 border border-slate-200 shadow-xl shadow-slate-900/5">
            <div className="space-y-6 text-slate-600 leading-relaxed text-sm sm:text-base">
              <div>
                <h2 className="font-heading text-lg sm:text-xl font-bold mb-2 text-[#0f172a]">1. Information We Collect</h2>
                <p>
                  We collect information you provide directly to us when creating an organization workspace, including your name, email address, organization name, and phone number. We also process event registration data, attendee credentials, and analytics strictly to provide event operations.
                </p>
              </div>

              <div>
                <h2 className="font-heading text-lg sm:text-xl font-bold mb-2 text-[#0f172a]">2. How We Use Your Information</h2>
                <p>
                  We use your information to operate and maintain the Service, generate dynamic QR ticketing passes, verify SHA-256 certificate authenticity, process subscription payments, send automated email receipts, and respond to support inquiries.
                </p>
              </div>

              <div>
                <h2 className="font-heading text-lg sm:text-xl font-bold mb-2 text-[#0f172a]">3. Data Storage &amp; Encryption Standards</h2>
                <p>
                  We implement industry-standard cryptographic measures. All attendee records and credential templates are encrypted in transit via TLS 1.3 and at rest with AES-256 encryption. We operate secure partitioned database clusters with continuous automated backups.
                </p>
              </div>

              <div>
                <h2 className="font-heading text-lg sm:text-xl font-bold mb-2 text-[#0f172a]">4. Data Sharing &amp; Third Parties</h2>
                <p>
                  We do not sell, trade, or rent personal data to third parties. Data is only exchanged with authorized payment processors (SBP Raast, JazzCash, Easypaisa, Meezan Bank) solely for payment settlement, subject to confidentiality agreements.
                </p>
              </div>

              <div>
                <h2 className="font-heading text-lg sm:text-xl font-bold mb-2 text-[#0f172a]">5. Your Data Rights</h2>
                <p>
                  You have the right to inspect, correct, export, or permanently delete your organization and attendee data. Upon account cancellation, your data is retained for 30 days for data retrieval and then permanently purged.
                </p>
              </div>

              <div>
                <h2 className="font-heading text-lg sm:text-xl font-bold mb-2 text-[#0f172a]">6. Cookies and Google AdSense Disclosures</h2>
                <p className="mb-3">
                  We use cookies and similar technologies to enhance session management, remember user preferences, and analyze platform traffic.
                </p>
                <p>
                  <strong>Third-Party Vendors &amp; Google AdSense:</strong> Third-party vendors, including Google, use cookies to serve ads based on user visits. Google's use of advertising cookies enables it and its partners to serve ads based on visits to our site and/or other sites on the Internet. Users may opt out of personalized advertising by visiting{' '}
                  <a href="https://adssettings.google.com" target="_blank" rel="noreferrer" className="text-blue-600 underline font-medium">Google Ads Settings</a>.
                </p>
              </div>

              <div>
                <h2 className="font-heading text-lg sm:text-xl font-bold mb-2 text-[#0f172a]">7. Automated Compliance &amp; Security Sentinel</h2>
                <p>
                  EventoraX operates 24/7 automated security and compliance monitoring to safeguard our ecosystem against fraudulent credentials, phishing, illegal gambling, counterfeit certificates, and unauthorized access attempts.
                </p>
              </div>

              <div className="pt-4 border-t border-slate-100">
                <h2 className="font-heading text-lg sm:text-xl font-bold mb-3 text-[#0f172a]">8. Data Protection Officer Contact</h2>
                <p className="mb-4">
                  For privacy inquiries, GDPR requests, or data deletion requests, reach our Data Protection Officer at:
                </p>
                <div className="flex flex-wrap gap-4 text-sm font-semibold">
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
                    <span>WhatsApp Privacy Desk</span>
                  </a>
                </div>
              </div>
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