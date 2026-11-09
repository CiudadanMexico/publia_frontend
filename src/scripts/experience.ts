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
import { lookForScene } from '../lib/experience/sceneLooks';
import { createPortal, type PortalHandle } from '../lib/experience/portal';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

import {
  addTraits,
  applyDocumentState,
  getState,
  markSceneVisited,
  resetExperience,
  setAnswer,
  setPrimaryRoute,
  subscribe,
} from '../lib/experience/state';
import { initAnalytics, track } from '../lib/experience/events';
import { initEffects } from '../lib/animation/effects';
import { pickVariantFrom, visitorSegments } from '../lib/experience/graph';
import { accentify } from '../lib/experience/accent';
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
        target.innerHTML = accentify(value);
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
  travelTo: (world: 'hero' | 'enterprise' | 'efficiency' | 'cooperative' | 'diagnosis', options?: { duration?: number; onComplete?: () => void; scrub?: { trigger: HTMLElement; start?: string; end?: string } }) => void;
  cardPulse: (index: number) => void;
  cardFocus: (index: number, on: boolean) => void;
  gesture: () => void;
  world: () => 'hero' | 'enterprise' | 'efficiency' | 'cooperative' | 'diagnosis';
  setSceneProgress: (progress: number) => void;
  setSceneLook: (look: Record<string, unknown>) => void;
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

/**
 * Scroll libre sin elegir botón = ruta C (exploración).
 *
 * Guardas innegociables: sólo cuando no hay ruta elegida, sólo desde el hero,
 * sólo con intención real del visitante (rueda, touch, teclado o arrastre de
 * barra) y nunca durante un desplazamiento programático ni una transición.
 */
function bindFreeScrollIntent(narrative: NarrativeHandle | null): void {
  let armed = true;
  const tryFreeRoute = (fromRealInput: boolean): void => {
    if (!armed) return;
    const root = document.documentElement;
    if (!fromRealInput && root.dataset['scrolling'] === 'programmatic') return;
    if (!fromRealInput) {
      // Un evento scroll suelto sólo cuenta como intención si pasó tiempo
      // desde el último desplazamiento programático (evita rezagos).
      const w = window as unknown as { __publiaLastProgrammaticScroll?: number };
      const last = w.__publiaLastProgrammaticScroll ?? 0;
      if (performance.now() - last < 500) return;
    }
    const state = getState();
    if (state.primary !== 'unclassified' || state.transitioning) return;
    if (narrative?.currentAct() !== 'hero') return;
    if (window.scrollY > window.innerHeight * 0.8) return;
    armed = false;
    narrative?.enterFreeRoute();
  };
  window.addEventListener('wheel', () => tryFreeRoute(true), { passive: true });
  window.addEventListener('touchmove', () => tryFreeRoute(true), { passive: true });
  window.addEventListener('keydown', (event) => {
    const keys = ['ArrowDown', 'ArrowUp', 'PageDown', 'PageUp', ' ', 'Home', 'End'];
    if (keys.includes(event.key)) tryFreeRoute(true);
  });
  let lastSeenY = window.scrollY;
  window.addEventListener('scroll', () => {
    const y = window.scrollY;
    const delta = Math.abs(y - lastSeenY);
    lastSeenY = y;
    if (delta < 2) return; // scroll espurio (refresh/pin) sin intención real
    tryFreeRoute(false);
  }, { passive: true });
}

/** Las ocho tarjetas del hero responden a hover, foco y tap (nivel 2). */
/**
 * Demos interactivas D3: cada decisión cambia el contenido Y el entorno 3D.
 */
/** Carga diferida de un binder cuando su escena entra al viewport. */
function lazyBind(selector: string, load: () => Promise<void>): void {
  const el = document.querySelector<HTMLElement>(selector);
  if (!el) {
    void load();
    return;
  }
  // Dispara cuando la escena tiene caja y entra en el viewport ampliado.
  // Fallback de scroll/estado por si IntersectionObserver no_recalcula con
  // ancestros display:none (escenas de ruta inactiva).
  let done = false;
  const maybe = (): void => {
    if (done) return;
    const r = el.getBoundingClientRect();
    const secId = el.closest('section[id]')?.id.replace(/^escena-/, '').toUpperCase() ?? '';
    const visited = secId !== '' && getState().visitedScenes.includes(secId);
    if ((r.height > 0 && r.top < window.innerHeight * 1.8 && r.bottom > -window.innerHeight * 0.8) || visited) {
      done = true;
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('publia:state', maybe);
      void load();
    }
  };
  const onScroll = (): void => {
    if (scrollTick) return;
    scrollTick = requestAnimationFrame(() => { scrollTick = 0; maybe(); });
  };
  let scrollTick = 0;
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('publia:state', maybe);
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver(
      (entries) => {
        if (done) return;
        if (entries.some((e) => e.isIntersecting)) {
          done = true;
          io.disconnect();
          window.removeEventListener('scroll', onScroll);
          window.removeEventListener('publia:state', maybe);
          void load();
        }
      },
      { rootMargin: '80% 0px' },
    );
    io.observe(el);
  }
  maybe();
}

