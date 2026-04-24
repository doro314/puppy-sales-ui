import { useState, useEffect } from "react";
import "./ContactForm.css";

// TODO: Formspree setup checklist
// 1. Sign up at https://formspree.io
// 2. Click "New Form", give it a name (e.g. "Puppy Inquiry")
// 3. Copy the form ID from the endpoint URL (e.g. https://formspree.io/f/abcd1234 → ID is "abcd1234")
// 4. Replace "YOUR_FORM_ID" below with that ID
// 5. Verify your email address in Formspree so submissions are delivered
// 6. (Optional) Enable Formspree's spam filter / reCAPTCHA in the form settings dashboard

// Replace with your Formspree form ID after signing up at https://formspree.io
const FORMSPREE_ID = "YOUR_FORM_ID";

function ContactForm({ initialMessage = "", accentColor = "#8a9bb0" }) {
  const [fields, setFields] = useState({ name: "", email: "", message: initialMessage });
  const [honeypot, setHoneypot] = useState("");
  const [status, setStatus] = useState("idle"); // idle | sending | success | error

  // Sync if parent changes prefill (e.g. navigating from different puppy)
  useEffect(() => {
    setFields((prev) => ({ ...prev, message: initialMessage }));
    setStatus("idle");
  }, [initialMessage]);

  const handleChange = (e) => {
    setFields((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Honeypot check — bots fill this hidden field, humans don't
    if (honeypot) return;

    setStatus("sending");

    try {
      const res = await fetch(`https://formspree.io/f/${FORMSPREE_ID}`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(fields),
      });

      if (res.ok) {
        setStatus("success");
        setFields({ name: "", email: "", message: "" });
      } else {
        setStatus("error");
      }
    } catch {
      setStatus("error");
    }
  };

  return (
    <div className="contact-container" style={{ "--contact-color": accentColor }}>
      <h2 className="contact-title">
        <span className="contact-title-prefix">Get in Touch | </span>Contact Us
      </h2>
      <p className="contact-subtitle">
        Interested in one of our puppies? Send us a message and we'll get back to you soon.
      </p>

      <div className="contact-card">
        <div className="contact-card-top-bar" />
        <svg viewBox="0 0 24 24" fill="currentColor" className="contact-card-watermark" aria-hidden="true">
          <ellipse cx="12" cy="19" rx="5" ry="4" />
          <ellipse cx="6" cy="11" rx="2.5" ry="3" />
          <ellipse cx="18" cy="11" rx="2.5" ry="3" />
          <ellipse cx="9" cy="6" rx="2" ry="2.5" />
          <ellipse cx="15" cy="6" rx="2" ry="2.5" />
        </svg>
        {status === "success" ? (
          <div className="contact-form">
            <div className="contact-success">
              <p>Thanks for reaching out! We'll be in touch soon.</p>
              <button className="contact-reset" onClick={() => setStatus("idle")}>
                Send another message
              </button>
            </div>
          </div>
        ) : (
          <form className="contact-form" onSubmit={handleSubmit} noValidate>
          {/* Honeypot — hidden from real users, bots fill it in */}
          <input
            type="text"
            name="_gotcha"
            value={honeypot}
            onChange={(e) => setHoneypot(e.target.value)}
            tabIndex={-1}
            aria-hidden="true"
            className="contact-honeypot"
          />

          <div className="contact-field">
            <label htmlFor="name">Name</label>
            <input
              id="name"
              name="name"
              type="text"
              value={fields.name}
              onChange={handleChange}
              required
              placeholder="Your name"
            />
          </div>

          <div className="contact-field">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              name="email"
              type="email"
              value={fields.email}
              onChange={handleChange}
              required
              placeholder="you@example.com"
            />
          </div>

          <div className="contact-field">
            <label htmlFor="message">Message</label>
            <textarea
              id="message"
              name="message"
              value={fields.message}
              onChange={handleChange}
              required
              rows={5}
              placeholder="Tell us which puppy you're interested in..."
            />
          </div>

          {status === "error" && (
            <p className="contact-error">Something went wrong. Please try again.</p>
          )}

          <div className="contact-submit-row">
            <button
              type="submit"
              className="contact-submit"
              disabled={status === "sending"}
            >
              <svg viewBox="0 0 24 24" fill="currentColor" className="contact-submit-icon">
                <ellipse cx="12" cy="19" rx="5" ry="4" />
                <ellipse cx="6" cy="11" rx="2.5" ry="3" />
                <ellipse cx="18" cy="11" rx="2.5" ry="3" />
                <ellipse cx="9" cy="6" rx="2" ry="2.5" />
                <ellipse cx="15" cy="6" rx="2" ry="2.5" />
              </svg>
              {status === "sending" ? "Sending…" : "Send Message"}
            </button>
            <span className="contact-response-note">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="contact-clock-icon">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
              We’ll respond within 24 hours
            </span>
          </div>
        </form>
        )}
      </div>
    </div>
  );
}

export default ContactForm;
