import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, LayoutDashboard, LogOut, User as UserIcon, ShieldCheck } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import BrandLogo from '@/components/BrandLogo';

const navLinks = [
  { label: 'Home', href: '/' },
  { label: 'Features', href: '/features' },
  { label: 'Verify Credential', href: '/verify' },
  { label: 'Pricing', href: '/pricing' },
  { label: 'About', href: '/about' },
  { label: 'Contact', href: '/contact' },
];

export default function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  const isHome = location.pathname === '/';

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > window.innerHeight * 0.8);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  const showBg = scrolled || !isHome;

  return (
    <nav
      className={`fixed top-0 left-0 w-full z-50 transition-all duration-300 ${
        showBg
          ? 'bg-white/95 backdrop-blur-xl shadow-sm shadow-[#1d4ed8]/5 border-b border-[#e2e8f0]'
          : 'bg-transparent'
      }`}
      style={{ height: 68 }}
    >
      <div className="content-max h-full flex items-center justify-between">
        <Link to="/" className="flex items-center">
          <BrandLogo variant="compact" size="md" showTagline={true} />
        </Link>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-7">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              to={link.href}
              className="font-body text-sm font-semibold text-[#475569] hover:text-[#1d4ed8] transition-colors duration-200 flex items-center gap-1.5"
            >
              {link.label === 'Verify Credential' && <ShieldCheck className="w-4 h-4 text-[#2563eb]" />}
              {link.label}
            </Link>
          ))}

          {isAuthenticated && user ? (
            <div className="flex items-center gap-3">
              <Link
                to="/dashboard"
                className="flex items-center gap-2 font-body text-sm font-semibold px-4 py-2 rounded-xl text-white bg-[#1d4ed8] shadow-md shadow-[#1d4ed8]/25 hover:bg-[#1e40af] transition-all duration-200"
              >
                <LayoutDashboard className="w-4 h-4" />
                Dashboard
              </Link>
              <div className="flex items-center gap-2 pl-2 border-l border-[#e2e8f0]">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#1d4ed8] to-[#3b82f6] text-white flex items-center justify-center font-bold text-xs shadow-sm">
                  {user.fullName ? user.fullName[0].toUpperCase() : <UserIcon className="w-4 h-4" />}
                </div>
                <button
                  onClick={logout}
                  title="Logout"
                  className="p-1.5 rounded-lg text-[#64748b] hover:text-red-600 hover:bg-red-50 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <Link
                to="/login"
                className="font-body text-sm font-semibold px-5 py-2 rounded-xl border-2 border-[#e2e8f0] text-[#475569] hover:border-[#1d4ed8] hover:text-[#1d4ed8] hover:bg-[#eff6ff] transition-all duration-200"
              >
                Login
              </Link>
              <Link
                to="/register"
                className="font-body text-sm font-semibold px-5 py-2 rounded-xl text-white bg-[#1d4ed8] shadow-lg shadow-[#1d4ed8]/25 hover:bg-[#1e40af] hover:shadow-xl hover:shadow-[#1d4ed8]/30 hover:-translate-y-0.5 transition-all duration-200"
              >
                Get Started
              </Link>
            </div>
          )}
        </div>

        {/* Mobile Hamburger */}
        <button
          className="md:hidden text-[#0f172a] p-2 rounded-lg hover:bg-[#eff6ff] transition-colors duration-200"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X size={24} className="text-[#1d4ed8]" /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="md:hidden absolute top-16 left-0 w-full bg-white/95 backdrop-blur-xl shadow-xl shadow-[#7c3aed]/5 border-t border-[#e9e4ff] py-5">
          <div className="content-max flex flex-col gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                to={link.href}
                className="font-body text-base font-medium text-[#475569] hover:text-[#7c3aed] hover:bg-[#f5f3ff] px-3 py-2.5 rounded-xl transition-all duration-200"
              >
                {link.label}
              </Link>
            ))}
            <div className="flex flex-col gap-2 pt-3 border-t border-[#e9e4ff] mt-2">
              {isAuthenticated && user ? (
                <>
                  <Link
                    to="/dashboard"
                    className="w-full text-center flex items-center justify-center gap-2 font-body text-sm font-semibold px-4 py-2.5 rounded-xl text-white bg-[#7c3aed] shadow-md transition-all duration-200"
                  >
                    <LayoutDashboard className="w-4 h-4" />
                    Go to Dashboard
                  </Link>
                  <button
                    onClick={logout}
                    className="w-full text-center font-body text-sm font-semibold px-4 py-2.5 rounded-xl border border-red-200 text-red-600 hover:bg-red-50 transition-colors"
                  >
                    Logout ({user.email})
                  </button>
                </>
              ) : (
                <div className="flex gap-3">
                  <Link
                    to="/login"
                    className="flex-1 text-center font-body text-sm font-semibold px-4 py-2.5 rounded-xl border-2 border-[#e9e4ff] text-[#475569] hover:border-[#7c3aed] hover:text-[#7c3aed] hover:bg-[#f5f3ff] transition-all duration-200"
                  >
                    Login
                  </Link>
                  <Link
                    to="/register"
                    className="flex-1 text-center font-body text-sm font-semibold px-4 py-2.5 rounded-xl text-white bg-[#7c3aed] shadow-md shadow-[#7c3aed]/20 hover:bg-[#6d28d9] transition-all duration-200"
                  >
                    Get Started
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}