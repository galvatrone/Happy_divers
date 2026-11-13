import { useEffect, useRef } from 'react';
import { sceneState } from '../../store/sceneState';
import { T } from '../../store/i18n';

export function DepthHUD() {
  const hudRef   = useRef();
  const depthRef = useRef();
  const tempRef  = useRef();
  const visRef   = useRef();

  useEffect(() => {
    let rafId;

    function tick() {
      const d       = sceneState.depth;
      const depth   = Math.round(d);
      const temp    = Math.round(28 - d * 0.18);
      const vis     = `${d < 12 ? 30 : d < 30 ? 20 : 10} ${T.m}`;
      const visible = sceneState.camY < -0.3 && sceneState.scrollProgress < 0.93;

      if (hudRef.current)   hudRef.current.classList.toggle('depth-hud--visible', visible);
      if (depthRef.current) depthRef.current.textContent = depth;
      if (tempRef.current)  tempRef.current.textContent  = temp;
      if (visRef.current)   visRef.current.textContent   = vis;

      rafId = requestAnimationFrame(tick);
    }

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, []);

  return (
    <div className="depth-hud" ref={hudRef} aria-label={T.hud}>
      <div className="depth-hud-row">
        <span className="depth-hud-label">{T.depth}</span>
        <span className="depth-hud-value">
          <span ref={depthRef}>0</span>
          <span className="depth-hud-unit">{T.m}</span>
        </span>
      </div>
      <div className="depth-hud-sep" />
      <div className="depth-hud-row">
        <span className="depth-hud-label">{T.water}</span>
        <span className="depth-hud-value">
          <span ref={tempRef}>28</span>
          <span className="depth-hud-unit">°C</span>
        </span>
      </div>
      <div className="depth-hud-sep" />
      <div className="depth-hud-row">
        <span className="depth-hud-label">{T.visibility}</span>
        <span className="depth-hud-value" style={{ fontSize: '0.72rem' }}>
          <span ref={visRef}>30 {T.m}</span>
        </span>
      </div>
    </div>
  );
}
