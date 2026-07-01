import { Link } from "react-router";
import { Button } from "@/components/ui/button";
import {
  Calendar,
  Award,
  Ticket,
  BarChart3,
  Mail,
  Users,
  ShieldCheck,
  QrCode,
  Check,
  ArrowRight,
  Quote,
  HelpCircle,
  Building2,
  Globe,
  GraduationCap,
} from "lucide-react";

const features = [
  { icon: Calendar, title: "Event Management", desc: "Create, manage, and track events with ease. Physical, online, or hybrid events supported." },
  { icon: Award, title: "Digital Certificates", desc: "50+ professional templates with PDF export and SHA-256 verification." },
  { icon: Ticket, title: "QR Ticketing", desc: "Auto-generated QR tickets with camera-based scanner for attendance." },
  { icon: QrCode, title: "ID Card Generator", desc: "4 professional ID card templates with PDF export for participants." },
  { icon: BarChart3, title: "Analytics Dashboard", desc: "Comprehensive analytics with charts, reports, and export options." },
  { icon: Mail, title: "Email Automation", desc: "Automated emails for confirmation, certificates, reminders, and more." },
  { icon: Users, title: "Multi-Tenancy", desc: "Each organization gets isolated workspace with team management." },
  { icon: ShieldCheck, title: "Certificate Verification", desc: "Public verification page with unique verify code and SHA-256 hash." },
];

const stats = [
  { label: "Events Hosted", value: "10,000+" },
  { label: "Certificates Issued", value: "50,000+" },
  { label: "Organizations", value: "500+" },
  { label: "Attendees Managed", value: "100,000+" },
];

const steps = [
  { num: "01", title: "Sign Up", desc: "Create your organization account with 1-day free trial." },
  { num: "02", title: "Create Event", desc: "Set up your event details, speakers, schedule, and more." },
  { num: "03", title: "Issue Certificates", desc: "Generate and send digital certificates with QR verification." },
];

const testimonials = [
  { name: "Dr. Ahmed Khan", role: "Dean, FAST University", text: "EventoraX transformed how we manage our university events. The certificate system alone saved us weeks of manual work." },
  { name: "Sarah Malik", role: "HR Director, TechCorp", text: "We use EventoraX for all our corporate events. The QR ticketing and analytics are game-changers." },
  { name: "Prof. Nadia Hussain", role: "Principal, LGS", text: "The multi-tenancy feature lets our departments run independent events while maintaining central oversight." },
];

const faqs = [
  { q: "What is EventoraX?", a: "EventoraX is a multi-tenant SaaS platform for managing events end-to-end, from creation to QR ticketing, digital certificates, and automated emails." },
  { q: "How does the free trial work?", a: "You get a 1-day free trial with full access to all features. No credit card required to start." },
  { q: "Can I verify certificates online?", a: "Yes! Every certificate has a unique verify code and SHA-256 hash that can be verified publicly on our verification page." },
  { q: "What payment methods do you accept?", a: "We accept JazzCash, Easypaisa, and Bank Transfer for PKR payments." },
  { q: "Is there a limit on events or attendees?", a: "Both Pro and Enterprise plans offer unlimited events and attendees." },
  { q: "Can I white-label the platform?", a: "White-label branding is available on the Enterprise plan, allowing you to replace EventoraX branding with your own." },
  { q: "How does QR attendance work?", a: "Each registration generates a unique QR ticket. At the event entrance, scan the QR code with our built-in scanner to mark attendance." },
  { q: "Is my data secure?", a: "Absolutely. We use industry-standard security practices, and each organization's data is fully isolated." },
];

const trustedBy = [
  { name: "FAST University", icon: GraduationCap },
  { name: "LGS", icon: Building2 },
  { name: "TechCorp", icon: Globe },
  { name: "NUST", icon: GraduationCap },
  { name: "Careem", icon: Globe },
  { name: "Daraz", icon: Globe },
];

