import type { TrustedLogo } from '@/types/website';

/** Logo wall — only real organizations the superadmin added (System settings → Website). Hidden when empty. */
export default function TrustedBySection({ logos }: { logos: TrustedLogo[] }) {
  if (logos.length === 0) return null;
  return (
    <section className="bg-white py-16 md:py-20 border-y border-[#e9e4ff]">
      <div className="content-max text-center">
        <p className="font-body text-sm uppercase tracking-[0.1em] mb-8 text-[#7c3aed] font-semibold">
          Trusted by universities, companies &amp; NGOs
        </p>
        <div className="flex flex-wrap items-center justify-center gap-6 md:gap-10">
          {logos.map((logo) => (
            <div key={logo.name} className="flex items-center gap-2.5 rounded-xl px-4 py-2.5 opacity-70 transition-all duration-300 hover:bg-[#f5f3ff] hover:opacity-100" title={logo.name}>
              {logo.logoUrl ? (
                <img src={logo.logoUrl} alt={logo.name} className="h-10 max-w-[140px] object-contain" loading="lazy" />
              ) : (
                <span className="font-body text-sm font-semibold text-[#475569]">{logo.name}</span>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
