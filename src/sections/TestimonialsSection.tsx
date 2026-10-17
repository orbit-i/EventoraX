import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Star, ShieldCheck, Building2, Quote, ArrowRight, MessageSquare } from 'lucide-react';
import { api } from '@/services/api';

interface Testimonial {
  id: number;
  client_name: string;
  organization: string;
  role?: string;
  logo_url?: string;
  rating?: number;
  feedback: string;
  is_featured?: boolean;
}

export default function TestimonialsSection() {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTestimonials = async () => {
      try {
        const res = await api.testimonials.getPublic();
        if (res.success && Array.isArray(res.testimonials)) {
          setTestimonials(res.testimonials);
        }
      } catch (err) {
        console.error('Failed to load testimonials:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchTestimonials();
  }, []);

  return (
    <section id="testimonials" className="bg-[#faf8ff] section-padding overflow-hidden border-t border-[#e9e4ff]/60">
      <div className="content-max px-4">
        <div className="text-center max-w-3xl mx-auto mb-12 md:mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white border border-[#ddd6fe] text-xs font-bold text-[#7c3aed] mb-4 shadow-xs">
            <ShieldCheck className="w-4 h-4 text-[#7c3aed]" />
            Verified Institutional Feedback
          </div>
          <h2 className="font-heading text-3xl md:text-5xl font-bold tracking-[-0.02em] text-[#0f172a] mb-4">
            Trusted by Institutes &amp; Event Organizers
          </h2>
          <p className="font-body text-base md:text-lg text-[#64748b] leading-relaxed">
            Real experiences from educational institutions, technical societies, and conference conveners. We uphold absolute integrity with zero fabricated reviews.
          </p>
        </div>

        {/* Dynamic Reviews or Transparent Zero-Review State */}
        {loading ? (
          <div className="py-16 text-center text-xs text-[#7c3aed] flex items-center justify-center gap-2">
            <div className="w-4 h-4 border-2 border-[#7c3aed] border-t-transparent rounded-full animate-spin" />
            <span>Loading verified institutional feedback...</span>
          </div>
        ) : testimonials.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {testimonials.map((t) => (
              <div
                key={t.id}
                className="bg-white rounded-2xl p-7 border border-[#e9e4ff] shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-1">
                      {[...Array(t.rating || 5)].map((_, idx) => (
                        <Star key={idx} className="w-4 h-4 fill-amber-400 text-amber-400" />
                      ))}
                    </div>
                    <Quote className="w-6 h-6 text-[#ddd6fe]" />
                  </div>

                  <p className="font-body text-sm sm:text-base italic text-[#1e293b] leading-relaxed mb-6">
                    "{t.feedback}"
                  </p>
                </div>

                <div className="flex items-center gap-3.5 pt-4 border-t border-[#f1f5f9]">
                  {t.logo_url ? (
                    <img
                      src={t.logo_url}
                      alt={t.organization}
                      className="w-11 h-11 rounded-xl object-contain bg-[#f8fafc] border border-slate-200 p-1 shrink-0"
                    />
                  ) : (
                    <div className="w-11 h-11 rounded-xl bg-[#f5f3ff] text-[#7c3aed] flex items-center justify-center font-bold text-sm shrink-0 border border-[#e9e4ff]">
                      <Building2 className="w-5 h-5" />
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="font-heading text-sm font-bold text-[#0f172a] truncate">
                      {t.client_name}
                    </p>
                    <p className="font-body text-xs font-semibold text-[#7c3aed] truncate">
                      {t.organization}
                    </p>
                    {t.role && (
                      <p className="font-body text-[11px] text-[#94a3b8] truncate">
                        {t.role}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* Clean, Transparent Institutional Callout Banner (Zero Fake Data) */
          <div className="max-w-3xl mx-auto bg-white rounded-3xl border border-[#e9e4ff] p-8 md:p-12 text-center shadow-sm">
            <div className="w-16 h-16 rounded-2xl bg-[#f5f3ff] text-[#7c3aed] flex items-center justify-center mx-auto mb-5 border border-[#ddd6fe]">
              <MessageSquare className="w-8 h-8" />
            </div>
            <h3 className="text-xl md:text-2xl font-bold text-[#0f172a] mb-3">
              Partner With Eventrye for Your Next Event
            </h3>
            <p className="text-sm md:text-base text-[#64748b] leading-relaxed mb-6 max-w-xl mx-auto">
              We do not publish placeholder or fictitious reviews. Are you an educational institute, professional community, or summit organizer utilizing Eventrye? Partner feedback can be submitted directly through our platform administration.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4">
              <Link to="/contact">
                <button className="bg-[#7c3aed] hover:bg-[#6d28d9] text-white text-sm font-bold px-6 py-3 rounded-xl shadow-md transition-all flex items-center gap-2">
                  <span>Contact Our Team</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </Link>
              <Link to="/register">
                <button className="bg-slate-100 hover:bg-slate-200 text-[#0f172a] text-sm font-semibold px-6 py-3 rounded-xl transition-all">
                  Launch Free Workspace
                </button>
              </Link>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}