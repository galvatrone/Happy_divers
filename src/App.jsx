import { useEffect } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import * as THREE from 'three';

import { useLenis }  from './hooks/useLenis';
import { sceneState } from './store/sceneState';

import { SceneCanvas }          from './components/canvas/SceneCanvas';
import { SiteHeader }           from './components/ui/SiteHeader';
import { SiteFooter }           from './components/ui/SiteFooter';
import { HeroSection }          from './components/sections/HeroSection';
import { UnderwaterSection }    from './components/sections/UnderwaterSection';
import { CoursesSection }       from './components/sections/CoursesSection';
import { GuidedDivesSection }   from './components/sections/GuidedDivesSection';
import { AboutSection }         from './components/sections/AboutSection';
import { ContactSection }       from './components/sections/ContactSection';

gsap.registerPlugin(ScrollTrigger);

// ── Scroll-progress → camera depth ─────────────────────────────────────────
function getCameraY(p) {
  if (p < 0.05)  return 2.0;
  if (p < 0.18)  return THREE.MathUtils.lerp(2.0, 0.5,  (p - 0.05) / 0.13);
  if (p < 0.28)  return THREE.MathUtils.lerp(0.5, -8.0, (p - 0.18) / 0.10);
  if (p < 0.55)  return THREE.MathUtils.lerp(-8.0, -32, (p - 0.28) / 0.27);
  if (p < 0.78)  return THREE.MathUtils.lerp(-32,  -52, (p - 0.55) / 0.23);
  return         THREE.MathUtils.lerp(-52, -65, Math.min((p - 0.78) / 0.22, 1));
}

function getZone(p) {
  if (p < 0.20) return 'surface';
  if (p < 0.30) return 'transition';
  if (p < 0.52) return 'underwater';
  if (p < 0.72) return 'courses';
  if (p < 0.88) return 'about';
  return 'contact';
}

// ── Master ScrollTrigger → sceneState writer ───────────────────────────────
function useScrollDriver() {
  useEffect(() => {
    const trigger = ScrollTrigger.create({
      trigger:  '#scroll-content',
      start:    'top top',
      end:      'bottom bottom',
      onUpdate(self) {
        const p = self.progress;

        sceneState.scrollProgress = p;
        sceneState.cameraY        = getCameraY(p);
        sceneState.zone           = getZone(p);

        // Surface plane opacity: 1 → 0 over the transition zone
        sceneState.surfaceOpacity =
          p < 0.18 ? 1 :
          p < 0.30 ? THREE.MathUtils.lerp(1, 0, (p - 0.18) / 0.12) :
          0;

        // Caustics: ramps in once underwater
        sceneState.causticIntensity =
          p < 0.26 ? 0 :
          p < 0.40 ? (p - 0.26) / 0.14 :
          p < 0.80 ? 1 :
          THREE.MathUtils.lerp(1, 0.3, (p - 0.80) / 0.20);

        // God rays: brightest just below surface, fades with depth
        sceneState.godRayIntensity =
          p < 0.26 ? 0 :
          p < 0.38 ? (p - 0.26) / 0.12 :
          p < 0.58 ? THREE.MathUtils.lerp(1, 0.2, (p - 0.38) / 0.20) :
          0.2;

        // Fog: zero at surface, max by courses
        sceneState.fogDensity =
          p < 0.30 ? 0 :
          p < 0.55 ? (p - 0.30) / 0.25 :
          1;

        // Transition particle progress (0–1 in the transition zone)
        sceneState.transitionProgress =
          p < 0.18 ? 0 :
          p < 0.30 ? (p - 0.18) / 0.12 :
          1;

        // Fish swim faster deeper
        sceneState.fishActivity = 0.4 + p * 0.8;

        // Bubble speed
        sceneState.bubbleSpeed = 0.3 + p * 0.5;
      },
    });

    // Fade scroll indicator out on first scroll
    const indEl = document.querySelector('.scroll-indicator');
    if (indEl) {
      ScrollTrigger.create({
        trigger: '#scroll-content',
        start:   'top top',
        end:     '+=300',
        scrub:   true,
        onUpdate(self) {
          gsap.set(indEl, { opacity: Math.max(0, 1 - self.progress * 3) });
        },
      });
    }

    return () => trigger.kill();
  }, []);
}

