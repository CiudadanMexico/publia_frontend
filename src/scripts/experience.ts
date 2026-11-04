/**
 * Orquestador de la experiencia en el navegador.
 *
 * Responsabilidades:
 * - Conectar el motor de estado con el DOM (ruta, segmentos, navegación).
 * - Alimentar el escenario 3D persistente con el estado narrativo.
 * - Delegar el movimiento a la biblioteca de efectos (GSAP + ScrollTrigger).
 * - Emitir eventos semánticos sin duplicarlos.
 *
 * Se carga como módulo y no hidrata la página: sólo el JavaScript necesario.
 */

import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

import {
  addTraits,
  applyDocumentState,
  getState,
  markSceneVisited,
  resetExperience,
  setPrimaryRoute,
  subscribe,
} from '../lib/experience/state';
import { initAnalytics, track } from '../lib/experience/events';
import { initEffects } from '../lib/animation/effects';
import { pickVariantFrom, visitorSegments } from '../lib/experience/graph';
import { createNarrative } from '../lib/experience/narrative';
import type { NarrativeHandle } from '../lib/experience/narrative';
import { buildMailto } from '../data/site';
import type { PrimaryRoute, VisitorState, VisitorTrait } from '../lib/experience/state';
import type { SceneVariant, StageState } from '../lib/experience/types';

gsap.registerPlugin(ScrollTrigger);

let started = false;

/**
 * La ruta implícita por scroll sólo se activa si el visitante no ha elegido
 * nada y no acaba de reiniciar la experiencia (al reiniciar, el reflujo del
 * layout podría volver a traer la escena de exploración a la vista).
 */
let implicitSuppressed = false;

function prefersReducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Desplaza a un ancla esperando dos frames: si el documento cambia de altura
 * durante una animación suave (al ocultar o mostrar escenas por ruta), el
 * navegador cancela el scroll y la página se queda a medio camino.
 */
function scrollTo(target: string, instant = false): void {
  const element = document.querySelector<HTMLElement>(target);
  if (!element) {
    return;
  }
  window.requestAnimationFrame(() => {
    window.requestAnimationFrame(() => {
      const top = element.getBoundingClientRect().top + window.scrollY;
      const behavior: ScrollBehavior = instant || prefersReducedMotion() ? 'instant' : 'smooth';
      window.scrollTo({ top, behavior });
    });
  });
}

/** Refleja ruta y segmentos en el documento (los usa el CSS). */
function applyDocumentContext(state: VisitorState): void {
  applyDocumentState(state);
  const root = document.documentElement;
  root.dataset['segments'] = visitorSegments(state).join(' ');
}

/**
 * Intercambia el texto de las escenas compartidas según ruta y rasgos.
 *
 * Las variantes viajan embebidas en `data-variants`; el DOM se actualiza en
 * los nodos marcados con `data-role`. No se recarga ni se reconstruye nada:
 * la misma escena cuenta otra parte del relato.
 */
function applySceneVariants(state: VisitorState): void {
  const sections = document.querySelectorAll<HTMLElement>('[data-scene-id]');
  sections.forEach((section) => {
    const payload = section.dataset['variants'];
    if (!payload) {
      return;
    }
    let variants: SceneVariant[] = [];
    try {
      variants = JSON.parse(payload) as SceneVariant[];
    } catch {
      return;
    }
    if (variants.length === 0) {
      return;
    }
    const variant = pickVariantFrom(variants, state);
    if (!variant) {
      return;
    }
    const write = (role: string, value: string | undefined): void => {
      if (!value) {
        return;
      }
      const target = section.querySelector<HTMLElement>(`[data-role="${role}"]`);
      if (target && target.textContent?.trim() !== value) {
        target.textContent = value;
      }
    };
    write('eyebrow', variant.eyebrow);
    write('title', variant.title);
    write('lead', variant.lead);
    write('body', variant.body);

    if (variant.bullets && variant.bullets.length > 0) {
      const list = section.querySelector<HTMLElement>('[data-role="bullets"]');
      if (list) {
        const items = list.querySelectorAll<HTMLElement>('.capabilities__text');
        variant.bullets.forEach((bullet, index) => {
          const item = items[index];
          if (item && item.textContent?.trim() !== bullet) {
            item.textContent = bullet;
          }
        });
      }
    }
  });
}

/**
 * El enlace de contacto se completa con el contexto de navegación (sólo ruta
 * e intereses): evita que el prospecto tenga que repetir sus elecciones. No
 * se envía ningún dato personal ni sensible.
 */
function applyContactContext(state: VisitorState): void {
  const links = document.querySelectorAll<HTMLAnchorElement>('[data-contact-cta="true"]');
  links.forEach((link) => {
    link.href = buildMailto({ route: state.primary, traits: state.traits });
  });
}

