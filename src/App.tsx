import { Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { useEffect, lazy, Suspense } from 'react';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ScrollProgressBar from './components/ScrollProgressBar';
import BackToTop from './components/BackToTop';
import FloatingContactButton from './components/FloatingContactButton';
import { Toaster } from './components/ui/sonner';
import { usePageSEO } from './hooks/usePageSEO';
import { initUtmTracking } from './lib/utm';

// Eagerly loaded for instantaneous first paint of Home
import Home from './pages/Home';

// Public Pages (Lazy Loaded on demand)
const About = lazy(() => import('./pages/About'));
const Features = lazy(() => import('./pages/Features'));
const Pricing = lazy(() => import('./pages/Pricing'));
const Contact = lazy(() => import('./pages/Contact'));
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const Terms = lazy(() => import('./pages/Terms'));
const Privacy = lazy(() => import('./pages/Privacy'));
const Cookies = lazy(() => import('./pages/Cookies'));
const ServiceUsage = lazy(() => import('./pages/ServiceUsage'));
const NotFound = lazy(() => import('./pages/NotFound'));
const Forbidden = lazy(() => import('./pages/Forbidden'));
const PublicTenantPortal = lazy(() => import('./pages/PublicTenantPortal'));
const PublicVerifyPage = lazy(() => import('./pages/PublicVerifyPage'));
const PublicEventPage = lazy(() => import('./pages/PublicEventPage'));
const CaseStudies = lazy(() => import('./pages/CaseStudies'));
const EventsDirectory = lazy(() => import('./pages/EventsDirectory'));
const ListYourEvent = lazy(() => import('./pages/ListYourEvent'));
const Maintenance = lazy(() => import('./pages/Maintenance'));

// Dashboard & Heavy Studio Pages (Lazy Loaded only when accessed)
const DashboardLayout = lazy(() => import('./pages/Dashboard/DashboardLayout'));
const DashboardHome = lazy(() => import('./pages/Dashboard/DashboardHome'));
const Events = lazy(() => import('./pages/Dashboard/Events'));
const IDCardGenerator = lazy(() => import('./pages/Dashboard/IDCardGenerator'));
const Certificates = lazy(() => import('./pages/Dashboard/Certificates'));
const DesignStudio = lazy(() => import('./pages/Dashboard/DesignStudio'));
const CertificateEditor = lazy(() => import('./pages/Dashboard/CertificateEditor'));
const IDCardEditor = lazy(() => import('./pages/Dashboard/IDCardEditor'));
const Statistics = lazy(() => import('./pages/Dashboard/Statistics'));
const Charts = lazy(() => import('./pages/Dashboard/Charts'));
const Team = lazy(() => import('./pages/Dashboard/Team'));
const Billing = lazy(() => import('./pages/Dashboard/Billing'));
const Settings = lazy(() => import('./pages/Dashboard/Settings'));
const Activity = lazy(() => import('./pages/Dashboard/activity'));
const PlatformAdmin = lazy(() => import('./pages/Dashboard/PlatformAdmin'));
const OrbitMasterGatewayLogin = lazy(() => import('./pages/OrbitMasterGatewayLogin'));

import { AuthProvider, useAuth } from './context/AuthContext';
import { SidebarProvider } from './context/SidebarContext';
import ErrorBoundary from './components/ErrorBoundary';

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [pathname]);
  return null;
}

// Minimal, zero-overhead loading indicator for route transitions
function PageFallback() {
  return (
    <div className="min-h-[50vh] flex flex-col items-center justify-center gap-3">
      <div className="w-8 h-8 border-3 border-[#1d4ed8] border-t-transparent rounded-full animate-spin" />
      <span className="text-xs text-slate-400 font-medium tracking-wide">Loading Eventrye...</span>
    </div>
  );
}

// Protected Route wrapper
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { token, isLoading } = useAuth();
  const hasToken = !!token || !!localStorage.getItem('token');

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#faf8ff]">
        <div className="w-8 h-8 border-3 border-[#1d4ed8] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return hasToken ? <>{children}</> : <Navigate to="/login" replace />;
}

// Strict SuperAdmin Route wrapper (Guarantees client orgs CAN NEVER access superadmin panel)
function SuperAdminRoute({ children }: { children: React.ReactNode }) {
  const { isSuperAdmin, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#faf8ff]">
        <div className="w-8 h-8 border-3 border-[#1d4ed8] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isSuperAdmin) {
    return <Navigate to="/orbit-i-master-gateway/login" replace />;
  }

  return <>{children}</>;
}

