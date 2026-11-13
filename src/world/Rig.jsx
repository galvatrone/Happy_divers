import { useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { curve, scrollToCurve } from '../store/cameraCurve';
import { sceneState } from '../store/sceneState';
import { uw } from './underwater';
import { DEBUG_P } from './quality';
import { cullables } from './instanced';

const BEACH = new THREE.Vector3(0, 3.5, -70);

function pageProgress() {
  const max = document.documentElement.scrollHeight - window.innerHeight;
  return max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
}

/** Page scroll → camera on the spline. The hero looks at the beach, then the view follows the path. */
export function Rig() {
  const pos  = useMemo(() => new THREE.Vector3(), []);
  const tan  = useMemo(() => new THREE.Vector3(), []);
  const look = useMemo(() => new THREE.Vector3(), []);
  const sway = useMemo(() => new THREE.Vector2(), []);

  useFrame(({ camera, clock }, dt) => {
    const t = clock.elapsedTime;
    sceneState.uTime = t;
    uw.uTime.value = t;

    sceneState.targetProgress = DEBUG_P ?? pageProgress();
    const k = DEBUG_P !== null ? 1 : 1 - Math.exp(-dt * 5);
    sceneState.scrollProgress += (sceneState.targetProgress - sceneState.scrollProgress) * k;

    const s = sceneState.scrollProgress;
    const u = Math.min(0.9995, scrollToCurve(s));
    sceneState.curveU = u;
    curve.getPointAt(u, pos);
    curve.getTangentAt(u, tan);

    // gentle life: bobbing on the waves above, slow drift below
    const above = THREE.MathUtils.smoothstep(pos.y, -0.4, 0.8);
    pos.y += Math.sin(t * 0.9) * 0.07 * above + Math.sin(t * 0.5) * 0.05 * (1 - above);

    const ease = Math.min(1, dt * 2.5);
    sway.x += (sceneState.pointer.x * 0.9 - sway.x) * ease;
    sway.y += (sceneState.pointer.y * 0.5 - sway.y) * ease;

    look.copy(pos).addScaledVector(tan, 8);
    look.lerp(BEACH, 1 - THREE.MathUtils.smoothstep(s, 0.035, 0.11));
    look.x += sway.x; look.y += sway.y;

    camera.position.copy(pos);
    camera.lookAt(look);
    camera.rotation.z += Math.sin(t * 0.6) * 0.012 * above;

    // only draw what the diver can actually see through the water
    const under = pos.y < 0;
    for (let i = 0; i < cullables.length; i++) {
      const m = cullables[i];
      const bs = m.boundingSphere || m.geometry.boundingSphere;
      const dist = bs.center.distanceTo(pos) - bs.radius;
      m.visible = under ? dist < 105 : (dist < 420 && bs.center.y + bs.radius > -9);
    }

    sceneState.camY = pos.y;
    sceneState.depth = Math.max(0, -pos.y) * 1.1;
  });

  return null;
}
