export const NOISE_GLSL = /* glsl */`
float hash21(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float vnoise(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash21(i), hash21(i + vec2(1.0, 0.0)), u.x),
             mix(hash21(i + vec2(0.0, 1.0)), hash21(i + vec2(1.0, 1.0)), u.x), u.y);
}
float fbm(vec2 p) {
  float v = 0.0, a = 0.5;
  mat2 r = mat2(0.8, 0.6, -0.6, 0.8);
  for (int i = 0; i < 5; i++) { v += a * vnoise(p); p = r * p * 2.03 + 7.1; a *= 0.5; }
  return v;
}`;

// Sky gradient + sun. Linear colour. Shared by the dome and the water reflection.
export const SKY_GLSL = /* glsl */`
uniform vec3 uSun;
vec3 skyColor(vec3 dir) {
  float h = max(dir.y, 0.0);
  vec3 zenith  = vec3(0.10, 0.32, 0.78);
  vec3 horizon = vec3(0.62, 0.82, 0.95);
  vec3 col = mix(horizon, zenith, pow(h, 0.5));
  float sd = max(dot(dir, uSun), 0.0);
  col += vec3(1.0, 0.86, 0.62) * (pow(sd, 24.0) * 0.35 + pow(sd, 4.0) * 0.12);
  return col;
}`;
