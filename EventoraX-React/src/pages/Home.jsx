import { useEffect, useRef, useState } from "react";
import "../styles/home.css";

// Small reusable check icon used repeatedly in the pricing cards
function CheckIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640">
      <path
        fill="rgb(29, 216, 125)"
        d="M320 576C178.6 576 64 461.4 64 320C64 178.6 178.6 64 320 64C461.4 64 576 178.6 576 320C576 461.4 461.4 576 320 576zM320 112C205.1 112 112 205.1 112 320C112 434.9 205.1 528 320 528C434.9 528 528 434.9 528 320C528 205.1 434.9 112 320 112zM390.7 233.9C398.5 223.2 413.5 220.8 424.2 228.6C434.9 236.4 437.3 251.4 429.5 262.1L307.4 430.1C303.3 435.8 296.9 439.4 289.9 439.9C282.9 440.4 276 437.9 271.1 433L215.2 377.1C205.8 367.7 205.8 352.5 215.2 343.2C224.6 333.9 239.8 333.8 249.1 343.2L285.1 379.2L390.7 234z"
      />
    </svg>
  );
}

// Chevron icon used in FAQ items
function ChevronIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640">
      <path
        fill="#3525cd"
        d="M297.4 438.6C309.9 451.1 330.2 451.1 342.7 438.6L502.7 278.6C515.2 266.1 515.2 245.8 502.7 233.3C490.2 220.8 469.9 220.8 457.4 233.3L320 370.7L182.6 233.4C170.1 220.9 149.8 220.9 137.3 233.4C124.8 245.9 124.8 266.2 137.3 278.7L297.3 438.7z"
      />
    </svg>
  );
}

const featureCards = [
  {
    num: "01",
    icon: "fa-certificate",
    title: "QR Ticketing & Entry",
    text: "Seamless check-ins with dynamic QR generation and real-time validation. Manage thousands of attendees without the wait times.",
  },
  {
    num: "02",
    icon: "fa-paper-plane",
    title: "Advanced Analytics",
    text: "Real-time data on registration peaks, attendee demographics, and engagement metrics to drive better decision-making.",
  },
  {
    num: "03",
    icon: "fa-certificate",
    title: "Secure Certificates",
    text: "Issue blockchain-verifiable digital certificates automatically upon completion. Fully customizable templates for your brand.",
  },
  {
    num: "04",
    icon: "fa-hubspot",
    title: "Enterprise Multi-tenancy",
    text: "Designed for universities and large corps. Create isolated sub-organizations with independent billing, users, and branding under one master account.",
  },
  {
    num: "05",
    icon: "fa-id-card-clip",
    title: "Automated ID Generator",
    text: "Instantly generate and print attendee badges with custom layouts and security features. Batch processing for large-scale deployments.",
  },
  {
    num: "06",
    icon: "fa-users",
    title: "Participant Management",
    text: "Manage attendee lists, registrations, approvals and communication from one place.",
  },
  {
    num: "07",
    icon: "fa-envelope",
    title: "Event Lifecycle Automation",
    text: "Configure triggers for registration confirmations, reminder emails, and post-event certificate delivery workflows.",
  },
  {
    num: "08",
    icon: "fa-shield-halved",
    title: "Multi-tenancy & security",
    text: "Enterprise-grade security keeps your event data and certificates protected at all times.",
  },
];

