import { Link } from 'react-router-dom';

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

              <h2 className="font-heading text-xl font-bold mb-3 text-[#0f172a]">6. Cookies and Google AdSense Disclosures</h2>
              <p className="font-body text-base mb-4 text-[#475569] leading-relaxed">
                We use cookies and similar technologies to enhance your experience, maintain session state, and understand platform usage. 
              </p>
              <p className="font-body text-base mb-6 text-[#475569] leading-relaxed">
                <strong>Third-Party Vendors & Google AdSense:</strong> Third-party vendors, including Google, use cookies to serve ads based on a user's prior visits to our website or other websites. Google's use of advertising cookies enables it and its partners to serve ads to users based on their visits to our site and/or other sites on the Internet. Users may opt out of personalized advertising by visiting <a href="https://adssettings.google.com" target="_blank" rel="noreferrer" className="text-blue-600 underline">Google Ads Settings</a>. Alternatively, you can opt out of third-party vendor cookies for personalized advertising by visiting <a href="https://www.aboutads.info" target="_blank" rel="noreferrer" className="text-blue-600 underline">www.aboutads.info</a>.
              </p>

              <h2 className="font-heading text-xl font-bold mb-3 text-[#0f172a]">7. Acceptable Use and Security Sentinel</h2>
              <p className="font-body text-base mb-6 text-[#475569] leading-relaxed">
                EventoraX employs 24/7 automated security and compliance monitoring to safeguard our ecosystem against fraudulent credentials, phishing, illegal gambling, counterfeit certificates, and unauthorized access attempts. Prohibited activity is automatically terminated and flagged to compliance officers.
              </p>

              <h2 className="font-heading text-xl font-bold mb-3 text-[#0f172a]">8. Changes to This Policy</h2>
              <p className="font-body text-base mb-6 text-[#475569] leading-relaxed">
                We may update this Privacy Policy periodically. We will post all revisions directly on this page with an updated timestamp.
              </p>

              <h2 className="font-heading text-xl font-bold mb-3 text-[#0f172a]">9. Official Contact Details</h2>
              <p className="font-body text-base text-[#475569] leading-relaxed">
                For privacy inquiries or compliance requests, reach our Data Protection Officer at:{' '}
                <a href="mailto:eventorax@orbit-i.tech" className="text-[#7c3aed] hover:underline font-semibold">eventorax@orbit-i.tech</a>
                {' '}or via WhatsApp at{' '}
                <a href="https://wa.me/923190375751" target="_blank" rel="noreferrer" className="text-emerald-600 hover:underline font-semibold">+92 3190375751</a>.
                Operated by ORBIT-I Private Limited, Islamabad, Pakistan.
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