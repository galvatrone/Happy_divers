import { useEffect } from 'react';
import Lenis from 'lenis';
import { sceneState } from '../store/sceneState';
import { STOPS, diveToPage, pageToDive } from '../store/scrollMap';

const HOLD_MS = 750;  // how long the scroll is pinned after reaching a card
const REARM_PX = 60;  // a card pins again only after the scroll has left it by this much
const easeInOut = t => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

/**
 * Smooth page scroll (Lenis). The page is one tall block; Rig.jsx reads how far it is scrolled.
 * Every card is a stop: the scroll is caught there and pinned for a moment, so one flick of the
 * wheel never skips a card.
 * Events: `dive:goto` (detail = dive progress 0…1), `dive:plunge` (hero button → first card).
 */
export function useDiveScroll(enabled) {
  useEffect(() => {
    const onPointer = e => {
      sceneState.pointer.x = (e.clientX / window.innerWidth) * 2 - 1;
      sceneState.pointer.y = -((e.clientY / window.innerHeight) * 2 - 1);
    };
    window.addEventListener('pointermove', onPointer, { passive: true });
    return () => window.removeEventListener('pointermove', onPointer);
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle('dive-locked', !enabled);
    if (!enabled) return undefined;

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const lenis = reduced ? null : new Lenis({ lerp: 0.09, wheelMultiplier: 0.9 });

    const maxScroll = () => document.documentElement.scrollHeight - window.innerHeight;
    const jump = top => {
      if (lenis) lenis.scrollTo(top, { immediate: true, force: true });
      else window.scrollTo(0, top);
    };

    const armed = STOPS.map(() => false);
    let prev = window.scrollY;
    let holdUntil = 0, holdTop = 0;
    let auto = false, autoTimer = 0;
    let raf = 0;

    const loop = time => {
      lenis?.raf(time);
      const max = maxScroll();
      const now = performance.now();
      let cur = window.scrollY;

      if (now < holdUntil) {
        if (Math.abs(cur - holdTop) > 0.5) jump(holdTop);
        cur = holdTop;
      } else {
        for (let i = 1; i < STOPS.length; i++) {
          const c = diveToPage(STOPS[i]) * max;
          if (!auto && armed[i] && ((prev < c && cur >= c) || (prev > c && cur <= c))) {
            armed[i] = false;
            holdTop = c; holdUntil = now + HOLD_MS;
            jump(c);
            cur = c;
            break;
          }
          if (Math.abs(cur - c) > REARM_PX) armed[i] = true;
          else if (auto) armed[i] = false;
        }
      }
      prev = cur;
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    const travel = (s, duration, easing) => {
      const top = diveToPage(s) * maxScroll();
      holdUntil = 0;
      if (!lenis) { window.scrollTo(0, top); return; }
      auto = true;
      clearTimeout(autoTimer);
      const done = () => { auto = false; };
      autoTimer = setTimeout(done, duration * 1000 + 400);
      lenis.scrollTo(top, { duration, easing, force: true, onComplete: done });
    };

    const goTo = e => travel(e.detail, 2.4);
    const plunge = () => travel(STOPS[1], 4.6, easeInOut);

    const step = dir => {
      const s = pageToDive(window.scrollY / Math.max(1, maxScroll()));
      const next = dir > 0
        ? STOPS.find(t => t > s + 0.008)
        : [...STOPS].reverse().find(t => t < s - 0.008);
      if (next !== undefined) travel(next, next === STOPS[1] && s < 0.02 ? 4.6 : 2.0, easeInOut);
    };
    const onKey = e => {
      if (e.target.closest?.('input, textarea, select, [contenteditable]')) return;
      if (['ArrowDown', 'PageDown', ' '].includes(e.key)) { e.preventDefault(); step(1); }
      else if (['ArrowUp', 'PageUp'].includes(e.key)) { e.preventDefault(); step(-1); }
    };

    window.addEventListener('dive:goto', goTo);
    window.addEventListener('dive:plunge', plunge);
    window.addEventListener('keydown', onKey);

    return () => {
      window.removeEventListener('dive:goto', goTo);
      window.removeEventListener('dive:plunge', plunge);
      window.removeEventListener('keydown', onKey);
      clearTimeout(autoTimer);
      cancelAnimationFrame(raf);
      lenis?.destroy();
    };
  }, [enabled]);
}
