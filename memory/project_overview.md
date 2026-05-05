---
name: Happy Divers project overview
description: Core facts about the Happy Divers dive-center website and what has been built
type: project
---

Full React 18 + Vite 5 + R3F dive-center website (Mediterranean, PADI/SSI, est. 2004).

**Why:** Build a "Blue Marine Foundation"-style fixed-canvas scroll-storytelling immersive site.

**What exists:**
- `assets/frames/section-1/` — 192 PNG frames (surface scene, 24fps loop)
- `assets/model/` — bubbles_3.glb, bubbles_5.glb, school_of_fish.glb
- `assets/overlays/` — one overlay photo (used in Guided Dives section)
- `assets/hero/` — hero frame PNG

**What was built (src/):**
- `store/sceneState.js` — central mutable data bus (plain object, never React state)
- `shaders/` — 8 GLSL files: caustics, depthFog, godRays, oceanSurface
- `hooks/useLenis.js` + `useFrameSequence.js`
- `components/canvas/` — SceneCanvas → OceanScene → {CameraController, SurfacePlane, OceanSurface, CausticsLayer, GodRaysLayer, DepthFogLayer, BubbleSystem, FishSchool}
- `components/sections/` — Hero, Underwater, Courses, GuidedDives, About, Contact
- `components/ui/` — SiteHeader, SiteFooter

**Blender pipeline:** `blender/` contains 6 Python scripts + `run_all.sh` for creating fish_small, fish_large, shark, manta_ray, coral_01, coral_02, reef_rock with Draco export.

**How to apply:** Dev server: `npm run dev` (port 5173). Build: `npm run build`. Blender assets: `cd blender && bash run_all.sh`.
