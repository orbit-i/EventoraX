import { useEffect } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Link } from 'react-router';
import {
  Calendar, ClipboardList, Award, QrCode, IdCard,
  BarChart3, Mail, Layers, Shield, Clock, Download, Globe,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

gsap.registerPlugin(ScrollTrigger);

const featureGroups = [
  {
    title: 'Event Management',
    icon: Calendar,
    desc: 'Plan and run events of any size — online, in person or hybrid.',
    features: [
      'Unlimited events with dates, venue or meeting link',
      'Capacity limits and registration open / closed',
      'Attendee categories (General, VIP, Speaker…)',
      'Speakers, sponsors and a session schedule',
      'Drafts, duplicating and archiving events',
      'Clear statuses: draft, upcoming, active, completed',
    ],
  },
  {
    title: 'Attendee Registration',
    icon: ClipboardList,
    desc: 'Every attendee in one list — added by you or imported.',
    features: [
      'Add attendees one by one',
      'CSV import with preview, duplicate checks and dry run',
      'Mark attended, absent or cancelled (in bulk too)',
      'Search, filter and export to CSV or Excel',
      'Email attendees directly from the list',
      'Seats freed automatically when someone cancels',
    ],
  },
  {
    title: 'Certificate System',
    icon: Award,
    desc: 'Beautiful certificates your attendees can prove are real.',
    features: [
      '60 designs: 10 layouts × 6 colour themes',
      'Your logo, signature and signatory name',
      'Unique verify code + QR on every certificate',
      'SHA-256 fingerprint and a public verification page',
      'Issue in bulk, or automatically on check-in',
      'Email with PDF attached; revoke and restore',
    ],
  },
  {
    title: 'QR Ticketing',
    icon: QrCode,
    desc: 'Every registration gets a QR ticket for quick check-in.',
    features: [
      'Ticket created automatically for every attendee',
      'Printable PDF tickets, emailed with one click',
      'Camera scanner on any phone or laptop',
      'First scan wins — no double entry',
      'Check-in marks the attendee as attended',
      'Download all tickets as a ZIP',
    ],
  },
  {
    title: 'ID Card Generator',
    icon: IdCard,
    desc: 'Print name badges for attendees in minutes.',
    features: [
      '4 professional templates',
      'Choose which fields to show',
      'Your logo and brand colours',
      'Ticket QR on the badge for check-in',
      '9 cards per A4 sheet, or one per page',
      'Print one, a selection, or the whole event',
    ],
  },
  {
    title: 'Analytics',
    icon: BarChart3,
    desc: 'See how your events perform.',
    features: [
      'Registrations per month',
      'Attendance rate per event',
      'Events by status and category breakdown',
      'Certificates issued over time',
      'Top events by registrations',
      'Download everything as a PDF report',
    ],
  },
  {
    title: 'Email Automation',
    icon: Mail,
    desc: 'The right email at the right moment, sent for you.',
    features: [
      'Tickets and certificates by email, PDF attached',
      'Team invites and account emails',
      'Payment confirmations and renewal reminders',
      'Message attendees from the registration list',
      'Professional, branded email layout',
      'Announcements from the EventoraX team',
    ],
  },
  {
    title: 'Teams & Multi-Tenancy',
    icon: Layers,
    desc: 'One platform, many organizations — each fully separate.',
    features: [
      'Each organization sees only its own data',
      'Admin, Manager and read-only Viewer roles',
      'Invite teammates by email',
      'Your logo and colours everywhere',
      'Activity log of every change',
      'White-label name and custom domain (Enterprise)',
    ],
  },
  {
    title: 'Security',
    icon: Shield,
    desc: 'Built with care for your data.',
    features: [
      'Passwords stored as secure hashes',
      'Account lockout after repeated wrong passwords',
      'Email verification and secure password reset',
      'Log out of all devices with one click',
      'Activity log with time and IP address',
      'Revoked certificates flagged publicly',
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
              { icon: Clock, title: 'Made for Pakistan', desc: 'Prices in PKR, payment by JazzCash, Easypaisa or bank transfer, dates in Pakistan time.' },
              { icon: Download, title: 'Bulk downloads', desc: 'Attendee lists as CSV or Excel, tickets as a ZIP, ID cards and reports as PDF.' },
              { icon: Globe, title: 'White label', desc: 'Enterprise plans can use their own name and a custom domain.' },
              { icon: BarChart3, title: 'REST API', desc: 'Enterprise plans can connect their own systems with API tokens.' },
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
                    <Button asChild variant="default" size="lg">
            <Link to="/register">Start Free Trial</Link>
          </Button>

        </div>
      </section>
    </main>
  );
}