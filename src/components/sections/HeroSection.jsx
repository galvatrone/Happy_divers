import { useEffect, useRef } from 'react';
import gsap from 'gsap';

export function HeroSection() {
  const rootRef = useRef();

  useEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: 'power2.out' } });
      tl.from('.hero-chapter',  { y: 14, autoAlpha: 0, duration: 0.8, delay: 0.5 })
        .from('.hero-title-a',  { y: 20, autoAlpha: 0, duration: 0.9 }, '-=0.4')
        .from('.hero-title-b',  { y: 38, autoAlpha: 0, duration: 1.1, ease: 'power3.out' }, '-=0.55')
        .from('.hero-body',     { y: 16, autoAlpha: 0, duration: 0.8 }, '-=0.5')
        .from('.hero-services', { y: 10, autoAlpha: 0, duration: 0.7 }, '-=0.4')
        .from('.hero-sep',      { scaleX: 0, autoAlpha: 0, duration: 0.6, transformOrigin: 'left' }, '-=0.3')
        .from('.hero-cta',      { y: 10, autoAlpha: 0, duration: 0.7 }, '-=0.2')
        .from('.hero-stat',     { y: 12, autoAlpha: 0, duration: 0.6, stagger: 0.1 }, '-=0.3');
    }, rootRef);
    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={rootRef}
      className="hero-section sticky-panel"
      aria-label="Hero — sea surface introduction"
    >
      <div className="hero-gradient" aria-hidden="true" />

      <div className="hero-overlay">
        <div className="hero-content">

          <div className="hero-chapter chapter-label">
            <span className="chapter-num">Est. 2004</span>
            <span className="chapter-dash" />
            <span>PADI &amp; SSI Certified</span>
          </div>

          <h1 className="hero-heading">
            <span className="hero-title-a heading-sub">Dive</span>
            <span className="hero-title-b heading-main">With Us</span>
          </h1>

          <p className="hero-body body-text">
            A family-run SCUBA center with over 20&nbsp;years of Mediterranean
            expertise. Professional, passionate, built on a love for what lies
            beneath.
          </p>

          <div className="hero-services services-list" aria-label="Services offered">
            <span>SCUBA Courses</span>
            <span className="dot" aria-hidden="true" />
            <span>Guided Dives</span>
            <span className="dot" aria-hidden="true" />
            <span>Equipment Rental</span>
          </div>

          <div className="hero-sep sep-line" />

          <div className="hero-cta">
            <a href="#contact" className="btn-discover" aria-label="Book a dive session">
              Book a Dive
            </a>
          </div>

          <div className="hero-stats stats-row" aria-label="Key facts">
            <div className="hero-stat stat-item">
              <span className="stat-num">20+</span>
              <span className="stat-label">Years Active</span>
            </div>
            <div className="hero-stat stat-item">
              <span className="stat-num">PADI</span>
              <span className="stat-label">5-Star IDC</span>
            </div>
            <div className="hero-stat stat-item">
              <span className="stat-num">SSI</span>
              <span className="stat-label">Training Facility</span>
            </div>
          </div>

        </div>
      </div>

      <div className="scroll-indicator" aria-hidden="true">
        <div className="scroll-indicator-line" />
        <span>Scroll</span>
      </div>
    </section>
  );
}
