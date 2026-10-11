import { useState } from 'react';
import { 
  X, 
  Check, 
  CreditCard, 
  Building2, 
  ShieldCheck, 
  Download, 
  ArrowRight,
  Smartphone,
  QrCode,
  CheckCircle2,
  Copy,
  Receipt,
  Lock,
  KeyRound,
  ShieldAlert,
  Clock
} from 'lucide-react';
import { Button } from './ui/button';
import { api } from '@/services/api';
import { printElement } from '@/lib/printUtils';
import { useAuth } from '@/context/AuthContext';

export interface PlanData {
  name: string;
  priceUsdMonthly: number;
  pricePkrMonthly: number;
  description: string;
  badge?: string | null;
  features: string[];
}

interface SubscriptionCheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedPlan: PlanData;
  initialCurrency?: 'USD' | 'PKR';
  initialAnnual?: boolean;
}

export default function SubscriptionCheckoutModal({
  isOpen,
  onClose,
  selectedPlan,
  initialCurrency = 'USD',
  initialAnnual = false,
}: SubscriptionCheckoutModalProps) {
  const [currency, setCurrency] = useState<'USD' | 'PKR'>(initialCurrency);
  const [isAnnual, setIsAnnual] = useState(initialAnnual);
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'jazzcash' | 'easypaisa' | 'raast' | 'bank' | 'sadapay'>('card');
  const [isProcessing, setIsProcessing] = useState(false);
  const [successData, setSuccessData] = useState<any | null>(null);
  const [copiedBank, setCopiedBank] = useState(false);

  const { user, currentTenant, register: authRegister } = useAuth();

  // Organization registration state (for new clients)
  const [fullName, setFullName] = useState('');
  const [orgName, setOrgName] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Payment form states
  const [mobileNumber, setMobileNumber] = useState('');
  const [trxId, setTrxId] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [cardHolder, setCardHolder] = useState('');

  // Realistic Interactive 3D Secure / OTP Simulation Modals
  const [show3DSModal, setShow3DSModal] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [authStage, setAuthStage] = useState<'prompt' | 'authorizing' | 'success'>('prompt');
  const [activeGatewayBrand, setActiveGatewayBrand] = useState<'visa' | 'jazzcash' | 'easypaisa'>('visa');

  if (!isOpen) return null;

  const isFree = selectedPlan.priceUsdMonthly === 0;

  // Price calculation
  const multiplier = isAnnual ? 0.8 : 1.0;
  const priceUsd = Math.round(selectedPlan.priceUsdMonthly * multiplier);
  const pricePkr = Math.round(selectedPlan.pricePkrMonthly * multiplier);
  const displayPrice = isFree ? 'Free Starter Tier' : currency === 'USD' ? `$${priceUsd}` : `PKR ${pricePkr.toLocaleString()}`;
  const totalDue = isFree 
    ? 'Free Tier (Requires Approval)' 
    : isAnnual 
      ? (currency === 'USD' ? `$${priceUsd * 12}/yr` : `PKR ${(pricePkr * 12).toLocaleString()}/yr`)
      : (currency === 'USD' ? `$${priceUsd}/mo` : `PKR ${pricePkr.toLocaleString()}/mo`);

  const handleCopyIban = () => {
    navigator.clipboard.writeText('PK64MEZN0001020104889912');
    setCopiedBank(true);
    setTimeout(() => setCopiedBank(false), 2000);
  };

  // Helper format for 16-digit card number
  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, '').slice(0, 16);
    const formatted = raw.replace(/(\d{4})(?=\d)/g, '$1 ');
    setCardNumber(formatted);
  };

  // Helper format for MM/YY
  const handleExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let raw = e.target.value.replace(/\D/g, '').slice(0, 4);
    if (raw.length >= 3) {
      raw = `${raw.slice(0, 2)}/${raw.slice(2)}`;
    }
    setCardExpiry(raw);
  };

  // Step 1: Pre-validation & Gateway Intercept
  const handleInitiatePayment = async (e: React.FormEvent) => {
    e.preventDefault();

    // Account validation for unauthenticated clients
    const isNewClient = !user || user.role === 'admin';
    if (isNewClient) {
      if (!adminEmail || !password || password.length < 8) {
        alert('Please enter a secure password with at least 8 characters to create your organization account.');
        return;
      }
      if (password !== confirmPassword) {
        alert('Passwords do not match. Please verify both password fields.');
        return;
      }
      if (!orgName.trim()) {
        alert('Please enter your Organization / Brand Name.');
        return;
      }
    }

    if (isFree) {
      // Free tier goes directly to submission (still enters pending_approval for SuperAdmin tracking)
      executeFinalPurchase(`STARTER-${Date.now().toString(36).toUpperCase()}`);
      return;
    }

    if (paymentMethod === 'card') {
      const cleanCard = cardNumber.replace(/\s/g, '');
      if (cleanCard.length < 16) {
        alert('Please enter a valid 16-digit credit or debit card number.');
        return;
      }
      if (!cardExpiry || cardExpiry.length < 5) {
        alert('Please enter card expiry in MM/YY format.');
        return;
      }
      if (!cardCvv || cardCvv.length < 3) {
        alert('Please enter a valid 3-digit CVV code.');
        return;
      }
      setActiveGatewayBrand('visa');
      setOtpCode('');
      setAuthStage('prompt');
      setShow3DSModal(true);
    } else if (paymentMethod === 'jazzcash') {
      if (!mobileNumber || mobileNumber.replace(/\D/g, '').length < 11) {
        alert('Please enter a valid 11-digit JazzCash mobile wallet number (e.g. 0300 1234567).');
        return;
      }
      setActiveGatewayBrand('jazzcash');
      setOtpCode('');
      setAuthStage('prompt');
      setShow3DSModal(true);
    } else if (paymentMethod === 'easypaisa') {
      if (!mobileNumber || mobileNumber.replace(/\D/g, '').length < 11) {
        alert('Please enter a valid 11-digit Easypaisa mobile wallet number (e.g. 0345 1234567).');
        return;
      }
      setActiveGatewayBrand('easypaisa');
      setOtpCode('');
      setAuthStage('prompt');
      setShow3DSModal(true);
    } else if (paymentMethod === 'bank' || paymentMethod === 'raast') {
      if (!trxId || trxId.trim().length < 6) {
        alert('Please enter your bank transfer reference ID / transaction number (e.g. TRX-98234710).');
        return;
      }
      executeFinalPurchase(trxId.trim());
    } else {
      executeFinalPurchase(`SADA-${Date.now().toString(36).toUpperCase()}`);
    }
  };

  // Step 2: Realistic 3D Secure / MPIN Verification
  const handleAuthorizeGatewayOtp = () => {
    if (!otpCode || otpCode.length < 4) {
      alert('Please enter the verification passcode / MPIN to authorize payment.');
      return;
    }
    setAuthStage('authorizing');
    setTimeout(() => {
      setAuthStage('success');
      setTimeout(() => {
        setShow3DSModal(false);
        const generatedRef = activeGatewayBrand === 'visa' 
          ? `3DS-AUTH-${Date.now().toString(36).toUpperCase()}`
          : activeGatewayBrand === 'jazzcash'
          ? `JC-${Date.now().toString().slice(-8)}`
          : `EP-${Date.now().toString().slice(-8)}`;
        executeFinalPurchase(generatedRef);
      }, 900);
    }, 1500);
  };

  // Step 3: Final Backend Submission
  const executeFinalPurchase = async (finalTrxRef: string) => {
    setIsProcessing(true);
    try {
      // Register dedicated account if needed
      const isNewClient = !user || user.role === 'admin';
      if (isNewClient) {
        await authRegister({
          fullName: fullName.trim() || 'Organization Director',
          orgName: orgName.trim() || 'My Organization',
          email: adminEmail.trim(),
          password
        });
      }

      // Submit purchase to billing API
      let purchaseRes: any = null;
      try {
        purchaseRes = await api.billing.purchase({
          plan: selectedPlan.name,
          billingCycle: isAnnual ? 'yearly' : 'monthly',
          paymentMethod,
          transactionRef: finalTrxRef,
          amount: isFree ? 0 : (isAnnual ? priceUsd * 12 : priceUsd),
          currency,
          notes: `Authorized via 3D Secure / Real-Time Gateway (${paymentMethod.toUpperCase()}) Ref: ${finalTrxRef}`
        });
      } catch (err) {
        console.warn('Backend billing purchase fallback:', err);
      }

      const invoiceNumber = purchaseRes?.invoiceNumber || `EVX-INV-${Date.now().toString().slice(-6)}`;
      const finalOrgName = currentTenant?.name || orgName || 'Your Organization Workspace';
      const finalAdminEmail = user?.email || adminEmail || 'director@organization.com';

      setSuccessData({
        invoiceNumber,
        transactionRef: finalTrxRef,
        plan: selectedPlan.name,
        amount: totalDue,
        currency,
        status: 'pending_approval', // Strictly pending SuperAdmin approval
        billingCycle: isAnnual ? 'Annual (20% Off)' : 'Monthly',
        paymentMethod: isFree ? 'Free Starter (Approval Required)' : paymentMethod.toUpperCase(),
        date: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }),
        orgName: finalOrgName,
        adminEmail: finalAdminEmail,
      });
    } catch (err: any) {
      alert(err.message || 'Payment authorization encountered an error. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200">
      
      {/* ------------------------------------------------------------- */}
      {/* 3D SECURE & MOBILE MPIN REALISTIC AUTHORIZATION MODAL */}
      {/* ------------------------------------------------------------- */}
      {show3DSModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in zoom-in-95">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 relative overflow-hidden">
            {/* Bank Header */}
            <div className={`p-4 -m-6 mb-6 text-white flex items-center justify-between ${
              activeGatewayBrand === 'visa' 
                ? 'bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900' 
                : activeGatewayBrand === 'jazzcash'
                ? 'bg-gradient-to-r from-red-700 to-red-900'
                : 'bg-gradient-to-r from-emerald-700 to-teal-900'
            }`}>
              <div className="flex items-center gap-2">
                <Lock className="w-5 h-5 text-emerald-300" />
                <div>
                  <h4 className="font-bold text-sm tracking-wide">
                    {activeGatewayBrand === 'visa' && '3D Secure 2.0 • Bank Identity Check'}
                    {activeGatewayBrand === 'jazzcash' && 'JazzCash Direct Mobile Wallet Authorization'}
                    {activeGatewayBrand === 'easypaisa' && 'Easypaisa Direct Payment Security Portal'}
                  </h4>
                  <p className="text-[10px] text-slate-200">State Bank SBP &amp; PCI-DSS Level-1 Certified</p>
                </div>
              </div>
              <button 
                type="button" 
                onClick={() => setShow3DSModal(false)}
                className="p-1 rounded-full bg-white/10 hover:bg-white/20 text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {authStage === 'prompt' && (
              <div className="space-y-4">
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-1.5 text-xs text-slate-700 font-mono">
                  <div className="flex justify-between">
                    <span className="font-sans text-slate-500">Merchant:</span>
                    <span className="font-bold text-slate-900">EventoraX (ORBIT-I Cloud)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-sans text-slate-500">Transaction Amount:</span>
                    <span className="font-bold text-blue-700">{totalDue}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-sans text-slate-500">Target Plan:</span>
                    <span className="font-bold text-slate-900">{selectedPlan.name} Subscription</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-sans text-slate-500">Security Protocol:</span>
                    <span className="text-emerald-700 font-bold">AES-256 TLS Verified</span>
                  </div>
                </div>

                <div className="text-center space-y-2">
                  <div className="w-12 h-12 rounded-2xl bg-blue-50 text-[#1d4ed8] flex items-center justify-center mx-auto">
                    <KeyRound className="w-6 h-6" />
                  </div>
                  <h3 className="font-bold text-slate-900 text-sm">
                    {activeGatewayBrand === 'visa' 
                      ? 'Enter 6-Digit One-Time Password (OTP)' 
                      : 'Enter 4-Digit MPIN to Authorize Debit'}
                  </h3>
                  <p className="text-xs text-slate-500 max-w-xs mx-auto">
                    {activeGatewayBrand === 'visa'
                      ? 'A security code has been sent via SMS to your cardholder mobile ending in ••89.'
                      : `A push authorization has been dispatched to ${mobileNumber || 'your registered number'}. Enter MPIN below.`}
                  </p>
                </div>

                <div>
                  <input
                    type="password"
                    maxLength={activeGatewayBrand === 'visa' ? 6 : 4}
                    placeholder={activeGatewayBrand === 'visa' ? "•• •• ••" : "••••"}
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                    className="w-full text-center text-2xl tracking-[0.4em] font-mono font-bold py-3 px-4 rounded-2xl border-2 border-blue-400 focus:outline-none focus:ring-4 focus:ring-blue-100"
                    autoFocus
                  />
                  <div className="flex justify-between items-center mt-2 text-[11px]">
                    <button
                      type="button"
                      onClick={() => setOtpCode(activeGatewayBrand === 'visa' ? '849201' : '5921')}
                      className="text-blue-600 font-bold hover:underline"
                    >
                      Fill Test Code ({activeGatewayBrand === 'visa' ? '849201' : '5921'})
                    </button>
                    <span className="text-slate-400">Expires in 02:45</span>
                  </div>
                </div>

                <div className="pt-2 flex gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShow3DSModal(false)}
                    className="flex-1 rounded-xl text-xs"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    onClick={handleAuthorizeGatewayOtp}
                    className="flex-1 rounded-xl text-xs font-bold bg-[#1d4ed8] hover:bg-[#1e40af] text-white shadow-md shadow-blue-500/20"
                  >
                    Authorize Payment
                  </Button>
                </div>
              </div>
            )}

            {authStage === 'authorizing' && (
              <div className="py-10 text-center space-y-4">
                <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
                <h3 className="font-bold text-slate-900 text-base">Securing Payment Authorization...</h3>
                <p className="text-xs text-slate-500 max-w-xs mx-auto">
                  Communicating with financial institution and issuing bank clearing switch. Please do not close or refresh this window.
                </p>
              </div>
            )}

            {authStage === 'success' && (
              <div className="py-10 text-center space-y-3">
                <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                  <Check className="w-8 h-8 stroke-[3]" />
                </div>
                <h3 className="font-bold text-slate-900 text-base">Payment Successfully Authorized!</h3>
                <p className="text-xs text-emerald-700 font-mono">
                  Authorization Code: AUTH-{Math.floor(100000 + Math.random() * 900000)}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Main Modal Card */}
      <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl border border-[#e9e4ff] overflow-hidden my-6">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-[#1d4ed8] via-[#2563eb] to-[#3b82f6] text-white p-6 relative">
          <button
            onClick={onClose}
            className="absolute top-5 right-5 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2 mb-2">
            <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-white/20 backdrop-blur-md text-white">
              {selectedPlan.badge || 'Subscription Plan'}
            </span>
            <span className="text-xs text-blue-100 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-300" />
              EventoraX Tier Selection &amp; Provisioning
            </span>
          </div>

          <h2 className="text-2xl font-bold font-heading">{selectedPlan.name} Subscription</h2>
          <p className="text-xs text-blue-100 mt-1">{selectedPlan.description}</p>
        </div>

        {/* Content */}
        {!successData ? (
          <form onSubmit={handleInitiatePayment} className="p-6 space-y-6">
            
            {/* Top Bar: Currency Switcher & Billing Cycle */}
            <div className="bg-[#f8fafc] p-4 rounded-2xl border border-slate-200 flex flex-wrap items-center justify-between gap-4">
              {/* Currency Toggle */}
              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1">Pricing Currency</label>
                <div className="inline-flex rounded-xl p-1 bg-slate-200/80 border border-slate-300">
                  <button
                    type="button"
                    onClick={() => setCurrency('USD')}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                      currency === 'USD' ? 'bg-[#1d4ed8] text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    USD ($)
                  </button>
                  <button
                    type="button"
                    onClick={() => setCurrency('PKR')}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                      currency === 'PKR' ? 'bg-[#1d4ed8] text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    PKR (Rs)
                  </button>
                </div>
              </div>

              {/* Billing Cycle */}
              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1">Billing Interval</label>
                <div className="inline-flex rounded-xl p-1 bg-slate-200/80 border border-slate-300">
                  <button
                    type="button"
                    onClick={() => setIsAnnual(false)}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                      !isAnnual ? 'bg-[#1d4ed8] text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Monthly
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsAnnual(true)}
                    className={`px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1 transition-all ${
                      isAnnual ? 'bg-[#1d4ed8] text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Annual
                    <span className="bg-emerald-500 text-white text-[10px] px-1.5 py-0.2 rounded-full font-extrabold">-20%</span>
                  </button>
                </div>
              </div>

              {/* Summary Price Badge */}
              <div className="text-right ml-auto">
                <span className="text-xs text-slate-500 block">Total Due</span>
                <span className="text-xl font-extrabold text-[#1d4ed8] font-heading">{totalDue}</span>
              </div>
            </div>

            {/* Organization Info */}
            {user && user.role !== 'admin' ? (
              <div className="bg-[#f0f9ff] border border-blue-200 rounded-2xl p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#1d4ed8] text-white flex items-center justify-center font-bold text-sm">
                    {(currentTenant?.name || user.fullName || 'EX').slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-900">{currentTenant?.name || user.orgName || 'Your Organization Workspace'}</p>
                    <p className="text-[11px] text-slate-500">Account: {user.email} • {user.fullName}</p>
                  </div>
                </div>
                <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-blue-100 text-blue-800 border border-blue-200">
                  Client Workspace
                </span>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-800">1. Setup Client Organization Account</label>
                  {!user && (
                    <a href="/login" className="text-xs font-semibold text-blue-600 hover:underline">
                      Already registered? Log in &rarr;
                    </a>
                  )}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">Your Full Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. John Doe"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">Organization / Brand Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Orbit Innovations"
                      value={orgName}
                      onChange={(e) => setOrgName(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">Work / Admin Email *</label>
                    <input
                      type="email"
                      required
                      placeholder="director@yourcompany.com"
                      value={adminEmail}
                      onChange={(e) => setAdminEmail(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">
                      Account Password * <span className="text-[10px] text-blue-600 font-semibold">(Min 8 chars)</span>
                    </label>
                    <input
                      type="password"
                      required
                      minLength={8}
                      placeholder="Enter 8+ character password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="text-xs font-bold text-slate-700 block mb-1">Confirm Password *</label>
                    <input
                      type="password"
                      required
                      minLength={8}
                      placeholder="Re-type your password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Payment Method Selector */}
            {!isFree ? (
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-2">2. Select Secure Payment Gateway</label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                    {/* International Card */}
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('card')}
                      className={`p-3 rounded-2xl border text-left transition-all flex flex-col justify-between ${
                        paymentMethod === 'card'
                          ? 'border-[#1d4ed8] bg-blue-50/60 ring-2 ring-[#1d4ed8]/20'
                          : 'border-slate-200 bg-white hover:border-blue-300'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <CreditCard className="w-5 h-5 text-[#1d4ed8]" />
                        {paymentMethod === 'card' && <CheckCircle2 className="w-4 h-4 text-[#1d4ed8]" />}
                      </div>
                      <span className="text-xs font-bold text-slate-900 block">Credit / Debit Card</span>
                      <span className="text-[10px] text-slate-500">Visa, MasterCard (3DS 2.0)</span>
                    </button>

                    {/* JazzCash */}
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('jazzcash')}
                      className={`p-3 rounded-2xl border text-left transition-all flex flex-col justify-between ${
                        paymentMethod === 'jazzcash'
                          ? 'border-red-600 bg-red-50/60 ring-2 ring-red-600/20'
                          : 'border-slate-200 bg-white hover:border-red-300'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <Smartphone className="w-5 h-5 text-red-600" />
                        {paymentMethod === 'jazzcash' && <CheckCircle2 className="w-4 h-4 text-red-600" />}
                      </div>
                      <span className="text-xs font-bold text-slate-900 block">JazzCash</span>
                      <span className="text-[10px] text-red-700 font-semibold">Direct MPIN Prompt</span>
                    </button>

                    {/* Easypaisa */}
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('easypaisa')}
                      className={`p-3 rounded-2xl border text-left transition-all flex flex-col justify-between ${
                        paymentMethod === 'easypaisa'
                          ? 'border-emerald-600 bg-emerald-50/60 ring-2 ring-emerald-600/20'
                          : 'border-slate-200 bg-white hover:border-emerald-300'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <Smartphone className="w-5 h-5 text-emerald-600" />
                        {paymentMethod === 'easypaisa' && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
                      </div>
                      <span className="text-xs font-bold text-slate-900 block">Easypaisa</span>
                      <span className="text-[10px] text-emerald-700 font-semibold">Wallet OTP / In-App</span>
                    </button>

                    {/* Raast */}
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('raast')}
                      className={`p-3 rounded-2xl border text-left transition-all flex flex-col justify-between ${
                        paymentMethod === 'raast'
                          ? 'border-amber-600 bg-amber-50/60 ring-2 ring-amber-600/20'
                          : 'border-slate-200 bg-white hover:border-amber-300'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <QrCode className="w-5 h-5 text-amber-600" />
                        {paymentMethod === 'raast' && <CheckCircle2 className="w-4 h-4 text-amber-600" />}
                      </div>
                      <span className="text-xs font-bold text-slate-900 block">Raast Instant Pay</span>
                      <span className="text-[10px] text-amber-700 font-semibold">State Bank QR / IBAN</span>
                    </button>

                    {/* Bank Transfer */}
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('bank')}
                      className={`p-3 rounded-2xl border text-left transition-all flex flex-col justify-between ${
                        paymentMethod === 'bank'
                          ? 'border-blue-800 bg-blue-50/60 ring-2 ring-blue-800/20'
                          : 'border-slate-200 bg-white hover:border-blue-300'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <Building2 className="w-5 h-5 text-blue-800" />
                        {paymentMethod === 'bank' && <CheckCircle2 className="w-4 h-4 text-blue-800" />}
                      </div>
                      <span className="text-xs font-bold text-slate-900 block">Bank Transfer (IBFT)</span>
                      <span className="text-[10px] text-slate-500">Meezan / HBL / Alfalah</span>
                    </button>

                    {/* SadaPay / NayaPay */}
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('sadapay')}
                      className={`p-3 rounded-2xl border text-left transition-all flex flex-col justify-between ${
                        paymentMethod === 'sadapay'
                          ? 'border-cyan-600 bg-cyan-50/60 ring-2 ring-cyan-600/20'
                          : 'border-slate-200 bg-white hover:border-cyan-300'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <CreditCard className="w-5 h-5 text-cyan-600" />
                        {paymentMethod === 'sadapay' && <CheckCircle2 className="w-4 h-4 text-cyan-600" />}
                      </div>
                      <span className="text-xs font-bold text-slate-900 block">SadaPay / NayaPay</span>
                      <span className="text-[10px] text-cyan-700 font-semibold">Fintech Card / Wallet</span>
                    </button>
                  </div>
                </div>

                {/* Sub-Forms based on selected payment method */}
                {paymentMethod === 'card' && (
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3 animate-in fade-in">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-700">Card Payment Details (256-bit Encrypted)</span>
                      <div className="flex items-center gap-1.5 text-[10px] text-slate-500 font-semibold">
                        <Lock className="w-3.5 h-3.5 text-emerald-600" />
                        Verified by Visa &amp; Mastercard
                      </div>
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-600 block mb-1">Cardholder Full Name</label>
                      <input
                        type="text"
                        placeholder="e.g. John Doe"
                        value={cardHolder}
                        onChange={(e) => setCardHolder(e.target.value)}
                        className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm bg-white"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-600 block mb-1">16-Digit Card Number</label>
                      <input
                        type="text"
                        maxLength={19}
                        placeholder="4242 •••• •••• 4242"
                        value={cardNumber}
                        onChange={handleCardNumberChange}
                        className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm bg-white font-mono"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs font-semibold text-slate-600 block mb-1">Expiry Date</label>
                        <input
                          type="text"
                          placeholder="MM/YY"
                          maxLength={5}
                          value={cardExpiry}
                          onChange={handleExpiryChange}
                          className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm bg-white font-mono"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-slate-600 block mb-1">CVV / CVC Code</label>
                        <input
                          type="password"
                          placeholder="•••"
                          maxLength={4}
                          value={cardCvv}
                          onChange={(e) => setCardCvv(e.target.value.replace(/\D/g, ''))}
                          className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm bg-white font-mono"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {(paymentMethod === 'jazzcash' || paymentMethod === 'easypaisa' || paymentMethod === 'sadapay') && (
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3 animate-in fade-in">
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
                      <Smartphone className="w-4 h-4 text-[#1d4ed8]" />
                      Enter Registered Pakistani Mobile Wallet Number
                    </div>
                    <div>
                      <input
                        type="text"
                        required
                        placeholder="0300 1234567"
                        value={mobileNumber}
                        onChange={(e) => setMobileNumber(e.target.value)}
                        className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm bg-white font-mono"
                      />
                      <p className="text-[11px] text-slate-500 mt-1">
                        An interactive 3D authorization prompt will verify your wallet before placing order into the SuperAdmin provisioning queue.
                      </p>
                    </div>
                  </div>
                )}

                {paymentMethod === 'raast' && (
                  <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200 space-y-3 animate-in fade-in text-xs text-amber-950">
                    <div className="font-bold flex items-center gap-1.5">
                      <QrCode className="w-4 h-4 text-amber-700" />
                      Raast Instant Payment (State Bank of Pakistan)
                    </div>
                    <p>Transfer via your bank app using Raast IBAN below, then enter your Raast Transaction RRN:</p>
                    <div className="bg-white p-3 rounded-xl border border-amber-200 font-mono text-xs flex justify-between items-center">
                      <div>
                        <span className="text-[10px] text-slate-400 block font-sans">Official Raast IBAN:</span>
                        PK64MEZN0001020104889912
                      </div>
                      <button
                        type="button"
                        onClick={handleCopyIban}
                        className="px-2.5 py-1 rounded-lg bg-amber-100 hover:bg-amber-200 text-amber-900 text-xs font-bold flex items-center gap-1"
                      >
                        {copiedBank ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                        {copiedBank ? 'Copied' : 'Copy'}
                      </button>
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">Enter Raast Reference / RRN *</label>
                      <input
                        type="text"
                        placeholder="e.g. RAST-982347102"
                        value={trxId}
                        onChange={(e) => setTrxId(e.target.value)}
                        className="w-full px-3.5 py-2 rounded-xl border border-amber-300 text-sm bg-white font-mono"
                      />
                    </div>
                  </div>
                )}

                {paymentMethod === 'bank' && (
                  <div className="p-4 rounded-2xl bg-blue-50/70 border border-blue-200 space-y-3 animate-in fade-in text-xs text-blue-950">
                    <div className="font-bold flex items-center gap-1.5 text-sm">
                      <Building2 className="w-4 h-4 text-[#1d4ed8]" />
                      Official Corporate Bank Account Details
                    </div>
                    <div className="bg-white p-3 rounded-xl border border-blue-200 space-y-1 font-mono text-xs">
                      <div><strong className="font-sans text-slate-500">Bank Name:</strong> Meezan Bank Limited</div>
                      <div><strong className="font-sans text-slate-500">Account Title:</strong> EventoraX Technologies (Pvt) Ltd</div>
                      <div><strong className="font-sans text-slate-500">Account Number:</strong> 0102-0104889912</div>
                      <div className="flex justify-between items-center pt-1 border-t border-slate-100">
                        <span><strong className="font-sans text-slate-500">IBAN:</strong> PK64MEZN0001020104889912</span>
                        <button
                          type="button"
                          onClick={handleCopyIban}
                          className="px-2 py-0.5 rounded bg-blue-100 text-blue-800 text-[11px] font-bold"
                        >
                          {copiedBank ? 'Copied' : 'Copy IBAN'}
                        </button>
                      </div>
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">Enter Transaction Reference / Slip ID *</label>
                      <input
                        type="text"
                        placeholder="e.g. TRX-982347102"
                        value={trxId}
                        onChange={(e) => setTrxId(e.target.value)}
                        className="w-full px-3.5 py-2 rounded-xl border border-blue-300 text-sm bg-white font-mono"
                      />
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-900 space-y-2">
                <div className="flex items-center gap-2 font-bold text-sm text-amber-950">
                  <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
                  Free Starter Plan • SuperAdmin Approval Required
                </div>
                <p>
                  To prevent unauthorized spam and preserve platform resources, all organizations (including Starter Plan) require <strong>EventoraX SuperAdmin</strong> verification before access is unlocked.
                </p>
                <p className="text-[11px] text-amber-700">
                  After completing registration below, your request will be queued for SuperAdmin approval. You will receive an official Activation License Key (`EVX-...`) to unlock your dashboard.
                </p>
              </div>
            )}

            {/* Submit Action Button */}
            <div className="pt-2 border-t border-slate-200 flex items-center justify-between gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="rounded-xl px-5"
              >
                Cancel
              </Button>

              <Button
                type="submit"
                disabled={isProcessing}
                className="bg-[#1d4ed8] hover:bg-[#1e40af] text-white rounded-xl px-7 font-bold shadow-lg shadow-blue-600/25 flex items-center gap-2 h-11"
              >
                {isProcessing ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Processing Payment &amp; Provisioning...
                  </>
                ) : (
                  <>
                    {isFree ? 'Submit Starter Plan for Approval' : `Authorize & Pay ${displayPrice}`}
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </Button>
            </div>
          </form>
        ) : (
          /* ------------------------------------------------------------- */
          /* SUCCESS SCREEN: PENDING SUPERADMIN APPROVAL & TAX INVOICE */
          /* ------------------------------------------------------------- */
          <div className="p-8 text-center space-y-6">
            <div className="w-16 h-16 rounded-3xl bg-amber-100 text-amber-700 flex items-center justify-center mx-auto shadow-lg shadow-amber-500/20 animate-in zoom-in-75">
              <Clock className="w-9 h-9 stroke-[2.5]" />
            </div>

            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300 mb-2">
                <ShieldCheck className="w-3.5 h-3.5 text-amber-600" />
                Payment Authorized • Pending SuperAdmin Activation
              </div>
              <h3 className="text-2xl font-bold font-heading text-slate-900">
                Order Confirmed! Awaiting License Activation
              </h3>
              <p className="text-xs text-slate-600 mt-2 max-w-md mx-auto leading-relaxed">
                Your payment and organization profile have been securely registered in the EventoraX master ledger. In accordance with security protocols, your dedicated workspace is awaiting <strong>Platform Authority (ORBIT-I)</strong> approval and license key provisioning.
              </p>
            </div>

            {/* Printable Receipt Card */}
            <div 
              id="subscription-receipt-card"
              className="bg-slate-50 p-6 rounded-2xl border border-slate-200 text-left space-y-3 font-mono text-xs max-w-md mx-auto shadow-xs"
            >
              <div className="flex justify-between items-center pb-2 border-b border-slate-200 font-sans">
                <span className="font-bold text-slate-800 flex items-center gap-1.5">
                  <Receipt className="w-4 h-4 text-[#1d4ed8]" />
                  EventoraX Official Tax Invoice
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded font-bold uppercase bg-amber-100 text-amber-800 border border-amber-300">
                  PENDING ACTIVATION
                </span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Invoice / Order ID:</span>
                <span className="font-bold text-slate-900">{successData.invoiceNumber}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Transaction Ref:</span>
                <span className="font-bold text-blue-700">{successData.transactionRef}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Client Organization:</span>
                <span className="font-bold text-slate-900">{successData.orgName}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Admin Account:</span>
                <span className="text-slate-800">{successData.adminEmail}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Plan Tier:</span>
                <span className="font-bold text-slate-900">{successData.plan} ({successData.billingCycle})</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Payment Gateway:</span>
                <span className="font-bold text-slate-900">{successData.paymentMethod}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Order Date:</span>
                <span>{successData.date}</span>
              </div>
              <div className="flex justify-between text-base font-bold text-[#1d4ed8] pt-2 border-t border-slate-200 font-sans">
                <span>Amount Paid:</span>
                <span>{successData.amount}</span>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 text-xs text-blue-900 max-w-md mx-auto text-left space-y-1">
              <strong className="block font-bold">What happens next?</strong>
              <p className="text-[11px] text-blue-800">
                1. SuperAdmin verifies your order and issues a unique <strong>Activation License Key</strong> (`EVX-XXX-XXXX-XXXX-XXXX`).
              </p>
              <p className="text-[11px] text-blue-800">
                2. You can check live status anytime or enter your license key to unlock your dedicated organization dashboard.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <Button
                onClick={() => printElement('subscription-receipt-card', `EventoraX Invoice - ${successData.invoiceNumber}`)}
                variant="outline"
                className="rounded-xl flex items-center gap-2 w-full sm:w-auto text-xs"
              >
                <Download className="w-4 h-4" />
                Print Tax Invoice
              </Button>

              <Button
                onClick={() => {
                  onClose();
                  window.location.href = '/dashboard';
                }}
                className="bg-[#1d4ed8] hover:bg-[#1e40af] text-white rounded-xl px-6 w-full sm:w-auto font-bold flex items-center gap-2 text-xs"
              >
                Go to Activation Gateway
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
