import { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, LogIn } from 'lucide-react';
import { toast } from 'sonner';

const loginSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  remember: z.boolean(),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function Login() {
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '', remember: false },
  });

  const onSubmit = async (data: LoginFormValues) => {
    // Simulated auth call — replace with real API request when backend is ready
    await new Promise((resolve) => setTimeout(resolve, 600));

    localStorage.setItem('token', 'demo-token');
    if (data.remember) {
      localStorage.setItem('rememberMe', 'true');
    }

    toast.success('Welcome back!');
    navigate('/dashboard');
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
            Welcome back! Sign in to your account.
          </p>
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
                  placeholder="Enter your password"
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

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  {...register('remember')}
                  className="size-4 rounded border-2 border-[#ddd6fe] accent-[#7c3aed] text-[#7c3aed] focus:ring-2 focus:ring-[#7c3aed]/30 cursor-pointer"
                />
                <span className="font-body text-sm text-[#475569]">
                  Remember me
                </span>
              </label>
              <Link
                to="/forgot-password"
                className="font-body text-sm font-medium text-[#7c3aed] hover:text-[#6d28d9] hover:underline transition-colors duration-200"
              >
                Forgot password?
              </Link>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-body font-semibold text-white bg-[#7c3aed] shadow-lg shadow-[#7c3aed]/25 hover:bg-[#6d28d9] hover:shadow-xl hover:shadow-[#7c3aed]/30 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 disabled:opacity-60 disabled:pointer-events-none"
            >
              <LogIn size={18} />
              {isSubmitting ? 'Signing in...' : 'Sign In'}
            </button>
          </div>
        </form>

        {/* Sign up link */}
        <p className="text-center mt-6 font-body text-sm text-[#64748b]">
          Don&apos;t have an account?{' '}
          <Link to="/register" className="font-semibold text-[#7c3aed] hover:text-[#6d28d9] hover:underline transition-colors duration-200">
            Sign up
          </Link>
        </p>
      </div>
    </main>
  );
}