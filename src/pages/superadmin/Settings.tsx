import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Settings, Save } from "lucide-react";
import { toast } from "sonner";

export default function SuperadminSettings() {
  const [settings, setSettings] = useState({
    platformName: "EventoraX",
    contactEmail: "support@eventorax.com",
    whatsapp: "+92-300-1234567",
    trialDays: "1",
    maintenance: false,
    jazzcash: "0321-1234567",
    easypaisa: "0321-1234567",
    iban: "PK00ABCD1234567890",
  });

  const handleSave = () => {
    toast.success("Settings saved!");
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold text-white">System Settings</h1>
        <p className="text-slate-400">Platform configuration</p>
      </div>

      <Card className="bg-slate-800 border-slate-700">
        <CardHeader><CardTitle className="text-white flex items-center gap-2"><Settings className="h-5 w-5 text-blue-500" />General</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div><label className="block text-sm text-slate-400 mb-1">Platform Name</label><Input value={settings.platformName} onChange={e => setSettings({...settings, platformName: e.target.value})} className="bg-slate-700 border-slate-600 text-white" /></div>
          <div><label className="block text-sm text-slate-400 mb-1">Contact Email</label><Input value={settings.contactEmail} onChange={e => setSettings({...settings, contactEmail: e.target.value})} className="bg-slate-700 border-slate-600 text-white" /></div>
          <div><label className="block text-sm text-slate-400 mb-1">WhatsApp Number</label><Input value={settings.whatsapp} onChange={e => setSettings({...settings, whatsapp: e.target.value})} className="bg-slate-700 border-slate-600 text-white" /></div>
          <div><label className="block text-sm text-slate-400 mb-1">Trial Period (days)</label><Input value={settings.trialDays} onChange={e => setSettings({...settings, trialDays: e.target.value})} className="bg-slate-700 border-slate-600 text-white" /></div>
          <div className="flex items-center justify-between"><span className="text-slate-300">Maintenance Mode</span><Switch checked={settings.maintenance} onCheckedChange={v => setSettings({...settings, maintenance: v})} /></div>
        </CardContent>
      </Card>

      <Card className="bg-slate-800 border-slate-700">
        <CardHeader><CardTitle className="text-white">Payment Accounts</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div><label className="block text-sm text-slate-400 mb-1">JazzCash</label><Input value={settings.jazzcash} onChange={e => setSettings({...settings, jazzcash: e.target.value})} className="bg-slate-700 border-slate-600 text-white" /></div>
          <div><label className="block text-sm text-slate-400 mb-1">Easypaisa</label><Input value={settings.easypaisa} onChange={e => setSettings({...settings, easypaisa: e.target.value})} className="bg-slate-700 border-slate-600 text-white" /></div>
          <div><label className="block text-sm text-slate-400 mb-1">Bank IBAN</label><Input value={settings.iban} onChange={e => setSettings({...settings, iban: e.target.value})} className="bg-slate-700 border-slate-600 text-white" /></div>
        </CardContent>
      </Card>

      <Button className="bg-blue-500 hover:bg-blue-600 text-white" onClick={handleSave}><Save className="h-4 w-4 mr-2" />Save All Settings</Button>
    </div>
  );
}
