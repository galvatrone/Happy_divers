import { useMemo } from 'react';
import * as THREE from 'three';
import { merge } from './geo';
import { scatter, fbm, makeRng } from './terrain';
import { instanced, pick } from './instanced';
import { patchUnderwater } from './underwater';
import { DENSITY } from './quality';

const GRASS = ['#3f9a4a', '#2f8a52', '#58a83a', '#2a7a44'];
const KELP  = ['#7a8b2a', '#9a7b1e', '#5f8a2c', '#8a6a1a'];

/** A tuft of seagrass blades, root at the origin, 1 unit tall. uv.y runs root → tip. */
function tuftGeometry() {
  const rng = makeRng(77);
  const blades = [];
  for (let i = 0; i < 6; i++) {
    const g = new THREE.PlaneGeometry(0.07 + rng() * 0.05, 1, 1, 4);
    g.translate(0, 0.5, 0);
    g.scale(1, 0.6 + rng() * 0.4, 1);
    g.rotateX((rng() - 0.5) * 0.5);
    g.rotateY(rng() * Math.PI);
    g.translate((rng() - 0.5) * 0.35, 0, (rng() - 0.5) * 0.35);
    blades.push(g);
  }
  return merge(blades);
}

/** A kelp stalk: two crossed wavy ribbons, 1 unit tall. */
function kelpGeometry() {
  const parts = [0, Math.PI / 2].map(ry => {
    const g = new THREE.PlaneGeometry(0.34, 1, 2, 14);
    g.translate(0, 0.5, 0);
    const p = g.attributes.position;
    for (let i = 0; i < p.count; i++) {
      const y = p.getY(i);
      const w = 0.35 + Math.sin(y * Math.PI) * 0.65 + Math.sin(y * 28) * 0.18;
      p.setX(i, p.getX(i) * w + Math.sin(y * 9) * 0.09);
      p.setZ(i, Math.cos(y * 7) * 0.06);
    }
    g.computeVertexNormals();
    g.rotateY(ry);
    return g;
  });
  return merge(parts);
}

export function Plants() {
  const meshes = useMemo(() => {
    const grassMat = patchUnderwater(new THREE.MeshLambertMaterial({ color: '#ffffff', side: THREE.DoubleSide }), { motion: 'plant', amp: 0.28 });
    const kelpMat  = patchUnderwater(new THREE.MeshLambertMaterial({ color: '#ffffff', side: THREE.DoubleSide }), { motion: 'plant', amp: 0.11 });

    const meadow = p => p.y < -1.2 && p.d > 1.2 && p.d < 26 && fbm(p.x * 0.09 + 2, p.z * 0.09 + 6, 3) > 0.42;
    const grass = [
      ...scatter({ seed: 51, count: Math.round(1000 * DENSITY), area: [-36, 56, -34, 30], accept: meadow }),
      ...scatter({ seed: 52, count: Math.round(450 * DENSITY),  area: [-40, 50, 30, 100], accept: meadow }),
    ].map(p => ({
      x: p.x, y: p.y - 0.03, z: p.z, s: [0.7, 0.3 + p.a * 0.6, 0.7], ry: p.c * 6.28,
      color: pick(GRASS, p.b),
    }));

    const forest = p => p.d > 4.5 && p.d < 30 && fbm(p.x * 0.05 + 12, p.z * 0.05 + 3, 3) > 0.47;
    const kelp = [
      ...scatter({ seed: 53, count: Math.round(110 * DENSITY), area: [-44, 56, 40, 104], accept: forest }),
      ...scatter({ seed: 54, count: Math.round(90 * DENSITY),  area: [-40, 56, 118, 147], accept: p => p.d > 4.5 && p.d < 28 }),
      ...scatter({ seed: 55, count: Math.round(40 * DENSITY),  area: [-30, 30, 190, 236], accept: p => p.d > 5 && p.d < 22 }),
    ].map(p => ({
      x: p.x, y: p.y - 0.1, z: p.z, s: [1.1 + p.b * 0.8, 5 + p.a * 7, 1.1 + p.b * 0.8], ry: p.c * 6.28,
      color: pick(KELP, p.b),
    }));

    return [instanced(tuftGeometry(), grassMat, grass), instanced(kelpGeometry(), kelpMat, kelp)];
  }, []);

  return <>{meshes.map((m, i) => <primitive key={i} object={m} />)}</>;
}
