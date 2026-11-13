import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const VERT = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

// Each blob is a soft radial gaussian with a wispy fringe
const FRAG = `
  uniform float uOpacity;
  uniform vec3  uColor;
  varying vec2  vUv;

  void main() {
    vec2  c = vUv - 0.5;
    float r = length(c) * 2.0;
    float blob   = exp(-r * r * 3.0);
    float fringe = max(0.0, 1.0 - smoothstep(0.35, 1.0, r)) * 0.28;
    float alpha  = uOpacity * (blob + fringe);
    gl_FragColor = vec4(uColor, clamp(alpha, 0.0, 1.0));
  }
`;

// [x, baseY, z, size, opacity, driftPhase, driftSpeed, colorVariant]
// colorVariant: 0=dark blue, 1=teal, 2=mid-blue
const BLOBS = [
  // near (shallow) — less opaque, bluer
  [  2, -18,  82, 26, 0.06, 0.0,  0.038, 0 ],
  [ -5, -21,  70, 20, 0.05, 1.6,  0.030, 1 ],
  [  8, -16,  58, 30, 0.07, 3.0,  0.044, 0 ],
  [ -3, -20,  46, 18, 0.05, 0.8,  0.034, 2 ],
  [  6, -19,  32, 24, 0.06, 2.3,  0.040, 1 ],

  // mid-path
  [ -6, -23,  18, 28, 0.08, 1.1,  0.032, 0 ],
  [  4, -21,   4, 22, 0.07, 3.5,  0.042, 2 ],
  [ -2, -25, -12, 26, 0.08, 0.4,  0.036, 0 ],
  [  7, -20, -26, 20, 0.07, 2.7,  0.038, 1 ],

  // deep (far) — denser, darker teal
  [ -4, -24, -42, 34, 0.10, 1.9,  0.030, 0 ],
  [  3, -26, -56, 28, 0.11, 0.6,  0.034, 2 ],
  [ -7, -23, -68, 32, 0.12, 3.2,  0.028, 0 ],
  [  5, -25, -76, 26, 0.10, 1.4,  0.032, 1 ],

  // side fillers — slightly off-axis
  [ 14, -22,  50, 22, 0.06, 2.5,  0.036, 1 ],
  [-13, -24,  38, 24, 0.07, 0.9,  0.040, 2 ],
  [ 12, -22, -10, 20, 0.06, 3.8,  0.034, 0 ],
  [-11, -25, -30, 26, 0.08, 1.2,  0.038, 1 ],
];

const COLORS = [
  new THREE.Color(0.04, 0.11, 0.22),  // 0 — dark navy
  new THREE.Color(0.02, 0.14, 0.18),  // 1 — teal-dark
  new THREE.Color(0.03, 0.10, 0.20),  // 2 — mid blue
];

function FogBlob({ x, baseY, z, size, opacity, driftPhase, driftSpeed, colorVariant }) {
  const meshRef  = useRef();
  const uniforms = useMemo(() => ({
    uOpacity: { value: opacity },
    uColor:   { value: COLORS[colorVariant] },
  }), [opacity, colorVariant]);

  useFrame(({ camera, clock }) => {
    const m = meshRef.current;
    if (!m) return;
    m.quaternion.copy(camera.quaternion);
    m.position.y = Math.sin(clock.elapsedTime * driftSpeed + driftPhase) * 2.8;
  });

  return (
    <group position={[x, baseY, z]}>
      <mesh ref={meshRef}>
        <planeGeometry args={[size, size]} />
        <shaderMaterial
          uniforms={uniforms}
          vertexShader={VERT}
          fragmentShader={FRAG}
          transparent
          depthWrite={false}
          blending={THREE.NormalBlending}
        />
      </mesh>
    </group>
  );
}

export function DepthFog() {
  return (
    <>
      {BLOBS.map(([x, baseY, z, size, opacity, driftPhase, driftSpeed, colorVariant], i) => (
        <FogBlob key={i}
          x={x} baseY={baseY} z={z}
          size={size} opacity={opacity}
          driftPhase={driftPhase} driftSpeed={driftSpeed}
          colorVariant={colorVariant}
        />
      ))}
    </>
  );
}
