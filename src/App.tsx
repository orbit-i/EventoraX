import { Routes, Route, useLocation } from 'react-router';
import { lazy, Suspense, useEffect } from 'react';
import { PageLoader } from './components/app/PageLoader';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import { Toaster } from './components/ui/sonner';
import { ProtectedRoute, GuestRoute } from './components/auth/RouteGuards';
const Home = lazy(() => import('./pages/Home'));
const About = lazy(() => import('./pages/About'));
const Features = lazy(() => import('./pages/Features'));
const Pricing = lazy(() => import('./pages/Pricing'));
const Contact = lazy(() => import('./pages/Contact'));
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const ForgotPassword = lazy(() => import('./pages/ForgotPassword'));
const ResetPassword = lazy(() => import('./pages/ResetPassword'));
const VerifyEmail = lazy(() => import('./pages/VerifyEmail'));
const AcceptInvite = lazy(() => import('./pages/AcceptInvite'));
const Terms = lazy(() => import('./pages/Terms'));
const Privacy = lazy(() => import('./pages/Privacy'));
const Verify = lazy(() => import('./pages/Verify'));
const NotFound = lazy(() => import('./pages/NotFound'));
import { SiteBanner } from './components/layout/SiteBanner';
const EventPage = lazy(() => import('./pages/public/EventPage'));
const Developers = lazy(() => import('./pages/Developers'));
const ApiPage = lazy(() => import('./pages/dashboard/ApiPage'));
const OrgPage = lazy(() => import('./pages/public/OrgPage'));
const ComponentGallery = lazy(() => import('./pages/dev/ComponentGallery'));
const SuperadminLayout = lazy(() => import('./components/superadmin/SuperadminLayout'));
const SuperadminDashboardPage = lazy(() => import('./pages/superadmin/SuperadminDashboardPage'));
const TenantsPage = lazy(() => import('./pages/superadmin/TenantsPage'));
const TenantDetailPage = lazy(() => import('./pages/superadmin/TenantDetailPage'));
const RevenuePage = lazy(() => import('./pages/superadmin/RevenuePage'));
const PlansPage = lazy(() => import('./pages/superadmin/PlansPage'));
const UsersPage = lazy(() => import('./pages/superadmin/UsersPage'));
const PlatformCertificatesPage = lazy(() => import('./pages/superadmin/PlatformCertificatesPage'));
const PlatformAnalyticsPage = lazy(() => import('./pages/superadmin/PlatformAnalyticsPage'));
const SystemSettingsPage = lazy(() => import('./pages/superadmin/SystemSettingsPage'));
const EmailTemplatesPage = lazy(() => import('./pages/superadmin/EmailTemplatesPage'));
const SecurityPage = lazy(() => import('./pages/superadmin/SecurityPage'));
const MaintenancePage = lazy(() => import('./pages/superadmin/MaintenancePage'));
const AnnouncementsPage = lazy(() => import('./pages/superadmin/AnnouncementsPage'));

// Every page is loaded on demand (its own JS file), so a phone opening the home page
// doesn't download the dashboards, charts and PDF tools too.

// Dashboard
const DashboardLayout = lazy(() => import('./components/layout/DashboardLayout'));
const OverviewPage = lazy(() => import('./pages/dashboard/OverviewPage'));
const TeamPage = lazy(() => import('./pages/dashboard/TeamPage'));
const BillingPage = lazy(() => import('./pages/dashboard/BillingPage'));
const SettingsPage = lazy(() => import('./pages/dashboard/SettingsPage'));
const AnalyticsPage = lazy(() => import('./pages/dashboard/AnalyticsPage'));
const ActivityPage = lazy(() => import('./pages/dashboard/ActivityPage'));
const ContactPage = lazy(() => import('./pages/dashboard/ContactPage'));

