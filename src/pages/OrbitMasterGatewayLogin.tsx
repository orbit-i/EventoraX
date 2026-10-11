import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, Lock, Key, ArrowRight, Eye, EyeOff, AlertCircle, ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { api } from '@/services/api';
import BrandLogo from '@/components/BrandLogo';

export default function OrbitMasterGatewayLogin() {
  const [email, setEmail] = useState('admin@eventorax.com');
  const [password, setPassword] = useState('admin123');
  const [masterKey, setMasterKey] = useState('ORBIT-I-HQ-2026');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleMasterLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await api.platformAdmin.gatewayLogin({
        email: email.trim(),
        password,
        masterKey: masterKey.trim()
      });

      if (res.success && res.token) {
        localStorage.setItem('token', res.token);
        localStorage.setItem('user', JSON.stringify(res.user));
        localStorage.setItem('activeTenant', JSON.stringify(res.tenant));
        localStorage.setItem('orbitMasterSession', 'true');
        
        // Navigate to secret console
        window.location.href = '/orbit-i-master-gateway/console';
      } else {
        setError(res.message || 'Master Authority authentication failed.');
      }
    } catch (err: any) {
      setError(err.message || 'Access Denied: Invalid Master Authority credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-[#090d16] via-[#0f172a] to-[#1e1b4b] text-white flex flex-col justify-between p-4 sm:p-8">
      {/* Top Header */}
      <div className="max-w-6xl mx-auto w-full flex items-center justify-between py-2">
        <BrandLogo variant="compact" size="md" showTagline={false} />
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-500/10 border border-red-500/30 text-xs font-bold text-red-400">
          <ShieldAlert className="w-3.5 h-3.5 text-red-400" />
          Restricted Master Authority Area
        </div>
      </div>

      {/* Login Box */}
      <div className="max-w-md mx-auto w-full my-auto py-8">
        <div className="bg-slate-900/90 backdrop-blur-2xl rounded-3xl p-8 sm:p-10 border border-slate-700/60 shadow-2xl shadow-indigo-950/60 space-y-6">
          <div className="text-center space-y-2">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center mx-auto shadow-lg shadow-blue-500/30">
              <ShieldCheck className="w-8 h-8" />
            </div>
            <h1 className="text-2xl font-black font-heading text-white tracking-tight">
              ORBIT-I Master Authority
            </h1>
            <p className="text-xs text-slate-400">
              Private gateway for EventoraX platform governance, client plan activations, and SaaS oversight.
            </p>
          </div>

          {error && (
            <div className="p-3.5 rounded-2xl bg-rose-950/60 border border-rose-800 text-rose-300 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleMasterLogin} className="space-y-4">
            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1.5">
                Master Administrator Email
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-800/90 border border-slate-700 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="admin@eventorax.com"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1.5">
                Master Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-2.5 pr-10 rounded-xl bg-slate-800/90 border border-slate-700 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Master authorization password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1.5 flex items-center justify-between">
                <span>Master Security Passcode</span>
                <span className="text-[10px] text-slate-500 font-mono">ORBIT-I 2FA Protocol</span>
              </label>
              <div className="relative">
                <input
                  type="password"
                  value={masterKey}
                  onChange={(e) => setMasterKey(e.target.value)}
                  className="w-full px-4 py-2.5 pr-10 rounded-xl bg-slate-800/90 border border-slate-700 text-sm text-white font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="ORBIT-I-HQ-2026"
                />
                <Key className="w-4 h-4 text-slate-500 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold rounded-xl h-11 text-xs shadow-lg shadow-blue-600/30 mt-2 flex items-center justify-center gap-2"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Lock className="w-4 h-4" />
                  Authenticate Master Authority
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </Button>
          </form>

          <div className="pt-2 border-t border-slate-800 text-center">
            <Link to="/" className="text-xs text-slate-400 hover:text-white transition-colors">
              &larr; Return to Official Public Portal
            </Link>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="max-w-6xl mx-auto w-full text-center text-xs text-slate-500 py-2">
        ORBIT-I Private Limited • Security Directive 2026-X9 • Unauthorized probes are logged.
      </div>
    </main>
  );
}
