/**
 * Orquestador de la experiencia en el navegador.
 *
 * Responsabilidades:
 * - Conectar el motor de estado con el DOM (paleta, contenido, navegación).
 * - Traducir scroll y puntero en movimiento del prisma.
 * - Emitir los eventos semánticos sin duplicarlos.
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
import { buildMailto } from '../data/site';
import type { PrimaryRoute, VisitorState } from '../lib/experience/state';

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
 * Desplaza a un ancla.
 *
 * Se espera dos frames para que el reflujo del layout (ocultar o mostrar
 * escenas al cambiar de ruta) se estabilice: si el documento cambia de altura
 * durante una animación suave, el navegador cancela el scroll y la página
 * se queda a medio camino. Por eso el reinicio usa scroll instantáneo.
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

/** Aplica el texto de la variante correspondiente a la ruta y los rasgos. */
function applySceneVariants(state: VisitorState): void {
  const sections = document.querySelectorAll<HTMLElement>('[data-scene-id]');
  sections.forEach((section) => {
    const payload = section.querySelector('script[data-role="variants"]')?.textContent;
    if (!payload) {
      return;
    }
    let parsed: {
      routes?: Record<string, { title?: string; body?: string; eyebrow?: string }>;
      traits?: Record<string, { title?: string; body?: string; eyebrow?: string }>;
    };
    try {
      parsed = JSON.parse(payload) as typeof parsed;
    } catch {
      return;
    }

    let variant = parsed.routes?.[state.primary];
    for (const trait of state.traits) {
      const traitVariant = parsed.traits?.[trait];
      if (traitVariant) {
        variant = { ...(variant ?? {}), ...traitVariant };
      }
    }
    if (!variant) {
      return;
    }

    const eyebrow = section.querySelector<HTMLElement>('[data-role="eyebrow"]');
    const title = section.querySelector<HTMLElement>('[data-role="title"]');
    const body = section.querySelector<HTMLElement>('[data-role="body"]');
    if (variant.eyebrow && eyebrow) eyebrow.textContent = variant.eyebrow;
    if (variant.title && title) title.textContent = variant.title;
    if (variant.body && body) body.textContent = variant.body;
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

function bindRouteControls(prism: { setRoute: (route: PrimaryRoute) => void } | null): void {
  const choiceButtons = document.querySelectorAll<HTMLButtonElement>('[data-route-choice]');
  choiceButtons.forEach((button) => {
    button.addEventListener('click', () => {
      const route = button.dataset['routeChoice'];
      if (route !== 'enterprise' && route !== 'efficiency') {
        return;
      }
      setPrimaryRoute(route);
      track(route === 'enterprise' ? 'hero_enterprise_selected' : 'hero_efficiency_selected');
      prism?.setRoute(route);
      window.setTimeout(() => {
        ScrollTrigger.refresh();
        const target = button.dataset['target'] ?? '#ruta-empresa';
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

  const resetButtons = document.querySelectorAll<HTMLButtonElement>('[data-route-reset]');
  resetButtons.forEach((button) => {
    button.addEventListener('click', () => {
      // Al reiniciar se vuelve al hero: se evita que el reflujo del layout
      // reactive de inmediato la ruta de exploración.
      implicitSuppressed = true;
      resetExperience();
      prism?.setRoute('unclassified');
      track('scene_viewed', { scene: 'route_reset' });
      window.setTimeout(() => {
        ScrollTrigger.refresh();
        scrollTo('#inicio', true);
      }, 160);
    });
  });
}

function bindReveals(): void {
  const targets = document.querySelectorAll<HTMLElement>('[data-reveal]');
  if (prefersReducedMotion() || !('IntersectionObserver' in window)) {
    targets.forEach((target) => target.classList.add('is-visible'));
    return;
  }
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    },
    { rootMargin: '0px 0px -12% 0px', threshold: 0.15 },
  );
  targets.forEach((target) => observer.observe(target));
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
      // El visitante ha vuelto al inicio: la ruta implícita vuelve a estar
      // disponible.
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
        if (sceneId === 'hero') {
          track('hero_entered');
          implicitSuppressed = false;
        }
        if (sceneId === 'exploracion') {
          updateImplicitRoute();
        }
      },
      onEnterBack: () => {
        if (sceneId === 'hero') {
          track('hero_entered');
          implicitSuppressed = false;
        }
      },
    });
  });

}

async function initPrism(): Promise<{
  setRoute: (route: PrimaryRoute) => void;
  setScrollProgress: (progress: number) => void;
  setPointer: (x: number, y: number) => void;
} | null> {
  const canvas = document.querySelector<HTMLCanvasElement>('[data-prism-canvas]');
  if (!canvas) {
    return null;
  }
  const layer = canvas.closest<HTMLElement>('.prism-layer');
  const reduced = prefersReducedMotion();

  // En móviles se reduce la resolución: el prisma es decorativo, no informativo.
  if (!reduced && 'ontouchstart' in window) {
    canvas.dataset['lowPower'] = 'true';
  }

  const { createPrism } = await import('../lib/three/prism');
  const prism = createPrism(canvas, { reducedMotion: reduced });
  if (!prism) {
    layer?.classList.add('is-fallback');
    return null;
  }
  layer?.classList.add('is-ready');
  prism.setRoute(getState().primary);
  return prism;
}

export async function startExperience(): Promise<void> {
  if (started) {
    return;
  }
  started = true;

  initAnalytics();
  applyDocumentState(getState());

  const prism = await initPrism();

  if (prism) {
    ScrollTrigger.create({
      trigger: document.body,
      start: 'top top',
      end: 'bottom bottom',
      scrub: 0.6,
      onUpdate: (self) => {
        prism.setScrollProgress(self.progress);
      },
    });

    const hero = document.querySelector<HTMLElement>('#inicio');
    hero?.addEventListener(
      'pointermove',
      (event) => {
        const x = (event.clientX / window.innerWidth) * 2 - 1;
        const y = -((event.clientY / window.innerHeight) * 2 - 1);
        prism.setPointer(x, y);
      },
      { passive: true },
    );
  }

  bindRouteControls(prism);
  bindReveals();
  bindSceneTracking();
  bindImplicitRouteWatcher();

  subscribe((state) => {
    applyDocumentState(state);
    applySceneVariants(state);
    applyContactContext(state);
    prism?.setRoute(state.primary);
    window.setTimeout(() => {
      ScrollTrigger.refresh();
      updateImplicitRoute();
    }, 80);
  });

  applySceneVariants(getState());
  applyContactContext(getState());
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    void startExperience();
  });
} else {
  void startExperience();
}
