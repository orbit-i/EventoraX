import { Routes, Route, useLocation } from 'react-router';
import { useEffect } from 'react';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import { Toaster } from './components/ui/sonner';
import { ProtectedRoute, GuestRoute } from './components/auth/RouteGuards';
import Home from './pages/Home';
import About from './pages/About';
import Features from './pages/Features';
import Pricing from './pages/Pricing';
import Contact from './pages/Contact';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import VerifyEmail from './pages/VerifyEmail';
import AcceptInvite from './pages/AcceptInvite';
import Terms from './pages/Terms';
import Privacy from './pages/Privacy';
import Verify from './pages/Verify';
import NotFound from './pages/NotFound';
import ComponentGallery from './pages/dev/ComponentGallery';
import SuperadminHome from './pages/superadmin/SuperadminHome';

// Dashboard imports
import DashboardLayout from './components/layout/DashboardLayout';
import OverviewPage from './pages/dashboard/OverviewPage';
import TeamPage from './pages/dashboard/TeamPage';
import BillingPage from './pages/dashboard/BillingPage';
import SettingsPage from './pages/dashboard/SettingsPage';
import AnalyticsPage from './pages/dashboard/AnalyticsPage';
import ActivityPage from './pages/dashboard/ActivityPage';
import ContactPage from './pages/dashboard/ContactPage';

// Events module
import EventsPage from './pages/dashboard/events/EventsPage';
import NewEventPage from './pages/dashboard/events/NewEventPage';
import EventDetailPage from './pages/dashboard/events/EventDetailPage';
import EditEventPage from './pages/dashboard/events/EditEventPage';
import RegistrationsPage from './pages/dashboard/registrations/RegistrationsPage';
import NewRegistrationPage from './pages/dashboard/registrations/NewRegistrationPage';
import ImportRegistrationsPage from './pages/dashboard/registrations/ImportRegistrationsPage';
import EditRegistrationPage from './pages/dashboard/registrations/EditRegistrationPage';
import SpeakersPage from './pages/dashboard/speakers/SpeakersPage';
import NewSpeakerPage from './pages/dashboard/speakers/NewSpeakerPage';
import EditSpeakerPage from './pages/dashboard/speakers/EditSpeakerPage';
import ReorderSpeakersPage from './pages/dashboard/speakers/ReorderSpeakersPage';
import SponsorsPage from './pages/dashboard/sponsors/SponsorsPage';
import NewSponsorPage from './pages/dashboard/sponsors/NewSponsorPage';
import EditSponsorPage from './pages/dashboard/sponsors/EditSponsorPage';
import SchedulePage from './pages/dashboard/schedule/SchedulePage';
import NewSessionPage from './pages/dashboard/schedule/NewSessionPage';
import EditSessionPage from './pages/dashboard/schedule/EditSessionPage';
import ReorderSessionsPage from './pages/dashboard/schedule/ReorderSessionsPage';
import CertificatesPage from './pages/dashboard/certificates/CertificatesPage';
import TicketsPage from './pages/dashboard/tickets/TicketsPage';
import ScanPage from './pages/dashboard/tickets/ScanPage';

/** Create/edit pages: viewers are read-only, so only admins and managers may open them. */
function writer(page: React.ReactNode) {
  return <ProtectedRoute roles={['admin', 'manager']}>{page}</ProtectedRoute>;
}

// Pages that use their own full-screen layout (no public Navbar/Footer)
const BARE_PREFIXES = [
  '/dashboard',
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
      <main className="pt-16">{children}</main>
      <Footer />
    </div>
  );
}

export default function App() {
  return (
    <>
      <ScrollToTop />
      <Layout>
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
          <Route path="/verify/:code" element={<Verify />} />

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
          </Route>

          {/* Superadmin (built in Phase 10) */}
          <Route
            path="/superadmin"
            element={
              <ProtectedRoute roles={['superAdmin']}>
                <SuperadminHome />
              </ProtectedRoute>
            }
          />

          {/* Development only: preview of every shared component */}
          {import.meta.env.DEV && <Route path="/dev/components" element={<ComponentGallery />} />}

          <Route path="*" element={<NotFound />} />
        </Routes>
      </Layout>
      <Toaster position="top-right" richColors />
    </>
  );
}