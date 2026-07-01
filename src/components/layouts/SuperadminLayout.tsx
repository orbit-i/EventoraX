import { Link, useLocation, useNavigate, Outlet } from "react-router";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useState } from "react";
import {
  LayoutDashboard,
  Building2,
  Tag,
  DollarSign,
  Award,
  Users,
  BarChart3,
  Mail,
  Settings,
  Shield,
  Wrench,
  Megaphone,
  LogOut,
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
  ShieldAlert,
} from "lucide-react";

const superadminLinks = [
  { to: "/superadmin", label: "Dashboard", icon: LayoutDashboard },
  { to: "/superadmin/tenants", label: "Tenants", icon: Building2 },
  { to: "/superadmin/plans", label: "Plans", icon: Tag },
  { to: "/superadmin/revenue", label: "Revenue", icon: DollarSign },
  { to: "/superadmin/certificates", label: "Certificates", icon: Award },
  { to: "/superadmin/users", label: "Users", icon: Users },
  { to: "/superadmin/analytics", label: "Analytics", icon: BarChart3 },
  { to: "/superadmin/emails", label: "Emails", icon: Mail },
  { to: "/superadmin/settings", label: "Settings", icon: Settings },
  { to: "/superadmin/security", label: "Security", icon: Shield },
  { to: "/superadmin/maintenance", label: "Maintenance", icon: Wrench },
  { to: "/superadmin/announcements", label: "Announcements", icon: Megaphone },
];

export function SuperadminLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const auth = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = () => {
    auth.logout();
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Mobile Overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile Toggle */}
      <Button
        variant="ghost"
        size="icon"
        className="fixed top-3 left-3 z-50 lg:hidden bg-white shadow-sm"
        onClick={() => setMobileOpen(!mobileOpen)}
      >
        {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </Button>

      {/* Sidebar */}
      <aside
        className={`fixed lg:sticky top-0 left-0 z-40 h-screen bg-slate-900 text-white transition-all duration-300 flex flex-col ${
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        } ${collapsed ? "w-16" : "w-64"}`}
      >
        {/* Header */}
        <div className={`h-16 flex items-center border-b border-slate-700 px-4 ${collapsed ? "justify-center" : "justify-between"}`}>
          <Link to="/superadmin" className={`flex items-center gap-2 ${collapsed ? "hidden lg:hidden" : ""}`}>
            <ShieldAlert className="h-6 w-6 text-amber-400" />
            <span className="font-bold text-white">Superadmin</span>
          </Link>
          <Button
            variant="ghost"
            size="icon"
            className="hidden lg:flex text-slate-400 hover:text-white"
            onClick={() => setCollapsed(!collapsed)}
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </Button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-1">
          {superadminLinks.map((link) => {
            const isActive = location.pathname === link.to;
            return (
              <Link
                key={link.to}
                to={link.to}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                  isActive
                    ? "bg-blue-600 text-white"
                    : "text-slate-400 hover:bg-slate-800 hover:text-white"
                } ${collapsed ? "justify-center" : ""}`}
                title={collapsed ? link.label : undefined}
              >
                <link.icon className="h-5 w-5 shrink-0" />
                {!collapsed && <span>{link.label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="border-t border-slate-700 p-3">
          <Button
            variant="ghost"
            className={`w-full text-red-400 hover:text-red-300 hover:bg-slate-800 ${collapsed ? "px-0 justify-center" : ""}`}
            onClick={handleLogout}
          >
            <LogOut className="h-4 w-4 shrink-0" />
            {!collapsed && <span className="ml-2">Logout</span>}
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 min-w-0">
        <div className="p-4 lg:p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
