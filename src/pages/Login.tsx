import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, LogIn, Sparkles, AlertCircle } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({ email: '', password: '', remember: true });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await login({ email: form.email, password: form.password });
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Invalid email or password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fillDemo = () => {
    setForm({
      email: 'admin@eventorax.com',
      password: 'admin123',
      remember: true,
    });
    setError(null);
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

        {/* Demo Credentials Quick Pill */}
        <div 
          onClick={fillDemo}
          className="flex items-center justify-between gap-2 p-3 rounded-xl mb-4 bg-gradient-to-r from-[#f5f3ff] to-[#faf8ff] border border-[#e9e4ff] cursor-pointer hover:border-[#7c3aed] transition-all duration-200 shadow-sm group"
        >
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#7c3aed] animate-pulse" />
            <span className="text-xs font-semibold text-[#0f172a]">Demo Admin Account</span>
          </div>
          <span className="text-xs font-semibold text-[#7c3aed] group-hover:underline">
            Click to Auto-fill
          </span>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-4 p-3.5 rounded-xl bg-red-50 border border-red-200 flex items-start gap-2.5 text-red-700 text-sm">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-2xl p-8 border border-[#e9e4ff] shadow-lg shadow-[#7c3aed]/5"
        >
          <div className="space-y-5">
            <div>
              <label className="font-body text-sm font-semibold mb-2 block text-[#0f172a]">
                Email
              </label>
              <input
                type="email"
                required
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-[#e9e4ff] bg-white font-body text-sm text-[#0f172a] placeholder:text-[#94a3b8] focus:outline-none focus:ring-2 focus:ring-[#7c3aed]/30 focus:border-[#7c3aed] hover:border-[#c4b5fd] transition-all duration-200"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label className="font-body text-sm font-semibold mb-2 block text-[#0f172a]">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className="w-full px-4 py-3 pr-12 rounded-xl border border-[#e9e4ff] bg-white font-body text-sm text-[#0f172a] placeholder:text-[#94a3b8] focus:outline-none focus:ring-2 focus:ring-[#7c3aed]/30 focus:border-[#7c3aed] hover:border-[#c4b5fd] transition-all duration-200"
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
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.remember}
                  onChange={(e) => setForm({ ...form, remember: e.target.checked })}
                  className="size-4 rounded border-2 border-[#ddd6fe] accent-[#7c3aed] text-[#7c3aed] focus:ring-2 focus:ring-[#7c3aed]/30 cursor-pointer"
                />
                <span className="font-body text-sm text-[#475569]">
                  Remember me
                </span>
              </label>
              <Link
                to="#"
                className="font-body text-sm font-medium text-[#7c3aed] hover:text-[#6d28d9] hover:underline transition-colors duration-200"
              >
                Forgot password?
              </Link>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-body font-semibold text-white bg-[#7c3aed] shadow-lg shadow-[#7c3aed]/25 hover:bg-[#6d28d9] hover:shadow-xl hover:shadow-[#7c3aed]/30 hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-60 disabled:pointer-events-none transition-all duration-200"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <LogIn size={18} />
                  Sign In
                </>
              )}
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