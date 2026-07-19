import { useEffect } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Link } from 'react-router';
import {
  Calendar, ClipboardList, Award, QrCode, IdCard,
  BarChart3, Mail, Layers, Shield, Clock, Download, Globe,
} from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

const featureGroups = [
  {
    title: 'Event Management',
    icon: Calendar,
    desc: 'Plan, schedule, and manage events of any size with intuitive tools.',
    features: [
      'Create unlimited events with custom branding',
      'Set event categories, dates, and locations',
      'Manage registrations and capacity limits',
      'Schedule sessions and speakers',
      'Set up custom registration forms',
      'Track event status in real-time',
    ],
  },
  {
    title: 'Attendee Registration',
    icon: ClipboardList,
    desc: 'Custom registration forms with automated confirmation emails.',
    features: [
      'Multi-field custom registration forms',
      'Automatic confirmation emails',
      'Waitlist management',
      'Group registration support',
      'Import attendees via CSV/Excel',
      'Real-time registration tracking',
    ],
  },
  {
    title: 'Certificate System',
    icon: Award,
    desc: 'Auto-generate and send branded certificates with verification codes.',
    features: [
      '50+ professional certificate templates',
      'Auto-generate with attendee data',
      'Unique SHA-256 verification codes',
      'Public verification page',
      'Bulk certificate generation',
      'PDF export and email delivery',
    ],
  },
  {
    title: 'QR Ticketing',
    icon: QrCode,
    desc: 'Digital tickets with QR codes for seamless check-in.',
    features: [
      'Auto-generated QR tickets',
      'Mobile-friendly ticket display',
      'Camera-based QR scanner',
      'Instant check-in validation',
      'Bulk ticket download (ZIP)',
      'Send tickets via email',
    ],
  },
  {
    title: 'ID Card Generator',
    icon: IdCard,
    desc: 'Design and print professional ID cards for participants.',
    features: [
      '4 professional ID card templates',
      'Custom logo and branding',
      'Auto-populate from registration data',
      'Bulk generation support',
      'High-quality PDF export',
      'Print-ready layouts',
    ],
  },
  {
    title: 'Analytics Dashboard',
    icon: BarChart3,
    desc: 'Real-time insights on registrations, attendance, and engagement.',
    features: [
      'Registration trend charts',
      'Attendance rate analytics',
      'Category-wise breakdowns',
      'Export reports as PDF/CSV',
      'Real-time event monitoring',
      'Custom date range filtering',
    ],
  },
  {
    title: 'Email Automation',
    icon: Mail,
    desc: 'Automated reminders, confirmations, and follow-ups.',
    features: [
      'Registration confirmation emails',
      'Event reminder sequences',
      'Certificate delivery emails',
      'Custom email templates',
      'SMTP configuration',
      'Email delivery tracking',
    ],
  },
  {
    title: 'Multi-Tenancy',
    icon: Layers,
    desc: 'One platform, multiple organizations — fully isolated.',
    features: [
      'Complete tenant isolation',
      'Organization-specific branding',
      'Role-based access control',
      'Admin, Manager, Viewer roles',
      'Team member invitations',
      'Usage analytics per tenant',
    ],
  },
  {
    title: 'Security',
    icon: Shield,
    desc: 'Enterprise-grade security for your data and events.',
    features: [
      'End-to-end data encryption',
      'Full tenant data isolation',
      'Audit logs and activity tracking',
      'Secure authentication',
      'Suspicious activity detection',
      'Regular security backups',
    ],
  },
];

