import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { sceneState } from '../store/sceneState';
import { uw, SUN_DIR } from './underwater';
import { NOISE_GLSL, SKY_GLSL } from './glsl';

const VERT = /* glsl */`
varying vec3 vDir;
void main() {
  vDir = position;
  vec4 p = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  gl_Position = p.xyww;
}`;

const FRAG = /* glsl */`
uniform float uTime;
varying vec3 vDir;
${NOISE_GLSL}
${SKY_GLSL}
void main() {
  vec3 dir = normalize(vDir);
  vec3 col = skyColor(dir);
  float sd = max(dot(dir, uSun), 0.0);
  col += vec3(1.0, 0.93, 0.8) * pow(sd, 1400.0) * 40.0;

  // slow cumulus drifting along the horizon
  vec2 uv = dir.xz / (max(dir.y, 0.0) + 0.16) * 0.9 + vec2(uTime * 0.006, 0.0);
  float c = fbm(uv * 1.4);
  float cloud = smoothstep(0.50, 0.78, c) * smoothstep(0.015, 0.2, dir.y);
  vec3 cloudCol = mix(vec3(0.78, 0.84, 0.92), vec3(1.25, 1.2, 1.12), smoothstep(0.5, 0.9, c + sd * 0.25));
  col = mix(col, cloudCol, cloud * 0.9);
  gl_FragColor = vec4(col, 1.0);
}`;

/** Sky dome with sun and clouds. Only exists above the surface. */
export function Sky() {
  const ref = useRef();
  const uniforms = useMemo(() => ({ uTime: uw.uTime, uSun: { value: SUN_DIR } }), []);

  useFrame(({ camera }) => {
    ref.current.position.copy(camera.position);
    ref.current.visible = sceneState.camY > -0.2;
  });

  return (
    <mesh ref={ref} renderOrder={-10} frustumCulled={false}>
      <sphereGeometry args={[400, 32, 16]} />
      <shaderMaterial
        uniforms={uniforms} vertexShader={VERT} fragmentShader={FRAG}
        side={THREE.BackSide} depthWrite={false} depthTest={false}
      />
    </mesh>
  );
}
