import {
  Calendar,
  ClipboardList,
  Award,
  QrCode,
  IdCard,
  BarChart3,
  Mail,
  Layers,
} from 'lucide-react';

const features = [
  {
    icon: Calendar,
    title: 'Event Management',
    desc: 'Plan, schedule, and manage events of any size with intuitive tools.',
  },
  {
    icon: ClipboardList,
    title: 'Attendee Registration',
    desc: 'Custom registration forms with automated confirmation emails.',
  },
  {
    icon: Award,
    title: 'Certificates',
    desc: 'Auto-generate and send branded certificates with verification codes.',
  },
  {
    icon: QrCode,
    title: 'QR Ticketing',
    desc: 'Digital tickets with QR codes for seamless check-in.',
  },
  {
    icon: IdCard,
    title: 'ID Card Generator',
    desc: 'Design and print professional ID cards for participants.',
  },
  {
    icon: BarChart3,
    title: 'Analytics Dashboard',
    desc: 'Real-time insights on registrations, attendance, and engagement.',
  },
  {
    icon: Mail,
    title: 'Email Automation',
    desc: 'Automated reminders, confirmations, and follow-ups.',
  },
  {
    icon: Layers,
    title: 'Multi-Tenancy',
    desc: 'One platform, multiple organizations — fully isolated.',
  },
];

export default function FeaturesSection() {
  return (
    <section className="bg-[#f3f0ff] section-padding">
      <div className="content-max">
        <h2 className="font-heading text-3xl md:text-5xl font-bold text-center mb-12 md:mb-16 tracking-[-0.02em] text-[#0f172a]">
          Everything you need to run
          <br />
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#7c3aed] to-[#a78bfa]">
            unforgettable events
          </span>
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
          {features.map((feature, i) => {
            const Icon = feature.icon;
            return (
              <div
                key={i}
                className="scroll-reveal bg-white border border-[#e9e4ff] rounded-2xl p-7 md:p-8 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-[#7c3aed]/10"
                style={{ transitionDelay: `${(i % 4) * 75}ms` }}
              >
                <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-5 bg-[#f5f3ff] text-[#7c3aed] transition-all duration-300 hover:scale-110 hover:bg-[#ede9fe]">
                  <Icon size={24} />
                </div>
                <h3 className="font-heading text-xl font-semibold mb-2 text-[#0f172a]">
                  {feature.title}
                </h3>
                <p className="font-body text-sm leading-relaxed text-[#475569]">
                  {feature.desc}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}