const initialTestimonials = [
  {
    id: 1,
    variant: "common",
    review:
      "EventoraX transformed the way we organize our annual conferences. Registration, certificates, and attendee management became effortless.",
    img: "https://randomuser.me/api/portraits/women/45.jpg",
    name: "Sarah Ahmed",
    role: "Training Coordinator • ORBIT-I",
  },
  {
    id: 2,
    variant: "featured",
    review:
      "The certificate verification system impressed both our participants and employers. Everything feels secure, modern, and professional.",
    img: "https://randomuser.me/api/portraits/men/32.jpg",
    name: "Michael Johnson",
    role: "Event Director • Tech Summit",
  },
  {
    id: 3,
    variant: "common",
    review:
      "QR ticketing reduced our check-in time from nearly thirty minutes to under five. Our attendees loved the smooth experience.",
    img: "https://randomuser.me/api/portraits/women/62.jpg",
    name: "Ayesha Khan",
    role: "University Events Office",
  },
  {
    id: 4,
    variant: "featured",
    review:
      "The certificate verification system impressed both our participants and employers. Everything feels secure, modern, and professional.",
    img: "https://randomuser.me/api/portraits/men/32.jpg",
    name: "Michael Johnson",
    role: "Event Director • Tech Summit",
  },
];

const faqItems = [
  {
    q: "What is EventoraX?",
    a: "EventoraX is an all-in-one event management platform developed by ORBIT-I that helps organizations create, manage, and automate events. From registrations and QR ticketing to certificate generation and analytics, everything is managed from one centralized dashboard.",
  },
  {
    q: "Who can use EventoraX?",
    a: "EventoraX is designed for universities, businesses, training institutes, conferences, workshops, non-profit organizations, and event organizers who want a professional and efficient way to manage their events.",
  },
  {
    q: "Can I verify certificates issued through EventoraX?",
    a: "Yes. Every certificate generated through EventoraX can be verified using a unique verification code, ensuring authenticity and helping prevent certificate fraud.",
  },
  {
    q: "What features does EventoraX offer?",
    a: "EventoraX includes event management, online registrations, QR code ticketing, digital certificate generation, ID card creation, email automation, analytics dashboards, REST API integration, and multi-tenant support for organizations.",
  },
  {
    q: "Is there a free trial available?",
    a: "Yes. EventoraX offers a free trial so you can explore its features before choosing a subscription plan. Simply create an account and start managing your events in minutes.",
  },
];

