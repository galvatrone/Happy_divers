import { Component, useRef } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
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

/**
 * Resolution follows the frame rate: a weak GPU gets a softer image instead of stutter.
 * The pixel ratio is changed from inside the frame loop and only ever goes down: resizing the
 * canvas clears it, and doing that through React state (or back and forth) showed as black blinks.
 */
function AdaptiveResolution() {
  const setDpr = useThree(state => state.setDpr);
  const dpr = useRef(DPR);
  return (
    <PerformanceMonitor
      bounds={() => [30, 60]}
      onDecline={() => {
        if (dpr.current <= 0.7) return;
        dpr.current = Math.max(0.7, +(dpr.current - 0.25).toFixed(2));
        setDpr(dpr.current);
      }}
    />
  );
}

export function DiveCanvas() {
  return (
    <SceneErrorBoundary>
      <Canvas
        className="dive-canvas"
        style={{ position: 'fixed', inset: 0, width: '100vw', height: '100vh' }}
        camera={{ position: [0, 1.5, 24], fov: 62, near: 0.1, far: 900 }}
        gl={{ antialias: false, alpha: false, stencil: false, powerPreference: 'high-performance' }}
        dpr={DPR}
      >
        <AdaptiveResolution />
        <World />
      </Canvas>
    </SceneErrorBoundary>
  );
}
