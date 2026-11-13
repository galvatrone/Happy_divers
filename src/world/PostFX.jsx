import { EffectComposer, Bloom, Vignette, ToneMapping } from '@react-three/postprocessing';
import { ToneMappingMode } from 'postprocessing';
import { LOW } from './quality';

/** Bloom makes the sun glitter and the bioluminescence glow; ACES keeps the highlights soft. */
export function PostFX() {
  return (
    <EffectComposer multisampling={0} enableNormalPass={false}>
      <Bloom mipmapBlur intensity={LOW ? 0.5 : 0.7} luminanceThreshold={0.9} luminanceSmoothing={0.25} radius={0.7} />
      <Vignette offset={0.25} darkness={0.6} />
      <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
    </EffectComposer>
  );
}
