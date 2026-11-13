import { useMemo } from 'react';
import * as THREE from 'three';

const ROCK_PLACEMENTS = [
  [  8, -42, 45, 2.8, 2.1, 2.4], [ -9, -42, 38, 3.2, 2.4, 2.8],
  [ 10, -42, 28, 2.2, 1.8, 2.0], [ -9, -42, 18, 2.6, 2.0, 2.3],
  [  8, -42,  6, 1.9, 1.5, 1.8], [ -8, -42, -4, 2.4, 1.9, 2.1],
  [ 10, -42,-14, 2.8, 2.2, 2.5], [ -9, -42,-24, 2.1, 1.7, 1.9],
  [  7, -42,-36, 2.6, 2.0, 2.3], [ -8, -42,-46, 2.4, 1.8, 2.0],
  [  6, -42, 52, 1.8, 1.4, 1.6], [  4, -40, 32, 1.4, 1.1, 1.2],
  [ -5, -40, 22, 1.6, 1.3, 1.4], [  5, -40,  0, 1.5, 1.2, 1.3],
  [ -4, -40,-20, 1.4, 1.1, 1.3],
];

function makeRockTexture() {
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const ctx = c.getContext('2d');

  // Base dark teal-grey
  ctx.fillStyle = '#152535';
  ctx.fillRect(0, 0, 128, 128);

  // Moss patches (lighter radial blobs)
  for (let i = 0; i < 22; i++) {
    const x = Math.random() * 128;
    const y = Math.random() * 128;
    const r = 6 + Math.random() * 18;
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, `rgba(28, 72, 88, ${0.25 + Math.random() * 0.3})`);
    g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  // Dark crevices
  for (let i = 0; i < 8; i++) {
    let x = Math.random() * 128;
    let y = Math.random() * 128;
    ctx.beginPath();
    ctx.moveTo(x, y);
    for (let j = 0; j < 6; j++) {
      x = Math.max(0, Math.min(128, x + (Math.random() - 0.5) * 28));
      y = Math.max(0, Math.min(128, y + (Math.random() - 0.5) * 28));
      ctx.lineTo(x, y);
    }
    ctx.strokeStyle = `rgba(4, 12, 22, ${0.4 + Math.random() * 0.35})`;
    ctx.lineWidth = 0.8 + Math.random() * 1.2;
    ctx.stroke();
  }

  // Mineral highlight flecks
  for (let i = 0; i < 60; i++) {
    const x = Math.random() * 128;
    const y = Math.random() * 128;
    ctx.beginPath();
    ctx.arc(x, y, 0.5 + Math.random() * 0.8, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(60, 120, 150, ${0.15 + Math.random() * 0.2})`;
    ctx.fill();
  }

  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  return tex;
}

const _geom = new THREE.IcosahedronGeometry(1, 1);

export function ReefRocks() {
  const rockTex = useMemo(() => makeRockTexture(), []);

  const mat = useMemo(() => new THREE.MeshStandardMaterial({
    color:     new THREE.Color(0x1e3d50),
    roughness: 0.78,
    metalness: 0.06,
    map:       rockTex,
    emissive:  new THREE.Color(0x051520),
    emissiveIntensity: 0.15,
  }), [rockTex]);

  const instances = useMemo(() =>
    ROCK_PLACEMENTS.map(([x, y, z, sx, sy, sz], i) => ({
      position: [x, y + sy * 0.4, z],
      scale:    [sx, sy, sz],
      rotY:     i * 1.37,
    })),
  []);

  return (
    <>
      {instances.map(({ position, scale, rotY }, i) => (
        <mesh
          key={i}
          geometry={_geom}
          material={mat}
          position={position}
          scale={scale}
          rotation={[0.1, rotY, 0.05]}
          receiveShadow
        />
      ))}
    </>
  );
}
