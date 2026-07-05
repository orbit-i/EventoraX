import { Building2, GraduationCap, Briefcase, Heart, Landmark, Cpu } from 'lucide-react';

const logos = [
  { icon: GraduationCap, label: 'Harvard University' },
  { icon: Building2, label: 'TechCorp Inc.' },
  { icon: Heart, label: 'GlobalHealth NGO' },
  { icon: Cpu, label: 'NexGen Technologies' },
  { icon: Landmark, label: 'GovTech Solutions' },
  { icon: Briefcase, label: 'EduWorld Academy' },
];

export default function TrustedBySection() {
  return (
    <section className="bg-white py-16 md:py-20 border-y border-[#e9e4ff]">
      <div className="content-max text-center">
        <p className="font-body text-sm uppercase tracking-[0.1em] mb-8 text-[#7c3aed] font-semibold">
          Trusted by universities, companies &amp; NGOs
        </p>
        <div className="flex flex-wrap items-center justify-center gap-6 md:gap-12">
          {logos.map((logo, i) => {
            const Icon = logo.icon;
            return (
              <div
                key={i}
                className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl opacity-60 hover:opacity-100 hover:bg-[#f5f3ff] transition-all duration-300 cursor-default"
              >
                <Icon size={24} strokeWidth={1.5} className="text-[#7c3aed]" />
                <span className="font-body text-sm font-medium text-[#64748b] hidden md:inline">
                  {logo.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}