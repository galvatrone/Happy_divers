---
name: Tech stack and architecture rules
description: Exact library versions and the non-negotiable architecture constraints for the Happy Divers site
type: project
---

**Library versions (package.json):**
- react 18.3.1, react-dom 18.3.1
- three 0.167.1
- @react-three/fiber 8.17.10
- @react-three/drei 9.109.2
- lenis 1.3.23 (was @studio-freight/lenis — package moved)
- gsap 3.12.5
- howler 2.2.4
- vite 5.4.x + vite-plugin-glsl 1.3.x

**Core architecture rules (never break):**
1. `<Canvas style={{position:'fixed',inset:0}}>`  — one canvas, always visible
2. HTML sections are `position:sticky; top:0; height:100vh` inside zone wrappers that have the scroll budget height
3. `sceneState` is a plain mutable object — ScrollTrigger writes it, useFrame reads it
4. GSAP animates HTML. Three.js animates 3D. They never cross.
5. `public/assets` is a symlink to `../assets` (keeps existing asset paths working)

**Scroll-to-depth mapping (getCameraY in App.jsx):**
- progress 0.00–0.05 → camera Y = 2.0 (surface)
- progress 0.05–0.18 → lerp to 0.5
- progress 0.18–0.28 → lerp to -8 (dive transition)
- progress 0.28–0.55 → lerp to -32 (underwater)
- progress 0.55–0.78 → lerp to -52 (courses/about depth)
- progress 0.78–1.00 → lerp to -65 (deepest)

**How to apply:** When adding new 3D elements, put them in `OceanScene.jsx`, read `sceneState` in `useFrame`, fade/position based on `scrollProgress` or `zone`.
