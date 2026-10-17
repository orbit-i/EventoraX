import { useState, useEffect } from 'react';
import { Link, Navigate } from 'react-router-dom';
import Header from '@/components/ui/dashboard/header';
import StatCard from '@/components/ui/dashboard/StatCard';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Calendar, 
  Users, 
  DollarSign, 
  TrendingUp, 
  Plus, 
  ArrowRight, 
  MapPin, 
  CheckCircle2, 
  Sparkles,
  Ticket,
  BarChart3,
  Clock,
  KeyRound,
  Copy
} from 'lucide-react';
import { api } from '@/services/api';
import { useAuth } from '@/context/AuthContext';

export default function DashboardHome() {
  const { user, currentTenant } = useAuth();
  const [copiedKey, setCopiedKey] = useState(false);

  // Strict role isolation: Superadmin authority belongs in secret gateway console
  if (user?.role === 'admin') {
    return <Navigate to="/orbit-i-master-gateway/console" replace />;
  }

  const [stats, setStats] = useState<any>(null);
  const [recentEvents, setRecentEvents] = useState<any[]>([]);
  const [activities, setActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, eventsRes, actRes] = await Promise.allSettled([
          api.stats.getOverview(),
          api.events.list({ limit: 4 }),
          api.activity.get({ limit: 5 })
        ]);

        if (statsRes.status === 'fulfilled' && statsRes.value.success) {
          setStats(statsRes.value.stats);
        }
        if (eventsRes.status === 'fulfilled' && eventsRes.value.success) {
          setRecentEvents(eventsRes.value.events || []);
        }
        if (actRes.status === 'fulfilled' && actRes.value.success) {
          setActivities(actRes.value.activities || []);
        }
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const totalEvents = stats?.totalEvents ?? 0;
  const totalAttendees = stats?.totalAttendees ?? 0;
  const totalRevenue = stats?.totalRevenue ? `$${Number(stats.totalRevenue).toLocaleString()}` : '$0';
  const activeNow = stats?.activeUpcoming ?? 0;

  const statCards = [
    { title: "Total Events", value: totalEvents.toString(), change: totalEvents > 0 ? "Published on Platform" : "No events created yet", icon: Calendar, trend: "up" as const },
    { title: "Attendees Registered", value: totalAttendees.toLocaleString(), change: totalAttendees > 0 ? "Confirmed participants" : "Awaiting first registration", icon: Users, trend: "up" as const },
    { title: "Total Revenue", value: totalRevenue, change: totalRevenue !== '$0' ? "Gross ticket volume" : "No ticket sales yet", icon: DollarSign, trend: "up" as const },
    { title: "Upcoming Events", value: activeNow.toString(), change: "Active in queue", icon: TrendingUp, trend: "up" as const },
  ];

  return (
    <div className="pb-12">
      <Header title="Dashboard Overview" />

      <div className="p-6 space-y-6">
        {/* Pending Plan Approval Alert (Shown when client has submitted a paid plan upgrade) */}
        {currentTenant?.status === 'pending_approval' && (
          <div className="bg-amber-50 border border-amber-300 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xs animate-in fade-in">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center font-bold shrink-0">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-amber-950 text-sm">
                  {currentTenant.plan || 'Subscription'} Upgrade Pending SuperAdmin Approval
                </h4>
                <p className="text-xs text-amber-800">
                  Your plan payment has been submitted to Eventrye HQ. Free Starter limits remain active until the master authority confirms your access.
                </p>
              </div>
            </div>
            <Link to="/dashboard/billing">
              <Button size="sm" variant="outline" className="border-amber-400 text-amber-900 hover:bg-amber-100 text-xs font-bold rounded-xl shrink-0">
                View Invoice Status
              </Button>
            </Link>
          </div>
        )}
        {/* Welcome Banner */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#7c3aed] via-[#6d28d9] to-[#4c1d95] p-8 text-white shadow-xl shadow-[#7c3aed]/15">
          <div className="relative z-10 max-w-2xl space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              Eventrye Enterprise Cloud
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Welcome back, {user?.fullName || "Organizer"}!
            </h1>
            <p className="text-sm text-purple-100/90 leading-relaxed">
              {totalEvents > 0 
                ? `Your events are running smoothly. You have ${activeNow} active upcoming events and ${totalAttendees.toLocaleString()} registered attendees ready for check-in.`
                : "Your client organization workspace is ready. Launch your first event or seminar to start receiving attendee registrations and generating live ID passes."
              }
            </p>
            <div className="pt-2 flex flex-wrap items-center gap-3">
              <Link to="/dashboard/events">
                <Button className="bg-white text-[#7c3aed] hover:bg-purple-50 font-semibold rounded-xl shadow-md h-10 px-5 text-sm">
                  <Plus className="w-4 h-4 mr-1.5" />
                  Manage Events
                </Button>
              </Link>
              <Link to="/dashboard/statistics">
                <button className="border-2 border-white/50 bg-white/15 !text-white hover:bg-white/25 hover:border-white font-semibold rounded-xl h-10 px-5 text-sm transition-all shadow-sm backdrop-blur-md flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-white shrink-0" />
                  <span className="text-white font-semibold">View Analytics</span>
                </button>
              </Link>
            </div>
          </div>
          {/* Subtle background glow */}
          <div className="absolute right-0 top-0 -mr-20 -mt-20 w-80 h-80 rounded-full bg-purple-400/20 blur-3xl pointer-events-none" />
        </div>

        {/* Active Organization License Key & Resource Quota Tracking Widget */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#1d4ed8] flex items-center justify-center font-bold">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-800">Workspace Activation License:</span>
                <span className="text-xs font-mono font-bold text-[#1d4ed8] bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200">
                  {currentTenant?.license_key || 'EVX-ACT-9821-4402-1109'}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(currentTenant?.license_key || 'EVX-ACT-9821-4402-1109');
                    setCopiedKey(true);
                    setTimeout(() => setCopiedKey(false), 2000);
                  }}
                  className="text-[11px] text-slate-500 hover:text-blue-600 flex items-center gap-1 font-semibold"
                  title="Copy License Key"
                >
                  <Copy className="w-3.5 h-3.5" />
                  {copiedKey ? 'Copied' : 'Copy'}
                </button>
              </div>
              <p className="text-[11px] text-slate-500">
                Tier: <strong className="text-slate-800">{currentTenant?.plan || 'Professional'}</strong> • Status: <span className="text-emerald-700 font-bold">Licensed &amp; Active</span> • Tracked by Platform Authority (ORBIT-I)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs">
            <div className="text-right">
              <span className="text-[10px] text-slate-400 font-bold uppercase block">Resource Quotas</span>
              <span className="font-bold text-slate-700">
                {totalEvents} / {currentTenant?.max_events || 25} Events • {totalAttendees.toLocaleString()} / {(currentTenant?.max_attendees || 5000).toLocaleString()} Attendees
              </span>
            </div>
            <Link to="/dashboard/billing">
              <Button size="sm" variant="outline" className="rounded-xl text-xs h-8">
                Plan Details
              </Button>
            </Link>
          </div>
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {statCards.map((stat) => (
            <StatCard key={stat.title} {...stat} />
          ))}
        </div>

        {/* Events & Recent Activity Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Column: Recent Events (2 cols) */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="border-[#e9e4ff] shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between pb-3 border-b border-[#e9e4ff]/60">
                <div>
                  <CardTitle className="text-lg font-bold text-[#0f172a]">Active Events</CardTitle>
                  <p className="text-xs text-[#64748b] mt-0.5">Your most recent live and upcoming events</p>
                </div>
                <Link 
                  to="/dashboard/events" 
                  className="text-xs font-semibold text-[#7c3aed] hover:text-[#6d28d9] flex items-center gap-1 group"
                >
                  View All Events
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                </Link>
              </CardHeader>
              <CardContent className="p-0">
                {loading ? (
                  <div className="p-8 text-center text-sm text-[#64748b]">
                    <div className="w-6 h-6 border-2 border-[#7c3aed] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                    Loading your events...
                  </div>
                ) : recentEvents.length === 0 ? (
                  <div className="p-8 text-center text-sm text-[#64748b]">
                    No events created yet. Click "+ Manage Events" above to get started.
                  </div>
                ) : (
                  <div className="divide-y divide-[#e9e4ff]">
                    {recentEvents.map((ev) => {
                      const capacity = ev.capacity || 500;
                      const registered = ev.registered_count || 0;
                      const percent = Math.min(100, Math.round((registered / capacity) * 100));

                      return (
                        <div key={ev.id} className="p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:bg-[#faf8ff] transition-colors">
                          <div className="space-y-1.5 flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <Badge className="bg-[#f5f3ff] text-[#7c3aed] border border-[#ddd6fe] text-[11px] font-semibold">
                                {ev.category}
                              </Badge>
                              <span className="text-xs text-[#94a3b8]">
                                {ev.start_date ? new Date(ev.start_date).toLocaleDateString() : 'Date TBA'}
                              </span>
                            </div>
                            <h4 className="font-bold text-[#0f172a] text-sm truncate">
                              {ev.title}
                            </h4>
                            <div className="flex items-center gap-4 text-xs text-[#64748b]">
                              <span className="flex items-center gap-1 truncate">
                                <MapPin className="w-3.5 h-3.5 text-[#7c3aed]" />
                                {ev.venue_name || 'Virtual Event'}
                              </span>
                              <span className="flex items-center gap-1">
                                <Ticket className="w-3.5 h-3.5 text-[#7c3aed]" />
                                {ev.price ? `$${ev.price}` : 'Free'}
                              </span>
                            </div>
                          </div>

                          <div className="w-full sm:w-44 space-y-1 shrink-0">
                            <div className="flex justify-between text-xs font-semibold">
                              <span className="text-[#64748b]">Registration</span>
                              <span className="text-[#0f172a]">{registered} / {capacity}</span>
                            </div>
                            <Progress value={percent} className="h-1.5 bg-[#e9e4ff]" />
                          </div>

                          <Link to="/dashboard/events">
                            <Button size="sm" variant="ghost" className="text-xs text-[#7c3aed] hover:bg-[#f5f3ff]">
                              Manage
                            </Button>
                          </Link>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Side Column: Recent Activities (1 col) */}
          <div className="space-y-6">
            <Card className="border-[#e9e4ff] shadow-sm">
              <CardHeader className="pb-3 border-b border-[#e9e4ff]/60">
                <CardTitle className="text-lg font-bold text-[#0f172a]">Recent Activity</CardTitle>
                <p className="text-xs text-[#64748b]">Live logs from your account</p>
              </CardHeader>
              <CardContent className="p-4 space-y-4">
                {activities.length === 0 ? (
                  <p className="text-xs text-[#94a3b8] text-center py-4">No recent activity logged</p>
                ) : (
                  activities.slice(0, 5).map((act, index) => (
                    <div key={index} className="flex items-start gap-3">
                      <div className="w-7 h-7 rounded-lg bg-[#f5f3ff] text-[#7c3aed] flex items-center justify-center shrink-0 mt-0.5">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold text-[#0f172a] truncate">{act.action}</p>
                        <p className="text-[11px] text-[#64748b] line-clamp-1">{act.detail}</p>
                        <span className="text-[10px] text-[#94a3b8]">{act.created_at ? new Date(act.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Just now'}</span>
                      </div>
                    </div>
                  ))
                )}
                <div className="pt-2 border-t border-[#e9e4ff]">
                  <Link 
                    to="/dashboard/activity" 
                    className="block text-center text-xs font-semibold text-[#7c3aed] hover:underline"
                  >
                    View All Audit Logs →
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}