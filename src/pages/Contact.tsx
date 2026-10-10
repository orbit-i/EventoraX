import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Mail, MapPin, Clock, Send, MessageCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { TextField, TextareaField } from '@/components/ui/form-fields';
import { applyServerErrors } from '@/components/app/form/serverErrors';
import { FormError } from '@/components/auth/AuthShell';
import { api } from '@/lib/api';
import { emailSchema } from '@/lib/validation';
import { whatsappLink } from '@/lib/contact';
import type { ContactInfo } from '@/types/dashboard';

// Same limits as the backend (POST /contact).
const schema = z.object({
  name: z.string().trim().min(2, 'Enter your name').max(150),
  email: emailSchema,
  organization: z.string().trim().max(150, 'Keep this under 150 characters'),
  message: z
    .string()
    .trim()
    .min(10, 'Please write at least a sentence (10+ characters)')
    .max(5000, 'Keep the message under 5,000 characters'),
});
type Values = z.infer<typeof schema>;

export default function Contact() {
  const [info, setInfo] = useState<ContactInfo | null>(null);
  const [sentMessage, setSentMessage] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    api
      .get<ContactInfo>('/contact/info', { auth: false, signal: controller.signal })
      .then(setInfo)
      .catch(() => {}); // details are optional — the form still works without them
    return () => controller.abort();
  }, []);

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { name: '', email: '', organization: '', message: '' },
  });

  async function onSubmit(values: Values) {
    setFormError(null);
    try {
      const res = await api.post<{ message: string }>(
        '/contact',
        { ...values, organization: values.organization || null },
        { auth: false }
      );
      reset();
      setSentMessage(res.message);
    } catch (err) {
      setFormError(applyServerErrors(err, setError));
    }
  }

  const details = [
    info?.email && { icon: Mail, label: 'Email', value: info.email, href: `mailto:${info.email}` },
    { icon: MapPin, label: 'Location', value: 'Pakistan' },
    { icon: Clock, label: 'Response time', value: info?.hours ? `${info.hours} · usually within one working day` : 'Usually within one working day' },
  ].filter(Boolean) as { icon: typeof Mail; label: string; value: string; href?: string }[];

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
              {details.map((item) => (
                <div key={item.label} className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 bg-[#f5f3ff] text-[#7c3aed]">
                    <item.icon size={20} />
                  </div>
                  <div className="min-w-0">
                    <h4 className="font-body text-sm font-semibold mb-1 text-[#0f172a]">{item.label}</h4>
                    {item.href ? (
                      <a href={item.href} className="font-body text-sm text-[#7c3aed] hover:underline break-all">
                        {item.value}
                      </a>
                    ) : (
                      <p className="font-body text-sm text-[#475569]">{item.value}</p>
                    )}
                  </div>
                </div>
              ))}

              {info?.whatsapp && (
                <a
                  href={whatsappLink(info.whatsapp, 'Hi EventoraX team, ')}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full py-3 rounded-xl font-body font-semibold text-sm transition-all duration-300 hover:scale-[1.02] hover:shadow-lg text-white bg-[#25D366] hover:bg-[#128C7E]"
                >
                  <MessageCircle size={18} />
                  Chat on WhatsApp
                </a>
              )}
            </div>

            {/* Contact Form */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-2xl p-8 border border-[#e9e4ff] shadow-sm">
                {sentMessage ? (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 bg-[#f0fdf4]">
                      <Send size={28} className="text-[#16a34a]" />
                    </div>
                    <h3 className="font-heading text-2xl font-bold mb-2 text-[#0f172a]">Message sent!</h3>
                    <p className="font-body text-sm text-[#475569]">{sentMessage}</p>
                    <Button variant="outline" className="mt-6" onClick={() => setSentMessage(null)}>
                      Send another message
                    </Button>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
                    {formError && <FormError message={formError} />}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <TextField label="Name" required autoComplete="name" placeholder="Your name" error={errors.name?.message} {...register('name')} />
                      <TextField
                        label="Email"
                        type="email"
                        required
                        autoComplete="email"
                        placeholder="you@example.com"
                        error={errors.email?.message}
                        {...register('email')}
                      />
                    </div>
                    <TextField
                      label="Organization"
                      autoComplete="organization"
                      placeholder="Your university or organization (optional)"
                      error={errors.organization?.message}
                      {...register('organization')}
                    />
                    <TextareaField
                      label="Message"
                      required
                      rows={5}
                      placeholder="How can we help you?"
                      error={errors.message?.message}
                      {...register('message')}
                    />
                    <Button type="submit" variant="default" size="lg" className="w-full" disabled={isSubmitting}>
                      {isSubmitting && <Loader2 className="animate-spin" />}
                      {isSubmitting ? 'Sending…' : 'Send message'}
                    </Button>
                  </form>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
