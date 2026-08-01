import React, { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useScrollReveal, useScrollRevealRight } from '../hooks/useScrollReveal';
import './Home.css';
import dashboardImage from '../../assets/hero.png';
import signupImage from '../../assets/hero.png';
import createEventImage from '../../assets/hero.png';
import certificatesImage from '../../assets/hero.png';
import logo1 from '../../assets/hero.png';
import logo2 from '../../assets/hero.png';
import logo3 from '../../assets/hero.png';
import logo4 from '../../assets/hero.png';
import logo5 from '../../assets/hero.png';
import logo6 from '../../assets/hero.png';
import logo7 from '../../assets/hero.png';
import l1 from '../../assets/hero.png';
import l2 from '../../assets/hero.png';
import l3 from '../../assets/hero.png';
import l4 from '../../assets/hero.png';

const Home = () => {
  const heroRef = useScrollReveal();
  const heroImageRef = useScrollReveal();
  const stepsRef = useScrollReveal();
  const stepsRightRef = useScrollRevealRight();
  const pricingRef = useScrollReveal();
  const testimonialsRef = useScrollReveal();
  const faqRef = useScrollReveal();
  const faqRightRef = useScrollRevealRight();

  // Testimonial slider logic
  useEffect(() => {
    const container = document.querySelector('.testimonial-container');
    const nextBtn = document.querySelector('.next-btn');
    const prevBtn = document.querySelector('.prev-btn');
    let isAnimating = false;

    if (!container || !nextBtn || !prevBtn) return;

    const handleNext = () => {
      if (isAnimating) return;
      isAnimating = true;

      const firstCard = container.firstElementChild;
      const cardWidth = firstCard.offsetWidth;

      container.style.transition = 'transform 0.4s ease';
      container.style.transform = `translateX(-${cardWidth + 35}px)`;

      setTimeout(() => {
        container.appendChild(firstCard);
        container.style.transition = 'none';
        container.style.transform = 'translateX(0)';
        isAnimating = false;
      }, 400);
    };

    const handlePrev = () => {
      if (isAnimating) return;
      isAnimating = true;

      const lastCard = container.lastElementChild;
      const cardWidth = lastCard.offsetWidth;

      container.insertBefore(lastCard, container.firstElementChild);
      container.style.transition = 'none';
      container.style.transform = `translateX(-${cardWidth + 35}px)`;

      requestAnimationFrame(() => {
        container.style.transition = 'transform 0.4s ease';
        container.style.transform = 'translateX(0)';
      });

      setTimeout(() => {
        isAnimating = false;
      }, 400);
    };

    nextBtn.addEventListener('click', handleNext);
    prevBtn.addEventListener('click', handlePrev);

    return () => {
      nextBtn.removeEventListener('click', handleNext);
      prevBtn.removeEventListener('click', handlePrev);
    };
  }, []);

  // FAQ accordion logic
  useEffect(() => {
    document.querySelectorAll('.faq-question').forEach((button) => {
      button.addEventListener('click', () => {
        const answer = button.nextElementSibling;
        const isOpen = answer.classList.contains('open');

        document.querySelectorAll('.faq-answer').forEach((a) => {
          a.style.maxHeight = null;
          a.classList.remove('open');
        });
        document.querySelectorAll('.faq-question').forEach((q) => q.classList.remove('active'));

        if (!isOpen) {
          answer.classList.add('open');
          answer.style.maxHeight = answer.scrollHeight + 'px';
          button.classList.add('active');
        }
      });
    });
  }, []);

  const features = [
    { num: '01', icon: 'fa-solid fa-ticket', title: 'QR Ticketing & Entry', desc: 'Seamless check-ins with dynamic QR generation and real-time validation. Manage thousands of attendees without the wait times.' },
    { num: '02', icon: 'fa-solid fa-chart-line', title: 'Advanced Analytics', desc: 'Real-time data on registration peaks, attendee demographics, and engagement metrics to drive better decision-making.' },
    { num: '03', icon: 'fa-solid fa-certificate', title: 'Secure Certificates', desc: 'Issue blockchain-verifiable digital certificates automatically upon completion. Fully customizable templates for your brand.' },
    { num: '04', icon: 'fa-solid fa-building', title: 'Enterprise Multi-tenancy', desc: 'Designed for universities and large corps. Create isolated sub-organizations with independent billing, users, and branding under one master account.' },
    { num: '05', icon: 'fa-solid fa-id-card', title: 'Automated ID Generator', desc: 'Instantly generate and print attendee badges with custom layouts and security features. Batch processing for large-scale deployments.' },
    { num: '06', icon: 'fa-solid fa-users', title: 'Participant Management', desc: 'Manage attendee lists, registrations, approvals and communication from one place.' },
    { num: '07', icon: 'fa-solid fa-envelope', title: 'Event Lifecycle Automation', desc: 'Configure triggers for registration confirmations, reminder emails, and post-event certificate delivery workflows.' },
    { num: '08', icon: 'fa-solid fa-shield-halved', title: 'Multi-tenancy & Security', desc: 'Enterprise-grade security keeps your event data and certificates protected at all times.' }
  ];

  const logos = [logo1, logo2, logo3, logo4, logo5, logo6, logo7];

  return (
    <main>
      <section className="hero">
        <div className="hero-content" ref={heroRef}>
          <div className="tag">
            <span className="material-symbols-outlined">verified</span>
            <span>TRUSTED BY 300+ GLOBAL ORGANIZATIONS</span>
          </div>
          <h1>
            Manage Events End-to-End <br />
            with <span>EventoraX</span>
          </h1>
          <p className="hero-text">
            The robust multi-tenant SaaS infrastructure designed for
            universities and enterprises. Automate logistics, issue secure
            credentials, and scale your event operations with precision.
          </p>
          <div className="hero-buttons">
            <Link to="/contact" className="btn primary">Start Free Trial</Link>
            <Link to="/pricing" className="btn secondary">View Pricing</Link>
          </div>
        </div>

        <div className="hero-image-wrapper">
          <div className="circle circle-1"></div>
          <div className="circle circle-2"></div>
          <img src={dashboardImage} alt="Dashboard Preview" className="dashboard-image" ref={heroImageRef} />
        </div>
      </section>

      <section className="status_bar">
        <div className="cards">
          <h4>12,000+</h4>
          <p>REGISTRATIONS</p>
        </div>
        <div className="cards">
          <h4>50,000+</h4>
          <p>CERTIFICATES ISSUED</p>
        </div>
        <div className="cards">
          <h4>300+</h4>
          <p>ORGANIZATIONS</p>
        </div>
      </section>

      <section className="feature">
        <div className="container">
          <span className="section-tag">FEATURES</span>
          <h2 className="section-title">
            Everything You Need to Run
            <span>Seamless Events</span>
          </h2>
          <p className="section-description">
            EventoriaX gives you every tool required to manage events,
            engage participants, automate certificate generation,
            and track everything from one dashboard.
          </p>

          <div className="feature-grid">
            {features.map((feature, index) => (
              <div className="feature-card" key={index}>
                <span className="card-number">{feature.num}</span>
                <div className="icon-box">
                  <i className={feature.icon}></i>
                </div>
                <h3>{feature.title}</h3>
                <p>{feature.desc}</p>
                <span className="card-line"></span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="steps-section" ref={stepsRef}>
        <div className="steps-container">
          <div className="steps-heading">
            <h2>Zero-to-Launch in Minutes</h2>
            <p>Streamlined workflows for busy administrators.</p>
          </div>

          <div className="steps-wrapper" ref={stepsRightRef}>
            <div className="progress-line"></div>
            <div className="steps-grid">
              <div className="step-card">
                <div className="step-circle">1</div>
                <h3>Sign Up</h3>
                <img src={signupImage} alt="Sign Up" />
                <p>Create your organizational tenant and configure your primary branding and security settings.</p>
              </div>
              <div className="step-card">
                <div className="step-circle">2</div>
                <h3>Create Event</h3>
                <img src={createEventImage} alt="Create Event" />
                <p>Define registration fields, session schedules, and ticketing tiers using our intuitive builder.</p>
              </div>
              <div className="step-card">
                <div className="step-circle">3</div>
                <h3>Issue Certs</h3>
                <img src={certificatesImage} alt="Certificates" />
                <p>Automate the delivery of attendance certificates or badges once the event concludes.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="pricing" ref={pricingRef}>
        <h2 className="pricing-title">Flexible Scaling for Any Need</h2>
        <p>Simple, transparent pricing built for long-term partnerships.</p>
        <div className="pricing-cards">
          <div className="card1">
            <div className="model">
              <h3 className="plan">PRO</h3>
              <p className="price">$199 <span>/mo</span></p>
              <p className="desc">Perfect for independent event organizers and small departments.</p>
            </div>
            <ul className="features">
              <li><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640"><path fill="rgb(29, 216, 125)" d="M320 576C178.6 576 64 461.4 64 320C64 178.6 178.6 64 320 64C461.4 64 576 178.6 576 320C576 461.4 461.4 576 320 576zM320 112C205.1 112 112 205.1 112 320C112 434.9 205.1 528 320 528C434.9 528 528 434.9 528 320C528 205.1 434.9 112 320 112zM390.7 233.9C398.5 223.2 413.5 220.8 424.2 228.6C434.9 236.4 437.3 251.4 429.5 262.1L307.4 430.1C303.3 435.8 296.9 439.4 289.9 439.9C282.9 440.4 276 437.9 271.1 433L215.2 377.1C205.8 367.7 205.8 352.5 215.2 343.2C224.6 333.9 239.8 333.8 249.1 343.2L285.1 379.2L390.7 234z" /></svg>Up to 5 Active Events</li>
              <li><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640"><path fill="rgb(29, 216, 125)" d="M320 576C178.6 576 64 461.4 64 320C64 178.6 178.6 64 320 64C461.4 64 576 178.6 576 320C576 461.4 461.4 576 320 576zM320 112C205.1 112 112 205.1 112 320C112 434.9 205.1 528 320 528C434.9 528 528 434.9 528 320C528 205.1 434.9 112 320 112zM390.7 233.9C398.5 223.2 413.5 220.8 424.2 228.6C434.9 236.4 437.3 251.4 429.5 262.1L307.4 430.1C303.3 435.8 296.9 439.4 289.9 439.9C282.9 440.4 276 437.9 271.1 433L215.2 377.1C205.8 367.7 205.8 352.5 215.2 343.2C224.6 333.9 239.8 333.8 249.1 343.2L285.1 379.2L390.7 234z" /></svg>2,000 Certificates /mo</li>
              <li><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640"><path fill="rgb(29, 216, 125)" d="M320 576C178.6 576 64 461.4 64 320C64 178.6 178.6 64 320 64C461.4 64 576 178.6 576 320C576 461.4 461.4 576 320 576zM320 112C205.1 112 112 205.1 112 320C112 434.9 205.1 528 320 528C434.9 528 528 434.9 528 320C528 205.1 434.9 112 320 112zM390.7 233.9C398.5 223.2 413.5 220.8 424.2 228.6C434.9 236.4 437.3 251.4 429.5 262.1L307.4 430.1C303.3 435.8 296.9 439.4 289.9 439.9C282.9 440.4 276 437.9 271.1 433L215.2 377.1C205.8 367.7 205.8 352.5 215.2 343.2C224.6 333.9 239.8 333.8 249.1 343.2L285.1 379.2L390.7 234z" /></svg>Standard Analytics</li>
              <li><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640"><path fill="rgb(29, 216, 125)" d="M320 576C178.6 576 64 461.4 64 320C64 178.6 178.6 64 320 64C461.4 64 576 178.6 576 320C576 461.4 461.4 576 320 576zM320 112C205.1 112 112 205.1 112 320C112 434.9 205.1 528 320 528C434.9 528 528 434.9 528 320C528 205.1 434.9 112 320 112zM390.7 233.9C398.5 223.2 413.5 220.8 424.2 228.6C434.9 236.4 437.3 251.4 429.5 262.1L307.4 430.1C303.3 435.8 296.9 439.4 289.9 439.9C282.9 440.4 276 437.9 271.1 433L215.2 377.1C205.8 367.7 205.8 352.5 215.2 343.2C224.6 333.9 239.8 333.8 249.1 343.2L285.1 379.2L390.7 234z" /></svg>QR Ticket Engine</li>
            </ul>
            <Link to="/contact" className="btn">Start 14-Day Trial</Link>
          </div>

          <div className="card1 recommended">
            <div className="model">
              <div className="badge">RECOMMENDED</div>
              <h3>ENTERPRISE</h3>
              <span className="span">Custom</span>
              <p>Complete multi-tenant infrastructure for universities and global firms.</p>
            </div>
            <ul>
              <li><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640"><path fill="rgb(29, 216, 125)" d="M320 576C178.6 576 64 461.4 64 320C64 178.6 178.6 64 320 64C461.4 64 576 178.6 576 320C576 461.4 461.4 576 320 576zM320 112C205.1 112 112 205.1 112 320C112 434.9 205.1 528 320 528C434.9 528 528 434.9 528 320C528 205.1 434.9 112 320 112zM390.7 233.9C398.5 223.2 413.5 220.8 424.2 228.6C434.9 236.4 437.3 251.4 429.5 262.1L307.4 430.1C303.3 435.8 296.9 439.4 289.9 439.9C282.9 440.4 276 437.9 271.1 433L215.2 377.1C205.8 367.7 205.8 352.5 215.2 343.2C224.6 333.9 239.8 333.8 249.1 343.2L285.1 379.2L390.7 234z" /></svg>Unlimited Events & Certs</li>
              <li><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640"><path fill="rgb(29, 216, 125)" d="M320 576C178.6 576 64 461.4 64 320C64 178.6 178.6 64 320 64C461.4 64 576 178.6 576 320C576 461.4 461.4 576 320 576zM320 112C205.1 112 112 205.1 112 320C112 434.9 205.1 528 320 528C434.9 528 528 434.9 528 320C528 205.1 434.9 112 320 112zM390.7 233.9C398.5 223.2 413.5 220.8 424.2 228.6C434.9 236.4 437.3 251.4 429.5 262.1L307.4 430.1C303.3 435.8 296.9 439.4 289.9 439.9C282.9 440.4 276 437.9 271.1 433L215.2 377.1C205.8 367.7 205.8 352.5 215.2 343.2C224.6 333.9 239.8 333.8 249.1 343.2L285.1 379.2L390.7 234z" /></svg>Multi-tenant Sub-accounts</li>
              <li><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640"><path fill="rgb(29, 216, 125)" d="M320 576C178.6 576 64 461.4 64 320C64 178.6 178.6 64 320 64C461.4 64 576 178.6 576 320C576 461.4 461.4 576 320 576zM320 112C205.1 112 112 205.1 112 320C112 434.9 205.1 528 320 528C434.9 528 528 434.9 528 320C528 205.1 434.9 112 320 112zM390.7 233.9C398.5 223.2 413.5 220.8 424.2 228.6C434.9 236.4 437.3 251.4 429.5 262.1L307.4 430.1C303.3 435.8 296.9 439.4 289.9 439.9C282.9 440.4 276 437.9 271.1 433L215.2 377.1C205.8 367.7 205.8 352.5 215.2 343.2C224.6 333.9 239.8 333.8 249.1 343.2L285.1 379.2L390.7 234z" /></svg>White-label Custom Domains</li>
              <li><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640"><path fill="rgb(29, 216, 125)" d="M320 576C178.6 576 64 461.4 64 320C64 178.6 178.6 64 320 64C461.4 64 576 178.6 576 320C576 461.4 461.4 576 320 576zM320 112C205.1 112 112 205.1 112 320C112 434.9 205.1 528 320 528C434.9 528 528 434.9 528 320C528 205.1 434.9 112 320 112zM390.7 233.9C398.5 223.2 413.5 220.8 424.2 228.6C434.9 236.4 437.3 251.4 429.5 262.1L307.4 430.1C303.3 435.8 296.9 439.4 289.9 439.9C282.9 440.4 276 437.9 271.1 433L215.2 377.1C205.8 367.7 205.8 352.5 215.2 343.2C224.6 333.9 239.8 333.8 249.1 343.2L285.1 379.2L390.7 234z" /></svg>24/7 Dedicated Support</li>
            </ul>
            <Link to="/contact" className="btn">Contact Sales</Link>
          </div>
        </div>
      </section>

      <section className="testimonials-section" ref={testimonialsRef}>
        <div className="container">
          <div className="testimonials-header">
            <h2>What Our Clients Say</h2>
            <p>Trusted by organizations and event partners worldwide</p>
          </div>

          <div className="testimonial-slider">
            <button className="nav-btn prev-btn">&#10094;</button>
            <div className="testimonial-container">
              <div className="testimonial-card common">
                <div className="quote">❝</div>
                <p className="review">EventoraX transformed the way we organize our annual conferences. Registration, certificates, and attendee management became effortless.</p>
                <div className="user">
                  <img src="https://randomuser.me/api/portraits/women/45.jpg" alt="Sarah Ahmed" />
                  <div>
                    <h4>Sarah Ahmed</h4>
                    <span>Training Coordinator • ORBIT-I</span>
                  </div>
                </div>
              </div>

              <div className="testimonial-card featured">
                <div className="quote">❝</div>
                <p className="review">The certificate verification system impressed both our participants and employers. Everything feels secure, modern, and professional.</p>
                <div className="user">
                  <img src="https://randomuser.me/api/portraits/men/32.jpg" alt="Michael Johnson" />
                  <div>
                    <h4>Michael Johnson</h4>
                    <span>Event Director • Tech Summit</span>
                  </div>
                </div>
              </div>

              <div className="testimonial-card common">
                <div className="quote">❝</div>
                <p className="review">QR ticketing reduced our check-in time from nearly thirty minutes to under five. Our attendees loved the smooth experience.</p>
                <div className="user">
                  <img src="https://randomuser.me/api/portraits/women/62.jpg" alt="Ayesha Khan" />
                  <div>
                    <h4>Ayesha Khan</h4>
                    <span>University Events Office</span>
                  </div>
                </div>
              </div>

              <div className="testimonial-card featured">
                <div className="quote">❝</div>
                <p className="review">The certificate verification system impressed both our participants and employers. Everything feels secure, modern, and professional.</p>
                <div className="user">
                  <img src="https://randomuser.me/api/portraits/men/32.jpg" alt="Michael Johnson" />
                  <div>
                    <h4>Michael Johnson</h4>
                    <span>Event Director • Tech Summit</span>
                  </div>
                </div>
              </div>
            </div>
            <button className="nav-btn next-btn">&#10095;</button>
          </div>

          <div className="logo-strip">
            <img src={l1} alt="logo" />
            <img src={l2} alt="logo" />
            <img src={l3} alt="logo" />
            <img src={l4} alt="logo" />
          </div>

          <div className="cta-box">
            <h2>Ready to simplify event management?</h2>
            <p>Start your free trial and build smarter workflows.</p>
            <Link to="/contact" className="btn-white">Start Free Trial</Link>
          </div>
        </div>
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

      <section className="faq-section">
        <div className="faq-container faqh" ref={faqRef}>
          <h2>Frequently Asked Questions</h2>
          <p>
            An effective FAQ resource can educate, inform, and naturally guide users
            through our platform's content and toward the goals and results you have set.
          </p>
        </div>

        <div className="faq-container faql" ref={faqRightRef}>
          <ul className="faq-list">
            <li>
              <button className="faq-question">
                What is EventoraX? 
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640">
                  <path fill="#3525cd" d="M297.4 438.6C309.9 451.1 330.2 451.1 342.7 438.6L502.7 278.6C515.2 266.1 515.2 245.8 502.7 233.3C490.2 220.8 469.9 220.8 457.4 233.3L320 370.7L182.6 233.4C170.1 220.9 149.8 220.9 137.3 233.4C124.8 245.9 124.8 266.2 137.3 278.7L297.3 438.7z" />
                </svg>
              </button>
              <div className="faq-answer">
                EventoraX is an all-in-one event management platform developed by ORBIT-I
                that helps organizations create, manage, and automate events. From registrations
                and QR ticketing to certificate generation and analytics, everything is managed
                from one centralized dashboard.
              </div>
            </li>
            <li>
              <button className="faq-question">
                Who can use EventoraX? 
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640">
                  <path fill="#3525cd" d="M297.4 438.6C309.9 451.1 330.2 451.1 342.7 438.6L502.7 278.6C515.2 266.1 515.2 245.8 502.7 233.3C490.2 220.8 469.9 220.8 457.4 233.3L320 370.7L182.6 233.4C170.1 220.9 149.8 220.9 137.3 233.4C124.8 245.9 124.8 266.2 137.3 278.7L297.3 438.7z" />
                </svg>
              </button>
              <div className="faq-answer">
                EventoraX is designed for universities, businesses, training institutes,
                conferences, workshops, non-profit organizations, and event organizers
                who want a professional and efficient way to manage their events.
              </div>
            </li>
            <li>
              <button className="faq-question">
                Can I verify certificates issued through EventoraX? 
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640">
                  <path fill="#3525cd" d="M297.4 438.6C309.9 451.1 330.2 451.1 342.7 438.6L502.7 278.6C515.2 266.1 515.2 245.8 502.7 233.3C490.2 220.8 469.9 220.8 457.4 233.3L320 370.7L182.6 233.4C170.1 220.9 149.8 220.9 137.3 233.4C124.8 245.9 124.8 266.2 137.3 278.7L297.3 438.7z" />
                </svg>
              </button>
              <div className="faq-answer">
                Yes. Every certificate generated through EventoraX can be verified using a
                unique verification code, ensuring authenticity and helping prevent certificate fraud.
              </div>
            </li>
            <li>
              <button className="faq-question">
                What features does EventoraX offer? 
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640">
                  <path fill="#3525cd" d="M297.4 438.6C309.9 451.1 330.2 451.1 342.7 438.6L502.7 278.6C515.2 266.1 515.2 245.8 502.7 233.3C490.2 220.8 469.9 220.8 457.4 233.3L320 370.7L182.6 233.4C170.1 220.9 149.8 220.9 137.3 233.4C124.8 245.9 124.8 266.2 137.3 278.7L297.3 438.7z" />
                </svg>
              </button>
              <div className="faq-answer">
                EventoraX includes event management, online registrations, QR code ticketing,
                digital certificate generation, ID card creation, email automation, analytics
                dashboards, REST API integration, and multi-tenant support for organizations.
              </div>
            </li>
            <li>
              <button className="faq-question">
                Is there a free trial available? 
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640">
                  <path fill="#3525cd" d="M297.4 438.6C309.9 451.1 330.2 451.1 342.7 438.6L502.7 278.6C515.2 266.1 515.2 245.8 502.7 233.3C490.2 220.8 469.9 220.8 457.4 233.3L320 370.7L182.6 233.4C170.1 220.9 149.8 220.9 137.3 233.4C124.8 245.9 124.8 266.2 137.3 278.7L297.3 438.7z" />
                </svg>
              </button>
              <div className="faq-answer">
                Yes. EventoraX offers a free trial so you can explore its features before
                choosing a subscription plan. Simply create an account and start managing
                your events in minutes.
              </div>
            </li>
          </ul>
        </div>
      </section>
    </main>
  );
};

export default Home;