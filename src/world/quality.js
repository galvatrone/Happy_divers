const coarse = typeof window !== 'undefined' && window.matchMedia('(pointer: coarse)').matches;
const narrow = typeof window !== 'undefined' && window.innerWidth < 820;

export const LOW = coarse || narrow;
/** Multiplier for instance counts. */
export const DENSITY = LOW ? 0.5 : 1;
/** Starting pixel ratio; DiveCanvas lowers it if the frame rate drops. */
export const DPR = Math.min(typeof window !== 'undefined' ? window.devicePixelRatio : 1, LOW ? 1.25 : 1.5);

const params = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
/** `?p=0.4` pins the dive progress (for screenshots and tuning). */
export const DEBUG_P = params && params.has('p') ? Number(params.get('p')) : null;
