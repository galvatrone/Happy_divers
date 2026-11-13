import { useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { merge, paint } from './geo';
import { scatter, terrainHeight } from './terrain';
import { instanced, pick } from './instanced';
import { patchUnderwater } from './underwater';
import { DENSITY } from './quality';

// The bigger animals: turtles, manta rays and reef sharks cruise slow loops beside the dive
// path; starfish and sea urchins sit on the sand. Everything is built from primitives.

const tri = pts => {
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(new Array((pts.length / 3) * 2).fill(0.5), 2));
  g.computeVertexNormals();
  return g;
};
const blob = (r, sx, sy, sz, x = 0, y = 0, z = 0) => {
  const g = new THREE.SphereGeometry(r, 12, 8);
  g.scale(sx, sy, sz);
  g.translate(x, y, z);
  return g;
};

// ── geometry (nose toward +z, about one unit long before scaling) ──
function turtleParts() {
  const body = merge([
    paint(blob(0.5, 0.82, 0.36, 1.0), '#5d7a45'),                 // shell
    paint(blob(0.5, 0.74, 0.16, 0.92, 0, -0.1, 0), '#d8cf9a'),    // belly plate
    paint(blob(0.16, 0.9, 0.8, 1.2, 0, 0, 0.6), '#8fa06a'),       // head
    paint(blob(0.2, 0.55, 0.12, 1.0, 0.26, -0.06, -0.48), '#7d9160'), // rear flippers
    paint(blob(0.2, 0.55, 0.12, 1.0, -0.26, -0.06, -0.48), '#7d9160'),
  ]);
  // front flipper: root at the origin, reaching out along +x
  const flipper = paint(blob(0.5, 0.92, 0.07, 0.3, 0.44, 0, -0.08), '#7d9160');
  return { body, flipper };
}

function mantaParts() {
  const body = merge([
    paint(blob(0.5, 0.7, 0.2, 1.0), '#27323f'),
    paint(blob(0.5, 0.62, 0.1, 0.9, 0, -0.06, 0), '#e9eef2'),     // white underside
    paint(blob(0.1, 0.5, 0.5, 1.6, 0.2, 0, 0.5), '#27323f'),      // head fins
    paint(blob(0.1, 0.5, 0.5, 1.6, -0.2, 0, 0.5), '#27323f'),
    paint(blob(0.5, 0.03, 0.03, 1.5, 0, 0, -1.1), '#1b232c'),     // tail
  ]);
  // wing: root along z at the origin, tip at +x
  const wing = paint(merge([
    tri([0, 0.02, 0.42, 0, 0.02, -0.42, 1.55, 0.02, -0.22]),
    tri([0, 0.02, 0.42, 1.55, 0.02, -0.22, 0.75, 0.02, 0.2]),
  ]), '#2c3947');
  return { body, wing };
}

function sharkGeometry() {
  const body = blob(0.5, 0.2, 0.23, 1.0);
  // taper the tail half
  const p = body.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const z = p.getZ(i);
    if (z < 0) { const k = 1 + z * 1.1; p.setX(i, p.getX(i) * k); p.setY(i, p.getY(i) * k); }
  }
  body.computeVertexNormals();
  return merge([
    body,
    tri([0, 0.1, 0.12, 0, 0.34, -0.08, 0, 0.1, -0.14]),            // dorsal
    tri([0, 0, -0.44, 0, 0.3, -0.7, 0, 0.02, -0.56]),              // tail, upper lobe
    tri([0, 0, -0.44, 0, 0.02, -0.56, 0, -0.14, -0.62]),           // tail, lower lobe
    tri([0.07, -0.05, 0.14, 0.36, -0.12, -0.06, 0.07, -0.05, -0.04]),   // pectorals
    tri([-0.07, -0.05, 0.14, -0.07, -0.05, -0.04, -0.36, -0.12, -0.06]),
  ]);
}

