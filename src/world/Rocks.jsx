import { useMemo } from 'react';
import * as THREE from 'three';
import { rockGeometry } from './geo';
import { scatter } from './terrain';
import { instanced, pick } from './instanced';
import { patchUnderwater } from './underwater';
import { DENSITY } from './quality';
import { surface } from './textures';

const GREY = ['#8d8780', '#7b7772', '#9a8f84', '#6f7378', '#a39685'];
const REEF = ['#8d8780', '#9c7f78', '#7f8a78', '#a08d7c', '#75707a'];
const DEEP = ['#5e6470', '#4f5560', '#6a6672'];

// [seed, count, area(x0,x1,z0,z1), minPathDist, scaleMin, scaleMax, tall, palette]
const ZONES = [
  [11,  46, [-70,  80, -52,  24], 3.5, 0.5, 2.2, 1.0, GREY],   // shore and lagoon
  [12,  44, [-45,  55,  24, 102], 5.0, 1.4, 3.8, 2.0, REEF],   // garden pinnacles
  [13,  80, [-55,  65, 100, 138], 4.5, 1.0, 4.2, 1.5, REEF],   // wall
  [14,  46, [-34,  48, 136, 151], 5.0, 1.6, 4.4, 1.3, DEEP],   // cave mouth
  [15,  36, [-34,  34, 184, 200], 5.0, 1.6, 4.2, 1.3, DEEP],   // cave exit
  [16,  44, [-44,  44, 198, 256], 4.5, 0.8, 3.6, 1.6, DEEP],   // twilight
  [17,  30, [-120, 120, -110, -60], 0,  0.6, 2.4, 1.0, GREY],  // on the island
];

export function Rocks() {
  const meshes = useMemo(() => {
    const geos = [rockGeometry(1, 3), rockGeometry(2, 3), rockGeometry(3, 2)];
    const mat = patchUnderwater(new THREE.MeshLambertMaterial({ color: new THREE.Color(1.9, 1.9, 1.9), ...surface('rock_face_03', [2, 2]) }));
    const buckets = [[], [], []];
    for (const [seed, count, area, minD, s0, s1, tall, palette] of ZONES) {
      const pts = scatter({ seed, count: Math.round(count * DENSITY), area, accept: p => p.d > minD });
      pts.forEach((p, i) => {
        const s = s0 + p.a * p.a * (s1 - s0);
        // never let a boulder reach into the swim lane
        const reach = Math.min(s, Math.max(0.5, p.d - 2.2));
        buckets[i % 3].push({
          x: p.x, y: p.y - reach * 0.15, z: p.z,
          s: [reach, reach * (0.7 + p.b * tall), reach * (0.8 + p.c * 0.5)],
          ry: p.c * Math.PI * 2, rx: (p.b - 0.5) * 0.3,
          color: pick(palette, p.a * 3.17 % 1),
        });
      });
    }
    return buckets.map((items, i) => instanced(geos[i], mat, items));
  }, []);

  return <>{meshes.map((m, i) => <primitive key={i} object={m} />)}</>;
}
