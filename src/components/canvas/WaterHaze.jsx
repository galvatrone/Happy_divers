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

// Value noise + FBM for organic suspended-particle turbidity
const FRAG = `
  uniform float uTime;
  uniform float uOpacity;
  varying vec2  vUv;

  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
  }

  float vnoise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(
      mix(hash(i),               hash(i + vec2(1.0, 0.0)), u.x),
      mix(hash(i + vec2(0.0,1.0)), hash(i + vec2(1.0,1.0)), u.x),
      u.y
    );
  }

  float fbm(vec2 p) {
    float v = 0.0, a = 0.52;
    mat2 rot = mat2(0.8, 0.6, -0.6, 0.8);
    for (int i = 0; i < 4; i++) {
      v += a * vnoise(p);
      p  = rot * p * 2.1;
      a *= 0.50;
    }
    return v;
  }

  void main() {
    vec2 p = vUv * 3.8;
    // Two currents in different directions — turbidity carried by micro-currents
    float n1 = fbm(p + vec2(uTime * 0.012,  uTime * 0.008));
    float n2 = fbm(p - vec2(uTime * 0.007, -uTime * 0.011) + vec2(4.3, 2.7));
    float haze = n1 * 0.6 + n2 * 0.4;

    // Deep blue-green — suspended organic matter color in tropical water
    vec3 col = vec3(0.008, 0.045, 0.10);
    gl_FragColor = vec4(col, uOpacity * (0.4 + haze * 0.6));
  }
`;

const LAYERS = [
  { y: -30.5, opacity: 0.014 },
  { y: -32.5, opacity: 0.020 },
  { y: -34.8, opacity: 0.028 },
  { y: -37.0, opacity: 0.036 },
  { y: -39.5, opacity: 0.044 },
  { y: -41.8, opacity: 0.052 },
];

export function WaterHaze() {
  const uniformsList = useMemo(() =>
    LAYERS.map(({ opacity }) => ({
      uTime:    { value: 0 },
      uOpacity: { value: opacity },
    })),
  []);

  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    uniformsList.forEach(u => { u.uTime.value = t; });
  });

  return (
    <>
      {LAYERS.map(({ y }, i) => (
        <mesh key={i} position={[0, y, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[800, 900]} />
          <shaderMaterial
            uniforms={uniformsList[i]}
            vertexShader={VERT}
            fragmentShader={FRAG}
            transparent
            depthWrite={false}
            side={THREE.DoubleSide}
          />
        </mesh>
      ))}
    </>
  );
}
