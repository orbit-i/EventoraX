import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, LogIn, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import BrandLogo from '@/components/BrandLogo';

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({ email: '', password: '', remember: true });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!form.email.trim() || !form.password) {
      setError('Please provide both your registered email address and password.');
      return;
    }

    setLoading(true);

    try {
      await login({ email: form.email.trim(), password: form.password });
      setSuccess('Authenticated successfully! Redirecting to organization workspace...');
      setTimeout(() => {
        navigate('/dashboard');
      }, 700);
    } catch (err: any) {
      if (err.message?.includes('SUPERADMIN_PORTAL_REQUIRED') || err.message?.includes('Master Gateway')) {
        setError('This portal is reserved for Client Organizations. EventoraX Platform SuperAdmin must authenticate exclusively via the private Master Gateway URL.');
      } else {
        setError(err.message || 'Invalid email or password. Please verify your credentials.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-[#f8fafc] px-4 py-16 font-body">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8 flex flex-col items-center">
          <Link to="/" className="inline-block mb-2" title="Return to EventoraX Homepage">
            <BrandLogo variant="compact" size="lg" showTagline={true} />
          </Link>
          <div className="inline-block px-3 py-1 rounded-full bg-blue-50 text-[#1d4ed8] border border-blue-200 text-xs font-bold mt-1 shadow-xs">
            Client Organization Portal
          </div>
          <p className="font-body text-sm mt-2 text-[#64748b]">
            Sign in to your dedicated organization workspace.
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-4 p-3.5 rounded-xl bg-red-50 border border-red-200 flex items-start gap-2.5 text-red-700 text-sm animate-in fade-in">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-600" />
            <span className="leading-relaxed">{error}</span>
          </div>
        )}

        {/* Success Alert */}
        {success && (
          <div className="mb-4 p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 flex items-start gap-2.5 text-emerald-700 text-sm animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600" />
            <span className="leading-relaxed">{success}</span>
          </div>
        )}

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-3xl p-7 sm:p-8 border border-slate-200 shadow-xl shadow-slate-900/5 space-y-5"
        >
          <div>
            <label className="font-body text-xs font-bold mb-1.5 block text-slate-800">
              Email Address *
            </label>
            <input
              type="email"
              required
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white font-body text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600/30 focus:border-blue-600 transition-all duration-200"
              placeholder="e.g. organizer@organization.com"
              autoComplete="email"
            />
          </div>

          <div>
            <label className="font-body text-xs font-bold mb-1.5 block text-slate-800">
              Password *
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                className="w-full px-4 py-3 pr-12 rounded-xl border border-slate-200 bg-white font-body text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600/30 focus:border-blue-600 transition-all duration-200"
                placeholder="Enter your password"
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-blue-600 p-1 rounded-lg transition-colors cursor-pointer"
                title={showPassword ? 'Hide password' : 'Show password'}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
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
                className="size-4 rounded border-2 border-slate-300 accent-blue-600 text-blue-600 focus:ring-2 focus:ring-blue-600/30 cursor-pointer"
              />
              <span className="font-body text-xs font-medium text-slate-600">
                Remember this device
              </span>
            </label>
            {/* Fixed broken link: points to contact password reset */}
            <Link
              to="/contact?subject=Password+Reset+Request"
              className="font-body text-xs font-semibold text-blue-600 hover:text-blue-700 hover:underline transition-colors duration-200"
            >
              Forgot password?
            </Link>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-body font-bold text-sm text-white bg-blue-600 shadow-lg shadow-blue-600/25 hover:bg-blue-700 hover:shadow-xl hover:shadow-blue-600/30 active:translate-y-0 disabled:opacity-60 disabled:pointer-events-none transition-all duration-200 cursor-pointer"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <LogIn size={18} />
                Sign In to Dashboard
              </>
            )}
          </button>
        </form>

        {/* Sign up link */}
        <p className="text-center mt-6 font-body text-sm text-[#64748b]">
          Need an organization account?{' '}
          <Link to="/register" className="font-bold text-blue-600 hover:text-blue-700 hover:underline transition-colors duration-200">
            Start 14-day free trial
          </Link>
        </p>
      </div>
    </main>
  );
}