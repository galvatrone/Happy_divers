import { useEffect, useRef, useState } from 'react';
import { useProgress } from '@react-three/drei';
import { Howler } from 'howler';
import { sceneState } from '../../store/sceneState';

const STATUS_LINES = [
  'Initialising sonar…',
  'Loading dive maps…',
  'Calibrating depth sensors…',
  'Pressurising systems…',
  'Checking regulators…',
  'Entering the blue…',
];

export function LoadingScreen({ onComplete }) {
  const { progress, active } = useProgress();
  const overlayRef    = useRef();
  const firedRef      = useRef(false);
  const statusRef     = useRef();
  const statusIdxRef  = useRef(0);
  const [ready, setReady]     = useState(false);
  const [audioOn, setAudioOn] = useState(false);

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

  function handleEnter() {
    if (firedRef.current) return;
    firedRef.current = true;
    overlayRef.current?.classList.add('dive-out');
    setTimeout(() => onComplete?.(), 580);
  }

  function toggleAudio() {
    const next = !audioOn;
    sceneState.audioEnabled = next;
    Howler.mute(!next);
    setAudioOn(next);
  }

  return (
    <div className="loading-screen" ref={overlayRef}>
      <div className="loading-inner">
        <span className="loading-brand">Happy Divers</span>
        <span className="loading-tagline">Into the Blue</span>

        <div className="loading-progress-wrap">
          <div className="loading-bar">
            <div className="loading-bar-fill" style={{ width: `${progress}%` }} />
          </div>
          <span className="loading-pct">{Math.round(progress)}%</span>
        </div>

        <span className="loading-status" ref={statusRef}>{STATUS_LINES[0]}</span>

        <button
          className={`loading-enter-btn${ready ? ' visible' : ''}`}
          onClick={handleEnter}
          aria-label="Enter site"
        >
          Dive In
        </button>

        <button
          className={`loading-audio-btn${audioOn ? ' on' : ''}`}
          onClick={toggleAudio}
          aria-label={audioOn ? 'Disable audio' : 'Enable ambient audio'}
        >
          <span className="loading-audio-dot" />
          {audioOn ? 'Audio on' : 'Enable audio'}
        </button>
      </div>
    </div>
  );
}
