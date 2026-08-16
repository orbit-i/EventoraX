import { useState } from 'react';
import { Link } from 'react-router';
import { UserPlus, Check, User, Building2, Mail, Phone, Briefcase } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input, PasswordInput, SelectInput, TextareaInput } from '@/components/ui/input';

export default function Register() {
  const [form, setForm] = useState({
    fullName: '',
    orgName: '',
    email: '',
    password: '',
    phone: '',
    role: '',
    bio: '',
  });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

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
          <Button asChild variant="default" size="lg">
            <Link to="/">Go to Dashboard</Link>
          </Button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-[#f3f0ff] px-4 py-20">
      <div className="w-full max-w-lg">

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
          onSubmit={handleSubmit}
          className="bg-white rounded-2xl p-8 border border-[#e9e4ff] shadow-lg shadow-[#7c3aed]/5"
        >
          <div className="space-y-4">

            {/* Row 1 — Full Name + Organization */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Full Name"
                type="text"
                placeholder="John Doe"
                icon={<User className="w-4 h-4" />}
                required
                value={form.fullName}
                onChange={(e) => setForm({ ...form, fullName: e.target.value })}
              />
              <Input
                label="Organization"
                type="text"
                placeholder="Acme University"
                icon={<Building2 className="w-4 h-4" />}
                required
                value={form.orgName}
                onChange={(e) => setForm({ ...form, orgName: e.target.value })}
              />
            </div>

            {/* Row 2 — Email + Phone */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Email"
                type="email"
                placeholder="you@example.com"
                icon={<Mail className="w-4 h-4" />}
                required
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
              <Input
                label="Phone"
                type="tel"
                placeholder="+92 300 1234567"
                icon={<Phone className="w-4 h-4" />}
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
              />
            </div>

            {/* Row 3 — Password + Role */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <PasswordInput
                label="Password"
                placeholder="Create a strong password"
                helper="Min. 8 characters"
                required
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
              />
              <SelectInput
                label="Role"
                placeholder="Select your role"
                options={[
                  { value: 'event_director', label: 'Event Director' },
                  { value: 'organizer',      label: 'Event Organizer' },
                  { value: 'coordinator',    label: 'Coordinator' },
                  { value: 'marketing',      label: 'Marketing' },
                  { value: 'operations',     label: 'Operations' },
                  { value: 'other',          label: 'Other' },
                ]}
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value })}
              />
            </div>

            {/* Row 4 — Bio full width */}
            <TextareaInput
              label="Bio"
              placeholder="Tell us a little about yourself or your organization... (optional)"
              rows={3}
              value={form.bio}
              onChange={(e) => setForm({ ...form, bio: e.target.value })}
            />

            {/* Submit */}
            <Button type="submit" variant="default" size="lg" className="w-full mt-2">
              <UserPlus size={18} />
              Create Account
            </Button>

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
