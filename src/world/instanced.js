import * as THREE from 'three';

const dummy = new THREE.Object3D();
const BAND = 34;

/** Every mesh that can be switched off when it is far from the camera. Rig.jsx walks this list. */
export const cullables = [];

export function registerCullable(mesh) {
  if (!mesh.geometry.boundingSphere && !mesh.boundingSphere) mesh.geometry.computeBoundingSphere();
  cullables.push(mesh);
  return mesh;
}

function build(geometry, material, items) {
  const mesh = new THREE.InstancedMesh(geometry, material, Math.max(1, items.length));
  mesh.count = items.length;
  items.forEach((it, i) => {
    dummy.position.set(it.x, it.y, it.z);
    dummy.rotation.set(it.rx || 0, it.ry || 0, it.rz || 0);
    if (Array.isArray(it.s)) dummy.scale.set(it.s[0], it.s[1], it.s[2]);
    else dummy.scale.setScalar(it.s ?? 1);
    dummy.updateMatrix();
    mesh.setMatrixAt(i, dummy.matrix);
    if (it.color) mesh.setColorAt(i, it.color);
  });
  mesh.instanceMatrix.needsUpdate = true;
  if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  mesh.computeBoundingSphere();
  return registerCullable(mesh);
}

/**
 * items: [{ x, y, z, s (number | [sx, sy, sz]), rx, ry, rz, color (THREE.Color) }]
 * Returns a group of InstancedMeshes, one per strip of the world along z, so the GPU
 * only ever draws the strips around the diver.
 */
export function instanced(geometry, material, items) {
  const bands = new Map();
  for (const it of items) {
    const k = Math.floor(it.z / BAND);
    if (!bands.has(k)) bands.set(k, []);
    bands.get(k).push(it);
  }
  const group = new THREE.Group();
  for (const list of bands.values()) group.add(build(geometry, material, list));
  return group;
}

const _c = new THREE.Color();
/** Pick a palette colour and jitter its lightness a little. */
export function pick(palette, r, jitter = 0.12) {
  _c.set(palette[Math.floor(r * palette.length) % palette.length]);
  const hsl = { h: 0, s: 0, l: 0 };
  _c.getHSL(hsl);
  const j = ((r * 7919) % 1 - 0.5) * 2 * jitter;
  return new THREE.Color().setHSL(hsl.h, hsl.s, Math.min(0.9, Math.max(0.05, hsl.l + j)));
}