// Events module
const EventsPage = lazy(() => import('./pages/dashboard/events/EventsPage'));
const NewEventPage = lazy(() => import('./pages/dashboard/events/NewEventPage'));
const EventDetailPage = lazy(() => import('./pages/dashboard/events/EventDetailPage'));
const EditEventPage = lazy(() => import('./pages/dashboard/events/EditEventPage'));
const RegistrationsPage = lazy(() => import('./pages/dashboard/registrations/RegistrationsPage'));
const NewRegistrationPage = lazy(() => import('./pages/dashboard/registrations/NewRegistrationPage'));
const ImportRegistrationsPage = lazy(() => import('./pages/dashboard/registrations/ImportRegistrationsPage'));
const EditRegistrationPage = lazy(() => import('./pages/dashboard/registrations/EditRegistrationPage'));
const SpeakersPage = lazy(() => import('./pages/dashboard/speakers/SpeakersPage'));
const NewSpeakerPage = lazy(() => import('./pages/dashboard/speakers/NewSpeakerPage'));
const EditSpeakerPage = lazy(() => import('./pages/dashboard/speakers/EditSpeakerPage'));
const ReorderSpeakersPage = lazy(() => import('./pages/dashboard/speakers/ReorderSpeakersPage'));
const SponsorsPage = lazy(() => import('./pages/dashboard/sponsors/SponsorsPage'));
const NewSponsorPage = lazy(() => import('./pages/dashboard/sponsors/NewSponsorPage'));
const EditSponsorPage = lazy(() => import('./pages/dashboard/sponsors/EditSponsorPage'));
const SchedulePage = lazy(() => import('./pages/dashboard/schedule/SchedulePage'));
const NewSessionPage = lazy(() => import('./pages/dashboard/schedule/NewSessionPage'));
const EditSessionPage = lazy(() => import('./pages/dashboard/schedule/EditSessionPage'));
const ReorderSessionsPage = lazy(() => import('./pages/dashboard/schedule/ReorderSessionsPage'));
const CertificatesPage = lazy(() => import('./pages/dashboard/certificates/CertificatesPage'));
const TicketsPage = lazy(() => import('./pages/dashboard/tickets/TicketsPage'));
const ScanPage = lazy(() => import('./pages/dashboard/tickets/ScanPage'));
const IdCardsPage = lazy(() => import('./pages/dashboard/idcards/IdCardsPage'));

/** Create/edit pages: viewers are read-only, so only admins and managers may open them. */
function writer(page: React.ReactNode) {
  return <ProtectedRoute roles={['admin', 'manager']}>{page}</ProtectedRoute>;
}

// Pages that use their own full-screen layout (no public Navbar/Footer)
const BARE_PREFIXES = [
  '/dashboard',
  '/e/',
  '/o/',
  '/superadmin',
  '/dev',
  '/login',
  '/register',
  '/forgot-password',
  '/reset-password',
  '/verify-email',
  '/accept-invite',
];

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [pathname]);
  return null;
}

function Layout({ children }: { children: React.ReactNode }) {
  const { pathname } = useLocation();
  if (BARE_PREFIXES.some((prefix) => pathname.startsWith(prefix))) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen antialiased bg-[#f3f0ff]">
      <Navbar />
      <main className="pt-16">
        <SiteBanner />
        {children}
      </main>
      <Footer />
    </div>
  );
}

