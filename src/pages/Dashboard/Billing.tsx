import Header from "@/components/ui/dashboard/header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Check } from "lucide-react"

const plans = [
  {
    name: "Starter",
    price: "$29",
    period: "/month",
    description: "Perfect for small events",
    features: ["500 attendees", "Basic analytics", "Email support", "1 admin"],
    current: false,
  },
  {
    name: "Professional",
    price: "$99",
    period: "/month",
    description: "For growing organizations",
    features: ["5,000 attendees", "Advanced analytics", "Priority support", "5 admins", "Custom branding"],
    current: true,
  },
  {
    name: "Enterprise",
    price: "Custom",
    period: "",
    description: "For large organizations",
    features: ["Unlimited attendees", "Dedicated manager", "SSO", "SLA", "On-premise"],
    current: false,
  },
]

export default function Billing() {
  return (
    <div>
      <Header title="Billing" />
      <div className="p-6 space-y-6">
        {/* Current Plan */}
        <Card className="border-[#7c3aed] bg-gradient-to-r from-[#f5f3ff] to-white shadow-lg shadow-[#7c3aed]/10">
          <CardContent className="p-6">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Badge className="bg-[#7c3aed] text-white">Current Plan</Badge>
                  <span className="text-sm text-[#7c3aed] font-semibold">Professional</span>
                </div>
                <p className="text-2xl font-bold text-[#0f172a]">$99<span className="text-sm font-normal text-[#475569]">/month</span></p>
                <p className="text-sm text-[#475569] mt-1">Renews on July 15, 2024</p>
              </div>
              <div className="space-y-2 w-full sm:w-64">
                <div className="flex justify-between text-sm">
                  <span className="text-[#475569]">Attendees used</span>
                  <span className="font-semibold text-[#0f172a]">3,245 / 5,000</span>
                </div>
                <Progress value={65} className="h-2 bg-[#e9e4ff]" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Plans */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.map((plan) => (
            <Card 
              key={plan.name} 
              className={`border-[#e9e4ff] ${plan.current ? 'ring-2 ring-[#7c3aed] shadow-xl shadow-[#7c3aed]/10' : 'shadow-sm'} relative overflow-hidden`}
            >
              {plan.current && (
                <div className="absolute top-0 right-0 bg-[#7c3aed] text-white text-xs font-bold px-3 py-1 rounded-bl-xl">
                  ACTIVE
                </div>
              )}
              <CardHeader>
                <CardTitle className="text-lg font-bold text-[#0f172a]">{plan.name}</CardTitle>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-bold text-[#0f172a]">{plan.price}</span>
                  <span className="text-sm text-[#475569]">{plan.period}</span>
                </div>
                <p className="text-sm text-[#475569]">{plan.description}</p>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="space-y-2">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-2 text-sm text-[#475569]">
                      <Check className="w-4 h-4 text-[#7c3aed]" />
                      {feature}
                    </li>
                  ))}
                </ul>
                <Button 
                  className={`w-full rounded-xl ${plan.current ? 'bg-[#7c3aed] hover:bg-[#6d28d9] text-white shadow-lg shadow-[#7c3aed]/25' : 'bg-white border-2 border-[#e9e4ff] text-[#0f172a] hover:bg-[#f5f3ff] hover:text-[#7c3aed] hover:border-[#c4b5fd]'}`}
                  disabled={plan.current}
                >
                  {plan.current ? "Current Plan" : plan.name === "Enterprise" ? "Contact Sales" : "Upgrade"}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}