function starfishGeometry() {
  const shape = new THREE.Shape();
  for (let i = 0; i < 10; i++) {
    const a = (i / 10) * Math.PI * 2, r = i % 2 ? 0.2 : 0.5;
    if (i === 0) shape.moveTo(Math.cos(a) * r, Math.sin(a) * r);
    else shape.lineTo(Math.cos(a) * r, Math.sin(a) * r);
  }
  const g = new THREE.ExtrudeGeometry(shape, { depth: 0.06, bevelEnabled: true, bevelSize: 0.05, bevelThickness: 0.06, bevelSegments: 1 });
  g.rotateX(-Math.PI / 2);
  return g;
}

function urchinGeometry() {
  const parts = [new THREE.IcosahedronGeometry(0.2, 1)];
  const dirs = new THREE.IcosahedronGeometry(1, 1).attributes.position;
  const up = new THREE.Vector3(0, 1, 0), d = new THREE.Vector3(), q = new THREE.Quaternion(), seen = new Set();
  for (let i = 0; i < dirs.count; i++) {
    d.fromBufferAttribute(dirs, i);
    const key = `${d.x.toFixed(2)},${d.y.toFixed(2)},${d.z.toFixed(2)}`;
    if (seen.has(key) || d.y < -0.3) continue;
    seen.add(key);
    const spine = new THREE.ConeGeometry(0.018, 0.5, 3);
    spine.translate(0, 0.38, 0);
    spine.applyQuaternion(q.setFromUnitVectors(up, d));
    parts.push(spine);
  }
  return merge(parts);
}

// ── who swims where: an ellipse (rx, rz) around c, one lap every `lap` seconds ──
const SWIMMERS = [
  { kind: 'turtle', c: [ 14,  -3.2,  -2], rx: 9,  rz: 6,  lap: 70,  size: 1.1 },
  { kind: 'turtle', c: [  6, -10.0,  52], rx: 12, rz: 8,  lap: 85,  size: 1.3, dir: -1 },
  { kind: 'turtle', c: [-12, -15.0,  96], rx: 9,  rz: 7,  lap: 80,  size: 1.0 },
  { kind: 'manta',  c: [  0, -21.0, 131], rx: 24, rz: 8,  lap: 95,  size: 2.4 },
  { kind: 'manta',  c: [ -6, -26.0, 133], rx: 20, rz: 7,  lap: 110, size: 1.9, dir: -1, phase: 2.4 },
  { kind: 'manta',  c: [  0, -31.0, 222], rx: 16, rz: 12, lap: 100, size: 2.2 },
  { kind: 'shark',  c: [-24, -24.0, 128], rx: 16, rz: 6,  lap: 60,  size: 2.6 },
  { kind: 'shark',  c: [ 10, -33.0, 226], rx: 18, rz: 12, lap: 64,  size: 2.9, dir: -1, phase: 1.2 },
  { kind: 'shark',  c: [ 24, -29.0, 136], rx: 8,  rz: 5,  lap: 52,  size: 2.1, phase: 3 },
];

