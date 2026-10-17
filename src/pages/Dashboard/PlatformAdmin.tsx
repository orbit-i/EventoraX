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
  Plus,
  Database,
  Download,
  Percent,
  Edit,
  Users
} from "lucide-react";
import { api } from "@/services/api";
import { useAuth } from "@/context/AuthContext";
import {
  EasypaisaBadge,
  JazzCashBadge,
  RaastBadge,
  BankTransferBadge,
  SafepayBadge,
  CardNetworksBadge
} from "@/components/payment/PaymentLogos";

type AdminTab = 'overview' | 'licenses' | 'approvals' | 'tenants' | 'billing' | 'pricing' | 'gateways' | 'casestudies' | 'directory' | 'team' | 'testimonials' | 'cms' | 'security' | 'notifications' | 'backup' | 'profile';

export default function PlatformAdmin() {
  const { isSuperAdmin, user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  // Tab State synced with URL query param `?tab=...`
  const urlTab = (searchParams.get('tab') as AdminTab) || 'overview';
  const [activeTab, setActiveTab] = useState<AdminTab>(urlTab);

  useEffect(() => {
    const t = (searchParams.get('tab') as AdminTab) || 'overview';
    setActiveTab(t);
  }, [searchParams]);

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

  // Dynamic Pricing Plans & Coupons Management State
  const [adminPlans, setAdminPlans] = useState<any[]>([]);
  const [adminCoupons, setAdminCoupons] = useState<any[]>([]);
  const [pricingSubTab, setPricingSubTab] = useState<'plans' | 'coupons'>('plans');
  const [plansLoading, setPlansLoading] = useState(false);
  const [couponsLoading, setCouponsLoading] = useState(false);
  const [editPlanModal, setEditPlanModal] = useState<{ open: boolean; isNew: boolean; plan: any }>({
    open: false,
    isNew: false,
    plan: {
      name: '',
      slug: '',
      monthly_price: 99,
      yearly_price: 79,
      tag: '',
      attendees_limit: 5000,
      max_events: 25,
      max_certs: 500,
      white_label: 1,
      featuresText: '',
      is_active: 1,
      display_order: 1
    }
  });
  const [savingPlan, setSavingPlan] = useState(false);
  const [editCouponModal, setEditCouponModal] = useState<{ open: boolean; isNew: boolean; coupon: any }>({
    open: false,
    isNew: false,
    coupon: {
      code: '',
      description: '',
      discount_type: 'percentage',
      discount_value: 20,
      min_purchase: 0,
      max_uses: 1000,
      expires_at: '',
      is_active: 1
    }
  });
  const [savingCoupon, setSavingCoupon] = useState(false);

  // Disaster Recovery & System Backup State
  const [backupSnapshots, setBackupSnapshots] = useState<any[]>([]);
  const [backupLoading, setBackupLoading] = useState(false);
  const [creatingSnapshot, setCreatingSnapshot] = useState(false);
  const [snapshotMsg, setSnapshotMsg] = useState<string | null>(null);

  // Dynamic Platform Team Management (ORBIT-I Leadership) State
  const [platformTeam, setPlatformTeam] = useState<any[]>([]);
  const [teamLoading, setTeamLoading] = useState(false);
  const [teamModal, setTeamModal] = useState<{
    open: boolean;
    isNew: boolean;
    member: {
      id?: number;
      name: string;
      role: string;
      department: string;
      bio: string;
      avatar_url: string;
      display_order: number;
      is_active: boolean | number;
    };
  }>({
    open: false,
    isNew: true,
    member: {
      name: '',
      role: '',
      department: 'ORBIT-I Platform',
      bio: '',
      avatar_url: '',
      display_order: 1,
      is_active: 1
    }
  });
  const [savingMember, setSavingMember] = useState(false);

  // ==========================================
  // PAYMENT GATEWAYS & MERCHANT ACCOUNTS STATE
  // ==========================================
  const [merchantGateways, setMerchantGateways] = useState<any>({
    easypaisa: { enabled: true, title: 'Easypaisa Mobile Wallet & QR', account_title: 'ORBIT-I Private Limited', account_number: '03190375751', store_id: 'EP-ORBIT-2026', hash_key: '', api_mode: 'manual', instructions: 'Send subscription fee to Easypaisa Account 03190375751. Enter 11-digit TID below.' },
    jazzcash: { enabled: true, title: 'JazzCash Mobile Wallet & Till', account_title: 'ORBIT-I Private Limited', account_number: '03001234567', till_id: 'JC-ORBIT-8899', merchant_id: '', password: '', salt: '', api_mode: 'manual', instructions: 'Send amount to JazzCash Till 03001234567. Enter TID below.' },
    raast: { enabled: true, title: 'Raast Instant Pay (State Bank of Pakistan)', account_title: 'ORBIT-I Private Limited', iban: 'PK45MEZN0001234567890101', raast_id: '03190375751', instructions: 'Pay instantly via mobile banking app using Raast ID or IBAN.' },
    bank_transfer: { enabled: true, title: 'Direct Corporate Bank Transfer', bank_name: 'Meezan Bank Limited', account_title: 'ORBIT-I Private Limited', account_number: '01020304050607', iban: 'PK45MEZN0001234567890101', branch: 'F-7 Markaz, Islamabad', instructions: 'Direct wire to our Meezan Bank corporate clearing account.' },
    safepay: { enabled: true, title: 'Safepay Pakistan (Debit / Credit Cards & PayPak)', public_key: 'sec_sandbox_eventrye_2026', secret_key: '', environment: 'sandbox', instructions: 'Accept Visa, Mastercard and PayPak.' },
    stripe: { enabled: true, title: 'Stripe International (Global USD Cards)', publishable_key: 'pk_test_eventrye_global_2026', secret_key: '', instructions: 'Accept all international cards and Apple Pay.' }
  });
  const [, setGatewaysLoading] = useState(false);
  const [gatewaysSaving, setGatewaysSaving] = useState(false);
  const [gatewaysMsg, setGatewaysMsg] = useState<string | null>(null);

  const loadGateways = async () => {
    setGatewaysLoading(true);
    try {
      const res = await api.merchantGateways.getAdmin();
      if (res.success && res.gateways) setMerchantGateways(res.gateways);
    } catch (err) {
      console.error('Failed to load gateways:', err);
    } finally {
      setGatewaysLoading(false);
    }
  };

  const handleSaveGateways = async (e: React.FormEvent) => {
    e.preventDefault();
    setGatewaysSaving(true);
    setGatewaysMsg(null);
    try {
      const res = await api.merchantGateways.update(merchantGateways);
      if (res.success) {
        setGatewaysMsg('Payment Gateways & Merchant Credentials updated live!');
        setTimeout(() => setGatewaysMsg(null), 4000);
      }
    } catch (err: any) {
      alert(err.message || 'Failed to update gateways');
    } finally {
      setGatewaysSaving(false);
    }
  };

  // ==========================================
  // CASE STUDIES & PAST EVENTS STATE
  const [caseStudiesList, setCaseStudiesList] = useState<any[]>([]);
  const [, setCaseStudiesLoading] = useState(false);
  const [caseStudyModal, setCaseStudyModal] = useState<{ open: boolean; isNew: boolean; study: any }>({
    open: false,
    isNew: true,
    study: {
      title: '',
      client_name: '',
      category: 'Technology & AI',
      event_date: 'July 2026',
      attendees_count: 1000,
      certs_count: 1000,
      banner_url: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1200&auto=format&fit=crop&q=80',
      summary: '',
      problem: '',
      solution: '',
      resultsText: '100% automated check-ins\nZero gate delays\nInstant tamper-evident verification',
      quote: '',
      author: '',
      author_role: '',
      is_featured: 1
    }
  });
  const [savingCaseStudy, setSavingCaseStudy] = useState(false);

  const loadCaseStudies = async () => {
    setCaseStudiesLoading(true);
    try {
      const res = await api.caseStudies.list();
      if (res.success && res.studies) setCaseStudiesList(res.studies);
    } catch (err) {
      console.error('Failed to load case studies:', err);
    } finally {
      setCaseStudiesLoading(false);
    }
  };

  const handleSaveCaseStudy = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingCaseStudy(true);
    try {
      const studyPayload = {
        ...caseStudyModal.study,
        results: caseStudyModal.study.resultsText
          ? caseStudyModal.study.resultsText.split('\n').map((s: string) => s.trim()).filter(Boolean)
          : (Array.isArray(caseStudyModal.study.results) ? caseStudyModal.study.results : [])
      };
      if (caseStudyModal.isNew) {
        const res = await api.caseStudies.create(studyPayload);
        if (res.success) {
          setCaseStudyModal({ open: false, isNew: true, study: {} });
          await loadCaseStudies();
        }
      } else {
        const res = await api.caseStudies.update(caseStudyModal.study.id, studyPayload);
        if (res.success) {
          setCaseStudyModal({ open: false, isNew: false, study: {} });
          await loadCaseStudies();
        }
      }
    } catch (err: any) {
      alert(err.message || 'Failed to save case study');
    } finally {
      setSavingCaseStudy(false);
    }
  };

  const handleDeleteCaseStudy = async (id: number) => {
    if (!confirm('Are you sure you want to delete this case study?')) return;
    try {
      const res = await api.caseStudies.delete(id);
      if (res.success) await loadCaseStudies();
    } catch (err: any) {
      alert(err.message || 'Failed to delete case study');
    }
  };

  // ==========================================
  // 3RD-PARTY EVENTS DIRECTORY & BOOKINGS STATE
  const [directoryEventsList, setDirectoryEventsList] = useState<any[]>([]);
  const [, setDirectoryLoading] = useState(false);
  const [directoryBookingsList, setDirectoryBookingsList] = useState<any[]>([]);
  const [directorySubTab, setDirectorySubTab] = useState<'events' | 'bookings'>('events');
  const [directoryModal, setDirectoryModal] = useState<{ open: boolean; isNew: boolean; event: any }>({
    open: false,
    isNew: true,
    event: {
      title: '',
      organizer_name: '',
      category: 'Technology',
      event_type: 'Conference',
      start_date: '',
      end_date: '',
      location: '',
      city: 'Nawabshah',
      banner_url: '',
      description: '',
      ticket_tiers: [
        { id: 'standard', name: 'General Delegate', price_pkr: 3500, price_usd: 12, perks: ['Full Hall Access', 'Digital Certificate'], available: 200, sold: 0 }
      ],
      is_approved: 1,
      is_featured: 1
    }
  });
  const [savingDirectoryEvent, setSavingDirectoryEvent] = useState(false);

  const loadDirectoryEvents = async () => {
    setDirectoryLoading(true);
    try {
      const [evRes, bkRes] = await Promise.allSettled([
        api.directoryEvents.list(true),
        api.directoryEvents.getBookings()
      ]);
      if (evRes.status === 'fulfilled' && evRes.value.success) setDirectoryEventsList(evRes.value.events);
      if (bkRes.status === 'fulfilled' && bkRes.value.success) setDirectoryBookingsList(bkRes.value.bookings);
    } catch (err) {
      console.error('Failed to load directory events:', err);
    } finally {
      setDirectoryLoading(false);
    }
  };

  const handleSaveDirectoryEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingDirectoryEvent(true);
    try {
      if (directoryModal.isNew) {
        const res = await api.directoryEvents.create(directoryModal.event);
        if (res.success) {
          setDirectoryModal({ open: false, isNew: true, event: {} });
          await loadDirectoryEvents();
        }
      } else {
        const res = await api.directoryEvents.update(directoryModal.event.id, directoryModal.event);
        if (res.success) {
          setDirectoryModal({ open: false, isNew: false, event: {} });
          await loadDirectoryEvents();
        }
      }
    } catch (err: any) {
      alert(err.message || 'Failed to save directory event');
    } finally {
      setSavingDirectoryEvent(false);
    }
  };

  const handleDeleteDirectoryEvent = async (id: number) => {
    if (!confirm('Are you sure you want to remove this event from the directory?')) return;
    try {
      const res = await api.directoryEvents.delete(id);
      if (res.success) await loadDirectoryEvents();
    } catch (err: any) {
      alert(err.message || 'Failed to delete directory event');
    }
  };

  // ==========================================
  // SUPERADMIN PROFILE & CREDENTIALS STATE
  // ==========================================
  const [adminProfileName, setAdminProfileName] = useState(user?.fullName || 'Platform SuperAdmin');
  const [adminProfileEmail, setAdminProfileEmail] = useState(user?.email || 'admin@eventrye.com');
  const [adminCurrentPassword, setAdminCurrentPassword] = useState('');
  const [adminNewPassword, setAdminNewPassword] = useState('');
  const [adminConfirmPassword, setAdminConfirmPassword] = useState('');
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileMsg, setProfileMsg] = useState<string | null>(null);

  const handleSaveAdminProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileSaving(true);
    setProfileMsg(null);
    try {
      await api.auth.updateProfile({ fullName: adminProfileName });
      if (adminNewPassword) {
        if (adminNewPassword !== adminConfirmPassword) {
          alert('New password and confirm password do not match.');
          setProfileSaving(false);
          return;
        }
        await api.auth.changePassword({ currentPassword: adminCurrentPassword, newPassword: adminNewPassword });
        setAdminCurrentPassword('');
        setAdminNewPassword('');
        setAdminConfirmPassword('');
      }
      setProfileMsg('SuperAdmin profile and credentials updated successfully!');
      setTimeout(() => setProfileMsg(null), 4000);
    } catch (err: any) {
      alert(err.message || 'Failed to update credentials.');
    } finally {
      setProfileSaving(false);
    }
  };

  const loadPlatformTeam = async () => {
    setTeamLoading(true);
    try {
      const res = await api.platformAdmin.getPlatformTeam();
      if (res?.success && Array.isArray(res.team)) {
        setPlatformTeam(res.team);
      }
    } catch (err) {
      console.error('Failed to load platform team:', err);
    } finally {
      setTeamLoading(false);
    }
  };

  const handleSaveTeamMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!teamModal.member.name.trim() || !teamModal.member.role.trim()) {
      alert('Please provide member Name and Role.');
      return;
    }
    setSavingMember(true);
    try {
      const res = await api.platformAdmin.savePlatformTeam(teamModal.member);
      if (res.success) {
        setTeamModal({ ...teamModal, open: false });
        await loadPlatformTeam();
      }
    } catch (err: any) {
      alert(err.message || 'Failed to save team member.');
    } finally {
      setSavingMember(false);
    }
  };

  const handleDeleteTeamMember = async (id: number) => {
    if (!confirm('Are you sure you want to remove this team member from the official ORBIT-I leadership roster?')) return;
    try {
      const res = await api.platformAdmin.deletePlatformTeam(id);
      if (res.success) {
        setPlatformTeam(prev => prev.filter(m => m.id !== id));
      }
    } catch (err: any) {
      alert(err.message || 'Failed to delete team member.');
    }
  };

  const loadAdminPlans = async () => {
    setPlansLoading(true);
    try {
      const res = await api.platformAdmin.getPlans();
      if (res.success && res.plans) {
        setAdminPlans(res.plans);
      }
    } catch (err) {
      console.error('Failed to load plans:', err);
    } finally {
      setPlansLoading(false);
    }
  };

  const loadAdminCoupons = async () => {
    setCouponsLoading(true);
    try {
      const res = await api.platformAdmin.getCoupons();
      if (res.success && res.coupons) {
        setAdminCoupons(res.coupons);
      }
    } catch (err) {
      console.error('Failed to load coupons:', err);
    } finally {
      setCouponsLoading(false);
    }
  };

  const loadBackupSnapshots = async () => {
    setBackupLoading(true);
    try {
      const res = await api.platformAdmin.getBackupSnapshots();
      if (res.success && res.snapshots) {
        setBackupSnapshots(res.snapshots);
      }
    } catch (err) {
      console.error('Failed to load backup snapshots:', err);
    } finally {
      setBackupLoading(false);
    }
  };

  const handleCreateDiskSnapshot = async () => {
    setCreatingSnapshot(true);
    setSnapshotMsg(null);
    try {
      const res = await api.platformAdmin.createBackupSnapshot();
      if (res.success) {
        setSnapshotMsg(`Success: ${res.message} (${res.snapshot?.fileName || ''} • ${res.snapshot?.sizeKb || 0} KB)`);
        loadBackupSnapshots();
      }
    } catch (err: any) {
      setSnapshotMsg(`Error: ${err.message || 'Failed to create backup snapshot'}`);
    } finally {
      setCreatingSnapshot(false);
    }
  };

  const handleDownloadBackup = (format: 'sql' | 'json') => {
    const token = localStorage.getItem('token') || '';
    window.open(`/api/admin/backup/export?format=${format}&token=${encodeURIComponent(token)}`, '_blank');
  };

  const handleSavePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingPlan(true);
    try {
      const featuresArray = editPlanModal.plan.featuresText
        ? editPlanModal.plan.featuresText.split('\n').map((s: string) => s.trim()).filter(Boolean)
        : (Array.isArray(editPlanModal.plan.features) ? editPlanModal.plan.features : []);
      
      const payload = {
        id: editPlanModal.isNew ? undefined : editPlanModal.plan.id,
        name: editPlanModal.plan.name,
        slug: editPlanModal.plan.slug || editPlanModal.plan.name,
        monthly_price: Number(editPlanModal.plan.monthly_price),
        yearly_price: Number(editPlanModal.plan.yearly_price),
        tag: editPlanModal.plan.tag,
        attendees_limit: Number(editPlanModal.plan.attendees_limit),
        max_events: Number(editPlanModal.plan.max_events),
        max_certs: Number(editPlanModal.plan.max_certs),
        white_label: Boolean(editPlanModal.plan.white_label),
        features: featuresArray,
        is_active: Boolean(editPlanModal.plan.is_active),
        display_order: Number(editPlanModal.plan.display_order || 1)
      };

      const res = await api.platformAdmin.savePlan(payload);
      if (res.success) {
        setEditPlanModal({ open: false, isNew: false, plan: {} });
        await loadAdminPlans();
      }
    } catch (err: any) {
      alert(err.message || 'Failed to save plan');
    } finally {
      setSavingPlan(false);
    }
  };

  const handleDeletePlan = async (id: number) => {
    if (!confirm('Are you sure you want to remove this pricing plan?')) return;
    try {
      const res = await api.platformAdmin.deletePlan(id);
      if (res.success) {
        await loadAdminPlans();
      }
    } catch (err: any) {
      alert(err.message || 'Failed to delete plan');
    }
  };

  const handleSaveCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingCoupon(true);
    try {
      const payload = {
        id: editCouponModal.isNew ? undefined : editCouponModal.coupon.id,
        code: editCouponModal.coupon.code.trim().toUpperCase(),
        description: editCouponModal.coupon.description,
        discount_type: editCouponModal.coupon.discount_type,
        discount_value: Number(editCouponModal.coupon.discount_value),
        min_purchase: Number(editCouponModal.coupon.min_purchase || 0),
        max_uses: Number(editCouponModal.coupon.max_uses || 1000),
        expires_at: editCouponModal.coupon.expires_at || null,
        is_active: Boolean(editCouponModal.coupon.is_active)
      };

      const res = await api.platformAdmin.saveCoupon(payload);
      if (res.success) {
        setEditCouponModal({ open: false, isNew: false, coupon: {} });
        await loadAdminCoupons();
      }
    } catch (err: any) {
      alert(err.message || 'Failed to save coupon');
    } finally {
      setSavingCoupon(false);
    }
  };

  const handleDeleteCoupon = async (id: number) => {
    if (!confirm('Are you sure you want to delete this coupon?')) return;
    try {
      const res = await api.platformAdmin.deleteCoupon(id);
      if (res.success) {
        await loadAdminCoupons();
      }
    } catch (err: any) {
      alert(err.message || 'Failed to delete coupon');
    }
  };

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
    loadPlatformTeam();
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
    if (activeTab === 'team') {
      loadPlatformTeam();
    }
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
    if (activeTab === 'pricing') {
      loadAdminPlans();
      loadAdminCoupons();
    }
    if (activeTab === 'backup') {
      loadBackupSnapshots();
    }
    if (activeTab === 'gateways') {
      loadGateways();
    }
    if (activeTab === 'casestudies') {
      loadCaseStudies();
    }
    if (activeTab === 'directory') {
      loadDirectoryEvents();
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
              Eventrye Master SuperAdmin • Platform Authority
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight font-heading">
              Eventrye Platform Governance &amp; Approvals HQ
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
            onClick={() => switchTab('team')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
              activeTab === 'team'
                ? 'bg-[#1d4ed8] text-white shadow-md shadow-blue-600/20'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <Users className="w-4 h-4 text-purple-600" />
            ORBIT-I Core Team ({platformTeam.length || 4})
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

          <button
            onClick={() => switchTab('backup')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
              activeTab === 'backup'
                ? 'bg-[#1d4ed8] text-white shadow-md shadow-blue-600/20'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <Database className="w-4 h-4 text-emerald-600" />
            Disaster Recovery &amp; Backups
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
                    <strong>SuperAdmin (Eventrye HQ):</strong> Governs the SaaS platform, approves client plan payments, manages market pricing, monitors security &amp; 24/7 compliance, and configures the public website CMS. SuperAdmin does NOT create event badges or certificates for personal use.
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
                        const licPlan = (lic.plan || '').toLowerCase();
                        const licStat = lic.license_status || lic.licenseStatus || lic.status;
                        if (licensePlanFilter !== 'All' && licPlan !== licensePlanFilter.toLowerCase()) return false;
                        if (licenseStatusFilter !== 'All' && licStat !== licenseStatusFilter) return false;
                        if (licenseSearch) {
                          const q = licenseSearch.toLowerCase();
                          const matchKey = (lic.license_key || lic.licenseKey || '').toLowerCase().includes(q);
                          const matchName = String(lic.name || lic.tenantName || '').toLowerCase().includes(q);
                          const matchEmail = (lic.owner_email || lic.ownerEmail || '').toLowerCase().includes(q);
                          return matchKey || matchName || matchEmail;
                        }
                        return true;
                      })
                      .map((lic) => {
                        const eventsUsed = lic.events_count ?? lic.eventsUsed ?? 0;
                        const eventsLimit = lic.max_events ?? lic.eventsLimit ?? 25;
                        const attendeesUsed = lic.attendees_count ?? lic.attendeesUsed ?? 0;
                        const attendeesLimit = lic.max_attendees ?? lic.attendeesLimit ?? 5000;
                        const certsUsed = lic.certs_count ?? lic.certsUsed ?? 0;
                        const certsLimit = lic.max_certs ?? lic.certsLimit ?? 5000;

                        const eventPercent = Math.min(100, Math.round((eventsUsed / (eventsLimit || 1)) * 100));
                        const attendeePercent = Math.min(100, Math.round((attendeesUsed / (attendeesLimit || 1)) * 100));
                        const certPercent = Math.min(100, Math.round((certsUsed / (certsLimit || 1)) * 100));

                        const isActive = lic.license_status === 'active' || lic.licenseStatus === 'active' || lic.status === 'active';
                        const isPending = lic.status === 'pending_approval' || lic.license_status === 'pending';
                        const licKey = lic.license_key || lic.licenseKey;
                        const licId = lic.id || lic.tenantId || lic.tenant_id;
                        const licName = String(lic.name || lic.tenantName || 'Organization');
                        const licEmail = lic.owner_email || lic.ownerEmail || lic.slug;

                        return (
                          <tr key={licId} className="hover:bg-slate-50/80 transition-colors">
                            {/* Client Org */}
                            <td className="p-3.5 pl-4">
                              <div className="flex items-center gap-2.5">
                                <div className="w-8 h-8 rounded-lg bg-blue-100 text-[#1d4ed8] font-bold flex items-center justify-center text-xs">
                                  {licName.slice(0, 2).toUpperCase()}
                                </div>
                                <div>
                                  <p className="font-bold text-slate-900 text-xs">{licName}</p>
                                  <p className="text-[11px] text-slate-500">{licEmail}</p>
                                </div>
                              </div>
                            </td>

                            {/* License Key */}
                            <td className="p-3.5">
                              {licKey ? (
                                <div className="inline-flex items-center gap-1.5 bg-slate-100 border border-slate-300 px-2.5 py-1 rounded-lg">
                                  <span className="font-mono font-bold text-slate-900 text-xs tracking-wider">
                                    {licKey}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => copyToClipboard(licKey)}
                                    className="p-1 rounded hover:bg-slate-200 text-slate-500 hover:text-slate-800 transition-colors"
                                    title="Copy Key"
                                  >
                                    {copiedTid === licKey ? (
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
                                  onClick={() => handleRenewLicense(licId, 365)}
                                  className="h-7 px-2 text-[11px] rounded-lg text-emerald-700 hover:bg-emerald-50 border-emerald-300"
                                  title="Renew License for 365 days"
                                >
                                  +1 Yr
                                </Button>

                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleRegenerateKey(licId)}
                                  className="h-7 px-2 text-[11px] rounded-lg text-blue-700 hover:bg-blue-50 border-blue-300"
                                  title="Regenerate Activation Key"
                                >
                                  Regen Key
                                </Button>

                                {isActive ? (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleRevokeLicense(licId)}
                                    className="h-7 px-2 text-[11px] rounded-lg text-rose-700 hover:bg-rose-50 border-rose-300"
                                    title="Suspend Organization License"
                                  >
                                    Suspend
                                  </Button>
                                ) : (
                                  <Button
                                    size="sm"
                                    onClick={() => handleRenewLicense(licId, 365)}
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
                              {s.payment_method?.toLowerCase().includes('safepay') ? <ShieldCheck className="w-3 h-3 text-[#182A4D]" /> :
                               s.payment_method?.toLowerCase().includes('card') ? <CreditCard className="w-3 h-3 text-blue-600" /> :
                               s.payment_method?.toLowerCase().includes('bank') ? <Building2 className="w-3 h-3 text-slate-700" /> :
                               s.payment_method?.toLowerCase().includes('jazz') ? <Smartphone className="w-3 h-3 text-red-600" /> :
                               s.payment_method?.toLowerCase().includes('easy') ? <Smartphone className="w-3 h-3 text-emerald-600" /> :
                               s.payment_method?.toLowerCase().includes('sada') ? <CreditCard className="w-3 h-3 text-[#00A389]" /> :
                               s.payment_method?.toLowerCase().includes('naya') ? <Smartphone className="w-3 h-3 text-[#FF5C00]" /> :
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
                    const isMaster = t.id === 1 || t.slug === 'eventrye-hq';

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
        {/* TAB 4: DYNAMIC PRICING & PROMOTIONAL COUPONS MANAGEMENT */}
        {/* ============================================================== */}
        {activeTab === 'pricing' && (
          <div className="bg-white rounded-3xl border border-[#e2e8f0] shadow-xs p-6 space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
              <div>
                <h2 className="text-lg font-bold text-[#0f172a] flex items-center gap-2">
                  <Tag className="w-5 h-5 text-indigo-600" />
                  Dynamic Market Pricing &amp; Coupon Codes
                </h2>
                <p className="text-xs text-[#64748b]">
                  SuperAdmin can edit subscription tier fees, attendee limits, and generate live promotional discount coupons in real-time.
                </p>
              </div>

              {/* Sub-tab Switcher & Actions */}
              <div className="flex flex-wrap items-center gap-2">
                <div className="inline-flex rounded-xl p-1 bg-slate-100 border border-slate-200 text-xs font-bold">
                  <button
                    type="button"
                    onClick={() => setPricingSubTab('plans')}
                    className={`px-3 py-1.5 rounded-lg transition-all ${
                      pricingSubTab === 'plans' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Subscription Plans ({adminPlans.length || 3})
                  </button>
                  <button
                    type="button"
                    onClick={() => setPricingSubTab('coupons')}
                    className={`px-3 py-1.5 rounded-lg transition-all ${
                      pricingSubTab === 'coupons' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Coupon Codes ({adminCoupons.length || 3})
                  </button>
                </div>

                {pricingSubTab === 'plans' ? (
                  <Button
                    onClick={() => setEditPlanModal({
                      open: true,
                      isNew: true,
                      plan: {
                        name: '',
                        slug: '',
                        monthly_price: 99,
                        yearly_price: 79,
                        tag: 'Popular',
                        attendees_limit: 5000,
                        max_events: 25,
                        max_certs: 500,
                        white_label: 1,
                        featuresText: '5,000 attendees capacity\nUp to 25 events per year\nID Pass Generator & One-Click Print\n100+ Certificate templates & issuance\nPriority 24/7 technical support',
                        is_active: 1,
                        display_order: adminPlans.length + 1
                      }
                    })}
                    className="bg-[#1d4ed8] hover:bg-[#1e40af] text-white rounded-xl text-xs font-bold h-9 px-3.5 flex items-center gap-1.5"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Add New Plan
                  </Button>
                ) : (
                  <Button
                    onClick={() => setEditCouponModal({
                      open: true,
                      isNew: true,
                      coupon: {
                        code: `PROMO${Math.floor(100 + Math.random() * 900)}`,
                        description: 'Special Event Discount',
                        discount_type: 'percentage',
                        discount_value: 20,
                        min_purchase: 0,
                        max_uses: 1000,
                        expires_at: '2027-01-01',
                        is_active: 1
                      }
                    })}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold h-9 px-3.5 flex items-center gap-1.5"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Create Coupon Code
                  </Button>
                )}

                <a href="/pricing" target="_blank" rel="noreferrer">
                  <Button variant="outline" size="sm" className="rounded-xl text-xs h-9">
                    <ExternalLink className="w-3.5 h-3.5 mr-1" />
                    Public Pricing Page
                  </Button>
                </a>
              </div>
            </div>

            {/* SUB-VIEW 1: PLANS MANAGEMENT */}
            {pricingSubTab === 'plans' && (
              <div className="space-y-4">
                {plansLoading ? (
                  <div className="py-12 text-center text-xs text-slate-500">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto text-blue-600 mb-2" />
                    Loading dynamic pricing plans...
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {(adminPlans.length > 0 ? adminPlans : [
                      { id: 1, name: 'Starter', slug: 'starter', monthly_price: 0, yearly_price: 0, tag: 'Free Community Tier', attendees_limit: 500, max_events: 5, max_certs: 50, white_label: 0, features: ['Up to 500 attendees', 'Max 5 active events', 'Standard digital ID tickets', 'Event pass QR verification'], is_active: 1 },
                      { id: 2, name: 'Professional', slug: 'professional', monthly_price: 99, yearly_price: 79, tag: 'Most Popular for Organizers', attendees_limit: 5000, max_events: 25, max_certs: 500, white_label: 1, features: ['5,000 attendees capacity', 'Up to 25 events', 'ID Pass Generator & One-Click Print', '100+ Certificate templates', '5 team seats', 'Priority 24/7 support'], is_active: 1 },
                      { id: 3, name: 'Enterprise', slug: 'enterprise', monthly_price: 299, yearly_price: 239, tag: 'Large Summits & Universities', attendees_limit: 50000, max_events: 500, max_certs: 5000, white_label: 1, features: ['50,000+ attendees capacity', 'Unlimited platform events', 'Full White-label & custom domain', 'Bulk CSV pass & certificate generation', 'SSO & 2FA enforcement'], is_active: 1 }
                    ]).map((p: any) => (
                      <div
                        key={p.id || p.name}
                        className={`p-6 rounded-3xl border flex flex-col justify-between space-y-4 transition-all ${
                          p.is_active ? 'border-slate-200 bg-white hover:border-blue-300 hover:shadow-md' : 'border-slate-200 bg-slate-50 opacity-60'
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">{p.name}</span>
                            <div className="flex items-center gap-1.5">
                              {p.tag && (
                                <Badge className="bg-blue-50 text-blue-700 border-blue-200 text-[10px]">
                                  {p.tag}
                                </Badge>
                              )}
                              <Badge className={p.is_active ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-200 text-slate-600'}>
                                {p.is_active ? 'Active' : 'Disabled'}
                              </Badge>
                            </div>
                          </div>

                          <div className="flex items-baseline gap-1 my-2">
                            <span className="text-3xl font-extrabold text-slate-900">${p.monthly_price}</span>
                            <span className="text-xs text-slate-500">/month</span>
                            {p.yearly_price > 0 && (
                              <span className="text-xs font-medium text-emerald-600 ml-2">
                                (${p.yearly_price}/mo billed annually)
                              </span>
                            )}
                          </div>

                          <div className="grid grid-cols-2 gap-2 text-[11px] bg-slate-50 p-2.5 rounded-xl border border-slate-100 my-3 font-medium text-slate-700">
                            <div>👥 {Number(p.attendees_limit).toLocaleString()} Attendees</div>
                            <div>📅 {p.max_events} Events</div>
                            <div>📜 {p.max_certs} Certificates</div>
                            <div>🏷️ {p.white_label ? 'White-Label Yes' : 'No White-Label'}</div>
                          </div>

                          <ul className="space-y-1.5 pt-2 border-t border-slate-100 text-xs text-slate-600">
                            {(Array.isArray(p.features) ? p.features : []).slice(0, 5).map((f: string, i: number) => (
                              <li key={i} className="flex items-start gap-2">
                                <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                                <span className="text-[11px]">{f}</span>
                              </li>
                            ))}
                          </ul>
                        </div>

                        <div className="pt-2 flex items-center gap-2 border-t border-slate-100">
                          <Button
                            onClick={() => setEditPlanModal({
                              open: true,
                              isNew: false,
                              plan: {
                                ...p,
                                featuresText: Array.isArray(p.features) ? p.features.join('\n') : ''
                              }
                            })}
                            variant="outline"
                            className="flex-1 rounded-xl text-xs font-bold h-9 border-slate-300"
                          >
                            <Edit className="w-3.5 h-3.5 mr-1" />
                            Edit Plan
                          </Button>
                          {p.slug !== 'starter' && (
                            <Button
                              onClick={() => handleDeletePlan(p.id)}
                              variant="outline"
                              className="text-rose-600 hover:bg-rose-50 border-rose-200 rounded-xl text-xs h-9 px-3"
                              title="Delete Plan"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* SUB-VIEW 2: COUPONS & DISCOUNTS MANAGEMENT */}
            {pricingSubTab === 'coupons' && (
              <div className="space-y-4">
                {couponsLoading ? (
                  <div className="py-12 text-center text-xs text-slate-500">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto text-blue-600 mb-2" />
                    Loading coupons...
                  </div>
                ) : (
                  <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                        <tr>
                          <th className="p-3 pl-4">Coupon Code</th>
                          <th className="p-3">Discount</th>
                          <th className="p-3">Description</th>
                          <th className="p-3">Min. Purchase</th>
                          <th className="p-3">Usage</th>
                          <th className="p-3">Expires At</th>
                          <th className="p-3">Status</th>
                          <th className="p-3 text-right pr-4">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {(adminCoupons.length > 0 ? adminCoupons : [
                          { id: 1, code: 'ORBIT2026', description: '2026 Platform Launch Promo', discount_type: 'percentage', discount_value: 20, min_purchase: 0, times_used: 14, max_uses: 1000, expires_at: '2027-01-01', is_active: 1 },
                          { id: 2, code: 'EVENTRYE50', description: 'Exclusive 50% Off Early Bird Campaign', discount_type: 'percentage', discount_value: 50, min_purchase: 50, times_used: 8, max_uses: 500, expires_at: '2027-01-01', is_active: 1 },
                          { id: 3, code: 'WELCOME10', description: '$10 Flat Discount for New Organizations', discount_type: 'fixed', discount_value: 10, min_purchase: 20, times_used: 25, max_uses: 2000, expires_at: '2027-01-01', is_active: 1 }
                        ]).map((c: any) => (
                          <tr key={c.id || c.code} className="hover:bg-slate-50/80">
                            <td className="p-3 pl-4 font-mono font-bold text-slate-900">
                              <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-800 border border-blue-200">
                                {c.code}
                              </span>
                            </td>
                            <td className="p-3 font-extrabold text-emerald-700">
                              {c.discount_type === 'percentage' ? `${c.discount_value}% OFF` : `$${c.discount_value} OFF`}
                            </td>
                            <td className="p-3 text-slate-600 max-w-xs truncate">{c.description || '—'}</td>
                            <td className="p-3 text-slate-700 font-medium">
                              {Number(c.min_purchase) > 0 ? `$${c.min_purchase}` : 'No Minimum'}
                            </td>
                            <td className="p-3 font-mono text-slate-800">
                              {c.times_used || 0} / {c.max_uses || '∞'}
                            </td>
                            <td className="p-3 text-slate-500">
                              {c.expires_at ? new Date(c.expires_at).toLocaleDateString() : 'Never'}
                            </td>
                            <td className="p-3">
                              <Badge className={c.is_active ? 'bg-emerald-100 text-emerald-800 text-[10px]' : 'bg-slate-100 text-slate-600 text-[10px]'}>
                                {c.is_active ? 'Active' : 'Disabled'}
                              </Badge>
                            </td>
                            <td className="p-3 text-right pr-4 space-x-1">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setEditCouponModal({ open: true, isNew: false, coupon: c })}
                                className="h-7 px-2.5 text-[11px] rounded-lg"
                              >
                                Edit
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleDeleteCoupon(c.id)}
                                className="h-7 px-2 text-[11px] text-rose-600 hover:bg-rose-50 border-rose-200 rounded-lg"
                              >
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 8: DISASTER RECOVERY & COMPLETE SYSTEM DATABASE BACKUP */}
        {/* Ensures Zero Data Loss for Client Organizations During Version Updates */}
        {/* ============================================================== */}
        {activeTab === 'backup' && (
          <div className="space-y-6">
            <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-indigo-500/20 space-y-5">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/30">
                    <Database className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold uppercase tracking-wider mb-1">
                      <ShieldCheck className="w-3 h-3 text-emerald-400" />
                      100% Zero Data Loss Architecture
                    </div>
                    <h2 className="text-xl font-bold font-heading text-white">
                      Disaster Recovery &amp; Database Backups
                    </h2>
                    <p className="text-xs text-slate-300 mt-0.5">
                      Ensures all client organizations, workspaces, events, passes, and certificates remain 100% safe before publishing software version upgrades.
                    </p>
                  </div>
                </div>

                <Button
                  onClick={handleCreateDiskSnapshot}
                  disabled={creatingSnapshot}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold h-11 px-5 shadow-lg shadow-emerald-600/30 flex items-center gap-2 shrink-0"
                >
                  <RefreshCw className={`w-4 h-4 ${creatingSnapshot ? 'animate-spin' : ''}`} />
                  {creatingSnapshot ? 'Creating Snapshot...' : 'Create Instant Server Disk Snapshot'}
                </Button>
              </div>

              {snapshotMsg && (
                <div className="p-3.5 rounded-2xl bg-emerald-500/20 border border-emerald-400/40 text-emerald-200 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>{snapshotMsg}</span>
                </div>
              )}

              {/* 1-Click Export Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div className="p-5 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Download className="w-5 h-5 text-cyan-400" />
                      <h4 className="font-bold text-sm text-white">Full SQL Master Database Dump (.sql)</h4>
                    </div>
                    <Badge className="bg-cyan-500/20 text-cyan-300 border-cyan-500/40 text-[10px]">
                      MySQL 8.0 / MariaDB
                    </Badge>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Downloads an all-in-one `.sql` script containing full schema structure and row data for all 22 tables. Ready for 1-click restore in MySQL Workbench, phpMyAdmin, or terminal CLI.
                  </p>
                  <Button
                    onClick={() => handleDownloadBackup('sql')}
                    className="w-full bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-xs font-bold h-10 flex items-center justify-center gap-1.5"
                  >
                    <Download className="w-4 h-4" />
                    Download Complete SQL Backup (.sql)
                  </Button>
                </div>

                <div className="p-5 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Database className="w-5 h-5 text-indigo-400" />
                      <h4 className="font-bold text-sm text-white">Structured JSON Multi-Tenant Archive (.json)</h4>
                    </div>
                    <Badge className="bg-indigo-500/20 text-indigo-300 border-indigo-500/40 text-[10px]">
                      JSON Master Archive
                    </Badge>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Downloads complete table datasets as structured JSON. Ideal for cloud object storage backups (AWS S3, Google Cloud Storage, Cloudflare R2), version diffs, and tenant migrations.
                  </p>
                  <Button
                    onClick={() => handleDownloadBackup('json')}
                    className="w-full bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold h-10 flex items-center justify-center gap-1.5"
                  >
                    <Download className="w-4 h-4" />
                    Download JSON Data Archive (.json)
                  </Button>
                </div>
              </div>
            </div>

            {/* Disk Snapshots History */}
            <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-slate-900">Server Storage Snapshots History</h3>
                  <p className="text-xs text-slate-500">
                    Snapshots automatically saved on server disk under `/backups` directory.
                  </p>
                </div>
                <Button
                  onClick={loadBackupSnapshots}
                  variant="outline"
                  size="sm"
                  className="rounded-xl text-xs h-9"
                >
                  <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${backupLoading ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
              </div>

              {backupSnapshots.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-500 bg-slate-50 rounded-2xl border border-slate-200">
                  <Database className="w-8 h-8 text-slate-400 mx-auto mb-2 opacity-60" />
                  No local snapshots created yet. Click &quot;Create Instant Server Disk Snapshot&quot; above to create a local backup.
                </div>
              ) : (
                <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                      <tr>
                        <th className="p-3 pl-4">Snapshot File</th>
                        <th className="p-3">File Size</th>
                        <th className="p-3">Created Date</th>
                        <th className="p-3">Integrity</th>
                        <th className="p-3 text-right pr-4">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {backupSnapshots.map((snap: any, i: number) => (
                        <tr key={i} className="hover:bg-slate-50/80">
                          <td className="p-3 pl-4 font-mono font-bold text-slate-900">{snap.fileName}</td>
                          <td className="p-3 font-mono text-slate-700">{snap.sizeKb} KB</td>
                          <td className="p-3 text-slate-500">{new Date(snap.createdAt).toLocaleString()}</td>
                          <td className="p-3">
                            <span className="text-emerald-700 font-bold flex items-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                              Checksum Verified
                            </span>
                          </td>
                          <td className="p-3 text-right pr-4">
                            <Badge className="bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                              Ready for Restore
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
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
        {/* TAB 6: WEBSITE & PORTAL CMS (COMPREHENSIVE MULTI-PAGE CMS) */}
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
                  Full granular control over hero headlines, value propositions, stats counters, contact details, and institutional statements.
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
                  placeholder="e.g. Eventrye — Next-Gen Automated Event Management"
                  className="rounded-xl border-slate-200 text-xs h-10 font-medium"
                />
              </div>

              {/* Page-Specific Rich CMS Fields */}
              {selectedCmsPageKey === 'home' && (
                <div className="space-y-4">
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

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">Primary CTA Button Label</label>
                      <Input
                        value={cmsContent.cta_primary || "Get Started Free"}
                        onChange={(e) => setCmsContent({ ...cmsContent, cta_primary: e.target.value })}
                        className="rounded-xl border-slate-200 text-xs h-9 font-medium"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">Secondary Action Label</label>
                      <Input
                        value={cmsContent.cta_secondary || "Verify Credential"}
                        onChange={(e) => setCmsContent({ ...cmsContent, cta_secondary: e.target.value })}
                        className="rounded-xl border-slate-200 text-xs h-9 font-medium"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">Live Stat: Passes Issued</label>
                      <Input
                        value={cmsContent.stat_passes || "11,750+ Issued"}
                        onChange={(e) => setCmsContent({ ...cmsContent, stat_passes: e.target.value })}
                        className="rounded-xl border-slate-200 text-xs h-9 font-medium"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">Live Stat: Scan Speed</label>
                      <Input
                        value={cmsContent.stat_speed || "0.8s Gate Latency"}
                        onChange={(e) => setCmsContent({ ...cmsContent, stat_speed: e.target.value })}
                        className="rounded-xl border-slate-200 text-xs h-9 font-medium"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">Live Stat: Tamper Protection</label>
                      <Input
                        value={cmsContent.stat_security || "100% Cryptographic"}
                        onChange={(e) => setCmsContent({ ...cmsContent, stat_security: e.target.value })}
                        className="rounded-xl border-slate-200 text-xs h-9 font-medium"
                      />
                    </div>
                  </div>
                </div>
              )}

              {selectedCmsPageKey === 'about' && (
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">Founding Story &amp; Year</label>
                    <Input
                      value={cmsContent.founding || "Founded in July 2026 by ORBIT-I Private Limited"}
                      onChange={(e) => setCmsContent({ ...cmsContent, founding: e.target.value })}
                      className="rounded-xl border-slate-200 text-xs h-10 font-bold"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">Core Mission Statement</label>
                    <textarea
                      rows={3}
                      value={cmsContent.mission || "To empower every event organizer — from universities to NGOs to corporations — with automated tools that make event management simple, professional, and delightful."}
                      onChange={(e) => setCmsContent({ ...cmsContent, mission: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">Core Vision Statement</label>
                    <textarea
                      rows={3}
                      value={cmsContent.vision || "To become Pakistan's most trusted event management & credential issuance platform."}
                      onChange={(e) => setCmsContent({ ...cmsContent, vision: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>
                </div>
              )}

              {selectedCmsPageKey === 'pricing' && (
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">Pricing Guarantee Statement</label>
                    <Input
                      value={cmsContent.pricing_guarantee || "100% Transparent Pricing in USD and PKR • SBP Raast, Easypaisa & JazzCash Supported"}
                      onChange={(e) => setCmsContent({ ...cmsContent, pricing_guarantee: e.target.value })}
                      className="rounded-xl border-slate-200 text-xs h-10 font-bold"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">Starter Free Trial Policy Notice</label>
                    <textarea
                      rows={2}
                      value={cmsContent.trial_notice || "Starter plan includes a 14-day risk-free trial covering up to 2 events and 40 attendees with full Canva design studio access."}
                      onChange={(e) => setCmsContent({ ...cmsContent, trial_notice: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">Enterprise White-Label SLA Guarantee</label>
                    <textarea
                      rows={2}
                      value={cmsContent.enterprise_sla || "Enterprise plans include dedicated technical account managers, 99.9% uptime SLA, and custom domain white-labeling."}
                      onChange={(e) => setCmsContent({ ...cmsContent, enterprise_sla: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium"
                    />
                  </div>
                </div>
              )}

              {selectedCmsPageKey === 'contact' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">Official WhatsApp / Phone Helpline</label>
                      <Input
                        value={cmsContent.contact_phone || "+92 3190375751"}
                        onChange={(e) => setCmsContent({ ...cmsContent, contact_phone: e.target.value })}
                        className="rounded-xl border-slate-200 text-xs h-10 font-mono font-bold"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">Corporate Support Email</label>
                      <Input
                        value={cmsContent.contact_email || "eventrye@orbit-i.tech"}
                        onChange={(e) => setCmsContent({ ...cmsContent, contact_email: e.target.value })}
                        className="rounded-xl border-slate-200 text-xs h-10 font-mono"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">Headquarters &amp; Office Address</label>
                    <Input
                      value={cmsContent.contact_address || "ORBIT-I Private Limited, Nawabshah, Sindh, Pakistan"}
                      onChange={(e) => setCmsContent({ ...cmsContent, contact_address: e.target.value })}
                      className="rounded-xl border-slate-200 text-xs h-10 font-medium"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">Support Operating Hours</label>
                    <Input
                      value={cmsContent.contact_hours || "Monday - Saturday: 9:00 AM - 6:00 PM PKT • 24/7 Security Hotline"}
                      onChange={(e) => setCmsContent({ ...cmsContent, contact_hours: e.target.value })}
                      className="rounded-xl border-slate-200 text-xs h-10 font-medium"
                    />
                  </div>
                </div>
              )}

              {selectedCmsPageKey === 'legal' && (
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">Regulatory &amp; Data Protection Statement</label>
                    <textarea
                      rows={3}
                      value={cmsContent.legal_compliance || "Eventrye adheres to State Bank of Pakistan (SBP) cybersecurity guidelines and international data isolation protocols."}
                      onChange={(e) => setCmsContent({ ...cmsContent, legal_compliance: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">Tamper-Evident Verification Terms</label>
                    <textarea
                      rows={3}
                      value={cmsContent.legal_verify || "All digital certificates and attendee passes issued by Eventrye contain SHA-256 cryptographic watermarks verifiable permanently at /verify."}
                      onChange={(e) => setCmsContent({ ...cmsContent, legal_verify: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Official Endorsement Statement</label>
                <Input
                  value={cmsContent.endorsement || "Powered by Eventrye • Developed & Maintained by ORBIT-I Private Limited"}
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
        {/* TAB: PAYMENT GATEWAYS & MERCHANT ACCOUNTS */}
        {/* ============================================================== */}
        {activeTab === 'gateways' && (
          <div className="bg-white rounded-3xl border border-[#e2e8f0] shadow-xs p-6 space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-[#0f172a] flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-emerald-600" />
                  Official Merchant Gateways &amp; Payment Accounts
                </h2>
                <p className="text-xs text-[#64748b]">
                  SuperAdmin control center for real Pakistani wallets, State Bank Raast rails, corporate bank clearing, and international cards. All accounts are 100% configurable and live.
                </p>
              </div>

              <Button
                onClick={handleSaveGateways}
                disabled={gatewaysSaving}
                className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold h-10 px-5 flex items-center gap-1.5 shadow-md shadow-emerald-600/20"
              >
                <Save className="w-4 h-4" />
                {gatewaysSaving ? 'Saving...' : 'Save & Deploy Live Credentials'}
              </Button>
            </div>

            {gatewaysMsg && (
              <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                {gatewaysMsg}
              </div>
            )}

            {/* Gateways Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* 1. Easypaisa */}
              <div className="p-5 rounded-2xl border border-slate-200 bg-white shadow-xs space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <div className="flex items-center gap-2.5">
                    <EasypaisaBadge className="w-7 h-7" />
                    <div>
                      <h4 className="text-sm font-bold text-slate-900">Easypaisa Mobile Wallet &amp; QR</h4>
                      <span className="text-[10px] text-emerald-700 font-semibold">Telenor Microfinance Bank</span>
                    </div>
                  </div>
                  <label className="flex items-center gap-1.5 cursor-pointer text-xs font-bold text-slate-700">
                    <input
                      type="checkbox"
                      checked={Boolean(merchantGateways.easypaisa?.enabled)}
                      onChange={(e) => setMerchantGateways({
                        ...merchantGateways,
                        easypaisa: { ...merchantGateways.easypaisa, enabled: e.target.checked }
                      })}
                      className="rounded text-emerald-600 w-4 h-4"
                    />
                    Enabled
                  </label>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Account Title</label>
                    <Input
                      value={merchantGateways.easypaisa?.account_title || ''}
                      onChange={(e) => setMerchantGateways({
                        ...merchantGateways,
                        easypaisa: { ...merchantGateways.easypaisa, account_title: e.target.value }
                      })}
                      className="rounded-xl h-9 text-xs"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Account Number / Mobile</label>
                    <Input
                      value={merchantGateways.easypaisa?.account_number || ''}
                      onChange={(e) => setMerchantGateways({
                        ...merchantGateways,
                        easypaisa: { ...merchantGateways.easypaisa, account_number: e.target.value }
                      })}
                      className="rounded-xl h-9 text-xs font-mono font-bold"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Store ID (Open API)</label>
                    <Input
                      value={merchantGateways.easypaisa?.store_id || ''}
                      onChange={(e) => setMerchantGateways({
                        ...merchantGateways,
                        easypaisa: { ...merchantGateways.easypaisa, store_id: e.target.value }
                      })}
                      placeholder="e.g. EP-ORBIT-2026"
                      className="rounded-xl h-9 text-xs font-mono"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Hash Key / Secret (Optional)</label>
                    <Input
                      type="password"
                      value={merchantGateways.easypaisa?.hash_key || ''}
                      onChange={(e) => setMerchantGateways({
                        ...merchantGateways,
                        easypaisa: { ...merchantGateways.easypaisa, hash_key: e.target.value }
                      })}
                      placeholder="••••••••••••"
                      className="rounded-xl h-9 text-xs font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1 text-xs">Checkout Instructions for Attendees</label>
                  <textarea
                    rows={2}
                    value={merchantGateways.easypaisa?.instructions || ''}
                    onChange={(e) => setMerchantGateways({
                      ...merchantGateways,
                      easypaisa: { ...merchantGateways.easypaisa, instructions: e.target.value }
                    })}
                    className="w-full p-2 rounded-xl border border-slate-200 text-xs"
                  />
                </div>
              </div>

              {/* 2. JazzCash */}
              <div className="p-5 rounded-2xl border border-slate-200 bg-white shadow-xs space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <div className="flex items-center gap-2.5">
                    <JazzCashBadge className="w-7 h-7" />
                    <div>
                      <h4 className="text-sm font-bold text-slate-900">JazzCash Mobile Wallet &amp; Till</h4>
                      <span className="text-[10px] text-red-700 font-semibold">Mobilink Microfinance Bank</span>
                    </div>
                  </div>
                  <label className="flex items-center gap-1.5 cursor-pointer text-xs font-bold text-slate-700">
                    <input
                      type="checkbox"
                      checked={Boolean(merchantGateways.jazzcash?.enabled)}
                      onChange={(e) => setMerchantGateways({
                        ...merchantGateways,
                        jazzcash: { ...merchantGateways.jazzcash, enabled: e.target.checked }
                      })}
                      className="rounded text-red-600 w-4 h-4"
                    />
                    Enabled
                  </label>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Account Title</label>
                    <Input
                      value={merchantGateways.jazzcash?.account_title || ''}
                      onChange={(e) => setMerchantGateways({
                        ...merchantGateways,
                        jazzcash: { ...merchantGateways.jazzcash, account_title: e.target.value }
                      })}
                      className="rounded-xl h-9 text-xs"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Wallet / Till Number</label>
                    <Input
                      value={merchantGateways.jazzcash?.account_number || ''}
                      onChange={(e) => setMerchantGateways({
                        ...merchantGateways,
                        jazzcash: { ...merchantGateways.jazzcash, account_number: e.target.value }
                      })}
                      className="rounded-xl h-9 text-xs font-mono font-bold"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Merchant ID</label>
                    <Input
                      value={merchantGateways.jazzcash?.merchant_id || ''}
                      onChange={(e) => setMerchantGateways({
                        ...merchantGateways,
                        jazzcash: { ...merchantGateways.jazzcash, merchant_id: e.target.value }
                      })}
                      placeholder="MC12345"
                      className="rounded-xl h-9 text-xs font-mono"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Password / Salt</label>
                    <Input
                      type="password"
                      value={merchantGateways.jazzcash?.password || ''}
                      onChange={(e) => setMerchantGateways({
                        ...merchantGateways,
                        jazzcash: { ...merchantGateways.jazzcash, password: e.target.value }
                      })}
                      placeholder="••••••••••••"
                      className="rounded-xl h-9 text-xs font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1 text-xs">Checkout Instructions for Attendees</label>
                  <textarea
                    rows={2}
                    value={merchantGateways.jazzcash?.instructions || ''}
                    onChange={(e) => setMerchantGateways({
                      ...merchantGateways,
                      jazzcash: { ...merchantGateways.jazzcash, instructions: e.target.value }
                    })}
                    className="w-full p-2 rounded-xl border border-slate-200 text-xs"
                  />
                </div>
              </div>

              {/* 3. Raast */}
              <div className="p-5 rounded-2xl border border-slate-200 bg-white shadow-xs space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <div className="flex items-center gap-2.5">
                    <RaastBadge className="w-7 h-7" />
                    <div>
                      <h4 className="text-sm font-bold text-slate-900">Raast Instant Direct (State Bank of Pakistan)</h4>
                      <span className="text-[10px] text-emerald-800 font-semibold">Zero Transaction Fee Rail</span>
                    </div>
                  </div>
                  <label className="flex items-center gap-1.5 cursor-pointer text-xs font-bold text-slate-700">
                    <input
                      type="checkbox"
                      checked={Boolean(merchantGateways.raast?.enabled)}
                      onChange={(e) => setMerchantGateways({
                        ...merchantGateways,
                        raast: { ...merchantGateways.raast, enabled: e.target.checked }
                      })}
                      className="rounded text-emerald-700 w-4 h-4"
                    />
                    Enabled
                  </label>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Account Title</label>
                    <Input
                      value={merchantGateways.raast?.account_title || ''}
                      onChange={(e) => setMerchantGateways({
                        ...merchantGateways,
                        raast: { ...merchantGateways.raast, account_title: e.target.value }
                      })}
                      className="rounded-xl h-9 text-xs"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Raast ID / Registered Mobile</label>
                    <Input
                      value={merchantGateways.raast?.raast_id || ''}
                      onChange={(e) => setMerchantGateways({
                        ...merchantGateways,
                        raast: { ...merchantGateways.raast, raast_id: e.target.value }
                      })}
                      className="rounded-xl h-9 text-xs font-mono font-bold"
                    />
                  </div>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1 text-xs">Raast Official IBAN</label>
                  <Input
                    value={merchantGateways.raast?.iban || ''}
                    onChange={(e) => setMerchantGateways({
                      ...merchantGateways,
                      raast: { ...merchantGateways.raast, iban: e.target.value }
                    })}
                    className="rounded-xl h-9 text-xs font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1 text-xs">Checkout Instructions</label>
                  <textarea
                    rows={2}
                    value={merchantGateways.raast?.instructions || ''}
                    onChange={(e) => setMerchantGateways({
                      ...merchantGateways,
                      raast: { ...merchantGateways.raast, instructions: e.target.value }
                    })}
                    className="w-full p-2 rounded-xl border border-slate-200 text-xs"
                  />
                </div>
              </div>

              {/* 4. Meezan Bank */}
              <div className="p-5 rounded-2xl border border-slate-200 bg-white shadow-xs space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <div className="flex items-center gap-2.5">
                    <BankTransferBadge className="w-7 h-7" />
                    <div>
                      <h4 className="text-sm font-bold text-slate-900">Direct Corporate Bank Transfer</h4>
                      <span className="text-[10px] text-blue-800 font-semibold">Institutional Wire Clearing</span>
                    </div>
                  </div>
                  <label className="flex items-center gap-1.5 cursor-pointer text-xs font-bold text-slate-700">
                    <input
                      type="checkbox"
                      checked={Boolean(merchantGateways.bank_transfer?.enabled)}
                      onChange={(e) => setMerchantGateways({
                        ...merchantGateways,
                        bank_transfer: { ...merchantGateways.bank_transfer, enabled: e.target.checked }
                      })}
                      className="rounded text-blue-700 w-4 h-4"
                    />
                    Enabled
                  </label>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Bank Name</label>
                    <Input
                      value={merchantGateways.bank_transfer?.bank_name || 'Meezan Bank Limited'}
                      onChange={(e) => setMerchantGateways({
                        ...merchantGateways,
                        bank_transfer: { ...merchantGateways.bank_transfer, bank_name: e.target.value }
                      })}
                      className="rounded-xl h-9 text-xs"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Account Title</label>
                    <Input
                      value={merchantGateways.bank_transfer?.account_title || ''}
                      onChange={(e) => setMerchantGateways({
                        ...merchantGateways,
                        bank_transfer: { ...merchantGateways.bank_transfer, account_title: e.target.value }
                      })}
                      className="rounded-xl h-9 text-xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Account Number</label>
                    <Input
                      value={merchantGateways.bank_transfer?.account_number || ''}
                      onChange={(e) => setMerchantGateways({
                        ...merchantGateways,
                        bank_transfer: { ...merchantGateways.bank_transfer, account_number: e.target.value }
                      })}
                      className="rounded-xl h-9 text-xs font-mono font-bold"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Branch Name</label>
                    <Input
                      value={merchantGateways.bank_transfer?.branch || ''}
                      onChange={(e) => setMerchantGateways({
                        ...merchantGateways,
                        bank_transfer: { ...merchantGateways.bank_transfer, branch: e.target.value }
                      })}
                      className="rounded-xl h-9 text-xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1 text-xs">IBAN (24 Characters)</label>
                  <Input
                    value={merchantGateways.bank_transfer?.iban || ''}
                    onChange={(e) => setMerchantGateways({
                      ...merchantGateways,
                      bank_transfer: { ...merchantGateways.bank_transfer, iban: e.target.value }
                    })}
                    className="rounded-xl h-9 text-xs font-mono font-bold"
                  />
                </div>
              </div>

              {/* 5. Safepay */}
              <div className="p-5 rounded-2xl border border-slate-200 bg-white shadow-xs space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <div className="flex items-center gap-2.5">
                    <SafepayBadge className="w-7 h-7" />
                    <div>
                      <h4 className="text-sm font-bold text-slate-900">Safepay Pakistan (Debit / Credit Cards)</h4>
                      <span className="text-[10px] text-slate-500 font-semibold">Visa, Mastercard &amp; PayPak</span>
                    </div>
                  </div>
                  <label className="flex items-center gap-1.5 cursor-pointer text-xs font-bold text-slate-700">
                    <input
                      type="checkbox"
                      checked={Boolean(merchantGateways.safepay?.enabled)}
                      onChange={(e) => setMerchantGateways({
                        ...merchantGateways,
                        safepay: { ...merchantGateways.safepay, enabled: e.target.checked }
                      })}
                      className="rounded text-blue-600 w-4 h-4"
                    />
                    Enabled
                  </label>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Environment</label>
                    <select
                      value={merchantGateways.safepay?.environment || 'sandbox'}
                      onChange={(e) => setMerchantGateways({
                        ...merchantGateways,
                        safepay: { ...merchantGateways.safepay, environment: e.target.value }
                      })}
                      className="w-full h-9 rounded-xl border border-slate-200 px-3 text-xs font-semibold"
                    >
                      <option value="sandbox">Sandbox / Testing</option>
                      <option value="production">Production Live</option>
                    </select>
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Public Key</label>
                    <Input
                      value={merchantGateways.safepay?.public_key || ''}
                      onChange={(e) => setMerchantGateways({
                        ...merchantGateways,
                        safepay: { ...merchantGateways.safepay, public_key: e.target.value }
                      })}
                      className="rounded-xl h-9 text-xs font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1 text-xs">Secret Key</label>
                  <Input
                    type="password"
                    value={merchantGateways.safepay?.secret_key || ''}
                    onChange={(e) => setMerchantGateways({
                      ...merchantGateways,
                      safepay: { ...merchantGateways.safepay, secret_key: e.target.value }
                    })}
                    placeholder="sec_..."
                    className="rounded-xl h-9 text-xs font-mono"
                  />
                </div>
              </div>

              {/* 6. Stripe */}
              <div className="p-5 rounded-2xl border border-slate-200 bg-white shadow-xs space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <div className="flex items-center gap-2.5">
                    <CardNetworksBadge className="w-12 h-6" />
                    <div>
                      <h4 className="text-sm font-bold text-slate-900">Stripe International (Global USD Cards)</h4>
                      <span className="text-[10px] text-indigo-700 font-semibold">Global Visa, Mastercard &amp; Apple Pay</span>
                    </div>
                  </div>
                  <label className="flex items-center gap-1.5 cursor-pointer text-xs font-bold text-slate-700">
                    <input
                      type="checkbox"
                      checked={Boolean(merchantGateways.stripe?.enabled)}
                      onChange={(e) => setMerchantGateways({
                        ...merchantGateways,
                        stripe: { ...merchantGateways.stripe, enabled: e.target.checked }
                      })}
                      className="rounded text-indigo-600 w-4 h-4"
                    />
                    Enabled
                  </label>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Publishable Key</label>
                    <Input
                      value={merchantGateways.stripe?.publishable_key || ''}
                      onChange={(e) => setMerchantGateways({
                        ...merchantGateways,
                        stripe: { ...merchantGateways.stripe, publishable_key: e.target.value }
                      })}
                      placeholder="pk_live_..."
                      className="rounded-xl h-9 text-xs font-mono"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Secret Key</label>
                    <Input
                      type="password"
                      value={merchantGateways.stripe?.secret_key || ''}
                      onChange={(e) => setMerchantGateways({
                        ...merchantGateways,
                        stripe: { ...merchantGateways.stripe, secret_key: e.target.value }
                      })}
                      placeholder="sk_live_..."
                      className="rounded-xl h-9 text-xs font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1 text-xs">Checkout Instructions</label>
                  <textarea
                    rows={2}
                    value={merchantGateways.stripe?.instructions || ''}
                    onChange={(e) => setMerchantGateways({
                      ...merchantGateways,
                      stripe: { ...merchantGateways.stripe, instructions: e.target.value }
                    })}
                    className="w-full p-2 rounded-xl border border-slate-200 text-xs"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* TAB: CASE STUDIES & PAST EVENTS MANAGEMENT */}
        {/* ============================================================== */}
        {activeTab === 'casestudies' && (
          <div className="bg-white rounded-3xl border border-[#e2e8f0] shadow-xs p-6 space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-[#0f172a] flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-purple-600" />
                  Case Studies &amp; Previous Events Showcase
                </h2>
                <p className="text-xs text-[#64748b]">
                  Highlight past successful conferences, summits, attendee numbers, and tamper-evident credential issuances on the public /case-studies page.
                </p>
              </div>

              <Button
                onClick={() => setCaseStudyModal({
                  open: true,
                  isNew: true,
                  study: {
                    title: '',
                    client_name: '',
                    category: 'Technology & AI',
                    event_date: 'July 2026',
                    attendees_count: 1000,
                    certs_count: 1000,
                    banner_url: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1200&auto=format&fit=crop&q=80',
                    summary: '',
                    problem: '',
                    solution: '',
                    resultsText: '100% automated check-ins\nZero gate delays\nInstant verification',
                    quote: '',
                    author: '',
                    author_role: '',
                    is_featured: 1
                  }
                })}
                className="bg-[#7c3aed] hover:bg-[#6d28d9] text-white rounded-xl text-xs font-bold h-10 px-5 flex items-center gap-1.5 shadow-md shadow-purple-600/20"
              >
                <Plus className="w-4 h-4" />
                Add New Case Study
              </Button>
            </div>

            <div className="overflow-x-auto w-full">
              <table className="w-full text-left text-xs min-w-[700px]">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px]">
                    <th className="pb-3">Event &amp; Client</th>
                    <th className="pb-3">Category &amp; Date</th>
                    <th className="pb-3">Attendees</th>
                    <th className="pb-3">Certs Issued</th>
                    <th className="pb-3">Status</th>
                    <th className="pb-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {caseStudiesList.map((cs) => (
                    <tr key={cs.id} className="hover:bg-slate-50/50">
                      <td className="py-3.5 flex items-center gap-3">
                        <img
                          src={cs.banner_url}
                          alt={cs.title}
                          className="w-12 h-10 rounded-lg object-cover"
                        />
                        <div>
                          <div className="font-bold text-slate-900">{cs.title}</div>
                          <div className="text-[11px] text-slate-500">{cs.client_name}</div>
                        </div>
                      </td>
                      <td className="py-3.5">
                        <div className="font-semibold text-purple-700">{cs.category}</div>
                        <div className="text-[11px] text-slate-500">{cs.event_date}</div>
                      </td>
                      <td className="py-3.5 font-bold text-slate-800">
                        {Number(cs.attendees_count).toLocaleString()}
                      </td>
                      <td className="py-3.5 font-bold text-emerald-600">
                        {Number(cs.certs_count).toLocaleString()}
                      </td>
                      <td className="py-3.5">
                        <Badge className={`text-[10px] ${cs.is_featured ? 'bg-purple-100 text-purple-800' : 'bg-slate-100 text-slate-600'}`}>
                          {cs.is_featured ? 'Featured' : 'Standard'}
                        </Badge>
                      </td>
                      <td className="py-3.5 text-right space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setCaseStudyModal({
                            open: true,
                            isNew: false,
                            study: {
                              ...cs,
                              resultsText: Array.isArray(cs.results) ? cs.results.join('\n') : (typeof cs.results === 'string' && cs.results.startsWith('[') ? JSON.parse(cs.results).join('\n') : cs.results)
                            }
                          })}
                          className="h-8 px-2.5 text-xs rounded-xl"
                        >
                          <Edit className="w-3.5 h-3.5 mr-1" />
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDeleteCaseStudy(cs.id)}
                          className="h-8 px-2 text-xs rounded-xl text-rose-600 hover:bg-rose-50"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* TAB: 3RD-PARTY EVENTS DIRECTORY & BOOKINGS */}
        {/* ============================================================== */}
        {activeTab === 'directory' && (
          <div className="bg-white rounded-3xl border border-[#e2e8f0] shadow-xs p-6 space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-[#0f172a] flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-blue-600" />
                  3rd-Party Events, Summits &amp; Seminars Marketplace
                </h2>
                <p className="text-xs text-[#64748b]">
                  Review, approve, and manage public listings and attendee ticket bookings with real payment references.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  onClick={() => setDirectoryModal({
                    open: true,
                    isNew: true,
                    event: {
                      title: '',
                      organizer_name: '',
                      category: 'Technology',
                      event_type: 'Conference',
                      start_date: '',
                      end_date: '',
                      location: '',
                      city: 'Nawabshah',
                      banner_url: '',
                      description: '',
                      ticket_tiers: [
                        { id: 'standard', name: 'General Delegate', price_pkr: 3500, price_usd: 12, perks: ['Full Hall Access', 'Digital Certificate'], available: 200, sold: 0 }
                      ],
                      is_approved: 1,
                      is_featured: 1
                    }
                  })}
                  className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold h-10 px-4 flex items-center gap-1.5 shadow-md shadow-blue-600/20"
                >
                  <Plus className="w-4 h-4" />
                  Add 3rd-Party Event
                </Button>
              </div>
            </div>

            {/* Subtabs */}
            <div className="flex gap-2 border-b border-slate-200 pb-3">
              <button
                type="button"
                onClick={() => setDirectorySubTab('events')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  directorySubTab === 'events' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'
                }`}
              >
                Directory Events ({directoryEventsList.length})
              </button>
              <button
                type="button"
                onClick={() => setDirectorySubTab('bookings')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  directorySubTab === 'bookings' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'
                }`}
              >
                Attendee Bookings &amp; Payment Proofs ({directoryBookingsList.length})
              </button>
            </div>

            {directorySubTab === 'events' ? (
              <div className="overflow-x-auto w-full">
                <table className="w-full text-left text-xs min-w-[700px]">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px]">
                      <th className="pb-3">Event &amp; Organizer</th>
                      <th className="pb-3">Category &amp; City</th>
                      <th className="pb-3">Dates</th>
                      <th className="pb-3">Approval</th>
                      <th className="pb-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {directoryEventsList.map((evt) => (
                      <tr key={evt.id} className="hover:bg-slate-50/50">
                        <td className="py-3.5 flex items-center gap-3">
                          <img
                            src={evt.banner_url}
                            alt={evt.title}
                            className="w-12 h-10 rounded-lg object-cover"
                          />
                          <div>
                            <div className="font-bold text-slate-900">{evt.title}</div>
                            <div className="text-[11px] text-slate-500">{evt.organizer_name}</div>
                          </div>
                        </td>
                        <td className="py-3.5">
                          <div className="font-semibold text-blue-700">{evt.category}</div>
                          <div className="text-[11px] text-slate-500">{evt.city}</div>
                        </td>
                        <td className="py-3.5 text-slate-600 text-[11px]">
                          {new Date(evt.start_date).toLocaleDateString()}
                        </td>
                        <td className="py-3.5">
                          <Badge className={`text-[10px] ${evt.is_approved ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                            {evt.is_approved ? 'Approved' : 'Pending'}
                          </Badge>
                        </td>
                        <td className="py-3.5 text-right space-x-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setDirectoryModal({ open: true, isNew: false, event: evt })}
                            className="h-8 px-2.5 text-xs rounded-xl"
                          >
                            <Edit className="w-3.5 h-3.5 mr-1" />
                            Edit
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDeleteDirectoryEvent(evt.id)}
                            className="h-8 px-2 text-xs rounded-xl text-rose-600 hover:bg-rose-50"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              /* Bookings Table */
              <div className="overflow-x-auto w-full">
                <table className="w-full text-left text-xs min-w-[700px]">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px]">
                      <th className="pb-3">Booking Ref</th>
                      <th className="pb-3">Event &amp; Tier</th>
                      <th className="pb-3">Attendee</th>
                      <th className="pb-3">Payment Method</th>
                      <th className="pb-3">Transaction ID (TID)</th>
                      <th className="pb-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {directoryBookingsList.map((bk) => (
                      <tr key={bk.id} className="hover:bg-slate-50/50">
                        <td className="py-3.5 font-mono font-bold text-purple-700">
                          {bk.booking_ref}
                        </td>
                        <td className="py-3.5">
                          <div className="font-bold text-slate-900">{bk.event_title}</div>
                          <div className="text-[11px] text-slate-500">{bk.tier_name}</div>
                        </td>
                        <td className="py-3.5">
                          <div className="font-bold text-slate-800">{bk.attendee_name}</div>
                          <div className="text-[11px] text-slate-500">{bk.attendee_phone} • {bk.attendee_email}</div>
                        </td>
                        <td className="py-3.5 font-bold uppercase text-[11px] text-slate-700">
                          {bk.payment_method}
                        </td>
                        <td className="py-3.5 font-mono font-bold text-blue-700">
                          {bk.transaction_id}
                        </td>
                        <td className="py-3.5">
                          <Badge className="bg-emerald-100 text-emerald-800 text-[10px]">
                            {bk.payment_status}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ============================================================== */}
        {/* TAB: SUPERADMIN PROFILE & SECURITY */}
        {/* ============================================================== */}
        {activeTab === 'profile' && (
          <div className="bg-white rounded-3xl border border-[#e2e8f0] shadow-xs p-6 space-y-6 max-w-2xl">
            <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
              <div className="w-10 h-10 rounded-2xl bg-blue-100 text-[#1d4ed8] flex items-center justify-center font-bold">
                <KeyRound className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-[#0f172a]">SuperAdmin Profile &amp; Master Credentials</h2>
                <p className="text-xs text-[#64748b]">Update your master administrator name, email, credentials, and password.</p>
              </div>
            </div>

            {profileMsg && (
              <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                {profileMsg}
              </div>
            )}

            <form onSubmit={handleSaveAdminProfile} className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">SuperAdmin Display Name *</label>
                <Input
                  required
                  value={adminProfileName}
                  onChange={(e) => setAdminProfileName(e.target.value)}
                  className="rounded-xl h-10 text-xs font-bold"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Master Email Address</label>
                <Input
                  value={adminProfileEmail}
                  onChange={(e) => setAdminProfileEmail(e.target.value)}
                  className="rounded-xl h-10 text-xs font-mono"
                />
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                <h4 className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                  <Lock className="w-4 h-4 text-blue-600" />
                  Change Password (Leave blank to keep current)
                </h4>

                <div>
                  <label className="font-bold text-slate-600 block mb-1">Current Password</label>
                  <Input
                    type="password"
                    value={adminCurrentPassword}
                    onChange={(e) => setAdminCurrentPassword(e.target.value)}
                    placeholder="Enter current password"
                    className="rounded-xl h-9 text-xs"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-slate-600 block mb-1">New Password</label>
                    <Input
                      type="password"
                      value={adminNewPassword}
                      onChange={(e) => setAdminNewPassword(e.target.value)}
                      placeholder="At least 6 characters"
                      className="rounded-xl h-9 text-xs"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-600 block mb-1">Confirm New Password</label>
                    <Input
                      type="password"
                      value={adminConfirmPassword}
                      onChange={(e) => setAdminConfirmPassword(e.target.value)}
                      placeholder="Repeat new password"
                      className="rounded-xl h-9 text-xs"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <Button
                  type="submit"
                  disabled={profileSaving}
                  className="bg-[#1d4ed8] hover:bg-[#1e40af] text-white rounded-xl text-xs font-bold h-10 px-6 shadow-md shadow-blue-600/20"
                >
                  <Save className="w-4 h-4 mr-1.5" />
                  {profileSaving ? 'Saving...' : 'Save Profile & Credentials'}
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
                  Manage real reviews from universities, academic societies, and corporate clients using Eventrye. Placeholders and fake reviews are forbidden. All approved entries display live on the official landing page.
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

        {/* ============================================================== */}
        {/* TAB 12: ORBIT-I PLATFORM LEADERSHIP & CORE TEAM MANAGEMENT */}
        {/* ============================================================== */}
        {activeTab === 'team' && (
          <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
              <div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-50 text-purple-700 text-xs font-bold mb-2">
                  <Users className="w-3.5 h-3.5 text-purple-600" />
                  ORBIT-I Official Leadership Roster
                </div>
                <h3 className="text-xl font-bold text-slate-900 font-heading">
                  Platform Leadership &amp; Core Team Members
                </h3>
                <p className="text-xs text-slate-500 mt-1 max-w-2xl leading-relaxed">
                  Dynamic management for the core ORBIT-I leadership team. Any additions, updates, or deletions made here automatically update the public About page in real-time.
                </p>
              </div>

              <Button
                onClick={() => setTeamModal({
                  open: true,
                  isNew: true,
                  member: {
                    name: '',
                    role: '',
                    department: 'ORBIT-I Core Team',
                    bio: '',
                    avatar_url: '',
                    display_order: platformTeam.length + 1,
                    is_active: 1
                  }
                })}
                className="bg-[#7c3aed] hover:bg-[#6d28d9] text-white rounded-xl text-xs font-bold h-10 px-5 shadow-sm shrink-0 flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Add Team Member
              </Button>
            </div>

            {/* Team Members Grid */}
            {teamLoading ? (
              <div className="py-16 text-center text-xs text-[#7c3aed] flex items-center justify-center gap-2">
                <div className="w-4 h-4 border-2 border-[#7c3aed] border-t-transparent rounded-full animate-spin" />
                <span>Loading platform team...</span>
              </div>
            ) : platformTeam.length === 0 ? (
              <div className="bg-slate-50 rounded-2xl border border-dashed border-slate-300 p-12 text-center">
                <Users className="w-10 h-10 text-slate-400 mx-auto mb-2 opacity-60" />
                <h4 className="text-sm font-bold text-slate-700">No Team Members Found</h4>
                <p className="text-xs text-slate-500 mt-1 mb-4">Click "Add Team Member" above to add core ORBIT-I leadership.</p>
                <Button
                  onClick={() => setTeamModal({
                    open: true,
                    isNew: true,
                    member: {
                      name: '',
                      role: '',
                      department: 'Leadership & Architecture',
                      bio: '',
                      avatar_url: '',
                      display_order: 1,
                      is_active: 1
                    }
                  })}
                  className="bg-[#7c3aed] hover:bg-[#6d28d9] text-white rounded-xl text-xs font-bold"
                >
                  <Plus className="w-4 h-4 mr-1.5" />
                  Add First Member
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {platformTeam.map((member) => (
                  <div
                    key={member.id}
                    className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:shadow-md hover:border-purple-300 transition-all flex flex-col justify-between"
                  >
                    <div>
                      {/* Top Header */}
                      <div className="flex items-start justify-between gap-3 mb-4">
                        <div className="relative">
                          {member.avatar_url ? (
                            <img
                              src={member.avatar_url}
                              alt={member.name}
                              className="w-14 h-14 rounded-2xl object-cover border border-purple-200 shadow-xs"
                            />
                          ) : (
                            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-[#7c3aed] to-[#3b82f6] text-white flex items-center justify-center font-bold text-lg shadow-xs">
                              {member.name.split(' ').map((n: string) => n[0]).filter(Boolean).slice(0, 2).join('')}
                            </div>
                          )}
                          <span className="absolute -bottom-1 -right-1 px-1.5 py-0.2 bg-slate-900 text-purple-300 text-[8px] font-bold rounded">
                            #{member.display_order}
                          </span>
                        </div>

                        <Badge className={`text-[10px] font-bold ${member.is_active ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-500'}`}>
                          {member.is_active ? 'Live' : 'Hidden'}
                        </Badge>
                      </div>

                      {/* Name & Role */}
                      <h4 className="text-base font-bold text-slate-900 font-heading mb-1">
                        {member.name}
                      </h4>
                      <div className="text-xs font-semibold text-purple-700 mb-1">
                        {member.role}
                      </div>
                      {member.department && (
                        <div className="text-[11px] font-medium text-slate-500 mb-3">
                          {member.department}
                        </div>
                      )}

                      {/* Bio */}
                      {member.bio && (
                        <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed mb-4 pt-2 border-t border-slate-100">
                          {member.bio}
                        </p>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setTeamModal({
                          open: true,
                          isNew: false,
                          member: {
                            id: member.id,
                            name: member.name,
                            role: member.role,
                            department: member.department || '',
                            bio: member.bio || '',
                            avatar_url: member.avatar_url || '',
                            display_order: member.display_order || 1,
                            is_active: member.is_active ?? 1
                          }
                        })}
                        className="h-8 px-3 text-xs rounded-xl border-slate-200 hover:bg-purple-50 hover:text-purple-700"
                      >
                        <Edit className="w-3.5 h-3.5 mr-1" />
                        Edit
                      </Button>

                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDeleteTeamMember(member.id)}
                        className="h-8 px-2.5 text-xs rounded-xl text-rose-600 border-rose-200 hover:bg-rose-50"
                        title="Delete member"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
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
                    placeholder="Write the authentic institutional feedback regarding Eventrye's certificate issuance, badge generation, or attendance..."
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

              {inspectingTenant.id === 1 || inspectingTenant.slug === 'eventrye-hq' ? (
                <div className="p-3 rounded-xl bg-blue-50/70 border border-blue-100 text-xs text-blue-900 space-y-1">
                  <span className="font-bold block">Platform Master SuperAdmin Authority</span>
                  <p className="text-[11px] text-slate-500">
                    Eventrye HQ governs the entire multi-tenant SaaS platform. Public event portals only exist for registered client organizations.
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
                {inspectingTenant.id !== 1 && inspectingTenant.slug !== 'eventrye-hq' && (
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

        {/* ============================================================== */}
        {/* MODAL: EDIT / CREATE PRICING PLAN */}
        {/* ============================================================== */}
        {editPlanModal.open && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-in fade-in">
            <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4 my-8">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center">
                    <Tag className="w-4 h-4" />
                  </div>
                  <h3 className="font-bold text-slate-900 text-base">
                    {editPlanModal.isNew ? 'Create New Pricing Plan' : `Edit Plan: ${editPlanModal.plan.name}`}
                  </h3>
                </div>
                <button
                  onClick={() => setEditPlanModal({ open: false, isNew: false, plan: {} })}
                  className="w-8 h-8 rounded-xl hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-700"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSavePlan} className="space-y-3.5 text-xs">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Plan Display Name *</label>
                    <Input
                      type="text"
                      required
                      placeholder="e.g. Professional"
                      value={editPlanModal.plan.name || ''}
                      onChange={(e) => setEditPlanModal({
                        ...editPlanModal,
                        plan: { ...editPlanModal.plan, name: e.target.value }
                      })}
                      className="rounded-xl h-9 text-xs"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Plan Slug *</label>
                    <Input
                      type="text"
                      required
                      placeholder="e.g. professional"
                      value={editPlanModal.plan.slug || ''}
                      onChange={(e) => setEditPlanModal({
                        ...editPlanModal,
                        plan: { ...editPlanModal.plan, slug: e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, '-') }
                      })}
                      className="rounded-xl h-9 text-xs font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Monthly Price ($/mo) *</label>
                    <Input
                      type="number"
                      required
                      min={0}
                      step="any"
                      placeholder="99"
                      value={editPlanModal.plan.monthly_price ?? 0}
                      onChange={(e) => setEditPlanModal({
                        ...editPlanModal,
                        plan: { ...editPlanModal.plan, monthly_price: e.target.value }
                      })}
                      className="rounded-xl h-9 text-xs font-bold"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Yearly Discounted Price ($/mo)</label>
                    <Input
                      type="number"
                      min={0}
                      step="any"
                      placeholder="79"
                      value={editPlanModal.plan.yearly_price ?? 0}
                      onChange={(e) => setEditPlanModal({
                        ...editPlanModal,
                        plan: { ...editPlanModal.plan, yearly_price: e.target.value }
                      })}
                      className="rounded-xl h-9 text-xs font-bold"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Attendees Cap</label>
                    <Input
                      type="number"
                      min={1}
                      placeholder="5000"
                      value={editPlanModal.plan.attendees_limit ?? 500}
                      onChange={(e) => setEditPlanModal({
                        ...editPlanModal,
                        plan: { ...editPlanModal.plan, attendees_limit: e.target.value }
                      })}
                      className="rounded-xl h-9 text-xs"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Max Events</label>
                    <Input
                      type="number"
                      min={1}
                      placeholder="25"
                      value={editPlanModal.plan.max_events ?? 5}
                      onChange={(e) => setEditPlanModal({
                        ...editPlanModal,
                        plan: { ...editPlanModal.plan, max_events: e.target.value }
                      })}
                      className="rounded-xl h-9 text-xs"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Certificates Cap</label>
                    <Input
                      type="number"
                      min={0}
                      placeholder="500"
                      value={editPlanModal.plan.max_certs ?? 50}
                      onChange={(e) => setEditPlanModal({
                        ...editPlanModal,
                        plan: { ...editPlanModal.plan, max_certs: e.target.value }
                      })}
                      className="rounded-xl h-9 text-xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Badge Tag Label</label>
                    <Input
                      type="text"
                      placeholder="e.g. Most Popular"
                      value={editPlanModal.plan.tag || ''}
                      onChange={(e) => setEditPlanModal({
                        ...editPlanModal,
                        plan: { ...editPlanModal.plan, tag: e.target.value }
                      })}
                      className="rounded-xl h-9 text-xs"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Display Sort Order</label>
                    <Input
                      type="number"
                      min={1}
                      value={editPlanModal.plan.display_order ?? 1}
                      onChange={(e) => setEditPlanModal({
                        ...editPlanModal,
                        plan: { ...editPlanModal.plan, display_order: e.target.value }
                      })}
                      className="rounded-xl h-9 text-xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Features (One line per feature)</label>
                  <textarea
                    rows={4}
                    placeholder="5,000 attendees capacity&#10;Up to 25 events per year&#10;One-Click Print ID Badges&#10;Priority 24/7 Support"
                    value={editPlanModal.plan.featuresText || ''}
                    onChange={(e) => setEditPlanModal({
                      ...editPlanModal,
                      plan: { ...editPlanModal.plan, featuresText: e.target.value }
                    })}
                    className="w-full p-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-blue-500 font-sans"
                  />
                </div>

                <div className="flex items-center gap-4 pt-1">
                  <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-700">
                    <input
                      type="checkbox"
                      checked={Boolean(editPlanModal.plan.white_label)}
                      onChange={(e) => setEditPlanModal({
                        ...editPlanModal,
                        plan: { ...editPlanModal.plan, white_label: e.target.checked }
                      })}
                      className="rounded text-blue-600 w-4 h-4"
                    />
                    White-Label Enabled
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-700">
                    <input
                      type="checkbox"
                      checked={Boolean(editPlanModal.plan.is_active)}
                      onChange={(e) => setEditPlanModal({
                        ...editPlanModal,
                        plan: { ...editPlanModal.plan, is_active: e.target.checked }
                      })}
                      className="rounded text-blue-600 w-4 h-4"
                    />
                    Plan Is Active &amp; Offered
                  </label>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setEditPlanModal({ open: false, isNew: false, plan: {} })}
                    className="rounded-xl text-xs h-9"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={savingPlan}
                    className="bg-[#1d4ed8] hover:bg-[#1e40af] text-white rounded-xl text-xs font-bold h-9 px-5"
                  >
                    {savingPlan ? 'Saving Plan...' : 'Save Plan Settings'}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* MODAL: EDIT / CREATE COUPON CODE */}
        {/* ============================================================== */}
        {editCouponModal.open && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-in fade-in">
            <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 my-8">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                    <Percent className="w-4 h-4" />
                  </div>
                  <h3 className="font-bold text-slate-900 text-base">
                    {editCouponModal.isNew ? 'Create New Coupon Code' : `Edit Coupon: ${editCouponModal.coupon.code}`}
                  </h3>
                </div>
                <button
                  onClick={() => setEditCouponModal({ open: false, isNew: false, coupon: {} })}
                  className="w-8 h-8 rounded-xl hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-700"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSaveCoupon} className="space-y-3.5 text-xs">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Coupon Code (Uppercase) *</label>
                  <Input
                    type="text"
                    required
                    placeholder="e.g. ORBIT2026"
                    value={editCouponModal.coupon.code || ''}
                    onChange={(e) => setEditCouponModal({
                      ...editCouponModal,
                      coupon: { ...editCouponModal.coupon, code: e.target.value.toUpperCase() }
                    })}
                    className="rounded-xl h-9 text-xs font-mono font-bold tracking-wider"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Description</label>
                  <Input
                    type="text"
                    placeholder="e.g. Official 2026 Launch Promotion"
                    value={editCouponModal.coupon.description || ''}
                    onChange={(e) => setEditCouponModal({
                      ...editCouponModal,
                      coupon: { ...editCouponModal.coupon, description: e.target.value }
                    })}
                    className="rounded-xl h-9 text-xs"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Discount Type *</label>
                    <select
                      value={editCouponModal.coupon.discount_type || 'percentage'}
                      onChange={(e) => setEditCouponModal({
                        ...editCouponModal,
                        coupon: { ...editCouponModal.coupon, discount_type: e.target.value }
                      })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-xs font-semibold focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="percentage">Percentage (%) Off</option>
                      <option value="fixed">Fixed Amount ($) Off</option>
                    </select>
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Discount Value *</label>
                    <Input
                      type="number"
                      required
                      min={1}
                      max={editCouponModal.coupon.discount_type === 'percentage' ? 100 : 10000}
                      placeholder="20"
                      value={editCouponModal.coupon.discount_value ?? 20}
                      onChange={(e) => setEditCouponModal({
                        ...editCouponModal,
                        coupon: { ...editCouponModal.coupon, discount_value: e.target.value }
                      })}
                      className="rounded-xl h-9 text-xs font-bold"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Min. Purchase ($)</label>
                    <Input
                      type="number"
                      min={0}
                      placeholder="0"
                      value={editCouponModal.coupon.min_purchase ?? 0}
                      onChange={(e) => setEditCouponModal({
                        ...editCouponModal,
                        coupon: { ...editCouponModal.coupon, min_purchase: e.target.value }
                      })}
                      className="rounded-xl h-9 text-xs"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Max Uses Limit</label>
                    <Input
                      type="number"
                      min={1}
                      placeholder="1000"
                      value={editCouponModal.coupon.max_uses ?? 1000}
                      onChange={(e) => setEditCouponModal({
                        ...editCouponModal,
                        coupon: { ...editCouponModal.coupon, max_uses: e.target.value }
                      })}
                      className="rounded-xl h-9 text-xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Expiration Date (Optional)</label>
                  <Input
                    type="date"
                    value={editCouponModal.coupon.expires_at ? editCouponModal.coupon.expires_at.slice(0, 10) : ''}
                    onChange={(e) => setEditCouponModal({
                      ...editCouponModal,
                      coupon: { ...editCouponModal.coupon, expires_at: e.target.value }
                    })}
                    className="rounded-xl h-9 text-xs"
                  />
                </div>

                <div className="pt-1">
                  <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-700">
                    <input
                      type="checkbox"
                      checked={Boolean(editCouponModal.coupon.is_active)}
                      onChange={(e) => setEditCouponModal({
                        ...editCouponModal,
                        coupon: { ...editCouponModal.coupon, is_active: e.target.checked }
                      })}
                      className="rounded text-emerald-600 w-4 h-4"
                    />
                    Coupon Is Active &amp; Redeemable at Checkout
                  </label>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setEditCouponModal({ open: false, isNew: false, coupon: {} })}
                    className="rounded-xl text-xs h-9"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={savingCoupon}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold h-9 px-5"
                  >
                    {savingCoupon ? 'Saving Coupon...' : 'Save Coupon'}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Add / Edit Platform Team Member Modal */}
        {teamModal.open && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-200 space-y-5 animate-in fade-in zoom-in-95">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-purple-100 text-[#7c3aed] flex items-center justify-center font-bold">
                    <Users className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900">
                      {teamModal.isNew ? 'Add ORBIT-I Team Member' : 'Edit ORBIT-I Team Member'}
                    </h3>
                    <p className="text-xs text-slate-500">Live platform leadership roster</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setTeamModal({ ...teamModal, open: false })}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveTeamMember} className="space-y-4 text-xs">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Full Name *</label>
                  <Input
                    required
                    placeholder="e.g. Abdul Samad Rind, Maria Almani, Muneeb Ur Rehman..."
                    value={teamModal.member.name}
                    onChange={(e) => setTeamModal({
                      ...teamModal,
                      member: { ...teamModal.member, name: e.target.value }
                    })}
                    className="rounded-xl h-9 text-xs font-bold"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Official Role / Title *</label>
                    <Input
                      required
                      placeholder="e.g. Founder & Platform Architect"
                      value={teamModal.member.role}
                      onChange={(e) => setTeamModal({
                        ...teamModal,
                        member: { ...teamModal.member, role: e.target.value }
                      })}
                      className="rounded-xl h-9 text-xs"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Department / Division</label>
                    <Input
                      placeholder="e.g. Leadership & Architecture"
                      value={teamModal.member.department}
                      onChange={(e) => setTeamModal({
                        ...teamModal,
                        member: { ...teamModal.member, department: e.target.value }
                      })}
                      className="rounded-xl h-9 text-xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Display Order (Sort Index)</label>
                    <Input
                      type="number"
                      min={1}
                      placeholder="1"
                      value={teamModal.member.display_order}
                      onChange={(e) => setTeamModal({
                        ...teamModal,
                        member: { ...teamModal.member, display_order: parseInt(e.target.value, 10) || 1 }
                      })}
                      className="rounded-xl h-9 text-xs"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Avatar Image URL (Optional)</label>
                    <Input
                      placeholder="https://... or leave blank for initials"
                      value={teamModal.member.avatar_url}
                      onChange={(e) => setTeamModal({
                        ...teamModal,
                        member: { ...teamModal.member, avatar_url: e.target.value }
                      })}
                      className="rounded-xl h-9 text-xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Professional Bio &amp; Platform Role</label>
                  <textarea
                    rows={3}
                    placeholder="Brief background and leadership responsibilities..."
                    value={teamModal.member.bio}
                    onChange={(e) => setTeamModal({
                      ...teamModal,
                      member: { ...teamModal.member, bio: e.target.value }
                    })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-purple-500 focus:outline-none"
                  />
                </div>

                <div className="pt-1">
                  <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-700">
                    <input
                      type="checkbox"
                      checked={Boolean(teamModal.member.is_active)}
                      onChange={(e) => setTeamModal({
                        ...teamModal,
                        member: { ...teamModal.member, is_active: e.target.checked ? 1 : 0 }
                      })}
                      className="rounded text-purple-600 w-4 h-4"
                    />
                    Display Live on Official About Page &amp; Platform Leadership
                  </label>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setTeamModal({ ...teamModal, open: false })}
                    className="rounded-xl text-xs h-9"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={savingMember}
                    className="bg-[#7c3aed] hover:bg-[#6d28d9] text-white rounded-xl text-xs font-bold h-9 px-5"
                  >
                    {savingMember ? 'Saving Member...' : 'Save Team Member'}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Add / Edit Case Study Modal */}
        {caseStudyModal.open && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 space-y-4 max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-purple-100 text-[#7c3aed] flex items-center justify-center font-bold">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <h3 className="text-base font-bold text-slate-900">
                    {caseStudyModal.isNew ? 'Create New Case Study' : 'Edit Case Study'}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setCaseStudyModal({ ...caseStudyModal, open: false })}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveCaseStudy} className="space-y-3.5 text-xs">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Event Title *</label>
                    <Input
                      required
                      placeholder="e.g. National AI Summit 2026"
                      value={caseStudyModal.study.title || ''}
                      onChange={(e) => setCaseStudyModal({
                        ...caseStudyModal,
                        study: { ...caseStudyModal.study, title: e.target.value }
                      })}
                      className="rounded-xl h-9 text-xs"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Client / Institution Name *</label>
                    <Input
                      required
                      placeholder="e.g. FAST-NUCES"
                      value={caseStudyModal.study.client_name || ''}
                      onChange={(e) => setCaseStudyModal({
                        ...caseStudyModal,
                        study: { ...caseStudyModal.study, client_name: e.target.value }
                      })}
                      className="rounded-xl h-9 text-xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Category</label>
                    <Input
                      placeholder="e.g. Technology & AI"
                      value={caseStudyModal.study.category || 'Technology & AI'}
                      onChange={(e) => setCaseStudyModal({
                        ...caseStudyModal,
                        study: { ...caseStudyModal.study, category: e.target.value }
                      })}
                      className="rounded-xl h-9 text-xs"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Event Month/Year</label>
                    <Input
                      placeholder="e.g. July 2026"
                      value={caseStudyModal.study.event_date || 'July 2026'}
                      onChange={(e) => setCaseStudyModal({
                        ...caseStudyModal,
                        study: { ...caseStudyModal.study, event_date: e.target.value }
                      })}
                      className="rounded-xl h-9 text-xs font-bold"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Attendees Count</label>
                    <Input
                      type="number"
                      value={caseStudyModal.study.attendees_count || 1000}
                      onChange={(e) => setCaseStudyModal({
                        ...caseStudyModal,
                        study: { ...caseStudyModal.study, attendees_count: parseInt(e.target.value, 10) || 0 }
                      })}
                      className="rounded-xl h-9 text-xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Banner Image URL</label>
                  <Input
                    placeholder="https://..."
                    value={caseStudyModal.study.banner_url || ''}
                    onChange={(e) => setCaseStudyModal({
                      ...caseStudyModal,
                      study: { ...caseStudyModal.study, banner_url: e.target.value }
                    })}
                    className="rounded-xl h-9 text-xs"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Executive Summary</label>
                  <textarea
                    rows={2}
                    placeholder="Brief 1-2 sentence overview of the event..."
                    value={caseStudyModal.study.summary || ''}
                    onChange={(e) => setCaseStudyModal({
                      ...caseStudyModal,
                      study: { ...caseStudyModal.study, summary: e.target.value }
                    })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 text-xs"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">The Operational Challenge</label>
                    <textarea
                      rows={2}
                      placeholder="Hours of manual registration, certificate delays..."
                      value={caseStudyModal.study.problem || ''}
                      onChange={(e) => setCaseStudyModal({
                        ...caseStudyModal,
                        study: { ...caseStudyModal.study, problem: e.target.value }
                      })}
                      className="w-full p-2.5 rounded-xl border border-slate-200 text-xs"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Eventrye Solution</label>
                    <textarea
                      rows={2}
                      placeholder="Multi-gate QR check-ins, automatic certificate generation..."
                      value={caseStudyModal.study.solution || ''}
                      onChange={(e) => setCaseStudyModal({
                        ...caseStudyModal,
                        study: { ...caseStudyModal.study, solution: e.target.value }
                      })}
                      className="w-full p-2.5 rounded-xl border border-slate-200 text-xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Quantified Results (One bullet per line)</label>
                  <textarea
                    rows={3}
                    placeholder="4,200 QR scans with zero duplicates&#10;0.8s average check-in latency&#10;100% automated verifiable certificates"
                    value={caseStudyModal.study.resultsText || ''}
                    onChange={(e) => setCaseStudyModal({
                      ...caseStudyModal,
                      study: { ...caseStudyModal.study, resultsText: e.target.value }
                    })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 text-xs font-mono"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Author Name &amp; Title</label>
                    <Input
                      placeholder="e.g. Dr. Zulfiqar Memon, CS Dept Head"
                      value={caseStudyModal.study.author || ''}
                      onChange={(e) => setCaseStudyModal({
                        ...caseStudyModal,
                        study: { ...caseStudyModal.study, author: e.target.value }
                      })}
                      className="rounded-xl h-9 text-xs"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Quote Snippet</label>
                    <Input
                      placeholder="e.g. Eventrye completely eradicated our registration chaos..."
                      value={caseStudyModal.study.quote || ''}
                      onChange={(e) => setCaseStudyModal({
                        ...caseStudyModal,
                        study: { ...caseStudyModal.study, quote: e.target.value }
                      })}
                      className="rounded-xl h-9 text-xs italic"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-700">
                    <input
                      type="checkbox"
                      checked={Boolean(caseStudyModal.study.is_featured)}
                      onChange={(e) => setCaseStudyModal({
                        ...caseStudyModal,
                        study: { ...caseStudyModal.study, is_featured: e.target.checked ? 1 : 0 }
                      })}
                      className="rounded text-purple-600 w-4 h-4"
                    />
                    Feature prominently on /case-studies landing page
                  </label>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setCaseStudyModal({ ...caseStudyModal, open: false })}
                    className="rounded-xl text-xs h-9"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={savingCaseStudy}
                    className="bg-[#7c3aed] hover:bg-[#6d28d9] text-white rounded-xl text-xs font-bold h-9 px-5"
                  >
                    {savingCaseStudy ? 'Saving...' : 'Save Case Study'}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Add / Edit 3rd-Party Directory Event Modal */}
        {directoryModal.open && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 space-y-4 max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
                    <Calendar className="w-4 h-4" />
                  </div>
                  <h3 className="text-base font-bold text-slate-900">
                    {directoryModal.isNew ? 'Add 3rd-Party Event to Directory' : 'Edit Directory Event'}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setDirectoryModal({ ...directoryModal, open: false })}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveDirectoryEvent} className="space-y-3.5 text-xs">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Event Title *</label>
                  <Input
                    required
                    placeholder="e.g. NextGen Tech & AI Summit 2026"
                    value={directoryModal.event.title || ''}
                    onChange={(e) => setDirectoryModal({
                      ...directoryModal,
                      event: { ...directoryModal.event, title: e.target.value }
                    })}
                    className="rounded-xl h-9 text-xs font-bold"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Organizer Company / Institution *</label>
                    <Input
                      required
                      placeholder="e.g. CodePakistan"
                      value={directoryModal.event.organizer_name || ''}
                      onChange={(e) => setDirectoryModal({
                        ...directoryModal,
                        event: { ...directoryModal.event, organizer_name: e.target.value }
                      })}
                      className="rounded-xl h-9 text-xs"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Event Category</label>
                    <select
                      value={directoryModal.event.category || 'Technology'}
                      onChange={(e) => setDirectoryModal({
                        ...directoryModal,
                        event: { ...directoryModal.event, category: e.target.value }
                      })}
                      className="w-full h-9 rounded-xl border border-slate-200 px-3 text-xs"
                    >
                      <option value="Technology">Technology & AI</option>
                      <option value="Medical">Medical & Healthcare</option>
                      <option value="FinTech">FinTech & Banking</option>
                      <option value="CyberSecurity">CyberSecurity</option>
                      <option value="Leadership">Leadership & Business</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">City</label>
                    <Input
                      placeholder="e.g. Islamabad"
                      value={directoryModal.event.city || 'Islamabad'}
                      onChange={(e) => setDirectoryModal({
                        ...directoryModal,
                        event: { ...directoryModal.event, city: e.target.value }
                      })}
                      className="rounded-xl h-9 text-xs"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Venue Location</label>
                    <Input
                      placeholder="e.g. Pak-China Friendship Centre"
                      value={directoryModal.event.location || ''}
                      onChange={(e) => setDirectoryModal({
                        ...directoryModal,
                        event: { ...directoryModal.event, location: e.target.value }
                      })}
                      className="rounded-xl h-9 text-xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Start Date</label>
                    <Input
                      type="datetime-local"
                      value={directoryModal.event.start_date ? directoryModal.event.start_date.slice(0, 16) : '2026-11-20T09:00'}
                      onChange={(e) => setDirectoryModal({
                        ...directoryModal,
                        event: { ...directoryModal.event, start_date: e.target.value }
                      })}
                      className="rounded-xl h-9 text-xs font-mono"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">End Date</label>
                    <Input
                      type="datetime-local"
                      value={directoryModal.event.end_date ? directoryModal.event.end_date.slice(0, 16) : '2026-11-21T18:00'}
                      onChange={(e) => setDirectoryModal({
                        ...directoryModal,
                        event: { ...directoryModal.event, end_date: e.target.value }
                      })}
                      className="rounded-xl h-9 text-xs font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Banner Image URL</label>
                  <Input
                    placeholder="https://..."
                    value={directoryModal.event.banner_url || ''}
                    onChange={(e) => setDirectoryModal({
                      ...directoryModal,
                      event: { ...directoryModal.event, banner_url: e.target.value }
                    })}
                    className="rounded-xl h-9 text-xs"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Description</label>
                  <textarea
                    rows={3}
                    placeholder="Overview of speakers, topics and activities..."
                    value={directoryModal.event.description || ''}
                    onChange={(e) => setDirectoryModal({
                      ...directoryModal,
                      event: { ...directoryModal.event, description: e.target.value }
                    })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 text-xs"
                  />
                </div>

                <div className="flex items-center gap-4 pt-1">
                  <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-700">
                    <input
                      type="checkbox"
                      checked={Boolean(directoryModal.event.is_approved)}
                      onChange={(e) => setDirectoryModal({
                        ...directoryModal,
                        event: { ...directoryModal.event, is_approved: e.target.checked ? 1 : 0 }
                      })}
                      className="rounded text-blue-600 w-4 h-4"
                    />
                    Approved &amp; Live on Directory
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-700">
                    <input
                      type="checkbox"
                      checked={Boolean(directoryModal.event.is_featured)}
                      onChange={(e) => setDirectoryModal({
                        ...directoryModal,
                        event: { ...directoryModal.event, is_featured: e.target.checked ? 1 : 0 }
                      })}
                      className="rounded text-purple-600 w-4 h-4"
                    />
                    Featured on Top
                  </label>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setDirectoryModal({ ...directoryModal, open: false })}
                    className="rounded-xl text-xs h-9"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={savingDirectoryEvent}
                    className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold h-9 px-5"
                  >
                    {savingDirectoryEvent ? 'Saving...' : 'Save Event'}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
