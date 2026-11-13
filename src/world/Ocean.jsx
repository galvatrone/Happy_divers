import { useMemo } from 'react';
import * as THREE from 'three';
import { uw, SUN_DIR } from './underwater';
import { NOISE_GLSL, SKY_GLSL } from './glsl';
import { buildHeightTexture, HEIGHT_MAP } from './terrain';
import { LOW } from './quality';

const WAVES = /* glsl */`
float swell(vec2 p, float t) {
  float h = sin(dot(p, vec2(0.12, 0.31)) + t * 1.1) * 0.10;
  h += sin(dot(p, vec2(-0.27, 0.19)) + t * 1.4) * 0.06;
  h += sin(dot(p, vec2(0.43, -0.38)) + t * 1.9) * 0.035;
  return h;
}`;

const VERT = /* glsl */`
#include <common>
#include <fog_pars_vertex>
uniform float uTime;
varying vec3 vW;
${WAVES}
void main() {
  vec4 w = modelMatrix * vec4(position, 1.0);
  w.y += swell(w.xz, uTime);
  vW = w.xyz;
  vec4 mvPosition = viewMatrix * w;
  gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;

const FRAG = /* glsl */`
#include <common>
#include <fog_pars_fragment>
uniform float uTime;
uniform sampler2D uHeight;
uniform vec4 uMap;      // x0, z0, 1/width, 1/depth
uniform float uRange;
varying vec3 vW;
${NOISE_GLSL}
${SKY_GLSL}
${WAVES}

float ripples(vec2 p, float t) {
  float h = swell(p, t);
  h += (vnoise(p * 0.55 + vec2(t * 0.25, t * 0.12)) - 0.5) * 0.22;
  h += (vnoise(p * 1.7 - vec2(t * 0.3, -t * 0.2)) - 0.5) * 0.09;
  h += (vnoise(p * 4.3 + vec2(-t * 0.5, t * 0.4)) - 0.5) * 0.035;
  return h;
}

void main() {
  vec2 p = vW.xz;
  float dist = length(cameraPosition - vW);
  float e = 0.12;
  float h0 = ripples(p, uTime);
  float hx = ripples(p + vec2(e, 0.0), uTime);
  float hz = ripples(p + vec2(0.0, e), uTime);
  float calm = mix(1.0, 0.12, smoothstep(30.0, 320.0, dist));
  vec3 N = normalize(vec3(-(hx - h0) / e * calm, 1.0, -(hz - h0) / e * calm));

  vec3 col;
  float alpha = 1.0;

  if (gl_FrontFacing) {
    // ── seen from the air ──
    vec3 V = normalize(cameraPosition - vW);
    float fres = 0.02 + 0.98 * pow(1.0 - max(dot(N, V), 0.0), 5.0);
    vec3 R = reflect(-V, N);
    R.y = abs(R.y);
    vec3 refl = skyColor(R);
    float sd = max(dot(R, uSun), 0.0);
    vec3 spec = vec3(1.0, 0.94, 0.82) * (pow(sd, 700.0) * 16.0 + pow(sd, 70.0) * 0.55);

    vec2 huv = (p - uMap.xy) * uMap.zw;
    float inside = step(0.0, huv.x) * step(huv.x, 1.0) * step(0.0, huv.y) * step(huv.y, 1.0);
    float ground = texture2D(uHeight, huv).r * 2.0 * uRange - uRange;
    float depth = mix(uRange, -ground, inside);

    vec3 shallow = vec3(0.10, 0.80, 0.72);
    vec3 deep    = vec3(0.012, 0.13, 0.33);
    vec3 body = mix(shallow, deep, smoothstep(0.2, 11.0, depth));

    float fn = vnoise(p * 0.7 + vec2(0.0, uTime * 0.25)) * 0.7 + vnoise(p * 2.1 - vec2(uTime * 0.2, 0.0)) * 0.3;
    float lap = sin(uTime * 0.7 + p.x * 0.15) * 0.14;
    float foam = smoothstep(0.5, 0.05, depth - fn * 0.45 + lap) * smoothstep(-0.5, -0.1, depth);

    col = mix(body, refl, fres * 0.8) + spec;
    col = mix(col, vec3(1.05), foam * 0.9);
    alpha = mix(0.42, 0.97, smoothstep(0.0, 6.5, depth));
    alpha = max(max(alpha, fres), foam);
  } else {
    // ── seen from below: Snell's window, the rest mirrors the deep ──
    vec3 D = normalize(vW - cameraPosition);
    float cosT = D.y + (N.x + N.z) * 0.22;
    float window = smoothstep(0.60, 0.76, cosT);
    vec3 Dr = normalize(D + vec3(N.x, 0.0, N.z) * 0.5);
    float sd = max(dot(Dr, uSun), 0.0);
    vec3 skyc = vec3(0.42, 0.80, 1.0) * 1.15 + vec3(1.0, 0.95, 0.8) * (pow(sd, 10.0) * 1.4 + pow(sd, 160.0) * 9.0);
    vec3 mirror = fogColor * (0.75 + h0 * 1.6) + vec3(0.03, 0.14, 0.17) * smoothstep(0.0, 0.25, h0);
    col = mix(mirror, skyc, window);
  }

  gl_FragColor = vec4(col, alpha);
  #include <fog_fragment>
}`;

export function Ocean() {
  const uniforms = useMemo(() => {
    const { x0, x1, z0, z1, range } = HEIGHT_MAP;
    return {
      ...THREE.UniformsUtils.clone(THREE.UniformsLib.fog),
      uTime:   uw.uTime,
      uSun:    { value: SUN_DIR },
      uHeight: { value: buildHeightTexture(LOW ? 128 : 256) },
      uMap:    { value: new THREE.Vector4(x0, z0, 1 / (x1 - x0), 1 / (z1 - z0)) },
      uRange:  { value: range },
    };
  }, []);

  const seg = LOW ? 96 : 144;
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 40]} frustumCulled={false} renderOrder={2}>
      <planeGeometry args={[1800, 1800, seg, seg]} />
      <shaderMaterial
        uniforms={uniforms} vertexShader={VERT} fragmentShader={FRAG}
        fog transparent depthWrite={false} side={THREE.DoubleSide}
      />
    </mesh>
  );
}
