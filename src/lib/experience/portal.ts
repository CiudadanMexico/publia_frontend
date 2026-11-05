/**
 * Portal prismático P0-01 (4 capas SVG superpuestas, sin texto ni logos).
 *
 * Se anima el CONTENEDOR/cada capa, nunca el nodo con pin. En la ruta por
 * scroll libre un ScrollTrigger con scrub conduce las capas al mismo ritmo
 * que el viaje de cámara (reversible); en rutas por botón, un pulso temporizado.
 * docs: `_entrega/analisis/portal-v1/pkg/LEEME.md` + `manifest.json`.
 */
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export interface PortalHandle {
  /** Scrub sobre el hero: el portal acompaña la transición por scroll (reversible). */
  bindScrub(trigger: HTMLElement): void;
  /** Pulso temporizado para transiciones por botón. */
  playTimed(duration: number): void;
  /** Agrega el pulso a una timeline existente (transición unificada botón). */
  playOnTimeline(tl: gsap.core.Timeline, duration: number): void;
  /** Estado estático (movimiento reducido) o reposo en hero. */
  reset(): void;
  kill(): void;
  /** Progreso/estado para QA. */
  debug(): { layers: number; visible: boolean };
}

const LAYERS = [
  { src: '/assets/portal/01_umbral.svg', alt: '' },
  { src: '/assets/portal/02_marco_cristalino.svg', alt: '' },
  { src: '/assets/portal/03_fragmentos.svg', alt: '' },
  { src: '/assets/portal/04_energia_destellos.svg', alt: '' },
];

/** Interpolación por tramos: p en [a,b] → de `from` a `to`. */
const seg = (p: number, a: number, b: number, from: number, to: number): number => {
  if (b <= a) return p >= b ? to : from;
  const t = Math.min(1, Math.max(0, (p - a) / (b - a)));
  return from + (to - from) * t;
};

export function createPortal(root: Document = document): PortalHandle {
  const overlay = root.querySelector<HTMLElement>('[data-portal-overlay]');
  const layers = [...(overlay?.querySelectorAll<HTMLElement>('[data-portal-layer]') ?? [])];
  let scrubTrigger: ScrollTrigger | null = null;
  let timed: gsap.core.Timeline | null = null;

  const applyProgress = (p: number): void => {
    if (!overlay || layers.length === 0) return;
    const [l0, l1, l2, l3] = layers;
    if (!l0 || !l1 || !l2 || !l3) return;
    // 01 umbral (atrás): zoom + brillo
    gsap.set(l0, {
      scale: seg(p, 0, 0.55, 0.55, 1.18),
      opacity: seg(p, 0, 0.3, 0, 0.85) * (1 - seg(p, 0.8, 1, 0, 1)),
    });
    // 02 marco cristalino (plano principal): escala + rotación suave
    gsap.set(l1, {
      scale: seg(p, 0, 0.6, 0.75, 1.3),
      rotation: seg(p, 0, 0.6, -8, 5),
      opacity: seg(p, 0.08, 0.4, 0, 1) * (1 - seg(p, 0.85, 1, 0, 1)),
    });
    // 03 fragmentos (adelante): parallax + dispersión
    gsap.set(l2, {
      x: seg(p, 0, 1, -30, 40) * 1,
      y: seg(p, 0, 1, 24, -32),
      scale: seg(p, 0.1, 0.9, 1, 1.5),
      opacity: seg(p, 0.15, 0.5, 0, 0.9) * (1 - seg(p, 0.9, 1, 0, 1)),
    });
    // 04 energía/destellos: glow sutil
    gsap.set(l3, {
      scale: seg(p, 0.2, 0.8, 0.9, 1.15),
      opacity: seg(p, 0.2, 0.45, 0, 1) * (1 - seg(p, 0.85, 1, 0, 1)),
      filter: `brightness(${1 + seg(p, 0.3, 0.7, 0, 0.5)})`,
    });
    overlay.dataset['portalProgress'] = p.toFixed(3);
  };

  return {
    bindScrub(trigger) {
      scrubTrigger?.kill();
      if (timed) { timed.kill(); timed = null; }
      applyProgress(0);
      scrubTrigger = ScrollTrigger.create({
        trigger,
        start: 'top top',
        end: '+=150%',
        scrub: 0.8,
        onUpdate: (self) => applyProgress(self.progress),
      });
    },
    playTimed(duration) {
      scrubTrigger?.kill();
      if (timed) { timed.kill(); timed = null; }
      if (!overlay || layers.length === 0) return;
      const tl = gsap.timeline({ defaults: { ease: 'power2.inOut' } });
      timed = tl;
      layers.forEach((layer, i) => {
        tl.fromTo(
          layer,
          { opacity: 0, scale: 0.8 + i * 0.08, rotation: i === 1 ? -6 : 0 },
          { opacity: i === 3 ? 0.9 : 0.95, scale: 1.12 + i * 0.05, rotation: i === 1 ? 3 : 0, duration: duration * 0.45, delay: i * 0.05 },
          0,
        );
        tl.to(layer, { opacity: 0, scale: 1.35, duration: duration * 0.4, delay: duration * 0.55 + i * 0.03 }, 0);
      });
    },
    playOnTimeline(tl, duration) {
      scrubTrigger?.kill();
      if (timed) { timed.kill(); timed = null; }
      if (!overlay || layers.length === 0) return;
      layers.forEach((layer, i) => {
        tl.fromTo(
          layer,
          { opacity: 0, scale: 0.8 + i * 0.08, rotation: i === 1 ? -6 : 0 },
          { opacity: i === 3 ? 0.9 : 0.95, scale: 1.12 + i * 0.05, rotation: i === 1 ? 3 : 0, duration: duration * 0.45, delay: i * 0.05, ease: 'power2.inOut' },
          0,
        );
        tl.to(layer, { opacity: 0, scale: 1.35, duration: duration * 0.4, ease: 'power2.inOut' }, duration * 0.55 + i * 0.03);
      });
    },
    reset() {
      scrubTrigger?.kill();
      scrubTrigger = null;
      if (timed) { timed.kill(); timed = null; }
      layers.forEach((layer) => gsap.set(layer, { opacity: 0, scale: 1, x: 0, y: 0, rotation: 0, filter: 'none' }));
      if (overlay) overlay.dataset['portalProgress'] = '0';
    },
    kill() {
      scrubTrigger?.kill();
      if (timed) timed.kill();
    },
    debug() {
      const op = layers.map((l) => Number(getComputedStyle(l).opacity));
      return { layers: layers.length, visible: op.some((o) => o > 0.05) };
    },
  };
}

export const PORTAL_LAYERS = LAYERS;
