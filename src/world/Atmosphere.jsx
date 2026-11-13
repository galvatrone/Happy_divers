import { useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { sceneState } from '../store/sceneState';
import { uw, SUN_DIR } from './underwater';

// Every zone has its own water: colour, murkiness, how much sun is left.
// `s` is the page scroll position.
const STOPS = [
  { s: 0.10, fog: '#35b6cf', density: 0.016, sun: 2.6, amb: 1.5,  caustic: 1.0, rays: 1.0, glow: 0.0, torch: 0 },
  { s: 0.24, fog: '#2aa3c8', density: 0.019, sun: 2.5, amb: 1.4,  caustic: 1.0, rays: 1.0, glow: 0.0, torch: 0 },
  { s: 0.42, fog: '#1784b8', density: 0.022, sun: 2.2, amb: 1.25, caustic: 0.9, rays: 0.8, glow: 0.0, torch: 0 },
  { s: 0.60, fog: '#0b4f86', density: 0.026, sun: 1.3, amb: 0.85, caustic: 0.5, rays: 0.45, glow: 0.1, torch: 0 },
  { s: 0.72, fog: '#062c4c', density: 0.032, sun: 0.6, amb: 0.45, caustic: 0.2, rays: 0.15, glow: 0.3, torch: 0.3 },
  { s: 0.79, fog: '#020b14', density: 0.046, sun: 0.0, amb: 0.10, caustic: 0.0, rays: 0.0, glow: 1.0, torch: 1 },
  { s: 0.87, fog: '#031425', density: 0.040, sun: 0.05, amb: 0.16, caustic: 0.0, rays: 0.0, glow: 1.0, torch: 0.8 },
  { s: 1.00, fog: '#041a36', density: 0.030, sun: 0.18, amb: 0.34, caustic: 0.0, rays: 0.1, glow: 1.0, torch: 0.25 },
];
const AIR = { fog: '#cfe9f5', density: 0.0022, sun: 3.1, amb: 1.5 };

const KEYS = ['density', 'sun', 'amb', 'caustic', 'rays', 'glow', 'torch'];

export function Atmosphere() {
  const { scene } = useThree();
  const hemi  = useRef();
  const sun   = useRef();
  const torch = useRef();

  const fog    = useMemo(() => new THREE.FogExp2('#cfe9f5', AIR.density), []);
  const cols   = useMemo(() => STOPS.map(st => new THREE.Color(st.fog)), []);
  const airCol = useMemo(() => new THREE.Color(AIR.fog), []);
  const bg     = useMemo(() => new THREE.Color(), []);
  const cur    = useMemo(() => ({}), []);
  const sunWarm = useMemo(() => new THREE.Color('#fff1d8'), []);
  const sunSea  = useMemo(() => new THREE.Color('#a8e4ff'), []);
  const skyAir  = useMemo(() => new THREE.Color('#d6ecff'), []);
  const skySea  = useMemo(() => new THREE.Color('#7fd6ff'), []);
  const gndAir  = useMemo(() => new THREE.Color('#d9c9a0'), []);
  const gndSea  = useMemo(() => new THREE.Color('#0d4a6e'), []);
  const dir     = useMemo(() => new THREE.Vector3(), []);
  scene.fog = fog;
  scene.background = bg;

  useFrame(({ camera }) => {
    const s = sceneState.scrollProgress;
    let i = 0;
    while (i < STOPS.length - 2 && s > STOPS[i + 1].s) i++;
    const a = STOPS[i], b = STOPS[i + 1];
    const t = THREE.MathUtils.smoothstep(s, a.s, b.s);
    for (const key of KEYS) cur[key] = a[key] + (b[key] - a[key]) * t;

    // 0 above the surface, 1 below; the switch happens within a few centimetres
    const under = 1 - THREE.MathUtils.smoothstep(sceneState.camY, -0.15, 0.12);

    fog.color.copy(cols[i]).lerp(cols[i + 1], t).lerp(airCol, 1 - under);
    fog.density = THREE.MathUtils.lerp(AIR.density, cur.density, under);
    bg.copy(fog.color);

    hemi.current.intensity = THREE.MathUtils.lerp(AIR.amb, cur.amb, under);
    hemi.current.color.copy(skyAir).lerp(skySea, under);
    hemi.current.groundColor.copy(gndAir).lerp(gndSea, under);
    sun.current.intensity = THREE.MathUtils.lerp(AIR.sun, cur.sun, under);
    sun.current.color.copy(sunWarm).lerp(sunSea, under);

    uw.uCaustic.value = cur.caustic;
    uw.uRays.value = cur.rays * under;
    uw.uGlow.value = cur.glow;

    // the diver's torch follows the view
    const tl = torch.current;
    tl.intensity = cur.torch * under * 170;
    camera.getWorldDirection(dir);
    tl.position.copy(camera.position).addScaledVector(dir, -0.4);
    tl.position.y -= 0.35;
    tl.target.position.copy(camera.position).addScaledVector(dir, 12);
    tl.target.updateMatrixWorld();
  });

  return (
    <>
      <hemisphereLight ref={hemi} intensity={AIR.amb} />
      <directionalLight ref={sun} position={SUN_DIR.clone().multiplyScalar(120)} intensity={AIR.sun} />
      <spotLight ref={torch} angle={0.55} penumbra={0.9} distance={46} decay={1.6} color="#dff6ff" intensity={0} />
    </>
  );
}
