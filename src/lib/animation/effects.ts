/**
 * Biblioteca de efectos (brief §5).
 *
 * Todos los efectos son reutilizables, declarativos (se activan con
 * atributos `data-*`) y reversibles: al destruirse el contexto se matan los
 * ScrollTrigger y las tweens creados aquí.
 *
 * Con `prefers-reduced-motion` los efectos se limitan a mostrar el contenido
 * sin transformaciones ni desplazamientobloqueado.
 */

import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export interface EffectsOptions {
  reducedMotion: boolean;
  /** Notifica el progreso de la escena activa (0-1) para el escenario 3D. */
  onSceneProgress?: (sceneId: string, progress: number) => void;
  /** Notifica el progreso global del recorrido. */
  onGlobalProgress?: (progress: number) => void;
}

/** Envuelve cada palabra en una máscara para el revelado tipográfico. */
function splitWords(element: HTMLElement): HTMLElement[] {
  const words = element.textContent?.split(/\s+/).filter(Boolean) ?? [];
  element.textContent = '';
  const masks: HTMLElement[] = [];
  words.forEach((word, index) => {
    const mask = document.createElement('span');
    mask.className = 'mask-line';
    const inner = document.createElement('span');
    inner.className = 'mask-line__inner';
    inner.textContent = word;
    mask.appendChild(inner);
    element.appendChild(mask);
    if (index < words.length - 1) {
      element.appendChild(document.createTextNode(' '));
    }
    masks.push(mask);
  });
  return masks;
}

/** Revelado simple de bloques. */
function bindReveals(reducedMotion: boolean): void {
  const items = gsap.utils.toArray<HTMLElement>('[data-reveal]');
  if (reducedMotion) {
    gsap.set(items, { opacity: 1, y: 0, clearProps: 'transform' });
    return;
  }
  items.forEach((item) => {
    const group = item.closest('[data-reveal-group]');
    const index = Number.parseInt(item.style.getPropertyValue('--index') || '0', 10);
    gsap.fromTo(
      item,
      { opacity: 0, y: 26 },
      {
        opacity: 1,
        y: 0,
        duration: 0.75,
        delay: Math.min(0.32, index * 0.08),
        ease: 'power2.out',
        scrollTrigger: {
          trigger: group ?? item,
          start: 'top 82%',
          once: true,
        },
      },
    );
  });
}

/** Revelado tipográfico con máscara. */
function bindLineReveals(reducedMotion: boolean): void {
  const titles = gsap.utils.toArray<HTMLElement>('[data-reveal="lines"]');
  titles.forEach((title) => {
    const masks = splitWords(title);
    if (reducedMotion) {
      gsap.set(masks, { yPercent: 0 });
      return;
    }
    gsap.fromTo(
      masks.map((mask) => mask.querySelector('.mask-line__inner')),
      { yPercent: 110 },
      {
        yPercent: 0,
        duration: 0.9,
        ease: 'power3.out',
        stagger: 0.035,
        scrollTrigger: {
          trigger: title,
          start: 'top 85%',
          once: true,
        },
      },
    );
  });
}

/** Parallax multicapa ligado al scroll. */
function bindParallax(reducedMotion: boolean): void {
  if (reducedMotion) {
    return;
  }
  gsap.utils.toArray<HTMLElement>('[data-parallax]').forEach((element) => {
    const depth = Number.parseFloat(element.dataset['parallax'] ?? '0.15');
    gsap.to(element, {
      yPercent: depth * 100,
      ease: 'none',
      scrollTrigger: {
        trigger: element,
        start: 'top bottom',
        end: 'bottom top',
        scrub: 0.6,
      },
    });
  });
}

/** Profundidad de campo simulada: escala y desenfoque por capas. */
function bindDepth(reducedMotion: boolean): void {
  if (reducedMotion) {
    return;
  }
  gsap.utils.toArray<HTMLElement>('[data-depth]').forEach((element) => {
    const amount = Number.parseFloat(element.dataset['depth'] ?? '0.5');
    gsap.fromTo(
      element,
      { scale: 1 + amount * 0.06, filter: `blur(${amount * 2.4}px)` },
      {
        scale: 1,
        filter: 'blur(0px)',
        ease: 'none',
        scrollTrigger: {
          trigger: element,
          start: 'top bottom',
          end: 'center center',
          scrub: 0.8,
        },
      },
    );
  });
}

