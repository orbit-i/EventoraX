import { useState } from 'react';
import { ShieldCheck, Clock, Key, ArrowRight, RefreshCw, LogOut, CheckCircle2, AlertCircle } from 'lucide-react';
import { Button } from './ui/button';
import { api } from '@/services/api';
import { useAuth } from '@/context/AuthContext';
import BrandLogo from './BrandLogo';

interface ActivationPendingGatekeeperProps {
  onActivated?: () => void;
}

export default function ActivationPendingGatekeeper({ onActivated }: ActivationPendingGatekeeperProps) {
  const { user, currentTenant, logout, refreshUser } = useAuth();
  const [licenseKey, setLicenseKey] = useState('');
  const [isActivating, setIsActivating] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleCheckStatus = async () => {
    setIsChecking(true);
    setErrorMsg(null);
    try {
      const res = await api.tenants.checkStatus();
      if (res.success && res.status === 'active') {
        setSuccessMsg('Your subscription has been approved by SuperAdmin! Unlocking your dashboard...');
        await refreshUser();
        setTimeout(() => {
          if (onActivated) onActivated();
          else window.location.reload();
        }, 1200);
      } else {
        setErrorMsg('Your account is still pending SuperAdmin review. Please wait or enter your Activation License Key.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to check status. Please try again.');
    } finally {
      setIsChecking(false);
    }
  };

  const handleActivateWithKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!licenseKey.trim()) {
      setErrorMsg('Please enter your Activation License Key.');
      return;
    }

    setIsActivating(true);
    setErrorMsg(null);
    try {
      const res = await api.tenants.activateWithKey(licenseKey.trim());
      if (res.success) {
        setSuccessMsg('Activation License Key verified successfully! Welcome to your Dedicated Organization Dashboard.');
        await refreshUser();
        setTimeout(() => {
          if (onActivated) onActivated();
          else window.location.reload();
        }, 1200);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Invalid or unapproved license key. Please verify with SuperAdmin.');
    } finally {
      setIsActivating(false);
    }
  };

  const orgName = currentTenant?.name || user?.orgName || 'Your Organization Workspace';
  const planName = currentTenant?.plan || user?.plan || 'Starter';

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-indigo-950 to-slate-950 text-white flex flex-col justify-between p-4 sm:p-8">
      {/* Top Header */}
      <div className="max-w-5xl mx-auto w-full flex items-center justify-between py-2">
        <BrandLogo variant="compact" size="md" showTagline={false} />
        <button
          onClick={logout}
          className="text-xs text-slate-300 hover:text-white flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 transition-all"
        >
          <LogOut className="w-3.5 h-3.5" />
          Sign Out
        </button>
      </div>

      {/* Main Card */}
      <div className="max-w-2xl mx-auto w-full my-auto py-8">
        <div className="bg-white/95 backdrop-blur-xl rounded-3xl p-6 sm:p-10 text-slate-900 shadow-2xl border border-white/20 space-y-6">
          {/* Status Indicator Icon */}
          <div className="w-16 h-16 rounded-3xl bg-amber-100 text-amber-700 flex items-center justify-center mx-auto shadow-lg shadow-amber-500/20">
            <Clock className="w-8 h-8 animate-pulse" />
          </div>

          <div className="text-center space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 text-amber-900 text-xs font-extrabold uppercase tracking-wider">
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
              Awaiting SuperAdmin Approval
            </div>
            <h1 className="text-2xl sm:text-3xl font-black font-heading tracking-tight text-slate-900">
              Subscription Activation Pending
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 max-w-md mx-auto">
              Your organization workspace <strong className="text-slate-900 font-bold">{orgName}</strong> has been registered on the{' '}
              <span className="font-bold text-[#1d4ed8]">{planName}</span> tier.
            </p>
          </div>

          {/* Alert Messages */}
          {errorMsg && (
            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600" />
              <span className="font-semibold">{successMsg}</span>
            </div>
          )}

          {/* Explanatory Info Card */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2 text-xs text-slate-600">
            <div className="flex items-center gap-2 font-bold text-slate-800">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              Why do I need SuperAdmin Approval &amp; a License Key?
            </div>
            <p className="leading-relaxed">
              To prevent fraudulent registrations, safeguard computational resources, and track isolated quotas (attendees, ID passes, tamper-evident certificates), every client organization must be approved by EventoraX Platform Authority (ORBIT-I Private Limited).
            </p>
            <p className="leading-relaxed text-slate-500">
              Once approved, SuperAdmin issues your dedicated <strong className="text-slate-800">Activation License Key</strong> for tracking and resource allocation.
            </p>
          </div>

          {/* Form: Enter License Key to Unlock Now */}
          <form onSubmit={handleActivateWithKey} className="space-y-3 pt-2 border-t border-slate-200">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Key className="w-3.5 h-3.5 text-[#1d4ed8]" />
                Received your Activation License Key?
              </label>
              <span className="text-[10px] text-slate-400 font-mono">Format: EVX-XXX-XXXX-XXXX-XXXX</span>
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                placeholder="e.g. EVX-PRO-7B29-4F91-3810"
                value={licenseKey}
                onChange={(e) => setLicenseKey(e.target.value.toUpperCase())}
                className="flex-1 px-4 py-2.5 rounded-xl border border-slate-300 text-xs font-mono font-bold tracking-wide uppercase focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
              <Button
                type="submit"
                disabled={isActivating || !licenseKey.trim()}
                className="bg-[#1d4ed8] hover:bg-[#1e40af] text-white rounded-xl text-xs font-bold px-5 h-10 shadow-md shadow-blue-600/20"
              >
                {isActivating ? 'Verifying...' : 'Activate Now'}
                <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
              </Button>
            </div>
          </form>

          {/* Live Status Button */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-slate-200">
            <Button
              type="button"
              variant="outline"
              onClick={handleCheckStatus}
              disabled={isChecking}
              className="w-full sm:w-auto rounded-xl text-xs font-bold h-10 border-slate-300"
            >
              <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${isChecking ? 'animate-spin' : ''}`} />
              Check Live Approval Status
            </Button>

            <a
              href="mailto:support@eventorax.com?subject=Expedite%20Organization%20Activation"
              className="text-xs text-blue-600 hover:text-blue-800 font-semibold"
            >
              Contact ORBIT-I Support &rarr;
            </a>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="max-w-5xl mx-auto w-full text-center text-xs text-slate-400 py-2">
        EventoraX Platform Infrastructure • Powered by ORBIT-I Private Limited
      </div>
    </div>
  );
}
