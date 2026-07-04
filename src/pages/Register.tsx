import { useState } from 'react';
import { Link } from 'react-router';
import { Eye, EyeOff, UserPlus, Check } from 'lucide-react';

export default function Register() {
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({
    fullName: '',
    orgName: '',
    email: '',
    password: '',
    phone: '',
  });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-[#F5FAFF] px-4">
        <div className="w-full max-w-md text-center">
          <div
            className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6"
            style={{ backgroundColor: '#C8F0E4' }}
          >
            <Check size={36} style={{ color: '#2A8B6F' }} />
          </div>
          <h2
            className="font-heading text-3xl font-medium mb-3"
            style={{ color: '#1B2A4A' }}
          >
            Account created!
          </h2>
          <p className="font-body text-base mb-6" style={{ color: '#A0B4CC' }}>
            Your free trial has started. Redirecting to your dashboard...
          </p>
          <Link to="/" className="btn-primary">
            Go to Dashboard
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-[#F5FAFF] px-4 py-20">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link
            to="/"
            className="font-heading text-3xl font-medium"
            style={{ color: '#1B2A4A' }}
          >
            EventoraX
          </Link>
          <p className="font-body text-sm mt-2" style={{ color: '#A0B4CC' }}>
            Create your account and start your free trial.
          </p>
        </div>

        {/* Trial Badge */}
        <div
          className="flex items-center justify-center gap-2 py-2 px-4 rounded-full mb-6 mx-auto w-fit"
          style={{ backgroundColor: '#CCE5FF', color: '#4A9CFF' }}
        >
          <Check size={16} />
          <span className="font-body text-sm font-medium">
            14-day free trial — No credit card required
          </span>
        </div>

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-3xl p-8 border"
          style={{ borderColor: '#E8F4FD' }}
        >
          <div className="space-y-4">
            <div>
              <label
                className="font-body text-sm font-medium mb-1.5 block"
                style={{ color: '#1B2A4A' }}
              >
                Full Name
              </label>
              <input
                type="text"
                required
                value={form.fullName}
                onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border font-body text-sm focus:outline-none focus:ring-2 focus:ring-[#4A9CFF] focus:border-transparent transition-all"
                style={{ borderColor: '#E8F4FD', color: '#1B2A4A' }}
                placeholder="John Doe"
              />
            </div>

            <div>
              <label
                className="font-body text-sm font-medium mb-1.5 block"
                style={{ color: '#1B2A4A' }}
              >
                Organization Name
              </label>
              <input
                type="text"
                required
                value={form.orgName}
                onChange={(e) => setForm({ ...form, orgName: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border font-body text-sm focus:outline-none focus:ring-2 focus:ring-[#4A9CFF] focus:border-transparent transition-all"
                style={{ borderColor: '#E8F4FD', color: '#1B2A4A' }}
                placeholder="Acme University"
              />
            </div>

            <div>
              <label
                className="font-body text-sm font-medium mb-1.5 block"
                style={{ color: '#1B2A4A' }}
              >
                Email
              </label>
              <input
                type="email"
                required
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border font-body text-sm focus:outline-none focus:ring-2 focus:ring-[#4A9CFF] focus:border-transparent transition-all"
                style={{ borderColor: '#E8F4FD', color: '#1B2A4A' }}
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label
                className="font-body text-sm font-medium mb-1.5 block"
                style={{ color: '#1B2A4A' }}
              >
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className="w-full px-4 py-3 pr-12 rounded-xl border font-body text-sm focus:outline-none focus:ring-2 focus:ring-[#4A9CFF] focus:border-transparent transition-all"
                  style={{ borderColor: '#E8F4FD', color: '#1B2A4A' }}
                  placeholder="Create a strong password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                  style={{ color: '#A0B4CC' }}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div>
              <label
                className="font-body text-sm font-medium mb-1.5 block"
                style={{ color: '#1B2A4A' }}
              >
                Phone
              </label>
              <input
                type="tel"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border font-body text-sm focus:outline-none focus:ring-2 focus:ring-[#4A9CFF] focus:border-transparent transition-all"
                style={{ borderColor: '#E8F4FD', color: '#1B2A4A' }}
                placeholder="+92 300 1234567"
              />
            </div>

            <button
              type="submit"
              className="w-full flex items-center justify-center gap-2 py-3.5 rounded-full font-body font-medium text-white transition-all duration-300 hover:scale-[1.02]"
              style={{ backgroundColor: '#4A9CFF' }}
            >
              <UserPlus size={18} />
              Create Account
            </button>
          </div>

          <p
            className="text-center mt-4 font-body text-xs"
            style={{ color: '#A0B4CC' }}
          >
            By signing up, you agree to our{' '}
            <Link to="/terms" className="hover:underline" style={{ color: '#4A9CFF' }}>
              Terms
            </Link>{' '}
            and{' '}
            <Link to="/privacy" className="hover:underline" style={{ color: '#4A9CFF' }}>
              Privacy Policy
            </Link>
            .
          </p>
        </form>

        {/* Login link */}
        <p
          className="text-center mt-6 font-body text-sm"
          style={{ color: '#A0B4CC' }}
        >
          Already have an account?{' '}
          <Link
            to="/login"
            className="font-medium hover:underline"
            style={{ color: '#4A9CFF' }}
          >
            Sign in
          </Link>
        </p>
      </div>
    </main>
  );
}
