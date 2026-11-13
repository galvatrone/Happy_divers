import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { wrapEffect } from '@react-three/postprocessing';
import { Effect } from 'postprocessing';
import * as THREE from 'three';
import { sceneState } from '../../store/sceneState';

const FRAG = `
  uniform float uProgress;
  uniform float uTime;

  void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor) {
    vec3 c = inputColor.rgb;

    // Beer-Lambert: red absorbed first, green mid, blue lingers
    float d = uProgress;
    float rAbs = exp(-d * 3.8);
    float gAbs = exp(-d * 1.6);
    float bAbs = exp(-d * 0.55);

    vec3 waterTint = vec3(0.04, 0.22, 0.48) * (1.0 - bAbs) * 0.55;

    c.r *= rAbs;
    c.g *= gAbs;
    c.b *= bAbs;
    c += waterTint;

    // Caustic shimmer near surface
    float shallow = 1.0 - smoothstep(0.0, 0.4, d);
    float shimmer = sin(uv.x * 38.0 + uTime * 1.1) * sin(uv.y * 29.0 - uTime * 0.8) * 0.5 + 0.5;
    c += vec3(0.04, 0.10, 0.14) * shimmer * shallow * 0.06;

    outputColor = vec4(clamp(c, 0.0, 1.0), inputColor.a);
  }
`;

class ChromaticDepthImpl extends Effect {
  constructor() {
    super('ChromaticDepth', FRAG, {
      uniforms: new Map([
        ['uProgress', new THREE.Uniform(0)],
        ['uTime',     new THREE.Uniform(0)],
      ]),
    });
  }
}

const ChromaticDepthEffect = wrapEffect(ChromaticDepthImpl);

export function ChromaticDepth() {
  const ref = useRef();

  useFrame(({ clock }) => {
    if (!ref.current) return;
    ref.current.uniforms.get('uProgress').value = sceneState.scrollProgress;
    ref.current.uniforms.get('uTime').value     = clock.elapsedTime;
  });

  return <ChromaticDepthEffect ref={ref} />;
}
