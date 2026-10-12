import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, Lock, Key, ArrowRight, Eye, EyeOff, AlertCircle, ShieldAlert, UserPlus, LogIn, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { api } from '@/services/api';
import BrandLogo from '@/components/BrandLogo';

export default function OrbitMasterGatewayLogin() {
  const [mode, setMode] = useState<'login' | 'setup'>('login');
  
  // Login states
  const [email, setEmail] = useState('admin@eventorax.com');
  const [password, setPassword] = useState('admin123');
  const [masterKey, setMasterKey] = useState('ORBIT-I-HQ-2026');
  
  // Setup states (for creating custom SuperAdmin credentials)
  const [setupName, setSetupName] = useState('');
  const [setupEmail, setSetupEmail] = useState('');
  const [setupPassword, setSetupPassword] = useState('');
  const [setupConfirmPassword, setSetupConfirmPassword] = useState('');
  const [setupMasterKey, setSetupMasterKey] = useState('ORBIT-I-HQ-2026');
  
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleMasterLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
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

  const handleMasterSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    if (setupPassword !== setupConfirmPassword) {
      setError('Passwords do not match. Please verify both password fields.');
      return;
    }

    if (setupPassword.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setLoading(true);

    try {
      const res = await api.platformAdmin.gatewaySetup({
        fullName: setupName.trim() || 'Platform SuperAdmin',
        email: setupEmail.trim().toLowerCase(),
        password: setupPassword,
        masterKey: setupMasterKey.trim()
      });

      if (res.success && res.token) {
        setSuccessMsg('SuperAdmin credentials configured successfully! Logging in...');
        localStorage.setItem('token', res.token);
        localStorage.setItem('user', JSON.stringify(res.user));
        localStorage.setItem('activeTenant', JSON.stringify(res.tenant));
        localStorage.setItem('orbitMasterSession', 'true');

        setTimeout(() => {
          window.location.href = '/orbit-i-master-gateway/console';
        }, 1000);
      } else {
        setError(res.message || 'Failed to configure SuperAdmin credentials.');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to configure SuperAdmin credentials. Check Master Key.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-[#090d16] via-[#0f172a] to-[#1e1b4b] text-white flex flex-col justify-between p-3 sm:p-8">
      {/* Top Header */}
      <div className="max-w-6xl mx-auto w-full flex items-center justify-between py-2">
        <BrandLogo variant="compact" size="md" showTagline={false} />
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-500/10 border border-red-500/30 text-xs font-bold text-red-400">
          <ShieldAlert className="w-3.5 h-3.5 text-red-400" />
          Restricted Platform Authority Area
        </div>
      </div>

      {/* Main Container */}
      <div className="max-w-md mx-auto w-full my-auto py-6 sm:py-8">
        <div className="bg-slate-900/95 backdrop-blur-2xl rounded-3xl p-5 sm:p-8 border border-slate-700/60 shadow-2xl shadow-indigo-950/60 space-y-5">
          
          <div className="text-center space-y-1.5">
            <div className="w-13 h-13 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center mx-auto shadow-lg shadow-blue-500/30">
              <ShieldCheck className="w-7 h-7" />
            </div>
            <h1 className="text-xl sm:text-2xl font-black font-heading text-white tracking-tight">
              ORBIT-I Master Authority
            </h1>
            <p className="text-xs text-slate-400">
              EventoraX platform governance, client activations &amp; SaaS management.
            </p>
          </div>

          {/* Mode Switch Tabs */}
          <div className="grid grid-cols-2 p-1 rounded-2xl bg-slate-800/80 border border-slate-700/60 text-xs font-bold">
            <button
              type="button"
              onClick={() => { setMode('login'); setError(null); }}
              className={`py-2 rounded-xl flex items-center justify-center gap-1.5 transition-all ${
                mode === 'login' ? 'bg-[#1d4ed8] text-white shadow-md' : 'text-slate-400 hover:text-white'
              }`}
            >
              <LogIn className="w-3.5 h-3.5" />
              Sign In
            </button>
            <button
              type="button"
              onClick={() => { setMode('setup'); setError(null); }}
              className={`py-2 rounded-xl flex items-center justify-center gap-1.5 transition-all ${
                mode === 'setup' ? 'bg-[#1d4ed8] text-white shadow-md' : 'text-slate-400 hover:text-white'
              }`}
            >
              <UserPlus className="w-3.5 h-3.5" />
              Create / Reset Admin
            </button>
          </div>

          {error && (
            <div className="p-3 rounded-2xl bg-rose-950/60 border border-rose-800 text-rose-300 text-xs flex items-start gap-2 animate-in fade-in">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 rounded-2xl bg-emerald-950/60 border border-emerald-800 text-emerald-300 text-xs flex items-start gap-2 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-400" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* TAB 1: LOGIN FORM */}
          {mode === 'login' && (
            <form onSubmit={handleMasterLogin} className="space-y-3.5">
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">
                  Master Administrator Email
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800/90 border border-slate-700 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="admin@eventorax.com"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">
                  Master Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-3.5 py-2.5 pr-10 rounded-xl bg-slate-800/90 border border-slate-700 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Master password"
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
                <label className="text-xs font-bold text-slate-300 block mb-1 flex items-center justify-between">
                  <span>Master Security Passcode</span>
                  <span className="text-[10px] text-slate-400 font-mono">ORBIT-I 2FA Protocol</span>
                </label>
                <div className="relative">
                  <input
                    type="password"
                    value={masterKey}
                    onChange={(e) => setMasterKey(e.target.value)}
                    className="w-full px-3.5 py-2.5 pr-10 rounded-xl bg-slate-800/90 border border-slate-700 text-sm text-white font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                    Sign In to SuperAdmin Console
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </Button>
            </form>
          )}

          {/* TAB 2: SETUP CUSTOM SUPERADMIN CREDENTIALS */}
          {mode === 'setup' && (
            <form onSubmit={handleMasterSetup} className="space-y-3.5">
              <div className="bg-blue-500/10 border border-blue-500/20 rounded-2xl p-3 text-[11px] text-blue-200 space-y-1">
                <span className="font-bold block text-white flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
                  Create Your Own SuperAdmin Account
                </span>
                Enter your preferred email and password below with the Master Security Key (<code>ORBIT-I-HQ-2026</code>) to configure your private credentials.
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">Your Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Platform Owner"
                  value={setupName}
                  onChange={(e) => setSetupName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800/90 border border-slate-700 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">New SuperAdmin Email *</label>
                <input
                  type="email"
                  required
                  placeholder="e.g. owner@orbit-i.tech"
                  value={setupEmail}
                  onChange={(e) => setSetupEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800/90 border border-slate-700 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">Password (6+ chars) *</label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    placeholder="Enter password"
                    value={setupPassword}
                    onChange={(e) => setSetupPassword(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800/90 border border-slate-700 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">Confirm Password *</label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    placeholder="Re-type password"
                    value={setupConfirmPassword}
                    onChange={(e) => setSetupConfirmPassword(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800/90 border border-slate-700 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1 flex items-center justify-between">
                  <span>Master Security Passcode *</span>
                  <span className="text-[10px] text-blue-400 font-mono">Default: ORBIT-I-HQ-2026</span>
                </label>
                <input
                  type="password"
                  required
                  value={setupMasterKey}
                  onChange={(e) => setSetupMasterKey(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800/90 border border-slate-700 text-sm text-white font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="ORBIT-I-HQ-2026"
                />
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold rounded-xl h-11 text-xs shadow-lg shadow-emerald-600/30 mt-2 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    Save &amp; Activate SuperAdmin Account
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </Button>
            </form>
          )}

          <div className="pt-2 border-t border-slate-800 text-center">
            <Link to="/" className="text-xs text-slate-400 hover:text-white transition-colors">
              &larr; Return to Official Public Portal
            </Link>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="max-w-6xl mx-auto w-full text-center text-xs text-slate-500 py-2">
        ORBIT-I Private Limited • Security Directive 2026-X9 • SuperAdmin Portal
      </div>
    </main>
  );
}