/** Estado visual del escenario 3D para la escena activa. */
function stageForScene(scene: HTMLElement, route: PrimaryRoute): StageState {
  const payload = scene.dataset['stageVariants'];
  if (payload) {
    try {
      const variants = JSON.parse(payload) as Partial<Record<PrimaryRoute, StageState>>;
      const variant = variants[route];
      if (variant) {
        return variant;
      }
    } catch {
      /* datos corruptos: se usa el estado base */
    }
  }
  const base = scene.dataset['stage'];
  return (base as StageState | undefined) ?? 'abstract';
}

interface UniverseHandleLike {
  travelTo: (world: 'hero' | 'enterprise' | 'efficiency' | 'cooperative' | 'diagnosis', options?: { duration?: number; onComplete?: () => void }) => void;
  world: () => 'hero' | 'enterprise' | 'efficiency' | 'cooperative' | 'diagnosis';
  setSceneProgress: (progress: number) => void;
  setPointer: (x: number, y: number) => void;
  setActive: (active: boolean) => void;
  setPaused: (paused: boolean) => void;
  burst: () => void;
  cardsInView: () => number;
  cameraPosition: () => [number, number, number];
  dominantTint: () => string;
  errors: () => string[];
  destroy: () => void;
}

/**
 * Universo 3D persistente: un solo lienzo con los recursos aprobados del
 * hero. Las rutas son mundos dentro del mismo universo y se recorren con
 * viajes de cámara (ver `narrative.ts`).
 */
async function initUniverse(): Promise<UniverseHandleLike | null> {
  const canvas = document.querySelector<HTMLCanvasElement>('[data-prism-canvas]');
  if (!canvas) {
    return null;
  }
  const layer = canvas.closest<HTMLElement>('.prism-layer');
  const trigger = document.querySelector<HTMLElement>('[data-hero-scene]');
  const reduced = prefersReducedMotion();

  const { createUniverse } = await import('../lib/three/universe');
  const universe = await createUniverse({ canvas, trigger, reducedMotion: reduced });
  if (!universe) {
    layer?.classList.add('is-fallback');
    return null;
  }
  layer?.classList.add('is-ready');

  const failures = universe.errors();
  canvas.dataset['universeReady'] = 'true';
  canvas.dataset['universeErrors'] = failures.join(' · ');
  canvas.dataset['cardsInView'] = String(universe.cardsInView());
  canvas.dataset['world'] = universe.world();
  canvas.dataset['camera'] = JSON.stringify(universe.cameraPosition());
  canvas.dataset['tint'] = universe.dominantTint();
  window.setTimeout(() => {
    canvas.dataset['cardsInView'] = String(universe.cardsInView());
    canvas.dataset['camera'] = JSON.stringify(universe.cameraPosition());
    canvas.dataset['tint'] = universe.dominantTint();
  }, 1500);
  if (failures.length > 0) {
    console.warn('[universe] recursos incompletos:', failures.join(' · '));
  }

  // Controles del hero (pausa, fragmentación y reinicio) sobre el universo.
  const controls = document.querySelectorAll<HTMLButtonElement>('[data-hero-control]');
  controls.forEach((button) => {
    button.addEventListener('click', () => {
      const action = button.dataset['heroControl'];
      if (action === 'burst') {
        universe.burst();
      } else if (action === 'reset') {
        universe.travelTo(universe.world(), { duration: reduced ? 0 : 1.1 });
      } else if (action === 'pause') {
        const paused = button.getAttribute('aria-pressed') === 'true';
        universe.setPaused(!paused);
        button.setAttribute('aria-pressed', String(!paused));
        button.textContent = paused ? 'Ⅱ Pausar' : '▶ Reanudar';
      }
    });
  });

  return universe;
}