export default function App() {
  return (
    <>
      <ScrollToTop />
      <Layout>
        <Suspense fallback={<PageLoader fullScreen />}>
        <Routes>
          {/* Public website */}
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/features" element={<Features />} />
          <Route path="/pricing" element={<Pricing />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/verify" element={<Verify />} />
          <Route path="/developers" element={<Developers />} />
          <Route path="/verify/:code" element={<Verify />} />

          {/* An organization's public pages: event list and event page with self-registration */}
          <Route path="/o/:slug" element={<OrgPage />} />
          <Route path="/e/:id" element={<EventPage />} />

          {/* Auth (logged-in users are sent to their dashboard) */}
          <Route path="/login" element={<GuestRoute><Login /></GuestRoute>} />
          <Route path="/register" element={<GuestRoute><Register /></GuestRoute>} />
          <Route path="/forgot-password" element={<GuestRoute><ForgotPassword /></GuestRoute>} />

          {/* Links from emails (work whether or not you're logged in) */}
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/verify-email" element={<VerifyEmail />} />
          <Route path="/accept-invite" element={<AcceptInvite />} />

          {/* Organization dashboard */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute roles={['admin', 'manager', 'viewer']}>
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<OverviewPage />} />

            {/* Insights */}
            <Route path="analytics" element={<AnalyticsPage />} />
            <Route path="activity" element={<ProtectedRoute roles={['admin']}><ActivityPage /></ProtectedRoute>} />

            {/* Organization */}
            <Route path="team" element={<TeamPage />} />
            <Route path="settings" element={<SettingsPage />} />
            <Route path="billing" element={<ProtectedRoute roles={['admin']}><BillingPage /></ProtectedRoute>} />
            <Route path="contact" element={<ContactPage />} />
            <Route path="api" element={<ProtectedRoute roles={['admin']}><ApiPage /></ProtectedRoute>} />

            {/* Events */}
            <Route path="events" element={<EventsPage />} />
            <Route path="events/new" element={writer(<NewEventPage />)} />
            <Route path="events/:id" element={<EventDetailPage />} />
            <Route path="events/:id/edit" element={writer(<EditEventPage />)} />

            <Route path="registrations" element={<RegistrationsPage />} />
            <Route path="registrations/new" element={writer(<NewRegistrationPage />)} />
            <Route path="registrations/import" element={writer(<ImportRegistrationsPage />)} />
            <Route path="registrations/:id/edit" element={writer(<EditRegistrationPage />)} />

            <Route path="speakers" element={<SpeakersPage />} />
            <Route path="speakers/new" element={writer(<NewSpeakerPage />)} />
            <Route path="speakers/reorder" element={writer(<ReorderSpeakersPage />)} />
            <Route path="speakers/:id/edit" element={writer(<EditSpeakerPage />)} />

            <Route path="sponsors" element={<SponsorsPage />} />
            <Route path="sponsors/new" element={writer(<NewSponsorPage />)} />
            <Route path="sponsors/:id/edit" element={writer(<EditSponsorPage />)} />

            <Route path="schedule" element={<SchedulePage />} />
            <Route path="schedule/new" element={writer(<NewSessionPage />)} />
            <Route path="schedule/reorder" element={writer(<ReorderSessionsPage />)} />
            <Route path="schedule/:id/edit" element={writer(<EditSessionPage />)} />

            {/* Credentials */}
            <Route path="certificates" element={<CertificatesPage />} />
            <Route path="tickets" element={<TicketsPage />} />
            <Route path="tickets/scan" element={writer(<ScanPage />)} />
            <Route path="idcards" element={<IdCardsPage />} />
          </Route>

          {/* Superadmin (platform owner) */}
          <Route
            path="/superadmin"
            element={
              <ProtectedRoute roles={['superAdmin']}>
                <SuperadminLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<SuperadminDashboardPage />} />
            <Route path="tenants" element={<TenantsPage />} />
            <Route path="tenants/:id" element={<TenantDetailPage />} />
            <Route path="revenue" element={<RevenuePage />} />
            <Route path="plans" element={<PlansPage />} />
            <Route path="users" element={<UsersPage />} />
            <Route path="certificates" element={<PlatformCertificatesPage />} />
            <Route path="analytics" element={<PlatformAnalyticsPage />} />
            <Route path="settings" element={<SystemSettingsPage />} />
            <Route path="emails" element={<EmailTemplatesPage />} />
            <Route path="security" element={<SecurityPage />} />
            <Route path="maintenance" element={<MaintenancePage />} />
            <Route path="announcements" element={<AnnouncementsPage />} />
          </Route>

          {/* Development only: preview of every shared component */}
          {import.meta.env.DEV && <Route path="/dev/components" element={<ComponentGallery />} />}

          <Route path="*" element={<NotFound />} />
        </Routes>
        </Suspense>
      </Layout>
      <Toaster position="top-right" richColors />
    </>
  );
}