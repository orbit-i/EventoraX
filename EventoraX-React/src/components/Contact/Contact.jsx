import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useScrollReveal } from '../hooks/useScrollReveal';
import './Contact.css';

const Contact = () => {
  const heroRef = useScrollReveal();
  const faqRef = useScrollReveal();

  const [formData, setFormData] = useState({
    fullName: '',
    organization: '',
    email: '',
    phone: '',
    eventType: '',
    attendees: '',
    budget: '',
    message: '',
    file: null,
    demo: false,
    terms: false
  });

  const [status, setStatus] = useState('');
  const [fileName, setFileName] = useState('Upload Event Brief');

  const handleChange = (e) => {
    const { name, value, type, checked, files } = e.target;
    if (type === 'file') {
      if (files.length > 0) {
        setFileName(files[0].name);
        setFormData({ ...formData, file: files[0] });
      }
    } else if (type === 'checkbox') {
      setFormData({ ...formData, [name]: checked });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setStatus('');

    // Simple validation
    if (!formData.fullName || !formData.email || !formData.message || !formData.terms) {
      setStatus('Please complete all required fields.');
      return;
    }

    setStatus('✔ Message sent successfully! We will contact you shortly.');
    setFormData({
      fullName: '',
      organization: '',
      email: '',
      phone: '',
      eventType: '',
      attendees: '',
      budget: '',
      message: '',
      file: null,
      demo: false,
      terms: false
    });
    setFileName('Upload Event Brief');
  };

  // FAQ accordion
  useEffect(() => {
    document.querySelectorAll('.faq-question').forEach((button) => {
      button.addEventListener('click', () => {
        const item = button.closest('.faq-item');
        const isActive = item.classList.contains('active');
        
        document.querySelectorAll('.faq-item').forEach((other) => {
          if (other !== item) other.classList.remove('active');
        });
        
        item.classList.toggle('active');
      });
    });
  }, []);

  const features = [
    { icon: 'fa-solid fa-bolt', title: 'Quick Response', desc: 'Replies within one business hour.' },
    { icon: 'fa-solid fa-users', title: 'Dedicated Team', desc: 'Experienced specialists for your events.' },
    { icon: 'fa-solid fa-shield-halved', title: 'Secure Platform', desc: 'Your event data is fully protected.' },
    { icon: 'fa-solid fa-calendar-check', title: '500+ Events', desc: 'Trusted by organizers across Pakistan.' },
    { icon: 'fa-solid fa-gift', title: 'Free Consultation', desc: 'Book your personalized demo today.' }
  ];

  const faqs = [
    { q: 'How can EventoriaX help manage my events?', a: 'EventoriaX provides complete event management solutions including registrations, scheduling, attendee management, payments and analytics.' },
    { q: 'Do you provide a free trial?', a: 'Yes. You can explore EventoriaX with our free trial before choosing a premium plan.' },
    { q: 'Can I customize my event pages?', a: 'Yes, you can customize branding, colors, registration forms and event details.' },
    { q: 'Is my event data secure?', a: 'EventoriaX uses secure infrastructure to protect your event information.' }
  ];

  return (
    <main>
      <section className="contact-hero" ref={heroRef}>
        <div className="container">
          <div className="contact-hero-content">
            <span className="hero-badge">
              <i className="fa-solid fa-comments"></i>
              Get In Touch
            </span>
            <h1>
              Let's Build Your Next
              <span>Event</span>
              Together
            </h1>
            <p>
              Have questions or want a demo? Our team is here to help you create
              unforgettable events.
            </p>
            <div className="reply-info">
              <i className="fa-solid fa-bolt"></i>
              We usually respond within <strong>1 business hour.</strong>
            </div>
          </div>
        </div>
      </section>

      <section className="contact-main">
        <div className="container">
          <div className="contact-grid">
            <aside className="why-card">
              <h3>Why Choose &nbsp; <span>EventoriaX?</span></h3>
              <p>Everything you need to manage successful events with confidence.</p>
              {features.map((feature, index) => (
                <div className="feature-item" key={index}>
                  <div className="icon-box">
                    <i className={feature.icon}></i>
                  </div>
                  <div>
                    <h4>{feature.title}</h4>
                    <p>{feature.desc}</p>
                  </div>
                </div>
              ))}
            </aside>

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
                      name="fullName"
                      placeholder="Full Name *"
                      required
                      value={formData.fullName}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="input-group">
                    <input
                      type="text"
                      name="organization"
                      placeholder="Company/Organization *"
                      value={formData.organization}
                      onChange={handleChange}
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="input-group">
                    <input
                      type="email"
                      name="email"
                      placeholder="Email Address *"
                      required
                      value={formData.email}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="input-group">
                    <input
                      type="tel"
                      name="phone"
                      placeholder="Phone Number *"
                      value={formData.phone}
                      onChange={handleChange}
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="input-group">
                    <select
                      name="eventType"
                      aria-label="event type"
                      value={formData.eventType}
                      onChange={handleChange}
                    >
                      <option selected disabled>Event Type *</option>
                      <option>Conference</option>
                      <option>Seminar</option>
                      <option>Workshop</option>
                      <option>Wedding</option>
                      <option>Concert</option>
                      <option>Sports Event</option>
                      <option>Corporate Meeting</option>
                      <option>University Event</option>
                      <option>Other</option>
                    </select>
                  </div>
                  <div className="input-group">
                    <input
                      type="number"
                      name="attendees"
                      placeholder="Expected Attendees"
                      value={formData.attendees}
                      onChange={handleChange}
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="input-group">
                    <select
                      name="budget"
                      aria-label="budget"
                      value={formData.budget}
                      onChange={handleChange}
                    >
                      <option selected disabled>Budget Range</option>
                      <option>Under PKR 50,000</option>
                      <option>PKR 50k - 100k</option>
                      <option>PKR 100k - 250k</option>
                      <option>PKR 250k - 500k</option>
                      <option>Above PKR 500k</option>
                    </select>
                  </div>
                </div>

                <div className="input-group full-width">
                  <textarea
                    rows="7"
                    name="message"
                    placeholder="Tell us about your event requirements..."
                    required
                    value={formData.message}
                    onChange={handleChange}
                  ></textarea>
                </div>

                <div className="upload-box" id="uploadBox">
                  <input
                    type="file"
                    id="fileUpload"
                    name="file"
                    hidden
                    onChange={handleChange}
                  />
                  <label htmlFor="fileUpload">
                    <div className="upload-icon">
                      <i className="fa-solid fa-cloud-arrow-up"></i>
                    </div>
                    <h4>{fileName}</h4>
                    <p>
                      Drag & Drop your proposal here
                      <br />
                      or
                      <span>Browse Files</span>
                    </p>
                    <small>PDF, DOC, DOCX (Max 10MB)</small>
                  </label>
                </div>

                <div className="demo-toggle">
                  <label className="switch">
                    <input
                      type="checkbox"
                      name="demo"
                      checked={formData.demo}
                      onChange={handleChange}
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
                      name="terms"
                      required
                      checked={formData.terms}
                      onChange={handleChange}
                    />
                    I agree to the
                    <a href="#">Privacy Policy</a>
                    and
                    <a href="#">Terms of Service</a>.
                  </label>
                </div>

                <button className="send-btn" type="submit">
                  <span>Send Message</span>
                  <i className="fa-solid fa-paper-plane"></i>
                </button>

                {status && <p className="form-status">{status}</p>}
              </form>
            </div>

            <aside className="contact-info-card">
              <h3>Contact Information</h3>
              <div className="info-item">
                <i className="fa-solid fa-phone"></i>
                <div>
                  <h4>Phone</h4>
                  <p>+92 300 1234567</p>
                </div>
              </div>
              <div className="info-item">
                <i className="fa-solid fa-envelope"></i>
                <div>
                  <h4>Email</h4>
                  <p>hello@eventoriax.com</p>
                </div>
              </div>
              <div className="info-item">
                <i className="fa-solid fa-location-dot"></i>
                <div>
                  <h4>Location</h4>
                  <p>Lahore, Pakistan</p>
                </div>
              </div>

              <hr />

              <h3>Follow Us</h3>
              <div className="social-icons">
                <a href="#"><i className="fab fa-linkedin-in"></i></a>
                <a href="#"><i className="fab fa-instagram"></i></a>
                <a href="#"><i className="fab fa-facebook-f"></i></a>
                <a href="#"><i className="fab fa-youtube"></i></a>
                <a href="#"><i className="fab fa-x-twitter"></i></a>
              </div>
            </aside>
          </div>
        </div>
      </section>

      <section className="contact-faq" ref={faqRef}>
        <div className="container">
          <div className="section-title">
            <span className="small-badge">
              <i className="fa-solid fa-circle-question"></i>
              FAQ
            </span>
            <h2>
              Frequently Asked
              <span>Questions</span>
            </h2>
            <p>Everything you need to know about EventoriaX.</p>
          </div>

          <div className="faq-wrapper">
            {faqs.map((faq, index) => (
              <div className="faq-item reveal" key={index}>
                <button className="faq-question">
                  {faq.q}
                  <i className="fa-solid fa-plus"></i>
                </button>
                <div className="faq-answer">
                  <p>{faq.a}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
};

export default Contact;