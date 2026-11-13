import { useRef, useEffect } from 'react';
import { curve, scrollToCurve } from '../../store/cameraCurve';
import { WAYPOINTS } from '../../store/waypoints';
import { sceneState } from '../../store/sceneState';

const SVG_W   = 68;
const SVG_H   = 340;
const PAD     = 10;
const SAMPLES = 120;

// — Precompute SVG projection once at module load —
const at = s => curve.getPointAt(Math.min(0.999, scrollToCurve(s)));
const _pts3D = Array.from({ length: SAMPLES + 1 }, (_, i) => at(i / SAMPLES));
const _xs    = _pts3D.map(p => p.x);
const _zs    = _pts3D.map(p => p.z);
const X_MIN  = Math.min(..._xs);
const X_RNG  = Math.max(..._xs) - X_MIN || 1;
const Z_MAX  = Math.max(..._zs);
const Z_RNG  = Z_MAX - Math.min(..._zs) || 1;

function project(p3) {
  return {
    x: PAD + (p3.x - X_MIN) / X_RNG * (SVG_W - PAD * 2),
    y: PAD + (Z_MAX - p3.z) / Z_RNG * (SVG_H - PAD * 2),
  };
}

const SVG_PTS = _pts3D.map(project);
const PATH_D  = SVG_PTS.map((pt, i) =>
  `${i === 0 ? 'M' : 'L'}${pt.x.toFixed(1)} ${pt.y.toFixed(1)}`
).join(' ');
const WP_PTS  = WAYPOINTS.map(wp => project(at(wp.t)));

export function WaypointNav() {
  const bgPathRef  = useRef();
  const fgPathRef  = useRef();
  const cursorRef  = useRef();
  const dotRefs    = useRef([]);
  const labelRefs  = useRef([]);

  useEffect(() => {
    let rafId;
    let totalLen = null;

    function tick() {
      if (!totalLen && bgPathRef.current) {
        totalLen = bgPathRef.current.getTotalLength();
      }

      const p  = sceneState.scrollProgress;
      const pt = project(at(p));

      if (cursorRef.current) {
        cursorRef.current.setAttribute('cx', pt.x.toFixed(1));
        cursorRef.current.setAttribute('cy', pt.y.toFixed(1));
      }

      if (fgPathRef.current && totalLen) {
        const passed = p * totalLen;
        fgPathRef.current.setAttribute('stroke-dasharray', `${passed.toFixed(1)} ${totalLen}`);
      }

      WAYPOINTS.forEach((wp, i) => {
        const near = Math.abs(p - wp.t) < 0.06;
        const dot  = dotRefs.current[i];
        const lbl  = labelRefs.current[i];
        if (dot) {
          dot.setAttribute('stroke', near ? '#00e5ff' : 'rgba(0,200,220,0.28)');
          dot.setAttribute('fill',   near ? 'rgba(0,229,255,0.1)' : 'transparent');
          dot.setAttribute('r',      near ? '4.5' : '3');
        }
        if (lbl) lbl.classList.toggle('wn-label--active', near);
      });

      rafId = requestAnimationFrame(tick);
    }

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, []);

  function jumpTo(t) {
    window.dispatchEvent(new CustomEvent('dive:goto', { detail: t }));
  }

  return (
    <nav className="wn" aria-label="Маршрут погружения">
      <svg
        className="wn-svg"
        width={SVG_W}
        height={SVG_H}
        viewBox={`0 0 ${SVG_W} ${SVG_H}`}
      >
        <defs>
          <filter id="wn-glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="2.5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Full path — dim background */}
        <path
          ref={bgPathRef}
          d={PATH_D}
          fill="none"
          stroke="rgba(0,180,200,0.14)"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Traveled portion — bright */}
        <path
          ref={fgPathRef}
          d={PATH_D}
          fill="none"
          stroke="rgba(0,229,255,0.55)"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeDasharray="0 9999"
        />

        {/* Waypoint dots */}
        {WP_PTS.map((pt, i) => (
          <circle
            key={i}
            ref={el => { dotRefs.current[i] = el; }}
            cx={pt.x.toFixed(1)}
            cy={pt.y.toFixed(1)}
            r="3"
            fill="transparent"
            stroke="rgba(0,200,220,0.28)"
            strokeWidth="1.5"
            style={{ cursor: 'pointer' }}
            onClick={() => jumpTo(WAYPOINTS[i].t)}
          />
        ))}

        {/* Glowing cursor */}
        <circle
          ref={cursorRef}
          cx={WP_PTS[0].x.toFixed(1)}
          cy={WP_PTS[0].y.toFixed(1)}
          r="4"
          fill="#00e5ff"
          filter="url(#wn-glow)"
        />
      </svg>

      {/* Labels pinned at each waypoint's SVG y-position */}
      <div className="wn-labels" style={{ height: SVG_H }}>
        {WP_PTS.map((pt, i) => (
          <div
            key={i}
            ref={el => { labelRefs.current[i] = el; }}
            className="wn-label"
            style={{ top: pt.y }}
          >
            <span className="wn-name">{WAYPOINTS[i].label}</span>
            <span className="wn-depth">{WAYPOINTS[i].depth}</span>
          </div>
        ))}
      </div>
    </nav>
  );
}
