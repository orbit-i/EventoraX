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
          ? 'bg-white/85 backdrop-blur-[16px] shadow-sm'
          : 'bg-transparent'
      }`}
      style={{ height: 56 }}
    >
      <div className="content-max h-full flex items-center justify-between">
        <Link to="/" className="font-heading text-2xl font-medium text-[#1B2A4A]">
          EventoraX
        </Link>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              to={link.href}
              className="font-body text-sm text-[#1B2A4A] hover:text-[#4A9CFF] transition-colors duration-200"
            >
              {link.label}
            </Link>
          ))}
          <Link
            to="/login"
            className="font-body text-sm px-4 py-1.5 rounded-full border border-[#1B2A4A] text-[#1B2A4A] hover:bg-[#1B2A4A] hover:text-white transition-all duration-200"
          >
            Login
          </Link>
          <Link
            to="/register"
            className="font-body text-sm px-4 py-1.5 rounded-full text-white transition-all duration-200 hover:scale-[1.03]"
            style={{ backgroundColor: '#4A9CFF' }}
          >
            Get Started
          </Link>
        </div>

        {/* Mobile Hamburger */}
        <button
          className="md:hidden text-[#1B2A4A]"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="md:hidden absolute top-14 left-0 w-full bg-white/95 backdrop-blur-[16px] shadow-lg border-t border-[#E8F4FD] py-4">
          <div className="content-max flex flex-col gap-3">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                to={link.href}
                className="font-body text-base text-[#1B2A4A] hover:text-[#4A9CFF] py-2 transition-colors"
              >
                {link.label}
              </Link>
            ))}
            <div className="flex gap-3 pt-2 border-t border-[#E8F4FD]">
              <Link
                to="/login"
                className="flex-1 text-center font-body text-sm px-4 py-2 rounded-full border border-[#1B2A4A] text-[#1B2A4A]"
              >
                Login
              </Link>
              <Link
                to="/register"
                className="flex-1 text-center font-body text-sm px-4 py-2 rounded-full text-white"
                style={{ backgroundColor: '#4A9CFF' }}
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
