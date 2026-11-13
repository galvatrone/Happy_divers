import { useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

// ── geometry builder ──────────────────────────────────────────────────────────
// Merges N seaweed blades into a single BufferGeometry so they cost 1 draw call.
// Each blade is a subdivided quad (1 × SEGS rows) placed in world space.
// UV.y = 0 at base, 1 at tip — used by the vertex shader for the sway envelope.

const SEGS  = 7;   // vertical subdivisions (more = smoother bend)
const VPB   = (SEGS + 1) * 2;   // vertices per blade
const IPB   = SEGS * 6;         // indices per blade (2 tris × 3 verts × SEGS quads)

function buildBlades(count, rng) {
  const positions = new Float32Array(count * VPB * 3);
  const uvs       = new Float32Array(count * VPB * 2);
  const phases    = new Float32Array(count * VPB);   // per-vertex sway phase
  const indices   = new Uint32Array(count * IPB);

  for (let b = 0; b < count; b++) {
    const side = rng() > 0.5 ? 1 : -1;
    const bx = side * (14 + rng() * 16);      // sides only: ±14–30
    const bz = -72 + rng() * 175;             // full path Z range
    const by = -41.8 + rng() * 1.6;           // just above seafloor
    const h  = 1.6 + rng() * 3.0;             // blade height 1.6 – 4.6 m
    const w  = 0.28 + rng() * 0.32;           // blade width
    const ph = rng() * Math.PI * 2;           // sway phase
    const ry = rng() * Math.PI * 2;           // facing rotation around Y
    const cr = Math.cos(ry);
    const sr = Math.sin(ry);

    const vBase = b * VPB;
    const iBase = b * IPB;

    for (let row = 0; row <= SEGS; row++) {
      for (let col = 0; col <= 1; col++) {
        const vi = vBase + row * 2 + col;
        const u  = col;
        const v  = row / SEGS;

        // local blade position (XY plane, base at origin)
        const lx = (u - 0.5) * w;
        const ly = v * h;

        // rotate around Y and translate to world
        positions[vi * 3]     = bx + lx * cr;
        positions[vi * 3 + 1] = by + ly;
        positions[vi * 3 + 2] = bz - lx * sr;

        uvs[vi * 2]     = u;
        uvs[vi * 2 + 1] = v;
        phases[vi]      = ph;
      }
    }

    // quad → two triangles per row
    for (let row = 0; row < SEGS; row++) {
      const i  = iBase + row * 6;
      const bl = vBase + row * 2;
      const br = bl + 1;
      const tl = bl + 2;
      const tr = bl + 3;
      indices[i]     = bl; indices[i + 1] = br; indices[i + 2] = tl;
      indices[i + 3] = br; indices[i + 4] = tr; indices[i + 5] = tl;
    }
  }

  const geom = new THREE.BufferGeometry();
  geom.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geom.setAttribute('uv',       new THREE.BufferAttribute(uvs, 2));
  geom.setAttribute('aPhase',   new THREE.BufferAttribute(phases, 1));
  geom.setIndex(new THREE.BufferAttribute(indices, 1));
  return geom;
}

// ── shaders ───────────────────────────────────────────────────────────────────
const VERT = `
  #include <fog_pars_vertex>
  attribute float aPhase;
  uniform   float uTime;
  varying   vec2  vUv;
  varying   vec2  vWorldXZ;  // world XZ for top-down caustic projection

  void main() {
    vec3 pos = position;

    // Sway amplitude grows quadratically from base (uv.y=0) to tip (uv.y=1)
    float env = uv.y * uv.y;
    pos.x += sin(uTime * 1.40 + aPhase) * env * 0.70;
    pos.z += cos(uTime * 1.05 + aPhase + 0.85) * env * 0.28;

    vUv      = uv;
    vWorldXZ = pos.xz;
    // positions are already in world space — compute mvPosition for fog
    vec4 mvPosition = viewMatrix * vec4(pos, 1.0);
    gl_Position = projectionMatrix * mvPosition;
    #include <fog_vertex>
  }
`;

const FRAG = `
  #include <fog_pars_fragment>
  uniform float uTime;
  varying vec2  vUv;
  varying vec2  vWorldXZ;

  float caustic(vec2 p) {
    float v1 = sin(p.x * 6.0) + sin(p.y * 5.2 + 0.8);
    float v2 = sin(p.x * 4.1 - p.y * 3.6);
    float c  = (v1 + v2) * 0.5;
    return pow(max(0.0, 1.0 - abs(c)), 5.0);
  }

  void main() {
    // Dark teal at base → brighter sea-green at tip
    vec3 col = mix(vec3(0.03, 0.20, 0.15), vec3(0.08, 0.52, 0.34), vUv.y);

    // Top-down caustic — integer-velocity loop matches CausticLight (no seam, drifts right)
    float ct   = mod(uTime * 0.25, 6.28318);
    vec2  cUv  = vWorldXZ * 0.54;
    float cv1  = sin(cUv.x * 5.8 - ct * 2.0) + sin(cUv.y * 5.0 + ct * 1.0);
    float cv2  = sin(cUv.x * 3.9 + cUv.y * 3.5 - ct * 3.0);
    float cVal = pow(max(0.0, 1.0 - abs((cv1 + cv2) / 2.0)), 5.5) * vUv.y;
    col += vec3(0.06, 0.35, 0.75) * cVal * 0.30;

    // Narrow slightly toward the edges for a leaf-like silhouette
    float edge  = abs(vUv.x - 0.5) * 2.0;
    float shape = 1.0 - pow(edge, 2.2) * 0.6;

    float alpha = (0.78 + vUv.y * 0.18) * shape;
    if (alpha < 0.04) discard;

    gl_FragColor = vec4(col, alpha);
    #include <fog_fragment>
  }
`;

// ── component ─────────────────────────────────────────────────────────────────
const COUNT = 160;

// Deterministic pseudo-random to avoid hydration drift
function makeRng(seed) {
  let s = seed;
  return () => { s = (s * 16807 + 0) % 2147483647; return (s - 1) / 2147483646; };
}

export function Seaweed() {
  const uniforms = useMemo(() => ({ uTime: { value: 0 } }), []);

  const geom = useMemo(() => buildBlades(COUNT, makeRng(42)), []);

  useFrame(({ clock }) => { uniforms.uTime.value = clock.elapsedTime; });

  return (
    <mesh geometry={geom}>
      <shaderMaterial
        fog
        uniforms={uniforms}
        vertexShader={VERT}
        fragmentShader={FRAG}
        transparent
        depthWrite={false}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}
