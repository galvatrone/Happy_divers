import { useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import oceanVert from '../../shaders/oceanSurface.vert';
import oceanFrag from '../../shaders/oceanSurface.frag';
import { sceneState } from '../../store/sceneState';

export function OceanSurface() {

  const uniforms = useMemo(() => ({
    uTime:       { value: 0 },
    uWaveAmp:    { value: 0.14 },
    uWaterColor: { value: new THREE.Color(0x0d4f6e) },
    uFoamColor:  { value: new THREE.Color(0x7ecfce) },
    uOpacity:    { value: 0 },
  }), []);

  useFrame(({ clock }) => {
    uniforms.uTime.value = clock.elapsedTime;

    // Visible only near the surface (first 18% of scroll)
    const p = sceneState.scrollProgress;
    const target =
      p < 0.05 ? 0 :
      p < 0.12 ? (p - 0.05) / 0.07 :
      p < 0.22 ? 1 :
      p < 0.35 ? 1 - (p - 0.22) / 0.13 :
      0;

    uniforms.uOpacity.value = THREE.MathUtils.lerp(uniforms.uOpacity.value, target, 0.04);
  });

  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
      <planeGeometry args={[80, 160, 80, 80]} />
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
