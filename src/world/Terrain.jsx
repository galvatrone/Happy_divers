import { useMemo } from 'react';
import { useTexture } from '@react-three/drei';
import * as THREE from 'three';
import { buildTerrainGeometry } from './terrain';
import { patchUnderwater } from './underwater';
import { registerCullable } from './instanced';
import { LOW } from './quality';
import { surface } from './textures';

/** Island, beach and the whole seabed: one sheet cut into tiles. */
export function Terrain() {
  const [map, normalMap] = useTexture([
    '/assets/textures/sand/color.jpg',
    '/assets/textures/sand/normal.jpg',
  ]);

  const tiles = useMemo(() => {
    for (const t of [map, normalMap]) {
      t.wrapS = t.wrapT = THREE.RepeatWrapping;
      t.anisotropy = 4;
    }
    map.colorSpace = THREE.SRGBColorSpace;
    const material = patchUnderwater(new THREE.MeshLambertMaterial({
      map, normalMap, vertexColors: true, normalScale: new THREE.Vector2(0.9, 0.9),
    }), { rock: surface('rock_face_03').map });
    return buildTerrainGeometry(LOW ? 2.6 : 2).map(g => registerCullable(new THREE.Mesh(g, material)));
  }, [map, normalMap]);

  return <>{tiles.map((m, i) => <primitive key={i} object={m} />)}</>;
}
