import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { sceneState } from '../../store/sceneState';

export function CameraController() {
  const { camera } = useThree();

  useFrame(() => {
    camera.position.y = THREE.MathUtils.lerp(
      camera.position.y,
      sceneState.cameraY,
      0.045,
    );
    camera.position.x = THREE.MathUtils.lerp(
      camera.position.x,
      sceneState.cameraX,
      0.03,
    );
  });

  return null;
}
