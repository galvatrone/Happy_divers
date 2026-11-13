import { useRef, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import godRaysVert from '../../shaders/godRays.vert';
import godRaysFrag from '../../shaders/godRays.frag';
import { sceneState } from '../../store/sceneState';

export function GodRaysLayer() {
  const meshRef = useRef();
  const { camera, size } = useThree();

  const uniforms = useMemo(() => ({
    uTime:      { value: 0 },
    uIntensity: { value: 0 },
    uAspect:    { value: size.width / size.height },
  }), []);

  useFrame(({ clock }) => {
    uniforms.uTime.value   = clock.elapsedTime;
    uniforms.uAspect.value = size.width / size.height;

    // God rays: strongest just below surface, fade in deep water
    const p = sceneState.scrollProgress;
    const target =
      p < 0.15 ? 0 :
      p < 0.28 ? (p - 0.15) / 0.13 :
      p < 0.50 ? THREE.MathUtils.lerp(1, 0.18, (p - 0.28) / 0.22) :
      0.18;

    uniforms.uIntensity.value = THREE.MathUtils.lerp(
      uniforms.uIntensity.value, target, 0.03,
    );

    if (meshRef.current) {
      const dist = 4.3;
      meshRef.current.position.copy(camera.position);
      meshRef.current.position.z -= dist;
      const fovRad = (camera.fov * Math.PI) / 180;
      const h = 2 * Math.tan(fovRad / 2) * dist * 1.04;
      meshRef.current.scale.set(h * (size.width / size.height), h, 1);
    }
  });

  return (
    <mesh ref={meshRef} renderOrder={2}>
      <planeGeometry args={[1, 1]} />
      <shaderMaterial
        vertexShader={godRaysVert}
        fragmentShader={godRaysFrag}
        uniforms={uniforms}
        transparent
        depthTest={false}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </mesh>
  );
}
