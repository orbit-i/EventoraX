import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Settings as SettingsIcon, Upload, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

export default function SettingsPage() {
  const [org, setOrg] = useState({ name: "My Organization", email: "org@example.com", phone: "+92-300-1234567" });
  const [notifications, setNotifications] = useState({ newReg: true, attendance: true, cert: false });

  const handleSave = () => {
    toast.success("Settings saved!");
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Settings</h1>
        <p className="text-slate-500">Manage your organization settings</p>
      </div>

      {/* Organization */}
      <Card className="border-blue-100">
        <CardHeader><CardTitle className="text-lg flex items-center gap-2"><SettingsIcon className="h-5 w-5 text-blue-500" />Organization</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Organization Name</label>
            <Input value={org.name} onChange={e => setOrg({...org, name: e.target.value})} />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
            <Input type="email" value={org.email} onChange={e => setOrg({...org, email: e.target.value})} />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Phone</label>
            <Input value={org.phone} onChange={e => setOrg({...org, phone: e.target.value})} />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Logo</label>
            <div className="flex items-center gap-3">
              <div className="w-16 h-16 rounded-lg bg-blue-100 flex items-center justify-center">
                <Upload className="h-6 w-6 text-blue-500" />
              </div>
              <Button variant="outline" size="sm">Upload Logo</Button>
            </div>
          </div>
          <Button className="bg-blue-500 hover:bg-blue-600 text-white" onClick={handleSave}>Save Changes</Button>
        </CardContent>
      </Card>

      {/* Branding */}
      <Card className="border-blue-100">
        <CardHeader><CardTitle className="text-lg">Branding</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Primary Color</label>
              <div className="flex items-center gap-2">
                <input type="color" defaultValue="#3B82F6" className="w-10 h-10 rounded border border-slate-200" />
                <span className="text-sm text-slate-500">#3B82F6</span>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Accent Color</label>
              <div className="flex items-center gap-2">
                <input type="color" defaultValue="#60A5FA" className="w-10 h-10 rounded border border-slate-200" />
                <span className="text-sm text-slate-500">#60A5FA</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notifications */}
      <Card className="border-blue-100">
        <CardHeader><CardTitle className="text-lg">Notifications</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          {[{ key: "newReg", label: "New Registration", desc: "Get notified when someone registers" }, { key: "attendance", label: "Attendance Updates", desc: "Get notified on attendance changes" }, { key: "cert", label: "Certificate Actions", desc: "Get notified on certificate generation/revocation" }].map(n => (
            <div key={n.key} className="flex items-center justify-between">
              <div>
                <p className="font-medium text-slate-800">{n.label}</p>
                <p className="text-xs text-slate-500">{n.desc}</p>
              </div>
              <Switch checked={notifications[n.key as keyof typeof notifications]} onCheckedChange={(v: boolean) => setNotifications({...notifications, [n.key]: v})} />
            </div>
          ))}
        </CardContent>
      </Card>

      <Separator />

      {/* Danger Zone */}
      <Card className="border-red-200">
        <CardHeader><CardTitle className="text-lg text-red-600 flex items-center gap-2"><AlertTriangle className="h-5 w-5" />Danger Zone</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-slate-800">Delete All Data</p>
              <p className="text-xs text-slate-500">This will permanently delete all your data</p>
            </div>
            <Button variant="outline" className="text-red-600 border-red-200 hover:bg-red-50" onClick={() => toast.error("This action requires confirmation!")}>Delete</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
