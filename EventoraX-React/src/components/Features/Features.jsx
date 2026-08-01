import React from 'react';
import { Link } from 'react-router-dom';
import { useScrollReveal } from '../hooks/useScrollReveal';
import './Features.css';
import eventManagementImg from '../../assets/hero.png';
import certificateSystemImg from '../../assets/hero.png';
import qrTicketImg from '../../assets/hero.png';
import idCardImg from '../../assets/hero.png';
import analyticsImg from '../../assets/hero.png';
import emailAutoImg from '../../assets/hero.png';
import resetApiImg from '../../assets/hero.png';
import securityImg from '../../assets/hero.png';
import logo1 from '../../assets/hero.png';
import logo2 from '../../assets/hero.png';
import logo3 from '../../assets/hero.png';
import logo4 from '../../assets/hero.png';
import logo5 from '../../assets/hero.png';
import logo6 from '../../assets/hero.png';
import logo7 from '../../assets/hero.png';

const Features = () => {
  const heroRef = useScrollReveal();
  const ctaRef = useScrollReveal();

  const features = [
    { num: '01', title: 'Event Management', desc: 'Create, organize and manage events of every size with powerful tools and automation.', image: eventManagementImg, reverse: false },
    { num: '02', title: 'Certificate System', desc: 'Design, issue and verify professional certificates in seconds with automation.', image: certificateSystemImg, reverse: true },
    { num: '03', title: 'QR Ticketing & Scanner', desc: 'Generate secure QR tickets and scan attendees instantly using any device.', image: qrTicketImg, reverse: false },
    { num: '04', title: 'ID Card Generator', desc: 'Create professional ID cards for participants, speakers and staff in minutes.', image: idCardImg, reverse: true },
    { num: '05', title: 'Analytics & Reports', desc: 'Get clear insight into registrations, attendance, certificates and event performance.', image: analyticsImg, reverse: false },
    { num: '06', title: 'Email Automation', desc: 'Send the right emails at the right time with automation and smart triggers.', image: emailAutoImg, reverse: true },
    { num: '07', title: 'Rest API', desc: 'Integrate EventoriaX with your own systems using our powerful Rest API.', image: resetApiImg, reverse: false },
    { num: '08', title: 'Multi-tenancy & Security', desc: 'Built for scale - isolated, secure and reliable for every organization.', image: securityImg, reverse: true }
  ];

  const logos = [logo1, logo2, logo3, logo4, logo5, logo6, logo7];

  return (
    <main>
      <section className="pricing-hero" ref={heroRef}>
        <div className="hero-content">
          <div className="hero-left">
            <div className="tag">ALL FEATURES</div>
            <h1>
              Everything you need to run
              <br />
              <span>events effortlessly</span>
            </h1>
            <p>
              Powerful tools. Smart automation. Real-time analytics. Everything your organization needs to manage events
              from registration to certificates in one platform.
            </p>
            <div className="hero-buttons">
              <Link to="/contact" className="primary">Explore Features →</Link>
              <button className="secondary">Watch Demo</button>
            </div>
          </div>
        </div>
      </section>

      <section>
        <div className="features-head" id="features">
          <div className="tag ftag">FEATURES</div>
          <h2>EventoriaX Features</h2>
          <p>Our innovative, future‑ready features make your event management effortless — ensuring a seamless experience without any hurdles.</p>
        </div>

        {features.map((feature, index) => (
          <div className={`feature ${feature.reverse ? 'reverse' : ''}`} key={index}>
            <div className="feature-image">
              <img src={feature.image} alt={feature.title} />
            </div>
            <div className="feature-card">
              <span className="number">{feature.num}</span>
              <h2>{feature.title}</h2>
              <div className="line"></div>
              <p>{feature.desc}</p>
              <Link to="/contact"> → </Link>
            </div>
          </div>
        ))}
      </section>

      <section className="logo-wall">
        <div className="logo-wall-container">
          <h2>TRUSTED BY LEADING INSTITUTIONS</h2>
          <div className="logo-grid">
            <div className="logo-track">
              {logos.map((logo, index) => (
                <img src={logo} alt={`Logo ${index + 1}`} key={index} />
              ))}
              {logos.map((logo, index) => (
                <img src={logo} alt={`Logo ${index + 1}`} key={`dup-${index}`} />
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="cta" ref={ctaRef}>
        <h2>Ready to simplify event management?</h2>
        <p>Start your free trial and build smarter workflows.</p>
        <Link to="/contact" className="btn-white">Start Free Trial</Link>
      </section>
    </main>
  );
};

export default Features;