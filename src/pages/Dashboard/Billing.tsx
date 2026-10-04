import { useState, useEffect } from 'react';
import Header from "@/components/ui/dashboard/header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Check, Sparkles } from "lucide-react";
import { api } from "@/services/api";

const plans = [
  {
    name: "Starter",
    price: "$0",
    period: "/month",
    description: "Perfect for free community and small events",
    features: ["Up to 500 attendees", "Basic event analytics", "Community support", "1 admin organizer"],
  },
  {
    name: "Professional",
    price: "$99",
    period: "/month",
    description: "For growing organizations & frequent events",
    features: ["5,000 attendees", "Advanced live analytics", "Priority email & chat support", "5 team members", "Custom branded tickets"],
  },
  {
    name: "Enterprise",
    price: "$299",
    period: "/month",
    description: "For universities, large summits & venues",
    features: ["50,000+ attendees", "Dedicated account manager", "SSO & 2FA enforcement", "White-label & custom domain", "99.9% SLA guarantee"],
  },
];

export default function Billing() {
  const [currentPlan, setCurrentPlan] = useState("Professional");
  const [attendeesUsed, setAttendeesUsed] = useState(3245);
  const [attendeesLimit, setAttendeesLimit] = useState(5000);
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    const fetchBilling = async () => {
      try {
        const res = await api.billing.get();
        if (res.success && res.billing) {
          setCurrentPlan(res.billing.plan);
          setAttendeesUsed(res.billing.attendeesUsed || 3245);
          setAttendeesLimit(res.billing.attendeesLimit || 5000);
        }
      } catch (err) {
        console.error(err);
      }
    };

    fetchBilling();
  }, []);

  const handleUpgrade = async (planName: string) => {
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

  const usagePercent = Math.min(100, Math.round((attendeesUsed / attendeesLimit) * 100));

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

        {/* Current Plan Card */}
        <Card className="border-[#7c3aed] bg-gradient-to-r from-[#f5f3ff] via-white to-white shadow-lg shadow-[#7c3aed]/10">
          <CardContent className="p-6">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Badge className="bg-[#7c3aed] text-white">Active Plan</Badge>
                  <span className="text-sm text-[#7c3aed] font-bold">{currentPlan}</span>
                </div>
                <p className="text-3xl font-bold text-[#0f172a]">
                  {currentPlan === 'Starter' ? 'Free' : currentPlan === 'Professional' ? '$99' : '$299'}
                  <span className="text-sm font-normal text-[#475569]">/month</span>
                </p>
                <p className="text-xs text-[#475569] mt-1">Renews on July 15, 2025 • Cancel anytime</p>
              </div>

              <div className="space-y-2 w-full sm:w-72">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-[#475569]">Attendees capacity used</span>
                  <span className="text-[#0f172a]">{attendeesUsed.toLocaleString()} / {attendeesLimit.toLocaleString()}</span>
                </div>
                <Progress value={usagePercent} className="h-2.5 bg-[#e9e4ff]" />
                <p className="text-[11px] text-[#94a3b8] text-right">{usagePercent}% capacity filled</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Plans Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.map((plan) => {
            const isActive = currentPlan.toLowerCase() === plan.name.toLowerCase();

            return (
              <Card 
                key={plan.name} 
                className={`border-[#e9e4ff] ${isActive ? 'ring-2 ring-[#7c3aed] shadow-xl shadow-[#7c3aed]/10 bg-[#faf8ff]' : 'shadow-sm bg-white'} relative overflow-hidden flex flex-col justify-between`}
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
                  <ul className="space-y-2.5 pt-2 border-t border-[#f1eeff]">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-2 text-xs text-[#475569]">
                        <Check className="w-4 h-4 text-[#7c3aed] shrink-0 mt-0.5" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
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
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}