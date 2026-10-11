import { Building2, GraduationCap, Briefcase, Heart, Landmark, Cpu } from 'lucide-react';

const sectors = [
  { icon: GraduationCap, label: 'Colleges & Universities' },
  { icon: Cpu, label: 'Hackathons & Tech Summits' },
  { icon: Building2, label: 'Corporate Conferences' },
  { icon: Briefcase, label: 'Training Institutes' },
  { icon: Heart, label: 'NGOs & Non-Profits' },
  { icon: Landmark, label: 'Professional Associations' },
];

export default function TrustedBySection() {
  return (
    <section className="bg-white py-14 md:py-16 border-y border-[#e9e4ff]">
      <div className="content-max text-center">
        <p className="font-body text-xs md:text-sm uppercase tracking-[0.12em] mb-8 text-[#7c3aed] font-bold">
          Engineered for Modern Event Organizers &amp; Institutions
        </p>
        <div className="flex flex-wrap items-center justify-center gap-4 md:gap-8">
          {sectors.map((sector, i) => {
            const Icon = sector.icon;
            return (
              <div
                key={i}
                className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl border border-slate-100 bg-slate-50/60 hover:bg-[#f5f3ff] hover:border-purple-200 transition-all duration-300"
              >
                <Icon size={20} strokeWidth={1.8} className="text-[#7c3aed]" />
                <span className="font-body text-xs md:text-sm font-semibold text-slate-700">
                  {sector.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}