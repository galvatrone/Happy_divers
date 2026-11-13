import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { PATH_SAMPLES } from '../store/cameraCurve';
import { makeRng, terrainHeight } from './terrain';
import { uw } from './underwater';
import { DENSITY } from './quality';

const VERT = /* glsl */`
varying vec2 vUv;
varying vec3 vW;
varying float vPhase;
void main() {
  vUv = uv;
  vec4 w = modelMatrix * vec4(position, 1.0);
  vW = w.xyz;
  vPhase = modelMatrix[3].x * 0.37 + modelMatrix[3].z * 0.23;
  gl_Position = projectionMatrix * viewMatrix * w;
}`;

const FRAG = /* glsl */`
uniform float uTime;
uniform float uStrength;
uniform float uOpacity;
varying vec2 vUv;
varying vec3 vW;
varying float vPhase;
void main() {
  float edge = pow(sin(vUv.x * 3.14159), 2.2);
  float streak = 0.65 + 0.35 * sin(vUv.x * 22.0 + vPhase * 5.0 + uTime * 0.4);
  float fall = pow(vUv.y, 1.25) * smoothstep(1.0, 0.93, vUv.y);
  float flicker = 0.62 + 0.38 * sin(uTime * 0.8 + vPhase * 3.0) * sin(uTime * 0.37 + vPhase);
  float dist = length(cameraPosition - vW);
  float fade = smoothstep(1.0, 7.0, dist) * exp(-dist * 0.028);
  float a = edge * streak * fall * flicker * fade * uStrength * uOpacity;
  gl_FragColor = vec4(vec3(0.72, 0.94, 1.0) * a, a);
}`;

/** Additive light-shaft material. `strength` is a shared uniform object. */
export function makeRayMaterial(strength, opacity) {
  return new THREE.ShaderMaterial({
    uniforms: { uTime: uw.uTime, uStrength: strength, uOpacity: { value: opacity } },
    vertexShader: VERT, fragmentShader: FRAG,
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
  });
}

/** Unit plane hanging down from its top edge; uv.y = 1 at the top. */
export const rayGeometry = (() => {
  const g = new THREE.PlaneGeometry(1, 1, 1, 1);
  g.translate(0, -0.5, 0);
  return g;
})();

/** Sun shafts coming through the surface along the shallow part of the dive. */
export function GodRays() {
  const group = useRef();
  const rays = useMemo(() => {
    const rng = makeRng(808);
    const src = PATH_SAMPLES.filter(s => s.u > 0.05 && s.u < 0.66);
    return Array.from({ length: Math.round(28 * DENSITY) }, () => {
      const s = src[Math.floor(rng() * src.length)];
      const x = s.x + (rng() - 0.5) * 34, z = s.z + (rng() - 0.5) * 22;
      const floor = terrainHeight(x, z);
      return { x, z, w: 2.2 + rng() * 5, h: Math.min(30, Math.max(4, -floor + 1)), tilt: 0.16 + rng() * 0.16 };
    });
  }, []);
  const material = useMemo(() => makeRayMaterial(uw.uRays, 0.34), []);

  useFrame(({ camera }) => {
    const kids = group.current.children;
    for (let i = 0; i < kids.length; i++) {
      const k = kids[i];
      k.rotation.y = Math.atan2(camera.position.x - k.position.x, camera.position.z - k.position.z);
    }
    group.current.visible = uw.uRays.value > 0.01;
  });

  return (
    <group ref={group}>
      {rays.map((r, i) => (
        <group key={i} position={[r.x, 0.1, r.z]}>
          <mesh geometry={rayGeometry} material={material} scale={[r.w, r.h, 1]} rotation={[0, 0, r.tilt]} />
        </group>
      ))}
    </group>
  );
}
