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
    <footer className="bg-[#1B2A4A] text-white">
      <div className="content-max py-16 md:py-20">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* Brand */}
          <div>
            <Link to="/" className="font-heading text-2xl font-medium text-white">
              EventoraX
            </Link>
            <p className="mt-3 text-sm text-[#A0B4CC]">
              Event management made simple. Built by ORBIT-I.
            </p>
          </div>

          {/* Product */}
          <div>
            <h4 className="font-body text-sm font-semibold uppercase tracking-wider text-white mb-4">
              Product
            </h4>
            <ul className="space-y-2.5">
              {productLinks.map((link) => (
                <li key={link.label}>
                  <Link
                    to={link.href}
                    className="text-sm text-[#A0B4CC] hover:text-white transition-colors duration-200"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="font-body text-sm font-semibold uppercase tracking-wider text-white mb-4">
              Company
            </h4>
            <ul className="space-y-2.5">
              {companyLinks.map((link) => (
                <li key={link.label}>
                  <Link
                    to={link.href}
                    className="text-sm text-[#A0B4CC] hover:text-white transition-colors duration-200"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="font-body text-sm font-semibold uppercase tracking-wider text-white mb-4">
              Legal
            </h4>
            <ul className="space-y-2.5">
              {legalLinks.map((link) => (
                <li key={link.label}>
                  <Link
                    to={link.href}
                    className="text-sm text-[#A0B4CC] hover:text-white transition-colors duration-200"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-10 pt-6 border-t border-white/10">
          <p className="text-xs text-[#A0B4CC]">
            &copy; 2025 EventoraX by ORBIT-I. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
