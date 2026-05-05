import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';

const FRAME_COUNT = 192;
const FPS         = 24;
const PRIORITY    = 14;
const FRAME_W     = 1920;
const FRAME_H     = 1080;

const framePath = (n) =>
  `/assets/frames/section-1/frame_${String(n).padStart(4, '0')}.png`;

// Cover-crop draw: mirrors CSS object-fit:cover
function drawCover(ctx, img, cw, ch) {
  if (!img || !img.complete || !img.naturalWidth) return;
  const iw = img.naturalWidth, ih = img.naturalHeight;
  const cr = cw / ch, ir = iw / ih;
  let sx, sy, sw, sh;
  if (cr > ir) {
    sw = iw; sh = iw / cr; sx = 0; sy = (ih - sh) * 0.5;
  } else {
    sh = ih; sw = ih * cr; sy = 0; sx = (iw - sw) * 0.5;
  }
  ctx.clearRect(0, 0, cw, ch);
  ctx.drawImage(img, sx, sy, sw, sh, 0, 0, cw, ch);
}

export function useFrameSequence() {
  // Offscreen canvas — lives outside React's render cycle
  const offscreen = useMemo(() => {
    const c = document.createElement('canvas');
    c.width  = FRAME_W;
    c.height = FRAME_H;
    return c;
  }, []);

  const texture = useMemo(() => {
    const t = new THREE.CanvasTexture(offscreen);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  }, [offscreen]);

  const framesRef  = useRef(new Array(FRAME_COUNT).fill(null));
  const curRef     = useRef(0);
  const timerRef   = useRef(0);
  const readyRef   = useRef(false);

  useEffect(() => {
    const frames = framesRef.current;
    const ctx    = offscreen.getContext('2d');

    function loadFrame(i) {
      const img = new Image();
      img.onload = () => {
        frames[i] = img;
        if (!readyRef.current && i === 0) {
          readyRef.current = true;
          drawCover(ctx, img, FRAME_W, FRAME_H);
          texture.needsUpdate = true;
        }
      };
      img.src = framePath(i + 1);
    }

    for (let i = 0; i < PRIORITY; i++)    loadFrame(i);
    for (let i = PRIORITY; i < FRAME_COUNT; i++) {
      setTimeout(() => loadFrame(i), 80 + (i - PRIORITY) * 5);
    }

    return () => {
      framesRef.current.fill(null);
      texture.dispose();
    };
  }, [offscreen, texture]);

  // Call this from useFrame every tick
  const advance = (delta) => {
    timerRef.current += delta;
    if (timerRef.current < 1 / FPS) return;
    timerRef.current = 0;

    const next = (curRef.current + 1) % FRAME_COUNT;
    const img  = framesRef.current[next];
    if (!img) return;

    curRef.current = next;
    const ctx = offscreen.getContext('2d');
    drawCover(ctx, img, FRAME_W, FRAME_H);
    texture.needsUpdate = true;
  };

  return { texture, advance };
}
