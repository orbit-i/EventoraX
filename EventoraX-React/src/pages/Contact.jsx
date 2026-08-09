import { useEffect, useRef, useState } from "react";
import "../styles/contact.css";

const whyFeatures = [
  {
    icon: "fa-solid fa-bolt",
    title: "Quick Response",
    text: "Replies within one business hour.",
  },
  {
    icon: "fa-solid fa-users",
    title: "Dedicated Team",
    text: "Experienced specialists for your events.",
  },
  {
    icon: "fa-solid fa-shield-halved",
    title: "Secure Platform",
    text: "Your event data is fully protected.",
  },
  {
    icon: "fa-solid fa-calendar-check",
    title: "500+ Events",
    text: "Trusted by organizers across Pakistan.",
  },
  {
    icon: "fa-solid fa-gift",
    title: "Free Consultation",
    text: "Book your personalized demo today.",
  },
];

const eventTypeOptions = [
  "Conference",
  "Seminar",
  "Workshop",
  "Wedding",
  "Concert",
  "Sports Event",
  "Corporate Meeting",
  "University Event",
  "Other",
];

const budgetOptions = [
  "Under PKR 50,000",
  "PKR 50k - 100k",
  "PKR 100k - 250k",
  "PKR 250k - 500k",
  "Above PKR 500k",
];

const infoItems = [
  { icon: "fa-solid fa-phone", title: "Phone", text: "+92 300 1234567" },
  { icon: "fa-solid fa-envelope", title: "Email", text: "hello@eventoriax.com" },
  { icon: "fa-solid fa-location-dot", title: "Location", text: "Lahore, Pakistan" },
];

const socialIcons = [
  "fab fa-linkedin-in",
  "fab fa-instagram",
  "fab fa-facebook-f",
  "fab fa-youtube",
  "fab fa-x-twitter",
];

const faqItems = [
  {
    q: "How can EventoriaX help manage my events?",
    a: "EventoriaX provides complete event management solutions including registrations, scheduling, attendee management, payments and analytics.",
  },
  {
    q: "Do you provide a free trial?",
    a: "Yes. You can explore EventoriaX with our free trial before choosing a premium plan.",
  },
  {
    q: "Can I customize my event pages?",
    a: "Yes, you can customize branding, colors, registration forms and event details.",
  },
  {
    q: "Is my event data secure?",
    a: "EventoriaX uses secure infrastructure to protect your event information.",
  },
];

const initialForm = {
  fullName: "",
  company: "",
  email: "",
  phone: "",
  eventType: "",
  attendees: "",
  budget: "",
  message: "",
  demo: false,
  terms: false,
};

