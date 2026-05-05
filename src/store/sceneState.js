// Central mutable data bus. ScrollTrigger writes here; useFrame() reads here.
// Never use React state for these — they update every frame.
export const sceneState = {
  // Master scroll
  scrollProgress: 0,      // 0–1 across entire page

  // Camera
  cameraY: 2.0,           // world Y: positive = above surface, negative = depth
  cameraX: 0,
  targetCameraY: 2.0,

  // Zone identifier
  zone: 'surface',        // 'surface' | 'transition' | 'underwater' | 'courses' | 'about' | 'contact'

  // Shader uniforms (set by ScrollTrigger, read in useFrame)
  causticIntensity: 0,    // 0–1
  godRayIntensity: 0,     // 0–1
  fogDensity: 0,          // 0–1
  depthTint: 0,           // 0–1: 0=near surface teal, 1=deep abyss navy

  // Surface frame sequence
  surfaceOpacity: 1,      // 1 at surface, 0 below

  // Transition particle burst
  transitionProgress: 0,  // 0–1 during the dive ramp

  // Underwater ambience
  bubbleSpeed: 0.4,
  fishActivity: 0.5,

  // Audio zone (for Howler crossfades)
  audioZone: 'surface',
};
