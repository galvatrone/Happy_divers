import { useMemo } from 'react';
import * as THREE from 'three';
import { PATH_SAMPLES } from '../store/cameraCurve';
import { terrainRaw, terrainHeight, fbm, makeRng } from './terrain';
import { instanced, registerCullable } from './instanced';
import { patchUnderwater } from './underwater';
import { makeRayMaterial, rayGeometry } from './GodRays';
import { DENSITY } from './quality';
import { surface } from './textures';

const HALF = 11;   // half-width of the roof
const K = 12;       // cross-section segments

/** Height of the rock ceiling at distance d from the cave axis. */
function ceiling(s, d, x, z) {
  return s.y + 8.2 - (d / HALF) * (d / HALF) * 3.6 + (fbm(x * 0.3, z * 0.3, 3) - 0.5) * 2.2;
}

/** Frames along the part of the path that runs under the rock massif. */
function caveFrames() {
  const S = PATH_SAMPLES;
  const inside = S.map(s => s.y < -20 && terrainRaw(s.x, s.z) > s.y + 6);
  const a = Math.max(1, inside.indexOf(true) - 2);
  const b = Math.min(S.length - 2, inside.lastIndexOf(true) + 2);
  const frames = [];
  for (let i = a; i <= b; i++) {
    const tx = S[i + 1].x - S[i - 1].x, tz = S[i + 1].z - S[i - 1].z;
    const l = Math.hypot(tx, tz) || 1;
    frames.push({ ...S[i], sx: tz / l, sz: -tx / l });
  }
  return frames;
}

