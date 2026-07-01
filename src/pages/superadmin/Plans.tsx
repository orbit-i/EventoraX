import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Tag, Plus, Pencil } from "lucide-react";
import { toast } from "sonner";

const mockPlans = [
  { id: 1, name: "Pro", slug: "pro", price: "20000", maxAdmins: 3, maxManagers: 7, tenants: 89, isActive: true, isVisible: true },
  { id: 2, name: "Enterprise", slug: "enterprise", price: "25000", maxAdmins: 0, maxManagers: 0, tenants: 67, isActive: true, isVisible: true },
];

export default function Plans() {
  const [plans] = useState(mockPlans);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Plans & Pricing</h1>
          <p className="text-slate-400">Manage subscription plans</p>
        </div>
        <Button className="bg-blue-500 hover:bg-blue-600 text-white" onClick={() => toast.info("Create plan coming soon!")}>
          <Plus className="h-4 w-4 mr-2" />Create Plan
        </Button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {plans.map(p => (
          <Card key={p.id} className="bg-slate-800 border-slate-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <Tag className="h-6 w-6 text-blue-500" />
                  <h3 className="text-lg font-bold text-white">{p.name}</h3>
                </div>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-white" onClick={() => toast.info("Edit coming soon!")}>
                  <Pencil className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-2xl font-bold text-white mb-4">PKR {p.price}<span className="text-sm text-slate-400 font-normal">/year</span></p>
              <div className="space-y-2 text-sm text-slate-400">
                <p>Max Admins: {p.maxAdmins === 0 ? "Unlimited" : p.maxAdmins}</p>
                <p>Max Managers: {p.maxManagers === 0 ? "Unlimited" : p.maxManagers}</p>
                <p>Tenants on plan: {p.tenants}</p>
              </div>
              <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-700">
                <div className="flex items-center gap-2"><span className="text-sm text-slate-400">Active</span><Switch checked={p.isActive} /></div>
                <div className="flex items-center gap-2"><span className="text-sm text-slate-400">Visible</span><Switch checked={p.isVisible} /></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