// ── Dive-transition particle canvas (HTML, not Three.js) ───────────────────
// Runs entirely as a 2D canvas overlay during the transition zone only,
// matching the existing vanilla-JS implementation's scrub=0.22 snappiness.
function useTransitionCanvas() {
  useEffect(() => {
    const isMobile = () => window.innerWidth < 768;
    const REDUCED  = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (REDUCED) return;

    const canvas = document.createElement('canvas');
    canvas.style.cssText =
      'position:fixed;inset:0;width:100%;height:100%;z-index:2;pointer-events:none;';
    document.body.appendChild(canvas);
    const ctx = canvas.getContext('2d');

    let W = 0, H = 0, rafId = null, lastT = 0;
    const COUNT = isMobile() ? 110 : 200;
    const pts   = [];

    const rand = (a, b) => a + Math.random() * (b - a);

    function spawn() {
      return {
        x: rand(0, W || window.innerWidth),
        y: rand(-H * 0.2, H * 1.1),
        r: rand(1.2, 11), vy: rand(2.5, 14),
        vx: rand(-0.4, 0.4),
        depth: Math.random(), phase: rand(0, Math.PI * 2),
      };
    }

    function resize() {
      canvas.width = W = window.innerWidth;
      canvas.height = H = window.innerHeight;
      pts.length = 0;
      for (let i = 0; i < COUNT; i++) pts.push(spawn());
    }
    resize();
    window.addEventListener('resize', resize);

    function draw(now) {
      const dt  = Math.min((now - lastT) / 16.67, 3);
      lastT = now;
      const pr  = sceneState.transitionProgress;

      // Only draw during the transition zone
      if (pr <= 0 || pr >= 1) {
        ctx.clearRect(0, 0, W, H);
        rafId = requestAnimationFrame(draw);
        return;
      }

      const spd    = 1 + pr * 11;
      const trailA = 0.28 + (1 - pr) * 0.38;
      ctx.fillStyle = `rgba(0,7,20,${trailA})`;
      ctx.fillRect(0, 0, W, H);

      for (const p of pts) {
        p.y -= p.vy * spd * dt;
        p.x += Math.sin(p.phase + now * 0.0008) * p.vx * spd * 0.5;
        p.phase += 0.012;
        if (p.y < -p.r * 4) { p.y = H + p.r * 2; p.x = rand(0, W); }

        const elong = 1 + spd * p.depth * 1.1;
        const er    = p.r * (0.55 + p.depth * 0.45);
        const alpha = (0.12 + p.depth * 0.52) * (0.35 + pr * 0.65);

        ctx.save();
        ctx.translate(p.x, p.y);
        const g = ctx.createRadialGradient(-er * 0.28, -er * 0.28, 0, 0, 0, er);
        g.addColorStop(0,   `rgba(225,242,255,${alpha})`);
        g.addColorStop(0.45,`rgba(150,205,255,${alpha * 0.45})`);
        g.addColorStop(1,   `rgba(80,155,220,${alpha * 0.08})`);
        ctx.beginPath();
        ctx.ellipse(0, 0, er, er * elong, 0, 0, Math.PI * 2);
        ctx.fillStyle   = g;
        ctx.fill();
        ctx.strokeStyle = `rgba(200,230,255,${alpha * 0.55})`;
        ctx.lineWidth   = 0.5;
        ctx.stroke();
        ctx.restore();
      }

      // Vignette deepens with progress
      const vig = ctx.createRadialGradient(W/2, H/2, H * 0.08, W/2, H/2, Math.max(W,H) * 0.76);
      vig.addColorStop(0, 'transparent');
      vig.addColorStop(1, `rgba(0,4,16,${0.15 + pr * 0.72})`);
      ctx.fillStyle = vig;
      ctx.fillRect(0, 0, W, H);

      rafId = requestAnimationFrame(draw);
    }

    rafId = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('resize', resize);
      canvas.remove();
    };
  }, []);
}

// ── App ────────────────────────────────────────────────────────────────────
export default function App() {
  useLenis();
  useScrollDriver();
  useTransitionCanvas();

  return (
    <div id="app">
      {/* Fixed WebGL canvas — z-index 0 */}
      <SceneCanvas />

      {/* Fixed navigation — z-index 100 */}
      <SiteHeader />

      {/* ── Scrollable overlay content ─────────────────────── */}
      <div id="scroll-content">

        {/* Zone 1 · Surface — 250vh scroll budget keeps the hero lingering */}
        <div className="zone" style={{ height: '250vh' }}>
          <HeroSection />
        </div>

        {/* Zone 2 · Transition — brief 30vh flash as we dive */}
        <div className="zone" style={{ height: '30vh' }} aria-hidden="true" />

        {/* Zone 3 · Underwater drift — 200vh */}
        <div className="zone" style={{ height: '200vh' }}>
          <UnderwaterSection />
        </div>

        {/* Zone 4 · Courses — 180vh */}
        <div className="zone" style={{ height: '180vh' }}>
          <CoursesSection />
        </div>

        {/* Zone 5 · Guided dives — 160vh */}
        <div className="zone" style={{ height: '160vh' }}>
          <GuidedDivesSection />
        </div>

        {/* Zone 6 · About — 160vh */}
        <div className="zone" style={{ height: '160vh' }}>
          <AboutSection />
        </div>

        {/* Zone 7 · Contact — 120vh */}
        <div className="zone" style={{ height: '120vh' }}>
          <ContactSection />
        </div>

      </div>

      <SiteFooter />
    </div>
  );
}
