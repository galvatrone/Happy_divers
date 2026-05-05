uniform float uTime;
uniform float uWaveAmp;

varying vec2  vUv;
varying float vElevation;
varying vec3  vNormal;

void main() {
  vUv = uv;

  vec3 pos = position;

  // Layered sine-wave displacement
  float e =  sin(pos.x * 2.1 + uTime * 0.9)          * uWaveAmp
           + sin(pos.z * 1.7 + uTime * 0.7 + 0.8)    * uWaveAmp * 0.6
           + sin((pos.x + pos.z) * 1.3 + uTime * 1.1) * uWaveAmp * 0.35;

  pos.y += e;
  vElevation = e;

  // Approximate normal from partial derivatives
  float dx = cos(pos.x * 2.1 + uTime * 0.9) * uWaveAmp * 2.1;
  float dz = cos(pos.z * 1.7 + uTime * 0.7) * uWaveAmp * 1.7;
  vNormal = normalize(vec3(-dx, 1.0, -dz));

  gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
}
