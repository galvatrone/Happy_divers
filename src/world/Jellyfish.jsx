import { useMemo } from 'react';
import * as THREE from 'three';
import { merge } from './geo';
import { makeRng } from './terrain';
import { nearestOnPath } from '../store/cameraCurve';
import { instanced } from './instanced';
import { patchUnderwater } from './underwater';
import { DENSITY } from './quality';

function jellyGeometry() {
  const bell = new THREE.SphereGeometry(0.6, 18, 10, 0, Math.PI * 2, 0, Math.PI * 0.52);
  const inner = new THREE.SphereGeometry(0.42, 12, 8, 0, Math.PI * 2, 0, Math.PI * 0.5);
  inner.translate(0, -0.04, 0);
  const parts = [bell, inner];
  for (let i = 0; i < 7; i++) {
    const g = new THREE.PlaneGeometry(0.045, 2.0, 1, 10);
    g.translate(0, -1.0, 0);
    const a = (i / 7) * Math.PI * 2;
    g.rotateY(a);
    g.translate(Math.cos(a) * 0.34, 0, Math.sin(a) * 0.34);
    parts.push(g);
  }
  return merge(parts);
}

// HDR colours: bloom turns them into light sources
const GLOW = [[0.25, 1.5, 2.2], [1.5, 0.45, 2.2], [0.3, 2.0, 1.2], [2.0, 0.6, 1.2]];

/** Glowing jellyfish drifting in the twilight zone and at the foot of the wall. */
export function Jellyfish() {
  const mesh = useMemo(() => {
    const rng = makeRng(555);
    const items = [];
    const add = (count, [x0, x1, y0, y1, z0, z1], s0, s1) => {
      let guard = count * 20;
      while (count > 0 && guard-- > 0) {
        const x = x0 + rng() * (x1 - x0), z = z0 + rng() * (z1 - z0);
        if (nearestOnPath(x, z).d < 4.5) continue;
        const c = GLOW[Math.floor(rng() * GLOW.length)];
        const s = s0 + rng() * (s1 - s0);
        items.push({ x, y: y0 + rng() * (y1 - y0), z, s, ry: rng() * 6.28, rz: (rng() - 0.5) * 0.4,
          color: new THREE.Color(c[0], c[1], c[2]) });
        count--;
      }
    };
    add(Math.round(40 * DENSITY), [-20, 20, -37, -27, 192, 238], 0.6, 1.8);
    add(Math.round(10 * DENSITY), [-14, 34, -31, -22, 118, 140], 0.4, 0.9);

    const mat = patchUnderwater(new THREE.MeshBasicMaterial({
      color: '#ffffff', transparent: true, opacity: 0.42, depthWrite: false,
      blending: THREE.AdditiveBlending, side: THREE.DoubleSide, toneMapped: false,
    }), { caustic: false, motion: 'jelly' });
    const m = instanced(jellyGeometry(), mat, items);
    return m;
  }, []);

  return <primitive object={mesh} />;
}
