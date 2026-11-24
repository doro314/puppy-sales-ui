import { useState } from "react";

import { IconClock, IconClose, PawSvg } from "./Icons";

import "./ContactForm.css";

// Submissions go to the Formspree form with this ID, which emails them on.
const FORMSPREE_ID = "xdavvdak";
const MIN_PHONE_DIGITS = 7;
const EMPTY_FIELDS = { name: "", email: "", phone: "", message: "" };
const UNTOUCHED = { name: false, email: false, phone: false, message: false };

function validate(fields) {
  const errors = {};
  if (!fields.name.trim()) errors.name = "Name is required.";
  if (!fields.email.trim()) {
    errors.email = "Email is required.";
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fields.email)) {
    errors.email = "Please enter a valid email address.";
  }
  if (fields.phone.trim() && fields.phone.replace(/\D/g, "").length < MIN_PHONE_DIGITS) {
    errors.phone = "Please enter a number we can text, or leave it blank.";
  }
  if (!fields.message.trim()) errors.message = "Message is required.";
  return errors;
}

// The email's subject names the puppy, so the inbox sorts itself even if the message is rewritten.
function subjectFor(topic) {
  if (topic?.kind === "puppy") return `Puppy inquiry — ${topic.name}`;
  if (topic?.kind === "waitlist") return "Waitlist — next litter";
  return "Puppy inquiry";
}

function TopicChip({ topic, onDismiss }) {
  const isPuppy = topic.kind === "puppy";
  return (
    <div className="contact-topic">
      {isPuppy && topic.photo
        ? <img className="contact-topic-photo" src={topic.photo} alt="" />
        : <span className="contact-topic-photo contact-topic-photo--paw"><PawSvg className="contact-topic-paw" aria-hidden="true" /></span>}
      <span className="contact-topic-text">
        <b>{isPuppy ? `About ${topic.name}` : "The list for the next litter"}</b>
        <small>{isPuppy ? topic.detail : "We'll write when puppies are on the way"}</small>
      </span>
      <button
        type="button"
        className="contact-topic-dismiss"
        onClick={onDismiss}
        aria-label={isPuppy ? `Not about ${topic.name}` : "Not about the next litter"}
      >
        <IconClose className="contact-topic-dismiss-icon" />
      </button>
    </div>
  );
}

// topic: what the inquiry is about — { kind: "puppy", slug, name, detail, photo },
// { kind: "waitlist" }, or null. A new topic remounts the form (App keys it), so the
// prefilled message always matches.
function ContactForm({ topic = null, initialMessage = "", accentColor = "#8a9bb0", onBack }) {
  const [fields, setFields] = useState({ ...EMPTY_FIELDS, message: initialMessage });
  const [touched, setTouched] = useState(UNTOUCHED);
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [honeypot, setHoneypot] = useState("");
  const [status, setStatus] = useState("idle"); // idle | sending | success | error
  const [isTopicDismissed, setIsTopicDismissed] = useState(false);

  const activeTopic = isTopicDismissed ? null : topic;
  const errors = validate(fields);
  const hasErrors = Object.keys(errors).length > 0;

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
        body: JSON.stringify({
          ...fields,
          puppy: activeTopic?.kind === "puppy" ? activeTopic.slug : activeTopic?.kind ?? "",
          subject: subjectFor(activeTopic),
        }),
      });

      if (res.ok) {
        setStatus("success");
        setFields(EMPTY_FIELDS);
        setTouched(UNTOUCHED);
        setSubmitAttempted(false);
      } else {
        setStatus("error");
      }
    } catch {
      setStatus("error");
    }
  };

  const fieldProps = (name) => ({
    id: name,
    name,
    value: fields[name],
    onChange: handleChange,
    onBlur: handleBlur,
    "aria-invalid": !!showError(name),
    "aria-describedby": showError(name) ? `${name}-error` : undefined,
    className: showError(name) ? "invalid" : "",
  });

  const fieldError = (name) => showError(name) && (
    <span id={`${name}-error`} className="contact-field-error" role="alert">
      <span aria-hidden="true">⚠</span> {errors[name]}
    </span>
  );

  return (
    <div className="contact-container" style={{ "--contact-color": accentColor }}>
      {onBack && (
        <button className="contact-back-btn" onClick={onBack} aria-label="Go back">
          &#8592; Back
        </button>
      )}
      <h2 className="contact-title">
        <span className="contact-title-prefix">Get in Touch | </span>Contact Us
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

            {activeTopic && <TopicChip topic={activeTopic} onDismiss={() => setIsTopicDismissed(true)} />}

            <div className="contact-field">
              <label htmlFor="name">Name <span className="contact-required" aria-hidden="true">*</span></label>
              <input type="text" required placeholder="Your name" autoComplete="name" {...fieldProps("name")} />
              {fieldError("name")}
            </div>

            <div className="contact-field">
              <label htmlFor="email">Email <span className="contact-required" aria-hidden="true">*</span></label>
              <input type="email" required placeholder="you@example.com" autoComplete="email" {...fieldProps("email")} />
              {fieldError("email")}
            </div>

            <div className="contact-field">
              <label htmlFor="phone">Phone <span className="contact-optional">— optional, if you'd rather text</span></label>
              <input type="tel" placeholder="(555) 555-0123" autoComplete="tel" {...fieldProps("phone")} />
              {fieldError("phone")}
            </div>

            <div className="contact-field">
              <label htmlFor="message">Message <span className="contact-required" aria-hidden="true">*</span></label>
              <textarea required rows={5} placeholder="Tell us which puppy you're interested in..." {...fieldProps("message")} />
              {fieldError("message")}
            </div>

            {submitAttempted && hasErrors && (
              <p className="contact-error">Please complete the highlighted fields before sending.</p>
            )}

            {status === "error" && (
              <p className="contact-error">Something went wrong. Please try again.</p>
            )}

            <div className="contact-submit-row">
              <button type="submit" className="contact-submit" disabled={status === "sending"}>
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
    </div>
  );
}

export default ContactForm;
