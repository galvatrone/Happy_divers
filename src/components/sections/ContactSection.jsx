import { useRef, useState } from 'react';

export function ContactSection() {
  const formRef = useRef();
  const [sent, setSent]     = useState(false);
  const [busy, setBusy]     = useState(false);

  function handleSubmit(e) {
    e.preventDefault();
    setBusy(true);
    // Replace with your actual endpoint (Netlify Forms, Formspree, etc.)
    setTimeout(() => { setSent(true); setBusy(false); }, 1200);
  }

  return (
    <section
      className="contact-section sticky-panel"
      id="contact"
      aria-label="Book a dive or enquire"
    >
      <div className="contact-inner">
        <div className="contact-text-col">
          <div className="chapter-label">
            <span className="chapter-num">VI</span>
            <span className="chapter-dash" />
            <span>Get In The Water</span>
          </div>

          <h2 className="section-title heading-main">Book&nbsp;a<br />Dive</h2>

          <p className="body-text contact-body">
            Whether it is your first time underwater or you are ready for your
            Divemaster ticket — we are here. Drop us a message and we will get
            back to you within 24 hours.
          </p>

          <div className="contact-details">
            <div className="contact-detail">
              <span className="meta-label">Season</span>
              <span className="meta-val">April – October</span>
            </div>
            <div className="contact-detail">
              <span className="meta-label">Hours</span>
              <span className="meta-val">07:00 – 19:00</span>
            </div>
            <div className="contact-detail">
              <span className="meta-label">Languages</span>
              <span className="meta-val">EN · EL · DE · FR</span>
            </div>
          </div>
        </div>

        <div className="contact-form-col">
          {sent ? (
            <div className="contact-sent" role="status">
              <p className="body-text">
                Message received. We will be in touch shortly — see you below the
                surface.
              </p>
            </div>
          ) : (
            <form
              ref={formRef}
              className="contact-form"
              onSubmit={handleSubmit}
              name="booking"
              data-netlify="true"
              aria-label="Booking enquiry form"
            >
              <input type="hidden" name="form-name" value="booking" />

              <div className="form-row">
                <label className="form-label" htmlFor="contact-name">Full Name</label>
                <input
                  id="contact-name"
                  className="form-input"
                  type="text"
                  name="name"
                  required
                  autoComplete="name"
                  placeholder="Your name"
                />
              </div>

              <div className="form-row">
                <label className="form-label" htmlFor="contact-email">Email</label>
                <input
                  id="contact-email"
                  className="form-input"
                  type="email"
                  name="email"
                  required
                  autoComplete="email"
                  placeholder="you@example.com"
                />
              </div>

              <div className="form-row">
                <label className="form-label" htmlFor="contact-interest">I am interested in</label>
                <select
                  id="contact-interest"
                  className="form-input form-select"
                  name="interest"
                  required
                >
                  <option value="">Select a course or service</option>
                  <option>Open Water Diver</option>
                  <option>Advanced Open Water</option>
                  <option>Rescue Diver</option>
                  <option>Divemaster</option>
                  <option>Enriched Air Nitrox</option>
                  <option>Guided Dive</option>
                  <option>Equipment Rental</option>
                  <option>Just have a question</option>
                </select>
              </div>

              <div className="form-row">
                <label className="form-label" htmlFor="contact-date">Preferred Date</label>
                <input
                  id="contact-date"
                  className="form-input"
                  type="date"
                  name="date"
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>

              <div className="form-row">
                <label className="form-label" htmlFor="contact-message">Message</label>
                <textarea
                  id="contact-message"
                  className="form-input form-textarea"
                  name="message"
                  rows={4}
                  placeholder="Tell us about your experience level and what you are hoping to do…"
                />
              </div>

              <button
                type="submit"
                className="btn-discover form-submit"
                disabled={busy}
              >
                {busy ? 'Sending…' : 'Send Message'}
              </button>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}
