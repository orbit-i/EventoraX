import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Mail, MapPin, MessageCircle, Clock } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function Contact() {
  const [formData, setFormData] = useState({ name: "", email: "", organization: "", message: "" });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success("Message sent! We'll get back to you within 24 hours.");
    setSubmitted(true);
    setFormData({ name: "", email: "", organization: "", message: "" });
  };

  return (
    <div className="bg-white">
      <section className="py-16 bg-gradient-to-br from-blue-50 to-white text-center">
        <div className="container mx-auto px-4 lg:px-8">
          <h1 className="text-4xl font-bold text-slate-900 mb-4">Contact Us</h1>
          <p className="text-lg text-slate-600 max-w-xl mx-auto">
            Have questions? We're here to help. Reach out via WhatsApp, email, or the form below.
          </p>
        </div>
      </section>

      <section className="py-16">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 max-w-5xl mx-auto">
            {/* Contact Info */}
            <div className="space-y-8">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
                  <MessageCircle className="h-6 w-6 text-green-500" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-800">WhatsApp</h3>
                  <p className="text-slate-600 text-sm mb-2">Fastest response time</p>
                  <a href="https://wa.me/923001234567" target="_blank" rel="noopener noreferrer">
                    <Button variant="outline" size="sm" className="border-green-500 text-green-600 hover:bg-green-50">
                      <MessageCircle className="h-4 w-4 mr-2" />
                      Chat on WhatsApp
                    </Button>
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
                  <Mail className="h-6 w-6 text-blue-500" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-800">Email</h3>
                  <p className="text-slate-600 text-sm">support@eventorax.com</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
                  <MapPin className="h-6 w-6 text-red-500" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-800">Location</h3>
                  <p className="text-slate-600 text-sm">Pakistan</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
                  <Clock className="h-6 w-6 text-amber-500" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-800">Response Time</h3>
                  <p className="text-slate-600 text-sm">We typically respond within 24 hours</p>
                </div>
              </div>
            </div>

            {/* Contact Form */}
            <div className="p-8 rounded-xl border border-blue-100 bg-white">
              <h2 className="text-xl font-bold text-slate-900 mb-6">Send a Message</h2>
              {submitted ? (
                <div className="text-center py-8">
                  <div className="text-green-500 text-lg font-medium mb-2">Message Sent!</div>
                  <p className="text-slate-600 text-sm">We'll get back to you soon.</p>
                  <Button className="mt-4" variant="outline" onClick={() => setSubmitted(false)}>
                    Send Another
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Name</label>
                    <Input
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Your name"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                    <Input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="your@email.com"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Organization</label>
                    <Input
                      value={formData.organization}
                      onChange={(e) => setFormData({ ...formData, organization: e.target.value })}
                      placeholder="Your organization name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Message</label>
                    <Textarea
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      placeholder="How can we help?"
                      rows={4}
                      required
                    />
                  </div>
                  <Button type="submit" className="w-full bg-blue-500 hover:bg-blue-600 text-white">
                    Send Message
                  </Button>
                </form>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
