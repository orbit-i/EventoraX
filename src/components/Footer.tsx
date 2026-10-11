import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { Mail, MessageCircle } from 'lucide-react';
import { SocialLinks } from '@/components/public/SocialLinks';
import { usePlatform } from '@/context/PlatformContext';
import { api } from '@/lib/api';
import { whatsappLink } from '@/lib/contact';
import type { ContactInfo } from '@/types/dashboard';

const productLinks = [
  { label: 'Features', href: '/features' },
  { label: 'Pricing', href: '/pricing' },
  { label: 'Verify a certificate', href: '/verify' },
  { label: 'API docs', href: '/developers' },
  { label: 'Start free trial', href: '/register' },
];

const companyLinks = [
  { label: 'About ORBIT-I', href: '/about' },
  { label: 'Contact', href: '/contact' },
  { label: 'Privacy policy', href: '/privacy' },
  { label: 'Terms of service', href: '/terms' },
];

function LinkList({ title, links }: { title: string; links: { label: string; href: string }[] }) {
  return (
    <div>
      <h4 className="font-body text-xs font-bold uppercase tracking-widest text-[#a78bfa] mb-4">{title}</h4>
      <ul className="space-y-2.5">
        {links.map((link) => (
          <li key={link.label}>
            <Link to={link.href} className="text-sm text-[#94a3b8] hover:text-[#ddd6fe] transition-colors duration-200">
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function Footer() {
  const { platform } = usePlatform();
  const [contact, setContact] = useState<ContactInfo | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    api
      .get<ContactInfo>('/contact/info', { auth: false, signal: controller.signal })
      .then(setContact)
      .catch(() => undefined);
    return () => controller.abort();
  }, []);

  const down = platform?.maintenance.enabled;

  return (
    <footer className="bg-[#0f172a] text-white">
      <div className="content-max py-16 md:py-20">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
          <div>
            <Link to="/" className="font-heading text-2xl font-bold">
              Eventora<span className="text-[#a78bfa]">X</span>
            </Link>
            <p className="mt-3 text-sm text-[#94a3b8] leading-relaxed">
              Events, QR tickets, certificates and ID cards for Pakistani universities and organizations. Built by ORBIT-I.
            </p>
            <div className="mt-4 flex items-center gap-2">
              <span className={`h-2 w-2 rounded-full ${down ? 'bg-amber-400' : 'bg-[#22c55e]'}`} />
              <span className="text-xs text-[#94a3b8]">{down ? 'Under maintenance' : 'All systems operational'}</span>
            </div>
          </div>

          <LinkList title="Product" links={productLinks} />
          <LinkList title="Company" links={companyLinks} />

          <div>
            <h4 className="font-body text-xs font-bold uppercase tracking-widest text-[#a78bfa] mb-4">Get in touch</h4>
            <ul className="space-y-2.5 text-sm text-[#94a3b8]">
              {contact?.email && (
                <li>
                  <a href={`mailto:${contact.email}`} className="inline-flex items-center gap-2 hover:text-[#ddd6fe]">
                    <Mail className="h-4 w-4" /> {contact.email}
                  </a>
                </li>
              )}
              {contact?.whatsapp && (
                <li>
                  <a href={whatsappLink(contact.whatsapp, 'Hi EventoraX team, ')} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 hover:text-[#ddd6fe]">
                    <MessageCircle className="h-4 w-4" /> WhatsApp {contact.whatsapp}
                  </a>
                </li>
              )}
              <li>Pakistan</li>
              {contact?.hours && <li className="text-xs">{contact.hours}</li>}
            </ul>
            <SocialLinks className="mt-4" />
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-[#1e293b]">
          <p className="text-xs text-[#64748b]">&copy; {new Date().getFullYear()} EventoraX by ORBIT-I. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