export default function Features() {
  useEffect(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

    const reveals = document.querySelectorAll('.scroll-reveal');
    reveals.forEach((el) => {
      gsap.from(el, {
        scrollTrigger: { trigger: el, start: 'top 85%' },
        opacity: 0, y: 30, duration: 0.5, ease: 'power1.out',
      });
    });
    return () => { ScrollTrigger.getAll().forEach((st) => st.kill()); };
  }, []);

  return (
    <main className="pt-14">
      {/* Hero */}
      <section className="bg-[#f3f0ff] py-20 md:py-32 text-center">
        <div className="content-max">
          <p className="font-body text-sm uppercase tracking-[0.1em] mb-4 text-[#a78bfa] font-semibold">Features</p>
          <h1 className="font-heading text-4xl md:text-6xl font-bold tracking-[-0.02em] mb-6 text-[#0f172a]">
            Everything you need
          </h1>
          <p className="font-body text-lg md:text-xl max-w-2xl mx-auto text-[#64748b] leading-relaxed">
            A complete toolkit for modern event organizers — from planning to post-event follow-up.
          </p>
        </div>
      </section>

      {/* Feature Groups */}
      <section className="bg-white section-padding">
        <div className="content-max">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {featureGroups.map((group, i) => {
              const Icon = group.icon;
              return (
                <div
                  key={i}
                  className="scroll-reveal bg-white rounded-2xl p-8 border border-[#e9e4ff] shadow-sm hover:shadow-lg hover:shadow-[#7c3aed]/10 hover:-translate-y-1 transition-all duration-300"
                  style={{ transitionDelay: `${(i % 3) * 100}ms` }}
                >
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-5 bg-[#f5f3ff] text-[#7c3aed]">
                    <Icon size={24} />
                  </div>
                  <h3 className="font-heading text-xl font-bold mb-2 text-[#0f172a]">{group.title}</h3>
                  <p className="font-body text-sm mb-5 text-[#475569] leading-relaxed">{group.desc}</p>
                  <ul className="space-y-2.5">
                    {group.features.map((f, fi) => (
                      <li key={fi} className="flex items-start gap-2.5">
                        <div className="w-1.5 h-1.5 rounded-full mt-2 flex-shrink-0 bg-[#7c3aed]" />
                        <span className="font-body text-sm text-[#0f172a]">{f}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Additional highlights */}
      <section className="bg-[#f5f3ff] section-padding">
        <div className="content-max">
          <h2 className="font-heading text-3xl md:text-4xl font-bold text-center mb-12 tracking-[-0.02em] text-[#0f172a]">
            More powerful features
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: Clock, title: 'Real-time Sync', desc: 'All changes sync instantly across devices and team members.' },
              { icon: Download, title: 'Bulk Export', desc: 'Export attendees, certificates, and reports in multiple formats.' },
              { icon: Globe, title: 'White Label', desc: 'Enterprise plans include full white-labeling with your brand.' },
              { icon: BarChart3, title: 'REST API', desc: 'Full API access for Enterprise customers to build custom integrations.' },
            ].map((item, i) => {
              const Icon = item.icon;
              return (
                <div key={i} className="scroll-reveal bg-white rounded-2xl p-6 border border-[#e9e4ff] shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 text-center" style={{ transitionDelay: `${i * 100}ms` }}>
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-4 bg-[#f5f3ff] text-[#7c3aed]">
                    <Icon size={24} />
                  </div>
                  <h4 className="font-heading text-lg font-bold mb-2 text-[#0f172a]">{item.title}</h4>
                  <p className="font-body text-sm text-[#475569] leading-relaxed">{item.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-white py-20 md:py-28 text-center">
        <div className="content-max">
          <h2 className="font-heading text-3xl md:text-4xl font-bold mb-4 tracking-[-0.02em] text-[#0f172a]">
            Ready to explore?
          </h2>
          <p className="font-body text-base mb-8 text-[#64748b]">
            Start your free trial and experience the difference.
          </p>
          <Link
            to="/register"
            className="inline-flex items-center justify-center px-8 py-3.5 bg-[#7c3aed] text-white font-semibold rounded-xl shadow-lg shadow-[#7c3aed]/25 hover:bg-[#6d28d9] hover:shadow-xl hover:shadow-[#7c3aed]/30 hover:-translate-y-0.5 transition-all duration-200"
          >
            Start Free Trial
          </Link>
        </div>
      </section>
    </main>
  );
}