function Contact() {
  useEffect(() => {
    document.body.classList.add("page-contact");
    return () => document.body.classList.remove("page-contact");
  }, []);

  const [formData, setFormData] = useState(initialForm);
  const [errors, setErrors] = useState({});
  const [fileName, setFileName] = useState("Upload Event Brief");
  const [dragActive, setDragActive] = useState(false);
  const [status, setStatus] = useState({ text: "", success: false });
  const [ripples, setRipples] = useState([]);
  const [openFaq, setOpenFaq] = useState(null);

  const fileInputRef = useRef(null);

  function updateField(name, value) {
    setFormData((prev) => ({ ...prev, [name]: value }));
    // clear error as soon as the field has a value, matching original behavior
    if (errors[name] && String(value).trim() !== "") {
      setErrors((prev) => ({ ...prev, [name]: false }));
    }
  }

  function handleFileChange(e) {
    const files = e.target.files;
    if (files && files.length > 0) {
      setFileName(files[0].name);
    }
  }

  function handleDrop(e) {
    e.preventDefault();
    setDragActive(false);
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      if (fileInputRef.current) fileInputRef.current.files = files;
      setFileName(files[0].name);
    }
  }

  function validateForm() {
    const requiredFields = ["fullName", "email", "message", "terms"];
    const newErrors = {};
    let valid = true;

    requiredFields.forEach((field) => {
      const value = formData[field];
      if (field === "terms") {
        if (!value) {
          newErrors[field] = true;
          valid = false;
        }
      } else if (String(value).trim() === "") {
        newErrors[field] = true;
        valid = false;
      }
    });

    setErrors(newErrors);
    return valid;
  }

  function handleRipple(e) {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const id = Date.now();
    setRipples((prev) => [...prev, { id, x, y }]);
    setTimeout(() => {
      setRipples((prev) => prev.filter((r) => r.id !== id));
    }, 600);
  }

  function handleSubmit(e) {
    e.preventDefault();

    if (!validateForm()) {
      setStatus({ text: "Please complete all required fields.", success: false });
      return;
    }

    setStatus({
      text: "✔ Message sent successfully! We will contact you shortly.",
      success: true,
    });

    setFormData(initialForm);
    setFileName("Upload Event Brief");
    setErrors({});
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function handleFocus(e) {
    e.currentTarget.parentElement.style.transform = "translateY(-3px)";
  }

  function handleBlur(e) {
    e.currentTarget.parentElement.style.transform = "translateY(0px)";
  }

  function toggleFaq(index) {
    setOpenFaq((prev) => (prev === index ? null : index));
  }

  return (
    <div className="page-contact">
      {/* ================= CONTACT HERO ================= */}
      <section className="contact-hero">
        <div className="container">
          <div className="contact-hero-content">
            <span className="hero-badge">
              <i className="fa-solid fa-comments"></i>
              Get In Touch
            </span>

            <h1>
              Let's Build Your Next
              <span> Event </span>
              Together
            </h1>

            <p>
              Have questions or want a demo? Our team is here to help you
              create unforgettable events.
            </p>

            <div className="reply-info">
              <i className="fa-solid fa-bolt"></i>
              We usually respond within <strong>1 business hour.</strong>
            </div>
          </div>
        </div>
      </section>

      {/* ================= CONTACT SECTION ================= */}
      <section className="contact-main">
        <div className="container">
          <div className="contact-grid">
            {/* ================= LEFT ================= */}
            <aside className="why-card">
              <h3>
                Why Choose &nbsp; <span>EventoriaX?</span>
              </h3>
              <p>
                Everything you need to manage successful events with
                confidence.
              </p>

              {whyFeatures.map((f) => (
                <div className="feature-item" key={f.title}>
                  <div className="icon-box">
                    <i className={f.icon}></i>
                  </div>
                  <div>
                    <h4>{f.title}</h4>
                    <p>{f.text}</p>
                  </div>
                </div>
              ))}
            </aside>

            {/* ================= CENTER (FORM) ================= */}
            <div className="contact-form-card">
              <div className="card-heading">
                <h3>Send Us a Message</h3>
                <p>Fill out the form and we'll contact you shortly.</p>
              </div>

              <form className="eventoriax-contact-form" onSubmit={handleSubmit}>
                <div className="form-row">
                  <div className="input-group">
                    <input
                      type="text"
                      placeholder="Full Name *"
                      value={formData.fullName}
                      onChange={(e) => updateField("fullName", e.target.value)}
                      onFocus={handleFocus}
                      onBlur={handleBlur}
                      className={errors.fullName ? "input-error" : formData.fullName ? "input-success" : ""}
                    />
                  </div>

                  <div className="input-group">
                    <input
                      type="text"
                      placeholder="company/organization*"
                      value={formData.company}
                      onChange={(e) => updateField("company", e.target.value)}
                      onFocus={handleFocus}
                      onBlur={handleBlur}
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="input-group">
                    <input
                      type="email"
                      placeholder="Email Address *"
                      value={formData.email}
                      onChange={(e) => updateField("email", e.target.value)}
                      onFocus={handleFocus}
                      onBlur={handleBlur}
                      className={errors.email ? "input-error" : formData.email ? "input-success" : ""}
                    />
                  </div>

                  <div className="input-group">
                    <input
                      type="tel"
                      placeholder="Phone Number *"
                      value={formData.phone}
                      onChange={(e) => updateField("phone", e.target.value)}
                      onFocus={handleFocus}
                      onBlur={handleBlur}
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="input-group">
                    <select
                      aria-label="event type"
                      value={formData.eventType}
                      onChange={(e) => updateField("eventType", e.target.value)}
                      onFocus={handleFocus}
                      onBlur={handleBlur}
                    >
                      <option value="" disabled>
                        Event Type *
                      </option>
                      {eventTypeOptions.map((opt) => (
                        <option key={opt}>{opt}</option>
                      ))}
                    </select>
                  </div>

                  <div className="input-group">
                    <input
                      type="number"
                      placeholder="Expected Attendees"
                      value={formData.attendees}
                      onChange={(e) => updateField("attendees", e.target.value)}
                      onFocus={handleFocus}
                      onBlur={handleBlur}
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="input-group">
                    <select
                      aria-label="budget"
                      value={formData.budget}
                      onChange={(e) => updateField("budget", e.target.value)}
                      onFocus={handleFocus}
                      onBlur={handleBlur}
                    >
                      <option value="" disabled>
                        Budget Range
                      </option>
                      {budgetOptions.map((opt) => (
                        <option key={opt}>{opt}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="input-group full-width">
                  <textarea
                    rows="7"
                    placeholder="Tell us about your event requirements..."
                    value={formData.message}
                    onChange={(e) => updateField("message", e.target.value)}
                    onFocus={handleFocus}
                    onBlur={handleBlur}
                    className={errors.message ? "input-error" : formData.message ? "input-success" : ""}
                  ></textarea>
                </div>

                <div
                  className="upload-box"
                  id="uploadBox"
                  onDragEnter={(e) => {
                    e.preventDefault();
                    setDragActive(true);
                  }}
                  onDragOver={(e) => {
                    e.preventDefault();
                    setDragActive(true);
                  }}
                  onDragLeave={(e) => {
                    e.preventDefault();
                    setDragActive(false);
                  }}
                  onDrop={handleDrop}
                  style={
                    dragActive
                      ? { borderColor: "#7C4DFF", transform: "scale(1.02)", background: "#f6f1ff" }
                      : fileName !== "Upload Event Brief"
                      ? { borderColor: "#7C4DFF", background: "#f6f1ff" }
                      : {}
                  }
                >
                  <input
                    type="file"
                    id="fileUpload"
                    hidden
                    ref={fileInputRef}
                    onChange={handleFileChange}
                  />
                  <label htmlFor="fileUpload">
                    <div className="upload-icon">
                      <i className="fa-solid fa-cloud-arrow-up"></i>
                    </div>
                    <h4>{fileName}</h4>
                    <p>
                      Drag & Drop your proposal here
                      <br />
                      or <span>Browse Files</span>
                    </p>
                    <small> PDF, DOC, DOCX (Max 10MB) </small>
                  </label>
                </div>

                <div className="demo-toggle">
                  <label className="switch">
                    <input
                      type="checkbox"
                      checked={formData.demo}
                      onChange={(e) => updateField("demo", e.target.checked)}
                    />
                    <span className="slider"></span>
                  </label>
                  <div>
                    <h5>Request a Free Demo</h5>
                    <p>Schedule a personalized walkthrough of EventoriaX.</p>
                  </div>
                </div>

                <div className="terms-check">
                  <label>
                    <input
                      type="checkbox"
                      checked={formData.terms}
                      onChange={(e) => updateField("terms", e.target.checked)}
                      className={errors.terms ? "input-error" : ""}
                    />
                    I agree to the <a href="#">Privacy Policy</a> and{" "}
                    <a href="#">Terms of Service</a>.
                  </label>
                </div>

                <button className="send-btn" type="submit" onClick={handleRipple}>
                  <span> Send Message </span>
                  <i className="fa-solid fa-paper-plane"></i>
                  {ripples.map((r) => (
                    <span
                      key={r.id}
                      className="ripple"
                      style={{ left: r.x, top: r.y }}
                    ></span>
                  ))}
                </button>

                <p
                  className="form-status"
                  style={{ color: status.success ? "#27ae60" : "#ff4d6d" }}
                >
                  {status.text}
                </p>
              </form>
            </div>

            {/* ================= RIGHT ================= */}
            <aside className="contact-info-card">
              <h3>Contact Information</h3>

              {infoItems.map((item) => (
                <div className="info-item" key={item.title}>
                  <i className={item.icon}></i>
                  <div>
                    <h4>{item.title}</h4>
                    <p>{item.text}</p>
                  </div>
                </div>
              ))}

              <hr />

              <h3>Follow Us</h3>

              <div className="social-icons">
                {socialIcons.map((icon) => (
                  <a href="#" key={icon}>
                    <i className={icon}></i>
                  </a>
                ))}
              </div>
            </aside>
          </div>
        </div>
      </section>

      {/* ================= FAQ SECTION ================= */}
      <section className="contact-faq">
        <div className="faq-bg">
          <span className="faq-circle circle-a"></span>
          <span className="faq-circle circle-b"></span>
        </div>

        <div className="container">
          <div className="section-title reveal">
            <span className="small-badge">
              <i className="fa-solid fa-circle-question"></i>
              FAQ
            </span>

            <h2>
              Frequently Asked
              <span> Questions</span>
            </h2>

            <p>Everything you need to know about EventoriaX.</p>
          </div>

          <div className="faq-wrapper">
            {faqItems.map((item, index) => {
              const isOpen = openFaq === index;
              return (
                <div className={`faq-item reveal ${isOpen ? "active" : ""}`} key={item.q}>
                  <button className="faq-question" onClick={() => toggleFaq(index)}>
                    {item.q}
                    <i className="fa-solid fa-plus"></i>
                  </button>
                  <div className="faq-answer">
                    <p>{item.a}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
}

export default Contact;