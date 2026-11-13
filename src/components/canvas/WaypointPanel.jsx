import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text, RoundedBox } from '@react-three/drei';
import * as THREE from 'three';

const WAYPOINTS = [
  {
    position: [-4, -2, 55],
    title: 'HAPPY DIVERS · RED SEA',
    body: '20+ years · 40m max depth · 30m visibility\n850+ species · PADI & SSI certified',
  },
  {
    position: [5, -8, 32],
    title: 'CORAL REEF · 8–18 METRES',
    body: 'Clownfish, sea turtles, rays.\nPerfect for Open Water & beginners.',
  },
  {
    position: [-4, -15, 8],
    title: 'REEF WALL · 18–30 METRES',
    body: 'Napoleon wrasse, grey reef sharks,\nbarracuda schools on the blue.',
  },
  {
    position: [5, -22, -18],
    title: 'TWILIGHT ZONE · 30–40 METRES',
    body: 'Certified divers only.\nMantas, whale sharks, pure silence.',
  },
  {
    position: [0, -30, -40],
    title: 'BOOK YOUR DIVE',
    body: 'PADI · SSI · DAN Partner\nhappy-divers.com · +20 100 000 000',
    color: '#2dffb4',
  },
];

function Panel({ position, title, body, color = '#00e5ff' }) {
  const groupRef  = useRef();
  const bgRef     = useRef();
  const borderRef = useRef();
  const titleRef  = useRef();
  const bodyRef   = useRef();
  const opRef     = useRef(0);

  useFrame(({ camera }) => {
    if (!groupRef.current) return;

    const dist   = camera.position.distanceTo(groupRef.current.position);
    const target = dist < 22 ? Math.min(1, (22 - dist) / 12) : 0;
    opRef.current += (target - opRef.current) * 0.04;
    const op = opRef.current;

    if (bgRef.current?.material)     bgRef.current.material.opacity     = op * 0.82;
    if (borderRef.current?.material) borderRef.current.material.opacity = op * 0.28;
    if (titleRef.current)            titleRef.current.fillOpacity        = op;
    if (bodyRef.current)             bodyRef.current.fillOpacity          = op;

    // Billboard — always face camera
    groupRef.current.lookAt(camera.position);
  });

  return (
    <group ref={groupRef} position={position}>
      {/* Glass background */}
      <RoundedBox ref={bgRef} args={[9, 5, 0.1]} radius={0.18} renderOrder={10}>
        <meshStandardMaterial color="#010f1e" transparent opacity={0} side={THREE.DoubleSide} depthWrite={false} />
      </RoundedBox>

      {/* Border glow */}
      <RoundedBox ref={borderRef} args={[9.12, 5.12, 0.08]} radius={0.19} renderOrder={9}>
        <meshBasicMaterial color={color} transparent opacity={0} side={THREE.BackSide} depthWrite={false} />
      </RoundedBox>

      {/* Top accent line */}
      <mesh position={[0, 2.28, 0.12]} renderOrder={11}>
        <planeGeometry args={[3.2, 0.018]} />
        <meshBasicMaterial color={color} transparent opacity={0.9} depthWrite={false} />
      </mesh>

      {/* Title */}
      <Text
        ref={titleRef}
        position={[0, 1.35, 0.12]}
        fontSize={0.46}
        maxWidth={8}
        color="#ffffff"
        anchorX="center"
        anchorY="middle"
        fillOpacity={0}
        renderOrder={12}
      >
        {title}
      </Text>

      {/* Body */}
      <Text
        ref={bodyRef}
        position={[0, -0.15, 0.12]}
        fontSize={0.27}
        maxWidth={7.2}
        lineHeight={1.65}
        color="#7aabcc"
        anchorX="center"
        anchorY="middle"
        fillOpacity={0}
        renderOrder={12}
      >
        {body}
      </Text>
    </group>
  );
}

export function WaypointPanels() {
  return (
    <>
      {WAYPOINTS.map((wp, i) => (
        <Panel key={i} {...wp} />
      ))}
    </>
  );
}
