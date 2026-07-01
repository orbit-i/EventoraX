import { Routes, Route } from "react-router";
import { lazy, Suspense } from "react";
import { Spinner } from "@/components/ui/spinner";

// Layouts
import { PublicLayout } from "@/components/layouts/PublicLayout";
import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import { SuperadminLayout } from "@/components/layouts/SuperadminLayout";

// Public Pages
import Home from "@/pages/Home";
const About = lazy(() => import("@/pages/About"));
const Pricing = lazy(() => import("@/pages/Pricing"));
const Features = lazy(() => import("@/pages/Features"));
const Contact = lazy(() => import("@/pages/Contact"));
const Verify = lazy(() => import("@/pages/Verify"));
const Terms = lazy(() => import("@/pages/Terms"));
const Privacy = lazy(() => import("@/pages/Privacy"));

// Auth Pages
import Login from "@/pages/Login";
const Register = lazy(() => import("@/pages/Register"));
const ForgotPassword = lazy(() => import("@/pages/ForgotPassword"));

// Dashboard Pages
import Dashboard from "@/pages/dashboard/Dashboard";
const EventsPage = lazy(() => import("@/pages/dashboard/Events"));
const RegistrationsPage = lazy(() => import("@/pages/dashboard/Registrations"));
const CertificatesPage = lazy(() => import("@/pages/dashboard/Certificates"));
const TicketsPage = lazy(() => import("@/pages/dashboard/Tickets"));
const SpeakersPage = lazy(() => import("@/pages/dashboard/Speakers"));
const SponsorsPage = lazy(() => import("@/pages/dashboard/Sponsors"));
const SchedulePage = lazy(() => import("@/pages/dashboard/Schedule"));
const AnalyticsPage = lazy(() => import("@/pages/dashboard/Analytics"));
const TeamPage = lazy(() => import("@/pages/dashboard/Team"));
const BillingPage = lazy(() => import("@/pages/dashboard/Billing"));
const SettingsPage = lazy(() => import("@/pages/dashboard/Settings"));
const ContactSupport = lazy(() => import("@/pages/dashboard/Contact"));
const ActivityLog = lazy(() => import("@/pages/dashboard/Activity"));

// Superadmin Pages
import SuperadminDashboard from "@/pages/superadmin/Dashboard";
const TenantsPage = lazy(() => import("@/pages/superadmin/Tenants"));
const PlansPage = lazy(() => import("@/pages/superadmin/Plans"));
const RevenuePage = lazy(() => import("@/pages/superadmin/Revenue"));
const SuperadminCertificates = lazy(() => import("@/pages/superadmin/Certificates"));
const UsersPage = lazy(() => import("@/pages/superadmin/Users"));
const SuperadminAnalytics = lazy(() => import("@/pages/superadmin/Analytics"));
const EmailsPage = lazy(() => import("@/pages/superadmin/Emails"));
const SuperadminSettings = lazy(() => import("@/pages/superadmin/Settings"));
const SecurityPage = lazy(() => import("@/pages/superadmin/Security"));
const MaintenancePage = lazy(() => import("@/pages/superadmin/Maintenance"));
const AnnouncementsPage = lazy(() => import("@/pages/superadmin/Announcements"));

// 404
import NotFound from "@/pages/NotFound";

function LoadingFallback() {
  return (
    <div className="flex h-screen w-full items-center justify-center">
      <Spinner className="h-8 w-8 text-blue-500" />
    </div>
  );
}

export default function App() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <Routes>
        {/* Public Routes */}
        <Route element={<PublicLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/pricing" element={<Pricing />} />
          <Route path="/features" element={<Features />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/verify" element={<Verify />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/privacy" element={<Privacy />} />
        </Route>

        {/* Auth Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />

        {/* Dashboard Routes */}
        <Route element={<DashboardLayout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/dashboard/events" element={<EventsPage />} />
          <Route path="/dashboard/registrations" element={<RegistrationsPage />} />
          <Route path="/dashboard/certificates" element={<CertificatesPage />} />
          <Route path="/dashboard/tickets" element={<TicketsPage />} />
          <Route path="/dashboard/speakers" element={<SpeakersPage />} />
          <Route path="/dashboard/sponsors" element={<SponsorsPage />} />
          <Route path="/dashboard/schedule" element={<SchedulePage />} />
          <Route path="/dashboard/analytics" element={<AnalyticsPage />} />
          <Route path="/dashboard/team" element={<TeamPage />} />
          <Route path="/dashboard/billing" element={<BillingPage />} />
          <Route path="/dashboard/settings" element={<SettingsPage />} />
          <Route path="/dashboard/contact" element={<ContactSupport />} />
          <Route path="/dashboard/activity" element={<ActivityLog />} />
        </Route>

        {/* Superadmin Routes */}
        <Route element={<SuperadminLayout />}>
          <Route path="/superadmin" element={<SuperadminDashboard />} />
          <Route path="/superadmin/tenants" element={<TenantsPage />} />
          <Route path="/superadmin/plans" element={<PlansPage />} />
          <Route path="/superadmin/revenue" element={<RevenuePage />} />
          <Route path="/superadmin/certificates" element={<SuperadminCertificates />} />
          <Route path="/superadmin/users" element={<UsersPage />} />
          <Route path="/superadmin/analytics" element={<SuperadminAnalytics />} />
          <Route path="/superadmin/emails" element={<EmailsPage />} />
          <Route path="/superadmin/settings" element={<SuperadminSettings />} />
          <Route path="/superadmin/security" element={<SecurityPage />} />
          <Route path="/superadmin/maintenance" element={<MaintenancePage />} />
          <Route path="/superadmin/announcements" element={<AnnouncementsPage />} />
        </Route>

        {/* 404 */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  );
}
