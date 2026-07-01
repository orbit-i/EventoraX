import { Link, useLocation, useNavigate, Outlet } from "react-router";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useState } from "react";
import {
  LayoutDashboard,
  Calendar,
  Users,
  Award,
  Ticket,
  Mic2,
  Handshake,
  Clock,
  BarChart3,
  UserCircle,
  CreditCard,
  Settings,
  HelpCircle,
  Activity,
  LogOut,
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
  CalendarDays,
} from "lucide-react";

const sidebarLinks = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/dashboard/events", label: "Events", icon: Calendar },
  { to: "/dashboard/registrations", label: "Registrations", icon: Users },
  { to: "/dashboard/certificates", label: "Certificates", icon: Award },
  { to: "/dashboard/tickets", label: "QR Tickets", icon: Ticket },
  { to: "/dashboard/speakers", label: "Speakers", icon: Mic2 },
  { to: "/dashboard/sponsors", label: "Sponsors", icon: Handshake },
  { to: "/dashboard/schedule", label: "Schedule", icon: Clock },
  { to: "/dashboard/analytics", label: "Analytics", icon: BarChart3 },
  { to: "/dashboard/team", label: "Team", icon: UserCircle },
  { to: "/dashboard/billing", label: "Billing", icon: CreditCard },
  { to: "/dashboard/settings", label: "Settings", icon: Settings },
  { to: "/dashboard/contact", label: "Contact Us", icon: HelpCircle },
  { to: "/dashboard/activity", label: "Activity Log", icon: Activity },
];

export function DashboardLayout() {
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

      {/* Mobile Sidebar Toggle */}
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
        className={`fixed lg:sticky top-0 left-0 z-40 h-screen bg-white border-r border-blue-100 transition-all duration-300 flex flex-col ${
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        } ${collapsed ? "w-16" : "w-64"}`}
      >
        {/* Sidebar Header */}
        <div className={`h-16 flex items-center border-b border-blue-100 px-4 ${collapsed ? "justify-center" : "justify-between"}`}>
          <Link to="/dashboard" className={`flex items-center gap-2 ${collapsed ? "hidden lg:hidden" : ""}`}>
            <CalendarDays className="h-6 w-6 text-blue-500" />
            <span className="font-bold text-blue-600">EventoraX</span>
          </Link>
          <Button
            variant="ghost"
            size="icon"
            className="hidden lg:flex"
            onClick={() => setCollapsed(!collapsed)}
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </Button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-1">
          {sidebarLinks.map((link) => {
            const isActive = location.pathname === link.to;
            return (
              <Link
                key={link.to}
                to={link.to}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                  isActive
                    ? "bg-blue-50 text-blue-600"
                    : "text-slate-600 hover:bg-blue-50 hover:text-blue-600"
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
        <div className="border-t border-blue-100 p-3">
          <div className={`flex items-center ${collapsed ? "justify-center" : "gap-3 px-2 mb-3"}`}>
            <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
              <span className="text-sm font-medium text-blue-600">
                {auth.user?.name?.charAt(0) || "U"}
              </span>
            </div>
            {!collapsed && (
              <div className="min-w-0">
                <p className="text-sm font-medium text-slate-700 truncate">
                  {auth.user?.name || "User"}
                </p>
                <p className="text-xs text-slate-400 truncate">{auth.user?.email || ""}</p>
              </div>
            )}
          </div>
          <Button
            variant="ghost"
            className={`w-full text-red-500 hover:text-red-600 hover:bg-red-50 ${collapsed ? "px-0 justify-center" : ""}`}
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
