import { useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { sceneState } from '../../store/sceneState';

// [x, z] along the dive path (surface Y=0 → seafloor Y=-36)
const SHAFTS = [
  [ 4.5,  68], [-3.0,  52], [ 6.0,  36],
  [-5.0,  20], [ 3.0,   4], [-6.0, -10],
  [ 4.5, -25],
];

const VERT = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

// In Three.js CylinderGeometry: UV.y = 1 at top (radiusTop, surface), 0 at bottom (deep)
const FRAG = `
  uniform float uTime;
  uniform float uIntensity;
  varying vec2 vUv;

  void main() {
    // Bright at surface (vUv.y=1), fades to dark at depth (vUv.y=0)
    float depthFade = pow(vUv.y, 0.65);

    // Subtle angular shimmer to break uniformity
    float angVar = sin(vUv.x * 6.28318) * 0.06 + 0.94;

    // Two overlapping moving shimmer bands
    float sh1 = sin((1.0 - vUv.y) * 12.0 - uTime * 1.3) * 0.10 + 0.90;
    float sh2 = sin((1.0 - vUv.y) *  7.0 - uTime * 0.8 + vUv.x * 4.0) * 0.07 + 0.93;

    float alpha = depthFade * angVar * sh1 * sh2 * uIntensity * 0.22;

    // Cyan at surface, deeper blue below
    vec3 col = mix(vec3(0.0, 0.35, 0.65), vec3(0.18, 0.82, 1.0), vUv.y);

    gl_FragColor = vec4(col, alpha);
  }
`;

export function LightShafts() {
  const uniforms = useMemo(() => ({
    uTime:      { value: 0 },
    uIntensity: { value: 0 },
  }), []);

  // Wide top (surface, Y=+18) → narrow bottom (deep, Y=-18); openEnded=true
  const geom = useMemo(() =>
    new THREE.CylinderGeometry(3.5, 0.2, 36, 8, 1, true),
  []);

  useFrame(({ clock }) => {
    uniforms.uTime.value = clock.elapsedTime;

    const p = sceneState.scrollProgress;
    const target =
      p < 0.10 ? 0 :
      p < 0.28 ? (p - 0.10) / 0.18 :
      p < 0.55 ? THREE.MathUtils.lerp(1, 0.12, (p - 0.28) / 0.27) :
      0.12;

    uniforms.uIntensity.value = THREE.MathUtils.lerp(
      uniforms.uIntensity.value, target, 0.04,
    );
  });

  return (
    <>
      {SHAFTS.map(([x, z], i) => (
        <mesh
          key={i}
          geometry={geom}
          position={[x, -18, z]}
        >
          <shaderMaterial
            vertexShader={VERT}
            fragmentShader={FRAG}
            uniforms={uniforms}
            transparent
            depthWrite={false}
            blending={THREE.AdditiveBlending}
            side={THREE.DoubleSide}
          />
        </mesh>
      ))}
    </>
  );
}
