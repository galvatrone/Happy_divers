import { useRef, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import causticsVert from '../../shaders/caustics.vert';
import causticsFrag from '../../shaders/caustics.frag';
import { sceneState } from '../../store/sceneState';

export function CausticsLayer() {
  const meshRef = useRef();
  const { camera, size } = useThree();

  const uniforms = useMemo(
    () => ({
      uTime:      { value: 0 },
      uIntensity: { value: 0 },
      uColor:     { value: new THREE.Color(0x2dd4bf) },
    }),
    [],
  );

  useFrame(({ clock }) => {
    uniforms.uTime.value      = clock.elapsedTime;
    uniforms.uIntensity.value = THREE.MathUtils.lerp(
      uniforms.uIntensity.value,
      sceneState.causticIntensity,
      0.04,
    );

    if (meshRef.current) {
      const dist = 4.5;
      meshRef.current.position.y = camera.position.y;
      meshRef.current.position.z = camera.position.z - dist;
      const fovRad = (camera.fov * Math.PI) / 180;
      const h = 2 * Math.tan(fovRad / 2) * dist * 1.04;
      const w = h * (size.width / size.height);
      meshRef.current.scale.set(w, h, 1);
    }
  });

  return (
    <mesh ref={meshRef} renderOrder={1}>
      <planeGeometry args={[1, 1]} />
      <shaderMaterial
        vertexShader={causticsVert}
        fragmentShader={causticsFrag}
        uniforms={uniforms}
        transparent
        depthTest={false}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </mesh>
  );
}