function bindRouteControls(
  narrative: NarrativeHandle | null,
  universe: UniverseHandleLike | null,
): void {
  void universe;
  // Las tres rutas del hero entran como actos: viaje de cámara + contenido.
  const choiceButtons = document.querySelectorAll<HTMLButtonElement>('[data-route-choice]');
  choiceButtons.forEach((button) => {
    button.addEventListener('click', () => {
      const route = button.dataset['routeChoice'];
      if (route === 'enterprise' || route === 'efficiency') {
        narrative?.enterAct(route);
      }
    });
  });

  // El botón cooperativo del hero también es un acto.
  const cooperativeButton = document.querySelector<HTMLButtonElement>(
    '[data-hero-scene] [data-branch-trait="cooperative"]',
  );
  cooperativeButton?.addEventListener('click', () => {
    narrative?.enterAct('cooperative');
  });

  // Control «volver»: regresa al acto anterior sin reiniciar la experiencia.
  const backButton = document.querySelector<HTMLButtonElement>('[data-act-back]');
  backButton?.addEventListener('click', () => {
    narrative?.goBack();
    window.setTimeout(() => ScrollTrigger.refresh(), 200);
  });

  // Bifurcaciones narrativas dentro de las escenas (E14): rasgo + escena.
  const branchButtons = document.querySelectorAll<HTMLButtonElement>(
    '#escena-e14 [data-branch-target]',
  );
  branchButtons.forEach((button) => {
    button.addEventListener('click', () => {
      const trait = button.dataset['branchTrait'];
      const route = button.dataset['branchRoute'];
      const target = button.dataset['branchTarget'] ?? '#escena-e15';
      if (route === 'enterprise' || route === 'efficiency' || route === 'explorer') {
        setPrimaryRoute(route);
      }
      if (trait) {
        addTraits([trait as VisitorTrait]);
      }
      track('cooperative_interest', { target, trait: trait ?? 'ninguno' });
      window.setTimeout(() => {
        ScrollTrigger.refresh();
        scrollTo(target);
      }, 160);
    });
  });

  const contactLinks = document.querySelectorAll<HTMLAnchorElement>('[data-contact-cta="true"]');
  contactLinks.forEach((link) => {
    link.addEventListener('click', () => {
      track('consultation_requested', { route: getState().primary });
    });
  });

  // Formulario contextual: compone el mensaje con el contexto de navegación
  // y abre el cliente de correo. No se envía nada a ningún servidor.
  const forms = document.querySelectorAll<HTMLFormElement>('[data-context-form]');
  forms.forEach((form) => {
    const status = form.querySelector<HTMLElement>('[data-form-status]');
    form.addEventListener('submit', (event) => {
      event.preventDefault();
      const data = new FormData(form);
      const correo = String(data.get('correo') ?? '').trim();
      const nombre = String(data.get('nombre') ?? '').trim();
      const situacion = String(data.get('situacion') ?? '').trim();
      const mensaje = String(data.get('mensaje') ?? '').trim();
      const state = getState();

      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(correo)) {
        if (status) {
          status.dataset['state'] = 'error';
          status.textContent = 'Escribe un correo válido para continuar.';
        }
        return;
      }

      const rasgos = state.traits.length > 0 ? state.traits.join(', ') : 'sin rasgos';
      const cuerpo = [
        nombre ? `Nombre: ${nombre}` : null,
        `Correo: ${correo}`,
        `Situación: ${situacion}`,
        `Ruta elegida: ${state.primary}`,
        `Rasgos: ${rasgos}`,
        `Recorrido: ${state.visitedScenes.length} escenas vistas`,
        mensaje ? `Mensaje: ${mensaje}` : null,
        '',
        'Enviado desde el formulario contextual de publia.mx.',
      ]
        .filter((line): line is string => line !== null)
        .join('\n');

      const href = buildMailto({
        route: state.primary,
        traits: state.traits,
        body: cuerpo,
      });
      if (status) {
        status.dataset['state'] = 'ok';
        status.textContent = 'Mensaje preparado: se abrirá tu cliente de correo.';
      }
      track('consultation_requested', { route: state.primary, source: 'form' });
      form.dataset['mailto'] = href;
      window.location.href = href;
    });
  });

  const resetButtons = document.querySelectorAll<HTMLButtonElement>('[data-route-reset]');
  resetButtons.forEach((button) => {
    button.addEventListener('click', () => {
      implicitSuppressed = true;
      resetExperience();
      narrative?.returnToHero();
      track('scene_viewed', { scene: 'route_reset' });
      window.setTimeout(() => {
        ScrollTrigger.refresh();
      }, 160);
    });
  });
}

/**
 * Ruta implícita: se comprueba de forma determinista si la escena de
 * exploración está a la vista. No depende del estado interno de ScrollTrigger
 * (que puede consumirse durante un reflujo de layout) sino del viewport real.
 */
function updateImplicitRoute(): void {
  if (document.documentElement.dataset['scrolling'] === 'programmatic') {
    return;
  }
  const hero = document.querySelector<HTMLElement>('#inicio');
  if (hero) {
    const heroRect = hero.getBoundingClientRect();
    if (heroRect.bottom > window.innerHeight * 0.5) {
      implicitSuppressed = false;
    }
  }
  if (implicitSuppressed || getState().primary !== 'unclassified') {
    return;
  }
  const explorer = document.querySelector<HTMLElement>('[data-scene-route="explorer"]');
  if (!explorer) {
    return;
  }
  const rect = explorer.getBoundingClientRect();
  const inView = rect.top < window.innerHeight * 0.6 && rect.bottom > 0;
  if (inView) {
    setPrimaryRoute('explorer');
  }
}

let scrollTicking = false;