export default function Home() {
  return (
    <div className="bg-white">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-blue-50 via-white to-blue-50 py-20 lg:py-32">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMSIgZmlsbD0iIzNiODJmNiIgZmlsbC1vcGFjaXR5PSIwLjEiLz48L3N2Zz4=')] opacity-40" />
        <div className="container mx-auto px-4 lg:px-8 relative">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-100 rounded-full text-blue-700 text-sm font-medium mb-6">
              <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
              Built by ORBIT-I Pakistan
            </div>
            <h1 className="text-4xl lg:text-6xl font-extrabold text-slate-900 mb-6 leading-tight">
              Manage Events{" "}
              <span className="bg-gradient-to-r from-blue-600 to-blue-400 bg-clip-text text-transparent">
                Like a Pro
              </span>
            </h1>
            <p className="text-lg lg:text-xl text-slate-600 mb-8 max-w-2xl mx-auto">
              Complete event management platform for universities, colleges, companies, and NGOs.
              From creation to certificates — all in one place.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link to="/register">
                <Button size="lg" className="bg-blue-500 hover:bg-blue-600 text-white px-8 text-lg shadow-lg shadow-blue-200">
                  Start Free Trial <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link to="/pricing">
                <Button size="lg" variant="outline" className="border-blue-200 text-blue-600 hover:bg-blue-50 px-8 text-lg">
                  View Pricing
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="bg-blue-600 py-10">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 text-center">
            {stats.map((s) => (
              <div key={s.label}>
                <div className="text-3xl lg:text-4xl font-bold text-white">{s.value}</div>
                <div className="text-blue-200 text-sm mt-1">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">Everything You Need</h2>
            <p className="text-slate-600 max-w-xl mx-auto">
              Powerful features to manage your entire event lifecycle from start to finish.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((f) => (
              <div
                key={f.title}
                className="p-6 rounded-xl border border-blue-100 bg-white hover:shadow-lg hover:shadow-blue-100/50 transition-all group"
              >
                <div className="w-12 h-12 rounded-lg bg-blue-50 flex items-center justify-center mb-4 group-hover:bg-blue-100 transition-colors">
                  <f.icon className="h-6 w-6 text-blue-500" />
                </div>
                <h3 className="font-semibold text-slate-800 mb-2">{f.title}</h3>
                <p className="text-sm text-slate-500">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 bg-blue-50">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">How It Works</h2>
            <p className="text-slate-600 max-w-xl mx-auto">
              Get started with EventoraX in three simple steps.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {steps.map((step) => (
              <div key={step.num} className="text-center">
                <div className="text-5xl font-black text-blue-200 mb-4">{step.num}</div>
                <h3 className="text-xl font-bold text-slate-800 mb-2">{step.title}</h3>
                <p className="text-slate-600">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Preview */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">Simple Pricing</h2>
            <p className="text-slate-600 max-w-xl mx-auto">
              Affordable PKR pricing with no hidden fees.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-3xl mx-auto">
            {/* Pro */}
            <div className="p-8 rounded-2xl border-2 border-blue-100 bg-white hover:border-blue-300 transition-all">
              <div className="text-sm font-medium text-blue-600 mb-2">Pro</div>
              <div className="text-4xl font-bold text-slate-900 mb-1">PKR 20,000</div>
              <div className="text-slate-500 text-sm mb-6">per year</div>
              <ul className="space-y-3 mb-8">
                {["Unlimited Events", "Unlimited Attendees", "3 Admin Users", "7 Manager Users", "50 Certificate Templates", "QR Ticketing & Scanner", "Analytics Dashboard"].map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm text-slate-600">
                    <Check className="h-4 w-4 text-green-500" /> {f}
                  </li>
                ))}
              </ul>
              <Link to="/register">
                <Button className="w-full bg-blue-500 hover:bg-blue-600 text-white">Start Free Trial</Button>
              </Link>
            </div>
            {/* Enterprise */}
            <div className="p-8 rounded-2xl border-2 border-blue-500 bg-gradient-to-br from-blue-50 to-white relative">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-blue-500 text-white text-xs font-medium rounded-full">
                Recommended
              </div>
              <div className="text-sm font-medium text-blue-600 mb-2">Enterprise</div>
              <div className="text-4xl font-bold text-slate-900 mb-1">PKR 25,000</div>
              <div className="text-slate-500 text-sm mb-6">per year</div>
              <ul className="space-y-3 mb-8">
                {["Everything in Pro", "Unlimited Admins & Managers", "REST API Access", "Custom Domain", "White Label Branding", "Priority Support"].map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm text-slate-600">
                    <Check className="h-4 w-4 text-green-500" /> {f}
                  </li>
                ))}
              </ul>
              <Link to="/register">
                <Button className="w-full bg-blue-500 hover:bg-blue-600 text-white">Start Free Trial</Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 bg-blue-50">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">Trusted by Organizations</h2>
          </div>
          {/* Logo Wall */}
          <div className="flex flex-wrap items-center justify-center gap-8 mb-14 opacity-60">
            {trustedBy.map((org) => (
              <div key={org.name} className="flex items-center gap-2 text-slate-500">
                <org.icon className="h-6 w-6" />
                <span className="font-medium">{org.name}</span>
              </div>
            ))}
          </div>
          {/* Testimonial Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.map((t) => (
              <div key={t.name} className="p-6 bg-white rounded-xl border border-blue-100 shadow-sm">
                <Quote className="h-8 w-8 text-blue-200 mb-4" />
                <p className="text-slate-600 mb-4">{t.text}</p>
                <div>
                  <div className="font-semibold text-slate-800">{t.name}</div>
                  <div className="text-sm text-slate-500">{t.role}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">Frequently Asked Questions</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {faqs.map((faq, i) => (
              <div key={i} className="p-5 rounded-xl border border-blue-100 bg-white">
                <div className="flex items-start gap-3">
                  <HelpCircle className="h-5 w-5 text-blue-500 mt-0.5 shrink-0" />
                  <div>
                    <h3 className="font-semibold text-slate-800 mb-2">{faq.q}</h3>
                    <p className="text-sm text-slate-600">{faq.a}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-br from-blue-600 to-blue-700">
        <div className="container mx-auto px-4 lg:px-8 text-center">
          <h2 className="text-3xl lg:text-4xl font-bold text-white mb-4">
            Ready to Transform Your Events?
          </h2>
          <p className="text-blue-100 mb-8 max-w-xl mx-auto">
            Join hundreds of organizations using EventoraX to manage their events efficiently.
          </p>
          <Link to="/register">
            <Button size="lg" className="bg-white text-blue-600 hover:bg-blue-50 px-8 text-lg shadow-xl">
              Start Your Free Trial <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
