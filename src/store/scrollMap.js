import { WAYPOINTS } from './waypoints';

// Page scroll → dive progress. Between cards the dive moves at a steady pace; at every card
// there is a "hold": a stretch of scroll during which the camera barely drifts, so the card
// stays on screen long enough to read. (The gate that stops a flick from skipping a card
// lives in useDiveScroll.js.)
const TRAVEL_VH = 920;  // scroll length of the whole dive without holds
const HOLD_VH   = 45;   // extra scroll spent at each card
const EPS       = 0.004; // dive progress covered during a hold (± around the card)

/** Dive positions (0…1) where the scroll stops: the hero and every card. */
export const STOPS = [0, ...WAYPOINTS.map(w => w.t)];

const KNOTS = [[0, 0]]; // [page vh, dive progress]
{
  let p = 0, s = 0;
  for (const w of WAYPOINTS) {
    p += (w.t - EPS - s) * TRAVEL_VH; s = w.t - EPS; KNOTS.push([p, s]);
    p += HOLD_VH;                     s = Math.min(1, w.t + EPS); KNOTS.push([p, s]);
  }
  if (s < 1) KNOTS.push([p + (1 - s) * TRAVEL_VH, 1]);
}
const TOTAL = KNOTS[KNOTS.length - 1][0];

/** Page height in viewport heights (one extra screen so the last point is reachable). */
export const SCROLL_VH = Math.round(TOTAL + 100);

function lerpTable(v, from, to) {
  for (let i = 0; i < KNOTS.length - 1; i++) {
    const a = KNOTS[i], b = KNOTS[i + 1];
    if (v <= b[from]) {
      const span = b[from] - a[from];
      return a[to] + (b[to] - a[to]) * (span > 0 ? Math.max(0, (v - a[from]) / span) : 0);
    }
  }
  return KNOTS[KNOTS.length - 1][to];
}

/** Page scroll fraction (0…1) → dive progress (0…1). */
export const pageToDive = f => lerpTable(f * TOTAL, 0, 1);
/** Dive progress (0…1) → page scroll fraction (0…1). */
export const diveToPage = s => lerpTable(s, 1, 0) / TOTAL;