function bindImplicitRouteWatcher(): void {
  const onScroll = (): void => {
    if (scrollTicking) {
      return;
    }
    scrollTicking = true;
    window.requestAnimationFrame(() => {
      scrollTicking = false;
      updateImplicitRoute();
    });
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  window.setTimeout(updateImplicitRoute, 150);
}

function bindSceneTracking(): void {
  const scenes = document.querySelectorAll<HTMLElement>('[data-scene-id]');
  scenes.forEach((scene) => {
    const sceneId = scene.dataset['sceneId'];
    if (!sceneId) {
      return;
    }
    ScrollTrigger.create({
      trigger: scene,
      start: 'top 65%',
      end: 'bottom 35%',
      onEnter: () => {
        if (markSceneVisited(sceneId)) {
          track('scene_viewed', { scene: sceneId, route: getState().primary });
        }
        if (sceneId === 'E01') {
          track('hero_entered');
          implicitSuppressed = false;
        }
      },
      onEnterBack: () => {
        if (sceneId === 'E01') {
          track('hero_entered');
          implicitSuppressed = false;
        }
      },
    });
  });
}

export async function startExperience(): Promise<void> {
  if (started) {
    return;
  }
  started = true;

  initAnalytics();
  applyDocumentContext(getState());

  const reduced = prefersReducedMotion();
  const universe = await initUniverse();
  const narrative = createNarrative({ universe, reducedMotion: reduced });
  const progressByScene = new Map<string, number>();

  const applyActiveScene = (): void => {
    let activeId: string | null = null;
    let bestDistance = Number.POSITIVE_INFINITY;
    progressByScene.forEach((progress, id) => {
      const distance = Math.abs(progress - 0.5);
      if (distance < bestDistance) {
        bestDistance = distance;
        activeId = id;
      }
    });
    if (!activeId) {
      return;
    }
    const element = document.querySelector<HTMLElement>(`[data-scene-id="${activeId}"]`);
    if (!element) {
      return;
    }
    void stageForScene(element, getState().primary);
  };

  const destroyEffects = initEffects({
    reducedMotion: reduced,
    onSceneProgress: (sceneId, progress) => {
      progressByScene.set(sceneId, progress);
      if (Math.abs(progress - 0.5) < 0.12) {
        universe?.setSceneProgress(Math.abs(progress - 0.5) * 2);
      }
    },
    onGlobalProgress: () => {
      // el progreso global lo usa la biblioteca de efectos
    },
  });

  // La viñeta del hero sólo acompaña mientras el acto activo es el hero.
  const applyActMarker = (act: string): void => {
    document.documentElement.dataset['act'] = act;
    const canvas = document.querySelector<HTMLCanvasElement>('[data-prism-canvas]');
    if (canvas) {
      canvas.dataset['world'] = universe?.world() ?? 'hero';
      canvas.dataset['camera'] = JSON.stringify(universe?.cameraPosition() ?? []);
      canvas.dataset['tint'] = universe?.dominantTint() ?? '';
    }
  };
  applyActMarker('hero');

  // Parallax del puntero sobre la cámara del universo.
  const hero = document.querySelector<HTMLElement>('#inicio');
  hero?.addEventListener(
    'pointermove',
    (event) => {
      const x = (event.clientX / window.innerWidth) * 2 - 1;
      const y = -((event.clientY / window.innerHeight) * 2 - 1);
      universe?.setPointer(x, y);
    },
    { passive: true },
  );

  bindRouteControls(narrative, universe);
  bindSceneTracking();
  bindImplicitRouteWatcher();

  // Un refresco de ScrollTrigger recalcula el scroll y cancela los scrolls
  // suaves en curso: sólo se hace cuando cambia la visibilidad (ruta o
  // segmentos), nunca por cada escena visitada.
  let lastRoute = getState().primary;
  let lastSegments = visitorSegments(getState()).join(' ');
  subscribe((state) => {
    applyDocumentContext(state);
    applySceneVariants(state);
    applyContactContext(state);
    const segments = visitorSegments(state).join(' ');
    const visibilityChanged = state.primary !== lastRoute || segments !== lastSegments;
    lastRoute = state.primary;
    lastSegments = segments;
    window.setTimeout(() => {
      if (visibilityChanged) {
        ScrollTrigger.refresh();
      }
      updateImplicitRoute();
      applyActiveScene();
    }, 80);
  });

  // El acto activo también se refleja en el documento (viñeta y control volver).
  const actObserver = setInterval(() => {
    const act = narrative.currentAct();
    applyActMarker(act);
    const back = document.querySelector<HTMLElement>('[data-act-back]');
    if (back) {
      back.style.display = narrative.history().length > 1 ? 'inline-flex' : 'none';
    }
  }, 400);

  applySceneVariants(getState());
  applyContactContext(getState());
  window.setTimeout(applyActiveScene, 220);

  window.addEventListener('pagehide', () => {
    destroyEffects();
    clearInterval(actObserver);
    universe?.destroy();
  }, { once: true });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    void startExperience();
  });
} else {
  void startExperience();
}
