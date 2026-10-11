import { NavLink, useLocation } from "react-router-dom";
import { 
  LayoutDashboard, 
  Calendar, 
  Award,
  BarChart3, 
  PieChart, 
  Users, 
  CreditCard, 
  Settings, 
  Activity,
  LogOut,
  ChevronRight,
  Palette,
  X,
  ShieldCheck,
  Building2,
  DollarSign,
  Globe,
  ShieldAlert,
  Bell,
  Tag
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import { useSidebar } from "@/context/SidebarContext";
import BrandLogo from "@/components/BrandLogo";

export default function Sidebar() {
  const location = useLocation();
  const { user, currentTenant, logout } = useAuth();
  const { isOpen, closeSidebar } = useSidebar();

  const isMaster = user?.role === 'admin' || currentTenant?.id === 1 || currentTenant?.slug === 'eventorax-hq';

  const userInitials = user?.fullName
    ? user.fullName
        .split(" ")
        .map((p) => p[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "EX";

  interface NavItem {
    to: string;
    label: string;
    icon: any;
    badge?: string;
    end?: boolean;
    tab?: string;
  }

  // PLATFORM SUPERADMIN (SaaS Governance, Revenue, Approvals & CMS)
  const superAdminNavItems: NavItem[] = [
    { to: "/superadmin", label: "Platform Overview", icon: ShieldCheck, end: true },
    { to: "/superadmin?tab=tenants", tab: "tenants", label: "Client Organizations", icon: Building2 },
    { to: "/superadmin?tab=approvals", tab: "approvals", label: "Subscription Approvals", icon: CreditCard, badge: "Approvals" },
    { to: "/superadmin?tab=billing", tab: "billing", label: "Revenue & Financials", icon: DollarSign },
    { to: "/superadmin?tab=pricing", tab: "pricing", label: "Pricing & Plans", icon: Tag },
    { to: "/superadmin?tab=cms", tab: "cms", label: "Website & Portal CMS", icon: Globe },
    { to: "/superadmin?tab=security", tab: "security", label: "Security & Anti-Fraud", icon: ShieldAlert },
    { to: "/superadmin?tab=notifications", tab: "notifications", label: "Live System Alerts", icon: Bell },
  ];

  // CLIENT ORGANIZATIONS (Paid Event Managers, Seminars, ID passes & Certificates)
  const clientNavItems: NavItem[] = [
    { to: "/dashboard", label: "Overview", icon: LayoutDashboard, end: true },
    { to: "/dashboard/events", label: "Events & Seminars", icon: Calendar },
    { to: "/dashboard/id-cards", label: "ID Cards & Passes", icon: CreditCard, badge: "Print" },
    { to: "/dashboard/certificates", label: "Certificates", icon: Award, badge: "100+ Designs" },
    { to: "/dashboard/design-studio", label: "Canva Design Studio", icon: Palette, badge: "Studio" },
    { to: "/dashboard/statistics", label: "Attendance & Stats", icon: BarChart3 },
    { to: "/dashboard/charts", label: "Analytics Charts", icon: PieChart },
    { to: "/dashboard/team", label: "Team & Staff", icon: Users },
    { to: "/dashboard/billing", label: "Plan & Billing", icon: CreditCard },
    { to: "/dashboard/settings", label: "Settings & Domain", icon: Settings },
    { to: "/dashboard/activity", label: "Activity Logs", icon: Activity },
  ];

  const navItems = isMaster ? superAdminNavItems : clientNavItems;

  return (
    <aside 
      className={cn(
        "fixed left-0 top-0 z-40 h-screen w-64 bg-[#f8fafc] border-r border-[#e2e8f0] flex flex-col transition-transform duration-300 ease-in-out shadow-lg lg:shadow-none",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}
    >
      {/* Brand & Workspace Header */}
      <div className="p-4 border-b border-[#e2e8f0]">
        <div className="flex items-center justify-between">
          <BrandLogo variant="compact" size="md" showTagline={true} />
          {/* Close button on mobile */}
          <button 
            onClick={closeSidebar}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 lg:hidden"
            title="Close Sidebar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Workspace Quick Badge */}
        <div className="mt-3.5 p-2 rounded-xl bg-white border border-[#e9e4ff]/80 flex items-center gap-2 shadow-2xs">
          <div 
            className="w-5 h-5 rounded-md flex items-center justify-center text-white font-bold text-[9px] shrink-0"
            style={{ backgroundColor: currentTenant?.primary_color || '#7c3aed' }}
          >
            {(currentTenant?.name || 'EX').slice(0, 1).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[11px] font-bold text-[#0f172a] truncate">
              {isMaster ? "EventoraX Master HQ" : (currentTenant?.name || "EventoraX Workspace")}
            </p>
          </div>
          <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${isMaster ? 'bg-blue-100 text-blue-700 font-extrabold' : 'bg-[#f5f3ff] text-[#7c3aed]'}`}>
            {isMaster ? "Platform SuperAdmin" : (currentTenant?.plan || "Starter")}
          </span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = item.tab
            ? location.pathname === '/superadmin' && location.search.includes(`tab=${item.tab}`)
            : item.end 
              ? (location.pathname === item.to && (!location.search || location.search === ''))
              : location.pathname.startsWith(item.to);
          const Icon = item.icon;
          
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              onClick={() => {
                // Auto close on mobile when link is clicked
                if (window.innerWidth < 1024) closeSidebar();
              }}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200",
                isActive 
                  ? "bg-[#1d4ed8] text-white shadow-md shadow-[#1d4ed8]/25 font-semibold" 
                  : "text-[#64748b] hover:bg-[#f1f5f9] hover:text-[#0f172a]"
              )}
            >
              <Icon className={cn("w-4 h-4 shrink-0", isActive ? "text-white" : "text-[#64748b]")} />
              <span className="flex-1 truncate">{item.label}</span>
              {item.badge && (
                <span className={cn(
                  "px-1.5 py-0.5 text-[10px] font-bold rounded-md shrink-0 uppercase tracking-wider",
                  isActive 
                    ? "bg-white/20 text-white" 
                    : "bg-[#e2e8f0] text-[#475569]"
                )}>
                  {item.badge}
                </span>
              )}
              {isActive && !item.badge && <ChevronRight className="w-4 h-4 ml-auto shrink-0" />}
            </NavLink>
          );
        })}
      </nav>

      {/* User Profile Footer */}
      <div className="p-4 border-t border-[#e2e8f0]">
        <div className="flex items-center gap-3 px-3 py-2 rounded-xl bg-white border border-[#e2e8f0] shadow-xs">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#1d4ed8] to-[#3b82f6] flex items-center justify-center text-white font-bold text-xs shrink-0 shadow-xs overflow-hidden">
            {user?.avatarUrl || user?.avatar_url ? (
              <img 
                src={user.avatarUrl || user.avatar_url} 
                alt={user?.fullName || "Avatar"} 
                className="w-full h-full object-cover rounded-full" 
              />
            ) : (
              userInitials
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-[#0f172a] truncate">
              {user?.fullName || "Event Organizer"}
            </p>
            <p className="text-[10px] text-[#94a3b8] truncate">
              {user?.role === 'admin' ? 'EventoraX Administrator' : (user?.orgName || 'Organizer')}
            </p>
          </div>
          <button 
            onClick={logout}
            title="Log Out"
            className="p-1.5 rounded-lg hover:bg-red-50 text-[#94a3b8] hover:text-[#dc2626] transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </aside>
  );
}