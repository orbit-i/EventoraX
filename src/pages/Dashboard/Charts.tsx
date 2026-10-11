import { useState, useEffect } from 'react';
import Header from "@/components/ui/dashboard/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { api } from "@/services/api";

export default function Charts() {
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await api.stats.getOverview();
        if (res.success) {
          setStats(res.stats);
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchStats();
  }, []);

  const weeklyAttendance = stats?.weeklyAttendance || [];
  const maxWeekly = Math.max(...weeklyAttendance.map((w: any) => w.attendees || 0), 1);

  const categoryBreakdown = (stats?.categoryBreakdown || []).map((cat: any, i: number) => ({
    label: cat.category,
    color: ['#7c3aed', '#a78bfa', '#c084fc', '#ddd6fe', '#e9d5ff'][i % 5],
    value: `${cat.count} Events (${cat.attendees || 0} RSVPs)`,
  }));

  const totalAttendees = weeklyAttendance.reduce((acc: number, item: any) => acc + (item.attendees || 0), 0);

  return (
    <div>
      <Header title="Charts & Analytics" />
      <div className="p-6 space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Bar Chart: Weekly Attendance */}
          <Card className="border-[#e9e4ff] shadow-sm">
            <CardHeader className="border-b border-[#f1eeff] pb-3">
              <CardTitle className="text-lg font-bold text-[#0f172a]">Weekly Registration Activity</CardTitle>
              <p className="text-xs text-[#64748b]">Daily attendee ticket registrations</p>
            </CardHeader>
            <CardContent className="pt-6">
              {weeklyAttendance.length === 0 || totalAttendees === 0 ? (
                <div className="h-64 flex flex-col items-center justify-center text-center p-6 text-xs text-[#94a3b8]">
                  <span>No daily registration activity recorded yet.</span>
                  <span className="text-[11px] text-[#94a3b8] mt-1">Live chart bars will update automatically when tickets are issued.</span>
                </div>
              ) : (
                <div className="h-64 flex items-end justify-between gap-3 px-2">
                  {weeklyAttendance.map((item: any, i: number) => {
                    const heightPercent = Math.min(100, Math.max(10, Math.round(((item.attendees || 0) / maxWeekly) * 100)));
                    return (
                      <div key={item.day || i} className="flex flex-col items-center gap-2 flex-1 group">
                        <span className="text-[10px] font-bold text-[#7c3aed] opacity-0 group-hover:opacity-100 transition-opacity">
                          {item.attendees || 0}
                        </span>
                        <div 
                          className="w-full bg-gradient-to-t from-[#7c3aed] to-[#a78bfa] rounded-t-xl group-hover:brightness-110 transition-all duration-300"
                          style={{ height: `${heightPercent}%` }}
                        />
                        <span className="text-xs text-[#475569] font-medium">{item.day}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Category Distribution Chart */}
          <Card className="border-[#e9e4ff] shadow-sm">
            <CardHeader className="border-b border-[#f1eeff] pb-3">
              <CardTitle className="text-lg font-bold text-[#0f172a]">Event Category Distribution</CardTitle>
              <p className="text-xs text-[#64748b]">Types of events and attendee interest</p>
            </CardHeader>
            <CardContent className="pt-6">
              {categoryBreakdown.length === 0 ? (
                <div className="h-64 flex flex-col items-center justify-center text-center p-6 text-xs text-[#94a3b8]">
                  <span>No event categories populated yet.</span>
                  <span className="text-[11px] text-[#94a3b8] mt-1">Publish events to visualize category segmentation.</span>
                </div>
              ) : (
                <div className="flex flex-col sm:flex-row items-center justify-center gap-8 py-4">
                  <div className="relative w-40 h-40 shrink-0">
                    <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                      <circle cx="50" cy="50" r="35" fill="none" stroke="#e9e4ff" strokeWidth="18" />
                      <circle cx="50" cy="50" r="35" fill="none" stroke="#7c3aed" strokeWidth="18" strokeDasharray="65 220" />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-2xl font-bold text-[#0f172a]">{stats?.totalEvents || 0}</span>
                      <span className="text-[10px] text-[#64748b] font-medium">Events</span>
                    </div>
                  </div>
                  <div className="space-y-3 w-full sm:w-auto">
                    {categoryBreakdown.map((item: any) => (
                      <div key={item.label} className="flex items-center gap-3">
                        <div className="w-3.5 h-3.5 rounded-md shrink-0" style={{ backgroundColor: item.color }} />
                        <span className="text-xs font-semibold text-[#0f172a] min-w-24">{item.label}</span>
                        <span className="text-xs text-[#64748b]">{item.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}