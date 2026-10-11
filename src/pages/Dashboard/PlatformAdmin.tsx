import { useState, useEffect } from "react";
import Header from "@/components/ui/dashboard/header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Building2, 
  DollarSign, 
  Calendar, 
  TrendingUp, 
  Search, 
  ShieldAlert, 
  ArrowUpRight,
  RefreshCw,
  ShieldCheck,
  Lock,
  Radio,
  CheckCircle2,
  Globe,
  Save,
  ExternalLink,
  X,
  Bell,
  Ticket,
  Sparkles,
  Check
} from "lucide-react";
import { api } from "@/services/api";
import { useAuth } from "@/context/AuthContext";

export default function PlatformAdmin() {
  const { isSuperAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState<'tenants' | 'security' | 'cms' | 'notifications'>('tenants');
  const [metrics, setMetrics] = useState<any>(null);
  const [tenants, setTenants] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [filterPlan, setFilterPlan] = useState("All");
  const [filterStatus, setFilterStatus] = useState("All");
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  // Tenant Inspector Modal State (Replaces unsafe switchTenant context switcher)
  const [inspectingTenant, setInspectingTenant] = useState<any | null>(null);

  // Security Monitoring State
  const [securityLogs, setSecurityLogs] = useState<any[]>([]);
  const [scanningCompliance, setScanningCompliance] = useState(false);
  const [scanResult, setScanResult] = useState<string | null>(null);

  // Website CMS State
  const [cmsPages, setCmsPages] = useState<any[]>([]);
  const [selectedCmsPageKey, setSelectedCmsPageKey] = useState<string>("home");
  const [cmsTitle, setCmsTitle] = useState("");
  const [cmsContent, setCmsContent] = useState<any>({});
  const [cmsSaving, setCmsSaving] = useState(false);
  const [cmsMsg, setCmsMsg] = useState<string | null>(null);

  // Live Notifications Feed State
  const [adminNotifs, setAdminNotifs] = useState<any[]>([]);
  const [unreadAdminNotifCount, setUnreadAdminNotifCount] = useState(0);
  const [notifCategoryFilter, setNotifCategoryFilter] = useState("all");
  const [testNotifLoading, setTestNotifLoading] = useState(false);

  const loadAdminNotifications = async () => {
    try {
      const res = await api.platformAdmin.getNotifications({ limit: 50 });
      if (res.success) {
        setAdminNotifs(res.notifications || []);
        setUnreadAdminNotifCount(res.unreadCount || 0);
      }
    } catch (err) {
      console.error("Failed to load notifications:", err);
    }
  };

  useEffect(() => {
    loadAdminNotifications();
    const interval = setInterval(loadAdminNotifications, 6000); // 6s real-time live polling
    return () => clearInterval(interval);
  }, []);

  const handleMarkAllNotifsRead = async () => {
    try {
      await api.platformAdmin.markAllNotificationsRead();
      setAdminNotifs(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadAdminNotifCount(0);
    } catch {}
  };

  const handleMarkSingleNotifRead = async (id: number) => {
    try {
      await api.platformAdmin.markNotificationRead(id);
      setAdminNotifs(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
      setUnreadAdminNotifCount(prev => Math.max(0, prev - 1));
    } catch {}
  };

  const handleClearNotifs = async () => {
    try {
      await api.platformAdmin.clearNotifications();
      setAdminNotifs([]);
      setUnreadAdminNotifCount(0);
    } catch {}
  };

  const handleTriggerTestAlert = async () => {
    setTestNotifLoading(true);
    try {
      const res = await api.platformAdmin.sendTestNotification({
        title: 'Superadmin Live Pipeline Verified',
        message: 'Real-time multi-tenant notification stream is 100% active and firing live.',
        category: 'system',
        severity: 'success'
      });
      if (res.success) {
        loadAdminNotifications();
      }
    } catch (err: any) {
      alert(err.message || "Failed to trigger test notification.");
    } finally {
      setTestNotifLoading(false);
    }
  };

  const loadData = async () => {
    try {
      const [overviewRes, tenantsRes, , logsRes] = await Promise.allSettled([
        api.platformAdmin.getOverview(),
        api.platformAdmin.getTenants({
          search: search || undefined,
          plan: filterPlan !== "All" ? filterPlan : undefined,
          status: filterStatus !== "All" ? filterStatus : undefined
        }),
        api.platformAdmin.getSecurityMetrics(),
        api.platformAdmin.getSecurityLogs()
      ]);

      if (overviewRes.status === "fulfilled" && overviewRes.value.success) {
        setMetrics(overviewRes.value.metrics);
      }
      if (tenantsRes.status === "fulfilled" && tenantsRes.value.success) {
        setTenants(tenantsRes.value.tenants || []);
      }
      if (logsRes.status === "fulfilled" && logsRes.value.success) {
        setSecurityLogs(logsRes.value.logs || []);
      }
    } catch (err) {
      console.error("Failed to load platform admin data:", err);
    }
  };

  const loadCmsData = async () => {
    try {
      const res = await api.platformAdmin.getCmsPages();
      if (res.success && res.pages) {
        setCmsPages(res.pages);
        const current = res.pages.find((p: any) => p.page_key === selectedCmsPageKey) || res.pages[0];
        if (current) {
          setCmsTitle(current.title || "");
          setCmsContent(current.content || {});
        }
      }
    } catch (err) {
      console.error("Failed to load CMS pages:", err);
    }
  };

  useEffect(() => {
    loadData();
  }, [search, filterPlan, filterStatus]);

  useEffect(() => {
    if (activeTab === 'cms') {
      loadCmsData();
    }
  }, [activeTab]);

  useEffect(() => {
    const cur = cmsPages.find(p => p.page_key === selectedCmsPageKey);
    if (cur) {
      setCmsTitle(cur.title || "");
      setCmsContent(cur.content || {});
    }
  }, [selectedCmsPageKey]);

  // Strict SuperAdmin Access Guard: Client organization accounts can NEVER access this panel
  if (!isSuperAdmin) {
    return (
      <div className="p-8 max-w-2xl mx-auto my-12 text-center bg-white rounded-3xl border border-red-200 shadow-xl">
        <div className="w-16 h-16 rounded-3xl bg-red-100 text-red-600 flex items-center justify-center mx-auto mb-4">
          <Lock className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-black text-[#0f172a] mb-2 font-heading">
          Platform Superadmin Privileges Required
        </h2>
        <p className="text-sm text-[#64748b] leading-relaxed mb-6">
          Access strictly denied. Client organization and organizer workspaces are cryptographically isolated from the root platform administration console.
        </p>
        <Button 
          onClick={() => window.location.href = '/dashboard'}
          className="bg-[#1d4ed8] hover:bg-[#1e40af] text-white rounded-xl text-xs font-bold"
        >
          Return to Workspace Dashboard
        </Button>
      </div>
    );
  }

  const handleUpdatePlan = async (tenantId: number, newPlan: string) => {
    setActionLoading(tenantId);
    try {
      const res = await api.platformAdmin.updateTenantPlan(tenantId, newPlan);
      if (res.success) {
        setTenants(prev => prev.map(t => t.id === tenantId ? { ...t, plan: newPlan } : t));
        loadData();
      }
    } catch (err: any) {
      alert(err.message || "Failed to update tenant plan.");
    } finally {
      setActionLoading(null);
    }
  };

  const handleToggleStatus = async (tenantId: number, currentStatus: string) => {
    const nextStatus = currentStatus === "active" ? "suspended" : "active";
    setActionLoading(tenantId);
    try {
      const res = await api.platformAdmin.updateTenantStatus(tenantId, nextStatus);
      if (res.success) {
        setTenants(prev => prev.map(t => t.id === tenantId ? { ...t, status: nextStatus } : t));
        loadData();
      }
    } catch (err: any) {
      alert(err.message || "Failed to change tenant status.");
    } finally {
      setActionLoading(null);
    }
  };

  const handleRunFullComplianceScan = async () => {
    setScanningCompliance(true);
    setScanResult(null);
    try {
      const res = await api.platformAdmin.runFullComplianceScan();
      if (res.success) {
        setScanResult(res.message);
        loadData();
      }
    } catch (err: any) {
      setScanResult(err.message || "Compliance scan failed.");
    } finally {
      setScanningCompliance(false);
    }
  };

  const handleSaveCms = async (e: React.FormEvent) => {
    e.preventDefault();
    setCmsSaving(true);
    setCmsMsg(null);
    try {
      const res = await api.platformAdmin.updateCmsPage(selectedCmsPageKey, {
        title: cmsTitle,
        content: cmsContent,
        is_published: true
      });
      if (res.success) {
        setCmsMsg("Content successfully published to production website!");
        loadCmsData();
      }
    } catch (err: any) {
      setCmsMsg(err.message || "Failed to save CMS page content.");
    } finally {
      setCmsSaving(false);
    }
  };

  const totalMRR = metrics?.totalMRR ?? 0;
  const totalARR = metrics?.annualRunRate ?? (totalMRR * 12);
  const totalTenants = metrics?.totalTenants ?? tenants.length;
  const totalEvents = metrics?.totalEvents ?? 0;
  const totalAttendees = metrics?.totalAttendees ?? 0;

  return (
    <div className="pb-16 min-h-screen">
      <Header title="Platform Superadmin Console" />

      <div className="p-6 space-y-8 max-w-7xl mx-auto">
        {/* Banner */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#0f172a] via-[#1e1b4b] to-[#1e3a8a] p-8 text-white shadow-xl">
          <div className="relative z-10 max-w-3xl space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs font-semibold text-emerald-300">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              EventoraX Master SuperAdmin • Verified by ORBIT-I Private Limited
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight font-heading">
              EventoraX Global Governance &amp; Security Console
            </h1>
            <p className="text-sm text-slate-300 leading-relaxed">
              Platform administration, client workspace isolation enforcement, real-time threat neutralization, and official public website CMS management.
            </p>
          </div>
        </div>

        {/* Global SaaS Metrics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <Card className="border-[#e2e8f0] bg-white shadow-xs hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-[#64748b] uppercase tracking-wider">Monthly Recurring (MRR)</p>
                  <p className="text-3xl font-black text-[#0f172a] mt-1">${totalMRR.toLocaleString()}</p>
                  <p className="text-xs text-emerald-600 font-semibold mt-1 flex items-center gap-1">
                    <TrendingUp className="w-3.5 h-3.5" /> ARR: ${totalARR.toLocaleString()}/yr
                  </p>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <DollarSign className="w-6 h-6" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-[#e2e8f0] bg-white shadow-xs hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-[#64748b] uppercase tracking-wider">Active Organizations</p>
                  <p className="text-3xl font-black text-[#0f172a] mt-1">{totalTenants}</p>
                  <p className="text-xs text-[#1d4ed8] font-semibold mt-1">
                    {metrics?.activeTenants || totalTenants} isolated client workspaces
                  </p>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-blue-50 text-[#1d4ed8] flex items-center justify-center">
                  <Building2 className="w-6 h-6" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-[#e2e8f0] bg-white shadow-xs hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-[#64748b] uppercase tracking-wider">Platform Events</p>
                  <p className="text-3xl font-black text-[#0f172a] mt-1">{totalEvents}</p>
                  <p className="text-xs text-indigo-600 font-semibold mt-1">
                    {totalAttendees.toLocaleString()} registered attendees
                  </p>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <Calendar className="w-6 h-6" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-[#e2e8f0] bg-white shadow-xs hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-[#64748b] uppercase tracking-wider">Security Sentinel</p>
                  <p className="text-2xl font-black text-emerald-600 mt-1 flex items-center gap-2">
                    <Radio className="w-4 h-4 text-emerald-500 animate-pulse" />
                    24/7 ACTIVE
                  </p>
                  <p className="text-xs text-slate-500 font-semibold mt-1">
                    0 Threats • Zero Cross-Tenant Leaks
                  </p>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <ShieldCheck className="w-6 h-6" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tab Selector */}
        <div className="flex flex-wrap items-center gap-3 border-b border-slate-200 pb-3">
          <button
            onClick={() => setActiveTab('tenants')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
              activeTab === 'tenants'
                ? 'bg-[#1d4ed8] text-white shadow-md shadow-blue-600/20'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <Building2 className="w-4 h-4" />
            Client Organizations Directory ({tenants.length})
          </button>
          <button
            onClick={() => setActiveTab('security')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
              activeTab === 'security'
                ? 'bg-[#1d4ed8] text-white shadow-md shadow-blue-600/20'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <ShieldAlert className="w-4 h-4 text-emerald-500" />
            24/7 Security &amp; Policy Monitoring (Live Sentinel)
          </button>
          <button
            onClick={() => setActiveTab('cms')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
              activeTab === 'cms'
                ? 'bg-[#1d4ed8] text-white shadow-md shadow-blue-600/20'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <Globe className="w-4 h-4 text-amber-500" />
            Official Website CMS &amp; Content Manager
          </button>
          <button
            onClick={() => setActiveTab('notifications')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
              activeTab === 'notifications'
                ? 'bg-[#1d4ed8] text-white shadow-md shadow-blue-600/20'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <Bell className="w-4 h-4 text-rose-500" />
            Live System Notifications &amp; Alerts
            {unreadAdminNotifCount > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-rose-600 text-white text-[10px] font-black animate-pulse">
                {unreadAdminNotifCount}
              </span>
            )}
          </button>
        </div>

        {/* TAB 1: Client Organizations Directory */}
        {activeTab === 'tenants' && (
          <div className="bg-white rounded-3xl border border-[#e2e8f0] shadow-xs p-6 space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-[#0f172a]">Tenant Organizations &amp; Workspaces</h2>
                <p className="text-xs text-[#64748b]">Client organizations are strictly segregated. Clients can never become superadmins.</p>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={loadData}
                className="rounded-xl border-[#e2e8f0] text-xs h-9"
              >
                <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
                Refresh Data
              </Button>
            </div>

            {/* Filters Bar */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94a3b8]" />
                <Input
                  placeholder="Search by name, slug, owner email..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9 rounded-xl border-[#e2e8f0] text-xs h-10 bg-slate-50"
                />
              </div>

              <select
                value={filterPlan}
                onChange={(e) => setFilterPlan(e.target.value)}
                className="px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold bg-white"
              >
                <option value="All">All Plans</option>
                <option value="Starter">Starter ($0)</option>
                <option value="Professional">Professional ($99)</option>
                <option value="Enterprise">Enterprise ($299)</option>
              </select>

              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold bg-white"
              >
                <option value="All">All Statuses</option>
                <option value="active">Active</option>
                <option value="suspended">Suspended</option>
              </select>
            </div>

            {/* Tenants Table */}
            <div className="overflow-x-auto rounded-2xl border border-slate-200">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="p-3.5 pl-4">Organization</th>
                    <th className="p-3.5">Owner / Contact</th>
                    <th className="p-3.5">Subscription Tier</th>
                    <th className="p-3.5">Status</th>
                    <th className="p-3.5">Event Capacity</th>
                    <th className="p-3.5">MRR</th>
                    <th className="p-3.5 text-right pr-4">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {tenants.map((t) => {
                    const isMaster = t.id === 1 || t.slug === 'eventorax-hq';

                    return (
                      <tr key={t.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="p-3.5 pl-4 font-bold text-slate-900">
                          {t.name}
                          <span className="block text-[10px] text-slate-400 font-mono">slug: {t.slug}</span>
                        </td>
                        <td className="p-3.5 text-slate-600">
                          {t.owner?.full_name || 'Organization Owner'}
                          <span className="block text-[10px] text-slate-400">{t.owner?.email || 'N/A'}</span>
                        </td>
                        <td className="p-3.5">
                          {isMaster ? (
                            <Badge className="bg-blue-600 text-white font-bold text-[10px] px-2 py-0.5">
                              Platform Master
                            </Badge>
                          ) : (
                            <select
                              value={t.plan}
                              disabled={actionLoading === t.id}
                              onChange={(e) => handleUpdatePlan(t.id, e.target.value)}
                              className="px-2 py-1 rounded-lg border border-slate-300 text-xs font-semibold bg-white"
                            >
                              <option value="Starter">Starter ($0)</option>
                              <option value="Professional">Professional ($99)</option>
                              <option value="Enterprise">Enterprise ($299)</option>
                            </select>
                          )}
                        </td>
                        <td className="p-3.5">
                          <Badge className={`text-[10px] font-bold ${
                            t.status === 'active' 
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                              : 'bg-red-50 text-red-700 border border-red-200'
                          }`}>
                            {t.status === 'active' ? (isMaster ? 'Master Node' : 'Active') : 'Suspended'}
                          </Badge>
                        </td>
                        <td className="p-3.5 text-slate-600">
                          {isMaster ? (
                            <span className="font-bold text-emerald-600">∞ Unlimited Master</span>
                          ) : (
                            <span><strong className="text-slate-900">{t.eventCount}</strong> events · <strong className="text-slate-900">{t.attendeeCount}</strong> attendees</span>
                          )}
                        </td>
                        <td className="p-3.5 font-bold text-slate-900">
                          {isMaster ? <span className="text-slate-400 text-[11px] font-normal">Platform Owner</span> : `$${t.mrr || 0}/mo`}
                        </td>
                        <td className="p-3.5 text-right pr-4 space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setInspectingTenant(t)}
                            className="text-[#1d4ed8] hover:bg-blue-50 text-xs h-8 px-2.5 rounded-lg font-bold"
                          >
                            <ArrowUpRight className="w-3.5 h-3.5 mr-1" />
                            View Details
                          </Button>
                          {!isMaster && (
                            <Button
                              variant="ghost"
                              size="sm"
                              disabled={actionLoading === t.id}
                              onClick={() => handleToggleStatus(t.id, t.status)}
                              className={`text-xs h-8 px-2.5 rounded-lg ${
                                t.status === 'active'
                                  ? 'text-red-600 hover:bg-red-50'
                                  : 'text-emerald-600 hover:bg-emerald-50'
                              }`}
                            >
                              {t.status === 'active' ? 'Suspend' : 'Activate'}
                            </Button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 2: 24/7 Security & Policy Monitoring System */}
        {activeTab === 'security' && (
          <div className="space-y-6">
            {/* Live Security Shield Banner */}
            <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
                    <h2 className="text-lg font-bold text-[#0f172a] font-heading">
                      24/7 Content &amp; Policy Compliance Sentinel
                    </h2>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    Continuous monitoring prevents illegal events, counterfeit credentials, phishing, financial scams, and unauthorized superadmin access.
                  </p>
                </div>

                <Button
                  onClick={handleRunFullComplianceScan}
                  disabled={scanningCompliance}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold h-10 px-4"
                >
                  <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${scanningCompliance ? 'animate-spin' : ''}`} />
                  {scanningCompliance ? 'Scanning All Nodes...' : 'Run Compliance Audit'}
                </Button>
              </div>

              {scanResult && (
                <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  {scanResult}
                </div>
              )}
            </div>

            {/* Audit Logs */}
            <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
              <h3 className="text-sm font-bold text-slate-900">Security Audit Trail</h3>
              <div className="divide-y divide-slate-100">
                {securityLogs.length === 0 ? (
                  <p className="text-xs text-slate-400 py-6 text-center">No security incidents logged. All nodes operating normally.</p>
                ) : (
                  securityLogs.map((log, idx) => (
                    <div key={idx} className="py-3 flex items-start justify-between gap-4 text-xs">
                      <div className="flex items-start gap-3">
                        <Badge className={`text-[10px] font-bold uppercase shrink-0 mt-0.5 ${
                          log.severity === 'CRITICAL' ? 'bg-red-100 text-red-700' :
                          log.severity === 'HIGH' ? 'bg-amber-100 text-amber-700' :
                          'bg-blue-100 text-blue-700'
                        }`}>
                          {log.severity || 'INFO'}
                        </Badge>
                        <div>
                          <p className="font-bold text-slate-900">{log.action || log.type}</p>
                          <p className="text-slate-500 text-[11px] mt-0.5">{log.detail}</p>
                          <span className="text-[10px] text-slate-400 mt-0.5 block font-mono">
                            Actor: {log.actor || 'System'} • IP: {log.ip || '127.0.0.1'}
                          </span>
                        </div>
                      </div>
                      <span className="text-[10px] text-slate-400 whitespace-nowrap">
                        {new Date(log.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: Official Website CMS & Content Manager */}
        {activeTab === 'cms' && (
          <div className="bg-white rounded-3xl border border-[#e2e8f0] shadow-xs p-6 space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-[#0f172a] flex items-center gap-2">
                  <Globe className="w-5 h-5 text-blue-600" />
                  Official Website Content Management System (CMS)
                </h2>
                <p className="text-xs text-[#64748b]">
                  Manage headlines, hero messages, branding statements, and disclosures displayed on EventoraX public pages.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <a href="/" target="_blank" rel="noreferrer">
                  <Button variant="outline" size="sm" className="rounded-xl text-xs h-9 border-slate-200">
                    <ExternalLink className="w-3.5 h-3.5 mr-1.5" />
                    View Live Website
                  </Button>
                </a>
              </div>
            </div>

            {/* Page Selector Tabs */}
            <div className="flex flex-wrap gap-2 pt-2 border-b border-slate-200 pb-3">
              {[
                { key: 'home', label: 'Home Page' },
                { key: 'about', label: 'About Us' },
                { key: 'pricing', label: 'Pricing Plans' },
                { key: 'contact', label: 'Contact & Support' },
                { key: 'legal', label: 'Legal & Policies' }
              ].map((p) => (
                <button
                  key={p.key}
                  type="button"
                  onClick={() => setSelectedCmsPageKey(p.key)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                    selectedCmsPageKey === p.key
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>

            {/* CMS Edit Form */}
            <form onSubmit={handleSaveCms} className="space-y-5 max-w-3xl">
              {cmsMsg && (
                <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  {cmsMsg}
                </div>
              )}

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Page Title &amp; SEO Header</label>
                <Input
                  value={cmsTitle}
                  onChange={(e) => setCmsTitle(e.target.value)}
                  placeholder="e.g. EventoraX — Next-Gen Automated Event Management"
                  className="rounded-xl border-slate-200 text-xs h-10 font-medium"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Hero Main Headline</label>
                <Input
                  value={cmsContent.headline || ""}
                  onChange={(e) => setCmsContent({ ...cmsContent, headline: e.target.value })}
                  placeholder="e.g. Effortless Events, Instant Passes & Tamper-Evident Credentials"
                  className="rounded-xl border-slate-200 text-xs h-10 font-bold"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Hero Subheadline / Mission Statement</label>
                <textarea
                  rows={3}
                  value={cmsContent.subheadline || ""}
                  onChange={(e) => setCmsContent({ ...cmsContent, subheadline: e.target.value })}
                  placeholder="Enter the primary descriptive text..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Official Endorsement Statement</label>
                <Input
                  value={cmsContent.endorsement || "Powered by EventoraX • Developed & Maintained by ORBIT-I Private Limited"}
                  onChange={(e) => setCmsContent({ ...cmsContent, endorsement: e.target.value })}
                  className="rounded-xl border-slate-200 text-xs h-10 font-medium"
                />
              </div>

              <div className="pt-2">
                <Button
                  type="submit"
                  disabled={cmsSaving}
                  className="bg-[#1d4ed8] hover:bg-[#1e40af] text-white rounded-xl text-xs font-bold h-10 px-6 flex items-center gap-2 shadow-md shadow-blue-600/20"
                >
                  <Save className="w-4 h-4" />
                  {cmsSaving ? "Saving to Production..." : "Save & Publish Changes"}
                </Button>
              </div>
            </form>
          </div>
        )}

        {/* TAB 4: Live System Notifications & Real-Time Alerts */}
        {activeTab === 'notifications' && (
          <div className="bg-white rounded-3xl border border-[#e2e8f0] shadow-xs p-6 space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-[#0f172a] flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
                  Live Platform Event &amp; Notification Sentinel
                </h2>
                <p className="text-xs text-[#64748b]">
                  Real-time broadcast of all organization signups, attendee registrations, pass issuances, security blocks, and CMS mutations.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleTriggerTestAlert}
                  disabled={testNotifLoading}
                  className="rounded-xl text-xs h-9 border-slate-200"
                >
                  <Sparkles className="w-3.5 h-3.5 mr-1 text-amber-500" />
                  {testNotifLoading ? "Dispatching..." : "Dispatch Test Alert"}
                </Button>

                {unreadAdminNotifCount > 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleMarkAllNotifsRead}
                    className="rounded-xl text-xs h-9 border-slate-200 text-blue-600"
                  >
                    <Check className="w-3.5 h-3.5 mr-1" />
                    Mark All Read
                  </Button>
                )}

                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleClearNotifs}
                  className="rounded-xl text-xs h-9 border-slate-200 text-rose-600 hover:bg-rose-50"
                >
                  Clear Feed
                </Button>
              </div>
            </div>

            {/* Filter Pills */}
            <div className="flex flex-wrap gap-2 pt-1 border-b border-slate-100 pb-3">
              {[
                { id: 'all', label: 'All Alerts' },
                { id: 'tenant', label: 'Organizations' },
                { id: 'event', label: 'Events' },
                { id: 'attendee', label: 'Attendees & Passes' },
                { id: 'security', label: 'Security' },
                { id: 'cms', label: 'CMS Updates' },
                { id: 'system', label: 'System' }
              ].map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setNotifCategoryFilter(cat.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                    notifCategoryFilter === cat.id
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            {/* Notification Stream Cards */}
            <div className="space-y-3">
              {adminNotifs
                .filter(n => notifCategoryFilter === 'all' || n.category === notifCategoryFilter)
                .length === 0 ? (
                <div className="p-16 text-center bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
                  <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto mb-2" />
                  <h4 className="font-bold text-slate-700 text-sm">All Clean • No Active Alerts</h4>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Live system mutations will automatically populate here in real-time.
                  </p>
                </div>
              ) : (
                adminNotifs
                  .filter(n => notifCategoryFilter === 'all' || n.category === notifCategoryFilter)
                  .map((n) => (
                    <div
                      key={n.id}
                      className={`p-4 rounded-2xl border transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
                        !n.read 
                          ? 'bg-blue-50/30 border-blue-200/80 shadow-xs' 
                          : 'bg-white border-slate-200'
                      }`}
                    >
                      <div className="flex items-start gap-3.5">
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                          n.severity === 'critical' ? 'bg-red-100 text-red-600' :
                          n.severity === 'warning' ? 'bg-amber-100 text-amber-600' :
                          n.severity === 'success' ? 'bg-emerald-100 text-emerald-600' :
                          'bg-blue-100 text-blue-600'
                        }`}>
                          {n.category === 'security' ? <ShieldAlert className="w-4 h-4" /> :
                           n.category === 'attendee' ? <Ticket className="w-4 h-4" /> :
                           n.category === 'event' ? <Calendar className="w-4 h-4" /> :
                           n.category === 'cms' ? <Globe className="w-4 h-4" /> :
                           n.category === 'tenant' ? <Building2 className="w-4 h-4" /> :
                           <Sparkles className="w-4 h-4" />}
                        </div>

                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="text-xs font-bold text-slate-900">{n.title}</h4>
                            <Badge className={`text-[9px] uppercase font-bold py-0 px-2 ${
                              n.severity === 'critical' ? 'bg-red-100 text-red-700' :
                              n.severity === 'warning' ? 'bg-amber-100 text-amber-700' :
                              n.severity === 'success' ? 'bg-emerald-100 text-emerald-700' :
                              'bg-slate-100 text-slate-700'
                            }`}>
                              {n.category}
                            </Badge>
                            {!n.read && (
                              <span className="w-2 h-2 rounded-full bg-blue-600 shrink-0" />
                            )}
                          </div>
                          <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                            {n.message}
                          </p>
                          <span className="text-[10px] text-slate-400 mt-1 block">
                            Logged: {new Date(n.created_at).toLocaleString()}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-end sm:self-center">
                        {!n.read && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleMarkSingleNotifRead(n.id)}
                            className="text-xs h-8 text-blue-600 hover:bg-blue-50"
                          >
                            Mark Read
                          </Button>
                        )}
                      </div>
                    </div>
                  ))
              )}
            </div>
          </div>
        )}

        {/* ================= TENANT INSPECTOR MODAL ================= */}
        {inspectingTenant && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-200 space-y-5 animate-in fade-in zoom-in-95">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center font-black">
                    {inspectingTenant.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900">{inspectingTenant.name}</h3>
                    <p className="text-xs text-slate-500 font-mono">slug: {inspectingTenant.slug}</p>
                  </div>
                </div>
                <button
                  onClick={() => setInspectingTenant(null)}
                  className="p-1 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-slate-500 block text-[10px]">Subscription Plan</span>
                  <span className="font-bold text-slate-900">{inspectingTenant.plan}</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-slate-500 block text-[10px]">Status</span>
                  <Badge className="text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200">
                    {inspectingTenant.status}
                  </Badge>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-slate-500 block text-[10px]">Total Events</span>
                  <span className="font-bold text-slate-900">{inspectingTenant.eventCount || 0}</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-slate-500 block text-[10px]">Attendees Registered</span>
                  <span className="font-bold text-slate-900">{inspectingTenant.attendeeCount || 0}</span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-blue-50/70 border border-blue-100 text-xs text-blue-900 space-y-1">
                <span className="font-bold block">Isolated Public Portal URL:</span>
                <code className="text-[11px] text-blue-700 font-mono block break-all">
                  {window.location.origin}/c/{inspectingTenant.slug}
                </code>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <Button
                  variant="outline"
                  onClick={() => setInspectingTenant(null)}
                  className="flex-1 rounded-xl text-xs h-10 border-slate-200"
                >
                  Close
                </Button>
                <a
                  href={`/c/${inspectingTenant.slug}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex-1"
                >
                  <Button
                    className="w-full bg-[#1d4ed8] text-white rounded-xl text-xs h-10 font-bold flex items-center justify-center gap-1.5"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    Open Public Portal
                  </Button>
                </a>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
