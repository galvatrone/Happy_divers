import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const COUNT = 220;

function makeGlowTexture() {
  const c = document.createElement('canvas');
  c.width = c.height = 32;
  const ctx = c.getContext('2d');
  const g = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
  g.addColorStop(0,   'rgba(45,255,180,1.0)');
  g.addColorStop(0.4, 'rgba(0,229,255,0.5)');
  g.addColorStop(1,   'rgba(0,60,120,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 32, 32);
  return new THREE.CanvasTexture(c);
}

export function BioParticles() {
  const pointsRef = useRef();

  const { positions, speeds, phases } = useMemo(() => {
    const positions = new Float32Array(COUNT * 3);
    const speeds    = new Float32Array(COUNT);
    const phases    = new Float32Array(COUNT);

    for (let i = 0; i < COUNT; i++) {
      positions[i * 3]     = (Math.random() - 0.5) * 22;
      positions[i * 3 + 1] = -22 - Math.random() * 18;  // Y -22 to -40 (deep)
      positions[i * 3 + 2] = -10 - Math.random() * 50;  // Z -10 to -60 (deep zone)
      speeds[i]  = 0.002 + Math.random() * 0.006;
      phases[i]  = Math.random() * Math.PI * 2;
    }
    return { positions, speeds, phases };
  }, []);

  const texture = useMemo(() => makeGlowTexture(), []);

  useFrame(({ clock }) => {
    if (!pointsRef.current) return;
    const pos = pointsRef.current.geometry.attributes.position.array;
    const t   = clock.elapsedTime;

    for (let i = 0; i < COUNT; i++) {
      pos[i * 3 + 1] += speeds[i];
      pos[i * 3]     += Math.sin(t * 0.3 + phases[i]) * 0.003;

      if (pos[i * 3 + 1] > -20) {
        pos[i * 3 + 1] = -40 - Math.random() * 2;
        pos[i * 3]     = (Math.random() - 0.5) * 22;
      }
    }
    pointsRef.current.geometry.attributes.position.needsUpdate = true;

    // Pulse opacity
    const pulse = 0.3 + Math.sin(t * 0.8) * 0.15;
    pointsRef.current.material.opacity = pulse;
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        size={0.09}
        map={texture}
        transparent
        opacity={0.3}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        sizeAttenuation
      />
    </points>
  );
}
