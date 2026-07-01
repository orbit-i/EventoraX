import { useState } from "react";
import { Link } from "react-router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Calendar, Check, Sparkles } from "lucide-react";
import { toast } from "sonner";

export default function Register() {
  const [form, setForm] = useState({
    fullName: "",
    organizationName: "",
    email: "",
    password: "",
    phone: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success("Account created! Redirecting to dashboard...");
    setTimeout(() => {
      window.location.href = "/dashboard";
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-6">
            <Calendar className="h-8 w-8 text-blue-500" />
            <span className="text-2xl font-bold text-blue-600">EventoraX</span>
          </Link>
          <h1 className="text-2xl font-bold text-slate-900">Start Your Free Trial</h1>
          <p className="text-slate-500 mt-1">No credit card required</p>
        </div>

        <div className="bg-white rounded-xl border border-blue-100 shadow-lg p-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
              <Input value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} placeholder="John Doe" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Organization Name</label>
              <Input value={form.organizationName} onChange={(e) => setForm({ ...form, organizationName: e.target.value })} placeholder="Your Organization" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
              <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="you@organization.com" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
              <Input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="Min 8 characters" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Phone</label>
              <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+92-300-1234567" />
            </div>
            <Button type="submit" className="w-full bg-blue-500 hover:bg-blue-600 text-white">
              <Sparkles className="h-4 w-4 mr-2" />
              Create Account & Start Trial
            </Button>
          </form>

          <div className="mt-4 flex items-center gap-2 text-xs text-green-600">
            <Check className="h-3 w-3" />
            <span>1-day free trial with full access to all features</span>
          </div>

          <div className="mt-6 text-center text-sm text-slate-500">
            Already have an account?{" "}
            <Link to="/login" className="text-blue-600 hover:underline">Login</Link>
          </div>

          <div className="mt-4 text-center text-xs text-slate-400">
            By signing up, you agree to our{" "}
            <Link to="/terms" className="text-blue-500 hover:underline">Terms</Link>
            {" "}&{" "}
            <Link to="/privacy" className="text-blue-500 hover:underline">Privacy Policy</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
