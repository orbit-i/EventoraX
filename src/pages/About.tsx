import { useEffect, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Link } from 'react-router-dom';
import {
  Target,
  Eye,
  Lightbulb,
  CreditCard,
  ShieldCheck,
  Award,
  Layers,
  Sparkles,
  Wallet,
  QrCode,
  ArrowRight,
  CheckCircle2,
  Calendar,
  Building2
} from 'lucide-react';
import api from '../services/api';

gsap.registerPlugin(ScrollTrigger);

const problems = [
  {
    icon: CreditCard,
    title: 'Fragmented Local & Global Payments',
    problem: 'Traditional platforms in Pakistan lack native integrations for SBP Raast P2M, JazzCash, and Easypaisa alongside international cards, causing up to 40% attendee drop-offs.',
    solution: 'Eventrye integrates instant local Raast, mobile wallets, and international credit/debit card gateways with automated fee splits and zero checkout drop-off.'
  },
  {
    icon: QrCode,
    title: 'Manual Pass Checks & Ticket Fraud',
    problem: 'Static PDF passes and paper tickets are easily duplicated, forwarded, or screenshotted, causing gate congestion, unauthorized entry, and revenue loss.',
    solution: 'Dynamic, cryptographically signed QR code badges that change dynamically and validate on hardware or mobile scanners in under 200 milliseconds.'
  },
  {
    icon: Award,
    title: 'Tedious Certificate Generation & Verification',
    problem: 'Manually typing, generating, and mailing certificates to hundreds or thousands of attendees takes days, with frequent typos and zero way to verify authenticity.',
    solution: 'Built-in visual Canva-style certificate designer with 1-click batch generation and permanent, tamper-evident SHA-256 public verification URLs (/verify).'
  },
  {
    icon: Layers,
    title: 'Disconnected Tooling Chaos',
    problem: 'Organizers juggle Google Forms, WhatsApp groups, spreadsheets, Mailchimp, and third-party ticket portals, resulting in lost attendee data and operational burnout.',
    solution: 'A unified single-pane operating system covering custom registration forms, ticketing, automated WhatsApp/Email alerts, attendee CRM, and live gate scanning.'
  },
  {
    icon: Sparkles,
    title: 'Zero Brand Identity & Lost Trust',
    problem: 'Generic ticketing directories swallow organizer branding, showing competitor ads and generic receipts instead of promoting the organizer’s true identity.',
    solution: 'Complete multi-tenant isolation with custom organizer subdomains (yourbrand.eventrye.orbit-i.tech), custom logos, brand colors, and white-label receipts.'
  },
  {
    icon: Wallet,
    title: 'Exorbitant Fees & Frozen Revenues',
    problem: 'Legacy platforms charge high 10–15% ticket commissions and freeze organizer funds for weeks, severely hurting event cash flow and vendor deposits.',
    solution: 'Transparent, lowest-in-industry commission tiers (as low as 2.5%), zero hidden charges, and rapid payouts directly to your registered Bank Account or Raast ID.'
  }
];

const milestones = [
  {
    year: 'July 2026',
    title: 'Genesis & Platform Architecture',
    event: 'Eventrye was conceived and architected by ORBIT-I Private Limited. The core multi-tenant microservices engine and cryptographic verification protocols were laid down.'
  },
  {
    year: 'August 2026',
    title: 'Multi-Gateway Financial Rails',
    event: 'Full real-time payment rails went live: SBP Raast P2M Instant Schemes, JazzCash Direct, Easypaisa Open APIs, and Safepay international card processing.'
  },
  {
    year: 'September 2026',
    title: 'Enterprise Deployment & National Summits',
    event: 'Live multi-tenant rollouts across premier tech hackathons, university academic conferences, and medical symposiums. Over 25,000 registrations processed with 99.98% uptime.'
  },
  {
    year: 'October 2026',
    title: 'Canva Design Studio & Public Marketplace',
    event: 'Rolled out the interactive Canva visual certificate & badge design studio, tamper-evident credential verification, and the Self-Service Public Event Marketplace with VIP Showcase tiers.'
  },
  {
    year: 'November 2026 & Beyond',
    title: 'Global Scaling & AI Concierge',
    event: 'Expanding developer PaaS APIs, automated WhatsApp ticketing concierge, AI attendee networking matchmaking, and cross-border organizer payouts across South Asia & MENA.'
  }
];

