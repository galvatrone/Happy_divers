import { useRef, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import depthFogVert from '../../shaders/depthFog.vert';
import depthFogFrag from '../../shaders/depthFog.frag';
import { sceneState } from '../../store/sceneState';

export function DepthFogLayer() {
  const meshRef = useRef();
  const { camera, size } = useThree();

  const uniforms = useMemo(
    () => ({
      uNearColor:  { value: new THREE.Color(0x061c28) },
      uDeepColor:  { value: new THREE.Color(0x020508) },
      uFogFactor:  { value: 0 },
      uIntensity:  { value: 0 },
    }),
    [],
  );

  useFrame(() => {
    uniforms.uFogFactor.value = THREE.MathUtils.lerp(
      uniforms.uFogFactor.value,
      sceneState.fogDensity,
      0.03,
    );
    uniforms.uIntensity.value = THREE.MathUtils.lerp(
      uniforms.uIntensity.value,
      sceneState.fogDensity * 0.92,
      0.03,
    );

    if (meshRef.current) {
      const dist = 4.9;
      meshRef.current.position.y = camera.position.y;
      meshRef.current.position.z = camera.position.z - dist;
      const fovRad = (camera.fov * Math.PI) / 180;
      const h = 2 * Math.tan(fovRad / 2) * dist * 1.05;
      meshRef.current.scale.set(h * (size.width / size.height), h, 1);
    }
  });

  return (
    <mesh ref={meshRef} renderOrder={-1}>
      <planeGeometry args={[1, 1]} />
      <shaderMaterial
        vertexShader={depthFogVert}
        fragmentShader={depthFogFrag}
        uniforms={uniforms}
        transparent
        depthTest={false}
        depthWrite={false}
      />
    </mesh>
  );
}
