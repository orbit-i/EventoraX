import { useState } from 'react';
import { Mail, MapPin, Phone, Clock, Send, MessageCircle } from 'lucide-react';

export default function Contact() {
  const [form, setForm] = useState({ name: '', email: '', org: '', message: '' });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 3000);
  };

  return (
    <main className="pt-14">
      {/* Hero */}
      <section className="bg-[#f5f3ff] py-20 md:py-32 text-center">
        <div className="content-max">
          <p className="font-body text-sm uppercase tracking-[0.1em] mb-4 text-[#a78bfa] font-semibold">Contact</p>
          <h1 className="font-heading text-4xl md:text-6xl font-bold tracking-[-0.02em] mb-6 text-[#0f172a]">
            Get in touch
          </h1>
          <p className="font-body text-lg md:text-xl max-w-2xl mx-auto text-[#475569] leading-relaxed">
            Have questions? We&apos;d love to hear from you. Our team is ready to help.
          </p>
        </div>
      </section>

      {/* Contact Content */}
      <section className="bg-white section-padding">
        <div className="content-max">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 max-w-5xl mx-auto">
            {/* Contact Info */}
            <div className="lg:col-span-1 space-y-6">
              {[
                { icon: Mail, label: 'Email', value: 'hello@eventorax.com' },
                { icon: Phone, label: 'Phone', value: '+92 300 1234567' },
                { icon: MapPin, label: 'Location', value: 'Islamabad, Pakistan' },
                { icon: Clock, label: 'Response Time', value: 'Within 24 hours' },
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 bg-[#f5f3ff] text-[#7c3aed]">
                    <item.icon size={20} />
                  </div>
                  <div>
                    <h4 className="font-body text-sm font-semibold mb-1 text-[#0f172a]">{item.label}</h4>
                    <p className="font-body text-sm text-[#475569]">{item.value}</p>
                  </div>
                </div>
              ))}

              {/* WhatsApp Button */}
              <a
                href="https://wa.me/923001234567"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full py-3 rounded-xl font-body font-semibold text-sm transition-all duration-300 hover:scale-[1.02] hover:shadow-lg text-white bg-[#25D366] hover:bg-[#128C7E]"
              >
                <MessageCircle size={18} />
                Chat on WhatsApp
              </a>
            </div>

            {/* Contact Form */}
            <div className="lg:col-span-2">
              <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-8 border border-[#e9e4ff] shadow-sm">
                {submitted ? (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 bg-[#f0fdf4]">
                      <Send size={28} className="text-[#16a34a]" />
                    </div>
                    <h3 className="font-heading text-2xl font-bold mb-2 text-[#0f172a]">Message sent!</h3>
                    <p className="font-body text-sm text-[#475569]">We&apos;ll get back to you within 24 hours.</p>
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                      <div>
                        <label className="font-body text-sm font-semibold mb-1.5 block text-[#0f172a]">Name</label>
                        <input
                          type="text"
                          required
                          value={form.name}
                          onChange={(e) => setForm({ ...form, name: e.target.value })}
                          className="w-full px-4 py-3 rounded-xl border border-[#e9e4ff] bg-white font-body text-sm text-[#0f172a] placeholder:text-[#94a3b8] focus:outline-none focus:ring-2 focus:ring-[#7c3aed]/30 focus:border-[#7c3aed] transition-all duration-200"
                          placeholder="Your name"
                        />
                      </div>
                      <div>
                        <label className="font-body text-sm font-semibold mb-1.5 block text-[#0f172a]">Email</label>
                        <input
                          type="email"
                          required
                          value={form.email}
                          onChange={(e) => setForm({ ...form, email: e.target.value })}
                          className="w-full px-4 py-3 rounded-xl border border-[#e9e4ff] bg-white font-body text-sm text-[#0f172a] placeholder:text-[#94a3b8] focus:outline-none focus:ring-2 focus:ring-[#7c3aed]/30 focus:border-[#7c3aed] transition-all duration-200"
                          placeholder="you@example.com"
                        />
                      </div>
                    </div>
                    <div className="mb-4">
                      <label className="font-body text-sm font-semibold mb-1.5 block text-[#0f172a]">Organization</label>
                      <input
                        type="text"
                        value={form.org}
                        onChange={(e) => setForm({ ...form, org: e.target.value })}
                        className="w-full px-4 py-3 rounded-xl border border-[#e9e4ff] bg-white font-body text-sm text-[#0f172a] placeholder:text-[#94a3b8] focus:outline-none focus:ring-2 focus:ring-[#7c3aed]/30 focus:border-[#7c3aed] transition-all duration-200"
                        placeholder="Your organization (optional)"
                      />
                    </div>
                    <div className="mb-6">
                      <label className="font-body text-sm font-semibold mb-1.5 block text-[#0f172a]">Message</label>
                      <textarea
                        required
                        rows={5}
                        value={form.message}
                        onChange={(e) => setForm({ ...form, message: e.target.value })}
                        className="w-full px-4 py-3 rounded-xl border border-[#e9e4ff] bg-white font-body text-sm text-[#0f172a] placeholder:text-[#94a3b8] focus:outline-none focus:ring-2 focus:ring-[#7c3aed]/30 focus:border-[#7c3aed] transition-all duration-200 resize-none"
                        placeholder="How can we help you?"
                      />
                    </div>
                    <button
                      type="submit"
                      className="w-full py-3.5 rounded-xl font-body font-semibold text-white transition-all duration-300 hover:scale-[1.02] hover:shadow-lg hover:shadow-[#7c3aed]/25 bg-[#7c3aed] hover:bg-[#6d28d9] active:bg-[#5b21b6]"
                    >
                      Send Message
                    </button>
                  </>
                )}
              </form>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}