import { useMemo } from 'react';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { PATH_SAMPLES } from '../store/cameraCurve';
import { makeRng, terrainHeight } from './terrain';
import { uw } from './underwater';
import { DENSITY } from './quality';

// ── plankton / marine snow: a cube of motes that wraps around the camera ──
const SNOW_VERT = /* glsl */`
uniform float uTime;
uniform float uBox;
uniform float uScale;
varying float vFade;
varying float vTw;
void main() {
  vec3 drift = vec3(uTime * 0.012, uTime * (0.006 + position.x * 0.008), uTime * 0.009);
  vec3 p = fract(position + drift - cameraPosition / uBox) - 0.5;
  vec3 w = cameraPosition + p * uBox;
  vFade = smoothstep(0.5, 0.32, length(p)) * step(w.y, -0.25);
  vTw = 0.55 + 0.45 * sin(uTime * 1.7 + position.x * 60.0);
  vec4 mv = viewMatrix * vec4(w, 1.0);
  gl_Position = projectionMatrix * mv;
  gl_PointSize = (0.035 + position.z * 0.06) * uScale / -mv.z;
}`;
const SNOW_FRAG = /* glsl */`
uniform float uGlow;
varying float vFade;
varying float vTw;
void main() {
  float d = length(gl_PointCoord - 0.5);
  float a = smoothstep(0.5, 0.0, d);
  vec3 col = mix(vec3(0.85, 0.95, 1.0), vec3(0.25, 1.6, 1.5), uGlow);
  float alpha = a * vFade * vTw * mix(0.35, 0.9, uGlow);
  gl_FragColor = vec4(col * alpha, alpha);
}`;

// ── bubbles rising from vents in the seabed ──
const BUB_VERT = /* glsl */`
uniform float uTime;
uniform float uScale;
attribute vec3 aRand;
varying float vAlpha;
void main() {
  float h = -position.y;
  float k = fract(uTime * (0.035 + aRand.x * 0.03) * 30.0 / h + aRand.y);
  vec3 w = position;
  w.y += k * h;
  w.x += sin(uTime * 2.0 + aRand.z * 30.0 + k * 20.0) * (0.12 + k * 0.5);
  w.z += cos(uTime * 1.7 + aRand.y * 30.0 + k * 16.0) * (0.12 + k * 0.5);
  vAlpha = smoothstep(0.0, 0.04, k) * smoothstep(1.0, 0.96, k);
  vec4 mv = viewMatrix * vec4(w, 1.0);
  gl_Position = projectionMatrix * mv;
  gl_PointSize = (0.05 + aRand.x * 0.09) * (0.6 + k * 1.2) * uScale / -mv.z;
}`;
const BUB_FRAG = /* glsl */`
varying float vAlpha;
void main() {
  vec2 c = gl_PointCoord - 0.5;
  float d = length(c);
  float rim = smoothstep(0.5, 0.44, d) * (0.18 + 0.82 * smoothstep(0.28, 0.46, d));
  float glint = smoothstep(0.16, 0.0, length(c - vec2(-0.14, -0.16)));
  float a = (rim * 0.55 + glint * 0.8) * vAlpha;
  gl_FragColor = vec4(vec3(0.85, 0.97, 1.0) * a, a);
}`;

export function Particles() {
  const { size, viewport } = useThree();
  const scale = size.height * viewport.dpr;

  const snow = useMemo(() => {
    const rng = makeRng(99);
    const n = Math.round(1800 * DENSITY);
    const pos = new Float32Array(n * 3);
    for (let i = 0; i < n * 3; i++) pos[i] = rng();
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    return g;
  }, []);

  const bubbles = useMemo(() => {
    const rng = makeRng(123);
    const vents = [{ x: 1.5, z: 7 }, { x: -1.5, z: 10 }];
    const src = PATH_SAMPLES.filter(s => (s.u > 0.1 && s.u < 0.72) || s.u > 0.9);
    for (let i = 0; i < 16; i++) {
      const s = src[Math.floor(rng() * src.length)];
      const a = rng() * Math.PI * 2, d = 3 + rng() * 4;
      vents.push({ x: s.x + Math.cos(a) * d, z: s.z + Math.sin(a) * d });
    }
    const per = Math.round(22 * DENSITY);
    const pos = [], rand = [];
    for (const v of vents) {
      const floor = Math.min(-1.5, terrainHeight(v.x, v.z));
      for (let i = 0; i < per; i++) {
        pos.push(v.x + (rng() - 0.5) * 0.5, floor, v.z + (rng() - 0.5) * 0.5);
        rand.push(rng(), rng(), rng());
      }
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    g.setAttribute('aRand', new THREE.Float32BufferAttribute(rand, 3));
    return g;
  }, []);

  const snowU = useMemo(() => ({ uTime: uw.uTime, uGlow: uw.uGlow, uBox: { value: 34 }, uScale: { value: 1 } }), []);
  const bubU  = useMemo(() => ({ uTime: uw.uTime, uScale: { value: 1 } }), []);
  snowU.uScale.value = scale;
  bubU.uScale.value = scale;

  return (
    <>
      <points geometry={snow} frustumCulled={false}>
        <shaderMaterial uniforms={snowU} vertexShader={SNOW_VERT} fragmentShader={SNOW_FRAG}
          transparent depthWrite={false} blending={THREE.AdditiveBlending} />
      </points>
      <points geometry={bubbles} frustumCulled={false}>
        <shaderMaterial uniforms={bubU} vertexShader={BUB_VERT} fragmentShader={BUB_FRAG}
          transparent depthWrite={false} blending={THREE.AdditiveBlending} />
      </points>
    </>
  );
}
