import {
  Calendar, Award, QrCode, CreditCard, BarChart3, Mail,
  Users, ShieldCheck, Globe, FileText, Sparkles, Clock,
} from "lucide-react";

const featureSections = [
  {
    icon: Calendar,
    title: "Event Management",
    desc: "Create and manage physical, online, or hybrid events. Set up venues, meeting links, dates, times, categories, and capacity limits. Track event status from draft to archived.",
  },
  {
    icon: Award,
    title: "Certificate System",
    desc: "Choose from 50+ professional certificate templates. Auto-generate certificates for attendees, download as PDF, and verify with SHA-256 hash. Revoke certificates with reason tracking.",
  },
  {
    icon: QrCode,
    title: "QR Ticketing",
    desc: "Every registration auto-generates a unique QR ticket. Use the built-in camera scanner at event entrances to validate tickets and mark attendance instantly.",
  },
  {
    icon: CreditCard,
    title: "ID Card Generator",
    desc: "Generate professional ID cards from 4 templates. Customize with organization logo, attendee photo, and relevant fields. Export as individual or bulk PDF.",
  },
  {
    icon: BarChart3,
    title: "Analytics Dashboard",
    desc: "Comprehensive analytics with monthly registration trends, attendance rates, event status breakdowns, category analysis, and top events by registration count.",
  },
  {
    icon: Mail,
    title: "Email Automation",
    desc: "Automated emails for registration confirmation, certificate issuance, renewal reminders, and expiry warnings. Customizable HTML templates with SMTP configuration.",
  },
  {
    icon: Users,
    title: "Multi-Tenancy",
    desc: "Each organization gets a fully isolated workspace. Manage team members with role-based access (Admin, Manager, Viewer). Plan-based user limits enforced automatically.",
  },
  {
    icon: ShieldCheck,
    title: "Certificate Verification",
    desc: "Public verification page — no login required. Enter the verify code to see certificate details with VERIFIED (green) or INVALID (red) status and SHA-256 hash display.",
  },
  {
    icon: FileText,
    title: "REST API",
    desc: "Enterprise plan includes REST API access with API token management. Integrate EventoraX with your existing systems. Full API documentation provided.",
  },
  {
    icon: Globe,
    title: "Custom Domain & White Label",
    desc: "Enterprise plan supports custom domain setup and white-label branding to replace EventoraX branding with your organization name and logo.",
  },
  {
    icon: Sparkles,
    title: "Speaker & Sponsor Management",
    desc: "Manage per-event speakers with bios, photos, topics. Track sponsors with tier levels (Platinum, Gold, Silver, Bronze) and logo display.",
  },
  {
    icon: Clock,
    title: "Schedule / Agenda",
    desc: "Create detailed event agendas with session times, speakers, locations. Public display option for attendees to view the full schedule.",
  },
];

export default function Features() {
  return (
    <div className="bg-white">
      <section className="py-16 bg-gradient-to-br from-blue-50 to-white text-center">
        <div className="container mx-auto px-4 lg:px-8">
          <h1 className="text-4xl font-bold text-slate-900 mb-4">Platform Features</h1>
          <p className="text-lg text-slate-600 max-w-xl mx-auto">
            Everything you need to manage events from start to finish.
          </p>
        </div>
      </section>

      <section className="py-16">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featureSections.map((f) => (
              <div key={f.title} className="p-6 rounded-xl border border-blue-100 hover:shadow-lg transition-all group">
                <div className="w-12 h-12 rounded-lg bg-blue-50 flex items-center justify-center mb-4 group-hover:bg-blue-100">
                  <f.icon className="h-6 w-6 text-blue-500" />
                </div>
                <h3 className="font-semibold text-slate-800 mb-2">{f.title}</h3>
                <p className="text-sm text-slate-600">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