function bindDemos(universe: UniverseHandleLike | null): void {
  // Empresa — capas de infraestructura
  document.querySelectorAll<HTMLButtonElement>('[data-infra-layer]').forEach((chip) => {
    chip.addEventListener('click', () => {
      const wrap = chip.closest('[data-demo="infra"]');
      wrap?.querySelectorAll('[data-infra-layer]').forEach((c) => c.setAttribute('aria-pressed', 'false'));
      chip.setAttribute('aria-pressed', 'true');
      const detail = wrap?.querySelector('[data-infra-detail]');
      const text = chip.dataset['infraDetail'] ?? chip.textContent ?? '';
      const texts: Record<string, string> = {
        datos: 'Tus sistemas actuales se conectan con acceso controlado: quién ve qué, y cuándo. No tienes que empezar de cero.',
        agentes: 'Agentes conectados a tareas concretas y supervisables: clasifican, responden borradores, registran seguimiento. Tú decides.',
        operacion: 'Tu equipo mantiene el control de las decisiones. La infraestructura registra, propone y avisa; no decide por ti.',
      };
      if (detail) detail.textContent = texts[chip.dataset['infraLayer'] ?? ''] ?? text;
      universe?.setSceneLook({ network: 0.95, spread: 0.35, lightBoost: 1.15, tintMix: 0.5, camX: 0.55, camY: -0.2, camZ: -0.45 } as Record<string, unknown>);
      universe?.gesture();
      track('demo_infra_capa', { capa: chip.dataset['infraLayer'] ?? '' });
    });
  });

  // Eficiencia — flujo consulta → agente → persona → seguimiento
  document.querySelectorAll<HTMLButtonElement>('[data-flow-focus]').forEach((chip) => {
    chip.addEventListener('click', () => {
      const wrap = chip.closest('[data-demo="flow"]');
      wrap?.querySelectorAll('[data-flow-focus]').forEach((c) => c.setAttribute('aria-pressed', 'false'));
      chip.setAttribute('aria-pressed', 'true');
      const result = wrap?.querySelector('[data-flow-result]');
      if (result) result.textContent = chip.dataset['flowResult'] ?? '';
      setAnswer('foco', chip.dataset['flowFocus'] ?? '');
      // el punto viaja por las etapas
      const stages = [...(wrap?.querySelectorAll('[data-flow-stage]') ?? [])] as HTMLElement[];
      const dot = wrap?.querySelector('[data-flow-dot]') as HTMLElement | null;
      stages.forEach((st) => st.classList.remove('is-active'));
      if (dot) {
        const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        gsap.killTweensOf(dot);
        gsap.set(dot, { opacity: 1, left: 0 });
        const tl = gsap.timeline({ defaults: { duration: reduced ? 0 : 0.55, ease: 'power1.inOut' } });
        stages.forEach((st, i) => {
          const target = st.offsetLeft + st.offsetWidth / 2;
          tl.to(dot, { left: target }, i * 0.55);
          tl.add(() => st.classList.add('is-active'), i * 0.55);
        });
        tl.to(dot, { opacity: 0 });
      }
      universe?.setSceneLook({ network: 0.85, spread: 0.5, lightBoost: 1.1, tintMix: 0.45, camX: -0.5, camY: 0.25, camZ: -0.5 } as Record<string, unknown>);
      universe?.cardPulse(2);
      track('demo_flujo_foco', { foco: chip.dataset['flowFocus'] ?? '' });
    });
  });

  // Eficiencia — ejecutar la demostración por las 4 etapas (P0-02, paquete 7 mundos)
  document.querySelectorAll<HTMLElement>('[data-demo="flow"]').forEach((wrap) => {
    const runBtn = wrap.querySelector<HTMLButtonElement>('[data-flow-run]');
    const resetBtn = wrap.querySelector<HTMLButtonElement>('[data-flow-reset]');
    const feed = wrap.querySelector<HTMLElement>('[data-flow-feed]');
    const count = wrap.querySelector<HTMLElement>('[data-flow-count]');
    const stages = [...wrap.querySelectorAll<HTMLElement>('[data-flow-stage]')];
    const chip = () => wrap.querySelector<HTMLButtonElement>('[data-flow-focus][aria-pressed="true"]');
    let running = false;
    let timers: number[] = [];
    const clear = (): void => { timers.forEach(window.clearTimeout); timers = []; };
    const stageLines = ['Llega la consulta al canal elegido.', 'El agente la clasifica y prepara una propuesta.', 'Una persona revisa y decide.', 'Queda registro y seguimiento visible.'];
    const reset = (): void => {
      clear();
      running = false;
      if (runBtn) runBtn.disabled = false;
      stages.forEach((st) => st.classList.remove('is-active'));
      if (count) count.textContent = '00';
      if (feed) feed.textContent = 'Listo para otra simulación. Elige un caso y ejecuta.';
    };
    runBtn?.addEventListener('click', () => {
      if (running) return;
      running = true;
      if (runBtn) runBtn.disabled = true;
      clear();
      stages.forEach((st) => st.classList.remove('is-active'));
      const c = chip();
      const foco = c?.dataset['flowFocus'] ?? '';
      if (feed) feed.textContent = 'Iniciando simulación…';
      const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      stages.forEach((st, i) => {
        timers.push(window.setTimeout(() => {
          stages.forEach((x) => x.classList.remove('is-active'));
          st.classList.add('is-active');
          if (feed) feed.textContent = stageLines[i] ?? '';
          if (count) count.textContent = String(i + 1).padStart(2, '0');
          universe?.cardPulse(i);
        }, reduced ? 0 : i * 900));
      });
      timers.push(window.setTimeout(() => {
        running = false;
        if (runBtn) runBtn.disabled = false;
        if (feed) feed.textContent = 'Simulación completada: consulta atendida con revisión humana y seguimiento registrado.';
        track('demo_flujo_run', { foco });
      }, reduced ? 0 : stages.length * 900));
      track('demo_flujo_run', { foco });
    });
    resetBtn?.addEventListener('click', reset);
  });

  // Cooperativa — GeoNodos: el scroll enciende conexiones, el clic explica
  document.querySelectorAll<HTMLElement>('[data-demo="geo"]').forEach((wrap) => {
    ScrollTrigger.create({
      trigger: wrap,
      start: 'top 85%',
      end: 'bottom 35%',
      scrub: 0.8,
      onUpdate: (self) => {
        const step = self.progress > 0.75 ? 3 : self.progress > 0.4 ? 2 : self.progress > 0.1 ? 1 : 0;
        wrap.dataset['geoProgress'] = String(step);
        if (step >= 2) universe?.setSceneLook({ network: 1, spread: 0.5, tintMix: 0.5 } as Record<string, unknown>);
      },
    });
    wrap.querySelectorAll<SVGGElement>('[data-geo-node]').forEach((node) => {
      const activate = (): void => {
        wrap.querySelectorAll('[data-geo-node]').forEach((n) => n.classList.remove('is-active'));
        node.classList.add('is-active');
        const detail = wrap.querySelector('[data-geo-detail]');
        if (detail) detail.textContent = node.dataset['geoDetail'] ?? '';
        universe?.setSceneLook({ network: 1, spread: 0.6, lightBoost: 1.2, tintMix: 0.55, camY: 0.45, camZ: 0.6 } as Record<string, unknown>);
        universe?.gesture();
        track('demo_geonodo', { nodo: node.dataset['geoNode'] ?? '' });
      };
      node.addEventListener('click', activate);
      node.addEventListener('keydown', (event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          activate();
        }
      });
    });
  });
}

