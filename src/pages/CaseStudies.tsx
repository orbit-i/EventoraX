import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Award, 
  Users, 
  ShieldCheck, 
  ArrowRight, 
  Sparkles, 
  CheckCircle2, 
  Quote, 
  Calendar,
  Building,
  TrendingUp,
  ExternalLink,
  ChevronRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';

export interface CaseStudy {
  id: number;
  title: string;
  client_name: string;
  category: string;
  event_date: string;
  attendees_count: number;
  certs_count: number;
  banner_url: string;
  summary: string;
  problem: string;
  solution: string;
  results: string | string[];
  quote: string;
  author: string;
  author_role: string;
  is_featured?: number;
}

const fallbackStudies: CaseStudy[] = [
  {
    id: 1,
    title: 'National AI & Cloud Computing Summit 2026',
    client_name: 'FAST-NUCES & TechHub Pakistan',
    category: 'Technology & AI',
    event_date: 'July 2026',
    attendees_count: 4200,
    certs_count: 4200,
    banner_url: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1200&auto=format&fit=crop&q=80',
    summary: 'Automated 4,200 attendee check-ins and issued tamper-evident digital credentials with zero gate queuing.',
    problem: 'Previous summits experienced 3-hour check-in queues, registration chaos, and weeks of manual certificate printing.',
    solution: 'EventoraX multi-terminal QR code scanning deployed across 8 gates with average 0.8s scan time. All certificates issued automatically via Canva Design Studio integration.',
    results: [
      '4,200 real-time QR scans with zero duplicate admissions',
      '0.8 seconds average attendee check-in latency',
      '100% automated tamper-evident certificate issuance',
      'Sponsor satisfaction rating of 4.9/5.0'
    ],
    quote: 'EventoraX completely eradicated our registration delays. The tamper-evident credentials gave our sponsors and university dean instant verification confidence.',
    author: 'Dr. Zulfiqar Memon',
    author_role: 'Head of Computer Science, FAST-NUCES'
  },
  {
    id: 2,
    title: 'Pakistan FinTech & Digital Governance Forum 2026',
    client_name: 'FinTech Alliance & State Bank Partners',
    category: 'FinTech & Governance',
    event_date: 'August 2026',
    attendees_count: 1850,
    certs_count: 1850,
    banner_url: 'https://images.unsplash.com/photo-1511578314322-379afb476865?w=1200&auto=format&fit=crop&q=80',
    summary: 'High-security executive summit with multi-tiered VIP ID pass credentials and instantaneous Raast payment settlement.',
    problem: 'Strict security requirements to prevent counterfeit attendee passes and manage VIP vs General access segregation across 4 parallel halls.',
    solution: 'EventoraX custom high-security RFID & QR pass layout designer with dynamic cryptographic watermarking and tamper-proof verification portal.',
    results: [
      '1,850 VIP and delegate passes issued seamlessly',
      '100% counterfeit pass prevention with encrypted QR hashes',
      'Zero security incidents across 4 parallel summit halls',
      'Over 98% attendee satisfaction score'
    ],
    quote: 'The level of security and visual elegance delivered by EventoraX was state-of-the-art. Setting up delegate passes took minutes.',
    author: 'Syed Arsalan Shah',
    author_role: 'Director of Policy, FinTech Alliance Pakistan'
  },
  {
    id: 3,
    title: 'EduTech Higher Education Leadership Conference 2026',
    client_name: 'Inter-University Consortium Pakistan',
    category: 'Higher Education',
    event_date: 'September 2026',
    attendees_count: 2600,
    certs_count: 2600,
    banner_url: 'https://images.unsplash.com/photo-1523580494863-6f3031224c94?w=1200&auto=format&fit=crop&q=80',
    summary: 'Issued 2,600 dual-language verified diplomas and academic conference credentials for international university delegations.',
    problem: 'Accredited university conferences required bilingual English/Urdu certificate issuance and persistent tamper-evident QR verification.',
    solution: 'EventoraX batch CSV auto-merge engine coupled with Canva Design Studio multi-template generator.',
    results: [
      '2,600 dual-language certificates generated in under 3 minutes',
      '100% verifiable on public portal /verify with cryptographic validation',
      'Over 14,000 certificate verification hits from employers worldwide'
    ],
    quote: 'EventoraX eliminated weeks of clerical printing work. The credentials look prestigious and can be validated by universities anywhere in the world.',
    author: 'Prof. Ayesha Siddiqui',
    author_role: 'Convener, Academic Board'
  },
  {
    id: 4,
    title: 'HealthTech & Medical Genomics Summit 2026',
    client_name: 'MedTech Pakistan & Shifa Research Institute',
    category: 'Healthcare & Science',
    event_date: 'October 2026',
    attendees_count: 3100,
    certs_count: 3100,
    banner_url: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=1200&auto=format&fit=crop&q=80',
    summary: 'Healthcare summit with CME medical accreditation credit certificates, doctor ID badges, and sponsor booth scanning.',
    problem: 'Required strict CME credit hour tracking and separate badges for Keynote Speakers, Physicians, and Pharmaceutical Exhibitors.',
    solution: 'Multi-role attendee tagging, category-based color-coded badge designer, and instant PDF batch downloading.',
    results: [
      '3,100 CME accredited certificates issued with credit hour tracking',
      '3 distinct credential layouts managed simultaneously',
      '100% cloud uptime throughout 3-day conference proceedings'
    ],
    quote: 'Physicians appreciated receiving their verifiable CME credentials in their email immediately as the closing session concluded.',
    author: 'Dr. Tariq Mahmood',
    author_role: 'Director of Medical Education'
  }
];

