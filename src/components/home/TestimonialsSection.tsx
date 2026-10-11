import type { Testimonial } from '@/types/website';

function initials(name: string) {
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] ?? '') + (parts.length > 1 ? parts[parts.length - 1]![0] : '')).toUpperCase();
}

/** Real quotes added by the superadmin (System settings → Website). Hidden when there are none. */
export default function TestimonialsSection({ items }: { items: Testimonial[] }) {
  if (items.length === 0) return null;
  return (
    <section className="bg-[#faf8ff] section-padding">
      <div className="content-max">
        <h2 className="font-heading text-3xl md:text-5xl font-bold text-center mb-12 md:mb-16 tracking-[-0.02em] text-[#0f172a]">
          What organizers say
        </h2>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {items.map((t) => (
            <figure key={`${t.name}-${t.quote.slice(0, 20)}`} className="flex flex-col rounded-2xl border border-[#e9e4ff] bg-white p-8 shadow-sm">
              <span className="mb-3 font-serif text-4xl leading-none text-[#ddd6fe]" aria-hidden>
                &ldquo;
              </span>
              <blockquote className="mb-6 flex-1 font-heading text-lg italic leading-relaxed text-[#0f172a]">{t.quote}</blockquote>
              <figcaption className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#ede9fe] font-body text-sm font-bold text-[#6d28d9]">{initials(t.name)}</span>
                <span>
                  <span className="block font-body text-sm font-semibold text-[#0f172a]">{t.name}</span>
                  <span className="block font-body text-xs text-[#94a3b8]">{[t.role, t.organization].filter(Boolean).join(', ')}</span>
                </span>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
