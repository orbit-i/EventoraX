import { useEffect } from "react";
import "../styles/features.css";

const features = [
  {
    number: "01",
    title: "Event Management",
    text: "Create, organize and manage events of every size with powerful tools and automation.",
    img: "/event management.png",
    reverse: false,
  },
  {
    number: "02",
    title: "Certificate System",
    text: "Design, issue and verify professional certificates in seconds with automation.",
    img: "/certificate system.jpg",
    reverse: true,
  },
  {
    number: "03",
    title: "QR Ticketing & Scanner",
    text: "Generate secure QR tickets and scan attendees instantly using any device.",
    img: "/qr ticket system.jpg",
    reverse: false,
  },
  {
    number: "04",
    title: "ID Card Generator",
    text: "Create professional ID cards for participants, speakers and staff in minutes.",
    img: "/id card.webp",
    reverse: true,
  },
  {
    number: "05",
    title: "Analytics & Reports",
    text: "Get clear insight into registerations, attendance, certificates and event performance.",
    img: "/analysis and reports.jfif",
    reverse: false,
  },
  {
    number: "06",
    title: "Email Automation",
    text: "Sent the right emails at the right time with automation and smart triggers.",
    img: "/email auto.jpeg",
    reverse: true,
  },
  {
    number: "07",
    title: "Reset API",
    text: "Integrate EventoriaX with your own systems using our powerful Reset API.",
    img: "/reset api.jfif",
    reverse: false,
  },
  {
    number: "08",
    title: "Multi-tenancy & security",
    text: "Built for scale isolated, secure and reliable for every organization.",
    img: "/security.jpeg",
    reverse: true,
  },
];

function Features() {
  useEffect(() => {
    document.body.classList.add("page-features");
    return () => document.body.classList.remove("page-features");
  }, []);

  return (
    <div className="page-features">
      {/* ================= HERO ================= */}
      <section className="pricing-hero">
        <div className="hero-content">
          <div className="hero-left">
            <div className="tag">ALL FEATURES</div>

            <h1>
              Everything you need to run
              <br />
              <span> events effortlessly </span>
            </h1>

            <p>
              Powerful tools. Smart automation. Real-time analytics.
              Everything your organization needs to manage events from
              registration to certificates in one platform.
            </p>

            <div className="hero-buttons">
              <button className="primary">Explore Features →</button>
              <button className="secondary">Watch Demo</button>
            </div>
          </div>
        </div>
      </section>

      {/* ================= FEATURES LIST ================= */}
      <section>
        <div className="features-head" id="features">
          <div className="tag ftag">FEATURES</div>
          <h2>EventoriaX Features</h2>
          <p>
            Our innovative, future‑ready features make your event management
            effortless — ensuring a seamless experience without any hurdles.
          </p>
        </div>

        {features.map((f) => (
          <div className={`feature ${f.reverse ? "reverse" : ""}`} key={f.number}>
            <div className="feature-image">
              <img src={f.img} alt="" />
            </div>

            <div className="feature-card">
              <span className="number">{f.number}</span>
              <h2>{f.title}</h2>
              <div className="line"></div>
              <p>{f.text}</p>
              <a href="#"> → </a>
            </div>
          </div>
        ))}
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

      {/* ================= CTA ================= */}
      <section className="cta">
        <h2>Ready to simplify event management?</h2>
        <p>Start your free trial and build smarter workflows.</p>
        <button className="btn-white">Start Free Trial</button>
      </section>
    </div>
  );
}

export default Features;