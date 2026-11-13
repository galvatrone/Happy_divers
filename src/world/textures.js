import * as THREE from 'three';
import { makeRng } from './terrain';

// Photo textures live in /assets/textures/<id>/{color,normal}.jpg (Poly Haven, CC0).
const loader = new THREE.TextureLoader();
const cache = new Map();

function load(url, srgb, repeat) {
  const key = `${url}|${repeat}`;
  if (!cache.has(key)) {
    const t = loader.load(url);
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(repeat[0], repeat[1]);
    t.anisotropy = 4;
    if (srgb) t.colorSpace = THREE.SRGBColorSpace;
    cache.set(key, t);
  }
  return cache.get(key);
}

/** { map, normalMap } ready to spread into a material. */
export function surface(id, repeat = [1, 1]) {
  return {
    map: load(`/assets/textures/${id}/color.jpg`, true, repeat),
    normalMap: load(`/assets/textures/${id}/normal.jpg`, false, repeat),
  };
}

function canvasTexture(w, h, draw, repeat) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  if (repeat) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(repeat, repeat); }
  return t;
}

/** Palm frond: midrib with leaflets, on a transparent background. Tip is at the top. */
export const frondTexture = () => canvasTexture(128, 512, (ctx, w, h) => {
  ctx.lineCap = 'round';
  for (let i = 0; i < 46; i++) {
    const t = i / 45;
    const y = h - 8 - t * (h - 20);
    const len = (0.25 + Math.sin(t * Math.PI) * 0.75) * w * 0.48;
    for (const side of [-1, 1]) {
      const g = ctx.createLinearGradient(w / 2, y, w / 2 + side * len, y - 26);
      g.addColorStop(0, '#d8e8c0'); g.addColorStop(1, '#ffffff');
      ctx.strokeStyle = g;
      ctx.lineWidth = 5.5;
      ctx.beginPath(); ctx.moveTo(w / 2, y); ctx.lineTo(w / 2 + side * len, y - 26 - t * 10); ctx.stroke();
    }
  }
  ctx.strokeStyle = '#c9b98a'; ctx.lineWidth = 4;
  ctx.beginPath(); ctx.moveTo(w / 2, h); ctx.lineTo(w / 2, 10); ctx.stroke();
});

/** Mottled foliage for the jungle canopy. */
export const foliageTexture = () => canvasTexture(128, 128, (ctx, w, h) => {
  const rng = makeRng(5);
  ctx.fillStyle = '#9db88a'; ctx.fillRect(0, 0, w, h);
  for (let i = 0; i < 900; i++) {
    const l = 40 + rng() * 60;
    ctx.fillStyle = `hsl(${95 + rng() * 30}, 35%, ${l}%)`;
    ctx.beginPath(); ctx.ellipse(rng() * w, rng() * h, 2 + rng() * 5, 1 + rng() * 3, rng() * 3, 0, 6.3); ctx.fill();
  }
}, 3);

/**
 * Fish skin laid out for the sphere UVs of fishGeometry(): dark back, pale belly,
 * faint bars along the flanks and an eye on each side of the head.
 */
export const fishTexture = () => canvasTexture(256, 128, (ctx, w, h) => {
  const g = ctx.createLinearGradient(0, 0, 0, h);
  g.addColorStop(0, '#6f7f8f'); g.addColorStop(0.35, '#e9edf0'); g.addColorStop(1, '#ffffff');
  ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = 'rgba(40, 55, 70, 0.22)';
  for (const u of [0.0, 0.06, 0.94, 0.44, 0.5, 0.56, 0.62, 0.88]) ctx.fillRect(u * w - 3, h * 0.12, 6, h * 0.6);
  for (const u of [0.25 - 0.085, 0.25 + 0.085]) {
    ctx.fillStyle = '#f4f4ee'; ctx.beginPath(); ctx.arc(u * w, h * 0.42, 7, 0, 6.3); ctx.fill();
    ctx.fillStyle = '#0b0f14'; ctx.beginPath(); ctx.arc(u * w, h * 0.42, 4.2, 0, 6.3); ctx.fill();
  }
});
