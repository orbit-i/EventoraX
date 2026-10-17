import React, { useState, useEffect } from 'react';
import {
  FileSpreadsheet,
  Presentation,
  FileText,
  Download,
  Calendar,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Building2,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Search,
  Filter,
  ArrowUpRight,
  Printer,
  Sparkles,
  PieChart as PieIcon,
  BarChart3,
  Layers,
  Award,
  Lock,
  Tag
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from 'recharts';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { api } from '@/services/api';
import {
  type FinancialAuditReport,
  exportReportToExcel,
  exportReportToPowerPoint,
  exportReportToPdf
} from '@/lib/reportExportUtils';
import { downloadElementAsImage } from '@/lib/printUtils';

interface IntervalOption {
  id: string;
  label: string;
  subtitle: string;
  badge: string;
}

const INTERVAL_OPTIONS: IntervalOption[] = [
  { id: '7d', label: '7 Days', subtitle: 'Last 7 Days', badge: 'Weekly' },
  { id: '15d', label: '15 Days', subtitle: 'Last 15 Days', badge: 'Fortnightly' },
  { id: '1m', label: '1 Month', subtitle: 'Last 30 Days', badge: 'Monthly' },
  { id: '3m', label: '3 Months', subtitle: 'Quarterly Audit', badge: 'Quarterly' },
  { id: '6m', label: '6 Months', subtitle: 'Half-Year Audit', badge: 'Semi-Annual' },
  { id: '1y', label: '1 Year', subtitle: 'Annual Audit', badge: 'Annual' },
  { id: '2y', label: '2 Years', subtitle: 'Bi-Annual Audit', badge: '2-Year' },
  { id: 'all', label: 'All Time', subtitle: 'Inception to Date', badge: 'Lifetime' }
];

const COLORS_PLANS = ['#3b82f6', '#10b981', '#8b5cf6', '#f59e0b'];
const COLORS_STATUS = ['#10b981', '#ef4444', '#f59e0b'];

export default function FinancialAuditReportsSection() {
  const [selectedInterval, setSelectedInterval] = useState<string>('1m');
  const [report, setReport] = useState<FinancialAuditReport | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [orgSearch, setOrgSearch] = useState<string>('');
  const [orgPlanFilter, setOrgPlanFilter] = useState<string>('All');
  const [exportingType, setExportingType] = useState<'excel' | 'ppt' | 'pdf' | 'png' | null>(null);

  const fetchReport = async (interval: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.platformAdmin.getFinancialAuditReport(interval);
      if (res.success && res.report) {
        setReport(res.report as FinancialAuditReport);
      } else {
        setError('Failed to fetch financial audit report from server.');
      }
    } catch (err: any) {
      console.error('[FinancialAuditReportsSection] Error:', err);
      setError(err.message || 'Error loading financial audit report.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport(selectedInterval);
  }, [selectedInterval]);

  const handleExcelExport = () => {
    if (!report) return;
    setExportingType('excel');
    try {
      exportReportToExcel(report, `Eventrye-Financial-Audit-${selectedInterval}`);
    } finally {
      setTimeout(() => setExportingType(null), 800);
    }
  };

  const handlePowerPointExport = async () => {
    if (!report) return;
    setExportingType('ppt');
    try {
      await exportReportToPowerPoint(report, `Eventrye-Executive-Report-${selectedInterval}`);
    } finally {
      setTimeout(() => setExportingType(null), 800);
    }
  };

  const handlePdfExport = () => {
    setExportingType('pdf');
    try {
      exportReportToPdf('eventrye-executive-report-printable');
    } finally {
      setTimeout(() => setExportingType(null), 800);
    }
  };

  const handleImageExport = async () => {
    setExportingType('png');
    try {
      await downloadElementAsImage(
        'eventrye-executive-report-printable',
        `Eventrye-Financial-Report-${selectedInterval}.png`,
        2
      );
    } finally {
      setTimeout(() => setExportingType(null), 800);
    }
  };

  // Filtered client organizations in report
  const filteredOrgs = (report?.organizations.items || []).filter((org) => {
    if (orgPlanFilter !== 'All' && org.plan !== orgPlanFilter) return false;
    if (orgSearch) {
      const q = orgSearch.toLowerCase();
      const matchName = org.name.toLowerCase().includes(q);
      const matchSlug = org.slug.toLowerCase().includes(q);
      const matchLicense = (org.licenseKey || '').toLowerCase().includes(q);
      return matchName || matchSlug || matchLicense;
    }
    return true;
  });

  const f = report?.financials;
  const orgs = report?.organizations;

  // Chart data 1: Timeline financial flow
  const timelineChartData = (report?.timeline || []).map((t) => ({
    label: t.label,
    Sales: t.sales,
    Purchases: t.purchases,
    NetProfit: t.profit,
    Margin: t.margin
  }));

  // Chart data 2: Inflow vs Outflow categories
  const breakdownBarData = [
    {
      category: 'Starter Plan',
      Revenue: f?.salesBreakdown.starterPlanRevenue || 0,
      Cost: 0
    },
    {
      category: 'Pro Plan',
      Revenue: f?.salesBreakdown.professionalPlanRevenue || 0,
      Cost: 0
    },
    {
      category: 'Enterprise',
      Revenue: f?.salesBreakdown.enterprisePlanRevenue || 0,
      Cost: 0
    },
    {
      category: 'Ticket Fees',
      Revenue: f?.salesBreakdown.ticketCommissions || 0,
      Cost: 0
    },
    {
      category: 'Gateways (2.5%)',
      Revenue: 0,
      Cost: f?.purchasesBreakdown.merchantGatewayFees || 0
    },
    {
      category: 'Telco SMS/OTP',
      Revenue: 0,
      Cost: f?.purchasesBreakdown.telcoSmsVerification || 0
    },
    {
      category: 'Email Relay',
      Revenue: 0,
      Cost: f?.purchasesBreakdown.emailDeliveryInfrastructure || 0
    },
    {
      category: 'Cloud VPS & DB',
      Revenue: 0,
      Cost: f?.purchasesBreakdown.cloudHostingAndDatabases || 0
    },
    {
      category: 'Storage & CDN',
      Revenue: 0,
      Cost: f?.purchasesBreakdown.tamperEvidentStorage || 0
    },
    {
      category: 'Security AI',
      Revenue: 0,
      Cost: f?.purchasesBreakdown.securitySentinelScanner || 0
    }
  ];

  // Chart data 3: Plan pie
  const planPieData = orgs
    ? [
        { name: 'Starter', value: orgs.planDistribution.Starter || 0 },
        { name: 'Professional', value: orgs.planDistribution.Professional || 0 },
        { name: 'Enterprise', value: orgs.planDistribution.Enterprise || 0 },
        { name: 'Custom', value: orgs.planDistribution.Custom || 0 }
      ].filter((p) => p.value > 0)
    : [];

  // Chart data 4: Status pie
  const statusPieData = orgs
    ? [
        { name: 'Active', value: orgs.statusDistribution.active || 0 },
        { name: 'Suspended', value: orgs.statusDistribution.suspended || 0 },
        { name: 'Pending', value: orgs.statusDistribution.pending || 0 }
      ].filter((s) => s.value > 0)
    : [];

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* ============================================================== */}
      {/* 1. TOP HEADER & CONTROLS */}
      {/* ============================================================== */}
      <div className="bg-white rounded-3xl border border-[#e2e8f0] shadow-xs p-6 space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-slate-200">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-xs font-bold text-blue-700">
              <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
              SBP Level-1 Compliant Corporate Financial Ledger
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight font-heading flex items-center gap-2">
              <FileSpreadsheet className="w-6 h-6 text-emerald-600" />
              Executive Financial &amp; Organization Audit Reports
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 max-w-3xl leading-relaxed">
              Complete audited reporting across platform gross sales inflows, operational purchase costs, net profit/loss, and client organization distributions with multi-format corporate downloads.
            </p>
          </div>

          {/* DOWNLOAD & EXPORT BUTTONS */}
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            {/* Excel Download Button */}
            <Button
              onClick={handleExcelExport}
              disabled={loading || !report || exportingType !== null}
              className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold h-10 px-4 flex items-center gap-2 shadow-sm transition-all"
              title="Download detailed corporate Excel workbook with multi-tab sheets"
            >
              {exportingType === 'excel' ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <FileSpreadsheet className="w-4 h-4" />
              )}
              Download Excel (.xlsx)
            </Button>

            {/* PowerPoint Presentation Download Button */}
            <Button
              onClick={handlePowerPointExport}
              disabled={loading || !report || exportingType !== null}
              className="bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 text-white rounded-xl text-xs font-bold h-10 px-4 flex items-center gap-2 shadow-sm transition-all"
              title="Download executive 5-slide PowerPoint PresentationML deck"
            >
              {exportingType === 'ppt' ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Presentation className="w-4 h-4" />
              )}
              Download PowerPoint (.pptx)
            </Button>

            {/* PDF Report Print & Download Button */}
            <Button
              onClick={handlePdfExport}
              disabled={loading || !report || exportingType !== null}
              className="bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold h-10 px-4 flex items-center gap-2 shadow-sm transition-all"
              title="Export high-resolution printable PDF report with seals and signatures"
            >
              {exportingType === 'pdf' ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <FileText className="w-4 h-4 text-rose-400" />
              )}
              Download PDF Report (.pdf)
            </Button>

            {/* PNG Image Snapshot Button */}
            <Button
              onClick={handleImageExport}
              disabled={loading || !report || exportingType !== null}
              variant="outline"
              className="border-slate-300 text-slate-700 hover:bg-slate-100 rounded-xl text-xs font-bold h-10 px-3 flex items-center gap-1.5"
              title="Download high-res PNG image snapshot"
            >
              {exportingType === 'png' ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Download className="w-4 h-4 text-blue-600" />
              )}
              Snapshot (.png)
            </Button>

            {/* Refresh Button */}
            <Button
              onClick={() => fetchReport(selectedInterval)}
              disabled={loading}
              variant="ghost"
              size="icon"
              className="h-10 w-10 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100"
              title="Refresh audit data"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-blue-600' : ''}`} />
            </Button>
          </div>
        </div>

        {/* ============================================================== */}
        {/* 2. AUDIT PERIOD SELECTOR PILLS (ALL 8 PERIODS) */}
        {/* ============================================================== */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-blue-600" />
              Select Audit Window Duration (8 Preset Intervals)
            </span>
            {report && (
              <span className="text-xs text-slate-500 font-mono">
                Interval: <strong className="text-slate-900">{report.intervalLabel}</strong> ({new Date(report.startDate).toLocaleDateString()} &ndash; {new Date(report.endDate).toLocaleDateString()})
              </span>
            )}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2.5">
            {INTERVAL_OPTIONS.map((opt) => {
              const isSelected = selectedInterval === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setSelectedInterval(opt.id)}
                  disabled={loading && isSelected}
                  className={`relative p-3 rounded-2xl border text-left transition-all duration-200 flex flex-col justify-between ${
                    isSelected
                      ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-600/25 ring-2 ring-blue-500/30'
                      : 'bg-slate-50/70 hover:bg-white text-slate-700 border-slate-200 hover:border-blue-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className={`text-xs font-black ${isSelected ? 'text-white' : 'text-slate-900'}`}>
                      {opt.label}
                    </span>
                    <span
                      className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md ${
                        isSelected ? 'bg-white/20 text-white' : 'bg-slate-200/80 text-slate-600'
                      }`}
                    >
                      {opt.badge}
                    </span>
                  </div>
                  <span className={`text-[10px] truncate ${isSelected ? 'text-blue-100' : 'text-slate-500'}`}>
                    {opt.subtitle}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ERROR NOTICE IF ANY */}
      {error && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* LOADING STATE SKELETON */}
      {loading && !report && (
        <div className="p-16 text-center space-y-3 bg-white rounded-3xl border border-slate-200">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto text-blue-600" />
          <p className="text-sm font-bold text-slate-800">Compiling Financial Ledger &amp; Organization Audit...</p>
          <p className="text-xs text-slate-400">Aggregating gross sales, purchases, profit/loss, and client quota distributions.</p>
        </div>
      )}

      {/* ============================================================== */}
      {/* 3. FOUR CORE FINANCIAL & ECOSYSTEM KPI CARDS */}
      {/* ============================================================== */}
      {report && f && orgs && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {/* KPI 1: Gross Platform Sales */}
            <Card className="border-[#e2e8f0] bg-white shadow-xs hover:shadow-md transition-all">
              <CardContent className="p-6 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Gross Platform Sales
                  </span>
                  <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                    <DollarSign className="w-5 h-5" />
                  </div>
                </div>
                <div>
                  <p className="text-3xl font-black text-slate-900 tracking-tight">
                    ${f.grossSalesUsd.toLocaleString()}
                  </p>
                  <p className="text-xs font-semibold text-emerald-600 mt-0.5">
                    PKR Rs {f.grossSalesPkr.toLocaleString()}
                  </p>
                </div>
                <div className="pt-2 border-t border-slate-100 text-[11px] text-slate-500">
                  <span>Subscriptions + Ticketing Fees + Resource Quotas</span>
                </div>
              </CardContent>
            </Card>

            {/* KPI 2: Operating Purchases & Costs */}
            <Card className="border-[#e2e8f0] bg-white shadow-xs hover:shadow-md transition-all">
              <CardContent className="p-6 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Operating Purchases &amp; Costs
                  </span>
                  <div className="w-10 h-10 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center">
                    <TrendingDown className="w-5 h-5" />
                  </div>
                </div>
                <div>
                  <p className="text-3xl font-black text-slate-900 tracking-tight">
                    ${f.operatingPurchasesUsd.toLocaleString()}
                  </p>
                  <p className="text-xs font-semibold text-rose-600 mt-0.5">
                    PKR Rs {f.operatingPurchasesPkr.toLocaleString()}
                  </p>
                </div>
                <div className="pt-2 border-t border-slate-100 text-[11px] text-slate-500">
                  <span>Gateways (2.5%), Telco SMS, Cloud VPS &amp; AI Scanner</span>
                </div>
              </CardContent>
            </Card>

            {/* KPI 3: Net Profit / Loss Bottom Line */}
            <Card
              className={`border transition-all shadow-xs hover:shadow-md ${
                f.isLoss ? 'border-rose-300 bg-rose-50/20' : 'border-emerald-300 bg-emerald-50/20'
              }`}
            >
              <CardContent className="p-6 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Net Financial Result
                  </span>
                  <Badge
                    className={`text-[10px] font-black uppercase px-2 py-0.5 ${
                      f.isLoss
                        ? 'bg-rose-100 text-rose-700 border-rose-300'
                        : 'bg-emerald-100 text-emerald-700 border-emerald-300'
                    }`}
                  >
                    {f.isLoss ? 'Operating Loss' : 'Net Profit'}
                  </Badge>
                </div>
                <div>
                  <p
                    className={`text-3xl font-black tracking-tight ${
                      f.isLoss ? 'text-rose-600' : 'text-emerald-700'
                    }`}
                  >
                    {f.isLoss ? `-$${f.lossAmountUsd.toLocaleString()}` : `$${f.netProfitUsd.toLocaleString()}`}
                  </p>
                  <p
                    className={`text-xs font-semibold mt-0.5 ${
                      f.isLoss ? 'text-rose-600' : 'text-emerald-600'
                    }`}
                  >
                    PKR Rs {f.isLoss ? `-${f.lossAmountPkr.toLocaleString()}` : f.netProfitPkr.toLocaleString()} (Margin: {f.profitMarginPercent}%)
                  </p>
                </div>
                <div className="pt-2 border-t border-slate-100 text-[11px] text-slate-600 font-medium">
                  <span>Gross Profit: ${f.grossProfitUsd.toLocaleString()} (Rs {f.grossProfitPkr.toLocaleString()})</span>
                </div>
              </CardContent>
            </Card>

            {/* KPI 4: Organizations & Activity Footprint */}
            <Card className="border-[#e2e8f0] bg-white shadow-xs hover:shadow-md transition-all">
              <CardContent className="p-6 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Client Orgs &amp; Ecosystem
                  </span>
                  <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
                    <Building2 className="w-5 h-5" />
                  </div>
                </div>
                <div>
                  <p className="text-3xl font-black text-slate-900 tracking-tight">
                    {orgs.activeCount} <span className="text-slate-400 text-lg font-normal">/ {orgs.totalCount} Orgs</span>
                  </p>
                  <p className="text-xs font-semibold text-blue-600 mt-0.5">
                    {orgs.totalEvents} Events &bull; {orgs.totalAttendees.toLocaleString()} Attendees
                  </p>
                </div>
                <div className="pt-2 border-t border-slate-100 text-[11px] text-slate-500">
                  <span>{orgs.totalCertificates.toLocaleString()} ID Passes &bull; {orgs.checkInRatePercent}% Check-in rate</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* ============================================================== */}
          {/* 4. INTERACTIVE RECHARTS GRAPHICAL PRESENTATIONS */}
          {/* ============================================================== */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Chart 1: Financial Flow & P&L Trend (Area Chart) */}
            <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200 p-6 space-y-4 shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h3 className="text-sm font-black text-slate-900 tracking-tight flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-blue-600" />
                    Periodic Financial Trend &amp; P&amp;L Trajectory
                  </h3>
                  <p className="text-xs text-slate-500">
                    Gross Sales vs Operating Purchases vs Net Profit trajectory for {report.intervalLabel}
                  </p>
                </div>
                <div className="flex items-center gap-3 text-xs font-semibold">
                  <span className="flex items-center gap-1.5 text-emerald-600">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Gross Sales
                  </span>
                  <span className="flex items-center gap-1.5 text-rose-600">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500" /> Purchases / Costs
                  </span>
                  <span className="flex items-center gap-1.5 text-blue-600">
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-600" /> Net Profit
                  </span>
                </div>
              </div>

              <div className="h-72 w-full pt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={timelineChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                      </linearGradient>
                      <linearGradient id="costGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#ef4444" stopOpacity={0.0} />
                      </linearGradient>
                      <linearGradient id="profitGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#2563eb" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#2563eb" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#64748b' }} stroke="#cbd5e1" />
                    <YAxis tick={{ fontSize: 11, fill: '#64748b' }} stroke="#cbd5e1" tickFormatter={(v) => `$${v}`} />
                    <Tooltip
                      formatter={(val: any) => [`$${Number(val).toLocaleString()}`, '']}
                      contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', color: '#fff', fontSize: '12px' }}
                    />
                    <Area type="monotone" dataKey="Sales" stroke="#10b981" strokeWidth={2.5} fillOpacity={1} fill="url(#salesGrad)" />
                    <Area type="monotone" dataKey="Purchases" stroke="#ef4444" strokeWidth={2} fillOpacity={1} fill="url(#costGrad)" />
                    <Area type="monotone" dataKey="NetProfit" stroke="#2563eb" strokeWidth={2.5} fillOpacity={1} fill="url(#profitGrad)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Chart 2: Organization Distributions (Donut Charts) */}
            <div className="bg-white rounded-3xl border border-slate-200 p-6 space-y-4 shadow-xs flex flex-col justify-between">
              <div>
                <h3 className="text-sm font-black text-slate-900 tracking-tight flex items-center gap-2">
                  <PieIcon className="w-4 h-4 text-purple-600" />
                  Organization Distributions
                </h3>
                <p className="text-xs text-slate-500">Plan tier allocations across client workspaces</p>
              </div>

              <div className="h-52 w-full">
                {planPieData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={planPieData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={80}
                        paddingAngle={4}
                      >
                        {planPieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS_PLANS[index % COLORS_PLANS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(val: any, name: any) => [`${val} Orgs`, name]}
                        contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', color: '#fff', fontSize: '12px' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-xs text-slate-400">
                    No organizations registered yet
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 text-xs">
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-md bg-blue-500 shrink-0" />
                  <span className="text-slate-600">Starter: <strong>{orgs.planDistribution.Starter || 0}</strong></span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-md bg-emerald-500 shrink-0" />
                  <span className="text-slate-600">Pro: <strong>{orgs.planDistribution.Professional || 0}</strong></span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-md bg-purple-500 shrink-0" />
                  <span className="text-slate-600">Enterprise: <strong>{orgs.planDistribution.Enterprise || 0}</strong></span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-md bg-amber-500 shrink-0" />
                  <span className="text-slate-600">Active: <strong>{orgs.activeCount || 0}</strong></span>
                </div>
              </div>
            </div>
          </div>

          {/* Chart 3: Detailed Inflows vs Operating Purchases Breakdown Bar Chart */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 space-y-4 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="text-sm font-black text-slate-900 tracking-tight flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-emerald-600" />
                  Sales Inflows vs Operational Costs Categories
                </h3>
                <p className="text-xs text-slate-500">
                  Direct revenue stream inflows vs categorized operating cost outflows (in USD)
                </p>
              </div>
              <div className="flex items-center gap-3 text-xs font-semibold">
                <span className="flex items-center gap-1.5 text-emerald-600">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Sales Inflow
                </span>
                <span className="flex items-center gap-1.5 text-rose-600">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500" /> Operating Purchase / Expense
                </span>
              </div>
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={breakdownBarData} margin={{ top: 10, right: 10, left: -20, bottom: 25 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="category" tick={{ fontSize: 10, fill: '#64748b' }} stroke="#cbd5e1" angle={-15} textAnchor="end" />
                  <YAxis tick={{ fontSize: 11, fill: '#64748b' }} stroke="#cbd5e1" tickFormatter={(v) => `$${v}`} />
                  <Tooltip
                    formatter={(val: any) => [`$${Number(val).toLocaleString()}`, '']}
                    contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', color: '#fff', fontSize: '12px' }}
                  />
                  <Bar dataKey="Revenue" fill="#10b981" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="Cost" fill="#ef4444" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* ============================================================== */}
          {/* 5. ITEMIZED STATEMENT OF PROFIT & LOSS TABLE */}
          {/* ============================================================== */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 space-y-4 shadow-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-black text-slate-900 tracking-tight font-heading flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-blue-600" />
                  Itemized Statement of Profit &amp; Loss (Income Statement)
                </h3>
                <p className="text-xs text-slate-500">
                  Audited financial breakdown for {report.intervalLabel}
                </p>
              </div>
              <Badge className="bg-blue-50 text-blue-700 border-blue-200 text-xs font-mono">
                Audit #{report.compliance.auditNumber}
              </Badge>
            </div>

            <div className="overflow-x-auto rounded-2xl border border-slate-200">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-900 text-white font-bold uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="p-3.5 pl-4">Category / Item</th>
                    <th className="p-3.5 text-right">Amount (USD $)</th>
                    <th className="p-3.5 text-right">Amount (PKR Rs)</th>
                    <th className="p-3.5 text-right pr-4">% / Allocation</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {/* REVENUE SECTION */}
                  <tr className="bg-slate-50/80 font-bold text-slate-900">
                    <td colSpan={4} className="p-3 pl-4 text-blue-700 uppercase tracking-wider text-[11px]">
                      1. Revenue &amp; Sales Inflows
                    </td>
                  </tr>
                  <tr className="hover:bg-slate-50/50">
                    <td className="p-3 pl-6 text-slate-700">Starter Plan Subscriptions ($36/mo)</td>
                    <td className="p-3 text-right font-mono font-bold text-slate-900">${f.salesBreakdown.starterPlanRevenue.toLocaleString()}</td>
                    <td className="p-3 text-right font-mono text-slate-600">Rs {Math.round(f.salesBreakdown.starterPlanRevenue * 278).toLocaleString()}</td>
                    <td className="p-3 text-right pr-4 text-slate-500 font-mono">
                      {f.grossSalesUsd > 0 ? ((f.salesBreakdown.starterPlanRevenue / f.grossSalesUsd) * 100).toFixed(1) : 0}%
                    </td>
                  </tr>
                  <tr className="hover:bg-slate-50/50">
                    <td className="p-3 pl-6 text-slate-700">Professional Plan Subscriptions ($99/mo)</td>
                    <td className="p-3 text-right font-mono font-bold text-slate-900">${f.salesBreakdown.professionalPlanRevenue.toLocaleString()}</td>
                    <td className="p-3 text-right font-mono text-slate-600">Rs {Math.round(f.salesBreakdown.professionalPlanRevenue * 278).toLocaleString()}</td>
                    <td className="p-3 text-right pr-4 text-slate-500 font-mono">
                      {f.grossSalesUsd > 0 ? ((f.salesBreakdown.professionalPlanRevenue / f.grossSalesUsd) * 100).toFixed(1) : 0}%
                    </td>
                  </tr>
                  <tr className="hover:bg-slate-50/50">
                    <td className="p-3 pl-6 text-slate-700">Enterprise Plan Subscriptions ($299/mo)</td>
                    <td className="p-3 text-right font-mono font-bold text-slate-900">${f.salesBreakdown.enterprisePlanRevenue.toLocaleString()}</td>
                    <td className="p-3 text-right font-mono text-slate-600">Rs {Math.round(f.salesBreakdown.enterprisePlanRevenue * 278).toLocaleString()}</td>
                    <td className="p-3 text-right pr-4 text-slate-500 font-mono">
                      {f.grossSalesUsd > 0 ? ((f.salesBreakdown.enterprisePlanRevenue / f.grossSalesUsd) * 100).toFixed(1) : 0}%
                    </td>
                  </tr>
                  <tr className="hover:bg-slate-50/50">
                    <td className="p-3 pl-6 text-slate-700">Event Ticketing Commissions &amp; Gateway Processing</td>
                    <td className="p-3 text-right font-mono font-bold text-slate-900">${f.salesBreakdown.ticketCommissions.toLocaleString()}</td>
                    <td className="p-3 text-right font-mono text-slate-600">Rs {Math.round(f.salesBreakdown.ticketCommissions * 278).toLocaleString()}</td>
                    <td className="p-3 text-right pr-4 text-slate-500 font-mono">
                      {f.grossSalesUsd > 0 ? ((f.salesBreakdown.ticketCommissions / f.grossSalesUsd) * 100).toFixed(1) : 0}%
                    </td>
                  </tr>
                  <tr className="hover:bg-slate-50/50">
                    <td className="p-3 pl-6 text-slate-700">Add-on Resource Quotas (SMS Packs, Extra Passes)</td>
                    <td className="p-3 text-right font-mono font-bold text-slate-900">${f.salesBreakdown.addOnQuotaPacks.toLocaleString()}</td>
                    <td className="p-3 text-right font-mono text-slate-600">Rs {Math.round(f.salesBreakdown.addOnQuotaPacks * 278).toLocaleString()}</td>
                    <td className="p-3 text-right pr-4 text-slate-500 font-mono">
                      {f.grossSalesUsd > 0 ? ((f.salesBreakdown.addOnQuotaPacks / f.grossSalesUsd) * 100).toFixed(1) : 0}%
                    </td>
                  </tr>
                  <tr className="bg-emerald-50/60 font-black text-emerald-900">
                    <td className="p-3.5 pl-4">TOTAL GROSS PLATFORM SALES (A)</td>
                    <td className="p-3.5 text-right font-mono text-sm">${f.grossSalesUsd.toLocaleString()}</td>
                    <td className="p-3.5 text-right font-mono">Rs {f.grossSalesPkr.toLocaleString()}</td>
                    <td className="p-3.5 text-right pr-4 font-mono">100.0%</td>
                  </tr>

                  {/* PURCHASES & EXPENSES SECTION */}
                  <tr className="bg-slate-50/80 font-bold text-slate-900">
                    <td colSpan={4} className="p-3 pl-4 text-rose-700 uppercase tracking-wider text-[11px]">
                      2. Operating Purchases &amp; Direct Costs (COGS &amp; OPEX)
                    </td>
                  </tr>
                  <tr className="hover:bg-slate-50/50">
                    <td className="p-3 pl-6 text-slate-700">Merchant Payment Gateway Fees (2.5% of Gross Volume)</td>
                    <td className="p-3 text-right font-mono font-bold text-slate-900">${f.purchasesBreakdown.merchantGatewayFees.toLocaleString()}</td>
                    <td className="p-3 text-right font-mono text-slate-600">Rs {Math.round(f.purchasesBreakdown.merchantGatewayFees * 278).toLocaleString()}</td>
                    <td className="p-3 text-right pr-4 text-slate-500 text-[11px]">Direct COGS</td>
                  </tr>
                  <tr className="hover:bg-slate-50/50">
                    <td className="p-3 pl-6 text-slate-700">Telco SMS &amp; WhatsApp OTP Verification Gateway ($0.015/ea)</td>
                    <td className="p-3 text-right font-mono font-bold text-slate-900">${f.purchasesBreakdown.telcoSmsVerification.toLocaleString()}</td>
                    <td className="p-3 text-right font-mono text-slate-600">Rs {Math.round(f.purchasesBreakdown.telcoSmsVerification * 278).toLocaleString()}</td>
                    <td className="p-3 text-right pr-4 text-slate-500 text-[11px]">Direct COGS</td>
                  </tr>
                  <tr className="hover:bg-slate-50/50">
                    <td className="p-3 pl-6 text-slate-700">Transactional Email Relay Server Infrastructure ($0.001/ea)</td>
                    <td className="p-3 text-right font-mono font-bold text-slate-900">${f.purchasesBreakdown.emailDeliveryInfrastructure.toLocaleString()}</td>
                    <td className="p-3 text-right font-mono text-slate-600">Rs {Math.round(f.purchasesBreakdown.emailDeliveryInfrastructure * 278).toLocaleString()}</td>
                    <td className="p-3 text-right pr-4 text-slate-500 text-[11px]">Direct COGS</td>
                  </tr>
                  <tr className="hover:bg-slate-50/50">
                    <td className="p-3 pl-6 text-slate-700">Dedicated Cloud VPS Servers &amp; MySQL HA Cluster</td>
                    <td className="p-3 text-right font-mono font-bold text-slate-900">${f.purchasesBreakdown.cloudHostingAndDatabases.toLocaleString()}</td>
                    <td className="p-3 text-right font-mono text-slate-600">Rs {Math.round(f.purchasesBreakdown.cloudHostingAndDatabases * 278).toLocaleString()}</td>
                    <td className="p-3 text-right pr-4 text-slate-500 text-[11px]">OPEX Infrastructure</td>
                  </tr>
                  <tr className="hover:bg-slate-50/50">
                    <td className="p-3 pl-6 text-slate-700">Tamper-Evident Storage &amp; Verification CDN</td>
                    <td className="p-3 text-right font-mono font-bold text-slate-900">${f.purchasesBreakdown.tamperEvidentStorage.toLocaleString()}</td>
                    <td className="p-3 text-right font-mono text-slate-600">Rs {Math.round(f.purchasesBreakdown.tamperEvidentStorage * 278).toLocaleString()}</td>
                    <td className="p-3 text-right pr-4 text-slate-500 text-[11px]">OPEX Storage</td>
                  </tr>
                  <tr className="hover:bg-slate-50/50">
                    <td className="p-3 pl-6 text-slate-700">Security Sentinel 24/7 AI Threat Scanner &amp; Sandboxing</td>
                    <td className="p-3 text-right font-mono font-bold text-slate-900">${f.purchasesBreakdown.securitySentinelScanner.toLocaleString()}</td>
                    <td className="p-3 text-right font-mono text-slate-600">Rs {Math.round(f.purchasesBreakdown.securitySentinelScanner * 278).toLocaleString()}</td>
                    <td className="p-3 text-right pr-4 text-slate-500 text-[11px]">OPEX Cybersecurity</td>
                  </tr>
                  <tr className="hover:bg-slate-50/50">
                    <td className="p-3 pl-6 text-slate-700">Systems Maintenance &amp; 99.9% Uptime Engineering Reserve</td>
                    <td className="p-3 text-right font-mono font-bold text-slate-900">${f.purchasesBreakdown.maintenanceReserve.toLocaleString()}</td>
                    <td className="p-3 text-right font-mono text-slate-600">Rs {Math.round(f.purchasesBreakdown.maintenanceReserve * 278).toLocaleString()}</td>
                    <td className="p-3 text-right pr-4 text-slate-500 text-[11px]">OPEX Reserve</td>
                  </tr>
                  <tr className="bg-rose-50/60 font-black text-rose-900">
                    <td className="p-3.5 pl-4">TOTAL OPERATING PURCHASES &amp; EXPENSES (B)</td>
                    <td className="p-3.5 text-right font-mono text-sm">${f.operatingPurchasesUsd.toLocaleString()}</td>
                    <td className="p-3.5 text-right font-mono">Rs {f.operatingPurchasesPkr.toLocaleString()}</td>
                    <td className="p-3.5 text-right pr-4 font-mono">Total Deductions</td>
                  </tr>

                  {/* NET BOTTOM LINE SECTION */}
                  <tr className="bg-slate-50/80 font-bold text-slate-900">
                    <td colSpan={4} className="p-3 pl-4 text-slate-900 uppercase tracking-wider text-[11px]">
                      3. Net Financial Bottom Line
                    </td>
                  </tr>
                  <tr className="hover:bg-slate-50/50 font-bold">
                    <td className="p-3 pl-6 text-slate-800">Gross Profit (Sales less direct COGS transaction fees)</td>
                    <td className="p-3 text-right font-mono text-slate-900">${f.grossProfitUsd.toLocaleString()}</td>
                    <td className="p-3 text-right font-mono text-slate-600">Rs {f.grossProfitPkr.toLocaleString()}</td>
                    <td className="p-3 text-right pr-4 text-emerald-600 font-mono">Positive Inflow</td>
                  </tr>
                  <tr
                    className={`font-black text-sm ${
                      f.isLoss ? 'bg-rose-100 text-rose-950' : 'bg-emerald-100 text-emerald-950'
                    }`}
                  >
                    <td className="p-4 pl-4 flex items-center gap-2">
                      {f.isLoss ? <TrendingDown className="w-5 h-5 text-rose-600" /> : <TrendingUp className="w-5 h-5 text-emerald-600" />}
                      NET OPERATING RESULT (A &minus; B)
                    </td>
                    <td className="p-4 text-right font-mono">
                      {f.isLoss ? `-$${f.lossAmountUsd.toLocaleString()}` : `$${f.netProfitUsd.toLocaleString()}`}
                    </td>
                    <td className="p-4 text-right font-mono">
                      PKR Rs {f.isLoss ? `-${f.lossAmountPkr.toLocaleString()}` : f.netProfitPkr.toLocaleString()}
                    </td>
                    <td className="p-4 text-right pr-4 font-mono">
                      {f.isLoss ? 'DEFICIT' : `+${f.profitMarginPercent}% Margin`}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* ============================================================== */}
          {/* 6. CLIENT ORGANIZATIONS DISTRIBUTIONS AUDIT TABLE */}
          {/* ============================================================== */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 space-y-4 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-black text-slate-900 tracking-tight font-heading flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-indigo-600" />
                  Client Organization Distributions &amp; Footprint
                </h3>
                <p className="text-xs text-slate-500">
                  Individual organization performance, plan quotas, events hosted, and attendees served
                </p>
              </div>

              {/* Filters */}
              <div className="flex flex-wrap items-center gap-2.5">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <Input
                    placeholder="Search organizations..."
                    value={orgSearch}
                    onChange={(e) => setOrgSearch(e.target.value)}
                    className="pl-8 text-xs h-9 w-48 rounded-xl"
                  />
                </div>

                <select
                  value={orgPlanFilter}
                  onChange={(e) => setOrgPlanFilter(e.target.value)}
                  className="text-xs h-9 px-3 rounded-xl border border-slate-200 bg-white font-medium text-slate-700"
                >
                  <option value="All">All Plans</option>
                  <option value="Starter">Starter</option>
                  <option value="Professional">Professional</option>
                  <option value="Enterprise">Enterprise</option>
                  <option value="Custom">Custom</option>
                </select>
              </div>
            </div>

            <div className="overflow-x-auto rounded-2xl border border-slate-200">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="p-3 pl-4">ID</th>
                    <th className="p-3">Organization</th>
                    <th className="p-3">Plan Tier</th>
                    <th className="p-3">Status</th>
                    <th className="p-3 text-center">Events</th>
                    <th className="p-3 text-center">Attendees</th>
                    <th className="p-3 text-center">ID Passes</th>
                    <th className="p-3 text-center">Check-Ins</th>
                    <th className="p-3 text-right">Est. Sales ($)</th>
                    <th className="p-3 text-right pr-4">License Key</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredOrgs.length > 0 ? (
                    filteredOrgs.map((org) => (
                      <tr key={org.id} className="hover:bg-slate-50/70">
                        <td className="p-3 pl-4 font-mono font-bold text-slate-500">#{org.id}</td>
                        <td className="p-3">
                          <span className="font-bold text-slate-900 block">{org.name}</span>
                          <span className="text-[10px] text-slate-400 font-mono">/{org.slug}</span>
                        </td>
                        <td className="p-3">
                          <Badge className="bg-blue-50 text-blue-700 border-blue-200 text-[10px] font-bold">
                            {org.plan}
                          </Badge>
                        </td>
                        <td className="p-3">
                          <Badge
                            className={`text-[10px] font-bold ${
                              org.status === 'active'
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : 'bg-rose-50 text-rose-700 border-rose-200'
                            }`}
                          >
                            {org.status}
                          </Badge>
                        </td>
                        <td className="p-3 text-center font-bold text-slate-800">{org.eventsCount}</td>
                        <td className="p-3 text-center font-bold text-slate-800">{org.attendeesCount.toLocaleString()}</td>
                        <td className="p-3 text-center font-bold text-slate-800">{org.certsCount.toLocaleString()}</td>
                        <td className="p-3 text-center font-bold text-emerald-600">{org.checkInsCount.toLocaleString()}</td>
                        <td className="p-3 text-right font-mono font-bold text-slate-900">${org.grossRevenue.toLocaleString()}</td>
                        <td className="p-3 text-right pr-4 font-mono text-[11px] text-slate-600">{org.licenseKey || 'EVX-ACTIVE'}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={10} className="p-8 text-center text-xs text-slate-400">
                        No client organizations match your filter criteria.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* ============================================================== */}
          {/* 7. PERIODIC TIMELINE LEDGER TABLE */}
          {/* ============================================================== */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 space-y-4 shadow-xs">
            <div>
              <h3 className="text-base font-black text-slate-900 tracking-tight font-heading flex items-center gap-2">
                <Calendar className="w-5 h-5 text-purple-600" />
                Periodic Financial &amp; Operational Timeline Ledger
              </h3>
              <p className="text-xs text-slate-500">
                Segmented chronological performance breakdown across {report.intervalLabel}
              </p>
            </div>

            <div className="overflow-x-auto rounded-2xl border border-slate-200">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="p-3 pl-4">Time Bucket</th>
                    <th className="p-3 text-right">Sales ($)</th>
                    <th className="p-3 text-right">Purchases ($)</th>
                    <th className="p-3 text-right">Net Profit ($)</th>
                    <th className="p-3 text-right">Margin (%)</th>
                    <th className="p-3 text-center">Active Orgs</th>
                    <th className="p-3 text-center">Events</th>
                    <th className="p-3 text-center pr-4">Attendees</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {report.timeline.map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/70">
                      <td className="p-3 pl-4 font-bold text-slate-900">{item.label}</td>
                      <td className="p-3 text-right font-mono font-bold text-emerald-600">${item.sales.toLocaleString()}</td>
                      <td className="p-3 text-right font-mono font-bold text-rose-600">${item.purchases.toLocaleString()}</td>
                      <td className="p-3 text-right font-mono font-bold text-slate-900">${item.profit.toLocaleString()}</td>
                      <td className="p-3 text-right font-mono text-slate-600">{item.margin}%</td>
                      <td className="p-3 text-center font-bold text-slate-800">{item.activeOrgs}</td>
                      <td className="p-3 text-center font-bold text-slate-800">{item.eventsCount}</td>
                      <td className="p-3 text-center pr-4 font-bold text-slate-800">{item.attendeesCount.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* ============================================================== */}
          {/* 8. HIDDEN / DEDICATED PRINTABLE CONTAINER FOR PDF EXPORT */}
          {/* ============================================================== */}
          <div className="hidden">
            <div
              id="eventrye-executive-report-printable"
              className="p-8 max-w-4xl mx-auto bg-white text-slate-900 font-sans space-y-6"
              style={{ width: '800px', backgroundColor: '#ffffff', color: '#0f172a' }}
            >
              {/* Printable Header */}
              <div className="border-b-2 border-blue-600 pb-4 flex items-start justify-between">
                <div>
                  <h1 className="text-2xl font-black text-slate-900 tracking-tight">EVENTRYE ENTERPRISE PLATFORM</h1>
                  <p className="text-xs font-bold text-blue-700 tracking-wider uppercase">Executive Financial &amp; Organization Audit</p>
                  <p className="text-xs text-slate-500 mt-1">Audit Interval: <strong>{report.intervalLabel}</strong></p>
                </div>
                <div className="text-right text-xs space-y-0.5">
                  <div className="inline-block bg-blue-100 text-blue-900 font-bold px-2 py-0.5 rounded text-[10px]">
                    SBP Level-1 Compliant
                  </div>
                  <p className="text-slate-600 text-[11px]">Audit #{report.compliance.auditNumber}</p>
                  <p className="text-slate-600 text-[11px]">NTN: {report.compliance.taxNtn} | STRN: {report.compliance.taxStrn}</p>
                  <p className="text-slate-400 text-[10px]">Generated: {new Date(report.compliance.generatedAt).toLocaleString()}</p>
                </div>
              </div>

              {/* KPI Summary Grid */}
              <div className="grid grid-cols-4 gap-3 text-xs">
                <div className="p-3 rounded-xl border border-slate-200 bg-slate-50">
                  <span className="text-[10px] font-bold text-slate-500 uppercase block">Gross Sales</span>
                  <span className="text-base font-black text-slate-900 block">${f.grossSalesUsd.toLocaleString()}</span>
                  <span className="text-[10px] text-emerald-700 font-semibold block">Rs {f.grossSalesPkr.toLocaleString()}</span>
                </div>
                <div className="p-3 rounded-xl border border-slate-200 bg-slate-50">
                  <span className="text-[10px] font-bold text-slate-500 uppercase block">Purchases / Costs</span>
                  <span className="text-base font-black text-slate-900 block">${f.operatingPurchasesUsd.toLocaleString()}</span>
                  <span className="text-[10px] text-rose-700 font-semibold block">Rs {f.operatingPurchasesPkr.toLocaleString()}</span>
                </div>
                <div className="p-3 rounded-xl border border-slate-200 bg-slate-50">
                  <span className="text-[10px] font-bold text-slate-500 uppercase block">Net Result</span>
                  <span className={`text-base font-black block ${f.isLoss ? 'text-rose-700' : 'text-emerald-700'}`}>
                    {f.isLoss ? `-$${f.lossAmountUsd.toLocaleString()}` : `$${f.netProfitUsd.toLocaleString()}`}
                  </span>
                  <span className="text-[10px] text-slate-600 block">Margin: {f.profitMarginPercent}%</span>
                </div>
                <div className="p-3 rounded-xl border border-slate-200 bg-slate-50">
                  <span className="text-[10px] font-bold text-slate-500 uppercase block">Client Orgs</span>
                  <span className="text-base font-black text-slate-900 block">{orgs.activeCount} / {orgs.totalCount}</span>
                  <span className="text-[10px] text-blue-700 block">{orgs.totalEvents} Events Hosted</span>
                </div>
              </div>

              {/* P&L Statement */}
              <div className="space-y-2">
                <h3 className="text-xs font-black uppercase text-slate-900 tracking-wider">Statement of Profit &amp; Loss</h3>
                <table className="w-full text-[11px] border border-slate-200 border-collapse">
                  <tbody>
                    <tr className="bg-slate-100 font-bold">
                      <td className="p-2 border border-slate-200">Revenues: Starter Subscriptions</td>
                      <td className="p-2 text-right border border-slate-200 font-mono">${f.salesBreakdown.starterPlanRevenue.toLocaleString()}</td>
                      <td className="p-2 text-right border border-slate-200 font-mono">Rs {Math.round(f.salesBreakdown.starterPlanRevenue * 278).toLocaleString()}</td>
                    </tr>
                    <tr>
                      <td className="p-2 border border-slate-200">Revenues: Professional Subscriptions</td>
                      <td className="p-2 text-right border border-slate-200 font-mono">${f.salesBreakdown.professionalPlanRevenue.toLocaleString()}</td>
                      <td className="p-2 text-right border border-slate-200 font-mono">Rs {Math.round(f.salesBreakdown.professionalPlanRevenue * 278).toLocaleString()}</td>
                    </tr>
                    <tr>
                      <td className="p-2 border border-slate-200">Revenues: Enterprise Subscriptions</td>
                      <td className="p-2 text-right border border-slate-200 font-mono">${f.salesBreakdown.enterprisePlanRevenue.toLocaleString()}</td>
                      <td className="p-2 text-right border border-slate-200 font-mono">Rs {Math.round(f.salesBreakdown.enterprisePlanRevenue * 278).toLocaleString()}</td>
                    </tr>
                    <tr>
                      <td className="p-2 border border-slate-200">Revenues: Event Commissions &amp; Add-ons</td>
                      <td className="p-2 text-right border border-slate-200 font-mono">${(f.salesBreakdown.ticketCommissions + f.salesBreakdown.addOnQuotaPacks).toLocaleString()}</td>
                      <td className="p-2 text-right border border-slate-200 font-mono">Rs {Math.round((f.salesBreakdown.ticketCommissions + f.salesBreakdown.addOnQuotaPacks) * 278).toLocaleString()}</td>
                    </tr>
                    <tr className="bg-emerald-50 font-black">
                      <td className="p-2 border border-slate-200">TOTAL GROSS SALES (A)</td>
                      <td className="p-2 text-right border border-slate-200 font-mono">${f.grossSalesUsd.toLocaleString()}</td>
                      <td className="p-2 text-right border border-slate-200 font-mono">Rs {f.grossSalesPkr.toLocaleString()}</td>
                    </tr>
                    <tr className="bg-slate-100 font-bold">
                      <td className="p-2 border border-slate-200">Operating Costs: Merchant Gateways (2.5%)</td>
                      <td className="p-2 text-right border border-slate-200 font-mono">${f.purchasesBreakdown.merchantGatewayFees.toLocaleString()}</td>
                      <td className="p-2 text-right border border-slate-200 font-mono">Rs {Math.round(f.purchasesBreakdown.merchantGatewayFees * 278).toLocaleString()}</td>
                    </tr>
                    <tr>
                      <td className="p-2 border border-slate-200">Operating Costs: Telco SMS &amp; Email Dispatch</td>
                      <td className="p-2 text-right border border-slate-200 font-mono">${(f.purchasesBreakdown.telcoSmsVerification + f.purchasesBreakdown.emailDeliveryInfrastructure).toLocaleString()}</td>
                      <td className="p-2 text-right border border-slate-200 font-mono">Rs {Math.round((f.purchasesBreakdown.telcoSmsVerification + f.purchasesBreakdown.emailDeliveryInfrastructure) * 278).toLocaleString()}</td>
                    </tr>
                    <tr>
                      <td className="p-2 border border-slate-200">Operating Costs: Cloud Server VPS, DB &amp; CDN Storage</td>
                      <td className="p-2 text-right border border-slate-200 font-mono">${(f.purchasesBreakdown.cloudHostingAndDatabases + f.purchasesBreakdown.tamperEvidentStorage).toLocaleString()}</td>
                      <td className="p-2 text-right border border-slate-200 font-mono">Rs {Math.round((f.purchasesBreakdown.cloudHostingAndDatabases + f.purchasesBreakdown.tamperEvidentStorage) * 278).toLocaleString()}</td>
                    </tr>
                    <tr>
                      <td className="p-2 border border-slate-200">Operating Costs: Security Sentinel AI &amp; Maintenance Reserve</td>
                      <td className="p-2 text-right border border-slate-200 font-mono">${(f.purchasesBreakdown.securitySentinelScanner + f.purchasesBreakdown.maintenanceReserve).toLocaleString()}</td>
                      <td className="p-2 text-right border border-slate-200 font-mono">Rs {Math.round((f.purchasesBreakdown.securitySentinelScanner + f.purchasesBreakdown.maintenanceReserve) * 278).toLocaleString()}</td>
                    </tr>
                    <tr className="bg-rose-50 font-black">
                      <td className="p-2 border border-slate-200">TOTAL OPERATING PURCHASES &amp; EXPENSES (B)</td>
                      <td className="p-2 text-right border border-slate-200 font-mono">${f.operatingPurchasesUsd.toLocaleString()}</td>
                      <td className="p-2 text-right border border-slate-200 font-mono">Rs {f.operatingPurchasesPkr.toLocaleString()}</td>
                    </tr>
                    <tr className="bg-blue-50 font-black text-xs">
                      <td className="p-2.5 border border-slate-200">NET OPERATING PROFIT / (LOSS) (A &minus; B)</td>
                      <td className="p-2.5 text-right border border-slate-200 font-mono">${f.netProfitUsd.toLocaleString()}</td>
                      <td className="p-2.5 text-right border border-slate-200 font-mono">PKR Rs {f.netProfitPkr.toLocaleString()} (Margin: {f.profitMarginPercent}%)</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Organization Distributions Summary */}
              <div className="space-y-2">
                <h3 className="text-xs font-black uppercase text-slate-900 tracking-wider">Client Organization Distributions</h3>
                <div className="grid grid-cols-4 gap-2 text-[11px] p-3 rounded-xl border border-slate-200 bg-slate-50">
                  <div>Starter: <strong>{orgs.planDistribution.Starter || 0} orgs</strong></div>
                  <div>Professional: <strong>{orgs.planDistribution.Professional || 0} orgs</strong></div>
                  <div>Enterprise: <strong>{orgs.planDistribution.Enterprise || 0} orgs</strong></div>
                  <div>Active Workspaces: <strong>{orgs.activeCount || 0} orgs</strong></div>
                </div>
              </div>

              {/* Corporate Signoff & Seal */}
              <div className="pt-6 border-t border-slate-200 flex items-center justify-between text-xs text-slate-600">
                <div>
                  <p className="font-bold text-slate-900">Eventrye Platform Authority</p>
                  <p className="text-[10px] text-slate-500">ORBIT-I Private Limited &bull; Verified Audit Document</p>
                </div>
                <div className="text-right">
                  <div className="w-28 border-b border-slate-400 mb-1" />
                  <p className="text-[10px] font-bold text-slate-800">Authorized SuperAdmin Signatory</p>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
