import { useState, useEffect } from 'react';
import Header from "@/components/ui/dashboard/header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Check, Sparkles, ShieldCheck, CheckCircle, ArrowRight } from "lucide-react";
import { api } from "@/services/api";
import { useAuth } from "@/context/AuthContext";

const clientPlans = [
  {
    name: "Starter",
    price: "$0",
    period: "/month",
    description: "Perfect for free community, clubs and small seminars",
    features: ["Up to 500 attendees", "Basic event analytics", "Community support", "1 admin organizer", "Standard digital tickets"],
  },
  {
    name: "Professional",
    price: "$99",
    period: "/month",
    description: "For growing organizations, colleges & frequent events",
    features: ["5,000 attendees", "Advanced live check-in analytics", "Priority email & chat support", "5 team members", "Custom branded tickets & badges"],
  },
  {
    name: "Enterprise",
    price: "$299",
    period: "/month",
    description: "For universities, large summits, venues & global conferences",
    features: ["50,000+ attendees", "Dedicated account manager", "SSO & 2FA security enforcement", "Full White-label & custom CNAME domain", "99.9% SLA uptime guarantee"],
  },
];

export default function Billing() {
  const { user, currentTenant, isSuperAdmin } = useAuth();
  const [currentPlan, setCurrentPlan] = useState("Starter");
  const [attendeesUsed, setAttendeesUsed] = useState(0);
  const [attendeesLimit, setAttendeesLimit] = useState(500);
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const isPlatformAuthority = isSuperAdmin || user?.role === 'admin' || currentTenant?.id === 1 || currentTenant?.slug === 'eventorax-hq';

  useEffect(() => {
    const fetchBilling = async () => {
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
    };

    fetchBilling();
  }, []);

  const handleUpgrade = async (planName: string) => {
    if (isPlatformAuthority) return;
    setLoading(true);
    setSuccessMessage(null);
    try {
      const res = await api.billing.upgrade(planName);
      if (res.success) {
        setCurrentPlan(res.plan);
        setAttendeesLimit(res.attendeesLimit);
        setSuccessMessage(`Plan successfully updated to ${planName}!`);
        setTimeout(() => setSuccessMessage(null), 4000);
      }
    } catch (err: any) {
      alert(err.message || "Failed to upgrade plan.");
    } finally {
      setLoading(false);
    }
  };

  const usagePercent = typeof attendeesLimit === 'number' && attendeesLimit > 0
    ? Math.min(100, Math.round((attendeesUsed / attendeesLimit) * 100))
    : 0;

  return (
    <div>
      <Header title="Billing & Plans" />
      <div className="p-6 space-y-6">

        {successMessage && (
          <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-600" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* CASE A: SUPERADMIN / PLATFORM AUTHORITY WORKSPACE */}
        {/* ------------------------------------------------------------- */}
        {isPlatformAuthority ? (
          <Card className="border-[#1d4ed8] bg-gradient-to-r from-blue-50/80 via-indigo-50/40 to-white shadow-xl shadow-blue-500/10">
            <CardContent className="p-6">
              <div className="flex items-center justify-between flex-wrap gap-6">
                <div className="max-w-2xl">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge className="bg-[#1d4ed8] text-white flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold">
                      <ShieldCheck className="w-4 h-4" />
                      Platform Authority
                    </Badge>
                    <span className="text-xs bg-indigo-100 text-indigo-800 font-bold px-2.5 py-0.5 rounded-full">
                      Master Administrator
                    </span>
                  </div>
                  <p className="text-2xl sm:text-3xl font-extrabold text-[#0f172a]">
                    Unlimited Lifetime Platform Authority
                  </p>
                  <p className="text-xs text-[#475569] mt-2 leading-relaxed">
                    You are logged in as the <strong>EventoraX SuperAdmin</strong>. As the master authority who owns and governs this platform, your workspace has unrestricted, unlimited access to all platform capabilities, attendees, events, and client organizations. 
                    <span className="block mt-1 font-semibold text-slate-700">
                      Subscription billing and pricing plans only apply to external client organizations that register for EventoraX.
                    </span>
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
                      Lifetime Owner • No Billing Required
                    </span>
                  </div>

                  <a
                    href="/platform-admin"
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#1d4ed8] hover:bg-[#1e40af] text-white text-xs font-bold shadow-md shadow-blue-600/20 transition-all"
                  >
                    Manage Client Organizations in SuperAdmin Console
                    <ArrowRight className="w-4 h-4" />
                  </a>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          /* ------------------------------------------------------------- */
          /* CASE B: REGULAR CLIENT ORGANIZATION WORKSPACE */
          /* ------------------------------------------------------------- */
          <Card className="border-[#7c3aed] bg-gradient-to-r from-[#f5f3ff] via-white to-white shadow-lg shadow-[#7c3aed]/10">
            <CardContent className="p-6">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Badge className="bg-[#7c3aed] text-white">Active Subscription</Badge>
                    <span className="text-sm text-[#7c3aed] font-bold">{currentPlan}</span>
                  </div>
                  <p className="text-3xl font-bold text-[#0f172a]">
                    {currentPlan === 'Starter' ? '$0' : currentPlan === 'Professional' ? '$99' : '$299'}
                    <span className="text-sm font-normal text-[#475569]">/month</span>
                  </p>
                  <p className="text-xs text-[#475569] mt-1">
                    Monthly billing cycle • Upgrade or cancel anytime
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
        )}

        {/* ------------------------------------------------------------- */}
        {/* PLANS GRID */}
        {/* ------------------------------------------------------------- */}
        <div className="space-y-4 pt-2">
          <div>
            <h2 className="text-base font-bold text-[#0f172a]">
              {isPlatformAuthority ? "Client Subscription Offerings (Market Plans)" : "Available Subscription Tiers"}
            </h2>
            <p className="text-xs text-[#64748b]">
              {isPlatformAuthority 
                ? "These are the pricing plans offered to client organizations that subscribe to EventoraX."
                : "Choose the best plan for your organization's event attendee size and branding requirements."}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {clientPlans.map((plan) => {
              const isActive = !isPlatformAuthority && currentPlan.toLowerCase() === plan.name.toLowerCase();

              return (
                <Card 
                  key={plan.name} 
                  className={`border-[#e2e8f0] ${
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
                      <span className="text-3xl font-bold text-[#0f172a]">{plan.price}</span>
                      <span className="text-xs text-[#475569]">{plan.period}</span>
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

                    {isPlatformAuthority ? (
                      <div className="w-full py-2.5 px-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-500 text-xs font-semibold text-center">
                        Client Subscription Tier ({plan.price}/mo)
                      </div>
                    ) : (
                      <Button 
                        onClick={() => handleUpgrade(plan.name)}
                        disabled={isActive || loading}
                        className={`w-full rounded-xl text-xs font-semibold h-10 ${
                          isActive 
                            ? 'bg-[#f5f3ff] text-[#7c3aed] border border-[#ddd6fe] cursor-default' 
                            : 'bg-[#7c3aed] hover:bg-[#6d28d9] text-white shadow-md'
                        }`}
                      >
                        {isActive ? "Active Subscription" : `Switch to ${plan.name}`}
                      </Button>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
}