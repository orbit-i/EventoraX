import Header from "@/components/ui/dashboard/header"
import { Button } from "@/components/ui/button"
import { Card, CardAccentStrip, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Check, Zap, CreditCard, Building2 } from "lucide-react"

// ─── Plan data ────────────────────────────────────────────────────────────────

const plans = [
  {
    name: "Starter",
    price: "$29",
    period: "/month",
    description: "Perfect for small events",
    icon: Zap,
    features: ["500 attendees", "Basic analytics", "Email support", "1 admin"],
    current: false,
  },
  {
    name: "Professional",
    price: "$99",
    period: "/month",
    description: "For growing organizations",
    icon: CreditCard,
    features: ["5,000 attendees", "Advanced analytics", "Priority support", "5 admins", "Custom branding"],
    current: true,
  },
  {
    name: "Enterprise",
    price: "Custom",
    period: "",
    description: "For large organizations",
    icon: Building2,
    features: ["Unlimited attendees", "Dedicated manager", "SSO", "SLA", "On-premise"],
    current: false,
  },
]

export default function Billing() {
  return (
    <div>
      <Header title="Billing" />
      <div className="p-6 space-y-6">

        {/* ── Current plan summary ────────────────────────────────────────── */}
        {/*
          Uses variant="default" with a manual purple left-border accent to
          make it feel like an "active" information card without the selection
          ring of variant="outlined" active.
        */}
        <Card
          variant="default"
          className="border-l-4 border-l-[#7c3aed] bg-gradient-to-r from-[#faf8ff] to-white"
        >
          <CardAccentStrip />
          <CardContent className="p-6">
            <div className="flex flex-wrap items-center justify-between gap-6">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Badge className="bg-[#7c3aed] text-white text-xs">Current Plan</Badge>
                  <span className="text-sm font-semibold text-[#7c3aed]">Professional</span>
                </div>
                <p className="text-2xl font-bold text-[#0f172a]">
                  $99
                  <span className="text-sm font-normal text-[#475569]">/month</span>
                </p>
                <p className="text-xs text-[#64748b]">Renews on July 15, 2024</p>
              </div>

              <div className="space-y-2 w-full sm:w-72">
                <div className="flex justify-between text-xs">
                  <span className="text-[#64748b]">Attendees used</span>
                  <span className="font-semibold text-[#0f172a]">3,245 / 5,000</span>
                </div>
                {/* Progress bar — purple fill matches theme */}
                <div className="h-2 w-full rounded-full bg-[#ede9fe] overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-[#7c3aed] to-[#a78bfa] transition-all duration-500"
                    style={{ width: "65%" }}
                  />
                </div>
                <p className="text-xs text-[#94a3b8] text-right">65% used</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ── Plan selection cards ────────────────────────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.map((plan) => {
            const PlanIcon = plan.icon
            return (
              <Card
                key={plan.name}
                variant="outlined"
                active={plan.current}
                className="flex flex-col"
              >
                {/* Active plan gets the accent strip */}
                {plan.current && <CardAccentStrip />}

                <CardHeader icon={<PlanIcon className="w-4 h-4" />}>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <CardTitle>{plan.name}</CardTitle>
                      <CardDescription>{plan.description}</CardDescription>
                    </div>
                    {plan.current && (
                      <Badge className="bg-[#7c3aed]/10 text-[#7c3aed] border border-[#c4b5fd] text-xs font-semibold shrink-0">
                        Active
                      </Badge>
                    )}
                  </div>
                </CardHeader>

                <CardContent className="flex flex-col flex-1 gap-4">
                  {/* Pricing */}
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-bold text-[#0f172a]">{plan.price}</span>
                    {plan.period && (
                      <span className="text-sm text-[#94a3b8]">{plan.period}</span>
                    )}
                  </div>

                  {/* Feature list */}
                  <ul className="space-y-2 flex-1">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-center gap-2.5 text-sm text-[#475569]">
                        <div className="w-4 h-4 rounded-full bg-[#f0ebff] flex items-center justify-center shrink-0">
                          <Check className="w-2.5 h-2.5 text-[#7c3aed]" strokeWidth={3} />
                        </div>
                        {feature}
                      </li>
                    ))}
                  </ul>

                  {/* CTA */}
                  <Button
                    variant={plan.current ? "default" : "outline"}
                    className="w-full mt-auto"
                    disabled={plan.current}
                  >
                    {plan.current
                      ? "Current Plan"
                      : plan.name === "Enterprise"
                      ? "Contact Sales"
                      : "Upgrade"}
                  </Button>
                </CardContent>
              </Card>
            )
          })}
        </div>

      </div>
    </div>
  )
}
