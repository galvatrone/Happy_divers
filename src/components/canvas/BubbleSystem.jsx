import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const COUNT = 400;

function makeSpriteTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 64;
  const ctx = canvas.getContext('2d');

  const grad = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
  grad.addColorStop(0,   'rgba(200,240,255,0.9)');
  grad.addColorStop(0.5, 'rgba(120,200,255,0.4)');
  grad.addColorStop(1,   'rgba(0,80,160,0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 64, 64);

  ctx.beginPath();
  ctx.arc(32, 32, 28, 0, Math.PI * 2);
  ctx.strokeStyle = 'rgba(220,245,255,0.5)';
  ctx.lineWidth = 1.2;
  ctx.stroke();

  return new THREE.CanvasTexture(canvas);
}

export function BubbleSystem() {
  const pointsRef = useRef();

  const { positions, speeds, phases } = useMemo(() => {
    const positions = new Float32Array(COUNT * 3);
    const speeds    = new Float32Array(COUNT);
    const phases    = new Float32Array(COUNT);

    for (let i = 0; i < COUNT; i++) {
      positions[i * 3]     = (Math.random() - 0.5) * 16;
      positions[i * 3 + 1] = -20 + Math.random() * 22;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 120 - 10;  // spread along path
      speeds[i]  = 0.005 + Math.random() * 0.013;
      phases[i]  = Math.random() * Math.PI * 2;
    }
    return { positions, speeds, phases };
  }, []);

  const texture = useMemo(() => makeSpriteTexture(), []);

  useFrame(({ clock, camera }) => {
    if (!pointsRef.current) return;

    const pos  = pointsRef.current.geometry.attributes.position.array;
    const t    = clock.elapsedTime;
    const camY = camera.position.y;

    for (let i = 0; i < COUNT; i++) {
      pos[i * 3 + 1] += speeds[i];
      pos[i * 3]     += Math.sin(t * 0.7 + phases[i]) * 0.002;

      if (pos[i * 3 + 1] > camY + 16) {
        pos[i * 3 + 1] = camY - 24;
        pos[i * 3]     = (Math.random() - 0.5) * 16;
      }
    }

    pointsRef.current.geometry.attributes.position.needsUpdate = true;
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        size={0.12}
        map={texture}
        transparent
        opacity={0.5}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        sizeAttenuation
      />
    </points>
  );
}
