import { useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF, useAnimations } from '@react-three/drei';
import * as THREE from 'three';
import { sceneState } from '../../store/sceneState';

useGLTF.preload('/assets/model/fish/school_of_fish.glb');

export function FishSchool() {
  const groupRef = useRef();
  const { scene, animations } = useGLTF('/assets/model/fish/school_of_fish.glb');
  const { actions, mixer }    = useAnimations(animations, groupRef);

  useEffect(() => {
    // Play whichever animation clip exists first
    if (actions) {
      const clip = Object.values(actions)[0];
      if (clip) {
        clip.reset().setLoop(THREE.LoopRepeat, Infinity).play();
      }
    }
  }, [actions]);

  useFrame((_, delta) => {
    if (!groupRef.current) return;

    // Drive animation speed from sceneState
    if (mixer) mixer.update(delta * sceneState.fishActivity);

    // Gentle collective drift
    const t   = performance.now() * 0.001;
    groupRef.current.position.x = Math.sin(t * 0.12) * 3.5;
    groupRef.current.position.z = Math.cos(t * 0.09) * 2.0;

    // Fade in when underwater
    const vis = sceneState.scrollProgress < 0.32 ? 0 : Math.min(1, (sceneState.scrollProgress - 0.32) / 0.18);
    groupRef.current.traverse((c) => {
      if (c.isMesh && c.material) {
        c.material.transparent = true;
        c.material.opacity     = vis;
      }
    });
  });

  return (
    <group ref={groupRef} position={[4, -14, -6]} scale={0.9}>
      <primitive object={scene} />
    </group>
  );
}
