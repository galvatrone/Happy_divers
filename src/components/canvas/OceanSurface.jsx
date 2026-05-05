import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import oceanVert from '../../shaders/oceanSurface.vert';
import oceanFrag from '../../shaders/oceanSurface.frag';
import { sceneState } from '../../store/sceneState';

export function OceanSurface() {
  const meshRef = useRef();

  const uniforms = useMemo(
    () => ({
      uTime:       { value: 0 },
      uWaveAmp:    { value: 0.12 },
      uWaterColor: { value: new THREE.Color(0x0d4f6e) },
      uFoamColor:  { value: new THREE.Color(0x7ecfce) },
      uOpacity:    { value: 0 },
    }),
    [],
  );

  useFrame(({ clock }) => {
    uniforms.uTime.value = clock.elapsedTime;

    // Ocean surface is visible only near the surface/transition zone
    const p = sceneState.scrollProgress;
    const targetOpacity = p < 0.12 ? 0 : p < 0.22 ? (p - 0.12) / 0.10 : p < 0.40 ? 1 : p < 0.55 ? 1 - (p - 0.40) / 0.15 : 0;
    uniforms.uOpacity.value = THREE.MathUtils.lerp(uniforms.uOpacity.value, targetOpacity, 0.04);

    if (meshRef.current) {
      // Sit at Y=0 in world space (the surface boundary)
      meshRef.current.position.y = 0;
    }
  });

  return (
    <mesh ref={meshRef} rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[60, 60, 80, 80]} />
      <shaderMaterial
        vertexShader={oceanVert}
        fragmentShader={oceanFrag}
        uniforms={uniforms}
        transparent
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}
