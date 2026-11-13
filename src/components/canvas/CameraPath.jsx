import { useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { curve } from '../../store/cameraCurve';
import { WAYPOINTS } from '../../store/waypoints';
import { sceneState } from '../../store/sceneState';

const WHEEL_SCALE      = 0.0003;
const ESCAPE_THRESHOLD = 0.06;   // scroll needed to leave a waypoint stop
const AUTO_SNAP        = 0.03;   // radius at which camera auto-pulls to waypoint
const MAX_LEAD         = 0.08;   // max gap between targetProgress and scrollProgress

let lockedWp  = null;
let escapeBuf = 0;
let mouseX = 0, mouseY = 0;
let camOffX = 0, camOffY = 0;

// Speed drops via smoothstep as scrollProgress approaches a waypoint
function speedMult(p) {
  let minDist = Infinity;
  for (const wp of WAYPOINTS) {
    const d = Math.abs(p - wp.t);
    if (d < minDist) minDist = d;
  }
  const range = 0.14;
  if (minDist >= range) return 1.0;
  const t = minDist / range;
  return Math.max(0.02, t * t * (3 - 2 * t));
}

const _pos    = new THREE.Vector3();
const _tang   = new THREE.Vector3();
const _lookAt = new THREE.Vector3();
const _colA   = new THREE.Color('#0e3d68');
const _colB   = new THREE.Color('#082336');

export function CameraPath() {
  useEffect(() => {
    function onWheel(e) {
      const raw = Math.max(-0.045, Math.min(0.045, e.deltaY * WHEEL_SCALE));

      if (lockedWp !== null) {
        // Parked — accumulate escape scroll
        escapeBuf += raw;
        if (Math.abs(escapeBuf) >= ESCAPE_THRESHOLD) {
          sceneState.targetProgress = Math.max(0, Math.min(1,
            lockedWp + Math.sign(escapeBuf) * 0.01,
          ));
          lockedWp  = null;
          escapeBuf = 0;
        }
        return;
      }

      // Normal movement — speed reduced near waypoints, capped by MAX_LEAD
      const delta   = raw * speedMult(sceneState.scrollProgress);
      const newTarget = Math.max(0, Math.min(1, sceneState.targetProgress + delta));
      const p = sceneState.scrollProgress;
      sceneState.targetProgress = Math.max(p - MAX_LEAD, Math.min(p + MAX_LEAD, newTarget));
    }

    function onMouseMove(e) {
      mouseX = (e.clientX / window.innerWidth  - 0.5) * 2;  // -1…1
      mouseY = (e.clientY / window.innerHeight - 0.5) * 2;  // -1…1
    }

    window.addEventListener('wheel', onWheel, { passive: true });
    window.addEventListener('mousemove', onMouseMove);
    return () => {
      window.removeEventListener('wheel', onWheel);
      window.removeEventListener('mousemove', onMouseMove);
    };
  }, []);

  useFrame(({ camera, clock, scene }) => {
    sceneState.uTime = clock.elapsedTime;

    // Auto-snap: forward only — if scrollProgress enters a waypoint's snap zone while
    // moving forward toward it, pull target to exact waypoint position and lock.
    // No auto-snap when scrolling in reverse.
    if (lockedWp === null && sceneState.targetProgress >= sceneState.scrollProgress) {
      const p      = sceneState.scrollProgress;
      const moving = sceneState.targetProgress - p;

      for (const wp of WAYPOINTS) {
        const dist        = Math.abs(p - wp.t);
        const approaching = dist > 0.001 &&
          Math.sign(moving) === Math.sign(wp.t - p);

        if (dist < AUTO_SNAP && approaching) {
          sceneState.targetProgress = wp.t;
          lockedWp  = wp.t;
          escapeBuf = 0;
          break;
        }
      }
    }

    // Lerp speed: slower when close to target → organic deceleration
    const diff       = sceneState.targetProgress - sceneState.scrollProgress;
    const lerpFactor = 0.03 + Math.min(Math.abs(diff) * 2.5, 1) * 0.055;
    sceneState.scrollProgress += diff * lerpFactor;

    const t = Math.min(sceneState.scrollProgress, 0.999);
    curve.getPoint(t, _pos);
    curve.getTangent(t, _tang);

    camera.position.copy(_pos);

    // Smooth mouse-driven look offset (~3°)
    camOffX += (mouseX * 0.5  - camOffX) * 0.05;
    camOffY += (-mouseY * 0.3 - camOffY) * 0.05;

    _lookAt.copy(_pos).addScaledVector(_tang, 8);
    _lookAt.x += camOffX;
    _lookAt.y += camOffY;
    camera.lookAt(_lookAt);

    if (scene.fog) {
      const d = 0.007 + sceneState.scrollProgress * 0.016;
      scene.fog.density += (d - scene.fog.density) * 0.03;
    }
    if (!scene.background) scene.background = new THREE.Color();
    scene.background.lerpColors(_colA, _colB, sceneState.scrollProgress);
  });

  return null;
}
