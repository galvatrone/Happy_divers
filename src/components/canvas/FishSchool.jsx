import { useRef, useEffect, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';

useGLTF.preload('/assets/model/fish/school_of_fish.glb');

// 30 fish spread across 3 depth zones, each on a circular orbit
const FISH = Array.from({ length: 30 }, (_, i) => {
  const zone  = Math.floor(i / 10);          // 0=shallow, 1=mid, 2=deep
  const angle = (i / 10) * Math.PI * 2;

  const zoneData = [
    { cx:  0, cz: 40, baseY: -6,  r: 7 + (i % 5) * 1.2 },
    { cx:  2, cz: 17, baseY: -14, r: 6 + (i % 5) * 1.0 },
    { cx: -1, cz:-18, baseY: -24, r: 5 + (i % 5) * 0.9 },
  ][zone];

  return {
    ...zoneData,
    speed:  0.22 + Math.random() * 0.14,
    phase:  angle + Math.random() * 0.8,
    scale:  0.7 + Math.random() * 0.4,
  };
});

export function FishSchool() {
  const meshRef  = useRef();
  const dummy    = useMemo(() => new THREE.Object3D(), []);
  const { scene } = useGLTF('/assets/model/fish/school_of_fish.glb');

  // Extract first mesh geometry + material from GLB
  const { geom, mat } = useMemo(() => {
    let geom = null, mat = null;
    scene.traverse((c) => {
      if (c.isMesh && !geom) {
        geom = c.geometry;
        mat  = c.material.clone();
        mat.transparent  = true;
        mat.opacity      = 0.92;
        mat.emissive     = new THREE.Color(0x003344);
        mat.emissiveIntensity = 0.15;
      }
    });
    return { geom, mat };
  }, [scene]);

  useFrame(({ clock }) => {
    if (!meshRef.current || !geom) return;
    const t = clock.elapsedTime;

    FISH.forEach((f, i) => {
      const angle = t * f.speed + f.phase;
      dummy.position.set(
        f.cx + Math.cos(angle) * f.r,
        f.baseY + Math.sin(t * 0.35 + f.phase) * 1.4,
        f.cz + Math.sin(angle) * f.r,
      );
      // Face direction of movement
      dummy.rotation.y = -angle + Math.PI * 0.5;
      dummy.scale.setScalar(f.scale);
      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);
    });

    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  if (!geom || !mat) return null;

  return (
    <instancedMesh
      ref={meshRef}
      args={[geom, mat, 30]}
      frustumCulled={false}
    />
  );
}
