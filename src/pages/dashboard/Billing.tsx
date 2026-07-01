import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, Smartphone, Landmark, MessageCircle, ArrowUpRight } from "lucide-react";
import { toast } from "sonner";

const features = [
  "Unlimited Events", "Unlimited Attendees", "3 Admin Users", "7 Manager Users",
  "50 Certificate Templates", "QR Ticketing & Scanner", "Analytics Dashboard", "Email Automation",
];

const paymentHistory = [
  { id: 1, date: "2025-01-15", amount: "20,000", method: "JazzCash", status: "completed" },
  { id: 2, date: "2024-01-15", amount: "20,000", method: "Bank Transfer", status: "completed" },
];

export default function Billing() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Billing & Plan</h1>
        <p className="text-slate-500">Manage your subscription and payments</p>
      </div>

      {/* Current Plan */}
      <Card className="border-blue-200 bg-gradient-to-br from-blue-50 to-white">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h2 className="text-xl font-bold text-slate-900">Pro Plan</h2>
                <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100">Active</Badge>
              </div>
              <p className="text-slate-600">PKR 20,000 / year</p>
              <p className="text-sm text-slate-500 mt-1">Renews on January 15, 2026</p>
            </div>
            <Button className="bg-blue-500 hover:bg-blue-600 text-white" onClick={() => toast.info("Upgrade coming soon!")}>
              <ArrowUpRight className="h-4 w-4 mr-2" />
              Upgrade to Enterprise
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Features */}
      <Card className="border-blue-100">
        <CardHeader><CardTitle className="text-lg">Plan Features</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {features.map(f => (
              <div key={f} className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-500" />
                <span className="text-sm text-slate-700">{f}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Payment Methods */}
      <Card className="border-blue-100">
        <CardHeader><CardTitle className="text-lg">Payment Methods</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[{ name: "JazzCash", icon: Smartphone, detail: "0321-1234567" }, { name: "Easypaisa", icon: Smartphone, detail: "0321-1234567" }, { name: "Bank Transfer", icon: Landmark, detail: "PK00ABCD1234567890" }].map(m => (
              <div key={m.name} className="p-4 rounded-lg border border-blue-100 bg-slate-50 text-center">
                <m.icon className="h-8 w-8 text-blue-500 mx-auto mb-2" />
                <p className="font-medium text-slate-800">{m.name}</p>
                <p className="text-xs text-slate-500">{m.detail}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Payment History */}
      <Card className="border-blue-100">
        <CardHeader><CardTitle className="text-lg">Payment History</CardTitle></CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-slate-100"><th className="text-left py-2 px-3 text-slate-500">Date</th><th className="text-left py-2 px-3 text-slate-500">Amount</th><th className="text-left py-2 px-3 text-slate-500">Method</th><th className="text-left py-2 px-3 text-slate-500">Status</th></tr></thead>
              <tbody>
                {paymentHistory.map(p => (
                  <tr key={p.id} className="border-b border-slate-50">
                    <td className="py-2 px-3">{p.date}</td>
                    <td className="py-2 px-3 font-medium">PKR {p.amount}</td>
                    <td className="py-2 px-3">{p.method}</td>
                    <td className="py-2 px-3"><Badge className="bg-green-100 text-green-700 hover:bg-green-100">{p.status}</Badge></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Support */}
      <div className="text-center">
        <a href="https://wa.me/923001234567" target="_blank" rel="noopener noreferrer">
          <Button variant="outline" className="border-green-500 text-green-600 hover:bg-green-50">
            <MessageCircle className="h-4 w-4 mr-2" />
            Contact Support via WhatsApp
          </Button>
        </a>
      </div>
    </div>
  );
}
