import { useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useFrameSequence } from '../../hooks/useFrameSequence';
import { sceneState } from '../../store/sceneState';

export function SurfacePlane() {
  const meshRef = useRef();
  const matRef  = useRef();
  const { camera, size } = useThree();
  const { texture, advance } = useFrameSequence();

  useFrame((_, delta) => {
    advance(delta);

    if (!meshRef.current || !matRef.current) return;

    // Keep plane directly in front of camera
    const dist = 4.8;
    meshRef.current.position.y = camera.position.y;
    meshRef.current.position.x = camera.position.x;
    meshRef.current.position.z = camera.position.z - dist;

    // Scale to fill the viewport exactly
    const fovRad = (camera.fov * Math.PI) / 180;
    const h = 2 * Math.tan(fovRad / 2) * dist * 1.02;
    const w = h * (size.width / size.height);
    meshRef.current.scale.set(w, h, 1);

    // Texture cover-fit via UV repeat/offset
    const frameAspect = 16 / 9;
    const viewAspect  = size.width / size.height;
    if (frameAspect > viewAspect) {
      const s = viewAspect / frameAspect;
      texture.repeat.set(s, 1);
      texture.offset.set((1 - s) / 2, 0);
    } else {
      const s = frameAspect / viewAspect;
      texture.repeat.set(1, s);
      texture.offset.set(0, (1 - s) / 2);
    }

    // Fade with zone
    matRef.current.opacity = sceneState.surfaceOpacity;
  });

  return (
    <mesh ref={meshRef} renderOrder={-2}>
      <planeGeometry args={[1, 1]} />
      <meshBasicMaterial
        ref={matRef}
        map={texture}
        transparent
        depthTest={false}
        depthWrite={false}
        toneMapped={false}
      />
    </mesh>
  );
}
