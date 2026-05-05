import { Canvas } from '@react-three/fiber';
import * as THREE  from 'three';
import { OceanScene } from './OceanScene';

const CANVAS_STYLE = {
  position: 'fixed',
  top: 0, left: 0,
  width: '100vw',
  height: '100vh',
  zIndex: 0,
  pointerEvents: 'none',
};

export function SceneCanvas() {
  return (
    <Canvas
      style={CANVAS_STYLE}
      camera={{ position: [0, 2, 5], fov: 50, near: 0.01, far: 1000 }}
      gl={{
        antialias: true,
        alpha: false,
        powerPreference: 'high-performance',
        toneMapping: THREE.ACESFilmicToneMapping,
        toneMappingExposure: 1.1,
        outputColorSpace: THREE.SRGBColorSpace,
      }}
      dpr={[1, 1.5]}
    >
      <color attach="background" args={['#09090c']} />
      <OceanScene />
    </Canvas>
  );
}
