import { Component } from 'react';
import { Canvas } from '@react-three/fiber';
import * as THREE  from 'three';
import { OceanScene } from './OceanScene';

class SceneErrorBoundary extends Component {
  constructor(props) { super(props); this.state = { error: null }; }
  static getDerivedStateFromError(e) { return { error: e }; }
  componentDidCatch(e) { console.error('[SceneCanvas] crash:', e); }
  render() {
    if (this.state.error) return null;
    return this.props.children;
  }
}

export function SceneCanvas() {
  return (
    <SceneErrorBoundary>
    <Canvas
      style={{ position: 'fixed', inset: 0, width: '100vw', height: '100vh' }}
      camera={{ position: [0, -30, 108], fov: 70, near: 0.1, far: 300 }}
      gl={{
        antialias:           true,
        alpha:               false,
        powerPreference:     'high-performance',
        toneMapping:         THREE.ACESFilmicToneMapping,
        toneMappingExposure: 2.2,
        outputColorSpace:    THREE.SRGBColorSpace,
      }}
      dpr={[1, 1.5]}
    >
      <OceanScene />
    </Canvas>
    </SceneErrorBoundary>
  );
}
