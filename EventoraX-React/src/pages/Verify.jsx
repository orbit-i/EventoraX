import { useEffect, useState } from "react";
import "../styles/Verify.css";

// Mock certificate data for demo
const MOCK_CERTIFICATES = {
  "EVX-2024-001": {
    id: "EVX-2024-001",
    recipientName: "Ahmed Hassan",
    eventName: "National Tech Conference 2024",
    issuedBy: "EventoraX / ORBIT-I",
    issuedDate: "December 15, 2024",
    certificateType: "Certificate of Participation",
    status: "valid",
  },
  "EVX-2024-002": {
    id: "EVX-2024-002",
    recipientName: "Sara Ahmed",
    eventName: "Leadership Summit 2024",
    issuedBy: "EventoraX / ORBIT-I",
    issuedDate: "November 20, 2024",
    certificateType: "Certificate of Achievement",
    status: "valid",
  },
};

function Verify() {
  useEffect(() => {
    document.body.classList.add("page-verify");
    return () => document.body.classList.remove("page-verify");
  }, []);

  const [code, setCode] = useState("");
  const [result, setResult] = useState(null); // null | "loading" | { found: bool, data: obj }
  const [error, setError] = useState("");

  function handleVerify(e) {
    e.preventDefault();
    const trimmed = code.trim().toUpperCase();
    if (!trimmed) {
      setError("Please enter a certificate ID or verification code.");
      return;
    }
    setError("");
    setResult("loading");

    setTimeout(() => {
      const cert = MOCK_CERTIFICATES[trimmed];
      if (cert) {
        setResult({ found: true, data: cert });
      } else {
        setResult({ found: false, data: null });
      }
    }, 1200);
  }

  function handleReset() {
    setCode("");
    setResult(null);
    setError("");
  }

  return (
    <div className="page-verify">
      {/* ── Hero ── */}
      <section className="verify-hero">
        <div className="verify-hero-inner">
          <span className="verify-badge">
            <i className="fa-solid fa-shield-halved"></i>
            Certificate Verification
          </span>

          <h1>
            Verify Your<br />
            <span>EventoraX Certificate</span>
          </h1>

          <p>
            Instantly check the authenticity of any certificate issued through
            EventoraX. Every certificate is cryptographically secured and
            tamper-proof.
          </p>
        </div>

        {/* Decorative circles */}
        <div className="hero-circle hero-circle-1"></div>
        <div className="hero-circle hero-circle-2"></div>
      </section>

      {/* ── Verify form ── */}
      <section className="verify-main">
        <div className="verify-container">
          {/* Search card */}
          <div className="verify-card">
            <div className="verify-card-header">
              <div className="verify-icon-wrap">
                <i className="fa-solid fa-magnifying-glass"></i>
              </div>
              <div>
                <h2>Enter Certificate ID</h2>
                <p>Find the ID printed on your certificate (e.g. EVX-2024-001)</p>
              </div>
            </div>

            <form className="verify-form" onSubmit={handleVerify}>
              <div className={`verify-input-wrap${error ? " has-error" : ""}`}>
                <i className="fa-solid fa-id-card input-icon"></i>
                <input
                  type="text"
                  placeholder="e.g. EVX-2024-001"
                  value={code}
                  onChange={(e) => {
                    setCode(e.target.value);
                    if (error) setError("");
                    if (result) setResult(null);
                  }}
                  autoComplete="off"
                  spellCheck="false"
                />
                {code && (
                  <button type="button" className="clear-btn" onClick={handleReset}>
                    <i className="fa-solid fa-xmark"></i>
                  </button>
                )}
              </div>
              {error && <span className="verify-error">{error}</span>}

              <button type="submit" className="verify-btn" disabled={result === "loading"}>
                {result === "loading" ? (
                  <>
                    <span className="spinner"></span>
                    Verifying…
                  </>
                ) : (
                  <>
                    <i className="fa-solid fa-shield-halved"></i>
                    Verify Certificate
                  </>
                )}
              </button>
            </form>

            {/* Demo hint */}
            <p className="demo-hint">
              <i className="fa-solid fa-circle-info"></i>
              Try demo IDs: <button onClick={() => setCode("EVX-2024-001")}>EVX-2024-001</button> or <button onClick={() => setCode("EVX-2024-002")}>EVX-2024-002</button>
            </p>
          </div>

          {/* ── Results ── */}
          {result && result !== "loading" && (
            <div className={`verify-result ${result.found ? "result-valid" : "result-invalid"}`}>
              {result.found ? (
                <>
                  <div className="result-header">
                    <div className="result-status-icon valid">
                      <i className="fa-solid fa-circle-check"></i>
                    </div>
                    <div>
                      <h3>Certificate Verified</h3>
                      <p>This certificate is authentic and issued by EventoraX.</p>
                    </div>
                  </div>

                  <div className="cert-details">
                    <div className="cert-row">
                      <span className="cert-label">
                        <i className="fa-solid fa-user"></i>
                        Recipient
                      </span>
                      <span className="cert-value">{result.data.recipientName}</span>
                    </div>
                    <div className="cert-row">
                      <span className="cert-label">
                        <i className="fa-solid fa-award"></i>
                        Certificate Type
                      </span>
                      <span className="cert-value">{result.data.certificateType}</span>
                    </div>
                    <div className="cert-row">
                      <span className="cert-label">
                        <i className="fa-solid fa-calendar-days"></i>
                        Event
                      </span>
                      <span className="cert-value">{result.data.eventName}</span>
                    </div>
                    <div className="cert-row">
                      <span className="cert-label">
                        <i className="fa-solid fa-building"></i>
                        Issued By
                      </span>
                      <span className="cert-value">{result.data.issuedBy}</span>
                    </div>
                    <div className="cert-row">
                      <span className="cert-label">
                        <i className="fa-solid fa-clock"></i>
                        Issue Date
                      </span>
                      <span className="cert-value">{result.data.issuedDate}</span>
                    </div>
                    <div className="cert-row">
                      <span className="cert-label">
                        <i className="fa-solid fa-fingerprint"></i>
                        Certificate ID
                      </span>
                      <span className="cert-value cert-id">{result.data.id}</span>
                    </div>
                  </div>

                  <div className="result-footer valid-footer">
                    <i className="fa-solid fa-lock"></i>
                    Secured by EventoraX Blockchain Verification
                  </div>
                </>
              ) : (
                <>
                  <div className="result-header">
                    <div className="result-status-icon invalid">
                      <i className="fa-solid fa-circle-xmark"></i>
                    </div>
                    <div>
                      <h3>Certificate Not Found</h3>
                      <p>No certificate found with the ID "<strong>{code.trim().toUpperCase()}</strong>". Please check the ID and try again.</p>
                    </div>
                  </div>

                  <div className="invalid-tips">
                    <h4>Things to check:</h4>
                    <ul>
                      <li><i className="fa-solid fa-check"></i> Make sure you entered the exact ID from your certificate</li>
                      <li><i className="fa-solid fa-check"></i> The ID is case-insensitive (EVX-2024-001)</li>
                      <li><i className="fa-solid fa-check"></i> Contact the event organizer if you believe this is an error</li>
                    </ul>
                  </div>

                  <button className="try-again-btn" onClick={handleReset}>
                    <i className="fa-solid fa-rotate-left"></i>
                    Try Again
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </section>

      {/* ── How it works ── */}
      <section className="how-it-works">
        <div className="hiw-container">
          <span className="hiw-badge">HOW IT WORKS</span>
          <h2>Certificate Verification in 3 Steps</h2>
          <p>Our verification system ensures every certificate is genuine and traceable.</p>

          <div className="hiw-steps">
            <div className="hiw-step">
              <div className="hiw-number">01</div>
              <div className="hiw-icon">
                <i className="fa-solid fa-id-card"></i>
              </div>
              <h3>Find Your ID</h3>
              <p>Locate the unique certificate ID printed on your certificate document.</p>
            </div>
            <div className="hiw-arrow">
              <i className="fa-solid fa-arrow-right"></i>
            </div>
            <div className="hiw-step">
              <div className="hiw-number">02</div>
              <div className="hiw-icon">
                <i className="fa-solid fa-keyboard"></i>
              </div>
              <h3>Enter the ID</h3>
              <p>Type or paste the certificate ID into the search box above.</p>
            </div>
            <div className="hiw-arrow">
              <i className="fa-solid fa-arrow-right"></i>
            </div>
            <div className="hiw-step">
              <div className="hiw-number">03</div>
              <div className="hiw-icon">
                <i className="fa-solid fa-circle-check"></i>
              </div>
              <h3>Instant Result</h3>
              <p>Get immediate confirmation of the certificate's authenticity and details.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Trust features ── */}
      <section className="verify-trust">
        <div className="hiw-container">
          <div className="trust-grid">
            <div className="trust-item">
              <div className="trust-icon">
                <i className="fa-solid fa-lock"></i>
              </div>
              <h3>Tamper-Proof</h3>
              <p>Every certificate is cryptographically secured and cannot be forged or altered.</p>
            </div>
            <div className="trust-item">
              <div className="trust-icon">
                <i className="fa-solid fa-bolt"></i>
              </div>
              <h3>Instant Verification</h3>
              <p>Results are returned in real-time from our secure certificate database.</p>
            </div>
            <div className="trust-item">
              <div className="trust-icon">
                <i className="fa-solid fa-globe"></i>
              </div>
              <h3>Globally Accessible</h3>
              <p>Verify certificates from anywhere in the world, 24/7, at no cost.</p>
            </div>
            <div className="trust-item">
              <div className="trust-icon">
                <i className="fa-solid fa-file-shield"></i>
              </div>
              <h3>Audit Trail</h3>
              <p>Every verification request is logged to maintain a complete audit history.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="verify-cta">
        <h2>Issue Verifiable Certificates for Your Events</h2>
        <p>Join 300+ organizations that use EventoraX to manage events and issue trusted certificates.</p>
        <div className="cta-buttons">
          <a href="/contact" className="cta-btn-primary">
            Get Started Free
            <i className="fa-solid fa-arrow-right"></i>
          </a>
          <a href="/features" className="cta-btn-secondary">
            Learn More
          </a>
        </div>
      </section>
    </div>
  );
}

export default Verify;
