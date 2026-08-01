import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import './Navbar.css';

const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 0);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close menu on route change
  useEffect(() => {
    setMenuOpen(false);
  }, [location]);

  const isActive = (path) => location.pathname === path;

  return (
    <header>
      <nav className={`navbar ${scrolled ? 'scrolled' : ''}`}>
        <div className="div1">
          <div className="logo">
            <h2>EventoraX</h2>
          </div>
          <Link to="/features" className={isActive('/features') ? 'active' : ''}>
            Features
          </Link>
          <Link to="/pricing" className={isActive('/pricing') ? 'active' : ''}>
            Pricing
          </Link>
          <Link to="/about" className={isActive('/about') ? 'active' : ''}>
            About
          </Link>
          <Link to="/verify">Verify</Link>
        </div>
        <div className="div2">
          <Link to="/signin" className="div2-1">Sign In</Link>
          <Link to="/contact" className="headerbtn">Get Started</Link>
          <div
            className="hamburger"
            onClick={() => setMenuOpen((prev) => !prev)}
            aria-label="Toggle menu"
            aria-expanded={menuOpen}
          >
            {menuOpen ? '✕' : '☰'}
          </div>
        </div>
      </nav>

      {/* Mobile menu */}
      <div className={`mobile-menu ${menuOpen ? 'open' : ''}`}>
        <Link to="/features" className={isActive('/features') ? 'active' : ''}>Features</Link>
        <Link to="/pricing" className={isActive('/pricing') ? 'active' : ''}>Pricing</Link>
        <Link to="/about" className={isActive('/about') ? 'active' : ''}>About</Link>
        <Link to="/verify">Verify</Link>
        <hr />
        <Link to="/signin">Sign In</Link>
        <Link to="/contact" className="mobile-cta">Get Started</Link>
      </div>
    </header>
  );
};

export default Navbar;