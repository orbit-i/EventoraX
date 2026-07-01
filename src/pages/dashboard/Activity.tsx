import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity, User, Calendar, Award, Settings } from "lucide-react";

const mockLogs = [
  { id: 1, user: "Ahmad Ali", action: "Created", entity: "Event", target: "Tech Conference 2025", time: "2 hours ago" },
  { id: 2, user: "Fatima Khan", action: "Updated", entity: "Registration", target: "Ali Khan - Attended", time: "3 hours ago" },
  { id: 3, user: "Bilal Hassan", action: "Generated", entity: "Certificate", target: "Certificate for Sara Ahmed", time: "5 hours ago" },
  { id: 4, user: "Ahmad Ali", action: "Added", entity: "Speaker", target: "Dr. Sarah Chen", time: "1 day ago" },
  { id: 5, user: "System", action: "Sent", entity: "Email", target: "Registration confirmation to 5 users", time: "1 day ago" },
];

const actionIcons: Record<string, typeof Activity> = {
  Created: Calendar,
  Updated: Settings,
  Generated: Award,
  Added: User,
  Sent: Activity,
};

export default function ActivityLog() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Activity Log</h1>
        <p className="text-slate-500">Track all actions in your organization</p>
      </div>

      <Card className="border-blue-100">
        <CardHeader><CardTitle className="text-lg flex items-center gap-2"><Activity className="h-5 w-5 text-blue-500" />Recent Activity</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-1">
            {mockLogs.map(log => {
              const ActionIcon = actionIcons[log.action] || Activity;
              return (
                <div key={log.id} className="flex items-start gap-4 p-4 rounded-lg hover:bg-slate-50 border-b border-slate-50 last:border-0">
                  <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                    <ActionIcon className="h-4 w-4 text-blue-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-slate-800">
                      <span className="font-medium">{log.user}</span>{" "}
                      <span className="text-slate-500">{log.action.toLowerCase()}</span>{" "}
                      <span className="font-medium">{log.entity}</span>
                      <span className="text-slate-500">: {log.target}</span>
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5">{log.time}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
