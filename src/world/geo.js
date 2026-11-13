import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { makeRng, fbm } from './terrain';

/** Merge any mix of indexed / non-indexed geometries, keeping position, normal, uv (+ color). */
export function merge(list) {
  const keep = list.every(g => g.attributes.color) ? ['position', 'normal', 'uv', 'color'] : ['position', 'normal', 'uv'];
  const flat = list.map(g => {
    const n = g.index ? g.toNonIndexed() : g;
    for (const name of Object.keys(n.attributes)) if (!keep.includes(name)) n.deleteAttribute(name);
    return n;
  });
  return mergeGeometries(flat, false);
}

export function paint(g, color) {
  const c = new THREE.Color(color);
  const n = g.attributes.position.count;
  const arr = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) { arr[i * 3] = c.r; arr[i * 3 + 1] = c.g; arr[i * 3 + 2] = c.b; }
  g.setAttribute('color', new THREE.BufferAttribute(arr, 3));
  return g;
}

/** Lumpy boulder, radius ≈ 1, flat-ish bottom. */
export function rockGeometry(seed, detail = 2) {
  const g = new THREE.IcosahedronGeometry(1, detail);
  const p = g.attributes.position;
  const o = seed * 13.7;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), y = p.getY(i), z = p.getZ(i);
    const n = fbm(x * 1.3 + o, z * 1.3 + y * 1.7 - o, 3);
    const k = 0.72 + n * 0.62;
    p.setXYZ(i, x * k, Math.max(y * k, -0.45), z * k);
  }
  // the icosahedron is non-indexed: weld so the normals come out smooth
  const welded = weld(g);
  welded.computeVertexNormals();
  return welded;
}

function weld(g) {
  const p = g.attributes.position, uv = g.attributes.uv;
  const map = new Map(), pos = [], uvs = [], idx = [];
  for (let i = 0; i < p.count; i++) {
    const key = `${p.getX(i).toFixed(3)},${p.getY(i).toFixed(3)},${p.getZ(i).toFixed(3)}`;
    let j = map.get(key);
    if (j === undefined) {
      j = pos.length / 3; map.set(key, j);
      pos.push(p.getX(i), p.getY(i), p.getZ(i));
      uvs.push(uv.getX(i), uv.getY(i));
    }
    idx.push(j);
  }
  const out = new THREE.BufferGeometry();
  out.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  out.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  out.setIndex(idx);
  return out;
}

/** Staghorn-style branching coral, about 1 unit tall. */
export function branchCoralGeometry(seed) {
  const rng = makeRng(seed);
  const parts = [];
  const up = new THREE.Vector3(0, 1, 0);
  const q = new THREE.Quaternion(), m = new THREE.Matrix4();

  function grow(origin, dir, len, rad, depth) {
    const g = new THREE.CylinderGeometry(rad * 0.62, rad, len, 5, 1, true);
    g.translate(0, len / 2, 0);
    q.setFromUnitVectors(up, dir);
    m.compose(origin, q, new THREE.Vector3(1, 1, 1));
    g.applyMatrix4(m);
    parts.push(g);
    const tip = origin.clone().addScaledVector(dir, len * 0.96);
    if (depth === 0) {
      const cap = new THREE.SphereGeometry(rad * 0.66, 5, 3);
      cap.translate(tip.x, tip.y, tip.z);
      parts.push(cap);
      return;
    }
    const kids = 2 + (rng() > 0.55 ? 1 : 0);
    for (let i = 0; i < kids; i++) {
      const a = rng() * Math.PI * 2, spread = 0.45 + rng() * 0.5;
      const d = dir.clone().add(new THREE.Vector3(Math.cos(a) * spread, 0.25, Math.sin(a) * spread)).normalize();
      grow(tip, d, len * (0.62 + rng() * 0.2), rad * 0.66, depth - 1);
    }
  }
  for (let i = 0; i < 3; i++) {
    const a = (i / 3) * Math.PI * 2 + rng();
    grow(new THREE.Vector3(Math.cos(a) * 0.08, 0, Math.sin(a) * 0.08),
      new THREE.Vector3(Math.cos(a) * 0.4, 1, Math.sin(a) * 0.4).normalize(), 0.36, 0.075, 2);
  }
  return merge(parts);
}

/** Brain / boulder coral: a bumpy dome. */
export function brainCoralGeometry(seed) {
  const g = new THREE.SphereGeometry(1, 20, 12, 0, Math.PI * 2, 0, Math.PI * 0.6);
  const p = g.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), y = p.getY(i), z = p.getZ(i);
    const groove = Math.sin((x + fbm(z * 2 + seed, y * 2, 2)) * 9) * Math.sin((z + fbm(x * 2, y * 2 + seed, 2)) * 9);
    const k = 0.9 + fbm(x * 1.6 + seed, z * 1.6, 2) * 0.3 + groove * 0.035;
    p.setXYZ(i, x * k, y * k * 0.78, z * k);
  }
  g.computeVertexNormals();
  return g;
}

