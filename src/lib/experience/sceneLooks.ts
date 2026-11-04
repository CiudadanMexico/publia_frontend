/**
 * Direcciones de cámara/luz por escena (dirección de arte v3, doc 02):
 * cada escena visible conduce con scrub una modulación continua del
 * universo 3D (cámara, tinte, red, apertura del prisma). Al ser scrub,
 * el recorrido inverso invierte la transformación automáticamente.
 */
import type { SceneLook } from '../three/universe';

type LookDelta = Pick<SceneLook, 'camX' | 'camY' | 'camZ' | 'tintMix' | 'network' | 'spread' | 'lightBoost'> & {
  tint: number;
};

/** Look listo para el universo: el tinte viaja como hex (sin importar three aquí). */
export type SceneLookInput = Partial<Omit<SceneLook, 'tint'>> & { tintHex: number };

/** Matiz por tono de escena (doc 01 paleta v3). */
const TONE_TINT: Record<string, { tint: number; mix: number }> = {
  cosmos: { tint: 0x0b4b85, mix: 0.35 },
  cream: { tint: 0xfff4ca, mix: 0.0 }, // el fondo claro vive en el DOM; el 3D aporta un velo cálido mínimo
  electric: { tint: 0x0951b4, mix: 0.4 },
  petrol: { tint: 0x1a2f66, mix: 0.45 },
  emerald: { tint: 0x0c614a, mix: 0.45 },
  violet: { tint: 0x4811b8, mix: 0.4 },
  graphite: { tint: 0x1a2436, mix: 0.4 },
  sun: { tint: 0xffca25, mix: 0.3 },
};

/** Recorrido de cámara por stage: del inicio al final de la escena. */
const STAGE_LOOKS: Record<string, { from: Partial<LookDelta>; to: Partial<LookDelta> }> = {
  abstract: {
    from: { camY: 0.55, camZ: 0.6, spread: 0.1, lightBoost: 1.15, network: 0, tintMix: 0.15, tint: 0x168de8 },
    to: { camY: -0.35, camZ: -0.4, spread: 0.5, lightBoost: 0.9, network: 0.25, tintMix: 0.4, tint: 0x62eaff },
  },
  enterprise: {
    from: { camX: 1.1, camY: 0.35, camZ: 0.4, spread: 0.15, lightBoost: 1.2, network: 0.3, tintMix: 0.2, tint: 0x0d1a31 },
    to: { camX: -0.5, camY: -0.25, camZ: -0.9, spread: 0.4, lightBoost: 0.95, network: 0.85, tintMix: 0.5, tint: 0xffe057 },
  },
  efficiency: {
    from: { camX: -1.2, camY: 0.2, camZ: 0.5, spread: 0.2, lightBoost: 1.25, network: 0.2, tintMix: 0.2, tint: 0x03254f },
    to: { camX: 0.9, camY: -0.4, camZ: -1.0, spread: 0.55, lightBoost: 0.9, network: 0.7, tintMix: 0.5, tint: 0x0951b4 },
  },
  explorer: {
    from: { camY: 0.6, camZ: 0.8, spread: 0.25, lightBoost: 1.2, network: 0.4, tintMix: 0.25, tint: 0x042724 },
    to: { camY: -0.5, camZ: -0.8, spread: 0.6, lightBoost: 0.9, network: 1, tintMix: 0.5, tint: 0x0c614a },
  },
  cooperative: {
    from: { camY: 0.5, camZ: 0.7, spread: 0.3, lightBoost: 1.2, network: 0.5, tintMix: 0.25, tint: 0x042724 },
    to: { camY: -0.45, camZ: -0.7, spread: 0.65, lightBoost: 0.9, network: 1, tintMix: 0.55, tint: 0x54e5a4 },
  },
  housing: {
    from: { camX: 0.9, camZ: 0.6, spread: 0.15, lightBoost: 1.15, network: 0.35, tintMix: 0.25, tint: 0x0d1420 },
    to: { camX: -0.7, camY: -0.3, camZ: -0.8, spread: 0.45, lightBoost: 0.9, network: 0.8, tintMix: 0.5, tint: 0x62eaff },
  },
  convergence: {
    from: { camY: 0.5, camZ: 0.9, spread: 0.3, lightBoost: 1.2, network: 0.4, tintMix: 0.2, tint: 0x090b25 },
    to: { camY: -0.4, camZ: -0.6, spread: 0.6, lightBoost: 1, network: 0.9, tintMix: 0.45, tint: 0x168de8 },
  },
  default: {
    from: { camY: 0.4, camZ: 0.5, spread: 0.15, lightBoost: 1.1, network: 0.3, tintMix: 0.2, tint: 0x0b1020 },
    to: { camY: -0.35, camZ: -0.6, spread: 0.5, lightBoost: 0.95, network: 0.7, tintMix: 0.4, tint: 0x168de8 },
  },
};

const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;

/** Look interpolado para una escena a un progreso dado (0-1). */
export function lookForScene(el: HTMLElement, progress: number): SceneLookInput {
  const stage = el.dataset.stage ?? 'default';
  const tone = el.dataset.tone ?? 'cosmos';
  const spec = STAGE_LOOKS[stage] ?? STAGE_LOOKS['default']!;
  const toneTint = TONE_TINT[tone] ?? TONE_TINT['cosmos']!;
  const t = Math.min(1, Math.max(0, progress));
  const from = spec.from as LookDelta;
  const to = spec.to as LookDelta;
  const pick = (key: 'camX' | 'camY' | 'camZ' | 'spread' | 'lightBoost' | 'network' | 'tintMix'): number =>
    lerp(from[key] ?? 0, to[key] ?? 0, t);
  // El tinte mezcla stage + tono de la escena.
  const tintHex = Math.round(lerp(from.tint, to.tint, t));
  return {
    camX: pick('camX'),
    camY: pick('camY'),
    camZ: pick('camZ'),
    spread: pick('spread'),
    lightBoost: pick('lightBoost'),
    network: pick('network'),
    tintMix: Math.max(pick('tintMix'), toneTint.mix * (0.4 + 0.6 * t)),
    tintHex,
  };
}
