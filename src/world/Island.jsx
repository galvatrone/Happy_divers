import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { palmGeometry, rockGeometry } from './geo';
import { scatter, terrainHeight } from './terrain';
import { instanced, pick } from './instanced';
import { DENSITY } from './quality';
import { surface, frondTexture, foliageTexture } from './textures';

const CANOPY = ['#2f6a22', '#3d7a28', '#285c24', '#4a8a2c', '#35702a'];

/** Red flag with a white diagonal — "diver down". */
function diveFlagTexture() {
  const c = document.createElement('canvas');
  c.width = 64; c.height = 48;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#d8232a'; ctx.fillRect(0, 0, 64, 48);
  ctx.strokeStyle = '#fff'; ctx.lineWidth = 9;
  ctx.beginPath(); ctx.moveTo(-4, -3); ctx.lineTo(68, 51); ctx.stroke();
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

/** What you see from the water: palms, jungle, the dive hut with its pier, and the boat. */
export function Island() {
  const boat = useRef();
  const flag = useMemo(() => diveFlagTexture(), []);
  const planks = useMemo(() => surface('brown_planks_05', [2, 2]), []);
  const deck = useMemo(() => surface('brown_planks_05', [1, 8]), []);
  const thatch = useMemo(() => surface('thatch_roof_angled', [4, 1.5]), []);

  const { palms, canopy } = useMemo(() => {
    const leafMat = new THREE.MeshLambertMaterial({ color: '#5fa03a', map: frondTexture(), alphaTest: 0.35, side: THREE.DoubleSide });
    const barkMat = new THREE.MeshLambertMaterial({ color: new THREE.Color(1.5, 1.4, 1.3), ...surface('palm_tree_bark', [2, 3]) });
    const beach = scatter({
      seed: 61, count: Math.round(54 * DENSITY), area: [-125, 125, -100, -50],
      accept: p => p.y > 1.2 && p.y < 5.5 && Math.hypot(p.x - 34, p.z + 60) > 9,
    });
    const sets = [[], [], []];
    beach.forEach((p, i) => sets[i % 3].push({ x: p.x, y: p.y - 0.2, z: p.z, s: 0.8 + p.a * 0.7, ry: p.c * 6.28 }));
    const palmMeshes = sets.flatMap((items, i) => {
      const g = palmGeometry(70 + i);
      return [instanced(g.trunk, barkMat, items), instanced(g.fronds, leafMat, items)];
    });

    const bushMat = new THREE.MeshLambertMaterial({ color: new THREE.Color(1.5, 1.5, 1.5), map: foliageTexture() });
    const hills = scatter({
      seed: 62, count: Math.round(520 * DENSITY), area: [-190, 190, -228, -62],
      accept: p => p.y > 4.5,
    }).map(p => ({
      x: p.x, y: p.y + 0.6, z: p.z, s: [2.6 + p.a * 3.6, 2.2 + p.b * 2.6, 2.6 + p.c * 3.6], ry: p.c * 6.28,
      color: pick(CANOPY, p.b, 0.07),
    }));
    return { palms: palmMeshes, canopy: instanced(rockGeometry(8, 2), bushMat, hills) };
  }, []);

  // the hut stands on the sand to the right of centre, its pier runs out into the lagoon
  const hut = useMemo(() => ({ x: 34, z: -60, y: terrainHeight(34, -60) }), []);

  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    boat.current.position.y = 0.05 + Math.sin(t * 1.1) * 0.07;
    boat.current.rotation.z = Math.sin(t * 0.8) * 0.035;
    boat.current.rotation.x = Math.sin(t * 0.6 + 1) * 0.02;
  });

  return (
    <>
      {palms.map((m, i) => <primitive key={i} object={m} />)}
      <primitive object={canopy} />

      <group position={[hut.x, hut.y, hut.z]}>
        {[[-2.8, -2.2], [2.8, -2.2], [-2.8, 2.2], [2.8, 2.2]].map(([x, z]) => (
          <mesh key={`${x}${z}`} position={[x, 0.5, z]}>
            <cylinderGeometry args={[0.14, 0.14, 1.6, 6]} />
            <meshLambertMaterial color="#5b4630" />
          </mesh>
        ))}
        <mesh position={[0, 1.35, 0]}><boxGeometry args={[7.4, 0.25, 6.2]} /><meshLambertMaterial color="#c9b08a" {...planks} /></mesh>
        <mesh position={[0, 2.75, -0.4]}><boxGeometry args={[6, 2.6, 4.6]} /><meshLambertMaterial color={[1.7, 1.6, 1.4]} {...planks} /></mesh>
        <mesh position={[0, 2.5, 1.92]}><boxGeometry args={[1.2, 2.0, 0.08]} /><meshLambertMaterial color="#2b6f7f" /></mesh>
        <mesh position={[-1.9, 3.0, 1.92]}><boxGeometry args={[1.3, 1.0, 0.08]} /><meshLambertMaterial color="#7fd0e0" /></mesh>
        <mesh position={[1.9, 3.0, 1.92]}><boxGeometry args={[1.3, 1.0, 0.08]} /><meshLambertMaterial color="#7fd0e0" /></mesh>
        <mesh position={[0, 5.2, -0.2]} rotation={[0, Math.PI / 4, 0]}>
          <coneGeometry args={[5.6, 2.6, 4]} /><meshLambertMaterial color={[1.5, 1.35, 1.1]} {...thatch} />
        </mesh>
        {/* flag */}
        <mesh position={[4.4, 4.2, 2.6]}><cylinderGeometry args={[0.05, 0.05, 6, 5]} /><meshLambertMaterial color="#e8e8e8" /></mesh>
        <mesh position={[5.3, 6.5, 2.6]}><planeGeometry args={[1.8, 1.3]} /><meshBasicMaterial map={flag} side={THREE.DoubleSide} /></mesh>
      </group>

      {/* pier */}
      <group position={[hut.x, 0, 0]}>
        <mesh position={[0, 0.95, -42.5]}><boxGeometry args={[2.2, 0.18, 29]} /><meshLambertMaterial color={[1.4, 1.25, 1.05]} {...deck} /></mesh>
        {Array.from({ length: 8 }, (_, i) => -56 + i * 4).flatMap(z => [-1, 1].map(side => (
          <mesh key={`${z}${side}`} position={[side * 1.0, -0.6, z]}>
            <cylinderGeometry args={[0.11, 0.11, 3.4, 6]} /><meshLambertMaterial color="#5b4630" />
          </mesh>
        )))}
      </group>

      {/* dive boat at anchor */}
      <group ref={boat} position={[-11, 0.05, -14]} rotation={[0, 0.6, 0]}>
        <mesh scale={[1.25, 0.95, 3.7]}>
          <sphereGeometry args={[1, 20, 10, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2]} />
          <meshLambertMaterial color="#f4f6f8" side={THREE.DoubleSide} />
        </mesh>
        <mesh position={[0, 0.02, 0]} scale={[1.25, 1, 3.7]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[1, 24]} /><meshLambertMaterial color="#c8a878" />
        </mesh>
        <mesh position={[0, -0.12, 0]} scale={[1.28, 0.16, 3.74]}>
          <sphereGeometry args={[1, 20, 6, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2]} />
          <meshLambertMaterial color="#1f7fa8" />
        </mesh>
        <mesh position={[0, 0.55, 0.9]}><boxGeometry args={[1.5, 1.0, 1.6]} /><meshLambertMaterial color="#ffffff" /></mesh>
        <mesh position={[0, 1.55, -0.6]}><boxGeometry args={[1.9, 0.08, 3.6]} /><meshLambertMaterial color="#1f7fa8" /></mesh>
        {[[-0.85, -2.2], [0.85, -2.2], [-0.85, 0.2], [0.85, 0.2]].map(([x, z]) => (
          <mesh key={`${x}${z}`} position={[x, 0.8, z]}><cylinderGeometry args={[0.035, 0.035, 1.5, 5]} /><meshLambertMaterial color="#dddddd" /></mesh>
        ))}
        <mesh position={[0, 2.2, -2.3]}><planeGeometry args={[0.9, 0.65]} /><meshBasicMaterial map={flag} side={THREE.DoubleSide} /></mesh>
        <mesh position={[-0.45, 1.9, -2.3]}><cylinderGeometry args={[0.025, 0.025, 1.3, 5]} /><meshLambertMaterial color="#dddddd" /></mesh>
      </group>
    </>
  );
}
