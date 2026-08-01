import React from 'react';
import './Footer.css';

const Footer = () => {
  return (
    <footer className="footer">
      <div className="footer-left">
        <h3>EventoraX</h3>
        <p>© 2024 EventoraX Global Ltd operated by ORBIT-I. All rights reserved.</p>
      </div>
      <div className="footer-links">
        <a href="#">Privacy Policy</a>
        <a href="#">Terms of Service</a>
        <a href="#">Cookie Policy</a>
        <a href="#">Status</a>
      </div>
    </footer>
  );
};

export default Footer;