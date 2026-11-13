import { Suspense } from 'react';
import { CameraPath }   from './CameraPath';
import { SeaFloor }     from './SeaFloor';
import { Seaweed }      from './Seaweed';
import { CoralBed }     from './CoralBed';
import { CausticLight } from './CausticLight';
import { WaterHaze }    from './WaterHaze';
import { WaterSurface } from './WaterSurface';
import { GodRays }      from './GodRays';
import { DepthFog }     from './DepthFog';

export function OceanScene() {
  return (
    <>
      <fogExp2 attach="fog" color="#0a2840" density={0.007} />

      {/* Ambient */}
      <hemisphereLight skyColor="#0099dd" groundColor="#011a2e" intensity={20} />
      <directionalLight position={[4, 55, 105]} intensity={35} color="#aae8ff" />

      {/* ── START ZONE — scattered surface light near camera entry ── */}
      {/* High overhead: simulates sunlight cone through shallow water */}
      <pointLight position={[  0,  22, 102]} intensity={80} color="#bbf0ff" distance={200} decay={1.0} />
      <pointLight position={[  4,  18,  96]} intensity={60} color="#99e8ff" distance={160} decay={1.1} />
      <pointLight position={[ -4,  18,  96]} intensity={60} color="#99e8ff" distance={160} decay={1.1} />
      {/* Scatter fill — wide low-decay so light bleeds sideways */}
      <pointLight position={[  0,   6,  98]} intensity={50} color="#77ddff" distance={180} decay={0.9} />
      <pointLight position={[  8,   4,  92]} intensity={35} color="#55ccee" distance={140} decay={1.0} />
      <pointLight position={[ -8,   4,  92]} intensity={35} color="#55ccee" distance={140} decay={1.0} />
      {/* Near-floor scatter at start */}
      <pointLight position={[  0, -22,  94]} intensity={40} color="#44bbdd" distance={120} decay={1.2} />

      {/* ── SURFACE FILL along path ── */}
      <pointLight position={[ 0, 16,  65]} intensity={65} color="#99eeff" distance={170} decay={1.4} />
      <pointLight position={[ 0, 14,  10]} intensity={55} color="#77ddee" distance={155} decay={1.4} />
      <pointLight position={[ 0, 12, -45]} intensity={44} color="#55ccdd" distance={140} decay={1.4} />

      {/* ── PATH ACCENT ── */}
      <pointLight position={[ 2, -16,  78]} intensity={52} color="#00eeff" distance={100} decay={1.8} />
      <pointLight position={[-3, -20,  48]} intensity={44} color="#00ddee" distance={92}  decay={1.8} />
      <pointLight position={[ 4, -24,  18]} intensity={38} color="#00ccdd" distance={85}  decay={1.8} />
      <pointLight position={[-2, -28, -15]} intensity={32} color="#00aabb" distance={80}  decay={1.8} />
      <pointLight position={[ 3, -32, -44]} intensity={26} color="#0088aa" distance={75}  decay={1.8} />

      {/* ── SIDE WALLS ── */}
      <pointLight position={[ 18, -34,  65]} intensity={36} color="#44ccdd" distance={90} decay={2} />
      <pointLight position={[ 19, -34,  15]} intensity={30} color="#33bbcc" distance={85} decay={2} />
      <pointLight position={[ 17, -34, -38]} intensity={26} color="#22aabb" distance={80} decay={2} />
      <pointLight position={[-18, -34,  68]} intensity={36} color="#44ccdd" distance={90} decay={2} />
      <pointLight position={[-19, -34,  12]} intensity={30} color="#33bbcc" distance={85} decay={2} />
      <pointLight position={[-17, -34, -40]} intensity={26} color="#22aabb" distance={80} decay={2} />

      <CameraPath />

      <Suspense fallback={null}>
        <SeaFloor />
      </Suspense>

      <WaterSurface />
      <GodRays />
      <DepthFog />
      <WaterHaze />
      <CausticLight />
      <Seaweed />
      <CoralBed />
    </>
  );
}
