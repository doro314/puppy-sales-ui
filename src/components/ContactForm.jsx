import { useState, useEffect } from "react";
import "./ContactForm.css";
import { PawSvg, IconClock } from "./Icons";

// TODO: Formspree setup checklist
// 1. Sign up at https://formspree.io
// 2. Click "New Form", give it a name (e.g. "Puppy Inquiry")
// 3. Copy the form ID from the endpoint URL (e.g. https://formspree.io/f/abcd1234 → ID is "abcd1234")
// 4. Replace "YOUR_FORM_ID" below with that ID
// 5. Verify your email address in Formspree so submissions are delivered
// 6. (Optional) Enable Formspree's spam filter / reCAPTCHA in the form settings dashboard

// Replace with your Formspree form ID after signing up at https://formspree.io
const FORMSPREE_ID = "xdavvdak";

function validate(fields) {
  const errors = {};
  if (!fields.name.trim()) errors.name = "Name is required.";
  if (!fields.email.trim()) {
    errors.email = "Email is required.";
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fields.email)) {
    errors.email = "Please enter a valid email address.";
  }
  if (!fields.message.trim()) errors.message = "Message is required.";
  return errors;
}

function ContactForm({ initialMessage = "", accentColor = "#8a9bb0" }) {
  const [fields, setFields] = useState({ name: "", email: "", message: initialMessage });
  const [touched, setTouched] = useState({ name: false, email: false, message: false });
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [honeypot, setHoneypot] = useState("");
  const [status, setStatus] = useState("idle"); // idle | sending | success | error

  const errors = validate(fields);
  const hasErrors = Object.keys(errors).length > 0;

  // Sync if parent changes prefill (e.g. navigating from different puppy)
  useEffect(() => {
    setFields((prev) => ({ ...prev, message: initialMessage }));
    setStatus("idle");
    setSubmitAttempted(false);
    setTouched({ name: false, email: false, message: false });
  }, [initialMessage]);

  const handleChange = (e) => {
    setFields((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleBlur = (e) => {
    setTouched((prev) => ({ ...prev, [e.target.name]: true }));
  };

  const showError = (field) => (touched[field] || submitAttempted) && errors[field];

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Honeypot check — bots fill this hidden field, humans don't
    if (honeypot) return;

    if (hasErrors) {
      setSubmitAttempted(true);
      return;
    }

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
        setTouched({ name: false, email: false, message: false });
        setSubmitAttempted(false);
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
        <PawSvg className="contact-card-watermark" aria-hidden="true" />
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
            <label htmlFor="name">Name <span className="contact-required" aria-hidden="true">*</span></label>
            <input
              id="name"
              name="name"
              type="text"
              value={fields.name}
              onChange={handleChange}
              onBlur={handleBlur}
              required
              placeholder="Your name"
              aria-invalid={!!showError("name")}
              aria-describedby={showError("name") ? "name-error" : undefined}
              className={showError("name") ? "invalid" : ""}
            />
            {showError("name") && (
              <span id="name-error" className="contact-field-error" role="alert">
                <span aria-hidden="true">⚠</span> {errors.name}
              </span>
            )}
          </div>

          <div className="contact-field">
            <label htmlFor="email">Email <span className="contact-required" aria-hidden="true">*</span></label>
            <input
              id="email"
              name="email"
              type="email"
              value={fields.email}
              onChange={handleChange}
              onBlur={handleBlur}
              required
              placeholder="you@example.com"
              aria-invalid={!!showError("email")}
              aria-describedby={showError("email") ? "email-error" : undefined}
              className={showError("email") ? "invalid" : ""}
            />
            {showError("email") && (
              <span id="email-error" className="contact-field-error" role="alert">
                <span aria-hidden="true">⚠</span> {errors.email}
              </span>
            )}
          </div>

          <div className="contact-field">
            <label htmlFor="message">Message <span className="contact-required" aria-hidden="true">*</span></label>
            <textarea
              id="message"
              name="message"
              value={fields.message}
              onChange={handleChange}
              onBlur={handleBlur}
              required
              rows={5}
              placeholder="Tell us which puppy you're interested in..."
              aria-invalid={!!showError("message")}
              aria-describedby={showError("message") ? "message-error" : undefined}
              className={showError("message") ? "invalid" : ""}
            />
            {showError("message") && (
              <span id="message-error" className="contact-field-error" role="alert">
                <span aria-hidden="true">⚠</span> {errors.message}
              </span>
            )}
          </div>

          {submitAttempted && hasErrors && (
            <p className="contact-error">Please complete the highlighted fields before sending.</p>
          )}

          {status === "error" && (
            <p className="contact-error">Something went wrong. Please try again.</p>
          )}

          <div className="contact-submit-row">
            <button
              type="submit"
              className="contact-submit"
              disabled={status === "sending"}
            >
              <PawSvg className="contact-submit-icon" />
              {status === "sending" ? "Sending…" : "Send Message"}
            </button>
            <span className="contact-response-note">
              <IconClock className="contact-clock-icon" />
              We’ll respond within 24 hours
            </span>
          </div>
        </form>
        )}
      </div>
      <p className="gallery-copyright">&copy; {new Date().getFullYear()} All rights reserved.</p>
    </div>
  );
}

export default ContactForm;