/** A slab of rock over the canyon: arched underside, top flush with the massif, capped ends. */
function roofGeometry(frames) {
  const pos = [], uv = [], col = [], idx = [];
  const c = new THREE.Color();
  const push = (x, y, z, u, v) => {
    const n = fbm(x * 0.25 + 3, z * 0.25 + y * 0.2, 3);
    c.setRGB(0.36 + n * 0.26, 0.35 + n * 0.24, 0.37 + n * 0.22);
    pos.push(x, y, z); uv.push(u, v); col.push(c.r, c.g, c.b);
    return pos.length / 3 - 1;
  };
  const rows = { under: [], top: [] };
  for (const f of frames) {
    const under = [], top = [];
    for (let j = 0; j <= K; j++) {
      const d = -HALF + (2 * HALF * j) / K;
      const x = f.x + f.sx * d, z = f.z + f.sz * d;
      const yu = ceiling(f, d, x, z);
      const yt = Math.max(terrainRaw(x, z) + 0.3, yu + 1.5);
      under.push([x, yu, z]); top.push([x, yt, z]);
    }
    rows.under.push(under); rows.top.push(top);
  }
  const sheet = grid => {
    const ids = grid.map(row => row.map(([x, y, z]) => push(x, y, z, x / 5, z / 5)));
    for (let i = 0; i < ids.length - 1; i++) {
      for (let j = 0; j < K; j++) {
        idx.push(ids[i][j], ids[i + 1][j], ids[i][j + 1], ids[i][j + 1], ids[i + 1][j], ids[i + 1][j + 1]);
      }
    }
  };
  sheet(rows.under);
  sheet(rows.top);
  // end caps: the rock face above the cave mouth
  for (const i of [0, frames.length - 1]) {
    const lo = rows.under[i].map(([x, y, z], j) => push(x, y, z, j / 2, y / 5));
    const hi = rows.top[i].map(([x, y, z], j) => push(x, y, z, j / 2, y / 5));
    for (let j = 0; j < K; j++) idx.push(lo[j], hi[j], lo[j + 1], lo[j + 1], hi[j], hi[j + 1]);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}

// HDR colours for the bioluminescent growth
const GLOW = [[0.2, 2.6, 3.2], [1.7, 0.5, 3.4], [0.4, 3.0, 1.3], [0.2, 1.6, 3.4]];

export function Cave() {

  const built = useMemo(() => {
    const frames = caveFrames();
    const mid = Math.floor(frames.length / 2);
    const segA = frames.slice(0, mid - 3), segB = frames.slice(mid + 4);
    const well = frames[mid];
    const rng = makeRng(321);

    const rockMat = patchUnderwater(new THREE.MeshLambertMaterial({
      ...surface('rock_face_03', [0.5, 0.5]), color: new THREE.Color(2.2, 2.2, 2.2), vertexColors: true, side: THREE.DoubleSide,
    }), { caustic: false });
    const roofs = [segA, segB].map(seg => registerCullable(new THREE.Mesh(roofGeometry(seg), rockMat)));

    // stalactites from the ceiling, stalagmites along the walls
    const coneMat = patchUnderwater(new THREE.MeshLambertMaterial({ color: new THREE.Color(1.3, 1.25, 1.35), ...surface('rock_face_03', [1, 2]) }), { caustic: false });
    const down = new THREE.ConeGeometry(1, 1, 6); down.rotateX(Math.PI); down.translate(0, -0.5, 0);
    const up = new THREE.ConeGeometry(1, 1, 6); up.translate(0, 0.5, 0);
    const roofed = [...segA, ...segB];
    const tites = [], mites = [];
    for (let i = 0; i < Math.round(80 * DENSITY); i++) {
      const f = roofed[Math.floor(rng() * roofed.length)];
      const d = (rng() - 0.5) * 15;
      const x = f.x + f.sx * d, z = f.z + f.sz * d;
      const r = 0.12 + rng() * 0.3;
      tites.push({ x, y: ceiling(f, d, x, z) + 0.15, z, s: [r, 0.5 + rng() * rng() * 2.4, r], ry: rng() * 6 });
    }
    for (let i = 0; i < Math.round(60 * DENSITY); i++) {
      const f = roofed[Math.floor(rng() * roofed.length)];
      const d = (rng() > 0.5 ? 1 : -1) * (4 + rng() * 3.5);
      const x = f.x + f.sx * d, z = f.z + f.sz * d;
      const r = 0.15 + rng() * 0.35;
      mites.push({ x, y: terrainHeight(x, z) - 0.1, z, s: [r, 0.5 + rng() * 1.8, r], ry: rng() * 6 });
    }

    // glowing specks on the walls, floor edges and ceiling
    const dotMat = new THREE.MeshBasicMaterial({ color: '#ffffff', toneMapped: false });
    const dots = [];
    for (let i = 0; i < Math.round(420 * DENSITY); i++) {
      const f = frames[Math.floor(rng() * frames.length)];
      const onCeil = rng() > 0.6;
      const d = onCeil ? (rng() - 0.5) * 16 : (rng() > 0.5 ? 1 : -1) * (3 + rng() * 5.5);
      const x = f.x + f.sx * d, z = f.z + f.sz * d;
      const c = GLOW[Math.floor(rng() * GLOW.length)];
      const k = 0.5 + rng() * 0.9;
      dots.push({
        x, y: onCeil ? ceiling(f, d, x, z) - 0.04 : terrainHeight(x, z) + 0.05, z,
        s: 0.035 + rng() * rng() * 0.11, color: new THREE.Color(c[0] * k, c[1] * k, c[2] * k),
      });
    }

    return {
      roofs, well,
      tites: instanced(down, coneMat, tites),
      mites: instanced(up, coneMat, mites),
      dots: instanced(new THREE.IcosahedronGeometry(1, 1), dotMat, dots),
      shaft: makeRayMaterial({ value: 1 }, 0.5),
    };
  }, []);

  const { roofs, well, tites, mites, dots, shaft } = built;
  const floor = well.y - 2.6;

  return (
    <>
      {roofs.map((m, i) => <primitive key={i} object={m} />)}
      <primitive object={tites} />
      <primitive object={mites} />
      <primitive object={dots} />

      {/* the light well: a hole in the ceiling halfway through */}
      <group position={[well.x, floor, well.z]}>
        {[0, 1.05, 2.1].map(ry => (
          <mesh key={ry} geometry={rayGeometry} material={shaft} position={[0, 26, 0]} rotation={[0, ry, 0]} scale={[6.5, 26, 1]} />
        ))}
        <mesh position={[0, 20, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <circleGeometry args={[5, 24]} />
          <meshBasicMaterial color={[0.5, 1.5, 2.0]} toneMapped={false} fog={false} />
        </mesh>
        <pointLight position={[0, 4, 0]} color="#a6e9ff" intensity={200} distance={30} decay={1.7} />
      </group>
    </>
  );
}