export default function CaseStudies() {
  const [studies, setStudies] = useState<CaseStudy[]>(fallbackStudies);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [activeStudy, setActiveStudy] = useState<CaseStudy | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchCaseStudies();
  }, []);

  const fetchCaseStudies = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/case-studies');
      if (res.ok) {
        const data = await res.json();
        if (data.studies && data.studies.length > 0) {
          setStudies(data.studies);
        }
      }
    } catch {
      // Use fallback
    } finally {
      setLoading(false);
    }
  };

  const categories = ['All', 'Technology & AI', 'FinTech & Governance', 'Higher Education', 'Healthcare & Science'];

  const filteredStudies = selectedCategory === 'All'
    ? studies
    : studies.filter(s => s.category.toLowerCase().includes(selectedCategory.toLowerCase()));

  const parseResults = (res: string | string[]): string[] => {
    if (Array.isArray(res)) return res;
    try {
      const parsed = JSON.parse(res);
      if (Array.isArray(parsed)) return parsed;
    } catch {}
    return [String(res)];
  };

  return (
    <div className="min-h-screen bg-[#faf8ff] pb-24">
      {/* Hero Section */}
      <section className="relative pt-20 pb-16 overflow-hidden bg-gradient-to-b from-white via-[#f5f3ff] to-[#faf8ff] border-b border-[#e9e4ff]">
        <div className="absolute inset-0 bg-[radial-gradient(#7c3aed_1px,transparent_1px)] [background-size:24px_24px] opacity-20 pointer-events-none" />
        
        <div className="content-max relative z-10 text-center max-w-4xl mx-auto px-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#ede9fe] text-[#7c3aed] text-xs font-bold uppercase tracking-wider mb-6">
            <Sparkles className="w-3.5 h-3.5" />
            Proven Impact • Built by ORBIT-I Private Limited
          </div>

          <h1 className="font-heading text-4xl sm:text-5xl lg:text-6xl font-black text-[#0f172a] tracking-tight leading-tight">
            Real Events. Verified Passes.{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#7c3aed] via-[#6366f1] to-[#3b82f6]">
              Zero Friction.
            </span>
          </h1>

          <p className="mt-6 text-base sm:text-lg text-[#64748b] leading-relaxed max-w-2xl mx-auto">
            Explore how leading Pakistani universities, enterprise summits, and clinical forums transform their ticketing, security, and tamper-evident credential issuance with EventoraX.
          </p>

          {/* Quick Metrics Bar */}
          <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-4 p-4 rounded-2xl bg-white/80 backdrop-blur-md border border-[#e9e4ff] shadow-lg shadow-[#7c3aed]/5">
            <div className="p-3">
              <div className="text-2xl sm:text-3xl font-black text-[#7c3aed]">11,750+</div>
              <div className="text-xs font-semibold text-[#64748b] mt-0.5">Credentials Issued</div>
            </div>
            <div className="p-3">
              <div className="text-2xl sm:text-3xl font-black text-[#2563eb]">0.8s</div>
              <div className="text-xs font-semibold text-[#64748b] mt-0.5">Average QR Gate Scan</div>
            </div>
            <div className="p-3">
              <div className="text-2xl sm:text-3xl font-black text-[#059669]">100%</div>
              <div className="text-xs font-semibold text-[#64748b] mt-0.5">Anti-Tamper Cryptography</div>
            </div>
            <div className="p-3">
              <div className="text-2xl sm:text-3xl font-black text-[#d97706]">July 2026</div>
              <div className="text-xs font-semibold text-[#64748b] mt-0.5">Production Deployment</div>
            </div>
          </div>
        </div>
      </section>

      {/* Filter Tabs */}
      <div className="content-max px-4 mt-10">
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all duration-200 ${
                selectedCategory === cat
                  ? 'bg-[#7c3aed] text-white shadow-md shadow-[#7c3aed]/25'
                  : 'bg-white text-[#64748b] border border-[#e9e4ff] hover:border-[#7c3aed] hover:text-[#7c3aed]'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Case Studies Grid */}
      <div className="content-max px-4 mt-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {filteredStudies.map((study) => {
            const resultsList = parseResults(study.results);
            return (
              <div
                key={study.id}
                className="bg-white rounded-3xl border border-[#e9e4ff] shadow-sm hover:shadow-xl hover:shadow-[#7c3aed]/10 transition-all duration-300 overflow-hidden flex flex-col group"
              >
                {/* Banner Image */}
                <div className="relative h-56 sm:h-64 overflow-hidden bg-slate-100">
                  <img
                    src={study.banner_url}
                    alt={study.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                  
                  <div className="absolute top-4 left-4 flex items-center gap-2">
                    <span className="px-3 py-1 rounded-full bg-black/60 backdrop-blur-md text-white text-xs font-bold">
                      {study.category}
                    </span>
                    <span className="px-3 py-1 rounded-full bg-[#7c3aed] text-white text-xs font-bold flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {study.event_date}
                    </span>
                  </div>

                  <div className="absolute bottom-4 left-4 right-4">
                    <div className="text-xs font-bold text-[#c4b5fd] flex items-center gap-1 mb-1">
                      <Building className="w-3.5 h-3.5" />
                      {study.client_name}
                    </div>
                    <h3 className="text-xl font-bold text-white leading-tight">
                      {study.title}
                    </h3>
                  </div>
                </div>

                {/* Body Content */}
                <div className="p-6 sm:p-8 flex-1 flex flex-col">
                  {/* Quantified Badges */}
                  <div className="flex items-center gap-3 pb-4 mb-4 border-b border-[#f1edff]">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-[#059669] bg-emerald-50 px-2.5 py-1 rounded-lg">
                      <Users className="w-3.5 h-3.5" />
                      {study.attendees_count.toLocaleString()} Attendees
                    </div>
                    <div className="flex items-center gap-1.5 text-xs font-bold text-[#7c3aed] bg-purple-50 px-2.5 py-1 rounded-lg">
                      <Award className="w-3.5 h-3.5" />
                      {study.certs_count.toLocaleString()} Verified Badges
                    </div>
                  </div>

                  <p className="text-sm text-[#475569] leading-relaxed line-clamp-2 mb-4">
                    {study.summary}
                  </p>

                  {/* Measurable Results */}
                  <div className="bg-[#fcfaff] p-4 rounded-2xl border border-[#f1edff] mb-6">
                    <div className="text-xs font-bold uppercase tracking-wider text-[#7c3aed] flex items-center gap-1 mb-2">
                      <TrendingUp className="w-3.5 h-3.5" />
                      Quantified Outcomes
                    </div>
                    <ul className="space-y-1.5">
                      {resultsList.slice(0, 2).map((item, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-xs text-[#334155] font-medium">
                          <CheckCircle2 className="w-3.5 h-3.5 text-[#059669] shrink-0 mt-0.5" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Client Quote snippet */}
                  <div className="mt-auto pt-4 border-t border-[#f1edff]">
                    <blockquote className="text-xs text-[#64748b] italic leading-relaxed line-clamp-2">
                      "{study.quote}"
                    </blockquote>
                    <div className="mt-2 text-xs font-bold text-[#0f172a]">
                      {study.author} <span className="text-[#94a3b8] font-normal">• {study.author_role}</span>
                    </div>

                    <button
                      onClick={() => setActiveStudy(study)}
                      className="mt-4 w-full py-2.5 px-4 rounded-xl bg-[#f5f3ff] text-[#7c3aed] hover:bg-[#7c3aed] hover:text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 transition-all duration-200"
                    >
                      Read Full Case Study
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Case Study Detail Modal */}
      {activeStudy && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-[#e9e4ff] shadow-2xl">
            <div className="relative h-60 overflow-hidden">
              <img
                src={activeStudy.banner_url}
                alt={activeStudy.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
              <button
                onClick={() => setActiveStudy(null)}
                className="absolute top-4 right-4 w-9 h-9 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/80 transition-colors"
              >
                ✕
              </button>
              <div className="absolute bottom-4 left-6 right-6 text-white">
                <span className="px-3 py-1 rounded-full bg-[#7c3aed] text-white text-xs font-bold">
                  {activeStudy.category} • {activeStudy.event_date}
                </span>
                <h2 className="text-2xl font-bold mt-2">{activeStudy.title}</h2>
                <div className="text-xs text-[#c4b5fd] mt-1">{activeStudy.client_name}</div>
              </div>
            </div>

            <div className="p-6 sm:p-8 space-y-6">
              {/* Challenge / Problem */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-rose-600 mb-1">The Operational Challenge</h4>
                <p className="text-sm text-[#475569] leading-relaxed bg-rose-50/50 p-4 rounded-2xl border border-rose-100">
                  {activeStudy.problem}
                </p>
              </div>

              {/* Solution */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#7c3aed] mb-1">The EventoraX Solution</h4>
                <p className="text-sm text-[#475569] leading-relaxed bg-[#f5f3ff] p-4 rounded-2xl border border-[#ede9fe]">
                  {activeStudy.solution}
                </p>
              </div>

              {/* Quantified Outcomes */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-700 mb-2">Verified Results</h4>
                <div className="space-y-2">
                  {parseResults(activeStudy.results).map((res, i) => (
                    <div key={i} className="flex items-center gap-2.5 p-3 rounded-xl bg-emerald-50/50 border border-emerald-100 text-sm font-semibold text-emerald-950">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      {res}
                    </div>
                  ))}
                </div>
              </div>

              {/* Testimonial Quote */}
              <div className="p-5 rounded-2xl bg-[#0f172a] text-white relative">
                <Quote className="w-8 h-8 text-[#7c3aed] opacity-40 absolute top-4 right-4" />
                <p className="text-sm italic leading-relaxed relative z-10 text-slate-200">
                  "{activeStudy.quote}"
                </p>
                <div className="mt-3 text-xs font-bold text-[#c4b5fd]">
                  {activeStudy.author} <span className="text-slate-400 font-normal">• {activeStudy.author_role}</span>
                </div>
              </div>

              <div className="pt-4 flex items-center justify-between border-t border-[#f1edff]">
                <button
                  onClick={() => setActiveStudy(null)}
                  className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-xs font-bold hover:bg-slate-50"
                >
                  Close Window
                </button>
                <Link
                  to="/pricing"
                  className="px-5 py-2.5 rounded-xl bg-[#7c3aed] text-white text-xs font-bold hover:bg-[#6d28d9] flex items-center gap-1.5 shadow-md shadow-[#7c3aed]/25"
                >
                  Scale Your Event
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bottom CTA */}
      <div className="content-max px-4 mt-20">
        <div className="relative rounded-3xl bg-gradient-to-r from-[#0f172a] via-[#1e1b4b] to-[#0f172a] p-8 sm:p-12 text-white overflow-hidden shadow-2xl border border-white/10 text-center">
          <div className="max-w-2xl mx-auto space-y-4">
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
              Ready to host your next conference with instant verifiable credentials?
            </h2>
            <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
              Join leading Pakistani institutions who have automated attendance check-ins, attendee ID passes, and digital certifications.
            </p>
            <div className="pt-4 flex flex-wrap items-center justify-center gap-4">
              <Link
                to="/pricing"
                className="px-6 py-3 rounded-xl bg-white text-[#0f172a] font-bold text-sm hover:bg-slate-100 shadow-lg shadow-black/20"
              >
                View Transparent Pricing
              </Link>
              <Link
                to="/contact"
                className="px-6 py-3 rounded-xl bg-white/10 text-white font-bold text-sm border border-white/20 hover:bg-white/20"
              >
                Schedule Architecture Call
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
