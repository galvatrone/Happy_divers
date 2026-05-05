import { Suspense } from 'react';
import { CameraController } from './CameraController';
import { SurfacePlane }     from './SurfacePlane';
import { OceanSurface }     from './OceanSurface';
import { CausticsLayer }    from './CausticsLayer';
import { GodRaysLayer }     from './GodRaysLayer';
import { DepthFogLayer }    from './DepthFogLayer';
import { BubbleSystem }     from './BubbleSystem';
import { FishSchool }       from './FishSchool';

export function OceanScene() {
  return (
    <>
      {/* Camera moves in Y as scroll progresses */}
      <CameraController />

      {/* Depth fog — renders first, lowest order */}
      <DepthFogLayer />

      {/* Surface frame sequence — fullscreen background */}
      <SurfacePlane />

      {/* Ocean surface mesh — visible during transition */}
      <OceanSurface />

      {/* Caustics — additive, light on floor */}
      <CausticsLayer />

      {/* God rays — additive, shafts from above */}
      <GodRaysLayer />

      {/* GLB assets — streamed in via Suspense */}
      <Suspense fallback={null}>
        <BubbleSystem />
        <FishSchool />
      </Suspense>

      {/* Ambient light keeps GLBs from going pitch black */}
      <ambientLight intensity={0.3} color="#4fa8c0" />
      <directionalLight
        position={[2, 10, 4]}
        intensity={0.6}
        color="#7ecfce"
      />
    </>
  );
}
