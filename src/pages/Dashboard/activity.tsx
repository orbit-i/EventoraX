import { useState, useEffect } from 'react';
import Header from "@/components/ui/dashboard/header";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  UserPlus, 
  Calendar, 
  CreditCard, 
  Settings, 
  LogIn, 
  Mail, 
  Shield,
  Activity as ActivityIcon
} from "lucide-react";
import { api } from "@/services/api";

const typeIconMap: Record<string, any> = {
  user: UserPlus,
  event: Calendar,
  billing: CreditCard,
  settings: Settings,
  login: LogIn,
  email: Mail,
  security: Shield,
};

const typeColors: Record<string, string> = {
  user: "bg-blue-100 text-blue-600 border-blue-200",
  event: "bg-purple-100 text-purple-600 border-purple-200",
  billing: "bg-green-100 text-green-600 border-green-200",
  settings: "bg-amber-100 text-amber-600 border-amber-200",
  login: "bg-gray-100 text-gray-600 border-gray-200",
  email: "bg-pink-100 text-pink-600 border-pink-200",
  security: "bg-emerald-100 text-emerald-600 border-emerald-200",
};

export default function Activity() {
  const [activities, setActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('All');

  const fetchActivities = async () => {
    setLoading(true);
    try {
      const res = await api.activity.get({ type: filter !== 'All' ? filter : undefined, limit: 100 });
      if (res.success) {
        setActivities(res.activities || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActivities();
  }, [filter]);

  const filterTabs = ['All', 'User', 'Event', 'Billing', 'Security', 'Settings'];

  return (
    <div>
      <Header title="Activity Logs" />
      <div className="p-6 space-y-6">
        {/* Filters */}
        <div className="flex items-center gap-2 flex-wrap">
          {filterTabs.map((tab) => (
            <Badge
              key={tab}
              onClick={() => setFilter(tab)}
              className={`cursor-pointer px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                filter === tab
                  ? 'bg-[#7c3aed] text-white shadow-sm'
                  : 'bg-white text-[#475569] border-[#e9e4ff] hover:bg-[#f5f3ff] hover:text-[#7c3aed]'
              }`}
            >
              {tab}
            </Badge>
          ))}
        </div>

        {/* Activity List */}
        <Card className="border-[#e9e4ff] shadow-sm">
          <CardContent className="p-0">
            {loading ? (
              <div className="p-12 text-center text-sm text-[#64748b]">
                Loading activity logs from database...
              </div>
            ) : activities.length === 0 ? (
              <div className="p-12 text-center text-sm text-[#64748b]">
                No activity records found matching this category.
              </div>
            ) : (
              activities.map((activity, index) => {
                const IconComponent = typeIconMap[activity.type] || ActivityIcon;
                const colorStyle = typeColors[activity.type] || "bg-purple-100 text-purple-600 border-purple-200";
                const timeString = activity.created_at
                  ? new Date(activity.created_at).toLocaleString()
                  : 'Recent';

                return (
                  <div 
                    key={activity.id || index} 
                    className={`flex items-start gap-4 p-5 ${index !== activities.length - 1 ? 'border-b border-[#e9e4ff]' : ''} hover:bg-[#faf8ff] transition-colors duration-150`}
                  >
                    {/* Icon */}
                    <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 border-2 ${colorStyle}`}>
                      <IconComponent className="w-5 h-5" />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <p className="text-sm font-bold text-[#0f172a]">{activity.action}</p>
                        <Badge 
                          variant="outline" 
                          className="text-[11px] bg-[#f5f3ff] text-[#7c3aed] border-[#ddd6fe] font-medium capitalize"
                        >
                          {activity.type}
                        </Badge>
                      </div>
                      <p className="text-sm text-[#475569] leading-relaxed">{activity.detail}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-xs text-[#94a3b8] font-medium">by {activity.user_name || 'System'}</span>
                        <span className="w-1 h-1 rounded-full bg-[#ddd6fe]" />
                        <span className="text-xs text-[#94a3b8] font-medium">{timeString}</span>
                      </div>
                    </div>

                    {/* Time */}
                    <span className="text-xs text-[#94a3b8] font-semibold shrink-0 bg-[#f5f3ff] px-2.5 py-1 rounded-lg hidden sm:inline-block">
                      {timeString}
                    </span>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}