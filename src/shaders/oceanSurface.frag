uniform vec3  uWaterColor;
uniform vec3  uFoamColor;
uniform float uOpacity;

varying vec2  vUv;
varying float vElevation;
varying vec3  vNormal;

void main() {
  // Fresnel-ish rim
  float rim = pow(1.0 - abs(vNormal.y), 2.0);

  vec3 col  = uWaterColor;
  col += rim * uFoamColor * 0.55;
  col += vElevation * 0.18 * vec3(0.12, 0.38, 0.44);

  float alpha = uOpacity * (0.35 + rim * 0.4 + vElevation * 0.12);

  gl_FragColor = vec4(col, clamp(alpha, 0.0, 1.0));
}
