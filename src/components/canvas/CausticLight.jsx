import { useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const VERT = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

// 8 interference waves — all integer phase velocities → loop-perfect at t=2π.
// Net drift: left-to-right (positive x coefficient dominates in v1/v2).
const FRAG = `
  uniform float uTime;
  uniform float uIntensity;
  varying vec2 vUv;

  #define PI2 6.28318

  float caustic(vec2 p, float t) {
    float v1 = sin(p.x * 5.8 - t * 2.0) + sin(p.y * 5.0 + t * 1.0);
    float v2 = sin(p.x * 3.9 + p.y * 3.5 - t * 3.0);
    float v3 = sin(p.x * 7.2            - t * 2.0) * 0.50;
    float v4 = sin(p.x * 4.7 - p.y * 6.1 + t * 4.0) * 0.35;
    float v5 = sin(p.x * 9.3 + p.y * 2.4 - t * 5.0) * 0.25;
    float v6 = sin(p.x * 2.1 + p.y * 8.7 + t * 1.0) * 0.30;
    float v7 = sin(p.x * 6.4 - p.y * 4.2 - t * 3.0) * 0.22;
    float v8 = sin(p.x * 11.0+ p.y * 1.8 + t * 6.0) * 0.15;
    float c  = (v1 + v2 + v3 + v4 + v5 + v6 + v7 + v8) / 2.9;
    return pow(max(0.0, 1.0 - abs(c)), 5.5);
  }

  // 9-tap soft blur for smooth glow lines
  float blurCaustic(vec2 p, float t) {
    float r  = 0.016;
    float r2 = r * 0.707;
    float s  = caustic(p,                   t) * 0.28
             + caustic(p + vec2( r,   0.0), t) * 0.14
             + caustic(p + vec2(-r,   0.0), t) * 0.14
             + caustic(p + vec2( 0.0,  r),  t) * 0.14
             + caustic(p + vec2( 0.0, -r),  t) * 0.14
             + caustic(p + vec2( r2,  r2),  t) * 0.04
             + caustic(p + vec2(-r2,  r2),  t) * 0.04
             + caustic(p + vec2( r2, -r2),  t) * 0.04
             + caustic(p + vec2(-r2, -r2),  t) * 0.04;
    return s;
  }

  void main() {
    float t  = mod(uTime * 0.125, PI2);
    vec2  uv = vUv * 150.0;

    float c1 = blurCaustic(uv, t);
    float c2 = blurCaustic(uv * 0.68 + vec2(5.1, 7.3), t + 1.8) * 0.38;
    float c3 = blurCaustic(uv * 0.45 + vec2(2.7, 3.8), t + 0.9) * 0.22;
    float intensity = (c1 + c2 + c3) * uIntensity;

    if (intensity < 0.008) discard;

    // Chromatic: cyan at peak, blue in shadow — like real sunlit caustics
    vec3 col = mix(
      vec3(0.03, 0.22, 0.60),   // deep blue-shadow
      vec3(0.55, 0.88, 1.00),   // bright cyan-white peak
      c1
    );

    gl_FragColor = vec4(col * intensity, min(intensity * 0.45, 1.0));
  }
`;

function CausticPlane({ y, scale, intensity, timeOffset }) {
  const uniforms = useMemo(() => ({
    uTime:      { value: 0 },
    uIntensity: { value: intensity },
  }), [intensity]);

  useFrame(({ clock }) => {
    uniforms.uTime.value = clock.elapsedTime + timeOffset;
  });

  return (
    <mesh position={[0, y, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[600 * scale, 720 * scale]} />
      <shaderMaterial
        uniforms={uniforms}
        vertexShader={VERT}
        fragmentShader={FRAG}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        side={THREE.FrontSide}
      />
    </mesh>
  );
}

export function CausticLight() {
  return (
    <>
      {/* Primary floor caustics — strong, at seafloor */}
      <CausticPlane y={-41.2} scale={1.0} intensity={0.50} timeOffset={0}   />
      {/* Mid-water scatter — fainter, slightly smaller pattern */}
      <CausticPlane y={-28.0} scale={0.80} intensity={0.22} timeOffset={2.1} />
      {/* Upper scatter near start zone */}
      <CausticPlane y={-16.0} scale={0.60} intensity={0.10} timeOffset={4.3} />
    </>
  );
}
