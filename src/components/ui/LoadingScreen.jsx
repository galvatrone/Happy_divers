import { useEffect, useRef, useState } from 'react';
import { useProgress } from '@react-three/drei';
import { T } from '../../store/i18n';

const STATUS_LINES = T.loader;

export function LoadingScreen({ onComplete }) {
  const { progress, active } = useProgress();
  const overlayRef    = useRef();
  const firedRef      = useRef(false);
  const statusRef     = useRef();
  const statusIdxRef  = useRef(0);
  const [ready, setReady]     = useState(false);

  useEffect(() => {
    const id = setInterval(() => {
      statusIdxRef.current = (statusIdxRef.current + 1) % STATUS_LINES.length;
      if (statusRef.current)
        statusRef.current.textContent = STATUS_LINES[statusIdxRef.current];
    }, 1400);
    return () => clearInterval(id);
  }, []);

  // Normal completion path
  useEffect(() => {
    if (progress >= 100 && !active) setReady(true);
  }, [progress, active]);

  // Fallback: assets preloaded before hook subscribed (progress stays 0)
  // OR hard timeout — guarantees the button always appears
  useEffect(() => {
    const t = setTimeout(() => setReady(true), 3500);
    return () => clearTimeout(t);
  }, []);

  // No button here any more: the Dive button lives on the hero, in front of the beach.
  useEffect(() => {
    if (!ready) return undefined;
    const t = setTimeout(handleEnter, 500);
    return () => clearTimeout(t);
  }, [ready]);

  function handleEnter() {
    if (firedRef.current) return;
    firedRef.current = true;
    overlayRef.current?.classList.add('dive-out');
    setTimeout(() => onComplete?.(), 580);
  }

  return (
    <div className="loading-screen" ref={overlayRef}>
      <div className="loading-inner">
        <span className="loading-brand">Happy Divers</span>
        <span className="loading-tagline">{T.loaderTag}</span>

        <div className="loading-progress-wrap">
          <div className="loading-bar">
            <div className="loading-bar-fill" style={{ width: `${progress}%` }} />
          </div>
          <span className="loading-pct">{Math.round(progress)}%</span>
        </div>

        <span className="loading-status" ref={statusRef}>{STATUS_LINES[0]}</span>

      </div>
    </div>
  );
}
