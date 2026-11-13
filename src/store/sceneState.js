// Central mutable data bus — written by the scroll rig, read by useFrame() and the HTML overlay.
// Plain object on purpose: it changes every frame and must not trigger React renders.
export const sceneState = {
  scrollProgress: 0,   // smoothed page scroll, 0→1
  targetProgress: 0,   // raw page scroll, 0→1
  curveU:         0,   // position on the camera spline, 0→1 (arc length)
  camY:           1.5, // camera height; sea level is 0
  depth:          0,   // metres under water (0 above the surface)
  uTime:          0,
  plungeAt:       -100, // uTime of the last plunge through the surface
  plungeArmed:    false,
  pointer:        { x: 0, y: 0 },
  audioEnabled:   false,
};

if (typeof window !== 'undefined') window.__dive = sceneState;
