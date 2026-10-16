import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

interface RouteMetadata {
  title: string;
  description: string;
}

const routeMetadataMap: Record<string, RouteMetadata> = {
  '/': {
    title: 'EventoraX — Enterprise Event Management & Automated Certificate SaaS',
    description: 'Create world-class events, manage registrations, issue tamper-evident verified certificates, and track analytics. Multi-tenant event platform by ORBIT-I.'
  },
  '/events-directory': {
    title: 'Browse Events & Seminars — Upcoming Summits, Expos & Meetups | EventoraX',
    description: 'Discover upcoming tech hackathons, academic conferences, business symposiums and cultural expos. Book dynamic QR tickets with instant local and international payments.'
  },
  '/list-event': {
    title: 'List Your Event — VIP Showcase & Community Event Hosting | EventoraX',
    description: 'Publish and promote your conference, summit or workshop to thousands of verified attendees. Access real-time QR check-in, automated certificates, and lowest ticket commissions.'
  },
  '/features': {
    title: 'Platform Features — Dynamic QR Ticketing, ID Badges & Certificates | EventoraX',
    description: 'Explore the full EventoraX operating system: Canva design studio, SHA-256 certificate verification, multi-gate check-in, real-time analytics, and automated email delivery.'
  },
  '/pricing': {
    title: 'Simple & Predictable Pricing — Multi-Tenant Workspaces | EventoraX',
    description: 'Transparent pricing for organizers, universities and enterprise summits. Supported payment options include Raast, JazzCash, Easypaisa, Meezan Bank, and Credit Cards.'
  },
  '/case-studies': {
    title: 'Case Studies & Institutional Deployments — Success Stories | EventoraX',
    description: 'See how premier universities, technology conferences, and non-profits streamline large-scale events and credentialing with EventoraX.'
  },
  '/about': {
    title: 'About EventoraX & ORBIT-I — Next-Gen Multi-Tenant Event Infrastructure',
    description: 'Learn about ORBIT-I Private Limited, our engineering team in Nawabshah, and our mission to modernize event management, ticketing, and digital credentialing across Pakistan and beyond.'
  },
  '/contact': {
    title: 'Contact Us — 24/7 Technical Support & Organizer Partnerships | EventoraX',
    description: 'Get in touch with the EventoraX engineering and customer success team for enterprise deployments, white-labeling, custom SLAs, or immediate assistance.'
  },
  '/verify': {
    title: 'Public Credential Verification — Cryptographic Certificate Validator | EventoraX',
    description: 'Verify the authenticity and integrity of certificates and attendee passes issued by EventoraX. Real-time tamper-proof validation powered by SHA-256 cryptographic signatures.'
  },
  '/terms': {
    title: 'Terms of Service — Legal Policies & 24/7 Security Sentinel | EventoraX',
    description: 'Terms and conditions governing the use of the EventoraX platform, tenant isolation, acceptable usage, and compliance standards enforced by ORBIT-I.'
  },
  '/privacy': {
    title: 'Privacy Policy & Data Protection — Transparency & AdSense Compliance | EventoraX',
    description: 'Comprehensive privacy policy detailing data collection, GDPR & local compliance, encryption standards, cookies, and Google advertising partner disclosures.'
  },
  '/cookies': {
    title: 'Cookie Policy & Session Management | EventoraX',
    description: 'Information regarding how EventoraX uses essential, analytical, and marketing cookies to optimize your platform experience.'
  },
  '/service-usage': {
    title: 'Service Usage & SLA Policy — Enterprise Guarantees | EventoraX',
    description: '99.9% uptime SLA commitments, rate limits, infrastructure specifications, and incident response times for EventoraX multi-tenant cloud operations.'
  },
  '/login': {
    title: 'Sign In — Dedicated Client Organization Portal | EventoraX',
    description: 'Access your organization dashboard, manage active events, design certificates, review attendance analytics, and download reports.'
  },
  '/register': {
    title: 'Create Your Account — 14-Day Free Organizer Trial | EventoraX',
    description: 'Start managing your events and generating certificates today with no credit card required. Instant organization workspace setup.'
  },
  '/orbit-i-master-gateway/login': {
    title: 'ORBIT-I Master Authority Gateway — Restricted Platform Access',
    description: 'EventoraX platform governance, multi-tenant monitoring and SuperAdmin administrative authority console.'
  }
};

/**
 * Hook to automatically update document title, meta description, and canonical tags
 */
export function usePageSEO() {
  const location = useLocation();

  useEffect(() => {
    const pathname = location.pathname;
    
    // Find matching route or fallback
    let meta = routeMetadataMap[pathname];

    if (!meta) {
      if (pathname.startsWith('/verify/')) {
        meta = {
          title: 'Verify Credential — EventoraX Authenticator',
          description: 'Validating official cryptographic certificate authenticity via EventoraX SHA-256 public verification registry.'
        };
      } else if (pathname.startsWith('/events/') || pathname.startsWith('/e/')) {
        meta = {
          title: 'Event Details & Registration | EventoraX Directory',
          description: 'View full event details, agenda, keynote speakers, and register for official entry passes.'
        };
      } else if (pathname.startsWith('/dashboard')) {
        meta = {
          title: 'Organization Workspace — EventoraX Dashboard',
          description: 'Manage events, attendees, certificates, ID cards, and organization settings.'
        };
      } else {
        meta = {
          title: 'EventoraX — Enterprise Event Management & Automated Certificate SaaS',
          description: 'The complete event management platform for universities, companies, and NGOs. Create events, manage registrations, issue certificates, and track analytics.'
        };
      }
    }

    // Update document title
    document.title = meta.title;

    // Update meta description
    let descTag = document.querySelector('meta[name="description"]');
    if (!descTag) {
      descTag = document.createElement('meta');
      descTag.setAttribute('name', 'description');
      document.head.appendChild(descTag);
    }
    descTag.setAttribute('content', meta.description);

    // Update OpenGraph & Twitter tags
    const ogTitle = document.querySelector('meta[property="og:title"]');
    if (ogTitle) ogTitle.setAttribute('content', meta.title);

    const ogDesc = document.querySelector('meta[property="og:description"]');
    if (ogDesc) ogDesc.setAttribute('content', meta.description);

    const twitterTitle = document.querySelector('meta[name="twitter:title"]');
    if (twitterTitle) twitterTitle.setAttribute('content', meta.title);

    const twitterDesc = document.querySelector('meta[name="twitter:description"]');
    if (twitterDesc) twitterDesc.setAttribute('content', meta.description);
  }, [location.pathname]);
}
