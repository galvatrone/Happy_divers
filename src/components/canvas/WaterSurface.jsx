import { useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

// Seen from below: animated ripple surface with caustic sparkle.
// Plane sits at Y=0, camera is at Y≈-30 looking up through it at top of frame.

const VERT = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const FRAG = `
  uniform float uTime;
  varying vec2 vUv;

  // Hash → pseudo-random [0,1] per grid cell
  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
  }

  // Smooth value noise
  float vnoise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(
      mix(hash(i),              hash(i + vec2(1.0, 0.0)), u.x),
      mix(hash(i + vec2(0.0,1.0)), hash(i + vec2(1.0,1.0)), u.x),
      u.y
    );
  }

  // FBM — 5 octaves, each rotated ~37° and drifting at different speed.
  // Produces fully aperiodic organic pattern.
  float fbm(vec2 p, float t) {
    float v = 0.0;
    float a = 0.52;
    mat2  rot = mat2(0.80, 0.60, -0.60, 0.80);
    for (int i = 0; i < 6; i++) {
      float spd = 0.035 + float(i) * 0.012;
      p += vec2(t * spd, t * spd * 0.65);
      v += a * vnoise(p);
      p  = rot * p * 2.03;
      a *= 0.48;
    }
    return v;  // ~0…1
  }

  void main() {
    vec2 uv = vUv * 62.0;

    // Three FBM layers at different depths — each slightly slower/larger = volumetric parallax
    float n1 = fbm(uv,                          uTime);
    float n2 = fbm(uv * 0.55 + vec2(3.2, 1.9), uTime * 0.55 + 1.0);
    float n3 = fbm(uv * 0.32 + vec2(6.7, 4.3), uTime * 0.32 + 2.4);

    // Blend: near layer bright, deep layers cooler
    float n  = n1 * 0.50 + n2 * 0.32 + n3 * 0.18;

    // Volume haze: deep layers add a soft background glow
    float glow = n2 * n3 * 0.6;

    // Sharp caustic sparks at peaks
    float speck = pow(max(n1 - 0.68, 0.0) / 0.32, 4.0);

    // Smooth fade from center to edges — no hard boundary.
    // Multiplying entire alpha by window makes edges exactly alpha=0
    // so background bleeds through without a seam.
    vec2  cv     = vUv - 0.5;
    float window = 1.0 - smoothstep(0.02, 0.82, length(cv));

    // deep matches scene background #0e3d68 so edge fade is invisible
    vec3 deep  = vec3(0.055, 0.24,  0.41);
    vec3 mid   = vec3(0.30,  0.65,  0.94);
    vec3 spark = vec3(0.88,  0.97,  1.00);

    vec3 col = mix(deep, mid,  n * 0.75);
    col      = mix(col, spark, speck * 0.85);
    col     += spark * speck * 0.15;

    // window multiplied in fully — zero alpha at plane edge, no rectangle artifact
    float alpha = window * (n * 0.10 + glow * 0.05 + speck * 0.14);
    gl_FragColor = vec4(col, clamp(alpha, 0.0, 0.22));
  }
`;

export function WaterSurface() {
  const uniforms = useMemo(() => ({ uTime: { value: 0 } }), []);
  useFrame(({ clock }) => { uniforms.uTime.value = clock.elapsedTime; });

  return (
    <mesh position={[0, 58, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[2400, 2400]} />
      <shaderMaterial
        uniforms={uniforms}
        vertexShader={VERT}
        fragmentShader={FRAG}
        transparent
        depthWrite={false}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}
