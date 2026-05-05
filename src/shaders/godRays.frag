uniform float uTime;
uniform float uIntensity;
uniform float uAspect;      // viewport width/height

varying vec2 vUv;

// Thin light shafts from top-centre, fanning down
float shaft(vec2 uv, float t) {
  vec2 origin = vec2(0.5, 1.05);
  vec2 dir = uv - origin;

  // Angle from origin
  float angle = atan(dir.x / uAspect, -dir.y);

  // Comb of rays: varying width and speed
  float ray  = sin(angle * 14.0 + t * 0.22) * 0.5 + 0.5;
  float ray2 = sin(angle * 9.0  - t * 0.17) * 0.5 + 0.5;
  float beam = pow(ray * ray2, 2.5);

  // Distance falloff from origin
  float dist = length(vec2(dir.x / uAspect, dir.y));
  float falloff = 1.0 / (1.0 + dist * 3.0);
  falloff *= smoothstep(1.05, 0.3, dist); // fade at edges

  // Only show below origin
  float below = smoothstep(0.02, -0.05, dir.y);

  return beam * falloff * below;
}

void main() {
  float r = shaft(vUv, uTime);
  vec3 col = mix(vec3(0.38, 0.78, 0.72), vec3(0.55, 0.88, 0.95), r);
  float alpha = r * uIntensity * 0.28;
  gl_FragColor = vec4(col * alpha, alpha);
}