function Layout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const isAuthPage = location.pathname === '/login' || location.pathname === '/register';
  const isDashboard = location.pathname.startsWith('/dashboard') || location.pathname.startsWith('/orbit-i-master-gateway/console');
  const isMasterGateway = location.pathname.startsWith('/orbit-i-master-gateway');
  const isTenantPortal = location.pathname.startsWith('/t/') || location.pathname.startsWith('/c/');
  const isVerifyPage = location.pathname.startsWith('/verify');
  const isPublicEvent = location.pathname.startsWith('/e/') || location.pathname.startsWith('/events/');
  const isStandalonePage = location.pathname === '/maintenance' || location.pathname === '/404' || location.pathname === '/403';

  // Dashboard, Tenant portal, Event Landing Page, Verification portal, Secret Master Gateway, and Status/Error pages have their own standalone layouts
  if (isDashboard || isMasterGateway || isTenantPortal || isVerifyPage || isPublicEvent || isStandalonePage) {
    return (
      <>
        <ScrollProgressBar />
        {children}
        <Toaster position="top-right" richColors />
      </>
    );
  }

  return (
    <div className="min-h-screen antialiased bg-[#f8fafc] flex flex-col justify-between overflow-x-hidden">
      <ScrollProgressBar />
      {!isAuthPage && <Navbar />}
      <main id="main-content" className="w-full flex-1">
        {children}
      </main>
      {!isAuthPage && <Footer />}
      {!isAuthPage && <BackToTop />}
      {!isAuthPage && <FloatingContactButton />}
      <Toaster position="top-right" richColors />
    </div>
  );
}

function AppRoutes() {
  // Dynamic SEO metadata title & description updates
  usePageSEO();

  // Marketing campaign UTM parameters tracking
  useEffect(() => {
    initUtmTracking();
  }, []);

  return (
    <>
      <ScrollToTop />
      <Layout>
        <Suspense fallback={<PageFallback />}>
          <Routes>
            {/* Public Main Site Routes */}
            <Route path="/" element={<Home />} />
            <Route path="/about" element={<About />} />
            <Route path="/features" element={<Features />} />
            <Route path="/pricing" element={<Pricing />} />
            <Route path="/case-studies" element={<CaseStudies />} />
            <Route path="/past-events" element={<CaseStudies />} />
            <Route path="/events-directory" element={<EventsDirectory />} />
            <Route path="/directory" element={<EventsDirectory />} />
            <Route path="/list-event" element={<ListYourEvent />} />
            <Route path="/host-event" element={<ListYourEvent />} />
            <Route path="/submit-event" element={<ListYourEvent />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/terms" element={<Terms />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/cookies" element={<Cookies />} />
            <Route path="/service-usage" element={<ServiceUsage />} />
            <Route path="/maintenance" element={<Maintenance />} />

            {/* Public Tamper-Evident Credential & Invoice Verification (PRD 3.7 & 8) */}
            <Route path="/verify" element={<PublicVerifyPage />} />
            <Route path="/verify/:certNumber" element={<PublicVerifyPage />} />
            <Route path="/verify-invoice" element={<PublicVerifyPage />} />

            {/* Dedicated Public Event Detail & Registration Page */}
            <Route path="/e/:slug" element={<PublicEventPage />} />
            <Route path="/events/:slug" element={<PublicEventPage />} />

            {/* Public Branded Tenant Portal */}
            <Route path="/t/:slug" element={<PublicTenantPortal />} />
            <Route path="/c/:slug" element={<PublicTenantPortal />} />

            {/* Fullscreen Certificate, ID Card & Canva Design Studio */}
            <Route 
              path="/dashboard/design-studio" 
              element={
                <ProtectedRoute>
                  <DesignStudio />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/dashboard/certificates/editor" 
              element={
                <ProtectedRoute>
                  <CertificateEditor />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/dashboard/certificates/editor/:id" 
              element={
                <ProtectedRoute>
                  <CertificateEditor />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/dashboard/id-cards/editor" 
              element={
                <ProtectedRoute>
                  <IDCardEditor />
                </ProtectedRoute>
              } 
            />

            {/* Protected Multi-Tenant Organization Dashboard Routes */}
            <Route 
              path="/dashboard" 
              element={
                <ProtectedRoute>
                  <DashboardLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<DashboardHome />} />
              <Route path="events" element={<Events />} />
              <Route path="id-cards" element={<IDCardGenerator />} />
              <Route path="certificates" element={<Certificates />} />
              <Route path="statistics" element={<Statistics />} />
              <Route path="charts" element={<Charts />} />
              <Route path="team" element={<Team />} />
              <Route path="billing" element={<Billing />} />
              <Route path="settings" element={<Settings />} />
              <Route path="activity" element={<Activity />} />
              <Route 
                path="platform" 
                element={<Navigate to="/orbit-i-master-gateway/console" replace />} 
              />
            </Route>

            {/* SuperAdmin Master Access Aliases */}
            <Route path="/superadmin" element={<Navigate to="/orbit-i-master-gateway/login" replace />} />
            <Route path="/platform-admin" element={<Navigate to="/orbit-i-master-gateway/login" replace />} />
            <Route path="/admin" element={<Navigate to="/orbit-i-master-gateway/login" replace />} />

            {/* Secret ORBIT-I Platform Master Gateway (Isolated from client org login) */}
            <Route path="/orbit-i-master-gateway/login" element={<OrbitMasterGatewayLogin />} />
            <Route 
              path="/orbit-i-master-gateway/console" 
              element={
                <SuperAdminRoute>
                  <DashboardLayout />
                </SuperAdminRoute>
              }
            >
              <Route index element={<PlatformAdmin />} />
            </Route>

            {/* Error & Maintenance Routes */}
            <Route path="/403" element={<Forbidden />} />
            <Route path="/404" element={<NotFound />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </Layout>
    </>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <SidebarProvider>
          <AppRoutes />
        </SidebarProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}