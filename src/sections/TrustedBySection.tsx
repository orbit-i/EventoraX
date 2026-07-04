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
    <section className="bg-white py-16 md:py-20">
      <div className="content-max text-center">
        <p
          className="font-body text-sm uppercase tracking-[0.1em] mb-8"
          style={{ color: '#A0B4CC' }}
        >
          Trusted by universities, companies &amp; NGOs
        </p>
        <div className="flex flex-wrap items-center justify-center gap-8 md:gap-16">
          {logos.map((logo, i) => {
            const Icon = logo.icon;
            return (
              <div
                key={i}
                className="flex items-center gap-2 opacity-40 hover:opacity-70 transition-opacity duration-300"
              >
                <Icon size={28} strokeWidth={1.5} color="#1B2A4A" />
                <span className="font-body text-sm text-[#1B2A4A] hidden md:inline">
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
