import { Link } from 'react-router';

export default function Terms() {
  return (
    <main className="pt-14">
      <section className="bg-[#F5FAFF] py-20 md:py-28">
        <div className="content-max max-w-4xl mx-auto">
          <p className="font-body text-sm uppercase tracking-[0.1em] mb-4" style={{ color: '#A0B4CC' }}>Legal</p>
          <h1 className="font-heading text-4xl md:text-5xl font-medium tracking-[-0.02em] mb-8" style={{ color: '#1B2A4A' }}>
            Terms of Service
          </h1>
          <div className="bg-white rounded-3xl p-8 md:p-10 border" style={{ borderColor: '#E8F4FD' }}>
            <div className="prose max-w-none">
              <p className="font-body text-sm mb-6" style={{ color: '#A0B4CC' }}>Last updated: January 2025</p>

              <h2 className="font-heading text-xl font-medium mb-3" style={{ color: '#1B2A4A' }}>1. Acceptance of Terms</h2>
              <p className="font-body text-base mb-6" style={{ color: '#A0B4CC' }}>
                By accessing or using EventoraX (&ldquo;the Service&rdquo;), you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use the Service. The Service is owned and operated by ORBIT-I.
              </p>

              <h2 className="font-heading text-xl font-medium mb-3" style={{ color: '#1B2A4A' }}>2. Description of Service</h2>
              <p className="font-body text-base mb-6" style={{ color: '#A0B4CC' }}>
                EventoraX is a multi-tenant SaaS platform for managing events, including registration, ticketing, certificate generation, and analytics. We reserve the right to modify, suspend, or discontinue the Service at any time.
              </p>

              <h2 className="font-heading text-xl font-medium mb-3" style={{ color: '#1B2A4A' }}>3. User Accounts</h2>
              <p className="font-body text-base mb-6" style={{ color: '#A0B4CC' }}>
                You must provide accurate and complete information when creating an account. You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account.
              </p>

              <h2 className="font-heading text-xl font-medium mb-3" style={{ color: '#1B2A4A' }}>4. Subscription and Payments</h2>
              <p className="font-body text-base mb-6" style={{ color: '#A0B4CC' }}>
                Some features of the Service require a paid subscription. Payments are processed securely. You may cancel your subscription at any time. Refunds are provided at our discretion.
              </p>

              <h2 className="font-heading text-xl font-medium mb-3" style={{ color: '#1B2A4A' }}>5. Data Ownership</h2>
              <p className="font-body text-base mb-6" style={{ color: '#A0B4CC' }}>
                You retain ownership of all data you upload to the Service. By using the Service, you grant us a license to use, store, and process your data solely for the purpose of providing the Service.
              </p>

              <h2 className="font-heading text-xl font-medium mb-3" style={{ color: '#1B2A4A' }}>6. Limitation of Liability</h2>
              <p className="font-body text-base mb-6" style={{ color: '#A0B4CC' }}>
                ORBIT-I shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising out of or relating to your use of the Service.
              </p>

              <h2 className="font-heading text-xl font-medium mb-3" style={{ color: '#1B2A4A' }}>7. Governing Law</h2>
              <p className="font-body text-base mb-6" style={{ color: '#A0B4CC' }}>
                These Terms shall be governed by and construed in accordance with the laws of Pakistan. Any disputes shall be resolved in the courts of Islamabad.
              </p>

              <h2 className="font-heading text-xl font-medium mb-3" style={{ color: '#1B2A4A' }}>8. Contact</h2>
              <p className="font-body text-base" style={{ color: '#A0B4CC' }}>
                For questions about these Terms, please contact us at{' '}
                <a href="mailto:hello@eventorax.com" className="hover:underline" style={{ color: '#4A9CFF' }}>hello@eventorax.com</a>.
              </p>
            </div>
          </div>

          <div className="mt-8 text-center">
            <Link to="/" className="font-body text-sm hover:underline" style={{ color: '#4A9CFF' }}>
              Back to Home
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