function Home() {
  // This page's CSS (home.css) is scoped under .page-home / body.page-home,
  // so add that class to <body> for the duration this page is mounted.
  useEffect(() => {
    document.body.classList.add("page-home");
    return () => document.body.classList.remove("page-home");
  }, []);

  // ---------- Scroll reveal animations (.reveal / .reveal-right) ----------
  useEffect(() => {
    const revealEls = document.querySelectorAll(".reveal, .reveal-right");

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("active");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1 }
    );

    revealEls.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, []);

  // ---------- FAQ accordion ----------
  const [openFaqIndex, setOpenFaqIndex] = useState(null);
  const answerRefs = useRef([]);

  function toggleFaq(index) {
    setOpenFaqIndex((prev) => (prev === index ? null : index));
  }

  // ---------- Testimonial slider ----------
  const [testimonials, setTestimonials] = useState(initialTestimonials);
  const [transform, setTransform] = useState("translateX(0)");
  const [transition, setTransition] = useState("transform 0.4s ease");
  const containerRef = useRef(null);
  const isAnimatingRef = useRef(false);

  function handleNext() {
    if (isAnimatingRef.current || !containerRef.current) return;
    isAnimatingRef.current = true;

    const firstCard = containerRef.current.firstElementChild;
    const cardWidth = firstCard.offsetWidth;

    setTransition("transform 0.4s ease");
    setTransform(`translateX(-${cardWidth + 35}px)`);

    setTimeout(() => {
      setTestimonials((prev) => [...prev.slice(1), prev[0]]);
      setTransition("none");
      setTransform("translateX(0)");
      isAnimatingRef.current = false;
    }, 400);
  }

  function handlePrev() {
    if (isAnimatingRef.current || !containerRef.current) return;
    isAnimatingRef.current = true;

    const lastCard = containerRef.current.lastElementChild;
    const cardWidth = lastCard.offsetWidth;

    // Move last item to the front first, jump instantly to the -1 position,
    // then animate back to 0 - mirrors the original DOM-reorder approach.
    setTestimonials((prev) => [prev[prev.length - 1], ...prev.slice(0, -1)]);
    setTransition("none");
    setTransform(`translateX(-${cardWidth + 35}px)`);

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setTransition("transform 0.4s ease");
        setTransform("translateX(0)");
      });
    });

    setTimeout(() => {
      isAnimatingRef.current = false;
    }, 400);
  }

  return (
    <div className="page-home">
      {/* ================= HERO ================= */}
        <section className="hero">
          <div className="hero-content reveal">
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
              <a href="#" className="btn primary">
                Start Free Trial
              </a>
              <a href="#" className="btn secondary">
                View Pricing
              </a>
            </div>
          </div>

          <div className="hero-image-wrapper">
            <div className="circle circle-1"></div>
            <div className="circle circle-2"></div>
            <img
              src="/dashboard.png"
              alt="Dashboard Preview"
              className="dashboard-image reveal"
            />
          </div>
        </section>

        {/* ================= STATUS CARDS ================= */}
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
            <p>ORGINAZATIONS</p>
          </div>
        </section>

        {/* ================= FEATURES SECTION ================= */}
        <section className="feature">
          <div className="container">
            <span className="section-tag">FEATURES</span>

            <h2 className="section-title">
              Everything You Need to Run
              <span>Seamless Events</span>
            </h2>

            <p className="section-description">
              EventoriaX gives you every tool required to manage events,
              engage participants, automate certificate generation, and track
              everything from one dashboard.
            </p>

            <div className="feature-grid">
              {featureCards.map((card) => (
                <div className="feature-card" key={card.num}>
                  <span className="card-number">{card.num}</span>

                  <div className="icon-box">
                    <i className={`fa-solid ${card.icon}`}></i>
                  </div>

                  <h3>{card.title}</h3>

                  <p>{card.text}</p>

                  <span className="card-line"></span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ================= STEPS SECTION ================= */}
        <section className="steps-section reveal">
          <div className="steps-container">
            <div className="steps-heading">
              <h2>Zero-to-Launch in Minutes</h2>
              <p>Streamlined workflows for busy administrators.</p>
            </div>

            <div className="steps-wrapper reveal-right">
              <div className="progress-line"></div>

              <div className="steps-grid">
                <div className="step-card">
                  <div className="step-circle">1</div>
                  <h3>Sign Up</h3>
                  <img src="/signup.png" alt="" />
                  <p>
                    Create your organizational tenant and configure your
                    primary branding and security settings.
                  </p>
                </div>

                <div className="step-card">
                  <div className="step-circle">2</div>
                  <h3>Create Event</h3>
                  <img src="/create event.png" alt="" />
                  <p>
                    Define registration fields, session schedules, and
                    ticketing tiers using our intuitive builder.
                  </p>
                </div>

                <div className="step-card">
                  <div className="step-circle">3</div>
                  <h3>Issue Certs</h3>
                  <img src="/certificates.png" alt="" />
                  <p>
                    Automate the delivery of attendance certificates or badges
                    once the event concludes.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ================= PRICING SECTION ================= */}
        <section className="pricing reveal">
          <h2 className="pricing-title">Flexible Scaling for Any Need</h2>
          <p>Simple, transparent pricing built for long-term partnerships.</p>
          <div className="pricing-cards reveal">
            {/* PRO Plan */}
            <div className="card1">
              <div className="model">
                <h3 className="plan">PRO</h3>
                <p className="price">
                  $199 <span>/mo</span>
                </p>
                <p className="desc">
                  Perfect for independent event organizers and small
                  departments.
                </p>
              </div>
              <ul className="features">
                <li>
                  <CheckIcon />
                  Up to 5 Active Events
                </li>
                <li>
                  <CheckIcon />
                  2,000 Certificates /mo
                </li>
                <li>
                  <CheckIcon />
                  Standard Analytics
                </li>
                <li>
                  <CheckIcon />
                  QR Ticket Engine
                </li>
              </ul>
              <a href="#" className="btn">
                Start 14-Day Trial
              </a>
            </div>

            {/* ENTERPRISE Plan */}
            <div className="card1 recommended">
              <div className="model">
                <div className="badge">RECOMMENDED</div>
                <h3>ENTERPRISE</h3>
                <span className="span">Custom</span>
                <p>
                  Complete multi-tenant infrastructure for universities and
                  global firms.
                </p>
              </div>
              <ul>
                <li>
                  <CheckIcon />
                  Unlimited Events & Certs
                </li>
                <li>
                  <CheckIcon />
                  Multi-tenant Sub-accounts
                </li>
                <li>
                  <CheckIcon />
                  White-label Custom Domains
                </li>
                <li>
                  <CheckIcon />
                  24/7 Dedicated Support
                </li>
              </ul>
              <a href="#" className="btn">
                Contact Sales
              </a>
            </div>
          </div>
        </section>

        {/* ================= TESTIMONIALS SECTION ================= */}
        <section className="testimonials-section">
          <div className="container">
            <div className="testimonials-header reveal">
              <h2>What Our Clients Say</h2>
              <p>Trusted by organizations and event partners worldwide</p>
            </div>

            <div className="testimonial-slider">
              <button className="nav-btn prev-btn reveal-right" onClick={handlePrev}>
                &#10094;
              </button>

              <div
                className="testimonial-container"
                ref={containerRef}
                style={{ transform, transition }}
              >
                {testimonials.map((t) => (
                  <div className={`testimonial-card ${t.variant} reveal-right`} key={t.id}>
                    <div className="quote">❝</div>
                    <p className="review">{t.review}</p>
                    <div className="user">
                      <img src={t.img} alt="" />
                      <div>
                        <h4>{t.name}</h4>
                        <span>{t.role}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <button className="nav-btn next-btn reveal-right" onClick={handleNext}>
                &#10095;
              </button>
            </div>

            {/* ================= LOGO STRIP ================= */}
            <div className="logo-strip reveal">
              <img src="/l1.png" alt="logo" />
              <img src="/l2.png" alt="logo" />
              <img src="/l3.png" alt="logo" />
              <img src="/l4.png" alt="logo" />
            </div>

            {/* ================= CTA SECTION ================= */}
            <div className="cta-box reveal">
              <h2>Ready to simplify event management?</h2>
              <p>Start your free trial and build smarter workflows.</p>
              <button className="btn-white">Start Free Trial</button>
            </div>
          </div>
        </section>

        {/* ================= LOGO WALL ================= */}
        <section className="logo-wall">
          <div className="logo-wall-container">
            <h2>TRUSTED BY LEADING INSTITUTIONS</h2>

            <div className="logo-grid">
              <div className="logo-track">
                {[1, 2, 3, 4, 5, 6, 7, 1, 2, 3, 4, 5, 6, 7].map((n, i) => (
                  <img src={`/logo${n}.png`} alt={`Logo ${n}`} key={i} />
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ================= FAQ SECTION ================= */}
        <section className="faq-section">
          <div className="faq-container faqh reveal">
            <h2>Frequently Asked Questions</h2>
            <p>
              An effective FAQ resource can educate, inform, and naturally
              guide users through our platform's content and toward the goals
              and results you have set.
            </p>
          </div>

          <div className="faq-container faql reveal-right">
            <ul className="faq-list">
              {faqItems.map((item, index) => {
                const isOpen = openFaqIndex === index;
                return (
                  <li key={item.q}>
                    <button
                      className={`faq-question ${isOpen ? "active" : ""}`}
                      onClick={() => toggleFaq(index)}
                    >
                      {item.q} <ChevronIcon />
                    </button>
                    <div
                      className={`faq-answer ${isOpen ? "open" : ""}`}
                      ref={(el) => (answerRefs.current[index] = el)}
                      style={{
                        maxHeight: isOpen
                          ? `${answerRefs.current[index]?.scrollHeight}px`
                          : null,
                      }}
                    >
                      {item.a}
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        </section>
    </div>
  );
}

export default Home;