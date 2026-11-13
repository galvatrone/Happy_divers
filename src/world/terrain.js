import * as THREE from 'three';
import { nearestOnPath } from '../store/cameraCurve';

// ── deterministic random + noise ────────────────────────────────────────────
export function makeRng(seed) {
  let a = seed >>> 0;
  return () => {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hash(ix, iz) {
  let h = Math.imul(ix, 374761393) ^ Math.imul(iz, 668265263);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967295;
}

export function vnoise(x, z) {
  const ix = Math.floor(x), iz = Math.floor(z);
  const fx = x - ix, fz = z - iz;
  const ux = fx * fx * (3 - 2 * fx), uz = fz * fz * (3 - 2 * fz);
  const a = hash(ix, iz), b = hash(ix + 1, iz), c = hash(ix, iz + 1), d = hash(ix + 1, iz + 1);
  return a + (b - a) * ux + (c - a) * uz + (a - b - c + d) * ux * uz;
}

/** Fractal noise, roughly 0…1. */
export function fbm(x, z, oct = 4) {
  let v = 0, a = 0.5, n = 0;
  for (let i = 0; i < oct; i++) {
    v += a * vnoise(x, z); n += a;
    const nx = x * 1.6 + z * 1.2, nz = z * 1.6 - x * 1.2;
    x = nx + 11.3; z = nz + 5.7; a *= 0.5;
  }
  return v / n;
}

export const smoothstep = (a, b, x) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

// ── the shape of the world ──────────────────────────────────────────────────
// Height along z (before noise): hills → beach → lagoon → coral garden → wall → deep floor.
const PROFILE = [
  [-240, 30], [-170, 24], [-110, 10], [-75, 3.2], [-56, 1.3], [-45, 0],
  [-30, -2.4], [0, -5.6], [30, -9], [60, -12], [90, -15], [105, -18],
  [117, -32.5], [130, -35], [150, -36.5], [230, -40], [300, -44],
];

function profile(z) {
  if (z <= PROFILE[0][0]) return PROFILE[0][1];
  for (let i = 0; i < PROFILE.length - 1; i++) {
    const [z0, y0] = PROFILE[i], [z1, y1] = PROFILE[i + 1];
    if (z <= z1) return y0 + (y1 - y0) * (z - z0) / (z1 - z0);
  }
  return PROFILE[PROFILE.length - 1][1];
}

/** Terrain without the swim channel — the solid rock the cave is cut into. */
export function terrainRaw(x, z) {
  const shore = Math.sin(x * 0.035) * 3 + Math.sin(x * 0.011 + 1) * 5;
  const warp = (fbm(x * 0.02 + 7.3, z * 0.02 - 3.1, 3) - 0.5) * 14 * smoothstep(-20, 10, z);
  const zz = z + shore * (1 - smoothstep(-20, 10, z)) + warp;
  let h = profile(zz);

  if (h > 0) {
    // island: hills inland, open sea to both sides
    h += (fbm(x * 0.018, z * 0.018, 4) - 0.35) * 16 * smoothstep(2, 10, h);
    const m = 1 - smoothstep(130, 210, Math.abs(x + Math.sin(z * 0.03) * 15));
    h = h * m - 4 * (1 - m);
    return h;
  }

  // sand ripples and dunes
  h += (fbm(x * 0.08, z * 0.08, 3) - 0.5) * 1.2;
  // coral garden: rounded reef mounds
  const garden = smoothstep(18, 34, zz) * (1 - smoothstep(92, 103, zz));
  const lump = Math.max(0, fbm(x * 0.06 + 31, z * 0.06 + 17, 3) - 0.46) * 2;
  h += garden * Math.pow(lump, 1.4) * 5;
  // wall: broken rock
  const wall = smoothstep(100, 108, zz) * (1 - smoothstep(118, 128, zz));
  h += wall * (fbm(x * 0.16, z * 0.16, 3) - 0.5) * 3;
  // the rock massif the cave runs through
  const ridge = smoothstep(145, 149, zz) * (1 - smoothstep(184, 189, zz)) * (1 - smoothstep(80, 125, Math.abs(x)));
  h += ridge * (19 + (fbm(x * 0.07, z * 0.07, 4) - 0.5) * 9);
  return h;
}

/** Final terrain: the raw shape with a channel carved under the camera path. */
export function terrainHeight(x, z) {
  let h = terrainRaw(x, z);
  if (z < -22 || z > 232 || x < -40 || x > 50) return h;
  const n = nearestOnPath(x, z);
  const d = n.d + (fbm(x * 0.21 + 3, z * 0.21 + 9, 2) - 0.5) * 2.4;
  if (d < 8.5) {
    const k = Math.max(0, d) / 8.5;
    // inside the rock massif the channel becomes a tall cave passage
    const lift = h > n.y + 6 ? 13 : 6;
    h = Math.min(h, n.y - 2.6 + k * k * lift);
  }
  return h;
}

// ── meshes and lookups ──────────────────────────────────────────────────────
export const TERRAIN_BOUNDS = { x0: -260, x1: 260, z0: -232, z1: 290 };

const SAND_LAND  = new THREE.Color(1.55, 1.42, 1.12);
const SAND_SEA   = new THREE.Color(1.55, 1.46, 1.22);
const GRASS      = new THREE.Color(0.20, 0.42, 0.12);
const GRASS_DRY  = new THREE.Color(0.46, 0.50, 0.20);
const ROCK       = new THREE.Color(0.62, 0.58, 0.54);
const ROCK_DARK  = new THREE.Color(0.36, 0.35, 0.37);
const CAVE       = new THREE.Color(0.50, 0.47, 0.50);
const REEF       = new THREE.Color(0.95, 0.74, 0.62);

export function buildTerrainGeometry(step = 2) {
  const { x0, x1, z0, z1 } = TERRAIN_BOUNDS;
  const nx = Math.round((x1 - x0) / step), nz = Math.round((z1 - z0) / step);
  const count = (nx + 1) * (nz + 1);
  const pos = new Float32Array(count * 3);
  const uv  = new Float32Array(count * 2);
  const col = new Float32Array(count * 3);

  let i = 0;
  for (let iz = 0; iz <= nz; iz++) {
    const z = z0 + (z1 - z0) * iz / nz;
    for (let ix = 0; ix <= nx; ix++, i++) {
      const x = x0 + (x1 - x0) * ix / nx;
      pos[i * 3] = x; pos[i * 3 + 1] = terrainHeight(x, z); pos[i * 3 + 2] = z;
      uv[i * 2] = x / 7; uv[i * 2 + 1] = z / 7;
    }
  }

  const idx = new Uint32Array(nx * nz * 6);
  let k = 0;
  for (let iz = 0; iz < nz; iz++) {
    for (let ix = 0; ix < nx; ix++) {
      const a = iz * (nx + 1) + ix, b = a + 1, c = a + nx + 1, d = c + 1;
      idx[k++] = a; idx[k++] = c; idx[k++] = b;
      idx[k++] = b; idx[k++] = c; idx[k++] = d;
    }
  }

  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  g.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
  g.setIndex(new THREE.BufferAttribute(idx, 1));
  g.computeVertexNormals();

  const nrm = g.attributes.normal;
  const c = new THREE.Color();
  for (i = 0; i < count; i++) {
    const x = pos[i * 3], y = pos[i * 3 + 1], z = pos[i * 3 + 2];
    const ny = nrm.getY(i);
    const n = fbm(x * 0.11 + 40, z * 0.11 + 8, 3);
    if (y > 0.2) {
      c.copy(SAND_LAND);
      const green = smoothstep(2.6, 5.5, y + (n - 0.5) * 3);
      c.lerp(n > 0.55 ? GRASS_DRY : GRASS, green);
      c.lerp(ROCK, smoothstep(0.82, 0.62, ny) * green);
    } else {
      c.copy(SAND_SEA);
      const garden = smoothstep(16, 34, z) * (1 - smoothstep(100, 112, z));
      c.lerp(REEF, garden * smoothstep(0.45, 0.7, n) * 0.7);
      c.lerp(ROCK, smoothstep(0.80, 0.56, ny));
      c.lerp(ROCK_DARK, smoothstep(0.6, 0.32, ny) * (0.5 + n * 0.5));
      if (z > 138 && z < 198 && Math.abs(x) < 60 && terrainRaw(x, z) > y + 3) c.copy(CAVE).multiplyScalar(0.75 + n * 0.5);
    }
    col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b;
  }
  g.setAttribute('color', new THREE.BufferAttribute(col, 3));

  // Cut the sheet into tiles that share the vertex buffers, so far tiles can be skipped.
  const TILE = 36;
  const tiles = [];
  for (let tz = 0; tz < nz; tz += TILE) {
    for (let tx = 0; tx < nx; tx += TILE) {
      const ti = [];
      const ex = Math.min(nx, tx + TILE), ez = Math.min(nz, tz + TILE);
      for (let iz = tz; iz < ez; iz++) {
        for (let ix = tx; ix < ex; ix++) {
          const a = iz * (nx + 1) + ix, b = a + 1, cc = a + nx + 1, d = cc + 1;
          ti.push(a, cc, b, b, cc, d);
        }
      }
      const t = new THREE.BufferGeometry();
      t.setAttribute('position', g.attributes.position);
      t.setAttribute('normal', g.attributes.normal);
      t.setAttribute('uv', g.attributes.uv);
      t.setAttribute('color', g.attributes.color);
      t.setIndex(ti);
      const box = new THREE.Box3();
      const v = new THREE.Vector3();
      for (const j of [tz * (nx + 1) + tx, tz * (nx + 1) + ex, ez * (nx + 1) + tx, ez * (nx + 1) + ex]) {
        box.expandByPoint(v.set(pos[j * 3], 0, pos[j * 3 + 2]));
      }
      box.min.y = -46; box.max.y = 40;
      t.boundingBox = box;
      t.boundingSphere = box.getBoundingSphere(new THREE.Sphere());
      tiles.push(t);
    }
  }
  return tiles;
}

/** Terrain height baked into a texture so the ocean shader knows the water depth. */
export const HEIGHT_MAP = { x0: -256, x1: 256, z0: -232, z1: 152, range: 12 };

export function buildHeightTexture(size = 256) {
  const { x0, x1, z0, z1, range } = HEIGHT_MAP;
  const data = new Uint8Array(size * size);
  for (let j = 0; j < size; j++) {
    const z = z0 + (z1 - z0) * (j + 0.5) / size;
    for (let i = 0; i < size; i++) {
      const x = x0 + (x1 - x0) * (i + 0.5) / size;
      const h = Math.min(range, Math.max(-range, terrainRaw(x, z)));
      data[j * size + i] = Math.round((h + range) / (2 * range) * 255);
    }
  }
  const tex = new THREE.DataTexture(data, size, size, THREE.RedFormat, THREE.UnsignedByteType);
  tex.magFilter = tex.minFilter = THREE.LinearFilter;
  tex.wrapS = tex.wrapT = THREE.ClampToEdgeWrapping;
  tex.needsUpdate = true;
  return tex;
}

/**
 * Random points on the terrain. `accept(p)` gets { x, y, z, d, r } where d is the
 * distance to the camera path; return false to reject.
 */
export function scatter({ seed, count, area, accept, tries = 30 }) {
  const rng = makeRng(seed);
  const [x0, x1, z0, z1] = area;
  const out = [];
  let guard = count * tries;
  while (out.length < count && guard-- > 0) {
    const x = x0 + rng() * (x1 - x0), z = z0 + rng() * (z1 - z0);
    const p = { x, z, y: terrainHeight(x, z), d: nearestOnPath(x, z).d, r: rng };
    if (accept && !accept(p)) continue;
    out.push({ x, y: p.y, z, d: p.d, a: rng(), b: rng(), c: rng() });
  }
  return out;
}
