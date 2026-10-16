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
  ArrowRight,
  MapPin,
  Search,
  Phone,
  Mail
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import BrandLogo from '@/components/BrandLogo';
import QuickSearchModal from '@/components/QuickSearchModal';

export default function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [eventsDropdownOpen, setEventsDropdownOpen] = useState(false);
  const [mobileEventsOpen, setMobileEventsOpen] = useState(true);
  const [searchOpen, setSearchOpen] = useState(false);
  
  const dropdownRef = useRef<HTMLDivElement>(null);
  const dropdownTimeoutRef = useRef<any>(null);
  const location = useLocation();

  // Close menus on page route changes
  useEffect(() => {
    setMobileOpen(false);
    setEventsDropdownOpen(false);
  }, [location.pathname]);

  // Click outside listener for dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setEventsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Keyboard accessibility
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setEventsDropdownOpen(false);
        setMobileOpen(false);
      }
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

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

  const navLinks = [
    { label: 'Home', href: '/' },
    { label: 'Features', href: '/features' },
    { label: 'Case Studies', href: '/case-studies' },
    { label: 'Pricing', href: '/pricing' },
    { label: 'About', href: '/about' },
    { label: 'Contact', href: '/contact' },
  ];

  return (
    <>
      {/* Accessible Skip To Main Content Link */}
      <a 
        href="#main-content" 
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 z-[100] bg-blue-600 text-white px-4 py-2 rounded-xl font-bold shadow-lg shadow-blue-600/30 text-xs transition-all"
      >
        Skip to main content
      </a>

      {/* Sticky White / Glassmorphic Header */}
      <header
        className="sticky top-0 w-full z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.03)] transition-all duration-200"
        style={{ height: 68 }}
      >
        <div className="content-max h-full flex items-center justify-between">
          {/* Brand Logo - Fully Clickable */}
          <Link 
            to="/" 
            className="flex items-center gap-2 shrink-0 group py-1"
            title="EventoraX - Plan • Manage • Experience"
          >
            <BrandLogo variant="compact" size="md" showTagline={false} />
          </Link>

          {/* Desktop Nav Links */}
          <nav className="hidden lg:flex items-center gap-0.5 xl:gap-1.5">
            {/* Home Link */}
            <Link
              to="/"
              className={`px-2.5 xl:px-3 py-1.5 rounded-lg text-[13px] xl:text-[14px] font-medium whitespace-nowrap transition-all duration-150 ${
                location.pathname === '/'
                  ? 'text-blue-600 bg-blue-50/80 font-semibold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
              }`}
            >
              Home
            </Link>

            {/* Events & Seminars Dropdown */}
            <div 
              ref={dropdownRef}
              className="relative"
              onMouseEnter={handleMouseEnter}
              onMouseLeave={handleMouseLeave}
            >
              <button
                type="button"
                onClick={() => setEventsDropdownOpen(!eventsDropdownOpen)}
                className={`flex items-center gap-1 px-2.5 xl:px-3 py-1.5 rounded-lg text-[13px] xl:text-[14px] font-medium whitespace-nowrap transition-all duration-150 cursor-pointer ${
                  isEventsActive
                    ? 'text-blue-600 bg-blue-50/80 font-semibold shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
                }`}
                aria-expanded={eventsDropdownOpen}
                aria-haspopup="true"
              >
                <span>Events</span>
                <ChevronDown 
                  className={`w-3.5 h-3.5 transition-transform duration-200 ${
                    eventsDropdownOpen ? 'rotate-180 text-blue-600' : 'text-slate-400 group-hover:text-slate-600'
                  }`} 
                />
              </button>

              {/* Dropdown Card */}
              {eventsDropdownOpen && (
                <div 
                  className="absolute top-full left-0 mt-2 w-80 bg-white border border-slate-200/90 rounded-2xl shadow-xl shadow-slate-900/10 p-2.5 z-50 animate-in fade-in zoom-in-95 duration-150"
                >
                  <div className="px-3 py-1 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    EventoraX Directory
                  </div>

                  {/* Submenu Item 1: Browse Events Directory */}
                  <Link
                    to="/events-directory"
                    onClick={() => setEventsDropdownOpen(false)}
                    className={`flex items-start gap-3 p-3 rounded-xl transition-all duration-150 group ${
                      location.pathname === '/events-directory'
                        ? 'bg-blue-50/90 text-blue-700'
                        : 'hover:bg-slate-50 text-slate-700 hover:text-blue-600'
                    }`}
                  >
                    <div className="w-9 h-9 rounded-xl bg-blue-100/70 text-blue-600 flex items-center justify-center shrink-0 mt-0.5 group-hover:scale-105 transition-transform">
                      <Calendar className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-bold flex items-center justify-between">
                        <span>Browse Events</span>
                        <ArrowRight className="w-3.5 h-3.5 opacity-40 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">
                        Upcoming summits, seminars &amp; expos
                      </p>
                    </div>
                  </Link>

                  <div className="border-t border-slate-100 my-1" />

                  {/* Submenu Item 2: List Event (+ VIP Showcase) */}
                  <Link
                    to="/list-event"
                    onClick={() => setEventsDropdownOpen(false)}
                    className={`flex items-start gap-3 p-3 rounded-xl transition-all duration-150 group ${
                      location.pathname === '/list-event'
                        ? 'bg-purple-50/90 text-purple-900'
                        : 'hover:bg-purple-50/60 text-slate-700 hover:text-purple-900'
                    }`}
                  >
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-100 to-purple-100 text-purple-700 flex items-center justify-center shrink-0 mt-0.5 shadow-xs group-hover:scale-105 transition-transform">
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

            {/* Features */}
            <Link
              to="/features"
              className={`px-2.5 xl:px-3 py-1.5 rounded-lg text-[13px] xl:text-[14px] font-medium whitespace-nowrap transition-all duration-150 ${
                location.pathname === '/features'
                  ? 'text-blue-600 bg-blue-50/80 font-semibold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
              }`}
            >
              Features
            </Link>

            {/* Case Studies */}
            <Link
              to="/case-studies"
              className={`px-2.5 xl:px-3 py-1.5 rounded-lg text-[13px] xl:text-[14px] font-medium whitespace-nowrap transition-all duration-150 ${
                location.pathname === '/case-studies'
                  ? 'text-blue-600 bg-blue-50/80 font-semibold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
              }`}
            >
              Case Studies
            </Link>

            {/* Pricing */}
            <Link
              to="/pricing"
              className={`px-2.5 xl:px-3 py-1.5 rounded-lg text-[13px] xl:text-[14px] font-medium whitespace-nowrap transition-all duration-150 ${
                location.pathname === '/pricing'
                  ? 'text-blue-600 bg-blue-50/80 font-semibold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
              }`}
            >
              Pricing
            </Link>

            {/* About */}
            <Link
              to="/about"
              className={`px-2.5 xl:px-3 py-1.5 rounded-lg text-[13px] xl:text-[14px] font-medium whitespace-nowrap transition-all duration-150 ${
                location.pathname === '/about'
                  ? 'text-blue-600 bg-blue-50/80 font-semibold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
              }`}
            >
              About
            </Link>

            {/* Contact */}
            <Link
              to="/contact"
              className={`px-2.5 xl:px-3 py-1.5 rounded-lg text-[13px] xl:text-[14px] font-medium whitespace-nowrap transition-all duration-150 ${
                location.pathname === '/contact'
                  ? 'text-blue-600 bg-blue-50/80 font-semibold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
              }`}
            >
              Contact
            </Link>

            {/* Credential Verification Badge Button */}
            <Link
              to="/verify"
              className={`inline-flex items-center gap-1.5 px-2.5 xl:px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all duration-150 ml-0.5 xl:ml-1 ${
                location.pathname === '/verify'
                  ? 'bg-blue-600 text-white shadow-sm shadow-blue-600/20'
                  : 'bg-blue-50/80 text-blue-700 hover:bg-blue-100/80 border border-blue-200/70 hover:border-blue-300'
              }`}
              title="Verify Certificate or Ticket Credential"
            >
              <ShieldCheck className={`w-3.5 h-3.5 shrink-0 ${location.pathname === '/verify' ? 'text-white' : 'text-blue-600'}`} />
              <span>Verify<span className="hidden xl:inline"> Credential</span></span>
            </Link>
          </nav>

          {/* Search Icon & Desktop Auth CTAs */}
          <div className="flex items-center gap-1.5 sm:gap-2 xl:gap-2.5 shrink-0">
            {/* Search Icon Button */}
            <button
              type="button"
              onClick={() => setSearchOpen(true)}
              aria-label="Search events, features, and platform pages"
              title="Search (Ctrl + K)"
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100/80 border border-slate-200/80 text-xs font-medium transition-all duration-150 cursor-pointer"
            >
              <Search className="w-3.5 h-3.5 text-slate-400" />
              <span className="hidden xl:inline text-xs text-slate-500">Search</span>
              <kbd className="hidden xl:inline-flex items-center px-1.5 py-0.5 text-[10px] font-mono text-slate-400 bg-slate-100 rounded border border-slate-200">
                Ctrl+K
              </kbd>
            </button>

            {/* Auth Buttons */}
            <div className="hidden lg:flex items-center gap-1.5 xl:gap-2">
              {isAuthenticated && user ? (
                <div className="flex items-center gap-2">
                  <Link
                    to="/dashboard"
                    className="flex items-center gap-1.5 text-xs xl:text-sm font-semibold px-3.5 py-1.5 rounded-lg text-white bg-blue-600 hover:bg-blue-700 shadow-sm shadow-blue-600/20 transition-all duration-150 whitespace-nowrap"
                  >
                    <LayoutDashboard className="w-4 h-4" />
                    <span>Dashboard</span>
                  </Link>
                  <div className="flex items-center gap-1.5 pl-2 border-l border-slate-200">
                    <div 
                      className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-bold text-xs shadow-xs"
                      title={user.fullName || user.email}
                    >
                      {user.fullName ? user.fullName[0].toUpperCase() : <UserIcon className="w-4 h-4" />}
                    </div>
                    <button
                      type="button"
                      onClick={logout}
                      title="Sign Out"
                      className="p-1.5 rounded-lg text-slate-500 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                    >
                      <LogOut className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-1 xl:gap-2">
                  <Link
                    to="/login"
                    className="font-medium text-xs xl:text-sm px-3 py-1.5 rounded-lg text-slate-700 hover:text-blue-600 hover:bg-slate-100/70 transition-all duration-150 whitespace-nowrap"
                  >
                    Sign In
                  </Link>
                  <Link
                    to="/register"
                    className="inline-flex items-center justify-center font-semibold text-xs xl:text-sm px-3.5 xl:px-4 py-1.5 xl:py-2 rounded-lg text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-sm shadow-blue-600/25 hover:shadow-md hover:shadow-blue-600/30 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] transition-all duration-150 whitespace-nowrap"
                  >
                    Get Started
                  </Link>
                </div>
              )}
            </div>

            {/* Mobile Hamburger Button */}
            <button
              type="button"
              className="lg:hidden p-2 rounded-lg text-slate-700 hover:text-blue-600 hover:bg-slate-100 transition-colors"
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label={mobileOpen ? 'Close navigation menu' : 'Open navigation menu'}
            >
              {mobileOpen ? <X className="w-6 h-6 text-blue-600" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div 
          className="w-full bg-white border-b border-slate-200 shadow-2xl z-40 lg:hidden px-5 py-6 animate-in slide-in-from-top-2 fade-in duration-200 font-body"
        >
          <div className="flex flex-col gap-1.5">
            {/* Search Button in Mobile */}
            <button
              type="button"
              onClick={() => {
                setMobileOpen(false);
                setSearchOpen(true);
              }}
              className="flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-semibold text-slate-600 bg-slate-50 border border-slate-200/80 mb-2 cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <Search className="w-4 h-4 text-blue-600" />
                <span>Quick Search...</span>
              </div>
              <span className="text-[11px] text-slate-400">Ctrl+K</span>
            </button>

            {/* Primary Links */}
            {navLinks.map((link) => (
              <Link
                key={link.href}
                to={link.href}
                className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  location.pathname === link.href
                    ? 'text-blue-600 bg-blue-50/80 font-semibold'
                    : 'text-slate-700 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <span>{link.label}</span>
                {location.pathname === link.href && (
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-600" />
                )}
              </Link>
            ))}

            {/* Events & Seminars Section */}
            <div className="rounded-2xl border border-slate-200/90 bg-slate-50/60 p-3 my-2">
              <button
                type="button"
                onClick={() => setMobileEventsOpen(!mobileEventsOpen)}
                className="w-full flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-500 px-1 py-1 cursor-pointer"
              >
                <span>Events &amp; Directory</span>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${mobileEventsOpen ? 'rotate-180' : ''}`} />
              </button>

              {mobileEventsOpen && (
                <div className="flex flex-col gap-1.5 mt-2 pt-2 border-t border-slate-200/60">
                  <Link
                    to="/events-directory"
                    className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:text-blue-600 hover:bg-white transition-all"
                  >
                    <Calendar className="w-4 h-4 text-blue-600 shrink-0" />
                    <span>Browse Upcoming Events</span>
                  </Link>
                  <Link
                    to="/list-event"
                    className="flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold text-purple-900 bg-purple-50/80 hover:bg-purple-100 border border-purple-200/80 transition-all"
                  >
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-amber-500 shrink-0" />
                      <span>List Your Event (+ VIP)</span>
                    </div>
                    <span className="text-[10px] font-black uppercase px-1.5 py-0.2 rounded-md bg-purple-600 text-white">
                      VIP
                    </span>
                  </Link>
                </div>
              )}
            </div>

            {/* Verify Credential in Mobile */}
            <Link
              to="/verify"
              className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                location.pathname === '/verify'
                  ? 'text-blue-700 bg-blue-50 font-semibold border border-blue-200/80'
                  : 'text-slate-700 hover:text-blue-700 hover:bg-blue-50/50'
              }`}
            >
              <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0" />
              <span>Verify Credential / Pass</span>
            </Link>

            {/* Mobile Auth Actions */}
            <div className="flex flex-col gap-2.5 pt-4 border-t border-slate-200 mt-2">
              {isAuthenticated && user ? (
                <>
                  <Link
                    to="/dashboard"
                    className="w-full text-center flex items-center justify-center gap-2 font-bold text-sm px-4 py-3 rounded-xl text-white bg-blue-600 shadow-md shadow-blue-600/20 transition-all"
                  >
                    <LayoutDashboard className="w-4 h-4" />
                    <span>Open Dashboard</span>
                  </Link>
                  <button
                    type="button"
                    onClick={logout}
                    className="w-full text-center font-semibold text-xs px-4 py-2.5 rounded-xl border border-red-200 text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                  >
                    Sign Out ({user.email})
                  </button>
                </>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  <Link
                    to="/login"
                    className="text-center font-semibold text-xs py-2.5 rounded-xl border border-slate-200 text-slate-700 hover:border-blue-600 hover:text-blue-600 hover:bg-blue-50 transition-all"
                  >
                    Sign In
                  </Link>
                  <Link
                    to="/register"
                    className="text-center font-bold text-xs py-2.5 rounded-xl text-white bg-gradient-to-r from-blue-600 to-indigo-600 shadow-md shadow-blue-600/20 hover:from-blue-700 hover:to-indigo-700 transition-all"
                  >
                    Get Started
                  </Link>
                </div>
              )}
            </div>

            {/* Clickable Contact Bar in Mobile */}
            <div className="mt-4 pt-3 border-t border-slate-100 flex flex-col gap-2 text-xs text-slate-600">
              <div className="flex items-center justify-between">
                <a 
                  href="tel:+923190375751" 
                  className="flex items-center gap-1.5 text-blue-600 font-semibold hover:underline"
                >
                  <Phone className="w-3.5 h-3.5 shrink-0" />
                  <span>+92 3190375751</span>
                </a>
                <a 
                  href="mailto:eventorax@orbit-i.tech" 
                  className="flex items-center gap-1.5 text-blue-600 font-semibold hover:underline"
                >
                  <Mail className="w-3.5 h-3.5 shrink-0" />
                  <span>Email Support</span>
                </a>
              </div>
              <div className="flex items-center justify-between text-[11px] text-slate-400">
                <span className="flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-rose-500" />
                  Nawabshah, Pakistan
                </span>
                <span>ORBIT-I Private Limited</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Quick Search Dialog Modal */}
      <QuickSearchModal 
        isOpen={searchOpen} 
        onClose={() => setSearchOpen(false)} 
      />
    </>
  );
}