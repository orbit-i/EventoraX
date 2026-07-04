import { useState } from 'react';
import { Link } from 'react-router';
import { Eye, EyeOff, LogIn } from 'lucide-react';

export default function Login() {
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({ email: '', password: '', remember: false });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle login logic
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-[#F5FAFF] px-4 py-20">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/" className="font-heading text-3xl font-medium" style={{ color: '#1B2A4A' }}>
            EventoraX
          </Link>
          <p className="font-body text-sm mt-2" style={{ color: '#A0B4CC' }}>
            Welcome back! Sign in to your account.
          </p>
        </div>

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-3xl p-8 border"
          style={{ borderColor: '#E8F4FD' }}
        >
          <div className="space-y-4">
            <div>
              <label className="font-body text-sm font-medium mb-1.5 block" style={{ color: '#1B2A4A' }}>
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
              <label className="font-body text-sm font-medium mb-1.5 block" style={{ color: '#1B2A4A' }}>
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
                  placeholder="Enter your password"
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

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.remember}
                  onChange={(e) => setForm({ ...form, remember: e.target.checked })}
                  className="w-4 h-4 rounded border accent-[#4A9CFF]"
                  style={{ borderColor: '#E8F4FD' }}
                />
                <span className="font-body text-sm" style={{ color: '#A0B4CC' }}>
                  Remember me
                </span>
              </label>
              <Link
                to="#"
                className="font-body text-sm hover:underline"
                style={{ color: '#4A9CFF' }}
              >
                Forgot password?
              </Link>
            </div>

            <button
              type="submit"
              className="w-full flex items-center justify-center gap-2 py-3.5 rounded-full font-body font-medium text-white transition-all duration-300 hover:scale-[1.02]"
              style={{ backgroundColor: '#4A9CFF' }}
            >
              <LogIn size={18} />
              Sign In
            </button>
          </div>
        </form>

        {/* Sign up link */}
        <p className="text-center mt-6 font-body text-sm" style={{ color: '#A0B4CC' }}>
          Don&apos;t have an account?{' '}
          <Link to="/register" className="font-medium hover:underline" style={{ color: '#4A9CFF' }}>
            Sign up
          </Link>
        </p>
      </div>
    </main>
  );
}