/** Contadores: sólo para datos verificables (reparto de Housing). */
function bindCounters(reducedMotion: boolean): void {
  gsap.utils.toArray<HTMLElement>('[data-count]').forEach((element) => {
    const target = Number.parseFloat(element.dataset['count'] ?? '0');
    const suffix = element.dataset['countSuffix'] ?? '';
    if (reducedMotion || Number.isNaN(target)) {
      element.textContent = `${target}${suffix}`;
      return;
    }
    const state = { value: 0 };
    gsap.to(state, {
      value: target,
      duration: 1.4,
      ease: 'power2.out',
      scrollTrigger: { trigger: element, start: 'top 88%', once: true },
      onUpdate: () => {
        element.textContent = `${Math.round(state.value)}${suffix}`;
      },
    });
  });
}

/** Trazado animado de los diagramas SVG. */
function bindDiagrams(reducedMotion: boolean): void {
  const lines = gsap.utils.toArray<SVGLineElement>('.network__link');
  lines.forEach((line) => {
    const length = line.getTotalLength?.() ?? 0;
    if (length === 0) {
      return;
    }
    line.style.strokeDasharray = `${length}`;
    if (reducedMotion) {
      line.style.strokeDashoffset = '0';
      return;
    }
    gsap.fromTo(
      line,
      { strokeDashoffset: length },
      {
        strokeDashoffset: 0,
        duration: 1.1,
        ease: 'power2.inOut',
        delay: Number.parseFloat(line.style.getPropertyValue('--delay') || '0'),
        scrollTrigger: { trigger: line, start: 'top 85%', once: true },
      },
    );
  });
}

/** Progreso por escena: alimenta al escenario 3D y la paleta. */
function bindSceneProgress(
  options: EffectsOptions,
): void {
  const scenes = gsap.utils.toArray<HTMLElement>('[data-scene-id]');
  scenes.forEach((scene) => {
    ScrollTrigger.create({
      trigger: scene,
      start: 'top bottom',
      end: 'bottom top',
      onUpdate: (self) => {
        const id = scene.dataset['sceneId'];
        if (id) {
          options.onSceneProgress?.(id, self.progress);
        }
      },
    });
  });

  ScrollTrigger.create({
    trigger: document.documentElement,
    start: 'top top',
    end: 'bottom bottom',
    onUpdate: (self) => {
      options.onGlobalProgress?.(self.progress);
    },
  });
}

/** Sección horizontal controlada por desplazamiento vertical. */
function bindHorizontal(reducedMotion: boolean): void {
  if (reducedMotion) {
    return;
  }
  gsap.utils.toArray<HTMLElement>('[data-horizontal]').forEach((track) => {
    const distance = track.scrollWidth - track.clientWidth;
    if (distance <= 0) {
      return;
    }
    gsap.to(track, {
      x: -distance,
      ease: 'none',
      scrollTrigger: {
        trigger: track,
        start: 'top top',
        end: () => `+=${distance}`,
        scrub: 0.8,
        pin: true,
        anticipatePin: 1,
        invalidateOnRefresh: true,
      },
    });
  });
}

/** Escenas ancladas (pinning) para recorridos que no deben salir de pantalla. */
function bindPins(reducedMotion: boolean): void {
  if (reducedMotion) {
    return;
  }
  gsap.utils.toArray<HTMLElement>('[data-pin]').forEach((element) => {
    const duration = Number.parseFloat(element.dataset['pin'] ?? '1');
    ScrollTrigger.create({
      trigger: element,
      start: 'top top',
      end: () => `+=${window.innerHeight * duration}`,
      pin: true,
      pinSpacing: true,
      anticipatePin: 1,
    });
  });
}

/**
 * Inicializa la biblioteca. Devuelve la función de limpieza: mata todos los
 * ScrollTrigger y tweens creados por este contexto.
 */
export function initEffects(options: EffectsOptions): () => void {
  // El contexto se crea sin self-reference: `gsap.context` ejecuta la función
  // de forma síncrona y una referencia a `context` dentro de ella dispararía
  // un error de zona temporal muerta.
  const context = gsap.context(() => {
    bindReveals(options.reducedMotion);
    bindLineReveals(options.reducedMotion);
    bindParallax(options.reducedMotion);
    bindDepth(options.reducedMotion);
    bindCounters(options.reducedMotion);
    bindDiagrams(options.reducedMotion);
    bindSceneProgress(options);
    bindHorizontal(options.reducedMotion);
    bindPins(options.reducedMotion);
  });

  // Las medidas cambian cuando se ocultan escenas por ruta: hay que recalcular.
  const refresh = (): void => ScrollTrigger.refresh();
  window.addEventListener('resize', refresh, { passive: true });
  window.setTimeout(refresh, 120);

  return () => {
    window.removeEventListener('resize', refresh);
    context.revert();
  };
}
