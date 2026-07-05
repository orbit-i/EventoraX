import { useEffect } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Link } from 'react-router';
import { Target, Eye, Lightbulb, Users, Award, Zap } from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

const problems = [
  {
    icon: Users,
    title: 'Manual Registration',
    desc: 'Paper forms, spreadsheets, and manual data entry waste hours of valuable time.',
  },
  {
    icon: Award,
    title: 'Certificate Hassle',
    desc: 'Creating, printing, and distributing certificates manually is tedious and error-prone.',
  },
  {
    icon: Zap,
    title: 'Disconnected Tools',
    desc: 'Using multiple apps for registration, ticketing, and communication creates chaos.',
  },
];

const milestones = [
  { year: '2023', event: 'ORBIT-I founded with a vision to simplify event management' },
  { year: '2024', event: 'EventoraX concept born from real organizer pain points' },
  { year: '2025', event: 'Beta launch with 50+ organizations' },
  { year: '2025', event: 'Public release — 5,000+ events hosted' },
];

export default function About() {
  useEffect(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

    const reveals = document.querySelectorAll('.scroll-reveal');
    reveals.forEach((el) => {
      gsap.from(el, {
        scrollTrigger: { trigger: el, start: 'top 85%' },
        opacity: 0, y: 30, duration: 0.5, ease: 'power1.out',
      });
    });
    return () => { ScrollTrigger.getAll().forEach((st) => st.kill()); };
  }, []);

  return (
    <main className="pt-14">
      {/* Hero */}
      <section className="bg-[#f5f3ff] py-20 md:py-32 text-center">
        <div className="content-max">
          <p className="font-body text-sm uppercase tracking-[0.1em] mb-4 text-[#a78bfa] font-semibold">About Us</p>
          <h1 className="font-heading text-4xl md:text-6xl font-bold tracking-[-0.02em] mb-6 text-[#0f172a]">
            Built by ORBIT-I
          </h1>
          <p className="font-body text-lg md:text-xl max-w-2xl mx-auto text-[#475569] leading-relaxed">
            EventoraX was born from a simple idea: event management should be effortless, beautiful, and accessible to everyone.
          </p>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="bg-white section-padding">
        <div className="content-max">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-16">
            <div className="scroll-reveal">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-6 bg-[#f5f3ff] text-[#7c3aed]">
                <Target size={28} />
              </div>
              <h3 className="font-heading text-2xl md:text-3xl font-bold mb-4 text-[#0f172a]">Our Mission</h3>
              <p className="font-body text-base leading-relaxed text-[#475569]">
                To empower every event organizer — from universities to NGOs to corporations — with tools that make event management simple, professional, and delightful. We believe technology should work for people, not the other way around.
              </p>
            </div>
            <div className="scroll-reveal">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-6 bg-[#f5f3ff] text-[#7c3aed]">
                <Eye size={28} />
              </div>
              <h3 className="font-heading text-2xl md:text-3xl font-bold mb-4 text-[#0f172a]">Our Vision</h3>
              <p className="font-body text-base leading-relaxed text-[#475569]">
                To become the world&apos;s most trusted event management platform — where every moment becomes a memory, and every organizer feels empowered to create extraordinary experiences.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Problems */}
      <section className="bg-[#f5f3ff] section-padding">
        <div className="content-max">
          <h2 className="font-heading text-3xl md:text-4xl font-bold text-center mb-12 tracking-[-0.02em] text-[#0f172a]">
            The Problem We Solve
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {problems.map((p, i) => {
              const Icon = p.icon;
              return (
                <div key={i} className="scroll-reveal bg-white rounded-2xl p-8 border border-[#e9e4ff] shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300" style={{ transitionDelay: `${i * 100}ms` }}>
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-5 bg-[#f5f3ff] text-[#7c3aed]">
                    <Icon size={24} />
                  </div>
                  <h4 className="font-heading text-xl font-bold mb-2 text-[#0f172a]">{p.title}</h4>
                  <p className="font-body text-sm text-[#475569] leading-relaxed">{p.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Timeline */}
      <section className="bg-white section-padding">
        <div className="content-max">
          <h2 className="font-heading text-3xl md:text-4xl font-bold text-center mb-12 tracking-[-0.02em] text-[#0f172a]">
            Our Journey
          </h2>
          <div className="max-w-3xl mx-auto">
            {milestones.map((m, i) => (
              <div key={i} className="scroll-reveal flex gap-6 md:gap-10 mb-8 last:mb-0">
                <div className="flex flex-col items-center">
                  <div className="w-3 h-3 rounded-full flex-shrink-0 bg-[#7c3aed] ring-4 ring-[#f5f3ff]" />
                  {i < milestones.length - 1 && (
                    <div className="w-px flex-grow mt-2 bg-[#e9e4ff]" />
                  )}
                </div>
                <div className="pb-8">
                  <span className="font-heading text-2xl font-bold text-[#7c3aed]">{m.year}</span>
                  <p className="font-body text-base mt-1 text-[#0f172a] font-medium">{m.event}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Team */}
      <section className="bg-[#f5f3ff] section-padding">
        <div className="content-max">
          <h2 className="font-heading text-3xl md:text-4xl font-bold text-center mb-4 tracking-[-0.02em] text-[#0f172a]">
            Meet the Team
          </h2>
          <p className="font-body text-base text-center mb-12 text-[#475569]">
            Passionate builders creating impact — one event at a time.
          </p>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
            {[
              { name: 'Amina Sahar', role: 'UI/Frontend Lead', img: '/images/avatar-1.jpg' },
              { name: 'Shahid', role: 'Auth Developer', img: '/images/avatar-2.jpg' },
              { name: 'Anamta', role: 'Dashboard Core', img: '/images/avatar-3.jpg' },
              { name: 'Hasan Anser', role: 'Events Module', img: '/images/avatar-4.jpg' },
              { name: 'Isha', role: 'Certificate & QR', img: '/images/avatar-5.jpg' },
              { name: 'M Adeel Umer', role: 'Superadmin', img: '/images/avatar-6.jpg' },
            ].map((member, i) => (
              <div key={i} className="scroll-reveal text-center" style={{ transitionDelay: `${i * 100}ms` }}>
                <div className="w-20 h-20 md:w-24 md:h-24 rounded-full mx-auto mb-3 bg-gradient-to-br from-[#7c3aed] to-[#a78bfa] flex items-center justify-center text-white font-bold text-xl">
                  {member.name.split(' ').map(n => n[0]).join('')}
                </div>
                <h4 className="font-body text-sm font-semibold text-[#0f172a]">{member.name}</h4>
                <p className="font-body text-xs text-[#475569]">{member.role}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-white py-20 md:py-28 text-center">
        <div className="content-max">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6 bg-[#f5f3ff] text-[#7c3aed]">
            <Lightbulb size={32} />
          </div>
          <h2 className="font-heading text-3xl md:text-4xl font-bold mb-4 tracking-[-0.02em] text-[#0f172a]">
            Join us on our journey
          </h2>
          <p className="font-body text-base mb-8 text-[#475569]">
            Be part of the future of event management.
          </p>
          <Link to="/register" className="btn-primary">Try it free</Link>
        </div>
      </section>
    </main>
  );
}