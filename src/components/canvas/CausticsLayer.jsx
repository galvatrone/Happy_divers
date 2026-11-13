import { useRef, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import causticsVert from '../../shaders/caustics.vert';
import causticsFrag from '../../shaders/caustics.frag';
import { sceneState } from '../../store/sceneState';

export function CausticsLayer() {
  const meshRef = useRef();
  const { camera, size } = useThree();

  const uniforms = useMemo(() => ({
    uTime:      { value: 0 },
    uIntensity: { value: 0 },
    uColor:     { value: new THREE.Color(0x00e5ff) },
  }), []);

  useFrame(({ clock }) => {
    uniforms.uTime.value = clock.elapsedTime;

    // Caustics: peak intensity in shallow/mid zone (p 0.2–0.6)
    const p = sceneState.scrollProgress;
    const target =
      p < 0.18 ? 0 :
      p < 0.35 ? (p - 0.18) / 0.17 :
      p < 0.65 ? 1 :
      p < 0.85 ? THREE.MathUtils.lerp(1, 0.25, (p - 0.65) / 0.20) :
      0.25;

    uniforms.uIntensity.value = THREE.MathUtils.lerp(
      uniforms.uIntensity.value, target, 0.04,
    );

    if (meshRef.current) {
      const dist = 4.5;
      meshRef.current.position.copy(camera.position);
      meshRef.current.position.z -= dist;
      const fovRad = (camera.fov * Math.PI) / 180;
      const h = 2 * Math.tan(fovRad / 2) * dist * 1.04;
      meshRef.current.scale.set(h * (size.width / size.height), h, 1);
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
