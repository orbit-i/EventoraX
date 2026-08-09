import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import "../styles/Header.css";

function Header() {
  const [scrolled, setScrolled] = useState(false);
  const { pathname } = useLocation();
  const isHome = pathname === "/";

  useEffect(() => {
    function handleScroll() {
      setScrolled(window.scrollY > 0);
    }
    window.addEventListener("scroll", handleScroll);
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Only Home starts with a transparent navbar over its hero; every other
  // page keeps the solid white navbar, matching each page's original CSS.
  const navClass = [
    "navbar",
    scrolled ? "scrolled" : "",
    isHome && !scrolled ? "home-transparent" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <header>
      <nav className={navClass}>
        <div className="div1">
          <div className="logo">
            <h2>EventoraX</h2>
          </div>
          <Link to="/features">Features</Link>
          <Link to="/pricing">Pricing</Link>
          <Link to="/about">About</Link>
          <Link to="/verify">Verify</Link>
        </div>
        <div className="div2">
          <Link to="/signin" className="div2-1">
            Sign In
          </Link>
          <Link to="/contact" className="headerbtn">
            Get Started
          </Link>
        </div>
      </nav>
    </header>
  );
}

export default Header;