import { Suspense } from 'react';
import { Rig } from './Rig';
import { Atmosphere } from './Atmosphere';
import { Sky } from './Sky';
import { Ocean } from './Ocean';
import { Terrain } from './Terrain';
import { Island } from './Island';
import { Rocks } from './Rocks';
import { Corals } from './Corals';
import { Plants } from './Plants';
import { Fish } from './Fish';
import { Jellyfish } from './Jellyfish';
import { Cave } from './Cave';
import { GodRays } from './GodRays';
import { Particles } from './Particles';
import { PostFX } from './PostFX';

/** Everything inside the canvas. To add a feature: new file in this folder, render it below. */
export function World() {
  return (
    <>
      <Rig />
      <Atmosphere />
      <Sky />
      <Suspense fallback={null}>
        <Terrain />
        <Cave />
      </Suspense>
      <Island />
      <Rocks />
      <Corals />
      <Plants />
      <Fish />
      <Jellyfish />
      <Ocean />
      <GodRays />
      <Particles />
      <PostFX />
    </>
  );
}
