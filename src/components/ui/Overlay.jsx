import { useEffect, useRef } from 'react';
import { WAYPOINTS } from '../../store/waypoints';
import { sceneState } from '../../store/sceneState';

/** Page length in viewport heights. More = slower dive per scroll tick. */
export const SCROLL_VH = 1100;

const clamp01 = v => Math.min(1, Math.max(0, v));

/** Hero title, zone cards and the surface splash. All driven by the dive progress. */
export function Overlay() {
  const heroRef   = useRef();
  const splashRef = useRef();
  const cardRefs  = useRef([]);

  useEffect(() => {
    let raf;
    function tick() {
      const s = sceneState.scrollProgress;

      if (heroRef.current) {
        const o = 1 - clamp01((s - 0.012) / 0.045);
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
        const o = wp.cta ? clamp01((s - wp.t + 0.05) / 0.035) : clamp01(1 - (Math.abs(d) - 0.03) / 0.03);
        el.style.opacity = o;
        el.style.transform = `translateY(calc(-50% + ${(wp.cta ? (1 - o) * 30 : d * -420)}px))`;
        el.style.visibility = o < 0.01 ? 'hidden' : 'visible';
        el.style.pointerEvents = o > 0.6 ? 'auto' : 'none';
      });

      raf = requestAnimationFrame(tick);
    }
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <>
      <main id="dive" style={{ height: `${SCROLL_VH}vh` }} aria-label="Погружение" />

      <div className="splash" ref={splashRef} aria-hidden="true" />

      <header className="hero" ref={heroRef}>
        <p className="hero-kicker">Дайв-центр · Красное море · с 2004 года</p>
        <h1 className="hero-title">Happy Divers</h1>
        <p className="hero-sub">Берег остаётся позади. Всё самое интересное — под водой.</p>
        <div className="hero-hint">
          <span>Листайте, чтобы нырнуть</span>
          <i />
        </div>
      </header>

      {WAYPOINTS.map((wp, i) => (
        <section
          key={wp.label}
          className={`zone-card${wp.cta ? ' zone-card--cta' : ''}`}
          ref={el => { cardRefs.current[i] = el; }}
        >
          <p className="zone-depth">{wp.kicker}</p>
          <h2 className="zone-title">{wp.title}</h2>
          {wp.body && <p className="zone-body">{wp.body}</p>}
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
          {wp.facts && (
            <dl className="zone-facts">
              {wp.facts.map(([value, label]) => (
                <div key={value}><dt>{value}</dt><dd>{label}</dd></div>
              ))}
            </dl>
          )}
          {wp.note && <p className="zone-note">{wp.note}</p>}
          {wp.cta && (
            <div className="zone-actions">
              <a className="zone-btn" href="tel:+20100000000">Записаться</a>
              <button className="zone-link" onClick={() => window.dispatchEvent(new CustomEvent('dive:goto', { detail: 0 }))}>
                Всплыть ↑
              </button>
            </div>
          )}
        </section>
      ))}
    </>
  );
}
