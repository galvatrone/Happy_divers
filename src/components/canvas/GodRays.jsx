import { useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

// [x, z, width, opacity, swayPhase, swaySpeed]
const RAYS = [
  [  1.0,  92, 11, 0.24, 0.0,  0.30 ],
  [ -2.0,  74,  9, 0.18, 1.8,  0.25 ],
  [  3.0,  55, 14, 0.28, 3.2,  0.36 ],
  [ -1.5,  36, 10, 0.21, 0.9,  0.28 ],
  [  2.5,  15, 13, 0.25, 2.4,  0.33 ],
  [ -3.0,  -5,  9, 0.19, 4.1,  0.26 ],
  [  1.5, -28, 11, 0.23, 1.3,  0.31 ],
  [ -2.0, -52, 10, 0.20, 3.7,  0.34 ],
  [ 10.0,  80, 16, 0.17, 0.6,  0.27 ],
  [ 14.0,  45, 13, 0.15, 2.1,  0.32 ],
  [ 11.0,   5, 15, 0.18, 3.8,  0.29 ],
  [ 13.0, -40, 12, 0.14, 1.0,  0.24 ],
  [-10.0,  85, 15, 0.17, 1.4,  0.31 ],
  [-13.0,  48, 13, 0.15, 3.0,  0.26 ],
  [-11.0,   8, 14, 0.18, 0.5,  0.34 ],
  [-12.0, -38, 12, 0.14, 2.6,  0.28 ],
];

const RAY_HEIGHT = 76;
const RAY_Y      = 6;

const VERT = `
  uniform float uTime;
  uniform float uPhase;
  uniform float uSpeed;
  varying vec2  vUv;

  void main() {
    vUv = uv;
    vec3 pos = position;
    float swing = sin(uTime * uSpeed       + uPhase) * 0.025
                + sin(uTime * uSpeed * 1.7 + uPhase + 1.1) * 0.012;
    pos.x += uv.y * swing * 18.0;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
  }
`;

const FRAG = `
  uniform float uTime;
  uniform float uPhase;
  uniform float uSpeed;
  uniform float uOpacity;
  varying vec2  vUv;

  void main() {
    float depthFade = pow(vUv.y, 0.45);
    float edge      = exp(-pow((vUv.x - 0.5) * 3.6, 2.0));
    float shimmer   = 0.55
      + 0.28 * sin(uTime * uSpeed * 2.2 + uPhase + vUv.y * 8.0)
      + 0.17 * sin(uTime * uSpeed * 1.4 + uPhase + vUv.y * 3.8 + 1.5);

    float alpha = depthFade * edge * shimmer * uOpacity;

    vec3 surfaceCol = vec3(0.82, 0.96, 1.00);
    vec3 depthCol   = vec3(0.18, 0.58, 0.82);
    vec3 col        = mix(depthCol, surfaceCol, vUv.y * 0.75);
    col = mix(col, vec3(0.22, 0.72, 0.58), (1.0 - vUv.y) * vUv.y * 0.22);

    gl_FragColor = vec4(col, clamp(alpha, 0.0, 1.0));
  }
`;

export function GodRays() {
  const entries = useMemo(() =>
    RAYS.map(([x, z, w, opacity, phase, speed]) => ({
      x, z, w,
      u1: { uTime: { value: 0 }, uPhase: { value: phase }, uSpeed: { value: speed }, uOpacity: { value: opacity } },
      u2: { uTime: { value: 0 }, uPhase: { value: phase }, uSpeed: { value: speed }, uOpacity: { value: opacity } },
    })),
  []);

  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    entries.forEach(e => {
      e.u1.uTime.value = t;
      e.u2.uTime.value = t;
    });
  });

  return (
    <>
      {entries.map((e, i) => (
        <group key={i} position={[e.x, RAY_Y, e.z]}>
          <mesh position={[0, -RAY_HEIGHT / 2, 0]}>
            <planeGeometry args={[e.w, RAY_HEIGHT, 1, 8]} />
            <shaderMaterial
              uniforms={e.u1}
              vertexShader={VERT}
              fragmentShader={FRAG}
              transparent
              depthWrite={false}
              blending={THREE.AdditiveBlending}
              side={THREE.DoubleSide}
            />
          </mesh>
          <mesh position={[0, -RAY_HEIGHT / 2, 0]} rotation={[0, Math.PI / 2, 0]}>
            <planeGeometry args={[e.w * 0.82, RAY_HEIGHT, 1, 8]} />
            <shaderMaterial
              uniforms={e.u2}
              vertexShader={VERT}
              fragmentShader={FRAG}
              transparent
              depthWrite={false}
              blending={THREE.AdditiveBlending}
              side={THREE.DoubleSide}
            />
          </mesh>
        </group>
      ))}
    </>
  );
}
