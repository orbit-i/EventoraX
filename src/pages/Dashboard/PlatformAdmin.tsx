import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
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
  Check,
  CreditCard,
  Tag,
  AlertCircle,
  Copy,
  Sliders,
  ArrowRight,
  Smartphone,
  QrCode,
  AlertTriangle,
  Receipt,
  Award,
  KeyRound,
  Star,
  Trash2,
  Plus
} from "lucide-react";
import { api } from "@/services/api";
import { useAuth } from "@/context/AuthContext";

type AdminTab = 'overview' | 'licenses' | 'approvals' | 'tenants' | 'billing' | 'pricing' | 'testimonials' | 'cms' | 'security' | 'notifications';

export default function PlatformAdmin() {
  const { isSuperAdmin } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  // Tab State synced with URL query param `?tab=...`
  const urlTab = (searchParams.get('tab') as AdminTab) || 'overview';
  const [activeTab, setActiveTab] = useState<AdminTab>(urlTab);

  // Platform Metrics & Tenants
  const [metrics, setMetrics] = useState<any>(null);
  const [tenants, setTenants] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [filterPlan, setFilterPlan] = useState("All");
  const [filterStatus, setFilterStatus] = useState("All");
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  // License Keys & Resource Quotas Tracking State
  const [licenses, setLicenses] = useState<any[]>([]);
  const [licenseLoading, setLicenseLoading] = useState(false);
  const [licenseSearch, setLicenseSearch] = useState('');
  const [licensePlanFilter, setLicensePlanFilter] = useState('All');
  const [licenseStatusFilter, setLicenseStatusFilter] = useState('All');
  const [approvedLicenseModal, setApprovedLicenseModal] = useState<{
    open: boolean;
    tenantName: string;
    licenseKey: string;
    expiresAt?: string;
    plan: string;
  } | null>(null);

  // Tenant Inspector Modal State
  const [inspectingTenant, setInspectingTenant] = useState<any | null>(null);

  // Subscription Approvals Queue State
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [subsLoading, setSubsLoading] = useState(false);
  const [subFilter, setSubFilter] = useState<'all' | 'pending' | 'active' | 'rejected'>('all');
  const [subSearch, setSubSearch] = useState('');
  const [approvingSubId, setApprovingSubId] = useState<number | null>(null);
  const [rejectModal, setRejectModal] = useState<{ open: boolean; subId: number | null; reason: string }>({
    open: false,
    subId: null,
    reason: ''
  });
  const [adjustModal, setAdjustModal] = useState<{
    open: boolean;
    tenant: any | null;
    maxEvents: number;
    maxAttendees: number;
    whiteLabel: boolean;
  }>({
    open: false,
    tenant: null,
    maxEvents: 25,
    maxAttendees: 5000,
    whiteLabel: false
  });
  const [copiedTid, setCopiedTid] = useState<string | null>(null);

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

  // Verified Institutional Testimonials State
  const [adminTestimonials, setAdminTestimonials] = useState<any[]>([]);
  const [testimonialsLoading, setTestimonialsLoading] = useState(false);
  const [showAddTestimonialModal, setShowAddTestimonialModal] = useState(false);
  const [newTestimonial, setNewTestimonial] = useState({
    client_name: '',
    organization: '',
    role: 'Organizer',
    logo_url: '',
    rating: 5,
    feedback: '',
    is_featured: true,
  });
  const [testimonialSubmitting, setTestimonialSubmitting] = useState(false);

  // Sync tab with URL
  useEffect(() => {
    const currentTab = (searchParams.get('tab') as AdminTab) || 'overview';
    setActiveTab(currentTab);
  }, [searchParams]);

  const switchTab = (newTab: AdminTab) => {
    setActiveTab(newTab);
    if (newTab === 'overview') {
      setSearchParams({});
    } else {
      setSearchParams({ tab: newTab });
    }
  };

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

  const loadSubscriptions = async () => {
    setSubsLoading(true);
    try {
      const res = await api.platformAdmin.getSubscriptions();
      if (res.success && res.subscriptions) {
        setSubscriptions(res.subscriptions);
      }
    } catch (err) {
      console.error("Failed to load subscriptions:", err);
    } finally {
      setSubsLoading(false);
    }
  };

  const loadLicenses = async () => {
    setLicenseLoading(true);
    try {
      const res = await api.platformAdmin.getLicenses();
      if (res.success && res.licenses) {
        setLicenses(res.licenses);
      }
    } catch (err) {
      console.error("Failed to load licenses:", err);
    } finally {
      setLicenseLoading(false);
    }
  };

  const loadAdminTestimonials = async () => {
    setTestimonialsLoading(true);
    try {
      const res = await api.platformAdmin.getTestimonials();
      if (res.success && res.testimonials) {
        setAdminTestimonials(res.testimonials);
      }
    } catch (err) {
      console.error("Failed to load testimonials:", err);
    } finally {
      setTestimonialsLoading(false);
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
    loadAdminNotifications();
    loadSubscriptions();
    loadLicenses();
    loadAdminTestimonials();
    const interval = setInterval(() => {
      loadAdminNotifications();
      loadSubscriptions();
    }, 6000); // 6s real-time live polling
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    loadData();
  }, [search, filterPlan, filterStatus]);

  useEffect(() => {
    if (activeTab === 'cms') {
      loadCmsData();
    }
    if (activeTab === 'approvals' || activeTab === 'billing') {
      loadSubscriptions();
    }
    if (activeTab === 'licenses') {
      loadLicenses();
    }
    if (activeTab === 'testimonials') {
      loadAdminTestimonials();
    }
  }, [activeTab]);

  useEffect(() => {
    const cur = cmsPages.find(p => p.page_key === selectedCmsPageKey);
    if (cur) {
      setCmsTitle(cur.title || "");
      setCmsContent(cur.content || {});
    }
  }, [selectedCmsPageKey]);

  // Strict SuperAdmin Access Guard
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
          Access strictly denied. Public users and client organizations cannot access the Platform Master console. Use the secret ORBIT-I gateway to log in.
        </p>
        <Button 
          onClick={() => window.location.href = '/orbit-i-master-gateway/login'}
          className="bg-[#1d4ed8] hover:bg-[#1e40af] text-white rounded-xl text-xs font-bold"
        >
          Go to Platform Master Gateway
        </Button>
      </div>
    );
  }

  // Action handlers
  const handleApproveSubscription = async (subId: number) => {
    setApprovingSubId(subId);
    try {
      const res = await api.platformAdmin.approveSubscription(subId);
      if (res.success) {
        const sub = subscriptions.find(s => s.id === subId);
        setApprovedLicenseModal({
          open: true,
          tenantName: sub?.tenantName || 'Client Organization',
          licenseKey: res.licenseKey,
          expiresAt: res.expiresAt,
          plan: sub?.plan || 'Professional'
        });
        await loadSubscriptions();
        await loadData();
        await loadLicenses();
        loadAdminNotifications();
      }
    } catch (err: any) {
      alert(err.message || "Failed to approve subscription.");
    } finally {
      setApprovingSubId(null);
    }
  };

  const handleRegenerateKey = async (tenantId: number) => {
    if (!confirm('Are you sure you want to regenerate this license key? The previous key will immediately stop working.')) return;
    try {
      const res = await api.platformAdmin.regenerateLicense(tenantId);
      if (res.success) {
        alert(`New License Key Generated: ${res.licenseKey}`);
        await loadLicenses();
        await loadData();
      }
    } catch (err: any) {
      alert(err.message || 'Failed to regenerate license key.');
    }
  };

  const handleRevokeLicense = async (tenantId: number) => {
    const reason = prompt('Enter revocation reason (e.g. Policy Violation, Payment Default):');
    if (!reason) return;
    try {
      const res = await api.platformAdmin.revokeLicense(tenantId, reason);
      if (res.success) {
        alert('License has been suspended / revoked.');
        await loadLicenses();
        await loadData();
      }
    } catch (err: any) {
      alert(err.message || 'Failed to revoke license.');
    }
  };

  const handleRenewLicense = async (tenantId: number, days: number = 365) => {
    try {
      const res = await api.platformAdmin.renewLicense(tenantId, days);
      if (res.success) {
        alert(`License renewed successfully until ${new Date(res.expiresAt).toLocaleDateString()}`);
        await loadLicenses();
        await loadData();
      }
    } catch (err: any) {
      alert(err.message || 'Failed to renew license.');
    }
  };

  const handleRejectSubscription = async () => {
    if (!rejectModal.subId) return;
    try {
      const res = await api.platformAdmin.rejectSubscription(rejectModal.subId, rejectModal.reason);
      if (res.success) {
        setRejectModal({ open: false, subId: null, reason: '' });
        await loadSubscriptions();
        await loadData();
        loadAdminNotifications();
      }
    } catch (err: any) {
      alert(err.message || "Failed to reject subscription.");
    }
  };

  const handleSavePermissions = async () => {
    if (!adjustModal.tenant) return;
    try {
      const res = await api.platformAdmin.updateTenantPermissions(adjustModal.tenant.id, {
        maxEvents: adjustModal.maxEvents,
        maxAttendees: adjustModal.maxAttendees,
        whiteLabel: adjustModal.whiteLabel
      });
      if (res.success) {
        setAdjustModal({ open: false, tenant: null, maxEvents: 25, maxAttendees: 5000, whiteLabel: false });
        loadData();
      }
    } catch (err: any) {
      alert(err.message || "Failed to update tenant quotas.");
    }
  };

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

  const handleCreateTestimonial = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTestimonial.client_name.trim() || !newTestimonial.organization.trim() || !newTestimonial.feedback.trim()) {
      alert("Please provide Client Name, Organization/Institute, and Feedback text.");
      return;
    }
    setTestimonialSubmitting(true);
    try {
      const res = await api.platformAdmin.createTestimonial(newTestimonial);
      if (res.success) {
        setShowAddTestimonialModal(false);
        setNewTestimonial({
          client_name: '',
          organization: '',
          role: 'Organizer',
          logo_url: '',
          rating: 5,
          feedback: '',
          is_featured: true,
        });
        await loadAdminTestimonials();
        loadAdminNotifications();
      }
    } catch (err: any) {
      alert(err.message || "Failed to create testimonial.");
    } finally {
      setTestimonialSubmitting(false);
    }
  };

  const handleDeleteTestimonial = async (id: number) => {
    if (!confirm("Are you sure you want to remove this verified institutional review?")) return;
    try {
      const res = await api.platformAdmin.deleteTestimonial(id);
      if (res.success) {
        setAdminTestimonials(prev => prev.filter(t => t.id !== id));
      }
    } catch (err: any) {
      alert(err.message || "Failed to delete testimonial.");
    }
  };

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

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedTid(text);
    setTimeout(() => setCopiedTid(null), 2000);
  };

  // Metrics calculations
  const totalMRR = metrics?.totalMRR ?? 0;
  const totalARR = metrics?.annualRunRate ?? (totalMRR * 12);
  const totalTenants = metrics?.totalTenants ?? tenants.length;

  const pendingSubs = subscriptions.filter(s => s.status === 'pending_approval');
  const activeSubs = subscriptions.filter(s => s.status === 'active');
  const rejectedSubs = subscriptions.filter(s => s.status === 'rejected');

  const filteredSubscriptions = subscriptions.filter(s => {
    if (subFilter === 'pending' && s.status !== 'pending_approval') return false;
    if (subFilter === 'active' && s.status !== 'active') return false;
    if (subFilter === 'rejected' && s.status !== 'rejected') return false;
    if (subSearch) {
      const q = subSearch.toLowerCase();
      const matchName = (s.tenantName || '').toLowerCase().includes(q);
      const matchEmail = (s.ownerEmail || '').toLowerCase().includes(q);
      const matchPlan = (s.plan || '').toLowerCase().includes(q);
      const matchRef = (s.transaction_ref || s.invoice_number || '').toLowerCase().includes(q);
      return matchName || matchEmail || matchPlan || matchRef;
    }
    return true;
  });

  return (
    <div className="pb-16 min-h-screen">
      <Header title="Platform Superadmin Console" />

      <div className="p-6 space-y-8 max-w-7xl mx-auto">
        {/* Banner */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#0f172a] via-[#1e1b4b] to-[#1e3a8a] p-8 text-white shadow-xl">
          <div className="relative z-10 max-w-3xl space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs font-semibold text-emerald-300">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              EventoraX Master SuperAdmin • Platform Authority
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight font-heading">
              EventoraX Platform Governance &amp; Approvals HQ
            </h1>
            <p className="text-sm text-slate-300 leading-relaxed">
              Master control center for client subscriptions, payment approvals, financial revenues, isolated tenant quotas, and security enforcement. SuperAdmin oversees the platform — client organizations manage their events.
            </p>
          </div>
        </div>

        {/* Global SaaS Metrics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <Card 
            onClick={() => switchTab('billing')}
            className="border-[#e2e8f0] bg-white shadow-xs hover:shadow-md transition-all cursor-pointer"
          >
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

          <Card 
            onClick={() => switchTab('tenants')}
            className="border-[#e2e8f0] bg-white shadow-xs hover:shadow-md transition-all cursor-pointer"
          >
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-[#64748b] uppercase tracking-wider">Client Organizations</p>
                  <p className="text-3xl font-black text-[#0f172a] mt-1">{totalTenants}</p>
                  <p className="text-xs text-[#1d4ed8] font-semibold mt-1">
                    {metrics?.activeTenants || totalTenants} active client workspaces
                  </p>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-blue-50 text-[#1d4ed8] flex items-center justify-center">
                  <Building2 className="w-6 h-6" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card 
            onClick={() => switchTab('approvals')}
            className={`border-[#e2e8f0] bg-white shadow-xs hover:shadow-md transition-all cursor-pointer ${
              pendingSubs.length > 0 ? 'ring-2 ring-amber-400 bg-amber-50/20' : ''
            }`}
          >
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-[#64748b] uppercase tracking-wider">Pending Plan Approvals</p>
                  <p className={`text-3xl font-black mt-1 ${pendingSubs.length > 0 ? 'text-amber-600' : 'text-[#0f172a]'}`}>
                    {pendingSubs.length}
                  </p>
                  <p className="text-xs text-amber-600 font-semibold mt-1">
                    {pendingSubs.length > 0 ? '⚠️ Verification required' : '✓ All caught up'}
                  </p>
                </div>
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                  pendingSubs.length > 0 ? 'bg-amber-100 text-amber-700 animate-pulse' : 'bg-slate-100 text-slate-600'
                }`}>
                  <CreditCard className="w-6 h-6" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card 
            onClick={() => switchTab('security')}
            className="border-[#e2e8f0] bg-white shadow-xs hover:shadow-md transition-all cursor-pointer"
          >
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-[#64748b] uppercase tracking-wider">Security Sentinel</p>
                  <p className="text-2xl font-black text-emerald-600 mt-1 flex items-center gap-2">
                    <Radio className="w-4 h-4 text-emerald-500 animate-pulse" />
                    24/7 ACTIVE
                  </p>
                  <p className="text-xs text-slate-500 font-semibold mt-1">
                    0 Threats • Workspaces Isolated
                  </p>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <ShieldCheck className="w-6 h-6" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Pending Approvals High-Priority Banner (if any) */}
        {pendingSubs.length > 0 && activeTab !== 'approvals' && (
          <div className="p-4 rounded-2xl bg-amber-50 border border-amber-300 text-amber-900 flex flex-wrap items-center justify-between gap-4 shadow-sm animate-in fade-in">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-200 text-amber-900 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold">
                  {pendingSubs.length} Client Subscription Purchase{pendingSubs.length > 1 ? 's' : ''} Awaiting Approval
                </h4>
                <p className="text-xs text-amber-700 mt-0.5">
                  Clients have submitted payment references. Please verify transactions to activate their accounts.
                </p>
              </div>
            </div>
            <Button
              onClick={() => switchTab('approvals')}
              className="bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold h-9 px-4 flex items-center gap-1.5"
            >
              Open Approvals Queue
              <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          </div>
        )}

        {/* Tab Selector (8 Governed Tabs) */}
        <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-3">
          <button
            onClick={() => switchTab('overview')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
              activeTab === 'overview'
                ? 'bg-[#1d4ed8] text-white shadow-md shadow-blue-600/20'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            Platform Overview
          </button>

          <button
            onClick={() => switchTab('licenses')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
              activeTab === 'licenses'
                ? 'bg-[#1d4ed8] text-white shadow-md shadow-blue-600/20'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <KeyRound className="w-4 h-4 text-indigo-500" />
            License Keys &amp; Quotas ({licenses.length || tenants.length})
          </button>

          <button
            onClick={() => switchTab('approvals')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
              activeTab === 'approvals'
                ? 'bg-[#1d4ed8] text-white shadow-md shadow-blue-600/20'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <CreditCard className="w-4 h-4 text-amber-500" />
            Subscription Approvals
            {pendingSubs.length > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-amber-500 text-white text-[10px] font-black animate-pulse">
                {pendingSubs.length}
              </span>
            )}
          </button>

          <button
            onClick={() => switchTab('tenants')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
              activeTab === 'tenants'
                ? 'bg-[#1d4ed8] text-white shadow-md shadow-blue-600/20'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <Building2 className="w-4 h-4" />
            Client Organizations ({tenants.length})
          </button>

          <button
            onClick={() => switchTab('billing')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
              activeTab === 'billing'
                ? 'bg-[#1d4ed8] text-white shadow-md shadow-blue-600/20'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <DollarSign className="w-4 h-4 text-emerald-500" />
            Revenue &amp; Financials
          </button>

          <button
            onClick={() => switchTab('pricing')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
              activeTab === 'pricing'
                ? 'bg-[#1d4ed8] text-white shadow-md shadow-blue-600/20'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <Tag className="w-4 h-4 text-indigo-500" />
            Pricing &amp; Market Plans
          </button>

          <button
            onClick={() => switchTab('cms')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
              activeTab === 'cms'
                ? 'bg-[#1d4ed8] text-white shadow-md shadow-blue-600/20'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <Globe className="w-4 h-4 text-blue-500" />
            Website &amp; Portal CMS
          </button>

          <button
            onClick={() => switchTab('testimonials')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
              activeTab === 'testimonials'
                ? 'bg-[#1d4ed8] text-white shadow-md shadow-blue-600/20'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <Award className="w-4 h-4 text-purple-500" />
            Institutional Testimonials ({adminTestimonials.length})
          </button>

          <button
            onClick={() => switchTab('security')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
              activeTab === 'security'
                ? 'bg-[#1d4ed8] text-white shadow-md shadow-blue-600/20'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <ShieldAlert className="w-4 h-4 text-emerald-500" />
            Security &amp; Sentinel
          </button>

          <button
            onClick={() => switchTab('notifications')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
              activeTab === 'notifications'
                ? 'bg-[#1d4ed8] text-white shadow-md shadow-blue-600/20'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <Bell className="w-4 h-4 text-rose-500" />
            Live Alerts
            {unreadAdminNotifCount > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-rose-600 text-white text-[10px] font-black animate-pulse">
                {unreadAdminNotifCount}
              </span>
            )}
          </button>
        </div>

        {/* ============================================================== */}
        {/* TAB 0: PLATFORM OVERVIEW */}
        {/* ============================================================== */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Quick Card 1: Subscription Approvals */}
              <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs flex flex-col justify-between space-y-4">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="p-3 rounded-2xl bg-amber-50 text-amber-700">
                      <CreditCard className="w-6 h-6" />
                    </span>
                    <Badge className="bg-amber-100 text-amber-800 text-[10px] font-bold">
                      {pendingSubs.length} Pending
                    </Badge>
                  </div>
                  <h3 className="text-base font-bold text-slate-900 mt-4">Client Subscription Approvals</h3>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                    Review incoming payment slips, card authorizations, and bank transfer receipts to unlock client accounts.
                  </p>
                </div>
                <Button 
                  onClick={() => switchTab('approvals')}
                  className="w-full bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold h-10"
                >
                  Manage Approvals Queue ({pendingSubs.length})
                </Button>
              </div>

              {/* Quick Card 2: Client Workspaces */}
              <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs flex flex-col justify-between space-y-4">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="p-3 rounded-2xl bg-blue-50 text-blue-700">
                      <Building2 className="w-6 h-6" />
                    </span>
                    <Badge className="bg-blue-100 text-blue-800 text-[10px] font-bold">
                      {tenants.length} Workspaces
                    </Badge>
                  </div>
                  <h3 className="text-base font-bold text-slate-900 mt-4">Client Organizations</h3>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                    View active client organizations, adjust event &amp; attendee quotas, and enforce isolation policies.
                  </p>
                </div>
                <Button 
                  onClick={() => switchTab('tenants')}
                  className="w-full bg-[#1d4ed8] hover:bg-[#1e40af] text-white rounded-xl text-xs font-bold h-10"
                >
                  Open Client Directory
                </Button>
              </div>

              {/* Quick Card 3: Platform Financials */}
              <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs flex flex-col justify-between space-y-4">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="p-3 rounded-2xl bg-emerald-50 text-emerald-700">
                      <DollarSign className="w-6 h-6" />
                    </span>
                    <Badge className="bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                      ${totalMRR}/mo
                    </Badge>
                  </div>
                  <h3 className="text-base font-bold text-slate-900 mt-4">Revenue &amp; Invoices</h3>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                    Inspect SaaS revenue metrics, annual run rates, recent transaction receipts, and customer billing cycles.
                  </p>
                </div>
                <Button 
                  onClick={() => switchTab('billing')}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold h-10"
                >
                  View Revenue Ledger
                </Button>
              </div>
            </div>

            {/* Architecture Role Guidance Box */}
            <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 rounded-3xl border border-blue-200/80 p-6">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-sm font-bold text-slate-900">
                    Platform Security &amp; Role Separation Architecture
                  </h4>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    <strong>SuperAdmin (EventoraX HQ):</strong> Governs the SaaS platform, approves client plan payments, manages market pricing, monitors security &amp; 24/7 compliance, and configures the public website CMS. SuperAdmin does NOT create event badges or certificates for personal use.
                  </p>
                  <p className="text-xs text-slate-600 leading-relaxed pt-1">
                    <strong>Client Organizations:</strong> Event managers, seminar hosts, universities, and companies pay subscription fees to host events, print ID cards, issue verifiable certificates, and use the Canva design studio within their isolated workspaces.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 0.5: LICENSE KEYS & RESOURCE TRACKING (SUPERADMIN OVERSIGHT) */}
        {/* ============================================================== */}
        {activeTab === 'licenses' && (
          <div className="space-y-6">
            {/* Header & Metric Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Provisioned Licenses</span>
                  <div className="w-9 h-9 rounded-xl bg-blue-50 text-[#1d4ed8] flex items-center justify-center">
                    <KeyRound className="w-4 h-4" />
                  </div>
                </div>
                <p className="text-2xl font-black text-slate-900 mt-2">{licenses.length}</p>
                <span className="text-[11px] text-slate-500">Cryptographically isolated organization workspaces</span>
              </div>

              <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Active &amp; Verified</span>
                  <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                </div>
                <p className="text-2xl font-black text-emerald-600 mt-2">
                  {licenses.filter(l => l.license_status === 'active' || l.status === 'active').length}
                </p>
                <span className="text-[11px] text-emerald-700">Unlocked and generating live event passes</span>
              </div>

              <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Pending / Suspended</span>
                  <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                    <AlertTriangle className="w-4 h-4" />
                  </div>
                </div>
                <p className="text-2xl font-black text-amber-600 mt-2">
                  {licenses.filter(l => l.license_status !== 'active' && l.status !== 'active').length}
                </p>
                <span className="text-[11px] text-amber-700">Requires SuperAdmin verification or renewal</span>
              </div>
            </div>

            {/* License Directory Table */}
            <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-6 space-y-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    <Award className="w-5 h-5 text-[#1d4ed8]" />
                    Client Organization License Keys &amp; Resource Utilization
                  </h3>
                  <p className="text-xs text-slate-500">
                    Track each client organization by their Activation License Key. Monitor real-time resource quotas (events used, attendee registrations, certificate generation) and enforce authorization.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
                  {/* Search */}
                  <div className="relative flex-1 sm:w-64">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <Input
                      placeholder="Search key, organization, email..."
                      value={licenseSearch}
                      onChange={(e) => setLicenseSearch(e.target.value)}
                      className="pl-9 rounded-xl text-xs bg-slate-50 border-slate-200 h-9"
                    />
                  </div>

                  {/* Plan Filter */}
                  <select
                    value={licensePlanFilter}
                    onChange={(e) => setLicensePlanFilter(e.target.value)}
                    className="px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-semibold text-slate-700 h-9 focus:outline-none"
                  >
                    <option value="All">All Plans</option>
                    <option value="Starter">Starter</option>
                    <option value="Professional">Professional</option>
                    <option value="Enterprise">Enterprise</option>
                  </select>

                  {/* Status Filter */}
                  <select
                    value={licenseStatusFilter}
                    onChange={(e) => setLicenseStatusFilter(e.target.value)}
                    className="px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-semibold text-slate-700 h-9 focus:outline-none"
                  >
                    <option value="All">All Statuses</option>
                    <option value="active">Active</option>
                    <option value="pending_approval">Pending Approval</option>
                    <option value="suspended">Suspended</option>
                  </select>

                  {/* Refresh */}
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={loadLicenses}
                    disabled={licenseLoading}
                    className="rounded-xl h-9 text-xs"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${licenseLoading ? 'animate-spin' : ''}`} />
                    Refresh
                  </Button>
                </div>
              </div>

              {/* Table */}
              <div className="overflow-x-auto rounded-2xl border border-slate-200">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200">
                    <tr>
                      <th className="p-3.5 pl-4">Client Organization</th>
                      <th className="p-3.5">Activation License Key</th>
                      <th className="p-3.5">Plan / Status</th>
                      <th className="p-3.5">Resource Quota Utilization</th>
                      <th className="p-3.5">Validity &amp; Expiry</th>
                      <th className="p-3.5 text-right pr-4">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {licenses
                      .filter(lic => {
                        if (licensePlanFilter !== 'All' && lic.plan?.toLowerCase() !== licensePlanFilter.toLowerCase()) return false;
                        if (licenseStatusFilter !== 'All' && (lic.license_status || lic.status) !== licenseStatusFilter) return false;
                        if (licenseSearch) {
                          const q = licenseSearch.toLowerCase();
                          const matchKey = (lic.license_key || '').toLowerCase().includes(q);
                          const matchName = (lic.name || '').toLowerCase().includes(q);
                          const matchEmail = (lic.owner_email || '').toLowerCase().includes(q);
                          return matchKey || matchName || matchEmail;
                        }
                        return true;
                      })
                      .map((lic) => {
                        const eventPercent = Math.min(100, Math.round(((lic.events_count || 0) / (lic.max_events || 25)) * 100));
                        const attendeePercent = Math.min(100, Math.round(((lic.attendees_count || 0) / (lic.max_attendees || 5000)) * 100));
                        const certPercent = Math.min(100, Math.round(((lic.certs_count || 0) / (lic.max_certs || 5000)) * 100));

                        const isActive = lic.license_status === 'active' || lic.status === 'active';
                        const isPending = lic.status === 'pending_approval';

                        return (
                          <tr key={lic.id} className="hover:bg-slate-50/80 transition-colors">
                            {/* Client Org */}
                            <td className="p-3.5 pl-4">
                              <div className="flex items-center gap-2.5">
                                <div className="w-8 h-8 rounded-lg bg-blue-100 text-[#1d4ed8] font-bold flex items-center justify-center text-xs">
                                  {(lic.name || 'EX').slice(0, 2).toUpperCase()}
                                </div>
                                <div>
                                  <p className="font-bold text-slate-900 text-xs">{lic.name}</p>
                                  <p className="text-[11px] text-slate-500">{lic.owner_email || lic.slug}</p>
                                </div>
                              </div>
                            </td>

                            {/* License Key */}
                            <td className="p-3.5">
                              {lic.license_key ? (
                                <div className="inline-flex items-center gap-1.5 bg-slate-100 border border-slate-300 px-2.5 py-1 rounded-lg">
                                  <span className="font-mono font-bold text-slate-900 text-xs tracking-wider">
                                    {lic.license_key}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => copyToClipboard(lic.license_key)}
                                    className="p-1 rounded hover:bg-slate-200 text-slate-500 hover:text-slate-800 transition-colors"
                                    title="Copy Key"
                                  >
                                    {copiedTid === lic.license_key ? (
                                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                                    ) : (
                                      <Copy className="w-3.5 h-3.5" />
                                    )}
                                  </button>
                                </div>
                              ) : (
                                <span className="text-amber-700 font-semibold bg-amber-50 px-2 py-0.5 rounded border border-amber-200 text-[11px]">
                                  Pending Key Issue
                                </span>
                              )}
                            </td>

                            {/* Plan & Status */}
                            <td className="p-3.5">
                              <div className="space-y-1">
                                <Badge className="bg-slate-100 text-slate-800 border border-slate-300 text-[10px] font-bold">
                                  {lic.plan || 'Starter'}
                                </Badge>
                                <div>
                                  <span className={`inline-flex items-center gap-1 text-[10px] font-bold uppercase ${
                                    isActive ? 'text-emerald-700' : isPending ? 'text-amber-700' : 'text-rose-700'
                                  }`}>
                                    <span className={`w-1.5 h-1.5 rounded-full ${
                                      isActive ? 'bg-emerald-500' : isPending ? 'bg-amber-500' : 'bg-rose-500'
                                    }`} />
                                    {lic.license_status || lic.status || 'active'}
                                  </span>
                                </div>
                              </div>
                            </td>

                            {/* Resource Quota Utilization */}
                            <td className="p-3.5 min-w-[200px]">
                              <div className="space-y-2 text-[11px]">
                                <div>
                                  <div className="flex justify-between text-slate-600 mb-0.5">
                                    <span>Events:</span>
                                    <span className="font-semibold text-slate-800">{lic.events_count || 0} / {lic.max_events || 25}</span>
                                  </div>
                                  <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                                    <div 
                                      className={`h-full rounded-full ${eventPercent > 80 ? 'bg-amber-500' : 'bg-blue-600'}`} 
                                      style={{ width: `${eventPercent}%` }}
                                    />
                                  </div>
                                </div>

                                <div>
                                  <div className="flex justify-between text-slate-600 mb-0.5">
                                    <span>Attendees:</span>
                                    <span className="font-semibold text-slate-800">{(lic.attendees_count || 0).toLocaleString()} / {(lic.max_attendees || 5000).toLocaleString()}</span>
                                  </div>
                                  <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                                    <div 
                                      className={`h-full rounded-full ${attendeePercent > 80 ? 'bg-amber-500' : 'bg-emerald-600'}`} 
                                      style={{ width: `${attendeePercent}%` }}
                                    />
                                  </div>
                                </div>

                                <div>
                                  <div className="flex justify-between text-slate-600 mb-0.5">
                                    <span>Certificates:</span>
                                    <span className="font-semibold text-slate-800">{(lic.certs_count || 0).toLocaleString()} / {(lic.max_certs || 5000).toLocaleString()}</span>
                                  </div>
                                  <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                                    <div 
                                      className={`h-full rounded-full ${certPercent > 80 ? 'bg-amber-500' : 'bg-purple-600'}`} 
                                      style={{ width: `${certPercent}%` }}
                                    />
                                  </div>
                                </div>
                              </div>
                            </td>

                            {/* Validity */}
                            <td className="p-3.5 text-slate-600 text-[11px]">
                              <div>
                                <span className="font-semibold block text-slate-800">
                                  {lic.license_expires_at ? new Date(lic.license_expires_at).toLocaleDateString() : '1 Year Active'}
                                </span>
                                <span className="text-slate-400 text-[10px]">
                                  Issued: {lic.license_activated_at ? new Date(lic.license_activated_at).toLocaleDateString() : 'Auto-Provisioned'}
                                </span>
                              </div>
                            </td>

                            {/* Actions */}
                            <td className="p-3.5 text-right pr-4">
                              <div className="inline-flex items-center gap-1.5">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleRenewLicense(lic.id, 365)}
                                  className="h-7 px-2 text-[11px] rounded-lg text-emerald-700 hover:bg-emerald-50 border-emerald-300"
                                  title="Renew License for 365 days"
                                >
                                  +1 Yr
                                </Button>

                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleRegenerateKey(lic.id)}
                                  className="h-7 px-2 text-[11px] rounded-lg text-blue-700 hover:bg-blue-50 border-blue-300"
                                  title="Regenerate Activation Key"
                                >
                                  Regen Key
                                </Button>

                                {isActive ? (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleRevokeLicense(lic.id)}
                                    className="h-7 px-2 text-[11px] rounded-lg text-rose-700 hover:bg-rose-50 border-rose-300"
                                    title="Suspend Organization License"
                                  >
                                    Suspend
                                  </Button>
                                ) : (
                                  <Button
                                    size="sm"
                                    onClick={() => handleRenewLicense(lic.id, 365)}
                                    className="h-7 px-2 text-[11px] rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white"
                                  >
                                    Activate
                                  </Button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 1: SUBSCRIPTION APPROVALS QUEUE (SUPERADMIN APPROVAL) */}
        {/* ============================================================== */}
        {activeTab === 'approvals' && (
          <div className="bg-white rounded-3xl border border-[#e2e8f0] shadow-xs p-6 space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-[#0f172a] flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-amber-500" />
                  Subscription &amp; Client Plan Approvals Queue
                </h2>
                <p className="text-xs text-[#64748b]">
                  When clients or visitors purchase Starter, Professional, or Enterprise plans, verify their transaction references here and grant platform access with one click.
                </p>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={loadSubscriptions}
                disabled={subsLoading}
                className="rounded-xl border-[#e2e8f0] text-xs h-9"
              >
                <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${subsLoading ? 'animate-spin' : ''}`} />
                Refresh Queue
              </Button>
            </div>

            {/* Filter Pills & Search */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
              <div className="flex flex-wrap items-center gap-2">
                {[
                  { id: 'all', label: `All Requests (${subscriptions.length})` },
                  { id: 'pending', label: `Pending Approval (${pendingSubs.length})`, highlight: pendingSubs.length > 0 },
                  { id: 'active', label: `Approved & Active (${activeSubs.length})` },
                  { id: 'rejected', label: `Rejected (${rejectedSubs.length})` },
                ].map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => setSubFilter(f.id as any)}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                      subFilter === f.id
                        ? 'bg-[#1d4ed8] text-white shadow-xs'
                        : f.highlight
                          ? 'bg-amber-100 text-amber-900 border border-amber-300 font-extrabold'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>

              <div className="relative min-w-[220px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94a3b8]" />
                <Input
                  placeholder="Search by org, email, plan, or TID..."
                  value={subSearch}
                  onChange={(e) => setSubSearch(e.target.value)}
                  className="pl-9 rounded-xl border-[#e2e8f0] text-xs h-9 bg-slate-50"
                />
              </div>
            </div>

            {/* Subscriptions Table */}
            <div className="overflow-x-auto rounded-2xl border border-slate-200">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="p-3.5 pl-4">Client Organization</th>
                    <th className="p-3.5">Owner Contact</th>
                    <th className="p-3.5">Purchased Plan</th>
                    <th className="p-3.5">Amount &amp; Gateway</th>
                    <th className="p-3.5">Transaction Ref / TID</th>
                    <th className="p-3.5">Status</th>
                    <th className="p-3.5 text-right pr-4">Approval Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredSubscriptions.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-12 text-center text-slate-400">
                        <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
                        <p className="font-semibold text-slate-700">No subscription requests in this view.</p>
                        <p className="text-[11px] text-slate-400 mt-0.5">When clients purchase plans, requests will populate here in real-time.</p>
                      </td>
                    </tr>
                  ) : (
                    filteredSubscriptions.map((s) => {
                      const isPending = s.status === 'pending_approval';
                      const isApproved = s.status === 'active';
                      const refCode = s.transaction_ref || s.invoice_number || `TXN-${s.id}`;

                      return (
                        <tr key={s.id} className={`hover:bg-slate-50/80 transition-colors ${isPending ? 'bg-amber-50/20' : ''}`}>
                          <td className="p-3.5 pl-4 font-bold text-slate-900">
                            {s.tenantName || 'Client Organization'}
                            <span className="block text-[10px] text-slate-400 font-mono">
                              Tenant ID #{s.tenant_id}
                            </span>
                          </td>
                          <td className="p-3.5 text-slate-600">
                            {s.ownerName || 'Client Owner'}
                            <span className="block text-[10px] text-slate-400">{s.ownerEmail || 'client@org.com'}</span>
                            {s.ownerPhone && (
                              <span className="block text-[10px] text-slate-400">{s.ownerPhone}</span>
                            )}
                          </td>
                          <td className="p-3.5">
                            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold ${
                              s.plan === 'Enterprise' ? 'bg-purple-100 text-purple-800' :
                              s.plan === 'Professional' ? 'bg-blue-100 text-blue-800' :
                              'bg-slate-100 text-slate-800'
                            }`}>
                              <Sparkles className="w-3 h-3" />
                              {s.plan}
                            </span>
                            <span className="block text-[10px] text-slate-400 mt-0.5 capitalize">
                              Cycle: {s.billing_cycle || 'monthly'}
                            </span>
                          </td>
                          <td className="p-3.5 font-bold text-slate-900">
                            <div>
                              {s.price === 0 ? 'Free ($0)' : `${s.currency || 'USD'} ${s.price}`}
                            </div>
                            <span className="text-[10px] text-slate-500 font-normal uppercase flex items-center gap-1 mt-0.5">
                              {s.payment_method?.toLowerCase().includes('card') ? <CreditCard className="w-3 h-3 text-blue-600" /> :
                               s.payment_method?.toLowerCase().includes('bank') ? <Building2 className="w-3 h-3 text-slate-700" /> :
                               s.payment_method?.toLowerCase().includes('jazz') ? <Smartphone className="w-3 h-3 text-red-600" /> :
                               s.payment_method?.toLowerCase().includes('easy') ? <Smartphone className="w-3 h-3 text-emerald-600" /> :
                               s.payment_method?.toLowerCase().includes('raast') ? <QrCode className="w-3 h-3 text-amber-600" /> :
                               <Receipt className="w-3 h-3 text-slate-400" />}
                              {s.payment_method || 'Online Card'}
                            </span>
                          </td>
                          <td className="p-3.5">
                            <div className="flex items-center gap-1.5 font-mono text-[11px] text-slate-800 bg-slate-100 px-2 py-1 rounded-md max-w-fit">
                              <span>{refCode}</span>
                              <button
                                onClick={() => copyToClipboard(refCode)}
                                title="Copy TID"
                                className="text-slate-400 hover:text-slate-700"
                              >
                                {copiedTid === refCode ? (
                                  <Check className="w-3 h-3 text-emerald-600" />
                                ) : (
                                  <Copy className="w-3 h-3" />
                                )}
                              </button>
                            </div>
                            <span className="block text-[10px] text-slate-400 mt-0.5">
                              {new Date(s.created_at || Date.now()).toLocaleDateString()}
                            </span>
                          </td>
                          <td className="p-3.5">
                            <Badge className={`text-[10px] font-bold ${
                              isPending ? 'bg-amber-100 text-amber-800 border border-amber-300 animate-pulse' :
                              isApproved ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' :
                              'bg-rose-100 text-rose-800 border border-rose-300'
                            }`}>
                              {isPending ? '⚠️ Pending Approval' : isApproved ? '✓ Active & Verified' : '✕ Rejected'}
                            </Badge>
                          </td>
                          <td className="p-3.5 text-right pr-4 space-x-1.5 whitespace-nowrap">
                            {isPending ? (
                              <>
                                <Button
                                  size="sm"
                                  disabled={approvingSubId === s.id}
                                  onClick={() => handleApproveSubscription(s.id)}
                                  className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold h-8 px-3 shadow-xs"
                                >
                                  <Check className="w-3.5 h-3.5 mr-1" />
                                  {approvingSubId === s.id ? 'Activating...' : 'Approve & Activate'}
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => setRejectModal({ open: true, subId: s.id, reason: '' })}
                                  className="text-rose-600 hover:bg-rose-50 rounded-lg text-xs font-semibold h-8 px-2"
                                >
                                  Reject
                                </Button>
                              </>
                            ) : (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  const t = tenants.find(tenant => tenant.id === s.tenant_id);
                                  if (t) {
                                    setAdjustModal({
                                      open: true,
                                      tenant: t,
                                      maxEvents: t.max_events || 25,
                                      maxAttendees: t.max_attendees || 5000,
                                      whiteLabel: !!t.white_label_enabled
                                    });
                                  } else {
                                    alert("Tenant details not found.");
                                  }
                                }}
                                className="text-xs h-8 px-2.5 rounded-lg border-slate-200"
                              >
                                <Sliders className="w-3.5 h-3.5 mr-1 text-slate-500" />
                                Adjust Quotas
                              </Button>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 2: CLIENT ORGANIZATIONS DIRECTORY */}
        {/* ============================================================== */}
        {activeTab === 'tenants' && (
          <div className="bg-white rounded-3xl border border-[#e2e8f0] shadow-xs p-6 space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-[#0f172a] flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-blue-600" />
                  Client Organizations &amp; Workspaces
                </h2>
                <p className="text-xs text-[#64748b]">
                  Client organizations are strictly segregated. Clients manage their own events and attendees. SuperAdmin governs quotas, statuses, and plans.
                </p>
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
                        <td className="p-3.5 text-right pr-4 space-x-1.5 whitespace-nowrap">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setInspectingTenant(t)}
                            className="text-[#1d4ed8] hover:bg-blue-50 text-xs h-8 px-2.5 rounded-lg font-bold"
                          >
                            <ArrowUpRight className="w-3.5 h-3.5 mr-1" />
                            Details
                          </Button>
                          {!isMaster && (
                            <>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setAdjustModal({
                                  open: true,
                                  tenant: t,
                                  maxEvents: t.max_events || 25,
                                  maxAttendees: t.max_attendees || 5000,
                                  whiteLabel: !!t.white_label_enabled
                                })}
                                className="text-xs h-8 px-2 rounded-lg border-slate-200 text-slate-600"
                              >
                                <Sliders className="w-3.5 h-3.5 mr-1" />
                                Quotas
                              </Button>
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
                            </>
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

        {/* ============================================================== */}
        {/* TAB 3: REVENUE & FINANCIALS (SAAS BUDGET & TRANSACTIONS) */}
        {/* ============================================================== */}
        {activeTab === 'billing' && (
          <div className="bg-white rounded-3xl border border-[#e2e8f0] shadow-xs p-6 space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-[#0f172a] flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-emerald-600" />
                  Platform Revenue, Financial Ledger &amp; Budget
                </h2>
                <p className="text-xs text-[#64748b]">
                  Real-time accounting of platform recurring revenue (MRR/ARR), approved subscription invoices, and transaction histories.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  onClick={() => switchTab('approvals')}
                  className="bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold h-9"
                >
                  <CreditCard className="w-3.5 h-3.5 mr-1.5" />
                  View Approvals Queue ({pendingSubs.length})
                </Button>
              </div>
            </div>

            {/* Financial Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              <div className="p-5 rounded-2xl bg-gradient-to-br from-emerald-50 to-white border border-emerald-200">
                <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider block">Monthly Recurring (MRR)</span>
                <span className="text-3xl font-black text-slate-900 mt-2 block">${totalMRR.toLocaleString()}</span>
                <span className="text-xs text-emerald-600 font-semibold mt-1 block">From {metrics?.activeTenants || tenants.length} subscribed client orgs</span>
              </div>

              <div className="p-5 rounded-2xl bg-gradient-to-br from-blue-50 to-white border border-blue-200">
                <span className="text-xs font-bold text-blue-800 uppercase tracking-wider block">Annual Run Rate (ARR)</span>
                <span className="text-3xl font-black text-slate-900 mt-2 block">${totalARR.toLocaleString()}</span>
                <span className="text-xs text-blue-600 font-semibold mt-1 block">Projected 12-month platform valuation</span>
              </div>

              <div className="p-5 rounded-2xl bg-gradient-to-br from-purple-50 to-white border border-purple-200">
                <span className="text-xs font-bold text-purple-800 uppercase tracking-wider block">Total Invoices Logged</span>
                <span className="text-3xl font-black text-slate-900 mt-2 block">{subscriptions.length}</span>
                <span className="text-xs text-purple-600 font-semibold mt-1 block">{activeSubs.length} active · {pendingSubs.length} pending</span>
              </div>
            </div>

            {/* Invoices Ledger Table */}
            <div className="space-y-3 pt-2">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Receipt className="w-4 h-4 text-slate-500" />
                Subscription Invoices &amp; Transaction Ledger
              </h3>

              <div className="overflow-x-auto rounded-2xl border border-slate-200">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200">
                    <tr>
                      <th className="p-3 pl-4">Invoice / TID</th>
                      <th className="p-3">Client Organization</th>
                      <th className="p-3">Plan</th>
                      <th className="p-3">Amount</th>
                      <th className="p-3">Method</th>
                      <th className="p-3">Status</th>
                      <th className="p-3 text-right pr-4">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {subscriptions.map((s) => (
                      <tr key={s.id} className="hover:bg-slate-50/80">
                        <td className="p-3 pl-4 font-mono font-bold text-slate-800">
                          {s.transaction_ref || s.invoice_number || `TXN-${s.id}`}
                        </td>
                        <td className="p-3 font-semibold text-slate-900">
                          {s.tenantName || 'Client Org'}
                        </td>
                        <td className="p-3">
                          <span className="font-bold text-slate-800">{s.plan}</span> ({s.billing_cycle || 'monthly'})
                        </td>
                        <td className="p-3 font-bold text-slate-900">
                          {s.price === 0 ? 'Free ($0)' : `${s.currency || 'USD'} ${s.price}`}
                        </td>
                        <td className="p-3 text-slate-600 uppercase font-semibold">
                          {s.payment_method || 'Card'}
                        </td>
                        <td className="p-3">
                          <Badge className={`text-[10px] font-bold ${
                            s.status === 'active' ? 'bg-emerald-100 text-emerald-800' :
                            s.status === 'pending_approval' ? 'bg-amber-100 text-amber-800' :
                            'bg-rose-100 text-rose-800'
                          }`}>
                            {s.status}
                          </Badge>
                        </td>
                        <td className="p-3 text-right pr-4 text-slate-400">
                          {new Date(s.created_at || Date.now()).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 4: PRICING & MARKET PLANS MANAGEMENT */}
        {/* ============================================================== */}
        {activeTab === 'pricing' && (
          <div className="bg-white rounded-3xl border border-[#e2e8f0] shadow-xs p-6 space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-[#0f172a] flex items-center gap-2">
                  <Tag className="w-5 h-5 text-indigo-600" />
                  Platform Market Pricing &amp; Tier Quotas
                </h2>
                <p className="text-xs text-[#64748b]">
                  These are the official subscription packages offered to client organizations. When clients pay, SuperAdmin reviews proof in the Approvals queue.
                </p>
              </div>

              <a href="/pricing" target="_blank" rel="noreferrer">
                <Button variant="outline" size="sm" className="rounded-xl text-xs h-9">
                  <ExternalLink className="w-3.5 h-3.5 mr-1.5" />
                  View Public Pricing Page
                </Button>
              </a>
            </div>

            {/* Plans Comparison */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
              {[
                {
                  name: "Starter",
                  price: "$0",
                  period: "/month",
                  tag: "Free Community Tier",
                  features: [
                    "Up to 500 attendees",
                    "Max 5 active events",
                    "Standard digital ID tickets",
                    "Event pass QR verification",
                    "Standard event analytics"
                  ]
                },
                {
                  name: "Professional",
                  price: "$99",
                  period: "/month",
                  tag: "Most Popular for Organizers",
                  highlight: true,
                  features: [
                    "5,000 attendees capacity",
                    "Up to 25 events",
                    "ID Pass Generator & One-Click Print",
                    "100+ Certificate templates & issuance",
                    "Canva Design Studio integration",
                    "5 team member seats",
                    "Priority 24/7 support"
                  ]
                },
                {
                  name: "Enterprise",
                  price: "$299",
                  period: "/month",
                  tag: "Large Summits & Universities",
                  features: [
                    "50,000+ attendees capacity",
                    "Unlimited platform events",
                    "Full White-label & custom CNAME domain",
                    "Bulk CSV pass & certificate generation",
                    "Dedicated account manager & SLA",
                    "Single Sign-On (SSO) & 2FA enforcement"
                  ]
                }
              ].map((p) => (
                <div 
                  key={p.name}
                  className={`p-6 rounded-3xl border flex flex-col justify-between space-y-4 ${
                    p.highlight ? 'border-blue-600 ring-2 ring-blue-500/20 bg-blue-50/20 shadow-md' : 'border-slate-200 bg-white'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-500">{p.name}</span>
                      <Badge className={p.highlight ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-700'}>
                        {p.tag}
                      </Badge>
                    </div>
                    <div className="flex items-baseline gap-1 my-2">
                      <span className="text-3xl font-extrabold text-slate-900">{p.price}</span>
                      <span className="text-xs text-slate-500">{p.period}</span>
                    </div>

                    <ul className="space-y-2 pt-3 border-t border-slate-100 text-xs text-slate-600">
                      {p.features.map((f, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                          <span>{f}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="pt-2">
                    <Button
                      onClick={() => switchTab('approvals')}
                      variant="outline"
                      className="w-full rounded-xl text-xs font-bold h-9 border-slate-200"
                    >
                      Review {p.name} Requests
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 5: 24/7 SECURITY & SENTINEL */}
        {/* ============================================================== */}
        {activeTab === 'security' && (
          <div className="space-y-6">
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
              <div className="divide-y divide-slate-100 max-h-[480px] overflow-y-auto">
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

        {/* ============================================================== */}
        {/* TAB 6: WEBSITE & PORTAL CMS */}
        {/* ============================================================== */}
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

        {/* ============================================================== */}
        {/* TAB 7: LIVE SYSTEM NOTIFICATIONS */}
        {/* ============================================================== */}
        {activeTab === 'notifications' && (
          <div className="bg-white rounded-3xl border border-[#e2e8f0] shadow-xs p-6 space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-[#0f172a] flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
                  Live Platform Event &amp; Notification Sentinel
                </h2>
                <p className="text-xs text-[#64748b]">
                  Real-time broadcast of all organization signups, plan purchases, attendee registrations, pass issuances, and security events.
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
                { id: 'billing', label: 'Billing & Approvals' },
                { id: 'tenant', label: 'Organizations' },
                { id: 'event', label: 'Events' },
                { id: 'attendee', label: 'Attendees & Passes' },
                { id: 'security', label: 'Security' },
                { id: 'cms', label: 'CMS Updates' }
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
            <div className="space-y-3 max-h-[600px] overflow-y-auto">
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
                           n.category === 'billing' ? <CreditCard className="w-4 h-4" /> :
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

        {/* ================= TAB 7: INSTITUTIONAL TESTIMONIALS CMS ================= */}
        {activeTab === 'testimonials' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-xs">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-50 text-[#7c3aed] border border-purple-200 text-xs font-bold mb-2">
                  <Award className="w-3.5 h-3.5" />
                  Verified Review Governance
                </div>
                <h3 className="text-lg font-bold text-slate-900">
                  Authentic Institutional Testimonials &amp; Client Feedback
                </h3>
                <p className="text-xs text-slate-500 mt-1 max-w-2xl leading-relaxed">
                  Manage real reviews from universities, academic societies, and corporate clients using EventoraX. Placeholders and fake reviews are forbidden. All approved entries display live on the official landing page.
                </p>
              </div>

              <Button
                onClick={() => setShowAddTestimonialModal(true)}
                className="bg-[#7c3aed] hover:bg-[#6d28d9] text-white rounded-xl text-xs font-bold h-10 px-4 shadow-sm shrink-0 flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Add Institutional Review
              </Button>
            </div>

            {/* Testimonials List */}
            {testimonialsLoading ? (
              <div className="py-16 text-center text-xs text-[#7c3aed] flex items-center justify-center gap-2">
                <div className="w-4 h-4 border-2 border-[#7c3aed] border-t-transparent rounded-full animate-spin" />
                <span>Loading verified testimonials...</span>
              </div>
            ) : adminTestimonials.length === 0 ? (
              <div className="bg-white rounded-3xl border border-dashed border-slate-300 p-12 text-center shadow-xs">
                <div className="w-16 h-16 rounded-2xl bg-purple-50 text-[#7c3aed] flex items-center justify-center mx-auto mb-4 border border-purple-200">
                  <Award className="w-8 h-8" />
                </div>
                <h4 className="text-base font-bold text-slate-900 mb-1">
                  No Institutional Testimonials Added Yet (0 Data)
                </h4>
                <p className="text-xs text-slate-500 max-w-md mx-auto mb-6 leading-relaxed">
                  The platform adheres strictly to 0 fake reviews. When real educational institutes or partner clients submit feedback, use the "Add Institutional Review" button above to publish their logo, name, and testimony.
                </p>
                <Button
                  onClick={() => setShowAddTestimonialModal(true)}
                  className="bg-[#7c3aed] hover:bg-[#6d28d9] text-white rounded-xl text-xs font-bold h-9 px-5 shadow-sm inline-flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Publish First Real Testimonial
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {adminTestimonials.map((t) => (
                  <div
                    key={t.id}
                    className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col justify-between hover:border-purple-300 transition-all"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-1">
                          {[...Array(t.rating || 5)].map((_, i) => (
                            <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                          ))}
                        </div>
                        <Badge className={`text-[10px] font-bold ${t.is_featured ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'}`}>
                          {t.is_featured ? 'Live on Landing Page' : 'Draft'}
                        </Badge>
                      </div>

                      <p className="text-xs text-slate-700 italic leading-relaxed mb-4">
                        "{t.feedback}"
                      </p>
                    </div>

                    <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                      <div className="flex items-center gap-3 min-w-0">
                        {t.logo_url ? (
                          <img
                            src={t.logo_url}
                            alt={t.organization}
                            className="w-10 h-10 rounded-xl object-contain bg-slate-50 border border-slate-200 p-1 shrink-0"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-xl bg-purple-50 text-[#7c3aed] flex items-center justify-center font-bold text-xs shrink-0 border border-purple-200">
                            <Building2 className="w-5 h-5" />
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-slate-900 truncate">{t.client_name}</p>
                          <p className="text-[11px] font-semibold text-[#7c3aed] truncate">{t.organization}</p>
                          {t.role && <p className="text-[10px] text-slate-400 truncate">{t.role}</p>}
                        </div>
                      </div>

                      <button
                        onClick={() => handleDeleteTestimonial(t.id)}
                        className="p-2 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-xl transition-colors shrink-0 ml-2"
                        title="Delete testimonial"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Add Testimonial Modal */}
        {showAddTestimonialModal && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-200 space-y-5 animate-in fade-in zoom-in-95">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-purple-100 text-[#7c3aed] flex items-center justify-center font-bold">
                    <Award className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900">Add Verified Institutional Review</h3>
                    <p className="text-xs text-slate-500">Authentic client / institute testimonial</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowAddTestimonialModal(false)}
                  className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreateTestimonial} className="space-y-4 text-xs">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Client / Representative Name *</label>
                  <Input
                    required
                    value={newTestimonial.client_name}
                    onChange={(e) => setNewTestimonial({ ...newTestimonial, client_name: e.target.value })}
                    placeholder="e.g. Dr. Salman Khan or Engr. Bilal Aslam"
                    className="rounded-xl h-10 border-slate-200"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Organization / Institute *</label>
                    <Input
                      required
                      value={newTestimonial.organization}
                      onChange={(e) => setNewTestimonial({ ...newTestimonial, organization: e.target.value })}
                      placeholder="e.g. FAST NUCES or IEEE Summit"
                      className="rounded-xl h-10 border-slate-200"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Role / Designation</label>
                    <Input
                      value={newTestimonial.role}
                      onChange={(e) => setNewTestimonial({ ...newTestimonial, role: e.target.value })}
                      placeholder="e.g. Dean of CS / Conference Convener"
                      className="rounded-xl h-10 border-slate-200"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Institute Logo / Crest URL</label>
                    <Input
                      value={newTestimonial.logo_url}
                      onChange={(e) => setNewTestimonial({ ...newTestimonial, logo_url: e.target.value })}
                      placeholder="https://.../logo.png"
                      className="rounded-xl h-10 border-slate-200"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Rating (1 to 5 Stars)</label>
                    <select
                      value={newTestimonial.rating}
                      onChange={(e) => setNewTestimonial({ ...newTestimonial, rating: parseInt(e.target.value, 10) })}
                      className="w-full h-10 rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#7c3aed]"
                    >
                      <option value={5}>⭐⭐⭐⭐⭐ (5 Stars - Exceptional)</option>
                      <option value={4}>⭐⭐⭐⭐ (4 Stars - Highly Satisfied)</option>
                      <option value={3}>⭐⭐⭐ (3 Stars - Satisfied)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Authentic Feedback / Quote *</label>
                  <textarea
                    required
                    rows={4}
                    value={newTestimonial.feedback}
                    onChange={(e) => setNewTestimonial({ ...newTestimonial, feedback: e.target.value })}
                    placeholder="Write the authentic institutional feedback regarding EventoraX's certificate issuance, badge generation, or attendance..."
                    className="w-full rounded-xl border border-slate-200 p-3 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#7c3aed]"
                  />
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="featured-check"
                    checked={newTestimonial.is_featured}
                    onChange={(e) => setNewTestimonial({ ...newTestimonial, is_featured: e.target.checked })}
                    className="w-4 h-4 rounded text-[#7c3aed] focus:ring-[#7c3aed]"
                  />
                  <label htmlFor="featured-check" className="text-xs font-bold text-slate-700 cursor-pointer">
                    Feature immediately on live official landing page
                  </label>
                </div>

                <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowAddTestimonialModal(false)}
                    className="flex-1 rounded-xl text-xs h-10 border-slate-200"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={testimonialSubmitting}
                    className="flex-1 bg-[#7c3aed] hover:bg-[#6d28d9] text-white rounded-xl text-xs h-10 font-bold"
                  >
                    {testimonialSubmitting ? "Publishing..." : "Publish Review"}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ================= MODAL 1: TENANT INSPECTOR MODAL ================= */}
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

              {inspectingTenant.id === 1 || inspectingTenant.slug === 'eventorax-hq' ? (
                <div className="p-3 rounded-xl bg-blue-50/70 border border-blue-100 text-xs text-blue-900 space-y-1">
                  <span className="font-bold block">Platform Master SuperAdmin Authority</span>
                  <p className="text-[11px] text-slate-500">
                    EventoraX HQ governs the entire multi-tenant SaaS platform. Public event portals only exist for registered client organizations.
                  </p>
                </div>
              ) : (
                <div className="p-3 rounded-xl bg-blue-50/70 border border-blue-100 text-xs text-blue-900 space-y-1">
                  <span className="font-bold block">Isolated Public Portal URL:</span>
                  <code className="text-[11px] text-blue-700 font-mono block break-all">
                    {window.location.origin}/c/{inspectingTenant.slug}
                  </code>
                </div>
              )}

              <div className="flex items-center gap-2 pt-2">
                <Button
                  variant="outline"
                  onClick={() => setInspectingTenant(null)}
                  className="flex-1 rounded-xl text-xs h-10 border-slate-200"
                >
                  Close
                </Button>
                {inspectingTenant.id !== 1 && inspectingTenant.slug !== 'eventorax-hq' && (
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
                )}
              </div>
            </div>
          </div>
        )}

        {/* ================= MODAL 2: REJECT SUBSCRIPTION MODAL ================= */}
        {rejectModal.open && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-rose-600" />
                  Reject Subscription Request
                </h3>
                <button
                  onClick={() => setRejectModal({ open: false, subId: null, reason: '' })}
                  className="p-1 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <p className="text-xs text-slate-600">
                Please provide the reason for rejecting this subscription payment reference. The client will be notified to correct payment details.
              </p>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Reason for Rejection *</label>
                <textarea
                  rows={3}
                  value={rejectModal.reason}
                  onChange={(e) => setRejectModal(prev => ({ ...prev, reason: e.target.value }))}
                  placeholder="e.g. Transaction Reference could not be verified with bank / insufficient payment amount."
                  className="w-full p-3 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-rose-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <Button
                  variant="outline"
                  onClick={() => setRejectModal({ open: false, subId: null, reason: '' })}
                  className="flex-1 rounded-xl text-xs h-10 border-slate-200"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleRejectSubscription}
                  className="flex-1 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs h-10 font-bold"
                >
                  Confirm Rejection
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* ================= MODAL 3: ADJUST QUOTAS & PERMISSIONS MODAL ================= */}
        {adjustModal.open && adjustModal.tenant && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Sliders className="w-5 h-5 text-blue-600" />
                  Customize Client Quotas &amp; Access
                </h3>
                <button
                  onClick={() => setAdjustModal({ open: false, tenant: null, maxEvents: 25, maxAttendees: 5000, whiteLabel: false })}
                  className="p-1 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <p className="text-xs text-slate-600">
                Fine-tune feature permissions and usage capacity specifically for <strong>{adjustModal.tenant.name}</strong>.
              </p>

              <div className="space-y-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Max Events Allowed</label>
                  <Input
                    type="number"
                    value={adjustModal.maxEvents}
                    onChange={(e) => setAdjustModal(prev => ({ ...prev, maxEvents: parseInt(e.target.value, 10) || 1 }))}
                    className="rounded-xl border-slate-300 text-xs h-10"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Max Attendees Quota</label>
                  <Input
                    type="number"
                    value={adjustModal.maxAttendees}
                    onChange={(e) => setAdjustModal(prev => ({ ...prev, maxAttendees: parseInt(e.target.value, 10) || 100 }))}
                    className="rounded-xl border-slate-300 text-xs h-10"
                  />
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="white-label-check"
                    checked={adjustModal.whiteLabel}
                    onChange={(e) => setAdjustModal(prev => ({ ...prev, whiteLabel: e.target.checked }))}
                    className="w-4 h-4 rounded text-blue-600 border-slate-300 focus:ring-blue-500"
                  />
                  <label htmlFor="white-label-check" className="text-xs font-bold text-slate-700 cursor-pointer">
                    Enable Full White-Label &amp; Custom CNAME Domain
                  </label>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-3">
                <Button
                  variant="outline"
                  onClick={() => setAdjustModal({ open: false, tenant: null, maxEvents: 25, maxAttendees: 5000, whiteLabel: false })}
                  className="flex-1 rounded-xl text-xs h-10 border-slate-200"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSavePermissions}
                  className="flex-1 bg-[#1d4ed8] hover:bg-[#1e40af] text-white rounded-xl text-xs h-10 font-bold"
                >
                  Save Quotas
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Approved License Key Modal */}
        {approvedLicenseModal?.open && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in">
            <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Subscription Approved &amp; License Issued</h3>
                    <p className="text-[11px] text-slate-500">Cryptographic workspace key generated</p>
                  </div>
                </div>
                <button
                  onClick={() => setApprovedLicenseModal(null)}
                  className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">Client Organization:</span>
                  <strong className="text-slate-900">{approvedLicenseModal.tenantName}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Plan Tier:</span>
                  <strong className="text-slate-900">{approvedLicenseModal.plan}</strong>
                </div>
                {approvedLicenseModal.expiresAt && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">Expires On:</span>
                    <strong className="text-slate-900">{new Date(approvedLicenseModal.expiresAt).toLocaleDateString()}</strong>
                  </div>
                )}
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5">
                  Activation License Key (Provide to Client):
                </label>
                <div className="flex items-center gap-2 p-3 bg-blue-50 border-2 border-blue-200 rounded-2xl">
                  <span className="font-mono font-bold text-base text-[#1d4ed8] tracking-wider flex-1 truncate">
                    {approvedLicenseModal.licenseKey}
                  </span>
                  <Button
                    size="sm"
                    onClick={() => copyToClipboard(approvedLicenseModal.licenseKey)}
                    className="bg-[#1d4ed8] hover:bg-[#1e40af] text-white rounded-xl text-xs font-bold h-8 px-3 shrink-0 flex items-center gap-1.5"
                  >
                    {copiedTid === approvedLicenseModal.licenseKey ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        Copied
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        Copy Key
                      </>
                    )}
                  </Button>
                </div>
              </div>

              <p className="text-[11px] text-slate-500">
                This key has been cryptographically associated with the client tenant. They can enter this key in their Activation Gateway to instantly unlock their dashboard.
              </p>

              <div className="pt-2">
                <Button
                  onClick={() => setApprovedLicenseModal(null)}
                  className="w-full bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold h-10"
                >
                  Done &amp; Close
                </Button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
