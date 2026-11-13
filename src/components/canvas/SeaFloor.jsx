import { useMemo } from 'react';
import { useTexture } from '@react-three/drei';
import * as THREE from 'three';

export function SeaFloor() {
  const maps = useTexture({
    map:          '/assets/textures/sand/color.jpg',
    normalMap:    '/assets/textures/sand/normal.jpg',
    roughnessMap: '/assets/textures/sand/roughness.jpg',
    aoMap:        '/assets/textures/sand/ao.jpg',
  });

  useMemo(() => {
    Object.values(maps).forEach(tex => {
      tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
      tex.repeat.set(12, 16);
    });
  }, [maps]);

  const geom = useMemo(() => {
    const g = new THREE.PlaneGeometry(600, 720, 80, 80);
    g.rotateX(-Math.PI / 2);
    const pos = g.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const z = pos.getZ(i);
      const bump =
        Math.sin(x * 0.8 + z * 0.6) * 0.18 +
        Math.sin(x * 1.4 + z * 1.1) * 0.10 +
        (Math.random() - 0.5) * 0.12;
      pos.setY(i, bump - 42);
    }
    g.computeVertexNormals();
    return g;
  }, []);

  return (
    <mesh geometry={geom}>
      <meshStandardMaterial
        {...maps}
        color="#7a6248"
        roughness={1}
        metalness={0}
        normalScale={new THREE.Vector2(1.2, 1.2)}
        aoMapIntensity={0.6}
      />
    </mesh>
  );
}