/** Table coral: a wavy plate on a short stem. */
export function tableCoralGeometry(seed) {
  const top = new THREE.CylinderGeometry(1, 0.82, 0.1, 22, 1);
  const p = top.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), z = p.getZ(i);
    const r = Math.hypot(x, z);
    const a = Math.atan2(z, x);
    const k = 1 + Math.sin(a * 5 + seed) * 0.09 * r + Math.sin(a * 11 + seed * 2) * 0.04 * r;
    p.setXYZ(i, x * k, p.getY(i) + r * r * 0.12 + Math.sin(a * 3 + seed) * 0.05 * r, z * k);
  }
  top.translate(0, 0.62, 0);
  top.computeVertexNormals();
  const stem = new THREE.CylinderGeometry(0.2, 0.34, 0.62, 7, 1);
  stem.translate(0, 0.31, 0);
  return merge([top, stem]);
}

/** Cluster of tube sponges. */
export function spongeGeometry(seed) {
  const rng = makeRng(seed);
  const parts = [];
  const n = 4 + Math.floor(rng() * 3);
  for (let i = 0; i < n; i++) {
    const h = 0.5 + rng() * 0.6, r = 0.1 + rng() * 0.08;
    const g = new THREE.CylinderGeometry(r * 1.15, r * 0.7, h, 9, 3, true);
    g.translate(0, h / 2, 0);
    g.rotateZ((rng() - 0.5) * 0.5);
    g.rotateX((rng() - 0.5) * 0.5);
    const a = rng() * Math.PI * 2, d = rng() * 0.22;
    g.translate(Math.cos(a) * d, 0, Math.sin(a) * d);
    parts.push(g);
  }
  return merge(parts);
}

/** Alpha texture of a sea fan: a flat, finely branched tree. */
export function seaFanTexture(seed = 7) {
  const size = 256;
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const ctx = c.getContext('2d');
  const rng = makeRng(seed);
  ctx.strokeStyle = '#fff';
  ctx.lineCap = 'round';
  function branch(x, y, a, len, w, depth) {
    const x2 = x + Math.cos(a) * len, y2 = y - Math.sin(a) * len;
    ctx.lineWidth = w;
    ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x2, y2); ctx.stroke();
    if (depth === 0 || len < 4) return;
    const kids = depth > 4 ? 3 : 2;
    for (let i = 0; i < kids; i++) {
      branch(x2, y2, a + (rng() - 0.5) * 1.25, len * (0.66 + rng() * 0.18), Math.max(0.9, w * 0.68), depth - 1);
    }
  }
  branch(size / 2, size - 2, Math.PI / 2, 58, 7, 7);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/** Fish, about 1 unit long, nose toward +z. */
export function fishGeometry() {
  const body = new THREE.SphereGeometry(0.5, 10, 8);
  body.scale(0.26, 0.5, 1);
  const tri = pts => {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
    g.setAttribute('uv', new THREE.Float32BufferAttribute([0.75, 0.2, 0.75, 0.2, 0.75, 0.2], 2));
    g.computeVertexNormals();
    return g;
  };
  const tailA = tri([0, 0, -0.42, 0, 0.26, -0.78, 0, 0.0, -0.62]);
  const tailB = tri([0, 0, -0.42, 0, 0.0, -0.62, 0, -0.26, -0.78]);
  const dorsal = tri([0, 0.2, 0.18, 0, 0.42, -0.1, 0, 0.2, -0.26]);
  return merge([body, tailA, tailB, dorsal]);
}

/** Palm: curved trunk + arching fronds, as two geometries. Root at the origin, ~7 units tall. */
export function palmGeometry(seed) {
  const rng = makeRng(seed);
  const lean = 0.8 + rng() * 1.4;
  const top = new THREE.Vector3(lean, 6.2 + rng() * 1.2, 0);
  const path = new THREE.QuadraticBezierCurve3(new THREE.Vector3(0, 0, 0), new THREE.Vector3(lean * 0.15, top.y * 0.6, 0), top);
  const trunk = new THREE.TubeGeometry(path, 8, 0.19, 6, false);
  const parts = [];
  const fronds = 9;
  for (let i = 0; i < fronds; i++) {
    const g = new THREE.PlaneGeometry(1.7, 3.6, 2, 6);
    g.translate(0, 1.8, 0);
    const p = g.attributes.position;
    const droop = 0.9 + rng() * 0.5;
    for (let j = 0; j < p.count; j++) {
      const x = p.getX(j), y = p.getY(j);
      const t = y / 3.6;
      // leaf narrows to the tip, folds along the midrib, arches out and down
      const w = x * (1 - t * 0.3);
      p.setXYZ(j, w, y * 0.34 - t * t * 2.1 * droop - Math.abs(w) * 0.5, y * 0.9);
    }
    g.computeVertexNormals();
    g.rotateY((i / fronds) * Math.PI * 2 + rng() * 0.5);
    g.translate(top.x, top.y - 0.05, top.z);
    parts.push(g);
  }
  return { trunk, fronds: merge(parts) };
}
