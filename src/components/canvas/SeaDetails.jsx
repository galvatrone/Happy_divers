import { useRef, useMemo, useEffect } from 'react';
import * as THREE from 'three';

const SHELL_COUNT  = 55;
const PEBBLE_COUNT = 65;

function rng(seed) {
  let s = seed;
  return () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; };
}

function buildShellData() {
  const r = rng(7);
  return Array.from({ length: SHELL_COUNT }, (_, i) => {
    const hue = 0.05 + r() * 0.12;          // warm white → cream → light coral
    return {
      x:    (r() - 0.5) * 26,
      z:    -22 + r() * 102,
      y:    -41.85,
      sx:   0.16 + r() * 0.30,
      sy:   0.05 + r() * 0.09,              // very flat
      sz:   0.14 + r() * 0.28,
      rotY: r() * Math.PI * 2,
      color: new THREE.Color().setHSL(hue, 0.25 + r() * 0.35, 0.62 + r() * 0.28),
    };
  });
}

function buildPebbleData() {
  const r = rng(13);
  return Array.from({ length: PEBBLE_COUNT }, (_, i) => {
    const hue = 0.50 + r() * 0.10;          // teal-grey range
    return {
      x:    (r() - 0.5) * 28,
      z:    -22 + r() * 102,
      y:    -41.82,
      sx:   0.10 + r() * 0.30,
      sy:   0.08 + r() * 0.20,
      sz:   0.10 + r() * 0.30,
      rotY: r() * Math.PI * 2,
      color: new THREE.Color().setHSL(hue, 0.20 + r() * 0.25, 0.20 + r() * 0.22),
    };
  });
}

const SHELLS  = buildShellData();
const PEBBLES = buildPebbleData();

const shellGeom  = new THREE.SphereGeometry(1, 6, 4);
const pebbleGeom = new THREE.IcosahedronGeometry(1, 0);

const shellMat  = new THREE.MeshStandardMaterial({ roughness: 0.30, metalness: 0.08 });
const pebbleMat = new THREE.MeshStandardMaterial({ roughness: 0.82, metalness: 0.02 });

const _dummy = new THREE.Object3D();

export function SeaDetails() {
  const shellRef  = useRef();
  const pebbleRef = useRef();

  useEffect(() => {
    const sm = shellRef.current;
    const pm = pebbleRef.current;
    if (!sm || !pm) return;

    SHELLS.forEach(({ x, y, z, sx, sy, sz, rotY, color }, i) => {
      _dummy.position.set(x, y, z);
      _dummy.scale.set(sx, sy, sz);
      _dummy.rotation.set(0, rotY, 0.05);
      _dummy.updateMatrix();
      sm.setMatrixAt(i, _dummy.matrix);
      sm.setColorAt(i, color);
    });
    sm.instanceMatrix.needsUpdate = true;
    sm.instanceColor.needsUpdate  = true;

    PEBBLES.forEach(({ x, y, z, sx, sy, sz, rotY, color }, i) => {
      _dummy.position.set(x, y, z);
      _dummy.scale.set(sx, sy, sz);
      _dummy.rotation.set(0.1, rotY, 0.06);
      _dummy.updateMatrix();
      pm.setMatrixAt(i, _dummy.matrix);
      pm.setColorAt(i, color);
    });
    pm.instanceMatrix.needsUpdate = true;
    pm.instanceColor.needsUpdate  = true;
  }, []);

  return (
    <>
      <instancedMesh ref={shellRef}  args={[shellGeom,  shellMat,  SHELL_COUNT]}  />
      <instancedMesh ref={pebbleRef} args={[pebbleGeom, pebbleMat, PEBBLE_COUNT]} />
    </>
  );
}
