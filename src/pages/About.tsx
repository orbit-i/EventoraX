import { Link } from "react-router";
import { Button } from "@/components/ui/button";
import { ArrowRight, Target, Eye, Zap, Globe } from "lucide-react";

const problems = [
  "Manual paper attendance tracking",
  "Handwritten or Word-based certificates",
  "No certificate verification system",
  "Scattered tools (Forms, Excel, email)",
  "Expensive foreign SaaS (USD pricing)",
  "No ID cards for participants",
];

const milestones = [
  { year: "2024", title: "Founded", desc: "ORBIT-I started building EventoraX." },
  { year: "2025", title: "Launch v1.0", desc: "Complete platform with all core features." },
];

const team = [
  { name: "ORBIT-I Team", role: "Development Team", desc: "Building Ideas. Creating Impact." },
];

export default function About() {
  return (
    <div className="bg-white">
      {/* Hero */}
      <section className="py-20 bg-gradient-to-br from-blue-50 to-white">
        <div className="container mx-auto px-4 lg:px-8 text-center">
          <h1 className="text-4xl font-bold text-slate-900 mb-4">
            What is <span className="text-blue-600">EventoraX</span>?
          </h1>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto mb-6">
            EventoraX is a multi-tenant SaaS platform built by ORBIT-I for universities,
            colleges, companies, and NGOs to manage events end-to-end.
          </p>
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-100 rounded-full text-blue-700 text-sm font-medium">
            <Zap className="h-4 w-4" />
            Born from ORBIT-I — Building Ideas. Creating Impact.
          </div>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="py-16">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <div className="p-8 rounded-xl border border-blue-100 bg-blue-50/50">
              <Target className="h-8 w-8 text-blue-500 mb-4" />
              <h2 className="text-xl font-bold text-slate-900 mb-2">Our Mission</h2>
              <p className="text-slate-600">
                To provide affordable, locally-built event management technology for Pakistani
                organizations, eliminating the need for expensive foreign SaaS solutions.
              </p>
            </div>
            <div className="p-8 rounded-xl border border-blue-100 bg-blue-50/50">
              <Eye className="h-8 w-8 text-blue-500 mb-4" />
              <h2 className="text-xl font-bold text-slate-900 mb-2">Our Vision</h2>
              <p className="text-slate-600">
                To become the go-to event management platform for every educational institution,
                corporation, and NGO in Pakistan and beyond.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Problem We Solve */}
      <section className="py-16 bg-slate-50">
        <div className="container mx-auto px-4 lg:px-8">
          <h2 className="text-3xl font-bold text-slate-900 mb-8 text-center">Problems We Solve</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-4xl mx-auto">
            {problems.map((p) => (
              <div key={p} className="flex items-center gap-3 p-4 bg-white rounded-lg border border-blue-100">
                <Zap className="h-5 w-5 text-blue-500 shrink-0" />
                <span className="text-slate-700 text-sm">{p}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Team */}
      <section className="py-16">
        <div className="container mx-auto px-4 lg:px-8">
          <h2 className="text-3xl font-bold text-slate-900 mb-8 text-center">Built by ORBIT-I</h2>
          <div className="flex justify-center">
            <div className="p-8 rounded-xl border border-blue-100 bg-white text-center max-w-sm">
              <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-blue-100 flex items-center justify-center">
                <Globe className="h-10 w-10 text-blue-500" />
              </div>
              <h3 className="font-bold text-slate-900">{team[0].name}</h3>
              <p className="text-blue-600 text-sm">{team[0].role}</p>
              <p className="text-slate-500 text-sm mt-2">{team[0].desc}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Timeline */}
      <section className="py-16 bg-slate-50">
        <div className="container mx-auto px-4 lg:px-8">
          <h2 className="text-3xl font-bold text-slate-900 mb-8 text-center">Our Journey</h2>
          <div className="max-w-2xl mx-auto space-y-6">
            {milestones.map((m) => (
              <div key={m.year} className="flex items-start gap-4">
                <div className="w-16 h-16 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold shrink-0">
                  {m.year}
                </div>
                <div className="pt-2">
                  <h3 className="font-bold text-slate-800">{m.title}</h3>
                  <p className="text-slate-600">{m.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16">
        <div className="container mx-auto px-4 lg:px-8 text-center">
          <Link to="/register">
            <Button size="lg" className="bg-blue-500 hover:bg-blue-600 text-white">
              Try It Free <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
