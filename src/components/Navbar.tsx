import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router';
import { Menu, X } from 'lucide-react';

const navLinks = [
  { label: 'Features', href: '/features' },
  { label: 'Pricing', href: '/pricing' },
  { label: 'About', href: '/about' },
  { label: 'Contact', href: '/contact' },
];

export default function Navbar() {
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
          ? 'bg-white/90 backdrop-blur-xl shadow-sm shadow-[#7c3aed]/5'
          : 'bg-transparent'
      }`}
      style={{ height: 64 }}
    >
      <div className="content-max h-full flex items-center justify-between">
        <Link to="/" className="font-heading text-2xl font-bold text-[#0f172a] flex items-center gap-1">
          Eventora<span className="bg-gradient-to-r from-[#7c3aed] to-[#a78bfa] bg-clip-text text-transparent">X</span>
        </Link>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              to={link.href}
              className="font-body text-sm font-semibold text-[#475569] hover:text-[#7c3aed] transition-colors duration-200"
            >
              {link.label}
            </Link>
          ))}
          <Link
            to="/login"
            className="font-body text-sm font-semibold px-5 py-2 rounded-xl border-2 border-[#e9e4ff] text-[#475569] hover:border-[#7c3aed] hover:text-[#7c3aed] hover:bg-[#f5f3ff] transition-all duration-200"
          >
            Login
          </Link>
          <Link
            to="/register"
            className="font-body text-sm font-semibold px-5 py-2 rounded-xl text-white bg-[#7c3aed] shadow-lg shadow-[#7c3aed]/25 hover:bg-[#6d28d9] hover:shadow-xl hover:shadow-[#7c3aed]/30 hover:-translate-y-0.5 transition-all duration-200"
          >
            Get Started
          </Link>
        </div>

        {/* Mobile Hamburger */}
        <button
          className="md:hidden text-[#0f172a] p-2 rounded-lg hover:bg-[#f5f3ff] transition-colors duration-200"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X size={24} className="text-[#7c3aed]" /> : <Menu size={24} />}
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
            <div className="flex gap-3 pt-3 border-t border-[#e9e4ff] mt-2">
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
          </div>
        </div>
      )}
    </nav>
  );
}