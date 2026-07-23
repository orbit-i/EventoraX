import { Link } from 'react-router';

const productLinks = [
  { label: 'Features', href: '/features' },
  { label: 'Pricing', href: '/pricing' },
  { label: 'API', href: '#' },
  { label: 'Changelog', href: '#' },
];

const companyLinks = [
  { label: 'About', href: '/about' },
  { label: 'Blog', href: '#' },
  { label: 'Careers', href: '#' },
  { label: 'Contact', href: '/contact' },
];

const legalLinks = [
  { label: 'Privacy', href: '/privacy' },
  { label: 'Terms', href: '/terms' },
  { label: 'Security', href: '#' },
];

export default function Footer() {
  return (
    <footer className="bg-[#0f172a] text-white">
      <div className="content-max py-16 md:py-20">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* Brand */}
          <div>
            <Link to="/" className="font-heading text-2xl font-bold">
              Eventora<span className="text-[#a78bfa]">X</span>
            </Link>
            <p className="mt-3 text-sm text-[#94a3b8] leading-relaxed">
              Event management made simple. Built by ORBIT-I.
            </p>
            <div className="mt-4 flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-[#22c55e] animate-pulse" />
              <span className="text-xs text-[#94a3b8]">All systems operational</span>
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
            &copy; 2025 EventoraX by ORBIT-I. All rights reserved.
          </p>
          <div className="flex items-center gap-4">
          </div>
        </div>
      </div>
    </footer>
  );
}