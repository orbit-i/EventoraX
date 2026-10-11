import { Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';
import About from './pages/About';
import Features from './pages/Features';
import Pricing from './pages/Pricing';
import Contact from './pages/Contact';
import Login from './pages/Login';
import Register from './pages/Register';
import Terms from './pages/Terms';
import Privacy from './pages/Privacy';
import Cookies from './pages/Cookies';
import ServiceUsage from './pages/ServiceUsage';
import NotFound from './pages/NotFound';
import PublicTenantPortal from './pages/PublicTenantPortal';
import PublicVerifyPage from './pages/PublicVerifyPage';
import PublicEventPage from './pages/PublicEventPage';

// Dashboard imports
import DashboardLayout from './pages/Dashboard/DashboardLayout';
import DashboardHome from './pages/Dashboard/DashboardHome';
import Events from './pages/Dashboard/Events';
import IDCardGenerator from './pages/Dashboard/IDCardGenerator';
import Certificates from './pages/Dashboard/Certificates';
import Maintenance from './pages/Maintenance';
import DesignStudio from './pages/Dashboard/DesignStudio';
import CertificateEditor from './pages/Dashboard/CertificateEditor';
import IDCardEditor from './pages/Dashboard/IDCardEditor';
import Statistics from './pages/Dashboard/Statistics';
import Charts from './pages/Dashboard/Charts';
import Team from './pages/Dashboard/Team';
import Billing from './pages/Dashboard/Billing';
import Settings from './pages/Dashboard/Settings';
import Activity from './pages/Dashboard/activity';
import PlatformAdmin from './pages/Dashboard/PlatformAdmin';

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
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}

function Layout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const isAuthPage = location.pathname === '/login' || location.pathname === '/register';
  const isDashboard = location.pathname.startsWith('/dashboard') || location.pathname.startsWith('/superadmin');
  const isTenantPortal = location.pathname.startsWith('/t/') || location.pathname.startsWith('/c/');
  const isVerifyPage = location.pathname.startsWith('/verify');
  const isPublicEvent = location.pathname.startsWith('/e/') || location.pathname.startsWith('/events/');

  // Dashboard, Tenant portal, Event Landing Page, and Verification portal have their own custom headers/layouts
  if (isDashboard || isTenantPortal || isVerifyPage || isPublicEvent) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen antialiased bg-[#f8fafc]">
      {!isAuthPage && <Navbar />}
      <main className={isAuthPage ? '' : 'pt-16'}>
        {children}
      </main>
      {!isAuthPage && <Footer />}
    </div>
  );
}

function AppRoutes() {
  return (
    <>
      <ScrollToTop />
      <Layout>
        <Routes>
          {/* Public Main Site Routes */}
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/features" element={<Features />} />
          <Route path="/pricing" element={<Pricing />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/cookies" element={<Cookies />} />
          <Route path="/service-usage" element={<ServiceUsage />} />
          <Route path="/maintenance" element={<Maintenance />} />

          {/* Public Tamper-Evident Credential Verification (PRD 3.7 & 8) */}
          <Route path="/verify" element={<PublicVerifyPage />} />
          <Route path="/verify/:certNumber" element={<PublicVerifyPage />} />

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

          {/* Protected Multi-Tenant Dashboard Routes */}
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
              element={
                <SuperAdminRoute>
                  <PlatformAdmin />
                </SuperAdminRoute>
              } 
            />
          </Route>

          {/* Dedicated SuperAdmin Platform Authority Console */}
          <Route 
            path="/superadmin" 
            element={
              <SuperAdminRoute>
                <DashboardLayout />
              </SuperAdminRoute>
            }
          >
            <Route index element={<PlatformAdmin />} />
          </Route>

          {/* 404 */}
          <Route path="*" element={<NotFound />} />
        </Routes>
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