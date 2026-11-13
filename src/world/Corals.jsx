import { useMemo } from 'react';
import * as THREE from 'three';
import { branchCoralGeometry, brainCoralGeometry, tableCoralGeometry, spongeGeometry, seaFanTexture } from './geo';
import { scatter, fbm } from './terrain';
import { instanced, pick } from './instanced';
import { patchUnderwater } from './underwater';
import { DENSITY } from './quality';
import { surface } from './textures';

const BRANCH = ['#ff6f91', '#ff9a5a', '#c77dff', '#ffd166', '#5ee6c4', '#f25f8b', '#7fb7ff', '#ff8fab'];
const BRAIN  = ['#c9a45c', '#9aa85a', '#d9b98a', '#b79bd6', '#7fb69b', '#d98f6a'];
const TABLE  = ['#d9c08a', '#6fc3b8', '#9fc3e8', '#e3a57a', '#b9d17a'];
const SPONGE = ['#ffd23f', '#b06cff', '#ff6b3d', '#ff4f7b', '#4fd6ff'];
const FAN    = ['#ff3b4e', '#ff8a2a', '#b455ff', '#ffc93c', '#ff5fa2'];

const GARDEN = [-48, 58, 14, 106];
const LAGOON = [-34, 54, -26, 14];
const WALL   = [-50, 60, 100, 134];
const DEEP   = [-36, 40, 190, 250];

// reef grows in patches, and thickest where the diver passes
const patchy = (min, max = 30) => p => p.d > min && p.d < max && fbm(p.x * 0.07 + 5, p.z * 0.07 + 9, 3) > 0.40;
const n = c => Math.round(c * DENSITY);

function fill(list, pts, palette, size, opts = {}) {
  for (const p of pts) {
    const s = size[0] + p.a * (size[1] - size[0]);
    list.push({
      x: p.x, y: p.y - (opts.sink ?? 0.05) * s, z: p.z,
      s: opts.flat ? [s, s * (0.6 + p.b * 0.5), s] : s,
      ry: p.c * Math.PI * 2, rx: (p.b - 0.5) * (opts.tilt ?? 0.3), rz: (p.a - 0.5) * (opts.tilt ?? 0.3),
      color: pick(palette, (p.a * 5.31 + p.c) % 1),
    });
  }
}

export function Corals() {
  const meshes = useMemo(() => {
    const out = [];
    const solid = patchUnderwater(new THREE.MeshLambertMaterial({ color: new THREE.Color(1.7, 1.7, 1.7), ...surface('coral_stone_wall', [2, 2]) }));
    const open  = patchUnderwater(new THREE.MeshLambertMaterial({ color: new THREE.Color(1.7, 1.7, 1.7), side: THREE.DoubleSide, ...surface('coral_stone_wall', [2, 2]) }));

    // branching corals — three shapes
    const branch = [[], [], []];
    const bp = [
      ...scatter({ seed: 21, count: n(260), area: GARDEN, accept: patchy(2.6) }),
      ...scatter({ seed: 22, count: n(45),  area: LAGOON, accept: patchy(2.6, 22) }),
      ...scatter({ seed: 23, count: n(50),  area: WALL,   accept: patchy(3.2, 24) }),
    ];
    bp.forEach((p, i) => fill(branch[i % 3], [p], BRANCH, [0.7, 1.9]));
    branch.forEach((items, i) => out.push(instanced(branchCoralGeometry(31 + i), solid, items)));

    const brain = [];
    fill(brain, scatter({ seed: 24, count: n(120), area: GARDEN, accept: patchy(2.8) }), BRAIN, [0.5, 1.9], { sink: 0.2, tilt: 0.15 });
    fill(brain, scatter({ seed: 25, count: n(36),  area: LAGOON, accept: patchy(2.8, 22) }), BRAIN, [0.4, 1.2], { sink: 0.2, tilt: 0.15 });
    out.push(instanced(brainCoralGeometry(3), solid, brain));

    const table = [];
    fill(table, scatter({ seed: 26, count: n(80), area: GARDEN, accept: patchy(3.4) }), TABLE, [0.9, 2.7], { flat: true, tilt: 0.25 });
    fill(table, scatter({ seed: 27, count: n(30), area: WALL, accept: patchy(3.6, 22) }), TABLE, [1.0, 2.4], { flat: true, tilt: 0.5 });
    out.push(instanced(tableCoralGeometry(5), solid, table));

    const sponge = [];
    fill(sponge, scatter({ seed: 28, count: n(90), area: GARDEN, accept: patchy(2.6) }), SPONGE, [0.8, 2.0]);
    fill(sponge, scatter({ seed: 29, count: n(60), area: WALL, accept: patchy(3, 24) }), SPONGE, [1.0, 2.6]);
    fill(sponge, scatter({ seed: 30, count: n(40), area: DEEP, accept: p => p.d > 3 && p.d < 24 }), SPONGE, [1.0, 2.8]);
    out.push(instanced(spongeGeometry(9), open, sponge));

    // sea fans: flat lace, always swaying
    const fanGeo = new THREE.PlaneGeometry(1, 1, 1, 6);
    fanGeo.translate(0, 0.5, 0);
    const fanMat = patchUnderwater(new THREE.MeshLambertMaterial({
      color: '#ffffff', map: seaFanTexture(), alphaTest: 0.4, side: THREE.DoubleSide,
    }), { motion: 'plant', amp: 0.07 });
    const fans = [];
    fill(fans, scatter({ seed: 41, count: n(90),  area: GARDEN, accept: patchy(2.8) }), FAN, [1.2, 2.8], { tilt: 0.2 });
    fill(fans, scatter({ seed: 42, count: n(120), area: WALL, accept: p => p.d > 3 && p.d < 26 }), FAN, [1.6, 4.2], { tilt: 0.5 });
    fill(fans, scatter({ seed: 43, count: n(40),  area: DEEP, accept: p => p.d > 3 && p.d < 22 }), FAN, [1.6, 3.6], { tilt: 0.3 });
    out.push(instanced(fanGeo, fanMat, fans));

    return out;
  }, []);

  return <>{meshes.map((m, i) => <primitive key={i} object={m} />)}</>;
}
