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
    <section className="bg-[#F5FAFF] section-padding">
      <div className="content-max">
        <h2
          className="font-heading text-3xl md:text-5xl font-medium text-center mb-12 md:mb-16 tracking-[-0.02em]"
          style={{ color: '#1B2A4A' }}
        >
          Everything you need to run
          <br />
          unforgettable events
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
          {features.map((feature, i) => {
            const Icon = feature.icon;
            return (
              <div
                key={i}
                className="scroll-reveal bg-white border rounded-3xl p-7 md:p-8 transition-all duration-300 hover:-translate-y-1"
                style={{ borderColor: '#E8F4FD' }}
              >
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center mb-5 transition-all duration-300 hover:scale-105"
                  style={{ backgroundColor: '#CCE5FF', color: '#4A9CFF' }}
                >
                  <Icon size={24} />
                </div>
                <h3
                  className="font-heading text-xl font-medium mb-2"
                  style={{ color: '#1B2A4A' }}
                >
                  {feature.title}
                </h3>
                <p className="font-body text-sm leading-relaxed" style={{ color: '#A0B4CC' }}>
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
