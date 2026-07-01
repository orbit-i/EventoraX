import { Button } from "@/components/ui/button";
import { Check, X, HelpCircle, CreditCard, Smartphone, Landmark } from "lucide-react";
import { Link } from "react-router";

const plans = [
  {
    name: "Pro",
    price: "20,000",
    period: "/year",
    description: "Perfect for small to medium organizations.",
    features: [
      { text: "Unlimited Events", included: true },
      { text: "Unlimited Attendees", included: true },
      { text: "3 Admin Users", included: true },
      { text: "7 Manager Users", included: true },
      { text: "50 Certificate Templates", included: true },
      { text: "QR Ticketing & Scanner", included: true },
      { text: "Bulk Certificate Generator", included: true },
      { text: "ID Card Generator (4 templates)", included: true },
      { text: "Analytics Dashboard", included: true },
      { text: "Email Automation", included: true },
      { text: "Audit Logs", included: true },
      { text: "REST API Access", included: false },
      { text: "Custom Domain", included: false },
      { text: "White Label Branding", included: false },
      { text: "Priority Support", included: false },
    ],
    popular: false,
  },
  {
    name: "Enterprise",
    price: "25,000",
    period: "/year",
    description: "For large organizations with advanced needs.",
    features: [
      { text: "Unlimited Events", included: true },
      { text: "Unlimited Attendees", included: true },
      { text: "Unlimited Admin Users", included: true },
      { text: "Unlimited Manager Users", included: true },
      { text: "50 Certificate Templates", included: true },
      { text: "QR Ticketing & Scanner", included: true },
      { text: "Bulk Certificate Generator", included: true },
      { text: "ID Card Generator (4 templates)", included: true },
      { text: "Analytics Dashboard", included: true },
      { text: "Email Automation", included: true },
      { text: "Audit Logs", included: true },
      { text: "REST API Access", included: true },
      { text: "Custom Domain", included: true },
      { text: "White Label Branding", included: true },
      { text: "Priority Support", included: true },
    ],
    popular: true,
  },
];

const faqs = [
  { q: "Can I upgrade or downgrade my plan?", a: "Yes, you can upgrade or downgrade at any time. Changes take effect on your next billing cycle." },
  { q: "What happens after my trial ends?", a: "You'll need to subscribe to a paid plan to continue using the platform. Your data will be preserved for 7 days." },
  { q: "Can I cancel my subscription?", a: "Yes, you can cancel anytime from your billing settings. You'll continue to have access until the end of your billing period." },
];

export default function Pricing() {
  return (
    <div className="bg-white">
      {/* Header */}
      <section className="py-16 bg-gradient-to-br from-blue-50 to-white text-center">
        <div className="container mx-auto px-4 lg:px-8">
          <h1 className="text-4xl font-bold text-slate-900 mb-4">Pricing Plans</h1>
          <p className="text-lg text-slate-600 max-w-xl mx-auto mb-6">
            Affordable PKR pricing for Pakistani organizations. No hidden fees.
          </p>
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-100 rounded-full text-blue-700 text-sm font-medium">
            <Check className="h-4 w-4" />
            1-day free trial on all plans
          </div>
        </div>
      </section>

      {/* Plans */}
      <section className="py-16">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {plans.map((plan) => (
              <div
                key={plan.name}
                className={`rounded-2xl p-8 ${
                  plan.popular
                    ? "border-2 border-blue-500 bg-gradient-to-br from-blue-50 to-white relative"
                    : "border border-blue-100 bg-white"
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-blue-500 text-white text-sm font-medium rounded-full">
                    Most Popular
                  </div>
                )}
                <div className="text-sm font-medium text-blue-600 mb-2">{plan.name}</div>
                <div className="flex items-baseline gap-1 mb-2">
                  <span className="text-lg text-slate-500">PKR</span>
                  <span className="text-5xl font-bold text-slate-900">{plan.price}</span>
                  <span className="text-slate-500">{plan.period}</span>
                </div>
                <p className="text-slate-600 mb-6">{plan.description}</p>
                <ul className="space-y-3 mb-8">
                  {plan.features.map((f) => (
                    <li key={f.text} className="flex items-center gap-2">
                      {f.included ? (
                        <Check className="h-4 w-4 text-green-500 shrink-0" />
                      ) : (
                        <X className="h-4 w-4 text-slate-300 shrink-0" />
                      )}
                      <span className={f.included ? "text-slate-700" : "text-slate-400"}>{f.text}</span>
                    </li>
                  ))}
                </ul>
                <Link to="/register">
                  <Button className={`w-full ${plan.popular ? "bg-blue-500 hover:bg-blue-600 text-white" : ""}`}>
                    Start Free Trial
                  </Button>
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Payment Methods */}
      <section className="py-12 bg-slate-50">
        <div className="container mx-auto px-4 lg:px-8 text-center">
          <h2 className="text-xl font-bold text-slate-900 mb-6">Payment Methods</h2>
          <div className="flex items-center justify-center gap-8">
            <div className="flex items-center gap-2 text-slate-600">
              <Smartphone className="h-5 w-5 text-blue-500" />
              <span>JazzCash</span>
            </div>
            <div className="flex items-center gap-2 text-slate-600">
              <CreditCard className="h-5 w-5 text-blue-500" />
              <span>Easypaisa</span>
            </div>
            <div className="flex items-center gap-2 text-slate-600">
              <Landmark className="h-5 w-5 text-blue-500" />
              <span>Bank Transfer</span>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16">
        <div className="container mx-auto px-4 lg:px-8 max-w-3xl">
          <h2 className="text-2xl font-bold text-slate-900 mb-8 text-center">Billing FAQ</h2>
          <div className="space-y-4">
            {faqs.map((faq, i) => (
              <div key={i} className="p-5 rounded-xl border border-blue-100">
                <div className="flex items-start gap-3">
                  <HelpCircle className="h-5 w-5 text-blue-500 mt-0.5 shrink-0" />
                  <div>
                    <h3 className="font-semibold text-slate-800 mb-1">{faq.q}</h3>
                    <p className="text-sm text-slate-600">{faq.a}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
