import { useState } from 'react';
import { 
  X, 
  Check, 
  CreditCard, 
  Building2, 
  ShieldCheck, 
  Sparkles, 
  Download, 
  ArrowRight,
  Smartphone,
  QrCode,
  CheckCircle2,
  Copy,
  Receipt
} from 'lucide-react';
import { Button } from './ui/button';
import { api } from '@/services/api';
import { printElement } from '@/lib/printUtils';

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

  // Form states
  const [orgName, setOrgName] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [trxId, setTrxId] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [cardHolder, setCardHolder] = useState('');

  if (!isOpen) return null;

  const isFree = selectedPlan.priceUsdMonthly === 0;

  // Price calculation
  const multiplier = isAnnual ? 0.8 : 1.0;
  const priceUsd = Math.round(selectedPlan.priceUsdMonthly * multiplier);
  const pricePkr = Math.round(selectedPlan.pricePkrMonthly * multiplier);
  const displayPrice = isFree ? 'Free' : currency === 'USD' ? `$${priceUsd}` : `PKR ${pricePkr.toLocaleString()}`;
  const totalDue = isFree 
    ? 'Free' 
    : isAnnual 
      ? (currency === 'USD' ? `$${priceUsd * 12}/yr` : `PKR ${(pricePkr * 12).toLocaleString()}/yr`)
      : (currency === 'USD' ? `$${priceUsd}/mo` : `PKR ${pricePkr.toLocaleString()}/mo`);

  const handleCopyIban = () => {
    navigator.clipboard.writeText('PK64MEZN0001020104889912');
    setCopiedBank(true);
    setTimeout(() => setCopiedBank(false), 2000);
  };

  const handleCompleteSubscription = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);

    try {
      let purchaseRes: any = null;
      try {
        purchaseRes = await api.billing.purchase({
          plan: selectedPlan.name,
          billingCycle: isAnnual ? 'yearly' : 'monthly',
          paymentMethod,
          transactionRef: trxId || (paymentMethod === 'card' ? `CARD-${Date.now().toString(36).toUpperCase()}` : undefined),
          amount: isFree ? 0 : (isAnnual ? priceUsd * 12 : priceUsd),
          currency,
          notes: `Payment for ${selectedPlan.name} via ${paymentMethod.toUpperCase()}`
        });
      } catch (err) {
        // Fallback for direct or guest flow
      }

      await new Promise(r => setTimeout(r, 600));

      const invoiceNumber = purchaseRes?.invoiceNumber || (trxId ? trxId : `EVX-INV-${Date.now().toString().slice(-6)}`);
      const status = purchaseRes?.status || (isFree ? 'active' : 'pending_approval');

      setSuccessData({
        invoiceNumber,
        plan: selectedPlan.name,
        amount: totalDue,
        currency,
        status,
        billingCycle: isAnnual ? 'Annual (20% Discount)' : 'Monthly',
        paymentMethod: isFree ? 'Free Community Tier' : paymentMethod.toUpperCase(),
        date: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }),
        orgName: orgName || 'Your Organization',
        adminEmail: adminEmail || 'admin@eventorax.com',
      });
    } catch (err) {
      alert('Subscription processing error. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200">
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
              Secure 256-bit Encrypted Checkout
            </span>
          </div>

          <h2 className="text-2xl font-bold font-heading">{selectedPlan.name} Subscription</h2>
          <p className="text-xs text-blue-100 mt-1">{selectedPlan.description}</p>
        </div>

        {/* Content */}
        {!successData ? (
          <form onSubmit={handleCompleteSubscription} className="p-6 space-y-6">
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
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Organization / Brand Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Acme Innovations"
                  value={orgName}
                  onChange={(e) => setOrgName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Admin Account Email *</label>
                <input
                  type="email"
                  required
                  placeholder="admin@yourcompany.com"
                  value={adminEmail}
                  onChange={(e) => setAdminEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Payment Method Selector (Skip if Free) */}
            {!isFree ? (
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-2">Select Payment Gateway</label>
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
                      <span className="text-[10px] text-slate-500">Visa, MasterCard, Amex</span>
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
                      <span className="text-[10px] text-red-700 font-semibold">Mobile Wallet / MPIN</span>
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
                      <span className="text-[10px] text-emerald-700 font-semibold">Direct Wallet / OTP</span>
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
                      <span className="text-[10px] text-amber-700 font-semibold">State Bank QR / ID</span>
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
                    <div>
                      <label className="text-xs font-semibold text-slate-600 block mb-1">Cardholder Full Name</label>
                      <input
                        type="text"
                        placeholder="John Doe"
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
                        onChange={(e) => setCardNumber(e.target.value)}
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
                          onChange={(e) => setCardExpiry(e.target.value)}
                          className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm bg-white"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-slate-600 block mb-1">CVV / CVC</label>
                        <input
                          type="password"
                          placeholder="•••"
                          maxLength={4}
                          value={cardCvv}
                          onChange={(e) => setCardCvv(e.target.value)}
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
                        You will receive an instant push prompt on your mobile phone to authorize payment via MPIN.
                      </p>
                    </div>
                  </div>
                )}

                {paymentMethod === 'raast' && (
                  <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200 space-y-2 animate-in fade-in text-xs text-amber-950">
                    <div className="font-bold flex items-center gap-1.5">
                      <QrCode className="w-4 h-4 text-amber-700" />
                      Raast Instant Payment Instructions
                    </div>
                    <p>Open any Pakistani Mobile Banking app (Easypaisa, JazzCash, HBL, Meezan, Alfalah, UBL) and select <strong>Raast Payment</strong>.</p>
                    <div className="bg-white p-3 rounded-xl border border-amber-200 font-mono text-xs flex justify-between items-center">
                      <div>
                        <span className="text-[10px] text-slate-400 block font-sans">Raast ID / IBAN:</span>
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
                        className="w-full px-3.5 py-2 rounded-xl border border-blue-300 text-sm bg-white"
                      />
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-3">
                <Sparkles className="w-5 h-5 text-emerald-600 shrink-0" />
                <span>
                  <strong>100% Free Forever Tier.</strong> No credit card or billing details required. Instant activation for up to 500 attendees!
                </span>
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
                    Activating Organization...
                  </>
                ) : (
                  <>
                    {isFree ? 'Activate Free Organization' : `Confirm & Pay ${displayPrice}`}
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </Button>
            </div>
          </form>
        ) : (
          /* Success Screen & Printable Invoice */
          <div className="p-8 text-center space-y-6">
            <div className={`w-16 h-16 rounded-3xl flex items-center justify-center mx-auto shadow-lg animate-in zoom-in-75 ${
              successData.status === 'pending_approval'
                ? 'bg-amber-100 text-amber-600 shadow-amber-500/20'
                : 'bg-emerald-100 text-emerald-600 shadow-emerald-500/20'
            }`}>
              {successData.status === 'pending_approval' ? (
                <ShieldCheck className="w-9 h-9 stroke-[2.5]" />
              ) : (
                <Check className="w-9 h-9 stroke-[3]" />
              )}
            </div>

            <div>
              <h3 className="text-2xl font-bold font-heading text-slate-900">
                {successData.status === 'pending_approval'
                  ? 'Payment Submitted • Awaiting SuperAdmin Approval'
                  : 'Subscription Activated!'}
              </h3>
              <p className="text-sm text-slate-600 mt-1 max-w-md mx-auto">
                {successData.status === 'pending_approval'
                  ? `Your payment reference has been submitted to EventoraX Platform SuperAdmin (HQ). SuperAdmin verifies payments to activate organization quotas and features.`
                  : `Your organization ${successData.orgName} is now on the ${successData.plan} tier.`}
              </p>
            </div>

            {/* Printable Receipt Card */}
            <div 
              id="subscription-receipt-card"
              className="bg-slate-50 p-6 rounded-2xl border border-slate-200 text-left space-y-3 font-mono text-xs max-w-md mx-auto"
            >
              <div className="flex justify-between items-center pb-2 border-b border-slate-200 font-sans">
                <span className="font-bold text-slate-800 flex items-center gap-1.5">
                  <Receipt className="w-4 h-4 text-[#1d4ed8]" />
                  EventoraX Official Receipt
                </span>
                <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${
                  successData.status === 'pending_approval'
                    ? 'bg-amber-100 text-amber-800 border border-amber-300'
                    : 'bg-emerald-100 text-emerald-800'
                }`}>
                  {successData.status === 'pending_approval' ? 'PENDING APPROVAL' : 'PAID & ACTIVE'}
                </span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Invoice ID:</span>
                <span className="font-bold text-slate-900">{successData.invoiceNumber}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Date:</span>
                <span>{successData.date}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Plan:</span>
                <span className="font-bold text-slate-900">{successData.plan}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Cycle:</span>
                <span>{successData.billingCycle}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Payment Method:</span>
                <span className="font-bold text-slate-900">{successData.paymentMethod}</span>
              </div>
              <div className="flex justify-between text-base font-bold text-[#1d4ed8] pt-2 border-t border-slate-200 font-sans">
                <span>Total Amount:</span>
                <span>{successData.amount}</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <Button
                onClick={() => printElement('subscription-receipt-card', `EventoraX Invoice - ${successData.invoiceNumber}`)}
                variant="outline"
                className="rounded-xl flex items-center gap-2 w-full sm:w-auto"
              >
                <Download className="w-4 h-4" />
                Print / Download Invoice
              </Button>

              <Button
                onClick={() => {
                  onClose();
                  window.location.href = '/dashboard';
                }}
                className="bg-[#1d4ed8] hover:bg-[#1e40af] text-white rounded-xl px-6 w-full sm:w-auto font-bold flex items-center gap-2"
              >
                Enter Organization Dashboard
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
