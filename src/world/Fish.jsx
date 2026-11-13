import { useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { fishGeometry } from './geo';
import { makeRng, terrainHeight } from './terrain';
import { patchUnderwater } from './underwater';
import { DENSITY } from './quality';
import { fishTexture } from './textures';

// Each school circles a point beside the dive path.
// c = centre, r = radius, n = fish, len = body stretch
const SCHOOLS = [
  { c: [ -4,  -3.4,  -4], r: 5,  n: 40, color: '#ffd23f', size: 0.22, speed: 0.50 },
  { c: [ 24,  -4.6, -12], r: 6,  n: 36, color: '#dfeeff', size: 0.20, speed: 0.62 },
  { c: [ 24,  -8.5,  36], r: 7,  n: 64, color: '#ff7a3d', size: 0.20, speed: 0.46 },
  { c: [ -6, -11.5,  50], r: 8,  n: 56, color: '#4cc9ff', size: 0.19, speed: 0.52 },
  { c: [-16, -12.5,  76], r: 7,  n: 48, color: '#ffd23f', size: 0.26, speed: 0.40 },
  { c: [  4, -14.0,  94], r: 6,  n: 40, color: '#ff5d8f', size: 0.20, speed: 0.56 },
  { c: [  4, -20.0, 136], r: 10, n: 40, color: '#b9d6e8', size: 0.50, speed: 0.20, len: 1.9 },
  { c: [ 26, -31.0, 140], r: 6,  n: 30, color: '#8fb8ff', size: 0.22, speed: 0.42 },
  { c: [  8, -34.0, 212], r: 7,  n: 26, color: '#9fe8ff', size: 0.20, speed: 0.30 },
  // second wave — `fit` lifts the school clear of the seabed wherever it lands
  { c: [ 14,  -3.0, -12], r: 4,  n: 34, color: '#7fe0d0', size: 0.13, speed: 0.70, fit: true },
  { c: [ 28,  -6.0,  18], r: 5,  n: 40, color: '#ffe066', size: 0.15, speed: 0.58, fit: true },
  { c: [ 10, -10.0,  64], r: 6,  n: 56, color: '#ff9a3d', size: 0.14, speed: 0.60, fit: true },
  { c: [-14, -13.0,  86], r: 5,  n: 40, color: '#c084ff', size: 0.17, speed: 0.50, fit: true },
  { c: [-20, -19.0, 122], r: 7,  n: 48, color: '#ffd23f', size: 0.19, speed: 0.44 },
  { c: [ 10, -26.0, 129], r: 6,  n: 40, color: '#6fd3ff', size: 0.21, speed: 0.48 },
  { c: [ -8, -33.0, 198], r: 5,  n: 28, color: '#baffea', size: 0.17, speed: 0.36 },
].map(sc => (sc.fit
  ? { ...sc, c: [sc.c[0], Math.min(-1.8, Math.max(sc.c[1], terrainHeight(sc.c[0], sc.c[2]) + 1 + sc.r * 0.3)), sc.c[2]] }
  : sc));

export function Fish() {
  const { mesh, fish } = useMemo(() => {
    const rng = makeRng(404);
    const list = [];
    for (const sc of SCHOOLS) {
      const count = Math.round(sc.n * DENSITY);
      const base = new THREE.Color(sc.color);
      for (let i = 0; i < count; i++) {
        const hsl = { h: 0, s: 0, l: 0 };
        base.getHSL(hsl);
        list.push({
          sc, a0: rng() * Math.PI * 2, rad: sc.r * (0.3 + rng() * 0.7), yo: (rng() - 0.5) * sc.r * 0.55,
          sp: sc.speed * (0.75 + rng() * 0.5), ph: rng() * 10, size: sc.size * (0.75 + rng() * 0.5),
          color: new THREE.Color().setHSL(hsl.h, hsl.s, hsl.l + (rng() - 0.5) * 0.16),
        });
      }
    }
    const mat = patchUnderwater(new THREE.MeshLambertMaterial({ color: '#ffffff', map: fishTexture(), side: THREE.DoubleSide }), { motion: 'fish' });
    const m = new THREE.InstancedMesh(fishGeometry(), mat, list.length);
    m.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    list.forEach((f, i) => m.setColorAt(i, f.color));
    m.instanceColor.needsUpdate = true;
    m.frustumCulled = false;
    return { mesh: m, fish: list };
  }, []);

  const dummy = useMemo(() => new THREE.Object3D(), []);
  const next = useMemo(() => new THREE.Vector3(), []);

  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    for (let i = 0; i < fish.length; i++) {
      const f = fish[i], c = f.sc.c;
      const a = f.a0 + t * f.sp;
      const y = c[1] + f.yo + Math.sin(t * 0.7 + f.ph) * 0.45;
      dummy.position.set(c[0] + Math.cos(a) * f.rad, y, c[2] + Math.sin(a) * f.rad * 0.7);
      next.set(c[0] + Math.cos(a + 0.06) * f.rad, y + Math.cos(t * 0.7 + f.ph) * 0.02, c[2] + Math.sin(a + 0.06) * f.rad * 0.7);
      dummy.lookAt(next);
      dummy.scale.set(f.size, f.size, f.size * (f.sc.len || 1));
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    }
    mesh.instanceMatrix.needsUpdate = true;
  });

  return <primitive object={mesh} />;
}
