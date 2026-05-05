uniform float uTime;
uniform float uIntensity;
uniform vec3  uColor;

varying vec2 vUv;

// Two-pass caustic: interfering sine fields give the ripple-light look
float causticPass(vec2 uv, float t, float scale) {
  vec2 p = uv * scale;
  float a = sin(p.x * 1.0 + sin(p.y * 0.8 + t * 0.55) * 1.4);
  float b = sin(p.y * 1.1 + sin(p.x * 0.9 + t * 0.42) * 1.2);
  float c = sin((p.x + p.y) * 0.7 + t * 0.68);
  return pow(clamp((a + b + c) / 3.0 * 0.5 + 0.5, 0.0, 1.0), 3.0);
}

void main() {
  float c1 = causticPass(vUv, uTime * 0.38,  7.0);
  float c2 = causticPass(vUv * 1.27 + 0.13, uTime * 0.31, 5.5);
  float pattern = mix(c1, c2, 0.48);

  vec3 col = uColor * pattern * uIntensity;
  float alpha = pattern * uIntensity * 0.38;

  gl_FragColor = vec4(col, alpha);
}
