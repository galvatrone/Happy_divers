import * as THREE from 'three';

// Uniforms shared by every material in the world. Atmosphere.jsx drives them.
export const uw = {
  uTime:    { value: 0 },
  uCaustic: { value: 1 },   // strength of the sun caustics (0 in the cave)
  uRays:    { value: 1 },   // strength of the light shafts
  uGlow:    { value: 0 },   // bioluminescence (twilight zone)
};

// Sun direction (toward the sun). It sits behind the island, a little to the left.
export const SUN_DIR = new THREE.Vector3(-0.3, 0.62, -0.72).normalize();

export const CAUSTIC_GLSL = /* glsl */`
float uwCaustic(vec2 uv, float t) {
  mat3 m = mat3(-2., -1., 2., 3., -2., 1., 1., 2., 2.);
  vec3 a = vec3(uv, t) * m;
  vec3 b = a * m * .4;
  vec3 c = b * m * .3;
  return pow(min(min(length(.5 - fract(a)), length(.5 - fract(b))), length(.5 - fract(c))), 7.) * 25.;
}`;

const PHASE = /* glsl */`
#ifdef USE_INSTANCING
  float ph_ = instanceMatrix[3].x * 1.3 + instanceMatrix[3].y * 2.1 + instanceMatrix[3].z * 0.7;
#else
  float ph_ = 0.0;
#endif`;

const MOTION = {
  // plants: uv.y = 0 at the root, 1 at the tip
  plant: amp => /* glsl */`${PHASE}
  float sw_ = uv.y * uv.y;
  transformed.x += sin(uTime * 1.3 + ph_ + uv.y * 3.0) * sw_ * ${amp.toFixed(3)};
  transformed.z += cos(uTime * 0.9 + ph_ * 1.7 + uv.y * 2.0) * sw_ * ${(amp * 0.6).toFixed(3)};`,
  // fish: nose at +z, the tail swings
  fish: () => /* glsl */`${PHASE}
  transformed.x += sin(uTime * 9.0 + ph_ * 5.0 + position.z * 5.0) * 0.11 * (0.4 - position.z);`,
  // jellyfish: the bell pulses, tentacles trail
  jelly: () => /* glsl */`${PHASE}
  float pulse_ = sin(uTime * 1.8 + ph_);
  transformed.xz *= 1.0 + pulse_ * 0.16 * smoothstep(0.9, -0.2, position.y);
  transformed.x += sin(uTime * 1.4 + ph_ + position.y * 2.2) * 0.10 * max(0.0, -position.y);
  transformed.y += sin(uTime * 0.4 + ph_) * 0.8 + pulse_ * 0.06;`,
};

/**
 * Makes a built-in material belong under water: sun caustics that fade with depth,
 * and optional vertex motion (plants sway, fish wiggle, jellyfish pulse).
 */
export function patchUnderwater(mat, { caustic = true, motion = null, amp = 0.2, rock = null } = {}) {
  mat.onBeforeCompile = shader => {
    if (rock) shader.uniforms.uRock = { value: rock };
    shader.uniforms.uTime = uw.uTime;
    shader.uniforms.uCaustic = uw.uCaustic;

    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nuniform float uTime;\nvarying vec3 vWPos;\nvarying float vSlope;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\n' + (motion ? MOTION[motion](amp) : ''))
      .replace('#include <project_vertex>', /* glsl */`#include <project_vertex>
        vec4 wp_ = vec4(transformed, 1.0);
        #ifdef USE_INSTANCING
          wp_ = instanceMatrix * wp_;
        #endif
        vWPos = (modelMatrix * wp_).xyz;
        vSlope = normal.y;`);

    if (rock) {
      // steep faces show bare rock instead of stretched sand
      shader.fragmentShader = shader.fragmentShader
        .replace('#include <common>', '#include <common>\nuniform sampler2D uRock;\nvarying float vSlope;')
        .replace('#include <color_fragment>', /* glsl */`#include <color_fragment>
          {
            float steep_ = 1.0 - smoothstep(0.62, 0.86, vSlope);
            vec3 rk_ = texture2D(uRock, vMapUv * 0.55).rgb * 1.9;
            diffuseColor.rgb = mix(diffuseColor.rgb, rk_ * vec3(0.9, 0.88, 0.9), steep_);
          }`);
    }
    if (!caustic) return;
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', `#include <common>\nuniform float uTime;\nuniform float uCaustic;\nvarying vec3 vWPos;\n${CAUSTIC_GLSL}`)
      .replace('#include <opaque_fragment>', /* glsl */`
        if (vWPos.y < 0.0 && uCaustic > 0.001) {
          vec3 wn_ = inverseTransformDirection(normal, viewMatrix);
          float up_ = clamp(wn_.y * 0.75 + 0.45, 0.0, 1.0);
          float fade_ = exp(vWPos.y * 0.05) * smoothstep(0.0, -0.5, vWPos.y);
          float c_ = uwCaustic(vWPos.xz * 0.2 + vWPos.y * 0.04, uTime * 0.22);
          outgoingLight += diffuseColor.rgb * vec3(0.8, 0.97, 1.0) * c_ * fade_ * up_ * uCaustic * 2.4;
        }
        #include <opaque_fragment>`);
  };
  mat.customProgramCacheKey = () => `uw-${caustic}-${motion}-${amp}-${!!rock}`;
  return mat;
}
