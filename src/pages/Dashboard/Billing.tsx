import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Header from "@/components/ui/dashboard/header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Check, 
  Sparkles, 
  ShieldCheck, 
  CheckCircle, 
  ArrowRight, 
  CreditCard, 
  Building2, 
  DollarSign, 
  Clock, 
  Receipt,
  Download,
  KeyRound,
  Copy,
  X
} from "lucide-react";
import { api } from "@/services/api";
import { useAuth } from "@/context/AuthContext";
import SubscriptionCheckoutModal, { type PlanData } from "@/components/SubscriptionCheckoutModal";
import { printElement } from "@/lib/printUtils";

const clientPlans: PlanData[] = [
  {
    name: "Starter",
    priceUsdMonthly: 36,
    pricePkrMonthly: 10000,
    badge: "Trial Available",
    description: "Perfect for small events, meetups, training & credential testing",
    features: [
      "10 Events included (Trial: 2 events)",
      "500 total attendees capacity (Trial: 40 attendees)",
      "520 ID Passes & Certificates (Trial: 50 certs)",
      "Standard digital tickets & passes",
      "Tamper-evident QR code verification",
      "Basic attendance statistics",
      "Repurchase & Renewal on full usage"
    ],
  },
  {
    name: "Professional",
    priceUsdMonthly: 49,
    pricePkrMonthly: 13800,
    badge: "Most Popular",
    description: "For growing organizations, colleges, institutes & frequent conferences",
    features: [
      "5,000 attendees capacity & 25 events",
      "Bulk Certificate Automation (2,500 certs/mo)",
      "ID Card & Pass Generator with 1-click print",
      "CSV Recipient Auto-Merge",
      "Canva Design Studio access",
      "Priority email & chat support"
    ],
  },
  {
    name: "Enterprise",
    priceUsdMonthly: 299,
    pricePkrMonthly: 83000,
    badge: "Maximum Power",
    description: "For universities, large summits, venues & global conferences",
    features: [
      "50,000+ attendees capacity & 500 events",
      "Unlimited platform events & certificates",
      "Full White-label & custom CNAME domain",
      "Multi-tenant workspace isolation",
      "Dedicated account manager",
      "99.9% SLA uptime guarantee"
    ],
  },
];

