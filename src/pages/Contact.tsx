import { useState, useEffect } from 'react';
import { Mail, MapPin, Phone, Clock, Send, MessageCircle, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { api } from '@/services/api';
import { getUtmParams } from '@/lib/utm';

export default function Contact() {
  const location = useLocation();
  const [form, setForm] = useState({ name: '', email: '', org: '', message: '' });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Auto-fill subject if navigated with ?subject=...
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const subject = params.get('subject');
    if (subject && !form.message) {
      setForm(prev => ({
        ...prev,
        message: `Inquiry regarding: ${subject.replace(/\+/g, ' ')}\n\n`
      }));
    }
  }, [location.search]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    if (!form.name.trim() || !form.email.trim() || !form.message.trim()) {
      setError('Please fill in your name, email, and message.');
      setSubmitting(false);
      return;
    }

    try {
      const utmData = getUtmParams();
      const res = await api.contact.send({
        ...form,
        ...utmData
      });
      if (res.success) {
        setSubmitted(true);
        setForm({ name: '', email: '', org: '', message: '' });
      } else {
        setError(res.message || 'Failed to submit contact request. Please try again.');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to submit contact request. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="font-body">
      {/* Hero */}
      <section className="bg-gradient-to-b from-blue-50/60 via-white to-slate-50 py-16 md:py-24 text-center px-4">
        <div className="content-max">
          <p className="font-body text-xs uppercase tracking-[0.15em] mb-3 text-blue-600 font-bold">
            Customer Success &amp; Engineering Desk
          </p>
          <h1 className="font-heading text-4xl md:text-6xl font-bold tracking-tight mb-4 text-[#0f172a]">
            Get in touch with our team
          </h1>
          <p className="font-body text-base md:text-lg max-w-2xl mx-auto text-[#475569] leading-relaxed">
            Have questions about EventoraX, multi-tenant setups, or need a customized enterprise deployment? Our engineers are active 24/7.
          </p>
        </div>
      </section>

      {/* Contact Content */}
      <section className="bg-white section-padding">
        <div className="content-max">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 max-w-5xl mx-auto">
            {/* Contact Info Cards */}
            <div className="lg:col-span-1 space-y-5">
              {/* Clickable Email */}
              <a 
                href="mailto:eventorax@orbit-i.tech" 
                className="flex items-start gap-4 p-4 rounded-2xl bg-slate-50 hover:bg-blue-50/80 border border-slate-200/80 hover:border-blue-200 transition-all group"
                title="Send email to EventoraX"
              >
                <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 bg-blue-100 text-blue-600 group-hover:scale-105 transition-transform">
                  <Mail size={20} />
                </div>
                <div>
                  <h4 className="font-body text-xs font-bold uppercase tracking-wider text-slate-500 mb-0.5">Email Support</h4>
                  <p className="font-body text-sm font-semibold text-blue-600 group-hover:underline">eventorax@orbit-i.tech</p>
                </div>
              </a>

              {/* Clickable Phone */}
              <a 
                href="tel:+923190375751" 
                className="flex items-start gap-4 p-4 rounded-2xl bg-slate-50 hover:bg-emerald-50/80 border border-slate-200/80 hover:border-emerald-200 transition-all group"
                title="Call EventoraX directly"
              >
                <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 bg-emerald-100 text-emerald-600 group-hover:scale-105 transition-transform">
                  <Phone size={20} />
                </div>
                <div>
                  <h4 className="font-body text-xs font-bold uppercase tracking-wider text-slate-500 mb-0.5">Phone &amp; Direct Line</h4>
                  <p className="font-body text-sm font-semibold text-emerald-700 group-hover:underline">+92 3190375751</p>
                </div>
              </a>

              {/* Address / Headquarters */}
              <div className="flex items-start gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 bg-rose-100 text-rose-600">
                  <MapPin size={20} />
                </div>
                <div>
                  <h4 className="font-body text-xs font-bold uppercase tracking-wider text-slate-500 mb-0.5">Headquarters</h4>
                  <p className="font-body text-sm text-slate-700">ORBIT-I Private Limited, Nawabshah, Sindh, Pakistan</p>
                </div>
              </div>

              {/* SLA Response */}
              <div className="flex items-start gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 bg-indigo-100 text-indigo-600">
                  <Clock size={20} />
                </div>
                <div>
                  <h4 className="font-body text-xs font-bold uppercase tracking-wider text-slate-500 mb-0.5">Response Time</h4>
                  <p className="font-body text-sm text-slate-700">Average under 2 hours • 24/7 Support Sentinel</p>
                </div>
              </div>

              {/* WhatsApp Button */}
              <a
                href="https://wa.me/923190375751"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2.5 w-full py-3.5 rounded-2xl font-body font-bold text-sm transition-all duration-200 hover:shadow-lg text-white bg-[#25D366] hover:bg-[#128C7E] shadow-md shadow-emerald-600/20"
              >
                <MessageCircle size={18} />
                Chat on WhatsApp (+92 3190375751)
              </a>
            </div>

            {/* Contact Form */}
            <div className="lg:col-span-2">
              <form onSubmit={handleSubmit} className="bg-white rounded-3xl p-7 sm:p-10 border border-slate-200 shadow-xl shadow-slate-900/5">
                {/* Form Error Banner */}
                {error && (
                  <div className="mb-6 p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-start gap-3 animate-in fade-in">
                    <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-red-600" />
                    <span className="leading-relaxed">{error}</span>
                  </div>
                )}

                {/* Form Success State */}
                {submitted ? (
                  <div className="text-center py-10 animate-in zoom-in-95 duration-200">
                    <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 bg-emerald-50 border border-emerald-200 text-emerald-600">
                      <CheckCircle2 size={32} />
                    </div>
                    <h3 className="font-heading text-2xl font-bold mb-2 text-slate-900">Inquiry Received!</h3>
                    <p className="font-body text-sm text-slate-600 mb-6 max-w-md mx-auto leading-relaxed">
                      Thank you for contacting EventoraX. Your message has been routed to our technical support team. We will respond to your email shortly.
                    </p>
                    <button
                      type="button"
                      onClick={() => setSubmitted(false)}
                      className="px-6 py-2.5 rounded-xl text-xs font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 border border-blue-200 transition-colors cursor-pointer"
                    >
                      Send Another Message
                    </button>
                  </div>
                ) : (
                  <>
                    <h3 className="font-heading text-xl font-bold text-slate-900 mb-5">
                      Send a Direct Message
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                      <div>
                        <label className="font-body text-xs font-bold mb-1.5 block text-slate-800">Your Full Name *</label>
                        <input
                          type="text"
                          required
                          value={form.name}
                          onChange={(e) => setForm({ ...form, name: e.target.value })}
                          className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white font-body text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600/30 focus:border-blue-600 transition-all duration-200"
                          placeholder="e.g. Sarah Khan"
                        />
                      </div>
                      <div>
                        <label className="font-body text-xs font-bold mb-1.5 block text-slate-800">Email Address *</label>
                        <input
                          type="email"
                          required
                          value={form.email}
                          onChange={(e) => setForm({ ...form, email: e.target.value })}
                          className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white font-body text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600/30 focus:border-blue-600 transition-all duration-200"
                          placeholder="e.g. sarah@example.com"
                        />
                      </div>
                    </div>
                    <div className="mb-4">
                      <label className="font-body text-xs font-bold mb-1.5 block text-slate-800">Organization / University (Optional)</label>
                      <input
                        type="text"
                        value={form.org}
                        onChange={(e) => setForm({ ...form, org: e.target.value })}
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white font-body text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600/30 focus:border-blue-600 transition-all duration-200"
                        placeholder="e.g. Sindh Innovation Summit"
                      />
                    </div>
                    <div className="mb-6">
                      <label className="font-body text-xs font-bold mb-1.5 block text-slate-800">Your Message *</label>
                      <textarea
                        required
                        rows={5}
                        value={form.message}
                        onChange={(e) => setForm({ ...form, message: e.target.value })}
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white font-body text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600/30 focus:border-blue-600 transition-all duration-200 resize-none"
                        placeholder="Please describe your requirements, questions, or custom deployment needs..."
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="w-full py-3.5 rounded-xl font-body font-bold text-sm text-white transition-all duration-200 hover:shadow-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-60 flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-blue-600/25"
                    >
                      {submitting ? (
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <>
                          <Send size={18} />
                          <span>Submit Message</span>
                        </>
                      )}
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