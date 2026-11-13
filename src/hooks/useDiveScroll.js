import { useEffect } from 'react';
import Lenis from 'lenis';
import { sceneState } from '../store/sceneState';

/**
 * Smooth page scroll (Lenis). The page is one tall block; Rig.jsx reads how far it is
 * scrolled. `dive:goto` (detail = 0…1) scrolls to a point of the dive.
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
    let raf = 0;
    if (lenis) {
      const loop = time => { lenis.raf(time); raf = requestAnimationFrame(loop); };
      raf = requestAnimationFrame(loop);
    }

    const goTo = e => {
      const top = e.detail * (document.documentElement.scrollHeight - window.innerHeight);
      if (lenis) lenis.scrollTo(top, { duration: 2.4 });
      else window.scrollTo({ top });
    };
    window.addEventListener('dive:goto', goTo);

    return () => {
      window.removeEventListener('dive:goto', goTo);
      cancelAnimationFrame(raf);
      lenis?.destroy();
    };
  }, [enabled]);
}