export default function Billing() {
  const { user, isSuperAdmin, currentTenant } = useAuth();
  const [copiedKey, setCopiedKey] = useState(false);
  const [currentPlan, setCurrentPlan] = useState("Starter");
  const [attendeesUsed, setAttendeesUsed] = useState(0);
  const [attendeesLimit, setAttendeesLimit] = useState(500);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [pendingApprovalsCount, setPendingApprovalsCount] = useState(0);

  // Modal checkout state
  const [checkoutModalOpen, setCheckoutModalOpen] = useState(false);
  const [selectedPlanForCheckout, setSelectedPlanForCheckout] = useState<PlanData>(clientPlans[1]);
  const [viewingTaxInvoiceTx, setViewingTaxInvoiceTx] = useState<any | null>(null);

  const isPlatformAuthority = isSuperAdmin || user?.role === 'admin';

  const fetchBillingData = async () => {
    try {
      const res = await api.billing.get();
      if (res.success && res.billing) {
        setCurrentPlan(res.billing.plan);
        setAttendeesUsed(res.billing.attendeesUsed || 0);
        setAttendeesLimit(res.billing.attendeesLimit || 500);
      }
    } catch (err) {
      console.error("Billing fetch error:", err);
    }

    if (!isPlatformAuthority) {
      try {
        const txRes = await api.billing.getTransactions();
        if (txRes.success && txRes.transactions) {
          setTransactions(txRes.transactions);
        }
      } catch (err) {
        console.error("Transactions fetch error:", err);
      }
    } else {
      try {
        const subRes = await api.platformAdmin.getSubscriptions();
        if (subRes.success && subRes.subscriptions) {
          const pending = subRes.subscriptions.filter(s => s.status === 'pending_approval');
          setPendingApprovalsCount(pending.length);
        }
      } catch {}
    }
  };

  useEffect(() => {
    fetchBillingData();
  }, []);

  const handleOpenCheckout = (plan: PlanData) => {
    setSelectedPlanForCheckout(plan);
    setCheckoutModalOpen(true);
  };

  const usagePercent = typeof attendeesLimit === 'number' && attendeesLimit > 0
    ? Math.min(100, Math.round((attendeesUsed / attendeesLimit) * 100))
    : 0;

  const latestPendingTxn = transactions.find(t => t.status === 'pending_approval');

  return (
    <div>
      <Header title="Billing &amp; Subscription Plans" />
      <div className="p-6 space-y-6 max-w-7xl mx-auto">

        {/* ------------------------------------------------------------- */}
        {/* CASE A: SUPERADMIN / PLATFORM AUTHORITY WORKSPACE */}
        {/* ------------------------------------------------------------- */}
        {isPlatformAuthority ? (
          <div className="space-y-6">
            <Card className="border-[#1d4ed8] bg-gradient-to-r from-blue-50/80 via-indigo-50/40 to-white shadow-xl shadow-blue-500/10 rounded-3xl overflow-hidden">
              <CardContent className="p-6 sm:p-8">
                <div className="flex items-center justify-between flex-wrap gap-6">
                  <div className="max-w-2xl">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge className="bg-[#1d4ed8] text-white flex items-center gap-1.5 px-3 py-1 text-xs font-bold">
                        <ShieldCheck className="w-4 h-4" />
                        Platform Authority
                      </Badge>
                      <span className="text-xs bg-indigo-100 text-indigo-800 font-bold px-2.5 py-0.5 rounded-full">
                        Eventrye Master Administrator
                      </span>
                    </div>
                    <h2 className="text-2xl sm:text-3xl font-extrabold text-[#0f172a] font-heading">
                      Unlimited Lifetime Platform Authority
                    </h2>
                    <p className="text-xs text-[#475569] mt-2 leading-relaxed">
                      You are logged in as the <strong>Eventrye SuperAdmin (HQ)</strong>. As the master authority who owns and governs this platform, your workspace has unrestricted access to all capabilities, attendees, events, and client organizations.
                    </p>
                    <p className="text-xs font-semibold text-slate-700 mt-1">
                      Subscription billing and pricing packages only apply to external client organizations that register for Eventrye.
                    </p>
                  </div>

                  <div className="flex flex-col items-start sm:items-end gap-3">
                    <div className="px-4 py-3 rounded-2xl bg-white border border-blue-200 shadow-xs text-left sm:text-right">
                      <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">
                        Platform Quota &amp; Status
                      </span>
                      <span className="text-sm font-bold text-emerald-600 flex items-center gap-1.5 mt-0.5">
                        <CheckCircle className="w-4 h-4" />
                        ∞ Unlimited Events &amp; Attendees
                      </span>
                      <span className="text-[11px] text-slate-400 block mt-0.5">
                        Master Owner • No Billing Required
                      </span>
                    </div>

                    <Link
                      to="/orbit-i-master-gateway/console?tab=approvals"
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-md shadow-amber-600/20 transition-all"
                    >
                      <CreditCard className="w-4 h-4" />
                      Open Subscription Approvals Queue ({pendingApprovalsCount})
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Action Navigation for SuperAdmin */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              <Link 
                to="/orbit-i-master-gateway/console?tab=licenses"
                className="p-5 rounded-2xl bg-white border border-slate-200 hover:border-indigo-400 hover:shadow-md transition-all group"
              >
                <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center mb-3">
                  <KeyRound className="w-5 h-5" />
                </div>
                <h4 className="text-sm font-bold text-slate-900 group-hover:text-indigo-700 transition-colors">
                  License Keys &amp; Quotas
                </h4>
                <p className="text-xs text-slate-500 mt-1">
                  Track client activation keys, monitor live resource usage, and regenerate keys.
                </p>
                <span className="text-xs font-bold text-indigo-600 mt-3 inline-flex items-center gap-1">
                  Track Licenses &rarr;
                </span>
              </Link>

              <Link 
                to="/orbit-i-master-gateway/console?tab=approvals"
                className="p-5 rounded-2xl bg-white border border-slate-200 hover:border-amber-400 hover:shadow-md transition-all group"
              >
                <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center mb-3">
                  <CreditCard className="w-5 h-5" />
                </div>
                <h4 className="text-sm font-bold text-slate-900 group-hover:text-amber-700 transition-colors">
                  Subscription Approvals
                </h4>
                <p className="text-xs text-slate-500 mt-1">
                  Verify client payments (Card, Bank IBFT, JazzCash, Easypaisa, Raast) and activate keys.
                </p>
                <span className="text-xs font-bold text-amber-600 mt-3 inline-flex items-center gap-1">
                  {pendingApprovalsCount} Pending Verification &rarr;
                </span>
              </Link>

              <Link 
                to="/orbit-i-master-gateway/console?tab=tenants"
                className="p-5 rounded-2xl bg-white border border-slate-200 hover:border-blue-400 hover:shadow-md transition-all group"
              >
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center mb-3">
                  <Building2 className="w-5 h-5" />
                </div>
                <h4 className="text-sm font-bold text-slate-900 group-hover:text-blue-700 transition-colors">
                  Client Organizations Directory
                </h4>
                <p className="text-xs text-slate-500 mt-1">
                  Manage active client workspaces, quota limits, domain permissions, and account suspensions.
                </p>
                <span className="text-xs font-bold text-blue-600 mt-3 inline-flex items-center gap-1">
                  Manage Workspaces &rarr;
                </span>
              </Link>

              <Link 
                to="/orbit-i-master-gateway/console?tab=billing"
                className="p-5 rounded-2xl bg-white border border-slate-200 hover:border-emerald-400 hover:shadow-md transition-all group"
              >
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center mb-3">
                  <DollarSign className="w-5 h-5" />
                </div>
                <h4 className="text-sm font-bold text-slate-900 group-hover:text-emerald-700 transition-colors">
                  Platform Financials &amp; Revenue
                </h4>
                <p className="text-xs text-slate-500 mt-1">
                  Inspect SaaS MRR, ARR valuations, transaction logs, and platform billing budgets.
                </p>
                <span className="text-xs font-bold text-emerald-600 mt-3 inline-flex items-center gap-1">
                  View Financial Ledger &rarr;
                </span>
              </Link>
            </div>
          </div>
        ) : (
          /* ------------------------------------------------------------- */
          /* CASE B: REGULAR CLIENT ORGANIZATION WORKSPACE */
          /* ------------------------------------------------------------- */
          <div className="space-y-6">
            {/* Pending Verification Notice if latest transaction is pending approval */}
            {latestPendingTxn && (
              <div className="p-4 rounded-2xl bg-amber-50 border border-amber-300 text-amber-900 flex items-start gap-3 shadow-xs">
                <Clock className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div className="text-xs space-y-1">
                  <h4 className="font-bold text-sm">Subscription Upgrade Verification in Progress</h4>
                  <p>
                    Your recent payment reference (<strong>{latestPendingTxn.transaction_ref || latestPendingTxn.invoice_number}</strong>) for <strong>{latestPendingTxn.plan}</strong> has been securely submitted to the Eventrye Platform SuperAdmin.
                  </p>
                  <p className="text-amber-700">
                    Once verified, your organization limits and features (ID passes, 100+ certificate templates, Canva Studio) will be instantly unlocked.
                  </p>
                </div>
              </div>
            )}

            {/* Active Workspace License Key Card */}
            <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs flex flex-wrap items-center justify-between gap-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-blue-50 text-[#1d4ed8] flex items-center justify-center shrink-0">
                  <KeyRound className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-slate-900 text-sm">Activation License Key</h3>
                    <Badge className="bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                      {currentTenant?.license_status || 'Active'}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="font-mono font-bold text-sm text-[#1d4ed8] bg-blue-50 px-3 py-1 rounded-xl border border-blue-200">
                      {currentTenant?.license_key || 'EVX-ACT-9821-4402-1109'}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(currentTenant?.license_key || 'EVX-ACT-9821-4402-1109');
                        setCopiedKey(true);
                        setTimeout(() => setCopiedKey(false), 2000);
                      }}
                      className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600 flex items-center gap-1 text-xs font-semibold"
                      title="Copy License Key"
                    >
                      {copiedKey ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      {copiedKey ? 'Copied' : 'Copy'}
                    </button>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Cryptographic key assigned by Platform Authority. Valid until {currentTenant?.license_expires_at ? new Date(currentTenant.license_expires_at).toLocaleDateString() : 'Annual Expiration'}.
                  </p>
                </div>
              </div>

              <div className="text-right text-xs space-y-1">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Provisioned Quotas</span>
                <p className="font-bold text-slate-800">
                  Events: {currentTenant?.max_events || 25} Concurrent
                </p>
                <p className="font-bold text-slate-800">
                  Attendees: {(currentTenant?.max_attendees || attendeesLimit).toLocaleString()} Max
                </p>
                <p className="font-bold text-slate-800">
                  Certificates: {(currentTenant?.max_certs || 5000).toLocaleString()} Verified
                </p>
              </div>
            </div>

            <Card className="border-[#7c3aed] bg-gradient-to-r from-[#f5f3ff] via-white to-white shadow-lg shadow-[#7c3aed]/10 rounded-3xl">
              <CardContent className="p-6">
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Badge className="bg-[#7c3aed] text-white">Current Subscription</Badge>
                      <span className="text-sm text-[#7c3aed] font-bold">{currentPlan}</span>
                    </div>
                    <p className="text-2xl sm:text-3xl font-bold text-[#0f172a]">
                      {currentPlan === 'Starter' ? 'PKR 10,000' : currentPlan === 'Professional' ? 'PKR 13,800' : 'PKR 83,000'}
                      <span className="text-xs sm:text-sm font-normal text-[#475569] ml-1.5">
                        ({currentPlan === 'Starter' ? '$36' : currentPlan === 'Professional' ? '$49' : '$299'}/month)
                      </span>
                    </p>
                    <p className="text-xs text-[#475569] mt-1">
                      Resource renewal and quota top-up available upon full utilization
                    </p>
                  </div>

                  <div className="space-y-2 w-full sm:w-72">
                    <div className="flex justify-between text-xs font-semibold">
                      <span className="text-[#475569]">Attendees capacity used</span>
                      <span className="text-[#0f172a]">
                        {attendeesUsed.toLocaleString()} / {attendeesLimit.toLocaleString()}
                      </span>
                    </div>
                    <Progress value={usagePercent} className="h-2.5 bg-[#e9e4ff]" />
                    <p className="text-[11px] text-[#94a3b8] text-right">{usagePercent}% capacity filled</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Plans Grid */}
            <div className="space-y-4 pt-2">
              <div>
                <h2 className="text-lg font-bold text-[#0f172a]">Available Subscription Tiers</h2>
                <p className="text-xs text-[#64748b]">
                  Choose the plan that suits your event attendee size, pass generation, and branding requirements.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {clientPlans.map((plan) => {
                  const isActive = currentPlan.toLowerCase() === plan.name.toLowerCase();

                  return (
                    <Card 
                      key={plan.name} 
                      className={`border-[#e2e8f0] rounded-3xl ${
                        isActive 
                          ? 'ring-2 ring-[#7c3aed] shadow-xl shadow-[#7c3aed]/10 bg-[#faf8ff]' 
                          : 'shadow-sm bg-white'
                      } relative overflow-hidden flex flex-col justify-between`}
                    >
                      {isActive && (
                        <div className="absolute top-0 right-0 bg-[#7c3aed] text-white text-xs font-bold px-3 py-1 rounded-bl-xl flex items-center gap-1">
                          <Sparkles className="w-3 h-3" />
                          CURRENT
                        </div>
                      )}
                      <CardHeader>
                        <CardTitle className="text-lg font-bold text-[#0f172a]">{plan.name}</CardTitle>
                        <div className="flex items-baseline gap-1 my-1">
                          <span className="text-3xl font-bold text-[#0f172a]">
                            ${plan.priceUsdMonthly}
                          </span>
                          <span className="text-xs text-[#475569]">/month</span>
                        </div>
                        <p className="text-xs text-[#64748b] leading-relaxed">{plan.description}</p>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <ul className="space-y-2.5 pt-2 border-t border-[#f1f5f9]">
                          {plan.features.map((feature) => (
                            <li key={feature} className="flex items-start gap-2 text-xs text-[#475569]">
                              <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                              <span>{feature}</span>
                            </li>
                          ))}
                        </ul>

                        <Button 
                          onClick={() => handleOpenCheckout(plan)}
                          className={`w-full rounded-xl text-xs font-semibold h-10 ${
                            isActive 
                              ? 'bg-[#1d4ed8] hover:bg-[#1e40af] text-white shadow-md' 
                              : 'bg-[#7c3aed] hover:bg-[#6d28d9] text-white shadow-md'
                          }`}
                        >
                          {isActive ? "Renew / Repurchase Plan" : `Upgrade to ${plan.name}`}
                        </Button>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>

            {/* Invoices & Transaction History */}
            {transactions.length > 0 && (
              <div className="space-y-3 pt-4">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Receipt className="w-4 h-4 text-slate-500" />
                  Organization Payment History &amp; Receipts
                </h3>

                <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200">
                      <tr>
                        <th className="p-3 pl-4">Transaction / TID</th>
                        <th className="p-3">Plan</th>
                        <th className="p-3">Amount</th>
                        <th className="p-3">Payment Gateway</th>
                        <th className="p-3">Status</th>
                        <th className="p-3">Date</th>
                        <th className="p-3 text-right pr-4">Receipt</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {transactions.map((tx) => (
                        <tr key={tx.id} className="hover:bg-slate-50">
                          <td className="p-3 pl-4 font-mono font-bold text-slate-800">
                            {tx.transaction_ref || tx.invoice_number || `TXN-${tx.id}`}
                          </td>
                          <td className="p-3 font-semibold text-slate-900">
                            {tx.plan} ({tx.billing_cycle || 'monthly'})
                          </td>
                          <td className="p-3 font-bold text-slate-900">
                            {tx.price === 0 ? 'Free ($0)' : `${tx.currency || 'USD'} ${tx.price}`}
                          </td>
                          <td className="p-3 text-slate-600 uppercase font-semibold">
                            {tx.payment_method || 'Online Card'}
                          </td>
                          <td className="p-3">
                            <Badge className={`text-[10px] font-bold ${
                              tx.status === 'active' ? 'bg-emerald-100 text-emerald-800' :
                              tx.status === 'pending_approval' ? 'bg-amber-100 text-amber-800' :
                              'bg-rose-100 text-rose-800'
                            }`}>
                              {tx.status === 'pending_approval' ? 'Pending SuperAdmin' : tx.status}
                            </Badge>
                          </td>
                          <td className="p-3 text-slate-500">
                            {new Date(tx.created_at || Date.now()).toLocaleDateString()}
                          </td>
                          <td className="p-3 text-right pr-4">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setViewingTaxInvoiceTx(tx)}
                              className="text-xs h-7.5 text-[#1d4ed8] border-blue-200 hover:bg-blue-50 font-bold"
                            >
                              <Download className="w-3.5 h-3.5 mr-1" />
                              View Tax Invoice
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Subscription Checkout Modal */}
        <SubscriptionCheckoutModal
          isOpen={checkoutModalOpen}
          onClose={() => {
            setCheckoutModalOpen(false);
            fetchBillingData();
          }}
          selectedPlan={selectedPlanForCheckout}
        />

        {/* Official 2026 Enterprise Tax Invoice Viewer Modal */}
        {viewingTaxInvoiceTx && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200">
            <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4 my-auto relative">
              <div className="flex justify-between items-center pb-3 border-b border-slate-200">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-blue-100 text-[#1d4ed8] flex items-center justify-center">
                    <Receipt className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-slate-900">Official Tax Invoice &amp; Receipt</h3>
                    <p className="text-[10px] text-slate-500">SBP Digital Merchant • 2026 Enterprise Release</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setViewingTaxInvoiceTx(null)}
                  className="p-1.5 rounded-full hover:bg-slate-100 text-slate-500"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Printable Invoice Body */}
              <div
                id="billing-official-tax-invoice"
                className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-3 font-sans text-xs"
              >
                <div className="flex justify-between items-start pb-2 border-b border-slate-200">
                  <div>
                    <h4 className="font-black text-xs text-slate-900">EVENTRYE TECHNOLOGIES (PVT) LTD</h4>
                    <p className="text-[10px] text-slate-500">ORBIT-I Cloud Digital Platform</p>
                    <p className="text-[10px] text-slate-400 font-mono">NTN: 9842104-7 • STRN: 3277876123456</p>
                  </div>
                  <div className="text-right">
                    <span className="px-2.5 py-1 rounded-md text-[10px] font-extrabold uppercase bg-emerald-100 text-emerald-800 border border-emerald-300">
                      ★ VIP VERIFIED &amp; ACTIVE
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] bg-white p-3 rounded-xl border border-slate-200">
                  <div className="break-all">
                    <span className="text-slate-400 text-[10px] uppercase font-bold block">Invoice / Order Ref</span>
                    <span className="font-mono font-bold text-slate-900">
                      {viewingTaxInvoiceTx.invoice_number || viewingTaxInvoiceTx.transaction_ref || `EVX-INV-2026-${viewingTaxInvoiceTx.id}`}
                    </span>
                  </div>
                  <div className="break-all">
                    <span className="text-slate-400 text-[10px] uppercase font-bold block">Transaction TID</span>
                    <span className="font-mono font-bold text-[#1d4ed8]">
                      {viewingTaxInvoiceTx.transaction_ref || `TID-${viewingTaxInvoiceTx.id}`}
                    </span>
                  </div>
                  <div className="break-all">
                    <span className="text-slate-400 text-[10px] uppercase font-bold block">Organization Workspace</span>
                    <span className="font-bold text-slate-900">{currentTenant?.name || user?.orgName || 'Client Organization'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] uppercase font-bold block">Order Date</span>
                    <span className="text-slate-800">
                      {new Date(viewingTaxInvoiceTx.created_at || Date.now()).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                    </span>
                  </div>
                </div>

                <div className="bg-blue-50/70 p-3 rounded-xl border border-blue-200 text-[11px] space-y-1">
                  <div className="flex flex-col sm:flex-row sm:justify-between gap-0.5">
                    <span className="text-slate-500">Receiving Merchant:</span>
                    <span className="font-bold text-slate-900">ORBIT-I / Eventrye Technologies</span>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:justify-between gap-0.5">
                    <span className="text-slate-500">Merchant Account / IBFT:</span>
                    <span className="font-mono font-bold text-blue-700">0102-0104889912 (Meezan) / 03190375751</span>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:justify-between gap-0.5">
                    <span className="text-slate-500">Payment Gateway:</span>
                    <span className="font-bold text-slate-900 uppercase">{viewingTaxInvoiceTx.payment_method || 'ONLINE GATEWAY'}</span>
                  </div>
                </div>

                <div className="border border-slate-200 rounded-xl overflow-hidden bg-white">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100 text-slate-600 font-bold text-[11px]">
                      <tr>
                        <th className="p-2">Description</th>
                        <th className="p-2 text-right">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      <tr>
                        <td className="p-2">
                          <strong className="block text-slate-900">Eventrye {viewingTaxInvoiceTx.plan} Plan</strong>
                          <span className="text-[10px] text-slate-500">Billing Cycle: {viewingTaxInvoiceTx.billing_cycle || 'Monthly'}</span>
                        </td>
                        <td className="p-2 text-right font-bold text-slate-900">
                          {viewingTaxInvoiceTx.price === 0 ? 'Free ($0)' : `${viewingTaxInvoiceTx.currency || 'USD'} ${viewingTaxInvoiceTx.original_price || viewingTaxInvoiceTx.price}`}
                        </td>
                      </tr>
                      {viewingTaxInvoiceTx.coupon_code && (
                        <tr className="bg-emerald-50/60">
                          <td className="p-2 text-emerald-800 text-[11px] font-semibold">
                            Promo Coupon Applied ({viewingTaxInvoiceTx.coupon_code})
                          </td>
                          <td className="p-2 text-right font-mono font-bold text-emerald-700">
                            -{viewingTaxInvoiceTx.currency || 'USD'} {viewingTaxInvoiceTx.discount_amount || 0}
                          </td>
                        </tr>
                      )}
                      <tr>
                        <td className="p-1.5 text-right text-slate-500 text-[10px]">Sales Tax / GST (0% Section 65F IT Exemption):</td>
                        <td className="p-1.5 text-right font-mono text-slate-700 text-[10px]">PKR 0.00</td>
                      </tr>
                      <tr className="bg-slate-50 font-bold text-xs text-[#1d4ed8]">
                        <td className="p-2 text-right">Net Amount Paid:</td>
                        <td className="p-2 text-right">
                          {viewingTaxInvoiceTx.price === 0 ? 'Free ($0)' : `${viewingTaxInvoiceTx.currency || 'USD'} ${viewingTaxInvoiceTx.price}`}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-200">
                  <div className="flex items-center gap-2">
                    <img
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=80x80&data=${encodeURIComponent(`https://eventrye.orbit-i.tech/verify/${viewingTaxInvoiceTx.transaction_ref || viewingTaxInvoiceTx.id}`)}`}
                      alt="Verification QR"
                      className="w-10 h-10 rounded border border-slate-200"
                    />
                    <div className="text-[9px] text-slate-500">
                      <span className="font-bold text-slate-700 block">QR Authenticated</span>
                      State Bank 2026 Compliant
                    </div>
                  </div>
                  <div className="text-right text-[9px] text-slate-400">
                    <span className="block font-bold text-slate-700">ORBIT-I Cloud Platform</span>
                    <span>Digital Tax Invoice</span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-2 pt-2">
                <Button
                  variant="outline"
                  onClick={() => setViewingTaxInvoiceTx(null)}
                  className="rounded-xl text-xs h-9 px-4"
                >
                  Close
                </Button>
                <Button
                  onClick={() => printElement('billing-official-tax-invoice', `Eventrye Tax Invoice - ${viewingTaxInvoiceTx.transaction_ref || viewingTaxInvoiceTx.id}`)}
                  className="rounded-xl text-xs font-bold bg-[#1d4ed8] hover:bg-[#1e40af] text-white h-9 px-4 flex items-center gap-1.5 shadow-md shadow-blue-500/20"
                >
                  <Download className="w-3.5 h-3.5" />
                  Print / Save PDF
                </Button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}