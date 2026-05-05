import { useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { sceneState } from '../../store/sceneState';

const BUBBLE_COUNT  = 60;
const SPREAD_XZ     = 20;
const SPREAD_Y      = 80;

useGLTF.preload('/assets/model/buble_1/bubbles_3.glb');
useGLTF.preload('/assets/model/buble_2/bubbles_5.glb');

function makeBubbleData() {
  return Array.from({ length: BUBBLE_COUNT }, () => ({
    x:    (Math.random() - 0.5) * SPREAD_XZ * 2,
    y:    -Math.random() * SPREAD_Y,
    z:    (Math.random() - 0.5) * SPREAD_XZ * 2,
    vy:   0.4 + Math.random() * 1.0,
    phase: Math.random() * Math.PI * 2,
    scale: 0.06 + Math.random() * 0.18,
  }));
}

function BubbleSet({ url, offset }) {
  const { scene } = useGLTF(url);
  const meshRef   = useRef();
  const dataRef   = useRef(makeBubbleData());
  const matrixRef = useRef(new THREE.Matrix4());
  const dummy      = useRef(new THREE.Object3D());

  // Find first mesh in GLB to get geometry + material
  let srcMesh = null;
  scene.traverse((c) => { if (c.isMesh && !srcMesh) srcMesh = c; });

  useEffect(() => {
    if (!meshRef.current || !srcMesh) return;
    const mat = srcMesh.material.clone();
    mat.transparent = true;
    meshRef.current.material = mat;
  }, [srcMesh]);

  useFrame(({ clock }) => {
    if (!meshRef.current) return;

    const speed  = sceneState.bubbleSpeed;
    const t      = clock.elapsedTime;
    const data   = dataRef.current;
    const d      = dummy.current;

    for (let i = 0; i < BUBBLE_COUNT; i++) {
      const b = data[i];
      b.y += b.vy * speed * 0.016;

      // Wrap: reset below camera
      if (b.y > 4) {
        b.y = -SPREAD_Y;
        b.x = (Math.random() - 0.5) * SPREAD_XZ * 2;
        b.z = (Math.random() - 0.5) * SPREAD_XZ * 2;
      }

      // Horizontal wobble
      d.position.set(
        b.x + Math.sin(t * 0.6 + b.phase) * 0.4,
        b.y,
        b.z + Math.cos(t * 0.5 + b.phase) * 0.3,
      );
      d.scale.setScalar(b.scale);
      d.updateMatrix();
      meshRef.current.setMatrixAt(i, d.matrix);
    }
    meshRef.current.instanceMatrix.needsUpdate = true;

    // Fade out at surface, fade in underwater
    const vis = sceneState.scrollProgress < 0.28 ? 0 : Math.min(1, (sceneState.scrollProgress - 0.28) / 0.12);
    if (meshRef.current.material) meshRef.current.material.opacity = vis * 0.7;
  });

  if (!srcMesh) return null;

  return (
    <instancedMesh
      ref={meshRef}
      args={[srcMesh.geometry, srcMesh.material, BUBBLE_COUNT]}
    />
  );
}

export function BubbleSystem() {
  return (
    <>
      <BubbleSet url="/assets/model/buble_1/bubbles_3.glb" offset={0} />
      <BubbleSet url="/assets/model/buble_2/bubbles_5.glb" offset={30} />
    </>
  );
}
