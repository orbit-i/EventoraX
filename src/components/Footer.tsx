import { Link } from 'react-router-dom';
import { MapPin, Mail, Phone, MessageCircle, ShieldCheck } from 'lucide-react';
import BrandLogo from '@/components/BrandLogo';

const productLinks = [
  { label: 'Home', href: '/' },
  { label: 'Events Directory', href: '/events-directory' },
  { label: 'List Your Event (+ VIP)', href: '/list-event' },
  { label: 'Verify Credential', href: '/verify' },
  { label: 'Platform Features', href: '/features' },
  { label: 'Pricing & Plans', href: '/pricing' },
  { label: 'Case Studies', href: '/case-studies' },
];

const companyLinks = [
  { label: 'About EventoraX & ORBIT-I', href: '/about' },
  { label: 'Contact Support', href: '/contact' },
  { label: 'Service Usage & SLA', href: '/service-usage' },
  { label: 'Client Sign In', href: '/login' },
  { label: 'Free Organizer Trial', href: '/register' },
];

const legalLinks = [
  { label: 'Terms of Service', href: '/terms' },
  { label: 'Privacy Policy', href: '/privacy' },
  { label: 'Cookie Policy', href: '/cookies' },
  { label: 'Service Usage & SLA', href: '/service-usage' },
  { label: 'Tamper-Proof Verification', href: '/verify' },
];

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-[#0b0f19] text-white border-t border-[#1e293b] font-body no-print">
      <div className="content-max py-14 md:py-18">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* Brand & Direct Clickable Contact Column */}
          <div>
            <Link 
              to="/" 
              className="inline-block"
              title="EventoraX Homepage"
            >
              <BrandLogo variant="compact" size="lg" theme="dark" showTagline={true} />
            </Link>
            <p className="mt-3 text-sm text-[#94a3b8] leading-relaxed">
              Automated event management, Canva-style visual credential design, and cryptographic certificate verification. Developed by ORBIT-I.
            </p>
            
            {/* Clickable Email, Phone & Location */}
            <div className="mt-4 space-y-2 text-xs text-[#94a3b8]">
              <div className="flex items-center gap-2 text-slate-300">
                <MapPin className="w-4 h-4 text-rose-400 shrink-0" />
                <span>Nawabshah, Sindh, Pakistan</span>
              </div>
              <div>
                <a 
                  href="mailto:eventorax@orbit-i.tech" 
                  className="flex items-center gap-2 text-blue-400 hover:text-blue-300 hover:underline transition-colors"
                  title="Send email to EventoraX support"
                >
                  <Mail className="w-4 h-4 shrink-0" />
                  <span>eventorax@orbit-i.tech</span>
                </a>
              </div>
              <div>
                <a 
                  href="tel:+923190375751" 
                  className="flex items-center gap-2 text-emerald-400 hover:text-emerald-300 hover:underline transition-colors"
                  title="Direct phone call to EventoraX"
                >
                  <Phone className="w-4 h-4 shrink-0" />
                  <span>+92 3190375751</span>
                </a>
              </div>
              <div>
                <a 
                  href="https://wa.me/923190375751" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="flex items-center gap-2 text-emerald-400 hover:text-emerald-300 hover:underline transition-colors"
                  title="Chat with support on WhatsApp"
                >
                  <MessageCircle className="w-4 h-4 shrink-0" />
                  <span>WhatsApp: +92 3190375751</span>
                </a>
              </div>
            </div>

            <div className="mt-4 flex items-center gap-2 pt-2 border-t border-slate-800">
              <div className="w-2 h-2 rounded-full bg-[#22c55e] animate-pulse" />
              <span className="text-xs text-[#94a3b8]">
                Systems Operational • 24/7 Security Sentinel
              </span>
            </div>
          </div>

          {/* Product Links */}
          <div>
            <h4 className="font-body text-xs font-bold uppercase tracking-widest text-[#a78bfa] mb-4">
              Product &amp; Solutions
            </h4>
            <ul className="space-y-2.5">
              {productLinks.map((link) => (
                <li key={link.href}>
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

          {/* Company Links */}
          <div>
            <h4 className="font-body text-xs font-bold uppercase tracking-widest text-[#a78bfa] mb-4">
              Company &amp; Support
            </h4>
            <ul className="space-y-2.5">
              {companyLinks.map((link) => (
                <li key={link.href}>
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

          {/* Legal Links */}
          <div>
            <h4 className="font-body text-xs font-bold uppercase tracking-widest text-[#a78bfa] mb-4">
              Trust &amp; Legal
            </h4>
            <ul className="space-y-2.5">
              {legalLinks.map((link) => (
                <li key={link.href}>
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

        {/* Bottom bar with dynamic current copyright year & trust badges */}
        <div className="mt-12 pt-6 border-t border-[#1e293b] flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-[#94a3b8] text-center sm:text-left">
            &copy; {currentYear} EventoraX • Developed &amp; Maintained by{' '}
            <a 
              href="mailto:eventorax@orbit-i.tech" 
              className="text-blue-400 hover:underline"
            >
              ORBIT-I Private Limited
            </a>
            , Nawabshah, Pakistan. All rights reserved.
          </p>

          <div className="flex items-center gap-4 text-xs text-[#94a3b8]">
            <Link to="/verify" className="flex items-center gap-1 hover:text-white transition-colors">
              <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
              <span>Tamper-Proof Verification</span>
            </Link>
            <span className="text-slate-700">•</span>
            <Link to="/service-usage" className="hover:text-white transition-colors">
              99.9% SLA
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}