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
  applyDocumentState,
  getState,
  markSceneVisited,
  resetExperience,
  setPrimaryRoute,
  subscribe,
} from '../lib/experience/state';
import { initAnalytics, track } from '../lib/experience/events';
import { initEffects } from '../lib/animation/effects';
import { visitorSegments } from '../lib/experience/graph';
import { buildMailto } from '../data/site';
import type { PrimaryRoute, VisitorState, VisitorTrait } from '../lib/experience/state';
import type { StageState } from '../lib/experience/types';

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

interface StageHandle {
  setStage: (state: StageState) => void;
  setSceneProgress: (progress: number) => void;
  setScrollProgress: (progress: number) => void;
  setPointer: (x: number, y: number) => void;
}

async function initStage(): Promise<StageHandle | null> {
  const canvas = document.querySelector<HTMLCanvasElement>('[data-prism-canvas]');
  if (!canvas) {
    return null;
  }
  const layer = canvas.closest<HTMLElement>('.prism-layer');
  const reduced = prefersReducedMotion();

  const { createStage } = await import('../lib/three/stage');
  const stage = createStage({ canvas, reducedMotion: reduced });
  if (!stage) {
    layer?.classList.add('is-fallback');
    return null;
  }
  layer?.classList.add('is-ready');
  return stage;
}

function bindRouteControls(stage: StageHandle | null): void {
  const choiceButtons = document.querySelectorAll<HTMLButtonElement>('[data-route-choice]');
  choiceButtons.forEach((button) => {
    button.addEventListener('click', () => {
      const route = button.dataset['routeChoice'];
      if (route !== 'enterprise' && route !== 'efficiency') {
        return;
      }
      setPrimaryRoute(route);
      track(route === 'enterprise' ? 'hero_enterprise_selected' : 'hero_efficiency_selected');
      window.setTimeout(() => {
        ScrollTrigger.refresh();
        scrollTo(button.dataset['target'] ?? '#escena-e03');
      }, 160);
    });
  });

  // Bifurcaciones narrativas (E14): eligen un rasgo y llevan a su escena.
  const branchButtons = document.querySelectorAll<HTMLButtonElement>('[data-branch-target]');
  branchButtons.forEach((button) => {
    button.addEventListener('click', () => {
      const trait = button.dataset['branchTrait'];
      const route = button.dataset['branchRoute'];
      const target = button.dataset['branchTarget'] ?? '#escena-e15';
      if (route === 'enterprise' || route === 'efficiency' || route === 'explorer') {
        setPrimaryRoute(route);
      }
      if (trait) {
        // Los rasgos se añaden desde el estado del visitante.
        void import('../lib/experience/state').then((module) =>
          module.addTraits([trait as VisitorTrait]),
        );
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
      track('scene_viewed', { scene: 'route_reset' });
      window.setTimeout(() => {
        ScrollTrigger.refresh();
        scrollTo('#inicio', true);
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

  const stage = await initStage();
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
    stage?.setStage(stageForScene(element, getState().primary));
  };

  const destroyEffects = initEffects({
    reducedMotion: prefersReducedMotion(),
    onSceneProgress: (sceneId, progress) => {
      progressByScene.set(sceneId, progress);
      const element = document.querySelector<HTMLElement>(`[data-scene-id="${sceneId}"]`);
      if (element && Math.abs(progress - 0.5) < 0.12) {
        stage?.setSceneProgress(Math.abs(progress - 0.5) * 2);
        stage?.setStage(stageForScene(element, getState().primary));
      }
    },
    onGlobalProgress: (progress) => {
      stage?.setScrollProgress(progress);
    },
  });

  if (stage) {
    const hero = document.querySelector<HTMLElement>('#inicio');
    hero?.addEventListener(
      'pointermove',
      (event) => {
        const x = (event.clientX / window.innerWidth) * 2 - 1;
        const y = -((event.clientY / window.innerHeight) * 2 - 1);
        stage.setPointer(x, y);
      },
      { passive: true },
    );
  }

  bindRouteControls(stage);
  bindSceneTracking();
  bindImplicitRouteWatcher();

  // Un refresco de ScrollTrigger recalcula el scroll y cancela los scrolls
  // suaves en curso: sólo se hace cuando cambia la visibilidad (ruta o
  // segmentos), nunca por cada escena visitada.
  let lastRoute = getState().primary;
  let lastSegments = visitorSegments(getState()).join(' ');
  subscribe((state) => {
    applyDocumentContext(state);
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

  applyContactContext(getState());
  window.setTimeout(applyActiveScene, 220);

  window.addEventListener('pagehide', () => {
    destroyEffects();
  }, { once: true });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    void startExperience();
  });
} else {
  void startExperience();
}
