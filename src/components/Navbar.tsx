import { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Menu, 
  X, 
  LayoutDashboard, 
  LogOut, 
  User as UserIcon, 
  ShieldCheck, 
  Sparkles, 
  ChevronDown, 
  Calendar, 
  ArrowRight
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import BrandLogo from '@/components/BrandLogo';

export default function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [eventsDropdownOpen, setEventsDropdownOpen] = useState(false);
  const [mobileEventsOpen, setMobileEventsOpen] = useState(true);
  const dropdownTimeoutRef = useRef<any>(null);
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
    setEventsDropdownOpen(false);
  }, [location.pathname]);

  const handleMouseEnter = () => {
    if (dropdownTimeoutRef.current) {
      clearTimeout(dropdownTimeoutRef.current);
    }
    setEventsDropdownOpen(true);
  };

  const handleMouseLeave = () => {
    dropdownTimeoutRef.current = setTimeout(() => {
      setEventsDropdownOpen(false);
    }, 150);
  };

  const isEventsActive = location.pathname === '/events-directory' || location.pathname === '/list-event';
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
        <div className="hidden lg:flex items-center gap-5 xl:gap-6">
          <Link
            to="/"
            className={`font-body text-sm font-semibold transition-all duration-200 ${
              location.pathname === '/' ? 'text-[#1d4ed8]' : 'text-[#475569] hover:text-[#1d4ed8]'
            }`}
          >
            Home
          </Link>

          {/* Events & Seminars Dropdown Menu */}
          <div 
            className="relative"
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
          >
            <button
              onClick={() => setEventsDropdownOpen(!eventsDropdownOpen)}
              className={`font-body text-sm font-semibold transition-all duration-200 flex items-center gap-1.5 py-2 cursor-pointer ${
                isEventsActive ? 'text-[#1d4ed8]' : 'text-[#475569] hover:text-[#1d4ed8]'
              }`}
              aria-expanded={eventsDropdownOpen}
            >
              <span>Events &amp; Seminars</span>
              <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${eventsDropdownOpen ? 'rotate-180 text-[#1d4ed8]' : 'text-[#94a3b8]'}`} />
            </button>

            {/* Submenu Dropdown Card */}
            {eventsDropdownOpen && (
              <div 
                className="absolute top-full left-0 mt-1 w-80 bg-white/98 backdrop-blur-xl border border-slate-200/90 rounded-2xl shadow-xl shadow-blue-900/10 p-2 z-50 animate-in fade-in slide-in-from-top-2 duration-200"
              >
                <div className="px-3 py-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  EventoraX Network
                </div>

                {/* Submenu Item 1: Browse Events */}
                <Link
                  to="/events-directory"
                  onClick={() => setEventsDropdownOpen(false)}
                  className={`flex items-start gap-3 p-3 rounded-xl transition-all duration-150 ${
                    location.pathname === '/events-directory'
                      ? 'bg-blue-50/80 text-[#1d4ed8]'
                      : 'hover:bg-slate-50 text-slate-700 hover:text-[#1d4ed8]'
                  }`}
                >
                  <div className="w-9 h-9 rounded-xl bg-blue-100/70 text-[#1d4ed8] flex items-center justify-center shrink-0 mt-0.5">
                    <Calendar className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-bold flex items-center justify-between">
                      <span>Explore Directory</span>
                      <ArrowRight className="w-3.5 h-3.5 opacity-40 group-hover:opacity-100" />
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">
                      Conferences, tech summits &amp; seminars
                    </p>
                  </div>
                </Link>

                <div className="border-t border-slate-100 my-1" />

                {/* Submenu Item 2: List Event (+ VIP Showcase) */}
                <Link
                  to="/list-event"
                  onClick={() => setEventsDropdownOpen(false)}
                  className={`flex items-start gap-3 p-3 rounded-xl transition-all duration-150 relative overflow-hidden ${
                    location.pathname === '/list-event'
                      ? 'bg-purple-50/90 text-purple-900'
                      : 'hover:bg-purple-50/60 text-slate-700 hover:text-purple-900'
                  }`}
                >
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-100 to-purple-100 text-purple-700 flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
                    <Sparkles className="w-4 h-4 text-amber-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-bold flex items-center gap-1.5">
                      <span>List Your Event</span>
                      <span className="text-[10px] uppercase font-black px-1.5 py-0.2 rounded-md bg-gradient-to-r from-amber-500 to-purple-600 text-white tracking-wider shadow-xs">
                        VIP
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">
                      Feature your event in the VIP Showcase
                    </p>
                  </div>
                </Link>
              </div>
            )}
          </div>

          <Link
            to="/features"
            className={`font-body text-sm font-semibold transition-all duration-200 ${
              location.pathname === '/features' ? 'text-[#1d4ed8]' : 'text-[#475569] hover:text-[#1d4ed8]'
            }`}
          >
            Features
          </Link>

          <Link
            to="/case-studies"
            className={`font-body text-sm font-semibold transition-all duration-200 ${
              location.pathname === '/case-studies' ? 'text-[#1d4ed8]' : 'text-[#475569] hover:text-[#1d4ed8]'
            }`}
          >
            Case Studies
          </Link>

          <Link
            to="/pricing"
            className={`font-body text-sm font-semibold transition-all duration-200 ${
              location.pathname === '/pricing' ? 'text-[#1d4ed8]' : 'text-[#475569] hover:text-[#1d4ed8]'
            }`}
          >
            Pricing
          </Link>

          <Link
            to="/verify"
            className={`font-body text-sm font-semibold transition-all duration-200 flex items-center gap-1.5 ${
              location.pathname === '/verify' ? 'text-[#1d4ed8]' : 'text-[#475569] hover:text-[#1d4ed8]'
            }`}
          >
            <ShieldCheck className="w-4 h-4 text-[#2563eb]" />
            Verify Credential
          </Link>

          <Link
            to="/about"
            className={`font-body text-sm font-semibold transition-all duration-200 ${
              location.pathname === '/about' ? 'text-[#1d4ed8]' : 'text-[#475569] hover:text-[#1d4ed8]'
            }`}
          >
            About
          </Link>

          <Link
            to="/contact"
            className={`font-body text-sm font-semibold transition-all duration-200 ${
              location.pathname === '/contact' ? 'text-[#1d4ed8]' : 'text-[#475569] hover:text-[#1d4ed8]'
            }`}
          >
            Contact
          </Link>

          {isAuthenticated && user ? (
            <div className="flex items-center gap-3 ml-2">
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
            <div className="flex items-center gap-2.5 ml-2">
              <Link
                to="/login"
                className="font-body text-sm font-semibold px-4 py-2 rounded-xl border-2 border-[#e2e8f0] text-[#475569] hover:border-[#1d4ed8] hover:text-[#1d4ed8] hover:bg-[#eff6ff] transition-all duration-200"
              >
                Login
              </Link>
              <Link
                to="/register"
                className="font-body text-sm font-semibold px-4 py-2 rounded-xl text-white bg-[#1d4ed8] shadow-lg shadow-[#1d4ed8]/25 hover:bg-[#1e40af] hover:shadow-xl hover:shadow-[#1d4ed8]/30 hover:-translate-y-0.5 transition-all duration-200"
              >
                Get Started
              </Link>
            </div>
          )}
        </div>

        {/* Mobile Hamburger */}
        <button
          className="lg:hidden text-[#0f172a] p-2 rounded-lg hover:bg-[#eff6ff] transition-colors duration-200"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X size={24} className="text-[#1d4ed8]" /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="lg:hidden absolute top-16 left-0 w-full bg-white/98 backdrop-blur-xl shadow-xl shadow-[#1d4ed8]/5 border-t border-[#e2e8f0] py-5 px-4 max-h-[85vh] overflow-y-auto">
          <div className="flex flex-col gap-1">
            <Link
              to="/"
              className={`font-body text-sm font-semibold px-3 py-2.5 rounded-xl transition-all duration-200 ${
                location.pathname === '/' ? 'text-[#1d4ed8] bg-blue-50/70' : 'text-[#475569] hover:bg-slate-50'
              }`}
            >
              Home
            </Link>

            {/* Mobile Submenu for Events & Seminars */}
            <div className="rounded-2xl border border-slate-200/80 bg-slate-50/50 p-2 my-1">
              <button
                onClick={() => setMobileEventsOpen(!mobileEventsOpen)}
                className="w-full flex items-center justify-between px-2 py-1.5 text-xs font-bold uppercase tracking-wider text-slate-500"
              >
                <span>Events &amp; Seminars</span>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${mobileEventsOpen ? 'rotate-180' : ''}`} />
              </button>
              {mobileEventsOpen && (
                <div className="flex flex-col gap-1.5 mt-1 pt-1 border-t border-slate-200/60">
                  <Link
                    to="/events-directory"
                    className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-slate-700 hover:text-[#1d4ed8] hover:bg-white transition-all"
                  >
                    <Calendar className="w-4 h-4 text-[#1d4ed8]" />
                    <span>Browse All Events &amp; Seminars</span>
                  </Link>
                  <Link
                    to="/list-event"
                    className="flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold text-purple-800 bg-purple-50/80 hover:bg-purple-100 transition-all border border-purple-200/80"
                  >
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-amber-500" />
                      <span>List Event (+ VIP Showcase)</span>
                    </div>
                    <span className="text-[10px] font-black uppercase px-1.5 py-0.2 rounded-md bg-purple-600 text-white">
                      VIP
                    </span>
                  </Link>
                </div>
              )}
            </div>

            <Link
              to="/features"
              className={`font-body text-sm font-semibold px-3 py-2.5 rounded-xl transition-all duration-200 ${
                location.pathname === '/features' ? 'text-[#1d4ed8] bg-blue-50/70' : 'text-[#475569] hover:bg-slate-50'
              }`}
            >
              Features
            </Link>

            <Link
              to="/case-studies"
              className={`font-body text-sm font-semibold px-3 py-2.5 rounded-xl transition-all duration-200 ${
                location.pathname === '/case-studies' ? 'text-[#1d4ed8] bg-blue-50/70' : 'text-[#475569] hover:bg-slate-50'
              }`}
            >
              Case Studies
            </Link>

            <Link
              to="/pricing"
              className={`font-body text-sm font-semibold px-3 py-2.5 rounded-xl transition-all duration-200 ${
                location.pathname === '/pricing' ? 'text-[#1d4ed8] bg-blue-50/70' : 'text-[#475569] hover:bg-slate-50'
              }`}
            >
              Pricing
            </Link>

            <Link
              to="/verify"
              className={`font-body text-sm font-semibold px-3 py-2.5 rounded-xl transition-all duration-200 flex items-center gap-2 ${
                location.pathname === '/verify' ? 'text-[#1d4ed8] bg-blue-50/70' : 'text-[#475569] hover:bg-slate-50'
              }`}
            >
              <ShieldCheck className="w-4 h-4 text-[#2563eb]" />
              Verify Credential
            </Link>

            <Link
              to="/about"
              className={`font-body text-sm font-semibold px-3 py-2.5 rounded-xl transition-all duration-200 ${
                location.pathname === '/about' ? 'text-[#1d4ed8] bg-blue-50/70' : 'text-[#475569] hover:bg-slate-50'
              }`}
            >
              About
            </Link>

            <Link
              to="/contact"
              className={`font-body text-sm font-semibold px-3 py-2.5 rounded-xl transition-all duration-200 ${
                location.pathname === '/contact' ? 'text-[#1d4ed8] bg-blue-50/70' : 'text-[#475569] hover:bg-slate-50'
              }`}
            >
              Contact
            </Link>

            <div className="flex flex-col gap-2 pt-3 border-t border-[#e2e8f0] mt-2">
              {isAuthenticated && user ? (
                <>
                  <Link
                    to="/dashboard"
                    className="w-full text-center flex items-center justify-center gap-2 font-body text-sm font-semibold px-4 py-2.5 rounded-xl text-white bg-[#1d4ed8] shadow-md transition-all duration-200"
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
                    className="flex-1 text-center font-body text-sm font-semibold px-4 py-2.5 rounded-xl border-2 border-[#e2e8f0] text-[#475569] hover:border-[#1d4ed8] hover:text-[#1d4ed8] hover:bg-[#eff6ff] transition-all duration-200"
                  >
                    Login
                  </Link>
                  <Link
                    to="/register"
                    className="flex-1 text-center font-body text-sm font-semibold px-4 py-2.5 rounded-xl text-white bg-[#1d4ed8] shadow-md shadow-[#1d4ed8]/20 hover:bg-[#1e40af] transition-all duration-200"
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