const fallbackOrbitTeam = [
  {
    id: 1,
    name: 'Abdul Samad Rind',
    role: 'Full Stack Web Developer & Platform Architect',
    department: 'Leadership & Engineering',
    bio: 'Founder & Platform Architect at ORBIT-I Private Limited. Lead Full Stack Web Developer heading Eventrye core distributed multi-tenant engine, high-concurrency event registration pipelines, and tamper-evident credential verification.',
    avatar_url: '',
    display_order: 1
  },
  {
    id: 2,
    name: 'Maria Almani',
    role: 'Full Stack Web Developer, SEO & Content Specialist',
    department: 'Product & Web Growth',
    bio: 'Full Stack Web Developer, SEO Strategist and Technical Content Specialist at ORBIT-I Private Limited. Leading fast-loading frontend architecture, organic search visibility, platform content strategy, and intuitive organizer UX.',
    avatar_url: '',
    display_order: 2
  },
  {
    id: 3,
    name: 'Muhammad Muneeb Ur Rahman Shahzad',
    role: 'DevOps Engineer',
    department: 'DevOps & Systems Infrastructure',
    bio: 'DevOps & Systems Infrastructure Engineer at ORBIT-I Private Limited. Spearheading zero-downtime CI/CD deployment pipelines, Dockerized microservices, high-availability database clustering, and SBP-compliant server hardening.',
    avatar_url: '',
    display_order: 3
  },
  {
    id: 4,
    name: 'Hassan Ansar',
    role: 'Web Developer',
    department: 'Web Development & Engineering',
    bio: 'Web Developer at ORBIT-I Private Limited. Specializing in modern web applications, performant user interfaces, responsive frontends, and dynamic event management workflows.',
    avatar_url: '',
    display_order: 4
  },
  {
    id: 5,
    name: 'Chander Parakash',
    role: 'Backend Developer',
    department: 'Backend Engineering & Distributed Systems',
    bio: 'Backend Developer at ORBIT-I Private Limited. Specializing in high-concurrency Node.js microservices, database query optimization, Redis caching layers, and secure payment webhook pipelines for Eventrye.',
    avatar_url: '',
    display_order: 5
  },
  {
    id: 6,
    name: 'Laiba',
    role: 'Backend Developer',
    department: 'Backend Engineering & Cloud Architecture',
    bio: 'Backend Developer at ORBIT-I Private Limited. Expert in RESTful API architecture, cryptographic ticket verification algorithms, automated batch processing, and scalable cloud database structures for Eventrye.',
    avatar_url: '',
    display_order: 6
  }
];

