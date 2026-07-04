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
      <section className="bg-[#F5FAFF] py-20 md:py-32 text-center">
        <div className="content-max">
          <p className="font-body text-sm uppercase tracking-[0.1em] mb-4" style={{ color: '#A0B4CC' }}>Contact</p>
          <h1 className="font-heading text-4xl md:text-6xl font-medium tracking-[-0.02em] mb-6" style={{ color: '#1B2A4A' }}>
            Get in touch
          </h1>
          <p className="font-body text-lg md:text-xl max-w-2xl mx-auto" style={{ color: '#A0B4CC' }}>
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
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#CCE5FF', color: '#4A9CFF' }}>
                  <Mail size={20} />
                </div>
                <div>
                  <h4 className="font-body text-sm font-medium mb-1" style={{ color: '#1B2A4A' }}>Email</h4>
                  <p className="font-body text-sm" style={{ color: '#A0B4CC' }}>hello@eventorax.com</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#CCE5FF', color: '#4A9CFF' }}>
                  <Phone size={20} />
                </div>
                <div>
                  <h4 className="font-body text-sm font-medium mb-1" style={{ color: '#1B2A4A' }}>Phone</h4>
                  <p className="font-body text-sm" style={{ color: '#A0B4CC' }}>+92 300 1234567</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#CCE5FF', color: '#4A9CFF' }}>
                  <MapPin size={20} />
                </div>
                <div>
                  <h4 className="font-body text-sm font-medium mb-1" style={{ color: '#1B2A4A' }}>Location</h4>
                  <p className="font-body text-sm" style={{ color: '#A0B4CC' }}>Islamabad, Pakistan</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#CCE5FF', color: '#4A9CFF' }}>
                  <Clock size={20} />
                </div>
                <div>
                  <h4 className="font-body text-sm font-medium mb-1" style={{ color: '#1B2A4A' }}>Response Time</h4>
                  <p className="font-body text-sm" style={{ color: '#A0B4CC' }}>Within 24 hours</p>
                </div>
              </div>

              {/* WhatsApp Button */}
              <a
                href="https://wa.me/923001234567"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full py-3 rounded-full font-body font-medium text-sm transition-all duration-300 hover:scale-[1.02] text-white"
                style={{ backgroundColor: '#25D366' }}
              >
                <MessageCircle size={18} />
                Chat on WhatsApp
              </a>
            </div>

            {/* Contact Form */}
            <div className="lg:col-span-2">
              <form onSubmit={handleSubmit} className="bg-[#F5FAFF] rounded-3xl p-8 border" style={{ borderColor: '#E8F4FD' }}>
                {submitted ? (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: '#C8F0E4' }}>
                      <Send size={28} style={{ color: '#2A8B6F' }} />
                    </div>
                    <h3 className="font-heading text-2xl font-medium mb-2" style={{ color: '#1B2A4A' }}>Message sent!</h3>
                    <p className="font-body text-sm" style={{ color: '#A0B4CC' }}>We&apos;ll get back to you within 24 hours.</p>
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                      <div>
                        <label className="font-body text-sm font-medium mb-1.5 block" style={{ color: '#1B2A4A' }}>Name</label>
                        <input
                          type="text"
                          required
                          value={form.name}
                          onChange={(e) => setForm({ ...form, name: e.target.value })}
                          className="w-full px-4 py-3 rounded-xl border font-body text-sm focus:outline-none focus:ring-2 focus:ring-[#4A9CFF] focus:border-transparent transition-all"
                          style={{ borderColor: '#E8F4FD', backgroundColor: '#FFFFFF', color: '#1B2A4A' }}
                          placeholder="Your name"
                        />
                      </div>
                      <div>
                        <label className="font-body text-sm font-medium mb-1.5 block" style={{ color: '#1B2A4A' }}>Email</label>
                        <input
                          type="email"
                          required
                          value={form.email}
                          onChange={(e) => setForm({ ...form, email: e.target.value })}
                          className="w-full px-4 py-3 rounded-xl border font-body text-sm focus:outline-none focus:ring-2 focus:ring-[#4A9CFF] focus:border-transparent transition-all"
                          style={{ borderColor: '#E8F4FD', backgroundColor: '#FFFFFF', color: '#1B2A4A' }}
                          placeholder="you@example.com"
                        />
                      </div>
                    </div>
                    <div className="mb-4">
                      <label className="font-body text-sm font-medium mb-1.5 block" style={{ color: '#1B2A4A' }}>Organization</label>
                      <input
                        type="text"
                        value={form.org}
                        onChange={(e) => setForm({ ...form, org: e.target.value })}
                        className="w-full px-4 py-3 rounded-xl border font-body text-sm focus:outline-none focus:ring-2 focus:ring-[#4A9CFF] focus:border-transparent transition-all"
                        style={{ borderColor: '#E8F4FD', backgroundColor: '#FFFFFF', color: '#1B2A4A' }}
                        placeholder="Your organization (optional)"
                      />
                    </div>
                    <div className="mb-6">
                      <label className="font-body text-sm font-medium mb-1.5 block" style={{ color: '#1B2A4A' }}>Message</label>
                      <textarea
                        required
                        rows={5}
                        value={form.message}
                        onChange={(e) => setForm({ ...form, message: e.target.value })}
                        className="w-full px-4 py-3 rounded-xl border font-body text-sm focus:outline-none focus:ring-2 focus:ring-[#4A9CFF] focus:border-transparent transition-all resize-none"
                        style={{ borderColor: '#E8F4FD', backgroundColor: '#FFFFFF', color: '#1B2A4A' }}
                        placeholder="How can we help you?"
                      />
                    </div>
                    <button
                      type="submit"
                      className="w-full py-3.5 rounded-full font-body font-medium text-white transition-all duration-300 hover:scale-[1.02]"
                      style={{ backgroundColor: '#4A9CFF' }}
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
