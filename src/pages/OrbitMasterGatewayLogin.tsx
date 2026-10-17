import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, Lock, ArrowRight, Eye, EyeOff, AlertCircle, ShieldAlert, UserPlus, LogIn, CheckCircle2, KeyRound, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { api } from '@/services/api';
import BrandLogo from '@/components/BrandLogo';

export default function OrbitMasterGatewayLogin() {
  const [mode, setMode] = useState<'login' | 'setup'>('login');
  const [isInitialized, setIsInitialized] = useState<boolean | null>(null);
  const [checkingStatus, setCheckingStatus] = useState(true);
  
  // Login states - no hardcoded loophole credentials
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [masterKey, setMasterKey] = useState('');
  
  // Visibility toggles for login
  const [showPassword, setShowPassword] = useState(false);
  const [showMasterKey, setShowMasterKey] = useState(false);
  
  // Setup states (for creating custom SuperAdmin credentials)
  const [setupName, setSetupName] = useState('');
  const [setupEmail, setSetupEmail] = useState('');
  const [setupPassword, setSetupPassword] = useState('');
  const [setupConfirmPassword, setSetupConfirmPassword] = useState('');
  const [setupMasterKey, setSetupMasterKey] = useState('');
  
  // Visibility toggles for setup
  const [showSetupPassword, setShowSetupPassword] = useState(false);
  const [showSetupConfirmPassword, setShowSetupConfirmPassword] = useState(false);
  const [showSetupMasterKey, setShowSetupMasterKey] = useState(false);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Check if a Master SuperAdmin has already been created.
  // Once a SuperAdmin exists, secondary registration is permanently locked out.
  useEffect(() => {
    let isMounted = true;
    const checkStatus = async () => {
      try {
        const res = await api.platformAdmin.getGatewayStatus();
        if (isMounted && res.success) {
          setIsInitialized(res.isInitialized);
          if (res.isInitialized) {
            setMode('login');
          } else {
            setMode('setup'); // First-time provisioning
          }
        }
      } catch (err) {
        console.warn('[Master Gateway] Status check notice:', err);
        if (isMounted) {
          setIsInitialized(true);
          setMode('login');
        }
      } finally {
        if (isMounted) setCheckingStatus(false);
      }
    };
    checkStatus();
    return () => { isMounted = false; };
  }, []);

  const handleMasterLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    if (!email.trim() || !password || !masterKey.trim()) {
      setError('Please provide your Email, Password, and Master Security Passcode.');
      return;
    }

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

    if (!setupEmail.trim()) {
      setError('Please provide a valid SuperAdmin email.');
      return;
    }

    if (setupPassword !== setupConfirmPassword) {
      setError('Passwords do not match. Please verify both password fields.');
      return;
    }

    if (setupPassword.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    if (!setupMasterKey.trim() || setupMasterKey.trim().length < 4) {
      setError('Please create a Master Security Passcode with at least 4 characters.');
      return;
    }

    setLoading(true);

    try {
      const res = await api.platformAdmin.gatewaySetup({
        fullName: setupName.trim() || 'ORBIT-I Platform SuperAdmin',
        email: setupEmail.trim().toLowerCase(),
        password: setupPassword,
        masterKey: setupMasterKey.trim()
      });

      if (res.success && res.token) {
        setSuccessMsg('SuperAdmin credentials configured successfully! Logging in...');
        setIsInitialized(true);
        setMode('login');
        
        // Synchronize login states
        setEmail(setupEmail.trim().toLowerCase());
        setPassword(setupPassword);
        setMasterKey(setupMasterKey.trim());

        localStorage.setItem('token', res.token);
        localStorage.setItem('user', JSON.stringify(res.user));
        localStorage.setItem('activeTenant', JSON.stringify(res.tenant));
        localStorage.setItem('orbitMasterSession', 'true');

        setTimeout(() => {
          window.location.href = '/orbit-i-master-gateway/console';
        }, 1200);
      } else {
        setError(res.message || 'Failed to configure SuperAdmin credentials.');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to configure SuperAdmin credentials.');
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
              Eventrye platform governance, client activations &amp; SaaS management.
            </p>
          </div>

          {/* Mode Switch Tabs / Initialization State Banner */}
          {checkingStatus ? (
            <div className="py-2.5 px-3 rounded-2xl bg-slate-800/60 border border-slate-700/60 flex items-center justify-center gap-2 text-xs text-slate-400">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-400" />
              Verifying Master Authority Sentinel...
            </div>
          ) : isInitialized ? (
            /* Strict Single SuperAdmin Rule: Direct Login Only - Setup Tab is permanently removed */
            <div className="p-2.5 rounded-2xl bg-blue-950/50 border border-blue-800/60 flex items-center justify-center gap-2 text-xs font-bold text-blue-300 shadow-inner">
              <Lock className="w-3.5 h-3.5 text-blue-400 shrink-0" />
              Single Master Authority Enforced • Direct Login Only
            </div>
          ) : (
            /* First-Time Provisioning Mode */
            <div className="p-2.5 rounded-2xl bg-emerald-950/50 border border-emerald-800/60 flex items-center justify-center gap-2 text-xs font-bold text-emerald-300 shadow-inner">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              ⚡ First-Time Initialization • Configure SuperAdmin
            </div>
          )}

          {error && (
            <div className="p-3.5 rounded-2xl bg-rose-950/70 border border-rose-800 text-rose-300 text-xs flex items-start gap-2.5 animate-in fade-in">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
              <span className="leading-relaxed">{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3.5 rounded-2xl bg-emerald-950/70 border border-emerald-800 text-emerald-300 text-xs flex items-start gap-2.5 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-400" />
              <span className="leading-relaxed">{successMsg}</span>
            </div>
          )}

          {/* TAB 1: LOGIN FORM */}
          {mode === 'login' && (
            <form onSubmit={handleMasterLogin} className="space-y-4">
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
                  placeholder="e.g. ab.samad@orbit-i.tech"
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
                    className="w-full px-3.5 py-2.5 pr-11 rounded-xl bg-slate-800/90 border border-slate-700 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter Master password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-1 rounded transition-colors"
                    title={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1 flex items-center justify-between">
                  <span>Master Security Passcode</span>
                  <span className="text-[10px] text-blue-400 font-mono">2FA Security Protocol</span>
                </label>
                <div className="relative">
                  <input
                    type={showMasterKey ? 'text' : 'password'}
                    required
                    value={masterKey}
                    onChange={(e) => setMasterKey(e.target.value)}
                    className="w-full px-3.5 py-2.5 pr-11 rounded-xl bg-slate-800/90 border border-slate-700 text-sm text-white font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter your private Master Passcode"
                  />
                  <button
                    type="button"
                    onClick={() => setShowMasterKey(!showMasterKey)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-1 rounded transition-colors"
                    title={showMasterKey ? 'Hide passcode' : 'Show passcode'}
                  >
                    {showMasterKey ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
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

          {/* TAB 2: SETUP CUSTOM SUPERADMIN CREDENTIALS (ONLY RENDERED ON FIRST-TIME SETUP) */}
          {mode === 'setup' && !isInitialized && (
            <form onSubmit={handleMasterSetup} className="space-y-3.5">
              <div className="bg-blue-500/10 border border-blue-500/20 rounded-2xl p-3 text-[11px] text-blue-200 space-y-1">
                <span className="font-bold block text-white flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
                  Define Your Private SuperAdmin &amp; Master Key
                </span>
                Create your custom administrator credentials and master passcode. Your chosen passcode is strictly required for 2FA login with zero default loopholes.
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">Your Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Abdul Samad Rind"
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
                  placeholder="e.g. ab.samad@orbit-i.tech"
                  value={setupEmail}
                  onChange={(e) => setSetupEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800/90 border border-slate-700 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">Password (6+ chars) *</label>
                  <div className="relative">
                    <input
                      type={showSetupPassword ? 'text' : 'password'}
                      required
                      minLength={6}
                      placeholder="Enter password"
                      value={setupPassword}
                      onChange={(e) => setSetupPassword(e.target.value)}
                      className="w-full px-3.5 py-2.5 pr-10 rounded-xl bg-slate-800/90 border border-slate-700 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowSetupPassword(!showSetupPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-1 rounded transition-colors"
                      title={showSetupPassword ? 'Hide password' : 'Show password'}
                    >
                      {showSetupPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">Confirm Password *</label>
                  <div className="relative">
                    <input
                      type={showSetupConfirmPassword ? 'text' : 'password'}
                      required
                      minLength={6}
                      placeholder="Re-type password"
                      value={setupConfirmPassword}
                      onChange={(e) => setSetupConfirmPassword(e.target.value)}
                      className="w-full px-3.5 py-2.5 pr-10 rounded-xl bg-slate-800/90 border border-slate-700 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowSetupConfirmPassword(!showSetupConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-1 rounded transition-colors"
                      title={showSetupConfirmPassword ? 'Hide password' : 'Show password'}
                    >
                      {showSetupConfirmPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1 flex items-center justify-between">
                  <span>Create Your Master Security Passcode *</span>
                  <span className="text-[10px] text-amber-400 font-mono flex items-center gap-1">
                    <KeyRound className="w-3 h-3" /> Private 2FA Key
                  </span>
                </label>
                <div className="relative">
                  <input
                    type={showSetupMasterKey ? 'text' : 'password'}
                    required
                    minLength={4}
                    value={setupMasterKey}
                    onChange={(e) => setSetupMasterKey(e.target.value)}
                    className="w-full px-3.5 py-2.5 pr-10 rounded-xl bg-slate-800/90 border border-slate-700 text-sm text-white font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g. MySecretMasterKey2026"
                  />
                  <button
                    type="button"
                    onClick={() => setShowSetupMasterKey(!showSetupMasterKey)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-1 rounded transition-colors"
                    title={showSetupMasterKey ? 'Hide passcode' : 'Show passcode'}
                  >
                    {showSetupMasterKey ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  You can set any custom passcode you want. Only this exact passcode will authorize your login.
                </p>
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
