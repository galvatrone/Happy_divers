uniform vec3  uNearColor;   // shallow teal
uniform vec3  uDeepColor;   // abyss navy-black
uniform float uFogFactor;   // 0–1, how much deep color bleeds in
uniform float uIntensity;   // overall alpha

varying vec2 vUv;

void main() {
  // Vertical gradient — denser at bottom of viewport
  float gradient = vUv.y;
  vec3 col = mix(uNearColor, uDeepColor, clamp(gradient * uFogFactor + uFogFactor * 0.4, 0.0, 1.0));
  gl_FragColor = vec4(col, uIntensity);
}