function Swimmers() {
  const list = useMemo(() => {
    const lit = () => patchUnderwater(new THREE.MeshLambertMaterial({ vertexColors: true, side: THREE.DoubleSide }));
    const turtle = turtleParts(), manta = mantaParts();
    const turtleMat = lit(), mantaMat = lit();
    const sharkGeo = sharkGeometry();
    const sharkMat = patchUnderwater(new THREE.MeshLambertMaterial({ color: '#7d8894' }), { motion: 'fish' });

    return SWIMMERS.map(sw => {
      const group = new THREE.Group();
      let left = null, right = null;
      if (sw.kind === 'shark') {
        group.add(new THREE.Mesh(sharkGeo, sharkMat));
      } else {
        const parts = sw.kind === 'turtle' ? turtle : manta;
        const mat = sw.kind === 'turtle' ? turtleMat : mantaMat;
        const limb = sw.kind === 'turtle' ? parts.flipper : parts.wing;
        group.add(new THREE.Mesh(parts.body, mat));
        right = new THREE.Mesh(limb, mat);
        left = new THREE.Mesh(limb, mat);
        left.scale.x = -1;
        if (sw.kind === 'turtle') { right.position.set(0.3, -0.02, 0.3); left.position.set(-0.3, -0.02, 0.3); }
        else { right.position.x = 0.28; left.position.x = -0.28; }
        group.add(right, left);
      }
      group.scale.setScalar(sw.size);
      // keep the whole lap above the seabed (open water only — the cave massif is not on any lap)
      let y = sw.c[1];
      for (let i = 0; i < 24; i++) {
        const a = (i / 24) * Math.PI * 2;
        y = Math.max(y, terrainHeight(sw.c[0] + Math.cos(a) * sw.rx, sw.c[2] + Math.sin(a) * sw.rz) + 1.2 + sw.size * 0.4);
      }
      return { ...sw, y: Math.min(-1.6, y), group, left, right };
    });
  }, []);

  const next = useMemo(() => new THREE.Vector3(), []);

  useFrame(({ clock, camera }) => {
    const t = clock.elapsedTime;
    for (const sw of list) {
      const g = sw.group;
      const w = ((Math.PI * 2) / sw.lap) * (sw.dir || 1);
      const a = t * w + (sw.phase || 0);
      const x = sw.c[0] + Math.cos(a) * sw.rx, z = sw.c[2] + Math.sin(a) * sw.rz;
      g.visible = Math.hypot(x - camera.position.x, z - camera.position.z) < 85 && camera.position.y < 0.5;
      if (!g.visible) continue;
      const y = sw.y + Math.sin(t * 0.25 + sw.lap) * 0.7;
      g.position.set(x, y, z);
      const a2 = a + Math.sign(w) * 0.05;
      next.set(sw.c[0] + Math.cos(a2) * sw.rx, y, sw.c[2] + Math.sin(a2) * sw.rz);
      g.lookAt(next);
      if (sw.kind === 'turtle') {
        const f = Math.sin(t * 1.5 + sw.lap) * 0.55;
        sw.right.rotation.z = f; sw.left.rotation.z = -f;
        sw.right.rotation.y = sw.left.rotation.y = 0;
      } else if (sw.kind === 'manta') {
        const f = Math.sin(t * 1.1 + sw.lap) * 0.42;
        sw.right.rotation.z = f; sw.left.rotation.z = -f;
        g.position.y += f * 0.25;
      }
    }
  });

  return <>{list.map((sw, i) => <primitive key={i} object={sw.group} />)}</>;
}

const STAR = ['#ff7043', '#e53935', '#ffb300', '#8e5bd6', '#ff8fa3'];
const URCHIN = ['#1c1626', '#2a1a33', '#141a24'];

function SeabedLife() {
  const meshes = useMemo(() => {
    const mat = () => patchUnderwater(new THREE.MeshLambertMaterial({ color: '#ffffff' }));
    const sand = p => p.d > 1.5 && p.d < 16 && p.y < -2;
    const stars = scatter({ seed: 71, count: Math.round(90 * DENSITY), area: [-30, 45, -30, 104], accept: sand });
    const urchins = scatter({ seed: 72, count: Math.round(70 * DENSITY), area: [-30, 45, -20, 104], accept: sand });
    return [
      instanced(starfishGeometry(), mat(), stars.map(p => ({
        x: p.x, y: p.y + 0.06, z: p.z, s: 0.35 + p.a * 0.45, ry: p.b * 6.28, color: pick(STAR, p.c),
      }))),
      instanced(urchinGeometry(), mat(), urchins.map(p => ({
        x: p.x, y: p.y + 0.12, z: p.z, s: 0.7 + p.a * 0.8, ry: p.b * 6.28, color: pick(URCHIN, p.c, 0.04),
      }))),
    ];
  }, []);
  return <>{meshes.map((m, i) => <primitive key={i} object={m} />)}</>;
}

export function Fauna() {
  return (
    <>
      <Swimmers />
      <SeabedLife />
    </>
  );
}
