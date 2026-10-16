import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, UserPlus, Check, AlertCircle, Sparkles } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import BrandLogo from '@/components/BrandLogo';
import { getUtmParams } from '@/lib/utm';

export default function Register() {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({
    fullName: '',
    orgName: '',
    email: '',
    password: '',
    phone: '',
  });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!form.fullName.trim() || !form.email.trim() || !form.password) {
      setError('Please fill in all required fields (Full Name, Email, Password).');
      return;
    }

    if (form.password.length < 6) {
      setError('Password must contain at least 6 characters.');
      return;
    }

    setLoading(true);

    try {
      const utmData = getUtmParams();
      await register({
        fullName: form.fullName.trim(),
        orgName: form.orgName.trim() || 'My Organization',
        email: form.email.trim().toLowerCase(),
        password: form.password,
        phone: form.phone.trim(),
        ...utmData
      });
      setSubmitted(true);
      setTimeout(() => {
        navigate('/dashboard');
      }, 1800);
    } catch (err: any) {
      setError(err.message || 'Registration failed. Please check your information and try again.');
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-[#f8fafc] px-4 font-body">
        <div className="w-full max-w-md text-center p-8 bg-white rounded-3xl border border-slate-200 shadow-xl">
          <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 bg-emerald-50 text-emerald-600 border border-emerald-200 animate-bounce">
            <Check size={36} className="text-emerald-600" />
          </div>
          <h2 className="font-heading text-3xl font-bold mb-3 text-slate-900">
            Account created successfully!
          </h2>
          <p className="font-body text-sm mb-6 text-slate-600 leading-relaxed">
            Your organization workspace has been initialized and your 14-day free trial is now active. Launching your dashboard...
          </p>
          <Link
            to="/dashboard"
            className="inline-flex items-center justify-center px-8 py-3.5 bg-blue-600 text-white font-bold rounded-xl shadow-lg shadow-blue-600/25 hover:bg-blue-700 transition-all duration-200"
          >
            Go to Dashboard Now
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-[#f8fafc] px-4 py-16 font-body">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8 flex flex-col items-center">
          <Link to="/" className="inline-block mb-2" title="Return to EventoraX Homepage">
            <BrandLogo variant="compact" size="lg" showTagline={true} />
          </Link>
          <p className="font-body text-sm mt-2 text-[#64748b]">
            Create your organization account and start your 14-day free trial.
          </p>
        </div>

        {/* Trial Badge */}
        <div className="flex items-center justify-center gap-2 py-2 px-4 rounded-full mb-6 mx-auto w-fit bg-blue-50 text-blue-700 border border-blue-200 shadow-xs">
          <Sparkles size={15} className="text-blue-600" />
          <span className="font-body text-xs font-bold">
            14-day free organizer trial — No credit card required
          </span>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-4 p-3.5 rounded-xl bg-red-50 border border-red-200 flex items-start gap-2.5 text-red-700 text-sm animate-in fade-in">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-600" />
            <span className="leading-relaxed">{error}</span>
          </div>
        )}

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-3xl p-7 sm:p-8 border border-slate-200 shadow-xl shadow-slate-900/5 space-y-4"
        >
          <div>
            <label className="font-body text-xs font-bold mb-1.5 block text-slate-800">
              Full Name *
            </label>
            <input
              type="text"
              required
              value={form.fullName}
              onChange={(e) => setForm({ ...form, fullName: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white font-body text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600/30 focus:border-blue-600 transition-all duration-200"
              placeholder="e.g. John Doe"
            />
          </div>

          <div>
            <label className="font-body text-xs font-bold mb-1.5 block text-slate-800">
              Organization / Company Name
            </label>
            <input
              type="text"
              value={form.orgName}
              onChange={(e) => setForm({ ...form, orgName: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white font-body text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600/30 focus:border-blue-600 transition-all duration-200"
              placeholder="e.g. Acme University / Tech Institute"
            />
          </div>

          <div>
            <label className="font-body text-xs font-bold mb-1.5 block text-slate-800">
              Official Email Address *
            </label>
            <input
              type="email"
              required
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white font-body text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600/30 focus:border-blue-600 transition-all duration-200"
              placeholder="e.g. you@organization.com"
            />
          </div>

          <div>
            <label className="font-body text-xs font-bold mb-1.5 block text-slate-800">
              Password (6+ characters) *
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                minLength={6}
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                className="w-full px-4 py-2.5 pr-12 rounded-xl border border-slate-200 bg-white font-body text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600/30 focus:border-blue-600 transition-all duration-200"
                placeholder="Choose a secure password"
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

          <div>
            <label className="font-body text-xs font-bold mb-1.5 block text-slate-800">
              Contact Phone / WhatsApp
            </label>
            <input
              type="tel"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white font-body text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600/30 focus:border-blue-600 transition-all duration-200"
              placeholder="e.g. +92 319 0375751"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-body font-bold text-sm text-white bg-blue-600 shadow-lg shadow-blue-600/25 hover:bg-blue-700 hover:shadow-xl hover:shadow-blue-600/30 active:translate-y-0 disabled:opacity-60 disabled:pointer-events-none transition-all duration-200 cursor-pointer mt-2"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <UserPlus size={18} />
                Create Free Workspace
              </>
            )}
          </button>

          <p className="text-center mt-4 font-body text-xs text-slate-500">
            By signing up, you agree to our{' '}
            <Link to="/terms" className="text-blue-600 hover:underline font-semibold">
              Terms of Service
            </Link>{' '}
            and{' '}
            <Link to="/privacy" className="text-blue-600 hover:underline font-semibold">
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
            className="font-bold text-blue-600 hover:underline transition-colors duration-200"
          >
            Sign in
          </Link>
        </p>
      </div>
    </main>
  );
}