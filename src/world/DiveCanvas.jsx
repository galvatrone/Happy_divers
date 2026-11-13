import { Component, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { PerformanceMonitor } from '@react-three/drei';
import { World } from './World';
import { DPR } from './quality';

class SceneErrorBoundary extends Component {
  constructor(props) { super(props); this.state = { error: null }; }
  static getDerivedStateFromError(error) { return { error }; }
  componentDidCatch(error) { console.error('[DiveCanvas] crash:', error); }
  render() {
    if (!this.state.error) return this.props.children;
    return <div className="scene-error">3D-сцена не запустилась: {String(this.state.error.message || this.state.error)}</div>;
  }
}

export function DiveCanvas() {
  // Resolution follows the frame rate: weak GPUs drop to a softer image instead of stuttering.
  const [dpr, setDpr] = useState(DPR);

  return (
    <SceneErrorBoundary>
      <Canvas
        className="dive-canvas"
        style={{ position: 'fixed', inset: 0, width: '100vw', height: '100vh' }}
        camera={{ position: [0, 1.5, 24], fov: 62, near: 0.1, far: 900 }}
        gl={{ antialias: false, alpha: false, stencil: false, powerPreference: 'high-performance' }}
        dpr={dpr}
      >
        <PerformanceMonitor
          bounds={() => [32, 55]}
          flipflops={3}
          onDecline={() => setDpr(d => Math.max(0.6, +(d - 0.2).toFixed(2)))}
          onIncline={() => setDpr(d => Math.min(DPR, +(d + 0.1).toFixed(2)))}
        />
        <World />
      </Canvas>
    </SceneErrorBoundary>
  );
}
