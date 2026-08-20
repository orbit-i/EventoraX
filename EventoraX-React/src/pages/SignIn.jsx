import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import "../styles/SignIn.css";

function SignIn() {
  useEffect(() => {
    document.body.classList.add("page-signin");
    return () => document.body.classList.remove("page-signin");
  }, []);

  const [form, setForm] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");

  function updateField(name, value) {
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  }

  function validate() {
    const newErrors = {};
    if (!form.email.trim()) newErrors.email = "Email is required.";
    else if (!/\S+@\S+\.\S+/.test(form.email)) newErrors.email = "Enter a valid email.";
    if (!form.password) newErrors.password = "Password is required.";
    else if (form.password.length < 6) newErrors.password = "Password must be at least 6 characters.";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    setStatus("");
    // Simulate API call
    setTimeout(() => {
      setLoading(false);
      setStatus("success");
    }, 1500);
  }

  return (
    <div className="page-signin">
      <div className="signin-container">
        {/* ── Left Panel ── */}
        <div className="signin-left">
          <div className="signin-left-inner">
            <div className="signin-brand">
              <div className="brand-icon">E</div>
              <span>EventoraX</span>
            </div>

            <h1>
              Welcome back to<br />
              <span>EventoraX</span>
            </h1>

            <p className="signin-subtitle">
              Sign in to manage your events, certificates, and attendees from one powerful dashboard.
            </p>

            <div className="signin-features">
              <div className="feature-item">
                <div className="feature-icon">
                  <i className="fa-solid fa-calendar-check"></i>
                </div>
                <div>
                  <h4>Manage Events</h4>
                  <p>Create and track all your events in one place.</p>
                </div>
              </div>
              <div className="feature-item">
                <div className="feature-icon">
                  <i className="fa-solid fa-certificate"></i>
                </div>
                <div>
                  <h4>Issue Certificates</h4>
                  <p>Automated certificates with instant delivery.</p>
                </div>
              </div>
              <div className="feature-item">
                <div className="feature-icon">
                  <i className="fa-solid fa-qrcode"></i>
                </div>
                <div>
                  <h4>QR Ticketing</h4>
                  <p>Seamless check-in with secure QR codes.</p>
                </div>
              </div>
            </div>

            <div className="signin-stats">
              <div>
                <strong>12K+</strong>
                <span>Registrations</span>
              </div>
              <div>
                <strong>50K+</strong>
                <span>Certificates</span>
              </div>
              <div>
                <strong>300+</strong>
                <span>Organizations</span>
              </div>
            </div>
          </div>
        </div>

        {/* ── Right Panel (Form) ── */}
        <div className="signin-right">
          <div className="signin-form-wrap">
            <div className="form-header">
              <h2>Sign In</h2>
              <p>Access your EventoraX dashboard</p>
            </div>

            {status === "success" ? (
              <div className="success-state">
                <div className="success-icon">
                  <i className="fa-solid fa-circle-check"></i>
                </div>
                <h3>Signed in successfully!</h3>
                <p>Redirecting you to your dashboard…</p>
              </div>
            ) : (
              <form className="signin-form" onSubmit={handleSubmit} noValidate>
                {/* Social login */}
                <div className="social-login">
                  <button type="button" className="social-btn">
                    <svg viewBox="0 0 24 24" width="20" height="20">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                    Continue with Google
                  </button>
                </div>

                <div className="divider">
                  <span>or sign in with email</span>
                </div>

                {/* Email */}
                <div className={`input-group${errors.email ? " has-error" : ""}`}>
                  <label htmlFor="signin-email">Email Address</label>
                  <div className="input-wrap">
                    <i className="fa-solid fa-envelope input-icon"></i>
                    <input
                      id="signin-email"
                      type="email"
                      placeholder="hello@organization.com"
                      value={form.email}
                      onChange={(e) => updateField("email", e.target.value)}
                      autoComplete="email"
                    />
                  </div>
                  {errors.email && <span className="error-msg">{errors.email}</span>}
                </div>

                {/* Password */}
                <div className={`input-group${errors.password ? " has-error" : ""}`}>
                  <div className="label-row">
                    <label htmlFor="signin-password">Password</label>
                    <a href="#" className="forgot-link">Forgot password?</a>
                  </div>
                  <div className="input-wrap">
                    <i className="fa-solid fa-lock input-icon"></i>
                    <input
                      id="signin-password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter your password"
                      value={form.password}
                      onChange={(e) => updateField("password", e.target.value)}
                      autoComplete="current-password"
                    />
                    <button
                      type="button"
                      className="toggle-password"
                      onClick={() => setShowPassword((v) => !v)}
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      <i className={`fa-solid ${showPassword ? "fa-eye-slash" : "fa-eye"}`}></i>
                    </button>
                  </div>
                  {errors.password && <span className="error-msg">{errors.password}</span>}
                </div>

                {/* Remember me */}
                <div className="remember-row">
                  <label className="checkbox-label">
                    <input type="checkbox" />
                    <span>Remember me for 30 days</span>
                  </label>
                </div>

                {/* Submit */}
                <button type="submit" className="submit-btn" disabled={loading}>
                  {loading ? (
                    <>
                      <span className="spinner"></span>
                      Signing in…
                    </>
                  ) : (
                    <>
                      Sign In
                      <i className="fa-solid fa-arrow-right"></i>
                    </>
                  )}
                </button>

                <p className="signup-prompt">
                  Don't have an account?{" "}
                  <Link to="/contact">Get started free</Link>
                </p>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default SignIn;
