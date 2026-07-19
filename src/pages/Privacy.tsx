import { Link } from 'react-router';

export default function Privacy() {
  return (
    <main className="pt-14">
      <section className="bg-[#f3f0ff] py-20 md:py-28">
        <div className="content-max max-w-4xl mx-auto">
          <p className="font-body text-sm uppercase tracking-[0.1em] mb-4 text-[#a78bfa] font-semibold">Legal</p>
          <h1 className="font-heading text-4xl md:text-5xl font-bold tracking-[-0.02em] mb-8 text-[#0f172a]">
            Privacy Policy
          </h1>
          <div className="bg-white rounded-2xl p-8 md:p-10 border border-[#e9e4ff] shadow-sm">
            <div className="prose max-w-none">
              <p className="font-body text-sm mb-6 text-[#94a3b8]">Last updated: January 2025</p>

              <h2 className="font-heading text-xl font-bold mb-3 text-[#0f172a]">1. Information We Collect</h2>
              <p className="font-body text-base mb-6 text-[#475569] leading-relaxed">
                We collect information you provide directly to us, including your name, email address, organization name, and phone number. We also collect data about your events, attendees, and usage of the Service.
              </p>

              <h2 className="font-heading text-xl font-bold mb-3 text-[#0f172a]">2. How We Use Your Information</h2>
              <p className="font-body text-base mb-6 text-[#475569] leading-relaxed">
                We use your information to provide, maintain, and improve the Service; to process transactions; to send you technical notices and support messages; and to respond to your inquiries.
              </p>

              <h2 className="font-heading text-xl font-bold mb-3 text-[#0f172a]">3. Data Storage and Security</h2>
              <p className="font-body text-base mb-6 text-[#475569] leading-relaxed">
                We implement industry-standard security measures to protect your data. All data is encrypted in transit and at rest. We use secure cloud infrastructure with regular backups and monitoring.
              </p>

              <h2 className="font-heading text-xl font-bold mb-3 text-[#0f172a]">4. Data Sharing</h2>
              <p className="font-body text-base mb-6 text-[#475569] leading-relaxed">
                We do not sell, trade, or rent your personal information to third parties. We may share data with trusted service providers who assist us in operating the Service, subject to confidentiality agreements.
              </p>

              <h2 className="font-heading text-xl font-bold mb-3 text-[#0f172a]">5. Your Rights</h2>
              <p className="font-body text-base mb-6 text-[#475569] leading-relaxed">
                You have the right to access, correct, or delete your personal information. You may also request a copy of your data or object to certain processing activities. Contact us to exercise these rights.
              </p>

              <h2 className="font-heading text-xl font-bold mb-3 text-[#0f172a]">6. Cookies</h2>
              <p className="font-body text-base mb-6 text-[#475569] leading-relaxed">
                We use cookies and similar technologies to enhance your experience, analyze usage patterns, and improve the Service. You can control cookies through your browser settings.
              </p>

              <h2 className="font-heading text-xl font-bold mb-3 text-[#0f172a]">7. Changes to This Policy</h2>
              <p className="font-body text-base mb-6 text-[#475569] leading-relaxed">
                We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new policy on this page and updating the effective date.
              </p>

              <h2 className="font-heading text-xl font-bold mb-3 text-[#0f172a]">8. Contact Us</h2>
              <p className="font-body text-base text-[#475569] leading-relaxed">
                If you have questions about this Privacy Policy, please contact us at{' '}
                <a href="mailto:hello@eventorax.com" className="text-[#7c3aed] hover:text-[#6d28d9] hover:underline transition-colors duration-200 font-medium">hello@eventorax.com</a>.
              </p>
            </div>
          </div>

          <div className="mt-8 text-center">
            <Link to="/" className="font-body text-sm font-medium text-[#7c3aed] hover:text-[#6d28d9] hover:underline transition-colors duration-200">
              Back to Home
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}