/**
 * Modulación 3D continua por escena (v3): cada escena visible conduce con
 * scrub su propio «look» (cámara, tinte, red, apertura). Al ser scrub, el
 * recorrido inverso invierte la transformación sin regenerar recursos.
 */
function bindSceneLooks(universe: UniverseHandleLike | null): ScrollTrigger[] {
  if (!universe) return [];
  const triggers: ScrollTrigger[] = [];
  document.querySelectorAll<HTMLElement>('[data-scene-id]').forEach((el) => {
    if (el.closest('[data-scene-route]') === null && el.dataset['sceneRoute'] === undefined) return;
    triggers.push(
      ScrollTrigger.create({
        trigger: el,
        start: 'top 85%',
        end: 'bottom 30%',
        scrub: 0.8,
        onUpdate: (self) => {
          universe.setSceneLook(lookForScene(el, self.progress) as Record<string, unknown>);
        },
      }),
    );
  });
  return triggers;
}

function bindHeroCards(universe: UniverseHandleLike | null): void {
  const chips = document.querySelectorAll<HTMLButtonElement>('[data-card-index]');
  const canvas = document.querySelector<HTMLCanvasElement>('[data-prism-canvas]');
  chips.forEach((chip) => {
    const index = Number(chip.dataset['cardIndex'] ?? -1);
    const info = document.getElementById(`hero-card-info-${index}`);
    const show = (): void => {
      chips.forEach((other) => {
        const otherIndex = Number(other.dataset['cardIndex'] ?? -1);
        const otherInfo = document.getElementById(`hero-card-info-${otherIndex}`);
        if (other !== chip) {
          otherInfo?.setAttribute('hidden', '');
          other.setAttribute('aria-expanded', 'false');
        }
      });
      info?.removeAttribute('hidden');
      chip.setAttribute('aria-expanded', 'true');
      universe?.cardFocus(index, true);
      universe?.cardPulse(index);
      if (canvas) canvas.dataset['focusedCard'] = String(index);
    };
    const hide = (): void => {
      if (chip.getAttribute('aria-expanded') !== 'true') {
        info?.setAttribute('hidden', '');
      }
      universe?.cardFocus(index, false);
    };
    chip.addEventListener('mouseenter', show);
    chip.addEventListener('focus', show);
    chip.addEventListener('click', () => {
      const wasOpen = chip.getAttribute('aria-expanded') === 'true';
      chips.forEach((other) => {
        const otherIndex = Number(other.dataset['cardIndex'] ?? -1);
        document.getElementById(`hero-card-info-${otherIndex}`)?.setAttribute('hidden', '');
        other.setAttribute('aria-expanded', 'false');
        universe?.cardFocus(otherIndex, false);
      });
      if (wasOpen) {
        info?.setAttribute('hidden', '');
        chip.setAttribute('aria-expanded', 'false');
        universe?.cardFocus(index, false);
      } else {
        show();
      }
    });
    chip.addEventListener('mouseleave', hide);
    chip.addEventListener('blur', hide);
  });
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
  // Portal prismático P0-01 (se crea antes que la narrativa para unificar transiciones)
  const portal: PortalHandle = createPortal();
  const narrative = createNarrative({ universe, reducedMotion: reduced, portal });
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

  const reducedMotion = reduced;
  const sceneLookTriggers = bindSceneLooks(universe);
  bindDemos(universe);
  lazyBind('[data-demo="ecosystem"]', () => import('../lib/experience/ecosystem').then((m) => m.bindEcosystem(universe)));
  // Bloques 7M-B: binders en chunks propios, cargados sólo al acercarse a su escena
  lazyBind('[data-demo="red"]', () => import('../lib/experience/red').then((m) => m.bindRed(universe)));
  lazyBind('[data-demo="infra2"]', () => import('../lib/experience/infra').then((m) => m.bindInfra(universe)));
  lazyBind('[data-demo="personas"]', () => import('../lib/experience/personas').then((m) => m.bindPersonas()));
  lazyBind('[data-demo="memberships"]', () => import('../lib/experience/memberships').then((m) => m.bindMemberships()));
  lazyBind('[data-recommendation]', () => import('../lib/experience/cierre').then((m) => m.bindCierre(universe)));
  lazyBind('[data-demo="ecosystem"]', () => import('../lib/experience/postHero').then((m) => m.bindPostHero(universe)));
  lazyBind('[data-recommendation]', () => import('../lib/experience/postHero').then((m) => m.bindPostHero(universe)));
  lazyBind('[data-demo="housing"]', () => import('../lib/experience/housing').then((m) => m.bindHousing()));
  lazyBind('[data-demo="marketing"]', () => import('../lib/experience/marketing').then((m) => m.bindMarketing()));
  let lastPortalKey = '';
  const drivePortal = (state: ReturnType<typeof getState>): void => {
    const heroElement = document.querySelector<HTMLElement>('[data-hero-scene]');
    const key = `${state.primary}:${state.origin}`;
    if (key === lastPortalKey) return;
    lastPortalKey = key;
    if (reducedMotion || state.primary === 'unclassified') {
      portal.reset();
      return;
    }
    // Ojo: subscribe dispara ANTES de que el acto cambie en la pila; el
    // control por acto (reset al volver al hero) vive en actObserver.
    if (state.origin === 'scroll' && heroElement) {
      portal.bindScrub(heroElement);
    } else {
      portal.playTimed(reducedMotion ? 0 : 1.9);
    }
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
  bindFreeScrollIntent(narrative);
  bindHeroCards(universe);

  // Un refresco de ScrollTrigger recalcula el scroll y cancela los scrolls
  // suaves en curso: sólo se hace cuando cambia la visibilidad (ruta o
  // segmentos), nunca por cada escena visitada.
  let lastRoute = getState().primary;
  let lastSegments = visitorSegments(getState()).join(' ');
  subscribe((state) => {
    drivePortal(state);
    applyDocumentContext(state);
    window.dispatchEvent(new CustomEvent('publia:state'));
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
    if (act === 'hero') portal.reset();
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
