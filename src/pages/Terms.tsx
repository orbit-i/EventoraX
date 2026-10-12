import { Link } from 'react-router-dom';

export default function Terms() {
  return (
    <main className="pt-14">
      <section className="bg-[#f3f0ff] py-20 md:py-28">
        <div className="content-max max-w-4xl mx-auto">
          <p className="font-body text-sm uppercase tracking-[0.1em] mb-4 text-[#a78bfa] font-semibold">Legal</p>
          <h1 className="font-heading text-4xl md:text-5xl font-bold tracking-[-0.02em] mb-8 text-[#0f172a]">
            Terms of Service
          </h1>
          <div className="bg-white rounded-2xl p-8 md:p-10 border border-[#e9e4ff] shadow-lg shadow-[#7c3aed]/5">
            <div className="prose max-w-none">
              <p className="font-body text-sm mb-6 text-[#94a3b8]">Last updated: October 2026</p>

              <h2 className="font-heading text-xl font-bold mb-3 text-[#0f172a]">1. Acceptance of Terms</h2>
              <p className="font-body text-base mb-6 text-[#475569] leading-relaxed">
                By accessing or using EventoraX (&ldquo;the Service&rdquo;), you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use the Service. The Service is owned and operated by ORBIT-I.
              </p>

              <h2 className="font-heading text-xl font-bold mb-3 text-[#0f172a]">2. Description of Service</h2>
              <p className="font-body text-base mb-6 text-[#475569] leading-relaxed">
                EventoraX is a multi-tenant SaaS platform for managing events, including registration, ticketing, certificate generation, and analytics. We reserve the right to modify, suspend, or discontinue the Service at any time.
              </p>

              <h2 className="font-heading text-xl font-bold mb-3 text-[#0f172a]">3. User Accounts</h2>
              <p className="font-body text-base mb-6 text-[#475569] leading-relaxed">
                You must provide accurate and complete information when creating an account. You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account.
              </p>

              <h2 className="font-heading text-xl font-bold mb-3 text-[#0f172a]">4. Subscription and Payments</h2>
              <p className="font-body text-base mb-6 text-[#475569] leading-relaxed">
                Some features of the Service require a paid subscription. Payments are processed securely. You may cancel your subscription at any time. Refunds are provided at our discretion.
              </p>

              <h2 className="font-heading text-xl font-bold mb-3 text-[#0f172a]">5. Data Ownership</h2>
              <p className="font-body text-base mb-6 text-[#475569] leading-relaxed">
                You retain ownership of all data you upload to the Service. By using the Service, you grant us a license to use, store, and process your data solely for the purpose of providing the Service.
              </p>

              <h2 className="font-heading text-xl font-bold mb-3 text-[#0f172a]">6. Prohibited Activities & 24/7 Security Sentinel</h2>
              <p className="font-body text-base mb-6 text-[#475569] leading-relaxed">
                EventoraX enforces zero-tolerance policy against illegal, fraudulent, or deceptive practices. Users may NOT use the platform to generate counterfeit academic degrees, fraudulent governmental credentials, phishing campaigns, or illegal gambling activities. All platform activity is scanned 24/7 by automated compliance sentinels. Violating accounts are immediately terminated without refund and referred to relevant authorities.
              </p>

              <h2 className="font-heading text-xl font-bold mb-3 text-[#0f172a]">7. Role Separation and Superadmin Access</h2>
              <p className="font-body text-base mb-6 text-[#475569] leading-relaxed">
                Client organizations and event organizers are strictly isolated tenants. No client organization shall hold, acquire, or attempt to access Platform Superadmin control panels or system administrative APIs. Unauthorized access attempts trigger automated security quarantine and audit logging.
              </p>

              <h2 className="font-heading text-xl font-bold mb-3 text-[#0f172a]">8. Limitation of Liability</h2>
              <p className="font-body text-base mb-6 text-[#475569] leading-relaxed">
                ORBIT-I shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising out of or relating to your use of the Service.
              </p>

              <h2 className="font-heading text-xl font-bold mb-3 text-[#0f172a]">9. Governing Law</h2>
              <p className="font-body text-base mb-6 text-[#475569] leading-relaxed">
                These Terms shall be governed by and construed in accordance with the laws of Pakistan. Any disputes shall be resolved in the courts of Islamabad.
              </p>

              <h2 className="font-heading text-xl font-bold mb-3 text-[#0f172a]">10. Official Contact</h2>
              <p className="font-body text-base text-[#475569] leading-relaxed">
                For questions about these Terms, reach us at{' '}
                <a href="mailto:eventorax@orbit-i.tech" className="text-[#7c3aed] hover:underline font-semibold">eventorax@orbit-i.tech</a>
                {' '}or via WhatsApp at{' '}
                <a href="https://wa.me/923190375751" target="_blank" rel="noreferrer" className="text-emerald-600 hover:underline font-semibold">+92 3190375751</a>.
              </p>
            </div>
          </div>

          <div className="mt-8 text-center">
            <Link to="/" className="font-body text-sm text-[#7c3aed] hover:text-[#6d28d9] hover:underline font-medium transition-colors duration-200">
              Back to Home
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}