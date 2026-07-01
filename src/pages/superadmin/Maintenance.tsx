import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Wrench, Database, Trash2, Activity, CheckCircle } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function Maintenance() {
  const [maintenance, setMaintenance] = useState(false);

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-white">Maintenance</h1>
        <p className="text-slate-400">System maintenance tools</p>
      </div>

      <Card className="bg-slate-800 border-slate-700">
        <CardHeader><CardTitle className="text-white">System Status</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-3 rounded-lg bg-slate-700/50">
            <div className="flex items-center gap-3">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <span className="text-slate-300">Database</span>
            </div>
            <span className="text-green-400 text-sm">Connected</span>
          </div>
          <div className="flex items-center justify-between p-3 rounded-lg bg-slate-700/50">
            <div className="flex items-center gap-3">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <span className="text-slate-300">Storage</span>
            </div>
            <span className="text-green-400 text-sm">OK</span>
          </div>
          <div className="flex items-center justify-between p-3 rounded-lg bg-slate-700/50">
            <div className="flex items-center gap-3">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <span className="text-slate-300">Email Service</span>
            </div>
            <span className="text-green-400 text-sm">Operational</span>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-slate-800 border-slate-700">
        <CardHeader><CardTitle className="text-white">Maintenance Mode</CardTitle></CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-300">Enable Maintenance Mode</p>
              <p className="text-sm text-slate-500">Show maintenance page to all users</p>
            </div>
            <Switch checked={maintenance} onCheckedChange={setMaintenance} />
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Button variant="outline" className="border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-white justify-start" onClick={() => toast.success("Database backup started!")}>
          <Database className="h-4 w-4 mr-2" />Backup Database
        </Button>
        <Button variant="outline" className="border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-white justify-start" onClick={() => toast.success("Cache cleared!")}>
          <Trash2 className="h-4 w-4 mr-2" />Clear Cache
        </Button>
        <Button variant="outline" className="border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-white justify-start" onClick={() => toast.info("Health check passed!")}>
          <Activity className="h-4 w-4 mr-2" />Run Health Check
        </Button>
        <div className="text-sm text-slate-500 flex items-center">
          <Wrench className="h-4 w-4 mr-2" />Version: 1.0.0
        </div>
      </div>
    </div>
  );
}
