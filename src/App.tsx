import { Routes, Route, useLocation, Navigate } from 'react-router';
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
import NotFound from './pages/NotFound';

// Dashboard imports
import DashboardLayout from './pages/Dashboard/DashboardLayout';
import DashboardHome from './pages/Dashboard/DashboardHome';
import Statistics from './pages/Dashboard/Statistics';
import Charts from './pages/Dashboard/Charts';
import Team from './pages/Dashboard/Team';
import Billing from './pages/Dashboard/Billing';
import Settings from './pages/Dashboard/Settings';
import Activity from './pages/Dashboard/activity';
import { Toaster } from './components/ui/sonner';

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [pathname]);
  return null;
}

// Auth check
const isAuthenticated = () => {
  return localStorage.getItem("token") !== null;
}

// Protected Route wrapper
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  return isAuthenticated() ? <>{children}</> : <Navigate to="/login" replace />;
}

function Layout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const isAuthPage = location.pathname === '/login' || location.pathname === '/register';
  const isDashboard = location.pathname.startsWith('/dashboard');

  // Dashboard has its own layout (Sidebar), so no Navbar/Footer
  if (isDashboard) {
    return <>{children}</>;
  }

  return (
    <div className={`min-h-screen antialiased ${isAuthPage ? 'bg-white' : 'bg-[#f3f0ff]'}`}>
      {!isAuthPage && <Navbar />}
      <main className={isAuthPage ? '' : 'pt-16'}>
        {children}
      </main>
      {!isAuthPage && <Footer />}
    </div>
  );
}

export default function App() {
  return (
    <>
      <ScrollToTop />
      <Layout>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/features" element={<Features />} />
          <Route path="/pricing" element={<Pricing />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/privacy" element={<Privacy />} />

          {/* Protected Dashboard Routes */}
       
          <Route path="/dashboard" element={<DashboardLayout />}>
  <Route index element={<DashboardHome />} />
  <Route path="statistics" element={<Statistics />} />
  <Route path="charts" element={<Charts />} />
  <Route path="team" element={<Team />} />
  <Route path="billing" element={<Billing />} />
  <Route path="settings" element={<Settings />} />
  <Route path="activity" element={<Activity />} />
</Route>

          {/* 404 */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Layout>
      <Toaster position="top-right" richColors />
    </>
  );
}