export default function About() {
  const [teamMembers, setTeamMembers] = useState<any[]>(fallbackOrbitTeam);

  useEffect(() => {
    // Dynamic fetch from backend platform team API
    api.platformTeam.get()
      .then(res => {
        if (res?.success && Array.isArray(res.team) && res.team.length > 0) {
          // Guarantee the 4 foundational members are always displayed
          const officialNames = new Set(fallbackOrbitTeam.map(m => m.name.toLowerCase()));
          const extra = res.team.filter(m => !officialNames.has((m.name || '').toLowerCase()));
          const merged = [...fallbackOrbitTeam, ...extra];
          merged.sort((a, b) => (a.display_order || 0) - (b.display_order || 0));
          setTeamMembers(merged);
        }
      })
      .catch(() => {
        // Fallback remains the official 4-member core team
      });
  }, []);

  useEffect(() => {
    // Smooth reveal animation that never hides content
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

    const reveals = document.querySelectorAll('.scroll-reveal');
    reveals.forEach((el) => {
      gsap.fromTo(
        el,
        { opacity: 0.1, y: 20 },
        {
          opacity: 1,
          y: 0,
          duration: 0.5,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: el,
            start: 'top 92%',
            once: true,
          },
        }
      );
    });

    // Safety fallback: ensure every element is completely visible regardless of scroll
    const fallbackTimer = setTimeout(() => {
      document.querySelectorAll('.scroll-reveal').forEach((el) => {
        (el as HTMLElement).style.opacity = '1';
        (el as HTMLElement).style.transform = 'none';
      });
    }, 800);

    return () => {
      clearTimeout(fallbackTimer);
      ScrollTrigger.getAll().forEach((st) => st.kill());
    };
  }, []);

  return (
    <main className="bg-[#f8fafc] font-body">
      {/* Hero Header */}
      <section className="relative overflow-hidden bg-gradient-to-b from-[#f5f3ff] via-[#ede9fe]/40 to-white py-16 md:py-28 text-center border-b border-[#e2e8f0]">
        <div className="content-max relative z-10">
          <div className="flex flex-wrap items-center justify-center gap-3 mb-6">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-purple-100 text-purple-700 text-xs font-bold uppercase tracking-wider border border-purple-200">
              <Building2 className="w-4 h-4" /> Built &amp; Engineered by ORBIT-I • Nawabshah, Pakistan
            </div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white text-slate-600 text-xs font-medium border border-slate-200 shadow-xs">
              <Calendar className="w-3.5 h-3.5 text-blue-600" />
              <span>Last updated: <strong>October 2026</strong></span>
            </div>
          </div>
          <h1 className="font-heading text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-[-0.03em] mb-6 text-[#0f172a] max-w-4xl mx-auto leading-tight">
            The Modern Operating System for <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#7c3aed] to-[#3b82f6]">Unforgettable Events</span>
          </h1>
          <p className="font-body text-lg md:text-xl max-w-3xl mx-auto text-[#475569] leading-relaxed mb-10">
            Eventrye was conceived to eliminate the friction, fraud, and chaos in event management. From instant local payments and dynamic QR check-ins to visual certificate design and tamper-evident credential verification — everything lives under one powerful platform.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link
              to="/list-event"
              className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl font-heading font-semibold text-white bg-[#7c3aed] hover:bg-[#6d28d9] shadow-lg shadow-[#7c3aed]/25 transition-all duration-200 hover:-translate-y-0.5"
            >
              <Calendar className="w-5 h-5" />
              List Your Event (+ VIP)
            </Link>
            <Link
              to="/features"
              className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl font-heading font-semibold text-[#0f172a] bg-white border border-[#cbd5e1] hover:border-[#7c3aed] hover:text-[#7c3aed] shadow-sm transition-all duration-200"
            >
              Explore Features <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Key Impact Counter Bar */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto mt-16 p-6 rounded-2xl bg-white border border-[#e2e8f0] shadow-sm">
            <div className="text-center p-3">
              <div className="font-heading text-3xl md:text-4xl font-extrabold text-[#7c3aed]">50,000+</div>
              <p className="text-xs sm:text-sm font-medium text-slate-600 mt-1">Registrations Powered</p>
            </div>
            <div className="text-center p-3 border-l border-slate-100">
              <div className="font-heading text-3xl md:text-4xl font-extrabold text-[#2563eb]">99.98%</div>
              <p className="text-xs sm:text-sm font-medium text-slate-600 mt-1">Gateway Uptime & SBP Uptime</p>
            </div>
            <div className="text-center p-3 border-l border-slate-100">
              <div className="font-heading text-3xl md:text-4xl font-extrabold text-[#059669]">100%</div>
              <p className="text-xs sm:text-sm font-medium text-slate-600 mt-1">Tamper-Evident SHA-256 Passes</p>
            </div>
            <div className="text-center p-3 border-l border-slate-100">
              <div className="font-heading text-3xl md:text-4xl font-extrabold text-[#d97706]">500+</div>
              <p className="text-xs sm:text-sm font-medium text-slate-600 mt-1">Summits, Expos & Institutes</p>
            </div>
          </div>
        </div>
      </section>

      {/* Mission, Vision & Core Values */}
      <section className="bg-white py-20 md:py-28 border-b border-[#e2e8f0]">
        <div className="content-max">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-xs font-bold uppercase tracking-wider text-[#7c3aed] bg-purple-50 px-3 py-1 rounded-full border border-purple-200">
              Purpose & Principles
            </span>
            <h2 className="font-heading text-3xl md:text-5xl font-bold tracking-[-0.02em] text-[#0f172a] mt-3">
              Built on Trust, Performance & Innovation
            </h2>
            <p className="font-body text-base md:text-lg text-[#475569] mt-3">
              We believe technology should simplify complexity so organizers can focus on creating unforgettable experiences.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12 mb-12">
            <div className="scroll-reveal bg-[#fdfcff] p-8 md:p-10 rounded-3xl border border-[#e9e4ff] shadow-sm hover:shadow-md transition-all">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-6 bg-[#f5f3ff] text-[#7c3aed]">
                <Target size={28} />
              </div>
              <h3 className="font-heading text-2xl md:text-3xl font-bold mb-4 text-[#0f172a]">Our Mission</h3>
              <p className="font-body text-base leading-relaxed text-[#475569]">
                To empower every event organizer — from student councils and medical associations to multinational tech summits — with unified, automated, and bank-grade infrastructure that makes ticketing, check-in, credential verification, and financial payouts completely effortless.
              </p>
            </div>

            <div className="scroll-reveal bg-[#fdfcff] p-8 md:p-10 rounded-3xl border border-[#e9e4ff] shadow-sm hover:shadow-md transition-all">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-6 bg-[#f5f3ff] text-[#7c3aed]">
                <Eye size={28} />
              </div>
              <h3 className="font-heading text-2xl md:text-3xl font-bold mb-4 text-[#0f172a]">Our Vision</h3>
              <p className="font-body text-base leading-relaxed text-[#475569]">
                To establish Eventrye as the global benchmark for trust in physical and virtual events — where every ticket is fraud-proof, every certificate is cryptographically verifiable, and organizers have full sovereignty over their brand and ticket revenues.
              </p>
            </div>
          </div>

          {/* 4 Core Pillars */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 pt-6">
            <div className="p-6 rounded-2xl bg-white border border-[#e2e8f0] shadow-sm">
              <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center mb-4">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h4 className="font-heading font-bold text-base text-slate-900 mb-2">Cryptographic Trust</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Tamper-evident SHA-256 digital signatures on every credential and badge, preventing counterfeit certificates permanently.
              </p>
            </div>
            <div className="p-6 rounded-2xl bg-white border border-[#e2e8f0] shadow-sm">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-4">
                <Wallet className="w-5 h-5" />
              </div>
              <h4 className="font-heading font-bold text-base text-slate-900 mb-2">Payment Freedom</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Seamless support for SBP Raast P2M, JazzCash, Easypaisa, and international credit cards with transparent low commissions.
              </p>
            </div>
            <div className="p-6 rounded-2xl bg-white border border-[#e2e8f0] shadow-sm">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-4">
                <Layers className="w-5 h-5" />
              </div>
              <h4 className="font-heading font-bold text-base text-slate-900 mb-2">Organizer Sovereignty</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Dedicated multi-tenant portals, custom subdomains, white-label receipts, and zero intrusive third-party advertisements.
              </p>
            </div>
            <div className="p-6 rounded-2xl bg-white border border-[#e2e8f0] shadow-sm">
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center mb-4">
                <Sparkles className="w-5 h-5" />
              </div>
              <h4 className="font-heading font-bold text-base text-slate-900 mb-2">Canva Visual Studio</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Drag-and-drop badge and certificate customization directly in the browser with automated batch recipient merging.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* The Problem We Solve */}
      <section className="bg-[#f5f3ff] py-20 md:py-28 border-b border-[#e9e4ff]">
        <div className="content-max">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-xs font-bold uppercase tracking-wider text-[#7c3aed] bg-purple-100 px-3 py-1 rounded-full border border-purple-200">
              The Real-World Challenges
            </span>
            <h2 className="font-heading text-3xl md:text-5xl font-bold text-center tracking-[-0.02em] text-[#0f172a] mt-3">
              The Problems We Solve
            </h2>
            <p className="font-body text-base md:text-lg text-[#475569] mt-3">
              Event planners lose thousands of hours and critical revenue to outdated spreadsheets, fake tickets, and disjointed tools. Here is how Eventrye transforms the experience:
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {problems.map((p, i) => {
              const Icon = p.icon;
              return (
                <div
                  key={i}
                  className="scroll-reveal bg-white rounded-3xl p-8 border border-[#e9e4ff] shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between"
                >
                  <div>
                    <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-6 bg-[#f5f3ff] text-[#7c3aed] shadow-sm">
                      <Icon size={24} />
                    </div>
                    <h4 className="font-heading text-xl font-bold mb-3 text-[#0f172a]">{p.title}</h4>
                    
                    <div className="mb-4">
                      <p className="text-xs font-bold uppercase tracking-wider text-rose-600 mb-1">The Problem</p>
                      <p className="font-body text-sm text-[#475569] leading-relaxed">{p.problem}</p>
                    </div>
                  </div>

                  <div className="pt-4 mt-2 border-t border-purple-100">
                    <p className="text-xs font-bold uppercase tracking-wider text-purple-700 mb-1 flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Eventrye Solution
                    </p>
                    <p className="font-body text-sm font-medium text-slate-800 leading-relaxed">{p.solution}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Our Journey (July 2026 Onwards) */}
      <section className="bg-white py-20 md:py-28 border-b border-[#e2e8f0]">
        <div className="content-max">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-xs font-bold uppercase tracking-wider text-[#7c3aed] bg-purple-50 px-3 py-1 rounded-full border border-purple-200">
              Milestones & Roadmap
            </span>
            <h2 className="font-heading text-3xl md:text-5xl font-bold tracking-[-0.02em] text-[#0f172a] mt-3">
              Our Journey
            </h2>
            <p className="font-body text-base md:text-lg text-[#475569] mt-3">
              Launched in July 2026 by ORBIT-I Private Limited, Eventrye is rapidly scaling as the primary backbone for premier summits and conferences.
            </p>
          </div>

          <div className="max-w-4xl mx-auto relative pl-4 md:pl-0">
            <div className="space-y-8">
              {milestones.map((m, i) => (
                <div key={i} className="scroll-reveal flex gap-6 md:gap-10 items-start group">
                  <div className="flex flex-col items-center">
                    <div className="w-5 h-5 rounded-full flex-shrink-0 bg-[#7c3aed] ring-8 ring-[#f5f3ff] group-hover:scale-110 transition-transform" />
                    {i < milestones.length - 1 && (
                      <div className="w-0.5 h-24 sm:h-20 bg-purple-100 mt-2" />
                    )}
                  </div>
                  <div className="bg-[#fbfaff] p-6 sm:p-7 rounded-2xl border border-purple-100 shadow-sm flex-1 hover:shadow-md transition-shadow">
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                      <span className="px-3 py-1 rounded-lg bg-purple-100 text-purple-700 font-heading text-sm font-bold">
                        {m.year}
                      </span>
                      <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                        {m.title}
                      </span>
                    </div>
                    <p className="font-body text-sm sm:text-base text-[#1e293b] font-medium leading-relaxed">
                      {m.event}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Leadership & Core Platform Team */}
      <section className="bg-[#f5f3ff] py-20 md:py-28 border-b border-[#e9e4ff]">
        <div className="content-max">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-purple-100 text-purple-700 rounded-full text-xs font-bold uppercase tracking-wider mb-3 border border-purple-200">
              <Building2 className="w-3.5 h-3.5" /> ORBIT-I Core Platform Team
            </div>
            <h2 className="font-heading text-3xl md:text-5xl font-bold tracking-[-0.02em] text-[#0f172a]">
              Meet the Leadership & Core Team
            </h2>
            <p className="font-body text-base md:text-lg text-[#475569] mt-3">
              Engineered, secured, and scaled by the core engineers and visionary leadership of ORBIT-I Private Limited.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto items-stretch">
            {teamMembers.map((member, i) => (
              <div
                key={member.id || i}
                className="scroll-reveal bg-white rounded-3xl p-7 border border-[#e9e4ff] shadow-sm hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 flex flex-col items-center text-center group"
              >
                <div className="relative mb-5">
                  {member.avatar_url ? (
                    <img
                      src={member.avatar_url}
                      alt={member.name}
                      className="w-24 h-24 rounded-2xl object-cover shadow-md group-hover:scale-105 transition-transform"
                    />
                  ) : (
                    <div className="w-24 h-24 rounded-2xl bg-gradient-to-tr from-[#7c3aed] to-[#3b82f6] text-white flex items-center justify-center font-bold text-2xl shadow-md group-hover:scale-105 transition-transform">
                      {member.name.split(' ').map((n: string) => n[0]).filter(Boolean).slice(0, 2).join('')}
                    </div>
                  )}
                  <span className="absolute -bottom-2 -right-2 px-2.5 py-0.5 bg-slate-900 text-purple-300 text-[10px] font-bold rounded-md uppercase tracking-wider border border-purple-500/30">
                    ORBIT-I
                  </span>
                </div>

                <h4 className="font-heading text-lg font-bold text-[#0f172a] mb-1 group-hover:text-purple-700 transition-colors">
                  {member.name}
                </h4>

                <div className="text-xs font-semibold text-purple-600 mb-2 leading-snug">
                  {member.role}
                </div>

                {member.department && (
                  <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-4 px-2.5 py-0.5 rounded-full bg-slate-100">
                    {member.department}
                  </div>
                )}

                {member.bio && (
                  <p className="font-body text-xs text-slate-600 leading-relaxed mt-auto pt-4 border-t border-slate-100">
                    {member.bio}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA: Host & List Event */}
      <section className="bg-white py-20 md:py-28 text-center">
        <div className="content-max">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6 bg-[#f5f3ff] text-[#7c3aed]">
            <Lightbulb size={32} />
          </div>
          <h2 className="font-heading text-3xl md:text-5xl font-bold mb-4 tracking-[-0.02em] text-[#0f172a]">
            Ready to Host or List Your Next Event?
          </h2>
          <p className="font-body text-base md:text-lg max-w-2xl mx-auto mb-8 text-[#475569] leading-relaxed">
            Get your event published on our marketplace with VIP showcase perks, direct multi-gateway ticket payments, and automatic commission payouts.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link
              to="/list-event"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-xl font-heading font-bold text-white bg-[#7c3aed] hover:bg-[#6d28d9] shadow-lg shadow-[#7c3aed]/30 transition-all duration-200 hover:-translate-y-0.5"
            >
              <Calendar className="w-5 h-5" />
              List Your Event Now (+ VIP Showcase)
            </Link>
            <Link
              to="/register"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-xl font-heading font-bold text-[#0f172a] bg-slate-100 hover:bg-slate-200 transition-all duration-200"
            >
              Create Free Organizer Account
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}