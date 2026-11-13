import * as THREE from 'three';

// World: sea level y = 0, the beach is at z < -45, the sea gets deeper toward +z.
// The camera starts above the water facing the beach, goes under, turns around in the
// lagoon and follows the reef out to sea: coral garden → wall → cave → twilight zone.
export const PATH_POINTS = [
  [  0,   1.5,  24],  // 0  hero: floating, looking at the beach
  [  0,   1.3,  17],  // 1
  [  0.5, -1.6,  9],  // 2  just under the surface
  [  3,  -3.0,   1],  // 3  lagoon
  [  9,  -3.4,  -6],  // 4  turn right along the shore
  [ 17,  -3.8,  -5],  // 5
  [ 22,  -5.0,   6],  // 6  turn seaward
  [ 21,  -7.0,  22],  // 7
  [ 13,  -9.5,  40],  // 8  coral garden
  [  2, -11.0,  56],  // 9
  [ -6, -12.5,  72],  // 10
  [ -6, -14.0,  88],  // 11
  [-12, -16.5, 101],  // 12 edge of the drop-off
  [-10, -21.0, 114],  // 13 over the edge
  [  0, -25.5, 121],  // 14 along the wall
  [ 12, -29.0, 123],  // 15
  [ 20, -31.5, 132],  // 16 turn to the cave
  [ 14, -33.0, 146],  // 17 cave mouth
  [  6, -33.5, 160],  // 18 inside
  [ -2, -33.5, 174],  // 19
  [ -2, -34.0, 188],  // 20 exit
  [  0, -35.0, 202],  // 21 twilight zone
  [  0, -36.0, 216],  // 22 end
].map(p => new THREE.Vector3(...p));

export const curve = new THREE.CatmullRomCurve3(PATH_POINTS, false, 'centripetal');
curve.arcLengthDivisions = 800;

// Page scroll → spline position. The hero barely drifts, then the plunge is quick,
// then the rest of the dive is linear.
const STATIONS = [
  [0.00, 0.000],
  [0.06, 0.020],
  [0.12, 0.075],
  [1.00, 1.000],
];

export function scrollToCurve(s) {
  for (let i = 0; i < STATIONS.length - 1; i++) {
    const [s0, u0] = STATIONS[i];
    const [s1, u1] = STATIONS[i + 1];
    if (s <= s1) return u0 + (u1 - u0) * Math.max(0, (s - s0) / (s1 - s0));
  }
  return 1;
}

// Evenly spaced samples, used for terrain clearance and object placement.
export const PATH_SAMPLES = Array.from({ length: 401 }, (_, i) => {
  const u = i / 400;
  const p = curve.getPointAt(u);
  return { x: p.x, y: p.y, z: p.z, u };
});

const UNDERWATER = PATH_SAMPLES.filter(s => s.y < -1.5);

/** Nearest underwater path sample in the XZ plane: { d, y, u }. */
export function nearestOnPath(x, z) {
  let best = Infinity, by = 0, bu = 0;
  for (let i = 0; i < UNDERWATER.length; i++) {
    const s = UNDERWATER[i];
    const dx = s.x - x, dz = s.z - z;
    const d = dx * dx + dz * dz;
    if (d < best) { best = d; by = s.y; bu = s.u; }
  }
  return { d: Math.sqrt(best), y: by, u: bu };
}
