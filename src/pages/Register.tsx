import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, UserPlus, Check } from 'lucide-react';
import { toast } from 'sonner';

const registerSchema = z.object({
  fullName: z.string().min(2, 'Full name must be at least 2 characters'),
  orgName: z.string().min(2, 'Organization name must be at least 2 characters'),
  email: z.string().min(1, 'Email is required').email('Enter a valid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[0-9]/, 'Password must include at least one number'),
  phone: z
    .string()
    .optional()
    .refine((val) => !val || /^[+\d][\d\s-]{6,}$/.test(val), {
      message: 'Enter a valid phone number',
    }),
});

type RegisterFormValues = z.infer<typeof registerSchema>;

export default function Register() {
  const [showPassword, setShowPassword] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { fullName: '', orgName: '', email: '', password: '', phone: '' },
  });

  const onSubmit = async (data: RegisterFormValues) => {
    // Simulated signup call — replace with real API request when backend is ready
    await new Promise((resolve) => setTimeout(resolve, 600));

    localStorage.setItem('token', 'demo-token');
    toast.success('Account created!');
    setSubmitted(true);
  };

  // Auto-redirect to the dashboard shortly after a successful signup
  useEffect(() => {
    if (!submitted) return;
    const timer = setTimeout(() => navigate('/dashboard'), 2000);
    return () => clearTimeout(timer);
  }, [submitted, navigate]);

  if (submitted) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-[#f3f0ff] px-4">
        <div className="w-full max-w-md text-center">
          <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 bg-[#f5f3ff]">
            <Check size={36} className="text-[#7c3aed]" />
          </div>
          <h2 className="font-heading text-3xl font-bold mb-3 text-[#0f172a]">
            Account created!
          </h2>
          <p className="font-body text-base mb-6 text-[#64748b]">
            Your free trial has started. Redirecting to your dashboard...
          </p>
          <Link
            to="/dashboard"
            className="inline-flex items-center justify-center px-8 py-3.5 bg-[#7c3aed] text-white font-semibold rounded-xl shadow-lg shadow-[#7c3aed]/25 hover:bg-[#6d28d9] hover:shadow-xl hover:shadow-[#7c3aed]/30 hover:-translate-y-0.5 transition-all duration-200"
          >
            Go to Dashboard
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-[#f3f0ff] px-4 py-20">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/" className="font-heading text-3xl font-bold text-[#0f172a]">
            Eventora<span className="text-[#7c3aed]">X</span>
          </Link>
          <p className="font-body text-sm mt-2 text-[#64748b]">
            Create your account and start your free trial.
          </p>
        </div>

        {/* Trial Badge */}
        <div className="flex items-center justify-center gap-2 py-2.5 px-5 rounded-full mb-6 mx-auto w-fit bg-[#f5f3ff] text-[#7c3aed] border border-[#e9e4ff] shadow-sm">
          <Check size={16} className="text-[#7c3aed]" />
          <span className="font-body text-sm font-semibold">
            14-day free trial — No credit card required
          </span>
        </div>

        {/* Form */}
        <form
          onSubmit={handleSubmit(onSubmit)}
          noValidate
          className="bg-white rounded-2xl p-8 border border-[#e9e4ff] shadow-lg shadow-[#7c3aed]/5"
        >
          <div className="space-y-5">
            <div>
              <label className="font-body text-sm font-semibold mb-2 block text-[#0f172a]">
                Full Name
              </label>
              <input
                type="text"
                {...register('fullName')}
                aria-invalid={!!errors.fullName}
                className="w-full px-4 py-3 rounded-xl border border-[#e9e4ff] bg-white font-body text-sm text-[#0f172a] placeholder:text-[#94a3b8] focus:outline-none focus:ring-2 focus:ring-[#7c3aed]/30 focus:border-[#7c3aed] hover:border-[#c4b5fd] transition-all duration-200 aria-invalid:border-[#dc2626] aria-invalid:ring-2 aria-invalid:ring-[#dc2626]/20"
                placeholder="John Doe"
              />
              {errors.fullName && (
                <p className="mt-1.5 text-xs font-medium text-[#dc2626]">
                  {errors.fullName.message}
                </p>
              )}
            </div>

            <div>
              <label className="font-body text-sm font-semibold mb-2 block text-[#0f172a]">
                Organization Name
              </label>
              <input
                type="text"
                {...register('orgName')}
                aria-invalid={!!errors.orgName}
                className="w-full px-4 py-3 rounded-xl border border-[#e9e4ff] bg-white font-body text-sm text-[#0f172a] placeholder:text-[#94a3b8] focus:outline-none focus:ring-2 focus:ring-[#7c3aed]/30 focus:border-[#7c3aed] hover:border-[#c4b5fd] transition-all duration-200 aria-invalid:border-[#dc2626] aria-invalid:ring-2 aria-invalid:ring-[#dc2626]/20"
                placeholder="Acme University"
              />
              {errors.orgName && (
                <p className="mt-1.5 text-xs font-medium text-[#dc2626]">
                  {errors.orgName.message}
                </p>
              )}
            </div>

            <div>
              <label className="font-body text-sm font-semibold mb-2 block text-[#0f172a]">
                Email
              </label>
              <input
                type="email"
                {...register('email')}
                aria-invalid={!!errors.email}
                className="w-full px-4 py-3 rounded-xl border border-[#e9e4ff] bg-white font-body text-sm text-[#0f172a] placeholder:text-[#94a3b8] focus:outline-none focus:ring-2 focus:ring-[#7c3aed]/30 focus:border-[#7c3aed] hover:border-[#c4b5fd] transition-all duration-200 aria-invalid:border-[#dc2626] aria-invalid:ring-2 aria-invalid:ring-[#dc2626]/20"
                placeholder="you@example.com"
              />
              {errors.email && (
                <p className="mt-1.5 text-xs font-medium text-[#dc2626]">
                  {errors.email.message}
                </p>
              )}
            </div>

            <div>
              <label className="font-body text-sm font-semibold mb-2 block text-[#0f172a]">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  {...register('password')}
                  aria-invalid={!!errors.password}
                  className="w-full px-4 py-3 pr-12 rounded-xl border border-[#e9e4ff] bg-white font-body text-sm text-[#0f172a] placeholder:text-[#94a3b8] focus:outline-none focus:ring-2 focus:ring-[#7c3aed]/30 focus:border-[#7c3aed] hover:border-[#c4b5fd] transition-all duration-200 aria-invalid:border-[#dc2626] aria-invalid:ring-2 aria-invalid:ring-[#dc2626]/20"
                  placeholder="Create a strong password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#94a3b8] hover:text-[#7c3aed] transition-colors duration-200"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1.5 text-xs font-medium text-[#dc2626]">
                  {errors.password.message}
                </p>
              )}
            </div>

            <div>
              <label className="font-body text-sm font-semibold mb-2 block text-[#0f172a]">
                Phone
              </label>
              <input
                type="tel"
                {...register('phone')}
                aria-invalid={!!errors.phone}
                className="w-full px-4 py-3 rounded-xl border border-[#e9e4ff] bg-white font-body text-sm text-[#0f172a] placeholder:text-[#94a3b8] focus:outline-none focus:ring-2 focus:ring-[#7c3aed]/30 focus:border-[#7c3aed] hover:border-[#c4b5fd] transition-all duration-200 aria-invalid:border-[#dc2626] aria-invalid:ring-2 aria-invalid:ring-[#dc2626]/20"
                placeholder="+92 300 1234567"
              />
              {errors.phone && (
                <p className="mt-1.5 text-xs font-medium text-[#dc2626]">
                  {errors.phone.message}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-body font-semibold text-white bg-[#7c3aed] shadow-lg shadow-[#7c3aed]/25 hover:bg-[#6d28d9] hover:shadow-xl hover:shadow-[#7c3aed]/30 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 disabled:opacity-60 disabled:pointer-events-none"
            >
              <UserPlus size={18} />
              {isSubmitting ? 'Creating account...' : 'Create Account'}
            </button>
          </div>

          <p className="text-center mt-5 font-body text-xs text-[#94a3b8]">
            By signing up, you agree to our{' '}
            <Link to="/terms" className="text-[#7c3aed] hover:text-[#6d28d9] hover:underline font-medium transition-colors duration-200">
              Terms
            </Link>{' '}
            and{' '}
            <Link to="/privacy" className="text-[#7c3aed] hover:text-[#6d28d9] hover:underline font-medium transition-colors duration-200">
              Privacy Policy
            </Link>
            .
          </p>
        </form>

        {/* Login link */}
        <p className="text-center mt-6 font-body text-sm text-[#64748b]">
          Already have an account?{' '}
          <Link
            to="/login"
            className="font-semibold text-[#7c3aed] hover:text-[#6d28d9] hover:underline transition-colors duration-200"
          >
            Sign in
          </Link>
        </p>
      </div>
    </main>
  );
}