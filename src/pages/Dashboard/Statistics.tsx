import { useState, useEffect } from 'react';
import Header from "@/components/ui/dashboard/header";
import StatCard from "@/components/ui/dashboard/StatCard";
import { Calendar, Users, Ticket, DollarSign } from "lucide-react";
import { api } from "@/services/api";

export default function Statistics() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await api.stats.getOverview();
        if (res.success) {
          setStats(res.stats);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  const totalEvents = stats?.totalEvents || 156;
  const totalAttendees = stats?.totalAttendees || 12500;
  const revenue = stats?.totalRevenue ? `$${Number(stats.totalRevenue).toLocaleString()}` : '$124,500';

  const statItems = [
    { title: "Events Hosted", value: totalEvents.toString(), change: "+24 this month", icon: Calendar, trend: "up" as const },
    { title: "Total Attendees", value: totalAttendees > 1000 ? `${(totalAttendees / 1000).toFixed(1)}K` : totalAttendees.toString(), change: "+18% vs last month", icon: Users, trend: "up" as const },
    { title: "Tickets Sold", value: (totalAttendees * 0.85).toFixed(0), change: "+32% conversion", icon: Ticket, trend: "up" as const },
    { title: "Total Revenue", value: revenue, change: "Top 5% platform", icon: DollarSign, trend: "up" as const },
  ];

  const recentEvents = stats?.recentEvents || [
    { title: "Global Tech Summit 2025", registered_count: 842, capacity: 1500 },
    { title: "Fullstack Web & AI Masterclass", registered_count: 184, capacity: 250 },
    { title: "Founders & Investors Networking Gala", registered_count: 95, capacity: 120 },
    { title: "SaaS Product Launch Expo", registered_count: 1720, capacity: 3000 },
  ];

  const monthlyGrowth = stats?.monthlyGrowth || [
    { month: "Jan", attendees: 420 },
    { month: "Feb", attendees: 580 },
    { month: "Mar", attendees: 720 },
    { month: "Apr", attendees: 890 },
    { month: "May", attendees: 1100 },
    { month: "Jun", attendees: 1450 },
  ];

  return (
    <div>
      <Header title="Statistics" />
      <div className="p-6 space-y-6">
        {loading && (
          <div className="text-center py-1 text-xs text-[#7c3aed] flex items-center justify-center gap-2">
            <div className="w-3.5 h-3.5 border-2 border-[#7c3aed] border-t-transparent rounded-full animate-spin" />
            <span>Syncing live statistics...</span>
          </div>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {statItems.map((stat) => (
            <StatCard key={stat.title} {...stat} />
          ))}
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl border border-[#e9e4ff] p-6 shadow-sm">
            <h3 className="text-lg font-bold text-[#0f172a] mb-1">Event Registration Fill Rate</h3>
            <p className="text-xs text-[#64748b] mb-4">Capacity utilization across active events</p>
            <div className="space-y-4">
              {recentEvents.map((event: any, i: number) => {
                const percent = event.capacity ? Math.min(100, Math.round((event.registered_count / event.capacity) * 100)) : 80 - i * 12;
                return (
                  <div key={event.title || i} className="flex items-center gap-4">
                    <div className="w-8 h-8 rounded-lg bg-[#f5f3ff] flex items-center justify-center text-[#7c3aed] font-bold text-sm">
                      {i + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-[#0f172a] truncate">{event.title}</p>
                      <div className="w-full h-2 bg-[#f5f3ff] rounded-full mt-1 overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-[#7c3aed] to-[#a78bfa] rounded-full transition-all duration-500"
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                    </div>
                    <span className="text-sm font-bold text-[#7c3aed]">{percent}%</span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-[#e9e4ff] p-6 shadow-sm flex flex-col justify-between">
            <div>
              <h3 className="text-lg font-bold text-[#0f172a] mb-1">Monthly Attendees Growth</h3>
              <p className="text-xs text-[#64748b] mb-4">Participant growth trajectory over recent months</p>
            </div>
            <div className="flex items-end justify-between h-48 gap-3 pt-4">
              {monthlyGrowth.map((item: any, i: number) => {
                const max = Math.max(...monthlyGrowth.map((m: any) => m.attendees || 1000));
                const heightPercent = Math.min(100, Math.max(20, Math.round(((item.attendees || 400) / max) * 100)));

                return (
                  <div key={item.month || i} className="flex flex-col items-center gap-2 flex-1">
                    <span className="text-[10px] font-bold text-[#7c3aed]">{item.attendees}</span>
                    <div 
                      className="w-full bg-gradient-to-t from-[#7c3aed] to-[#a78bfa] rounded-t-xl hover:brightness-110 transition-all duration-300"
                      style={{ height: `${heightPercent}%` }}
                    />
                    <span className="text-xs text-[#475569] font-medium">{item.month}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}