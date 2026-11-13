import { useEffect, useRef, useState } from 'react';
import { WAYPOINTS } from '../../store/waypoints';
import { SCROLL_VH } from '../../store/scrollMap';
import { sceneState } from '../../store/sceneState';
import { T } from '../../store/i18n';

const clamp01 = v => Math.min(1, Math.max(0, v));
const emit = (name, detail) => window.dispatchEvent(new CustomEvent(name, { detail }));
const photoUrl = id => `/assets/gallery/${id}.jpg`;

/** Hero title with the Dive button, zone cards and the surface splash. All driven by the dive progress. */
export function Overlay() {
  const heroRef   = useRef();
  const splashRef = useRef();
  const cardRefs  = useRef([]);
  const [photo, setPhoto] = useState(null); // [id, caption] shown full screen

  useEffect(() => {
    let raf;
    function tick() {
      const s = sceneState.scrollProgress;

      if (heroRef.current) {
        const o = 1 - clamp01((s - 0.008) / 0.035);
        heroRef.current.style.opacity = o;
        heroRef.current.style.transform = `translateY(${(1 - o) * -40}px)`;
        heroRef.current.style.visibility = o < 0.01 ? 'hidden' : 'visible';
      }

      // white-water flash while the lens crosses the surface
      if (splashRef.current) {
        const o = clamp01(1 - Math.abs(sceneState.camY + 0.05) / 0.55);
        splashRef.current.style.opacity = o * o;
      }

      WAYPOINTS.forEach((wp, i) => {
        const el = cardRefs.current[i];
        if (!el) return;
        const d = s - wp.t;
        const o = wp.cta ? clamp01((s - wp.t + 0.045) / 0.03) : clamp01(1 - (Math.abs(d) - 0.02) / 0.025);
        el.style.opacity = o;
        // the card rises out of the deep, settles, then drifts up and away
        el.style.setProperty('--shift', `${wp.cta ? (1 - o) * 30 : d * -360}px`);
        el.style.visibility = o < 0.01 ? 'hidden' : 'visible';
        el.style.pointerEvents = o > 0.6 ? 'auto' : 'none';
        el.classList.toggle('is-in', o > 0.45); // starts the staggered reveal of the content
      });

      raf = requestAnimationFrame(tick);
    }
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  useEffect(() => {
    if (!photo) return undefined;
    const close = e => { if (e.key === 'Escape') setPhoto(null); };
    window.addEventListener('keydown', close);
    return () => window.removeEventListener('keydown', close);
  }, [photo]);

  return (
    <>
      <main id="dive" style={{ height: `${SCROLL_VH}vh` }} aria-label={T.diveLabel} />

      <div className="splash" ref={splashRef} aria-hidden="true" />

      <header className="hero" ref={heroRef}>
        <p className="hero-kicker">{T.heroKicker}</p>
        <h1 className="hero-title">Happy Divers</h1>
        <p className="hero-sub">{T.heroSub}</p>
        <div className="hero-dive">
          <button className="dive-btn" onClick={() => emit('dive:plunge')}>
            <span>{T.dive}</span>
          </button>
          <span className="hero-hint">{T.hint}</span>
        </div>
      </header>

      {WAYPOINTS.map((wp, i) => (
        <section
          key={wp.label}
          className={`zone-card${wp.cta ? ' zone-card--cta' : ''}${wp.wide ? ' zone-card--wide' : ''}`}
          ref={el => { cardRefs.current[i] = el; }}
        >
          {/* signature: the card's depth on a 0–40 m ruler, like a reading on a dive computer */}
          <header className="zone-head">
            <p className="zone-where"><span>{String(i + 1).padStart(2, '0')}</span>{wp.kicker}</p>
            <p className="zone-depth">{wp.depth}</p>
            <div className="zone-ruler" aria-hidden="true"><i style={{ left: `${(wp.m / 40) * 100}%` }} /></div>
          </header>
          <h2 className="zone-title">{wp.title}</h2>
          {wp.body && <p className="zone-body">{wp.body}</p>}
          {wp.steps && (
            <ol className="zone-steps">
              {wp.steps.map(([name, text], n) => (
                <li key={name}><span>{n + 1}</span><div><strong>{name}</strong><p>{text}</p></div></li>
              ))}
            </ol>
          )}
          {wp.rows && (
            <ul className="zone-rows">
              {wp.rows.map(([name, meta, text]) => (
                <li key={name}>
                  <div className="zone-row-head"><strong>{name}</strong><span>{meta}</span></div>
                  <p>{text}</p>
                </li>
              ))}
            </ul>
          )}
          {wp.photos && (
            <ul className="zone-photos">
              {wp.photos.map(([id, caption]) => (
                <li key={id}>
                  <button onClick={() => setPhoto([id, caption])} aria-label={`${T.openPhoto}: ${caption}`}>
                    <img src={photoUrl(id)} alt="" loading="lazy" decoding="async" />
                  </button>
                  <p>{caption}</p>
                </li>
              ))}
            </ul>
          )}
          {wp.tags && (
            <ul className="zone-list">
              {wp.tags.map(tag => <li key={tag}>{tag}</li>)}
            </ul>
          )}
          {wp.checks && (
            <ul className="zone-checks">
              {wp.checks.map(text => (
                <li key={text}>
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5" /></svg>
                  <span>{text}</span>
                </li>
              ))}
            </ul>
          )}
          {wp.quote && <blockquote className="zone-quote">{wp.quote}</blockquote>}
          {wp.facts && (
            <dl className="zone-facts">
              {wp.facts.map(([value, label]) => (
                <div key={value}><dt>{label}</dt><dd>{value}</dd></div>
              ))}
            </dl>
          )}
          {wp.note && <p className="zone-note">{wp.note}</p>}
          {wp.cta && (
            <div className="zone-actions">
              <a className="zone-btn" href={wp.link} target="_blank" rel="noreferrer">{T.book}</a>
              <button className="zone-link" onClick={() => emit('dive:goto', 0)}>{T.surface}</button>
            </div>
          )}
        </section>
      ))}

      {photo && (
        <div className="lightbox" role="dialog" aria-modal="true" aria-label={photo[1]} onClick={() => setPhoto(null)} data-lenis-prevent>
          <figure>
            <img src={photoUrl(photo[0])} alt={photo[1]} />
            <figcaption>{photo[1]}</figcaption>
          </figure>
          <button className="lightbox-close" aria-label={T.close}>×</button>
        </div>
      )}
    </>
  );
}
