import { Link } from 'react-router-dom';
import BrandLogo from '@/components/BrandLogo';

const productLinks = [
  { label: 'Home', href: '/' },
  { label: 'Events & Seminars', href: '/events-directory' },
  { label: 'List Your Event (+ VIP)', href: '/list-event' },
  { label: 'Case Studies', href: '/case-studies' },
  { label: 'Features', href: '/features' },
  { label: 'Verify Credential', href: '/verify' },
  { label: 'Pricing', href: '/pricing' },
];

const companyLinks = [
  { label: 'About EventoraX & ORBIT-I', href: '/about' },
  { label: 'List Your Event (+ VIP)', href: '/list-event' },
  { label: 'Events Directory', href: '/events-directory' },
  { label: 'Success Case Studies', href: '/case-studies' },
  { label: 'Contact Support', href: '/contact' },
];

const legalLinks = [
  { label: 'Terms of Service', href: '/terms' },
  { label: 'Privacy Policy', href: '/privacy' },
  { label: 'Cookie Policy', href: '/cookies' },
  { label: 'Service Usage & SLA', href: '/service-usage' },
  { label: 'Credential Verification', href: '/verify' },
];

export default function Footer() {
  return (
    <footer className="bg-[#0b0f19] text-white border-t border-[#1e293b]">
      <div className="content-max py-16 md:py-20">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* Brand */}
          <div>
            <Link to="/" className="inline-block">
              <BrandLogo variant="compact" size="lg" theme="dark" showTagline={true} />
            </Link>
            <p className="mt-3 text-sm text-[#94a3b8] leading-relaxed">
              Automated event management, Canva-style visual credential design, and cryptographic certificate verification. Developed by ORBIT-I.
            </p>
            <div className="mt-3 space-y-1 text-xs text-[#94a3b8]">
              <p>
                Email:{' '}
                <a href="mailto:eventorax@orbit-i.tech" className="text-blue-400 hover:underline">
                  eventorax@orbit-i.tech
                </a>
              </p>
              <p>
                WhatsApp:{' '}
                <a href="https://wa.me/923190375751" target="_blank" rel="noreferrer" className="text-emerald-400 hover:underline">
                  +92 3190375751
                </a>
              </p>
            </div>
            <div className="mt-4 flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-[#22c55e] animate-pulse" />
              <span className="text-xs text-[#94a3b8]">
                Systems Operational • 24/7 Security Sentinel
              </span>
            </div>
          </div>

          {/* Product */}
          <div>
            <h4 className="font-body text-xs font-bold uppercase tracking-widest text-[#a78bfa] mb-4">
              Product
            </h4>
            <ul className="space-y-2.5">
              {productLinks.map((link) => (
                <li key={link.label}>
                  <Link
                    to={link.href}
                    className="text-sm text-[#94a3b8] hover:text-[#ddd6fe] transition-colors duration-200"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="font-body text-xs font-bold uppercase tracking-widest text-[#a78bfa] mb-4">
              Company
            </h4>
            <ul className="space-y-2.5">
              {companyLinks.map((link) => (
                <li key={link.label}>
                  <Link
                    to={link.href}
                    className="text-sm text-[#94a3b8] hover:text-[#ddd6fe] transition-colors duration-200"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="font-body text-xs font-bold uppercase tracking-widest text-[#a78bfa] mb-4">
              Legal
            </h4>
            <ul className="space-y-2.5">
              {legalLinks.map((link) => (
                <li key={link.label}>
                  <Link
                    to={link.href}
                    className="text-sm text-[#94a3b8] hover:text-[#ddd6fe] transition-colors duration-200"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-10 pt-6 border-t border-[#1e293b] flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-[#64748b]">
            &copy; 2026 EventoraX • Developed &amp; Maintained by ORBIT-I Private Limited. All rights reserved.
          </p>
          <div className="flex items-center gap-4">
          </div>
        </div>
      </div>
    </footer>
  );
}