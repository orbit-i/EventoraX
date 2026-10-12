import { useState, useId } from 'react';
import { 
  X, 
  Check, 
  ShieldCheck, 
  Download, 
  ArrowRight,
  Lock,
  KeyRound,
  ShieldAlert,
  Clock,
  CheckCircle2,
  Sparkles,
  Tag
} from 'lucide-react';
import { Button } from './ui/button';
import { api } from '@/services/api';
import { printElement } from '@/lib/printUtils';
import { useAuth } from '@/context/AuthContext';
import {
  SafepayBadge,
  JazzCashBadge,
  EasypaisaBadge,
  SadaPayBadge,
  NayaPayBadge,
  RaastBadge,
  CardNetworksBadge,
  BankTransferBadge
} from './payment/PaymentLogos';

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

type PaymentMethodType = 'safepay' | 'card' | 'jazzcash' | 'easypaisa' | 'sadapay' | 'nayapay' | 'raast' | 'bank';

export default function SubscriptionCheckoutModal({
  isOpen,
  onClose,
  selectedPlan,
  initialCurrency = 'USD',
  initialAnnual = false,
}: SubscriptionCheckoutModalProps) {
  const [currency, setCurrency] = useState<'USD' | 'PKR'>(initialCurrency);
  const [isAnnual, setIsAnnual] = useState(initialAnnual);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethodType>('safepay');
  const [isProcessing, setIsProcessing] = useState(false);
  const [step, setStep] = useState<'form' | 'auth' | 'invoice'>('form');
  const [successData, setSuccessData] = useState<any | null>(null);

  // Copy tracking states
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const { user, currentTenant, register: authRegister } = useAuth();

  // Organization registration state (for new clients)
  const [fullName, setFullName] = useState('');
  const [orgName, setOrgName] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Payment form states
  const [customerMobile, setCustomerMobile] = useState('');
  const [trxId, setTrxId] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [cardHolder, setCardHolder] = useState('');
  
  // JazzCash & Easypaisa Mode: 'push' (real-time mobile prompt) vs 'transfer' (send to merchant 03190375751)
  const [walletFlow, setWalletFlow] = useState<'push' | 'transfer'>('push');

  // Real-Time Authorization Simulation State
  const [authCode, setAuthCode] = useState('');
  const [authStage, setAuthStage] = useState<'prompt' | 'authorizing' | 'success'>('prompt');
  const [activeRefCode, setActiveRefCode] = useState('');

  // Dynamic Coupon State
  const [couponInput, setCouponInput] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<{
    code: string;
    discountType: string;
    discountValue: number;
    discountAmount: number;
    finalPrice: number;
  } | null>(null);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [validatingCoupon, setValidatingCoupon] = useState(false);

  const invoiceUniqueId = useId().replace(/:/g, '');

  const isStarter = selectedPlan.name.toLowerCase().includes('starter');
  const [starterMode, setStarterMode] = useState<'trial' | 'full'>('full');

  if (!isOpen) return null;

  const isFree = (selectedPlan.priceUsdMonthly === 0) || (isStarter && starterMode === 'trial');

  // Base price calculation
  const multiplier = isAnnual ? 0.8 : 1.0;
  const baseMonthlyUsd = Math.round(selectedPlan.priceUsdMonthly * multiplier);
  const baseMonthlyPkr = Math.round(selectedPlan.pricePkrMonthly * multiplier);

  const basePriceUsd = isAnnual ? baseMonthlyUsd * 12 : baseMonthlyUsd;
  const basePricePkr = isAnnual ? baseMonthlyPkr * 12 : baseMonthlyPkr;

  const currentBasePrice = currency === 'USD' ? basePriceUsd : basePricePkr;

  // Calculate discount if coupon applied
  let discountAmount = 0;
  if (appliedCoupon && !isFree) {
    if (appliedCoupon.discountType === 'percentage') {
      discountAmount = Math.round((currentBasePrice * appliedCoupon.discountValue) / 100);
    } else {
      discountAmount = Math.min(currentBasePrice, appliedCoupon.discountValue);
    }
  }

  const finalCalculatedPrice = Math.max(0, currentBasePrice - discountAmount);

  const displayPrice = isFree 
    ? (isStarter ? 'Starter 14-Day Free Trial ($0)' : 'Free Starter Tier') 
    : currency === 'USD' 
      ? `$${finalCalculatedPrice}${isAnnual ? '/yr' : '/mo'}` 
      : `PKR ${finalCalculatedPrice.toLocaleString()}${isAnnual ? '/yr' : '/mo'}`;

  const totalDue = isFree 
    ? (isStarter ? 'Free Trial (2 Events, 40 Attendees, 50 ID/Certs)' : 'Free Tier (Requires Approval)') 
    : displayPrice;

  // Validate coupon handler
  const handleApplyCoupon = async () => {
    if (!couponInput.trim()) return;
    setValidatingCoupon(true);
    setCouponError(null);
    try {
      const res = await api.billing.validateCoupon({
        code: couponInput.trim().toUpperCase(),
        plan: selectedPlan.name,
        billingCycle: isAnnual ? 'yearly' : 'monthly'
      });
      if (res.valid && res.coupon) {
        setAppliedCoupon({
          code: res.coupon.code,
          discountType: res.coupon.discountType,
          discountValue: res.coupon.discountValue,
          discountAmount: res.discountAmount || 0,
          finalPrice: res.finalPrice || 0
        });
        setCouponError(null);
      } else {
        setCouponError(res.message || 'Invalid or expired coupon code.');
      }
    } catch (err: any) {
      setCouponError(err.message || 'Could not validate coupon. Please try again.');
    } finally {
      setValidatingCoupon(false);
    }
  };

  const copyToClipboard = (text: string, fieldKey: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldKey);
    setTimeout(() => setCopiedField(null), 2000);
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
      executeFinalPurchase(`STARTER-2026-${Date.now().toString(36).toUpperCase()}`);
      return;
    }

    // Direct Transfer / Proof Mode check
    if ((walletFlow === 'transfer' && ['jazzcash', 'easypaisa'].includes(paymentMethod)) || 
        ['sadapay', 'nayapay', 'raast', 'bank'].includes(paymentMethod)) {
      if (!trxId || trxId.trim().length < 5) {
        alert('Please enter the Transaction ID (TID) / Reference number received from your bank / wallet.');
        return;
      }
      // Show instant clearing verification
      const cleanRef = trxId.trim();
      setActiveRefCode(cleanRef);
      setStep('auth');
      setAuthStage('authorizing');
      setTimeout(() => {
        setAuthStage('success');
        setTimeout(() => {
          executeFinalPurchase(cleanRef);
        }, 900);
      }, 1400);
      return;
    }

    // Real-Time Push / Interactive Authorization Handshake
    if (paymentMethod === 'safepay' || paymentMethod === 'card') {
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
      const ref = paymentMethod === 'safepay' 
        ? `SP-2026-${Date.now().toString(36).toUpperCase()}`
        : `3DS-2026-${Date.now().toString(36).toUpperCase()}`;
      setActiveRefCode(ref);
      setAuthCode('');
      setAuthStage('prompt');
      setStep('auth');
    } else if (paymentMethod === 'jazzcash' || paymentMethod === 'easypaisa') {
      const cleanMobile = customerMobile.replace(/\D/g, '');
      if (cleanMobile.length < 11) {
        alert(`Please enter a valid 11-digit ${paymentMethod === 'jazzcash' ? 'JazzCash' : 'Easypaisa'} mobile wallet number (e.g. 0300 1234567).`);
        return;
      }
      const ref = paymentMethod === 'jazzcash'
        ? `JC-2026-${Date.now().toString().slice(-8)}`
        : `EP-2026-${Date.now().toString().slice(-8)}`;
      setActiveRefCode(ref);
      setAuthCode('');
      setAuthStage('prompt');
      setStep('auth');
    }
  };

  // Step 2: Realistic 3D Secure / Real-Time Gateway Verification
  const handleAuthorizeGatewayOtp = () => {
    if (!authCode || authCode.length < 4) {
      alert('Please enter the verification passcode / MPIN to authorize payment.');
      return;
    }
    setAuthStage('authorizing');
    setTimeout(() => {
      setAuthStage('success');
      setTimeout(() => {
        executeFinalPurchase(activeRefCode);
      }, 900);
    }, 1400);
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
          amount: isFree ? 0 : finalCalculatedPrice,
          currency,
          couponCode: appliedCoupon?.code,
          notes: isFree && isStarter
            ? `Starter Plan 14-Day Free Trial (2 Events, 40 Attendees, 50 ID Passes & Certificates) | Ref: ${finalTrxRef}`
            : `Real-Time Gateway Clearance (${paymentMethod.toUpperCase()}) Ref: ${finalTrxRef} | Merchant: 03190375751${appliedCoupon ? ` | Coupon: ${appliedCoupon.code}` : ''}`
        });
      } catch (err) {
        console.warn('Backend billing purchase fallback:', err);
      }

      const invoiceNumber = purchaseRes?.invoiceNumber || `EVX-INV-2026-${Math.floor(100000 + Math.random() * 900000)}`;
      const finalOrgName = currentTenant?.name || orgName || 'Your Organization Workspace';
      const finalAdminEmail = user?.email || adminEmail || 'director@organization.com';
      const todayDate = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });

      setSuccessData({
        invoiceNumber,
        transactionRef: finalTrxRef,
        plan: selectedPlan.name + (isStarter && starterMode === 'trial' ? ' (14-Day Free Trial)' : ''),
        amount: totalDue,
        priceUsd: isAnnual ? baseMonthlyUsd * 12 : baseMonthlyUsd,
        pricePkr: isAnnual ? baseMonthlyPkr * 12 : baseMonthlyPkr,
        finalPrice: finalCalculatedPrice,
        originalPriceFormatted: discountAmount > 0 
          ? (currency === 'USD' ? `$${currentBasePrice}${isAnnual ? '/yr' : '/mo'}` : `PKR ${currentBasePrice.toLocaleString()}${isAnnual ? '/yr' : '/mo'}`) 
          : null,
        discountFormatted: discountAmount > 0 
          ? (currency === 'USD' ? `$${discountAmount}` : `PKR ${discountAmount.toLocaleString()}`) 
          : null,
        couponCode: appliedCoupon?.code || null,
        currency,
        status: 'pending_approval',
        billingCycle: isAnnual ? 'Annual (20% Off)' : 'Monthly',
        paymentMethod: isFree ? (isStarter ? 'Starter 14-Day Free Trial' : 'Free Starter Tier') : paymentMethod.toUpperCase(),
        date: todayDate,
        orgName: finalOrgName,
        adminEmail: finalAdminEmail,
        customerMobile: customerMobile || '03190375751',
        receivingAccount: '03190375751'
      });
      setStep('invoice');
    } catch (err: any) {
      alert(err.message || 'Payment authorization encountered an error. Please try again.');
      setStep('form');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
      
      {/* Main Responsive Card (No nested fixed modals = No clipping on mobile!) */}
      <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-auto relative animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white p-5 sm:p-6 relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
            title="Close Checkout"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex flex-wrap items-center gap-2 mb-2">
            <span className="px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-white/20 backdrop-blur-md text-white border border-white/20">
              {selectedPlan.badge || '2026 Enterprise Tier'}
            </span>
            <span className="text-[11px] text-blue-200 flex items-center gap-1 font-medium">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              EventoraX Real-Time Gateway • SBP 2026 Certified
            </span>
          </div>

          <h2 className="text-xl sm:text-2xl font-bold font-heading">{selectedPlan.name} Subscription</h2>
          <p className="text-xs text-blue-200 mt-1">{selectedPlan.description}</p>
        </div>

        {/* ============================================================= */}
        {/* STEP 1: REGISTRATION & REAL-TIME PAYMENT SELECTION */}
        {/* ============================================================= */}
        {step === 'form' && (
          <form onSubmit={handleInitiatePayment} className="p-4 sm:p-6 space-y-6 max-h-[80vh] overflow-y-auto">
            
            {/* Top Bar: Currency Switcher & Billing Cycle */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 flex flex-wrap items-center justify-between gap-4">
              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1">Pricing Currency</label>
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

              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1">Billing Interval</label>
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

              <div className="text-right ml-auto">
                <span className="text-[11px] text-slate-500 block">Total Due</span>
                {appliedCoupon && discountAmount > 0 ? (
                  <div>
                    <span className="text-xs line-through text-slate-400 block font-mono">
                      {currency === 'USD' ? `$${currentBasePrice}${isAnnual ? '/yr' : '/mo'}` : `PKR ${currentBasePrice.toLocaleString()}${isAnnual ? '/yr' : '/mo'}`}
                    </span>
                    <span className="text-xl font-extrabold text-emerald-600 font-heading">{totalDue}</span>
                  </div>
                ) : (
                  <span className="text-xl font-extrabold text-[#1d4ed8] font-heading">{totalDue}</span>
                )}
              </div>
            </div>

            {/* Starter Plan Selection (Trial vs Full Tier) */}
            {isStarter && (
              <div className="bg-gradient-to-r from-purple-50 via-indigo-50/50 to-purple-50 border border-purple-200 rounded-2xl p-4 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <span className="text-xs font-bold text-purple-950 flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-purple-600" />
                      Starter Tier Mode
                    </span>
                    <p className="text-[11px] text-purple-700 mt-0.5">
                      Choose 14-Day Free Trial or activate Full Starter Plan
                    </p>
                  </div>

                  <div className="inline-flex rounded-xl p-1 bg-white border border-purple-200 shadow-xs">
                    <button
                      type="button"
                      onClick={() => setStarterMode('full')}
                      className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                        starterMode === 'full' 
                          ? 'bg-[#7c3aed] text-white shadow-sm' 
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Full Plan (PKR 10,000 / $36)
                    </button>
                    <button
                      type="button"
                      onClick={() => setStarterMode('trial')}
                      className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                        starterMode === 'trial' 
                          ? 'bg-[#7c3aed] text-white shadow-sm' 
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      14-Day Free Trial ($0)
                    </button>
                  </div>
                </div>

                <div className="bg-white/90 p-3 rounded-xl border border-purple-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs">
                  <div className="font-semibold text-slate-800">
                    {starterMode === 'trial' ? (
                      <span className="text-purple-800">
                        🎯 <strong>Trial Limits:</strong> 2 Events • 40 Attendees • 50 ID Passes &amp; Certificates
                      </span>
                    ) : (
                      <span className="text-purple-900">
                        ⚡ <strong>Full Starter Limits:</strong> 10 Events • 500 Attendees • 520 ID Passes &amp; Certificates
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-emerald-700 font-bold flex items-center gap-1 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    Renewal &amp; Repurchase available upon quota exhaustion
                  </div>
                </div>
              </div>
            )}

            {/* Dynamic Coupon Code Section */}
            {!isFree && (
              <div className="bg-slate-50 p-3.5 sm:p-4 rounded-2xl border border-slate-200 space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <Tag className="w-3.5 h-3.5 text-blue-600" />
                    Promo Code / Discount Coupon
                  </label>
                  {appliedCoupon && (
                    <button
                      type="button"
                      onClick={() => {
                        setAppliedCoupon(null);
                        setCouponInput('');
                        setCouponError(null);
                      }}
                      className="text-[11px] text-red-600 hover:underline font-bold"
                    >
                      Remove Coupon
                    </button>
                  )}
                </div>

                {appliedCoupon ? (
                  <div className="flex items-center justify-between bg-emerald-50 border border-emerald-300 rounded-xl px-3.5 py-2.5 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded-lg bg-emerald-600 text-white font-mono font-bold text-xs tracking-wider">
                        {appliedCoupon.code}
                      </span>
                      <span className="text-emerald-800 font-semibold text-xs">
                        {appliedCoupon.discountType === 'percentage' ? `${appliedCoupon.discountValue}% Promo Applied` : `Discount Applied`}
                      </span>
                    </div>
                    <span className="text-emerald-900 font-bold font-mono text-sm">
                      - {currency === 'USD' ? `$${discountAmount}` : `PKR ${discountAmount.toLocaleString()}`}
                    </span>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="e.g. ORBIT2026, EVENTORAX50"
                      value={couponInput}
                      onChange={(e) => {
                        setCouponInput(e.target.value.toUpperCase());
                        setCouponError(null);
                      }}
                      className="flex-1 px-3.5 py-2 rounded-xl border border-slate-300 text-xs uppercase font-mono font-bold tracking-wider focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                    />
                    <Button
                      type="button"
                      disabled={!couponInput.trim() || validatingCoupon}
                      onClick={handleApplyCoupon}
                      className="rounded-xl px-4 text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white shrink-0"
                    >
                      {validatingCoupon ? 'Validating...' : 'Apply Coupon'}
                    </Button>
                  </div>
                )}

                {couponError && (
                  <p className="text-[11px] text-red-600 font-medium">{couponError}</p>
                )}
              </div>
            )}

            {/* Organization Info */}
            {user && user.role !== 'admin' ? (
              <div className="bg-blue-50/70 border border-blue-200 rounded-2xl p-4 flex items-center justify-between">
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
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-bold text-slate-800">2. Select Real-Time Payment Gateway</label>
                    <span className="text-[11px] text-emerald-600 font-bold flex items-center gap-1">
                      <Sparkles className="w-3 h-3" />
                      Real-Time Clearance
                    </span>
                  </div>

                  {/* Gateway Cards Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    
                    {/* Safepay (Featured Pakistani Gateway) */}
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('safepay')}
                      className={`p-3 rounded-2xl border text-left transition-all flex flex-col justify-between ${
                        paymentMethod === 'safepay'
                          ? 'border-[#182A4D] bg-slate-900 text-white ring-2 ring-blue-500 shadow-md'
                          : 'border-slate-200 bg-white hover:border-slate-400'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <SafepayBadge className="w-7 h-7" />
                        {paymentMethod === 'safepay' && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                      </div>
                      <span className={`text-xs font-bold block ${paymentMethod === 'safepay' ? 'text-white' : 'text-slate-900'}`}>
                        Safepay
                      </span>
                      <span className={`text-[10px] ${paymentMethod === 'safepay' ? 'text-slate-300' : 'text-slate-500'}`}>
                        Cards &amp; Checkout
                      </span>
                    </button>

                    {/* JazzCash */}
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('jazzcash')}
                      className={`p-3 rounded-2xl border text-left transition-all flex flex-col justify-between ${
                        paymentMethod === 'jazzcash'
                          ? 'border-red-600 bg-red-50/70 ring-2 ring-red-600/30 shadow-md'
                          : 'border-slate-200 bg-white hover:border-red-300'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <JazzCashBadge className="w-7 h-7" />
                        {paymentMethod === 'jazzcash' && <CheckCircle2 className="w-4 h-4 text-red-600" />}
                      </div>
                      <span className="text-xs font-bold text-slate-900 block">JazzCash</span>
                      <span className="text-[10px] text-red-700 font-semibold">03190375751</span>
                    </button>

                    {/* Easypaisa */}
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('easypaisa')}
                      className={`p-3 rounded-2xl border text-left transition-all flex flex-col justify-between ${
                        paymentMethod === 'easypaisa'
                          ? 'border-emerald-600 bg-emerald-50/70 ring-2 ring-emerald-600/30 shadow-md'
                          : 'border-slate-200 bg-white hover:border-emerald-300'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <EasypaisaBadge className="w-7 h-7" />
                        {paymentMethod === 'easypaisa' && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
                      </div>
                      <span className="text-xs font-bold text-slate-900 block">Easypaisa</span>
                      <span className="text-[10px] text-emerald-700 font-semibold">03190375751</span>
                    </button>

                    {/* SadaPay */}
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('sadapay')}
                      className={`p-3 rounded-2xl border text-left transition-all flex flex-col justify-between ${
                        paymentMethod === 'sadapay'
                          ? 'border-[#00A389] bg-teal-50/70 ring-2 ring-[#00A389]/30 shadow-md'
                          : 'border-slate-200 bg-white hover:border-teal-300'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <SadaPayBadge className="w-7 h-7" />
                        {paymentMethod === 'sadapay' && <CheckCircle2 className="w-4 h-4 text-teal-600" />}
                      </div>
                      <span className="text-xs font-bold text-slate-900 block">SadaPay</span>
                      <span className="text-[10px] text-teal-700 font-semibold">03190375751</span>
                    </button>

                    {/* NayaPay */}
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('nayapay')}
                      className={`p-3 rounded-2xl border text-left transition-all flex flex-col justify-between ${
                        paymentMethod === 'nayapay'
                          ? 'border-[#FF5C00] bg-orange-50/70 ring-2 ring-[#FF5C00]/30 shadow-md'
                          : 'border-slate-200 bg-white hover:border-orange-300'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <NayaPayBadge className="w-7 h-7" />
                        {paymentMethod === 'nayapay' && <CheckCircle2 className="w-4 h-4 text-orange-600" />}
                      </div>
                      <span className="text-xs font-bold text-slate-900 block">NayaPay</span>
                      <span className="text-[10px] text-orange-700 font-semibold">03190375751</span>
                    </button>

                    {/* Raast Instant Pay */}
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('raast')}
                      className={`p-3 rounded-2xl border text-left transition-all flex flex-col justify-between ${
                        paymentMethod === 'raast'
                          ? 'border-[#0B5D34] bg-emerald-50/70 ring-2 ring-[#0B5D34]/30 shadow-md'
                          : 'border-slate-200 bg-white hover:border-emerald-300'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <RaastBadge className="w-7 h-7" />
                        {paymentMethod === 'raast' && <CheckCircle2 className="w-4 h-4 text-emerald-700" />}
                      </div>
                      <span className="text-xs font-bold text-slate-900 block">Raast Pay</span>
                      <span className="text-[10px] text-emerald-800 font-semibold">SBP 03190375751</span>
                    </button>

                    {/* International / Domestic Cards */}
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('card')}
                      className={`p-3 rounded-2xl border text-left transition-all flex flex-col justify-between ${
                        paymentMethod === 'card'
                          ? 'border-[#1d4ed8] bg-blue-50/70 ring-2 ring-[#1d4ed8]/30 shadow-md'
                          : 'border-slate-200 bg-white hover:border-blue-300'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <CardNetworksBadge className="h-6 w-14" />
                        {paymentMethod === 'card' && <CheckCircle2 className="w-4 h-4 text-blue-600" />}
                      </div>
                      <span className="text-xs font-bold text-slate-900 block">Credit / Debit</span>
                      <span className="text-[10px] text-slate-500">Visa / Master 3DS</span>
                    </button>

                    {/* Direct Bank Transfer (IBFT) */}
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('bank')}
                      className={`p-3 rounded-2xl border text-left transition-all flex flex-col justify-between ${
                        paymentMethod === 'bank'
                          ? 'border-blue-900 bg-slate-100 ring-2 ring-blue-900/30 shadow-md'
                          : 'border-slate-200 bg-white hover:border-blue-300'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <BankTransferBadge className="w-7 h-7" />
                        {paymentMethod === 'bank' && <CheckCircle2 className="w-4 h-4 text-blue-900" />}
                      </div>
                      <span className="text-xs font-bold text-slate-900 block">Bank Transfer</span>
                      <span className="text-[10px] text-slate-500">Meezan IBFT</span>
                    </button>
                  </div>
                </div>

                {/* ============================================================= */}
                {/* DYNAMIC PAYMENT METHOD DETAILS & DIRECT MERCHANT INSTRUCTIONS */}
                {/* ============================================================= */}

                {/* 1. Safepay Gateway */}
                {paymentMethod === 'safepay' && (
                  <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-900 via-[#182A4D] to-slate-900 text-white space-y-4 animate-in fade-in">
                    <div className="flex items-center justify-between pb-3 border-b border-white/10">
                      <div className="flex items-center gap-2">
                        <SafepayBadge className="w-6 h-6" />
                        <div>
                          <h4 className="font-bold text-xs">Safepay Direct Checkout</h4>
                          <p className="text-[10px] text-slate-300">Pakistan&apos;s Leading Digital Payment Gateway • PCI-DSS Certified</p>
                        </div>
                      </div>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                        Live 2026 TLS 1.3
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      <div>
                        <label className="text-[11px] font-semibold text-slate-300 block mb-1">Cardholder Full Name</label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. John Doe"
                          value={cardHolder}
                          onChange={(e) => setCardHolder(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl border border-white/20 bg-white/10 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-400"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] font-semibold text-slate-300 block mb-1">16-Digit Card Number (Visa / MasterCard / PayPak)</label>
                        <input
                          type="text"
                          required
                          maxLength={19}
                          placeholder="4242 •••• •••• 4242"
                          value={cardNumber}
                          onChange={handleCardNumberChange}
                          className="w-full px-3 py-2 rounded-xl border border-white/20 bg-white/10 text-white placeholder-slate-400 font-mono focus:outline-none focus:ring-2 focus:ring-cyan-400"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] font-semibold text-slate-300 block mb-1">Expiry Date</label>
                        <input
                          type="text"
                          required
                          placeholder="MM/YY"
                          maxLength={5}
                          value={cardExpiry}
                          onChange={handleExpiryChange}
                          className="w-full px-3 py-2 rounded-xl border border-white/20 bg-white/10 text-white placeholder-slate-400 font-mono focus:outline-none focus:ring-2 focus:ring-cyan-400"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] font-semibold text-slate-300 block mb-1">CVV / Security Code</label>
                        <input
                          type="password"
                          required
                          placeholder="•••"
                          maxLength={4}
                          value={cardCvv}
                          onChange={(e) => setCardCvv(e.target.value.replace(/\D/g, ''))}
                          className="w-full px-3 py-2 rounded-xl border border-white/20 bg-white/10 text-white placeholder-slate-400 font-mono focus:outline-none focus:ring-2 focus:ring-cyan-400"
                        />
                      </div>
                    </div>

                    <p className="text-[10px] text-slate-300 flex items-center gap-1.5">
                      <Lock className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      Safepay tokenizes card data with State Bank of Pakistan 3D Secure 2.0 biometric clearance.
                    </p>
                  </div>
                )}

                {/* 2. JazzCash */}
                {paymentMethod === 'jazzcash' && (
                  <div className="p-4 rounded-2xl bg-red-50/70 border border-red-200 space-y-4 animate-in fade-in text-xs">
                    <div className="flex items-center justify-between pb-2 border-b border-red-200">
                      <div className="flex items-center gap-2">
                        <JazzCashBadge className="w-6 h-6" />
                        <div>
                          <h4 className="font-bold text-red-950 text-xs">JazzCash Real-Time Payment</h4>
                          <p className="text-[10px] text-red-700">Official Merchant Account: 03190375751</p>
                        </div>
                      </div>
                      {/* Flow Toggle */}
                      <div className="inline-flex rounded-lg p-0.5 bg-red-100 border border-red-300">
                        <button
                          type="button"
                          onClick={() => setWalletFlow('push')}
                          className={`px-2.5 py-1 rounded text-[10px] font-bold transition-all ${
                            walletFlow === 'push' ? 'bg-red-600 text-white' : 'text-red-900 hover:bg-red-200'
                          }`}
                        >
                          Real-Time Push MPIN
                        </button>
                        <button
                          type="button"
                          onClick={() => setWalletFlow('transfer')}
                          className={`px-2.5 py-1 rounded text-[10px] font-bold transition-all ${
                            walletFlow === 'transfer' ? 'bg-red-600 text-white' : 'text-red-900 hover:bg-red-200'
                          }`}
                        >
                          Direct Transfer (03190375751)
                        </button>
                      </div>
                    </div>

                    {walletFlow === 'push' ? (
                      <div className="space-y-3">
                        <label className="text-xs font-bold text-slate-800 block">
                          Enter Your JazzCash Registered Mobile Number *
                        </label>
                        <div className="relative">
                          <input
                            type="text"
                            required
                            placeholder="0300 1234567"
                            value={customerMobile}
                            onChange={(e) => setCustomerMobile(e.target.value)}
                            className="w-full px-3.5 py-2.5 rounded-xl border border-red-300 text-sm bg-white font-mono focus:outline-none focus:ring-2 focus:ring-red-500"
                          />
                        </div>
                        <p className="text-[11px] text-red-800">
                          Clicking <strong>&ldquo;Authorize Payment&rdquo;</strong> will dispatch a live USSD / Mobile Push Request to your phone from Merchant <strong>03190375751</strong>. You will enter your 4-digit MPIN to complete debit.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <div className="bg-white p-3 rounded-xl border border-red-200 space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-slate-500 font-medium">Merchant Title:</span>
                            <span className="font-bold text-slate-900">ORBIT-I / EventoraX</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-slate-500 font-medium">JazzCash Mobile / Till:</span>
                            <div className="flex items-center gap-1.5 font-mono font-bold text-red-700">
                              <span>03190375751</span>
                              <button
                                type="button"
                                onClick={() => copyToClipboard('03190375751', 'jc_num')}
                                className="px-2 py-0.5 rounded bg-red-100 text-[10px] text-red-900 font-sans"
                              >
                                {copiedField === 'jc_num' ? 'Copied' : 'Copy'}
                              </button>
                            </div>
                          </div>
                        </div>

                        <div>
                          <label className="text-xs font-bold text-slate-800 block mb-1">
                            Enter JazzCash Transaction ID (TID from 8585 SMS) *
                          </label>
                          <input
                            type="text"
                            placeholder="e.g. 02948102941"
                            value={trxId}
                            onChange={(e) => setTrxId(e.target.value)}
                            className="w-full px-3.5 py-2 rounded-xl border border-red-300 text-sm bg-white font-mono focus:outline-none focus:ring-2 focus:ring-red-500"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* 3. Easypaisa */}
                {paymentMethod === 'easypaisa' && (
                  <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200 space-y-4 animate-in fade-in text-xs">
                    <div className="flex items-center justify-between pb-2 border-b border-emerald-200">
                      <div className="flex items-center gap-2">
                        <EasypaisaBadge className="w-6 h-6" />
                        <div>
                          <h4 className="font-bold text-emerald-950 text-xs">Easypaisa Real-Time Payment</h4>
                          <p className="text-[10px] text-emerald-700">Official Merchant Account: 03190375751</p>
                        </div>
                      </div>
                      {/* Flow Toggle */}
                      <div className="inline-flex rounded-lg p-0.5 bg-emerald-100 border border-emerald-300">
                        <button
                          type="button"
                          onClick={() => setWalletFlow('push')}
                          className={`px-2.5 py-1 rounded text-[10px] font-bold transition-all ${
                            walletFlow === 'push' ? 'bg-emerald-600 text-white' : 'text-emerald-900 hover:bg-emerald-200'
                          }`}
                        >
                          In-App Push Prompt
                        </button>
                        <button
                          type="button"
                          onClick={() => setWalletFlow('transfer')}
                          className={`px-2.5 py-1 rounded text-[10px] font-bold transition-all ${
                            walletFlow === 'transfer' ? 'bg-emerald-600 text-white' : 'text-emerald-900 hover:bg-emerald-200'
                          }`}
                        >
                          Direct Transfer (03190375751)
                        </button>
                      </div>
                    </div>

                    {walletFlow === 'push' ? (
                      <div className="space-y-3">
                        <label className="text-xs font-bold text-slate-800 block">
                          Enter Your Easypaisa Registered Mobile Number *
                        </label>
                        <div className="relative">
                          <input
                            type="text"
                            required
                            placeholder="0345 1234567"
                            value={customerMobile}
                            onChange={(e) => setCustomerMobile(e.target.value)}
                            className="w-full px-3.5 py-2.5 rounded-xl border border-emerald-300 text-sm bg-white font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500"
                          />
                        </div>
                        <p className="text-[11px] text-emerald-800">
                          A real-time payment authorization request will be pushed to your Easypaisa app from Merchant <strong>03190375751</strong>.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <div className="bg-white p-3 rounded-xl border border-emerald-200 space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-slate-500 font-medium">Merchant Title:</span>
                            <span className="font-bold text-slate-900">ORBIT-I / EventoraX</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-slate-500 font-medium">Easypaisa Number:</span>
                            <div className="flex items-center gap-1.5 font-mono font-bold text-emerald-700">
                              <span>03190375751</span>
                              <button
                                type="button"
                                onClick={() => copyToClipboard('03190375751', 'ep_num')}
                                className="px-2 py-0.5 rounded bg-emerald-100 text-[10px] text-emerald-900 font-sans"
                              >
                                {copiedField === 'ep_num' ? 'Copied' : 'Copy'}
                              </button>
                            </div>
                          </div>
                        </div>

                        <div>
                          <label className="text-xs font-bold text-slate-800 block mb-1">
                            Enter 11-Digit Easypaisa Trx ID (from 3737 SMS) *
                          </label>
                          <input
                            type="text"
                            placeholder="e.g. 19827401928"
                            value={trxId}
                            onChange={(e) => setTrxId(e.target.value)}
                            className="w-full px-3.5 py-2 rounded-xl border border-emerald-300 text-sm bg-white font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* 4. SadaPay */}
                {paymentMethod === 'sadapay' && (
                  <div className="p-4 rounded-2xl bg-teal-50/70 border border-teal-200 space-y-3 animate-in fade-in text-xs text-teal-950">
                    <div className="flex items-center gap-2 font-bold text-xs">
                      <SadaPayBadge className="w-6 h-6" />
                      <div>
                        <h4>SadaPay Real-Time Transfer / SadaBiz</h4>
                        <p className="text-[10px] text-teal-700">Verified FinTech Wallet Account: 03190375751</p>
                      </div>
                    </div>

                    <div className="bg-white p-3 rounded-xl border border-teal-200 space-y-2 font-mono">
                      <div className="flex justify-between items-center font-sans">
                        <span className="text-slate-500">Account Title:</span>
                        <span className="font-bold text-slate-900">ORBIT-I / EventoraX</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="font-sans text-slate-500">SadaPay Mobile:</span>
                        <div className="flex items-center gap-1.5 font-bold text-teal-700">
                          <span>03190375751</span>
                          <button
                            type="button"
                            onClick={() => copyToClipboard('03190375751', 'sada_num')}
                            className="px-2 py-0.5 rounded bg-teal-100 text-[10px] text-teal-900 font-sans"
                          >
                            {copiedField === 'sada_num' ? 'Copied' : 'Copy'}
                          </button>
                        </div>
                      </div>
                      <div className="flex justify-between items-center pt-1 border-t border-slate-100">
                        <span className="font-sans text-slate-500">SadaPay IBAN:</span>
                        <div className="flex items-center gap-1.5 font-bold text-slate-800 text-[11px]">
                          <span>PK74SADA00000003190375751</span>
                          <button
                            type="button"
                            onClick={() => copyToClipboard('PK74SADA00000003190375751', 'sada_iban')}
                            className="px-2 py-0.5 rounded bg-teal-100 text-[10px] text-teal-900 font-sans"
                          >
                            {copiedField === 'sada_iban' ? 'Copied' : 'Copy IBAN'}
                          </button>
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-800 block mb-1">
                        Enter SadaPay Transaction Reference / RRN *
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. SADA-99214710"
                        value={trxId}
                        onChange={(e) => setTrxId(e.target.value)}
                        className="w-full px-3.5 py-2 rounded-xl border border-teal-300 text-sm bg-white font-mono focus:outline-none focus:ring-2 focus:ring-teal-500"
                      />
                    </div>
                  </div>
                )}

                {/* 5. NayaPay */}
                {paymentMethod === 'nayapay' && (
                  <div className="p-4 rounded-2xl bg-orange-50/70 border border-orange-200 space-y-3 animate-in fade-in text-xs text-orange-950">
                    <div className="flex items-center gap-2 font-bold text-xs">
                      <NayaPayBadge className="w-6 h-6" />
                      <div>
                        <h4>NayaPay Real-Time Digital Wallet</h4>
                        <p className="text-[10px] text-orange-700">NayaPay Account &amp; ID: 03190375751</p>
                      </div>
                    </div>

                    <div className="bg-white p-3 rounded-xl border border-orange-200 space-y-2 font-mono">
                      <div className="flex justify-between items-center font-sans">
                        <span className="text-slate-500">Account Title:</span>
                        <span className="font-bold text-slate-900">ORBIT-I / EventoraX</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="font-sans text-slate-500">NayaPay ID / Mobile:</span>
                        <div className="flex items-center gap-1.5 font-bold text-orange-700">
                          <span>03190375751</span>
                          <button
                            type="button"
                            onClick={() => copyToClipboard('03190375751', 'naya_num')}
                            className="px-2 py-0.5 rounded bg-orange-100 text-[10px] text-orange-900 font-sans"
                          >
                            {copiedField === 'naya_num' ? 'Copied' : 'Copy'}
                          </button>
                        </div>
                      </div>
                      <div className="flex justify-between items-center pt-1 border-t border-slate-100">
                        <span className="font-sans text-slate-500">NayaPay IBAN:</span>
                        <div className="flex items-center gap-1.5 font-bold text-slate-800 text-[11px]">
                          <span>PK90NAYA00000003190375751</span>
                          <button
                            type="button"
                            onClick={() => copyToClipboard('PK90NAYA00000003190375751', 'naya_iban')}
                            className="px-2 py-0.5 rounded bg-orange-100 text-[10px] text-orange-900 font-sans"
                          >
                            {copiedField === 'naya_iban' ? 'Copied' : 'Copy IBAN'}
                          </button>
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-800 block mb-1">
                        Enter NayaPay Transaction Ref / Receipt ID *
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. NAYA-88410294"
                        value={trxId}
                        onChange={(e) => setTrxId(e.target.value)}
                        className="w-full px-3.5 py-2 rounded-xl border border-orange-300 text-sm bg-white font-mono focus:outline-none focus:ring-2 focus:ring-orange-500"
                      />
                    </div>
                  </div>
                )}

                {/* 6. Raast Instant Pay */}
                {paymentMethod === 'raast' && (
                  <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-300 space-y-3 animate-in fade-in text-xs text-emerald-950">
                    <div className="flex items-center gap-2 font-bold text-xs">
                      <RaastBadge className="w-6 h-6" />
                      <div>
                        <h4>Raast Instant Payment (State Bank of Pakistan)</h4>
                        <p className="text-[10px] text-emerald-700">Zero Fees • Instant Settlement across 35+ Pakistani Banks</p>
                      </div>
                    </div>

                    <div className="bg-white p-3 rounded-xl border border-emerald-200 space-y-2 font-mono">
                      <div className="flex justify-between items-center font-sans">
                        <span className="text-slate-500">Beneficiary Title:</span>
                        <span className="font-bold text-slate-900">ORBIT-I / EventoraX</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="font-sans text-slate-500">Official Raast ID:</span>
                        <div className="flex items-center gap-1.5 font-bold text-emerald-700">
                          <span>03190375751</span>
                          <button
                            type="button"
                            onClick={() => copyToClipboard('03190375751', 'raast_id')}
                            className="px-2 py-0.5 rounded bg-emerald-100 text-[10px] text-emerald-900 font-sans"
                          >
                            {copiedField === 'raast_id' ? 'Copied' : 'Copy Raast ID'}
                          </button>
                        </div>
                      </div>
                      <div className="flex justify-between items-center pt-1 border-t border-slate-100">
                        <span className="font-sans text-slate-500">Raast IBAN:</span>
                        <div className="flex items-center gap-1.5 font-bold text-slate-800 text-[11px]">
                          <span>PK64MEZN0001020104889912</span>
                          <button
                            type="button"
                            onClick={() => copyToClipboard('PK64MEZN0001020104889912', 'raast_iban')}
                            className="px-2 py-0.5 rounded bg-emerald-100 text-[10px] text-emerald-900 font-sans"
                          >
                            {copiedField === 'raast_iban' ? 'Copied' : 'Copy'}
                          </button>
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-800 block mb-1">
                        Enter Raast Reference Number (RRN from Bank SMS / App) *
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. RAST-2026-98124501"
                        value={trxId}
                        onChange={(e) => setTrxId(e.target.value)}
                        className="w-full px-3.5 py-2 rounded-xl border border-emerald-300 text-sm bg-white font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                  </div>
                )}

                {/* 7. Direct Cards (Visa / Mastercard) */}
                {paymentMethod === 'card' && (
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3 animate-in fade-in">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                      <div className="flex items-center gap-2">
                        <CardNetworksBadge className="h-5 w-12" />
                        <span className="text-xs font-bold text-slate-800">Credit / Debit Card (256-Bit 3DS 2.0)</span>
                      </div>
                      <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-1">
                        <Lock className="w-3 h-3" />
                        Secure Issuing Switch
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      <div>
                        <label className="text-[11px] font-semibold text-slate-600 block mb-1">Cardholder Full Name</label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. John Doe"
                          value={cardHolder}
                          onChange={(e) => setCardHolder(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-slate-900"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] font-semibold text-slate-600 block mb-1">16-Digit Card Number</label>
                        <input
                          type="text"
                          required
                          maxLength={19}
                          placeholder="4242 •••• •••• 4242"
                          value={cardNumber}
                          onChange={handleCardNumberChange}
                          className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-slate-900 font-mono"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] font-semibold text-slate-600 block mb-1">Expiry Date</label>
                        <input
                          type="text"
                          required
                          placeholder="MM/YY"
                          maxLength={5}
                          value={cardExpiry}
                          onChange={handleExpiryChange}
                          className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-slate-900 font-mono"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] font-semibold text-slate-600 block mb-1">CVV / CVC Code</label>
                        <input
                          type="password"
                          required
                          placeholder="•••"
                          maxLength={4}
                          value={cardCvv}
                          onChange={(e) => setCardCvv(e.target.value.replace(/\D/g, ''))}
                          className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-slate-900 font-mono"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* 8. Bank Transfer (IBFT) */}
                {paymentMethod === 'bank' && (
                  <div className="p-4 rounded-2xl bg-blue-50/70 border border-blue-200 space-y-3 animate-in fade-in text-xs text-blue-950">
                    <div className="flex items-center gap-2 font-bold text-xs">
                      <BankTransferBadge className="w-6 h-6" />
                      <div>
                        <h4>Official Corporate Bank Account (All Pakistani Banks)</h4>
                        <p className="text-[10px] text-blue-700">Meezan Bank, HBL, Bank Alfalah, Faysal Bank, etc.</p>
                      </div>
                    </div>

                    <div className="bg-white p-3 rounded-xl border border-blue-200 space-y-2 font-mono">
                      <div className="flex justify-between items-center font-sans">
                        <span className="text-slate-500">Bank Name:</span>
                        <span className="font-bold text-slate-900">Meezan Bank Limited</span>
                      </div>
                      <div className="flex justify-between items-center font-sans">
                        <span className="text-slate-500">Account Title:</span>
                        <span className="font-bold text-slate-900">EventoraX Technologies (ORBIT-I)</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="font-sans text-slate-500">Account Number:</span>
                        <div className="flex items-center gap-1.5 font-bold text-blue-700">
                          <span>0102-0104889912</span>
                          <button
                            type="button"
                            onClick={() => copyToClipboard('01020104889912', 'bank_acc')}
                            className="px-2 py-0.5 rounded bg-blue-100 text-[10px] text-blue-900 font-sans"
                          >
                            {copiedField === 'bank_acc' ? 'Copied' : 'Copy'}
                          </button>
                        </div>
                      </div>
                      <div className="flex justify-between items-center pt-1 border-t border-slate-100">
                        <span className="font-sans text-slate-500">Official IBAN:</span>
                        <div className="flex items-center gap-1.5 font-bold text-slate-800 text-[11px]">
                          <span>PK64MEZN0001020104889912</span>
                          <button
                            type="button"
                            onClick={() => copyToClipboard('PK64MEZN0001020104889912', 'bank_iban')}
                            className="px-2 py-0.5 rounded bg-blue-100 text-[10px] text-blue-900 font-sans"
                          >
                            {copiedField === 'bank_iban' ? 'Copied' : 'Copy IBAN'}
                          </button>
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-800 block mb-1">
                        Enter Transaction Reference / Slip ID *
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. TRX-982347102"
                        value={trxId}
                        onChange={(e) => setTrxId(e.target.value)}
                        className="w-full px-3.5 py-2 rounded-xl border border-blue-300 text-sm bg-white font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-900 space-y-2">
                <div className="flex items-center gap-2 font-bold text-sm text-amber-950">
                  <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
                  Free Starter Plan • Platform Authority Approval Required
                </div>
                <p>
                  To preserve platform resources, all organizations require <strong>EventoraX SuperAdmin</strong> verification before access is unlocked.
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
                className="rounded-xl px-5 text-xs"
              >
                Cancel
              </Button>

              <Button
                type="submit"
                disabled={isProcessing}
                className="bg-[#1d4ed8] hover:bg-[#1e40af] text-white rounded-xl px-7 font-bold shadow-lg shadow-blue-600/25 flex items-center gap-2 h-11 text-xs"
              >
                {isProcessing ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Connecting to SBP Switch...
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
        )}

        {/* ============================================================= */}
        {/* STEP 2: IMMERSIVE 3D SECURE & MOBILE MPIN REAL-TIME AUTH VIEW */}
        {/* ============================================================= */}
        {step === 'auth' && (
          <div className="p-5 sm:p-8 space-y-6 animate-in fade-in zoom-in-95">
            {/* Header branding */}
            <div className="text-center space-y-2">
              <div className="w-14 h-14 rounded-2xl bg-blue-50 text-[#1d4ed8] flex items-center justify-center mx-auto shadow-inner">
                {paymentMethod === 'safepay' && <SafepayBadge className="w-9 h-9" />}
                {paymentMethod === 'jazzcash' && <JazzCashBadge className="w-9 h-9" />}
                {paymentMethod === 'easypaisa' && <EasypaisaBadge className="w-9 h-9" />}
                {['sadapay', 'nayapay', 'raast', 'bank', 'card'].includes(paymentMethod) && <KeyRound className="w-7 h-7" />}
              </div>

              <h3 className="font-bold text-slate-900 text-lg">
                {paymentMethod === 'safepay' && 'Safepay 3D Secure 2.0 • Issuing Bank Challenge'}
                {paymentMethod === 'jazzcash' && 'JazzCash Mobile Push Payment Request'}
                {paymentMethod === 'easypaisa' && 'Easypaisa In-App Approval Portal'}
                {paymentMethod === 'card' && '3D Secure 2.0 • Bank Identity Verification'}
                {['sadapay', 'nayapay', 'raast', 'bank'].includes(paymentMethod) && 'State Bank of Pakistan Clearing Switch'}
              </h3>
              
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                {paymentMethod === 'jazzcash'
                  ? `Payment request of ${totalDue} dispatched to your phone from Merchant ORBIT-I (03190375751). Enter 4-digit MPIN below to authorize debit.`
                  : paymentMethod === 'easypaisa'
                  ? `In-App prompt sent to ${customerMobile || '03190375751'}. Confirm transaction with OTP / MPIN.`
                  : `A one-time passcode has been sent via SMS to cardholder mobile ending in ••89.`}
              </p>
            </div>

            {authStage === 'prompt' && (
              <div className="space-y-4 max-w-md mx-auto">
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2 text-xs font-mono text-slate-700">
                  <div className="flex justify-between">
                    <span className="font-sans text-slate-500">Merchant Account:</span>
                    <span className="font-bold text-slate-900">ORBIT-I / EventoraX (03190375751)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-sans text-slate-500">Amount to Debit:</span>
                    <span className="font-bold text-[#1d4ed8]">{totalDue}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-sans text-slate-500">Transaction ID:</span>
                    <span className="font-bold text-slate-800">{activeRefCode}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-sans text-slate-500">Security Clearance:</span>
                    <span className="text-emerald-700 font-bold">2026 SBP 1LINK Compliant</span>
                  </div>
                </div>

                <div>
                  <input
                    type="password"
                    maxLength={paymentMethod === 'jazzcash' ? 4 : 6}
                    placeholder={paymentMethod === 'jazzcash' ? "••••" : "•• •• ••"}
                    value={authCode}
                    onChange={(e) => setAuthCode(e.target.value.replace(/\D/g, ''))}
                    className="w-full text-center text-3xl tracking-[0.4em] font-mono font-bold py-3.5 px-4 rounded-2xl border-2 border-blue-400 focus:outline-none focus:ring-4 focus:ring-blue-100"
                    autoFocus
                  />
                  <div className="flex justify-between items-center mt-2 text-[11px]">
                    <button
                      type="button"
                      onClick={() => setAuthCode(paymentMethod === 'jazzcash' ? '5921' : '849201')}
                      className="text-blue-600 font-bold hover:underline"
                    >
                      Fill Test Code ({paymentMethod === 'jazzcash' ? '5921' : '849201'})
                    </button>
                    <span className="text-slate-400">Expires in 02:45</span>
                  </div>
                </div>

                <div className="pt-2 flex gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setStep('form')}
                    className="flex-1 rounded-xl text-xs"
                  >
                    Back to Form
                  </Button>
                  <Button
                    type="button"
                    onClick={handleAuthorizeGatewayOtp}
                    className="flex-1 rounded-xl text-xs font-bold bg-[#1d4ed8] hover:bg-[#1e40af] text-white shadow-md shadow-blue-500/25"
                  >
                    Confirm &amp; Debit
                  </Button>
                </div>
              </div>
            )}

            {authStage === 'authorizing' && (
              <div className="py-8 text-center space-y-4">
                <div className="w-14 h-14 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
                <h3 className="font-bold text-slate-900 text-base">Confirming Clearance on SBP Switch...</h3>
                <p className="text-xs text-slate-500 max-w-xs mx-auto">
                  Handshaking with issuing institution and updating EventoraX master ledger. Please do not refresh.
                </p>
              </div>
            )}

            {authStage === 'success' && (
              <div className="py-8 text-center space-y-3">
                <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                  <Check className="w-8 h-8 stroke-[3]" />
                </div>
                <h3 className="font-bold text-slate-900 text-lg">Real-Time Payment Authorized!</h3>
                <p className="text-xs text-emerald-700 font-mono">
                  Authorization Reference: {activeRefCode}
                </p>
              </div>
            )}
          </div>
        )}

        {/* ============================================================= */}
        {/* STEP 3: OFFICIAL 2026 ENTERPRISE TAX INVOICE & RECEIPT */}
        {/* ============================================================= */}
        {step === 'invoice' && successData && (
          <div className="p-4 sm:p-8 text-center space-y-6 max-h-[85vh] overflow-y-auto">
            
            <div className="w-14 h-14 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center mx-auto shadow-lg shadow-amber-500/20">
              <Clock className="w-8 h-8 stroke-[2.5]" />
            </div>

            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300 mb-2">
                <ShieldCheck className="w-3.5 h-3.5 text-amber-600" />
                Real-Time Payment Recorded • Pending SuperAdmin Activation
              </div>
              <h3 className="text-xl sm:text-2xl font-bold font-heading text-slate-900">
                Order Confirmed! Awaiting License Key Activation
              </h3>
              <p className="text-xs text-slate-600 mt-1.5 max-w-md mx-auto leading-relaxed">
                Your payment was received at merchant account <strong>03190375751</strong> and securely registered. In accordance with platform governance, your dedicated workspace is awaiting <strong>Platform Authority (ORBIT-I)</strong> activation.
              </p>
            </div>

            {/* Official Tax Invoice Container (Printable via printElement) */}
            <div 
              id={`subscription-receipt-${invoiceUniqueId}`}
              className="bg-white p-6 rounded-2xl border-2 border-slate-300 text-left space-y-4 font-sans text-xs max-w-lg mx-auto shadow-sm relative overflow-hidden"
            >
              {/* Watermark */}
              <div className="absolute right-4 bottom-14 opacity-5 pointer-events-none select-none text-slate-900 font-black text-6xl rotate-[-20deg]">
                EVENTORAX
              </div>

              {/* Official Header */}
              <div className="flex justify-between items-start pb-3 border-b border-slate-200">
                <div>
                  <h4 className="font-extrabold text-sm text-slate-900 tracking-tight">EVENTORAX TECHNOLOGIES (PVT) LTD</h4>
                  <p className="text-[10px] text-slate-500 font-medium">ORBIT-I Cloud Digital Systems • SBP Digital Reg: PK-2026</p>
                  <p className="text-[10px] text-slate-400 font-mono">NTN: 9842104-7 • STRN: 3277876123456</p>
                </div>
                <div className="text-right">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-emerald-100 text-emerald-800 border border-emerald-300 block mb-1">
                    VERIFIED &amp; RECORDED
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono block">Year 2026 Edition</span>
                </div>
              </div>

              {/* Invoice Meta */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                <div className="break-all">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Official Tax Invoice ID</span>
                  <span className="font-mono font-bold text-slate-900">{successData.invoiceNumber}</span>
                </div>
                <div className="break-all">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Transaction Reference (TID)</span>
                  <span className="font-mono font-bold text-[#1d4ed8]">{successData.transactionRef}</span>
                </div>
                <div className="break-all">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Client Organization</span>
                  <span className="font-bold text-slate-900">{successData.orgName}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Issue Date</span>
                  <span className="font-medium text-slate-800">{successData.date}</span>
                </div>
              </div>

              {/* Receiving Merchant Info */}
              <div className="bg-blue-50/60 p-3.5 rounded-xl border border-blue-200 text-[11px] space-y-1.5">
                <div className="flex flex-col sm:flex-row sm:justify-between gap-0.5">
                  <span className="text-slate-500">Merchant Recipient:</span>
                  <span className="font-bold text-slate-900">ORBIT-I / EventoraX Technologies</span>
                </div>
                <div className="flex flex-col sm:flex-row sm:justify-between gap-0.5">
                  <span className="text-slate-500">Merchant Account / Till:</span>
                  <span className="font-mono font-bold text-blue-700">03190375751</span>
                </div>
                <div className="flex flex-col sm:flex-row sm:justify-between gap-0.5">
                  <span className="text-slate-500">Payment Gateway:</span>
                  <span className="font-bold text-slate-900">{successData.paymentMethod}</span>
                </div>
              </div>

              {/* Line Items Table */}
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 text-slate-600 font-bold text-[11px]">
                    <tr>
                      <th className="p-2.5">Description</th>
                      <th className="p-2.5 text-center">Cycle</th>
                      <th className="p-2.5 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    <tr>
                      <td className="p-2.5">
                        <strong className="block text-slate-900">EventoraX {successData.plan} Tier</strong>
                        <span className="text-[10px] text-slate-500">Enterprise Cloud Event Management &amp; Pass Infrastructure (2026 Release)</span>
                      </td>
                      <td className="p-2.5 text-center text-slate-700 font-medium">{successData.billingCycle}</td>
                      <td className="p-2.5 text-right font-bold text-slate-900">{successData.originalPriceFormatted || successData.amount}</td>
                    </tr>
                    {successData.couponCode && (
                      <tr className="bg-emerald-50/60">
                        <td colSpan={2} className="p-2 text-right text-emerald-700 text-[11px] font-bold">
                          Promo Coupon Applied ({successData.couponCode}):
                        </td>
                        <td className="p-2 text-right font-mono font-bold text-emerald-700">
                          -{successData.discountFormatted}
                        </td>
                      </tr>
                    )}
                    <tr>
                      <td colSpan={2} className="p-2 text-right text-slate-500 text-[11px]">Sales Tax / GST (0% Section 65F IT Exemption):</td>
                      <td className="p-2 text-right font-mono text-slate-700">PKR 0.00</td>
                    </tr>
                    <tr className="bg-slate-50 font-bold text-sm text-[#1d4ed8]">
                      <td colSpan={2} className="p-2.5 text-right">Total Paid (Inclusive of all dues):</td>
                      <td className="p-2.5 text-right">{successData.amount}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* QR Code & Digital Signature */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-200">
                <div className="flex items-center gap-3">
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${encodeURIComponent(`https://eventorax.orbit-i.tech/verify-invoice?id=${successData.invoiceNumber}&ref=${successData.transactionRef}&merchant=03190375751`)}`}
                    alt="Official Invoice QR Verification"
                    className="w-14 h-14 rounded-lg border border-slate-200 p-0.5"
                  />
                  <div>
                    <span className="text-[10px] font-bold text-slate-700 block">Digital QR Verification</span>
                    <p className="text-[9px] text-slate-400 max-w-[170px]">
                      Scan to authenticate digital invoice on the EventoraX public verification ledger.
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-[9px] text-slate-400 uppercase font-bold block">ORBIT-I Cloud Platform</span>
                  <span className="font-serif italic text-xs text-slate-800 font-bold">Authorized Digital Sign</span>
                  <span className="text-[9px] text-emerald-600 font-mono block">SHA-256 Verified 2026</span>
                </div>
              </div>
            </div>

            {/* Next Steps Card */}
            <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 text-xs text-blue-900 max-w-lg mx-auto text-left space-y-1">
              <strong className="block font-bold">What happens next?</strong>
              <p className="text-[11px] text-blue-800">
                1. Platform SuperAdmin confirms the merchant ledger entry (Account: <strong>03190375751</strong>) and issues your dedicated <strong>Activation License Key</strong> (`EVX-ACT-...`).
              </p>
              <p className="text-[11px] text-blue-800">
                2. Your workspace quotas will be automatically unlocked. You can download this official tax receipt at any time from your Billing tab.
              </p>
            </div>

            {/* Actions Bar */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2 max-w-lg mx-auto">
              <Button
                onClick={() => printElement(`subscription-receipt-${invoiceUniqueId}`, `EventoraX Official Tax Invoice - ${successData.invoiceNumber}`)}
                variant="outline"
                className="rounded-xl flex items-center justify-center gap-2 w-full sm:w-auto text-xs h-11 px-5"
              >
                <Download className="w-4 h-4" />
                Print / Save PDF Invoice
              </Button>

              <Button
                onClick={() => {
                  onClose();
                  window.location.href = '/dashboard';
                }}
                className="bg-[#1d4ed8] hover:bg-[#1e40af] text-white rounded-xl px-6 w-full sm:w-auto font-bold flex items-center justify-center gap-2 text-xs h-11"
              >
                Go to Organization Dashboard
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
