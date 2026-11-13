import { useMemo } from 'react';
import * as THREE from 'three';

// [x, yBase, z, scale, hue] — sides only (|x| ≥ 14), full Z path 100 → -70
const PLACEMENTS = [
  // ── right side ──
  [ 17, -41,  92, 1.1, 0.52], [ 24, -41,  78, 0.9, 0.56],
  [ 15, -41,  64, 1.3, 0.50], [ 22, -41,  50, 0.8, 0.54],
  [ 18, -41,  36, 1.2, 0.48], [ 26, -41,  22, 1.0, 0.52],
  [ 14, -41,   8, 1.4, 0.55], [ 20, -41,  -6, 0.9, 0.50],
  [ 23, -41, -20, 1.1, 0.46], [ 16, -41, -34, 1.0, 0.54],
  [ 21, -41, -48, 0.8, 0.50], [ 25, -41, -62, 1.2, 0.48],
  // ── left side ──
  [-19, -41,  88, 1.0, 0.46], [-14, -41,  74, 1.2, 0.50],
  [-23, -41,  60, 0.9, 0.54], [-17, -41,  46, 1.1, 0.48],
  [-25, -41,  32, 0.8, 0.52], [-15, -41,  18, 1.3, 0.46],
  [-21, -41,   4, 1.0, 0.50], [-18, -41, -10, 0.9, 0.54],
  [-24, -41, -24, 1.1, 0.48], [-16, -41, -38, 1.2, 0.50],
  [-22, -41, -52, 0.8, 0.46], [-14, -41, -66, 1.0, 0.52],
];

const BRANCHES = [
  [  0,    0,    0,  0.12, 1.5,  0    ],
  [  0.3,  0.4,  0,  0.08, 0.9,  0.4  ],
  [ -0.3,  0.35, 0,  0.08, 0.85,-0.38 ],
  [  0.1,  0.6,  0.2,0.06, 0.7,  0.2  ],
];

function makeCoralTexture() {
  const c = document.createElement('canvas');
  c.width = c.height = 64;
  const ctx = c.getContext('2d');

  // Transparent base — colour comes from MeshStandardMaterial tint
  ctx.clearRect(0, 0, 64, 64);

  // Organic polyp cells (circles)
  for (let i = 0; i < 35; i++) {
    const x = Math.random() * 64;
    const y = Math.random() * 64;
    const r = 2 + Math.random() * 5;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.strokeStyle = `rgba(255,255,255,${0.06 + Math.random() * 0.12})`;
    ctx.lineWidth = 0.7;
    ctx.stroke();
  }

  // Vertical highlight stripe
  const g = ctx.createLinearGradient(0, 0, 0, 64);
  g.addColorStop(0,   'rgba(255,255,255,0.15)');
  g.addColorStop(0.4, 'rgba(255,255,255,0.03)');
  g.addColorStop(1,   'rgba(0,0,0,0.12)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 64, 64);

  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  return tex;
}

export function CoralBed() {
  const coralTex = useMemo(() => makeCoralTexture(), []);

  const meshes = useMemo(() =>
    PLACEMENTS.map(([x, yBase, z, scale, hue]) => {
      // Brighter, more saturated coral colours
      const lightness = 0.44 + Math.random() * 0.14;
      const color = new THREE.Color().setHSL(hue, 0.70, lightness);
      return { x, yBase, z, scale, color };
    }),
  []);

  return (
    <>
      {meshes.map(({ x, yBase, z, scale, color }, i) =>
        BRANCHES.map(([bx, by, bz, rTop, h, rotZ], j) => (
          <mesh
            key={`c${i}-${j}`}
            position={[x + bx * scale, yBase + by * scale, z + bz * scale]}
            rotation={[0, (i * 0.91) % (Math.PI * 2), rotZ * scale * 0.5]}
            castShadow
          >
            <cylinderGeometry args={[rTop * scale, (rTop + 0.06) * scale, h * scale, 7]} />
            <meshStandardMaterial
              color={color}
              roughness={0.50}
              metalness={0.02}
              map={coralTex}
              emissive={color}
              emissiveIntensity={0.35}
            />
          </mesh>
        ))
      )}
    </>
  );
}
