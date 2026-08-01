import { useState } from 'react';
import { Link } from 'react-router';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Mail, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

const forgotPasswordSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Enter a valid email address'),
});

type ForgotPasswordValues = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPassword() {
  const [submitted, setSubmitted] = useState(false);
  const [sentTo, setSentTo] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: '' },
  });

  const onSubmit = async (data: ForgotPasswordValues) => {
    // Simulated request — replace with real API call when backend is ready
    await new Promise((resolve) => setTimeout(resolve, 600));

    setSentTo(data.email);
    setSubmitted(true);
    toast.success('Reset link sent!');
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-[#f3f0ff] px-4 py-20">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/" className="font-heading text-3xl font-bold text-[#0f172a]">
            Eventora<span className="text-[#7c3aed]">X</span>
          </Link>
          <p className="font-body text-sm mt-2 text-[#64748b]">
            {submitted
              ? 'Check your inbox for a reset link.'
              : 'Enter your email and we\'ll send you a reset link.'}
          </p>
        </div>

        <div className="bg-white rounded-2xl p-8 border border-[#e9e4ff] shadow-lg shadow-[#7c3aed]/5">
          {submitted ? (
            <div className="text-center space-y-4">
              <div className="mx-auto w-14 h-14 rounded-full bg-[#f0fdf4] flex items-center justify-center">
                <CheckCircle2 className="w-7 h-7 text-[#16a34a]" />
              </div>
              <div>
                <p className="font-body text-sm text-[#0f172a]">
                  We've sent a password reset link to
                </p>
                <p className="font-body text-sm font-semibold text-[#7c3aed] mt-1">
                  {sentTo}
                </p>
              </div>
              <p className="font-body text-xs text-[#94a3b8]">
                Didn&apos;t get the email? Check your spam folder, or try again.
              </p>
              <button
                onClick={() => setSubmitted(false)}
                className="font-body text-sm font-medium text-[#7c3aed] hover:text-[#6d28d9] hover:underline transition-colors duration-200"
              >
                Use a different email
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} noValidate>
              <div className="space-y-5">
                <div>
                  <label className="font-body text-sm font-semibold mb-2 block text-[#0f172a]">
                    Email
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94a3b8]" />
                    <input
                      type="email"
                      {...register('email')}
                      aria-invalid={!!errors.email}
                      className="w-full pl-11 pr-4 py-3 rounded-xl border border-[#e9e4ff] bg-white font-body text-sm text-[#0f172a] placeholder:text-[#94a3b8] focus:outline-none focus:ring-2 focus:ring-[#7c3aed]/30 focus:border-[#7c3aed] hover:border-[#c4b5fd] transition-all duration-200 aria-invalid:border-[#dc2626] aria-invalid:ring-2 aria-invalid:ring-[#dc2626]/20"
                      placeholder="you@example.com"
                    />
                  </div>
                  {errors.email && (
                    <p className="mt-1.5 text-xs font-medium text-[#dc2626]">
                      {errors.email.message}
                    </p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-body font-semibold text-white bg-[#7c3aed] shadow-lg shadow-[#7c3aed]/25 hover:bg-[#6d28d9] hover:shadow-xl hover:shadow-[#7c3aed]/30 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 disabled:opacity-60 disabled:pointer-events-none"
                >
                  {isSubmitting ? 'Sending...' : 'Send Reset Link'}
                </button>
              </div>
            </form>
          )}
        </div>

        <Link
          to="/login"
          className="flex items-center justify-center gap-1.5 mt-6 font-body text-sm font-medium text-[#7c3aed] hover:text-[#6d28d9] hover:underline transition-colors duration-200"
        >
          <ArrowLeft size={16} />
          Back to Sign In
        </Link>
      </div>
    </main>
  );
}