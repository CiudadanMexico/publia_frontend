/**
 * Controlador narrativo (fase 2): actos conectados dentro del mismo universo 3D.
 *
 * Cada ruta es un «acto» con su mundo 3D y su escena de contenido. Entrar a
 * un acto lanza el viaje de cámara del universo y, en paralelo, el scroll
 * suave hacia la escena; volver usa el historial para regresar al acto
 * anterior sin reiniciar la experiencia.
 *
 * Las respuestas del visitante viven en `state` (ruta y rasgos), así que las
 * escenas posteriores pueden adaptar su contenido sin preguntar de nuevo.
 */
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

import type { UniverseHandle, UniverseWorld } from '../three/universe';
import type { PrimaryRoute, VisitorTrait } from './state';
import { addTraits, getState, setPrimaryRoute, setTransitioning } from './state';
import { track } from './events';

export type ActId = 'hero' | 'enterprise' | 'efficiency' | 'cooperative';

export interface Act {
  id: ActId;
  world: UniverseWorld;
  route: PrimaryRoute;
  traits?: VisitorTrait[];
  /** Ancla de la escena de contenido. */
  anchor: string;
  event: string;
}

export const ACTS: Record<Exclude<ActId, 'hero'>, Act> = {
  enterprise: {
    id: 'enterprise',
    world: 'enterprise',
    route: 'enterprise',
    anchor: '#escena-e03',
    event: 'hero_enterprise_selected',
  },
  efficiency: {
    id: 'efficiency',
    world: 'efficiency',
    route: 'efficiency',
    anchor: '#escena-e07',
    event: 'hero_efficiency_selected',
  },
  cooperative: {
    id: 'cooperative',
    world: 'cooperative',
    route: 'explorer',
    traits: ['cooperative'],
    anchor: '#escena-e15',
    event: 'hero_cooperative_selected',
  },
};

const HERO_ACT: Act = {
  id: 'hero',
  world: 'hero',
  route: 'unclassified',
  anchor: '#inicio',
  event: 'hero_returned',
};

interface NarrativeOptions {
  universe: UniverseHandle | null;
  reducedMotion: boolean;
  portal?: { playOnTimeline(tl: gsap.core.Timeline, duration: number): void } | null;
}

export interface NarrativeHandle {
  /** Entra a un acto: viaje de cámara + scroll + estado. */
  enterAct(act: ActId): void;
  /** 7M-F §5.12 / 7M-G §1: cancela el pin del hero si se elige ruta durante la animación. */
  cancelHeroPin(): void;
  /** Fin absoluto del tramo pineado (+1); el salto por teclado usa este valor. */
  heroPinEnd(): number | null;
  heroPinScreens(): number;
  /**
   * Ruta C por scroll silencioso: el visitante desplaza la página desde el
   * hero SIN elegir botón. El viaje de cámara lo conduce el propio scroll
   * (pin + scrub), no un desplazamiento programático.
   */
  enterFreeRoute(): void;
  /** Vuelve al acto anterior (sin reiniciar). */
  goBack(): void;
  /** Acto actual. */
  currentAct(): ActId;
  /** Pila de actos visitados (para el control «volver»). */
  history(): ActId[];
  /** Reinicia al hero. */
  returnToHero(): void;
}

export function createNarrative({ universe, reducedMotion, portal }: NarrativeOptions): NarrativeHandle {
  const stack: ActId[] = ['hero'];
  let traveling = false;
  // 7M-G §1: un único pin del hero; HERO_PIN_SCREENS es la única fuente de
  // duración (end, salto por teclado y navegación lo reutilizan).
  const HERO_PIN_SCREENS = 18;
  let heroPin: ScrollTrigger | null = null;
  let heroPinTl: gsap.core.Timeline | null = null;
  let heroPinEls: { actions: HTMLElement | null; copy: HTMLElement[]; umbral: HTMLElement | null } = {
    actions: null,
    copy: [],
    umbral: null,
  };

  const clearHeroPinFx = (): void => {
    if (heroPinEls.actions) gsap.set(heroPinEls.actions, { y: 0, opacity: 1 });
    heroPinEls.copy.forEach((el) => gsap.set(el, { opacity: 1, y: 0 }));
    if (heroPinEls.umbral) gsap.set(heroPinEls.umbral, { opacity: 1 });
    heroPinEls = { actions: null, copy: [], umbral: null };
  };

  const cancelHeroPin = (): void => {
    if (heroPinTl) { heroPinTl.kill(); heroPinTl = null; }
    if (heroPin) { heroPin.kill(); heroPin = null; }
    clearHeroPinFx();
    universe?.setHeroPin(0);
    const heroEl = document.querySelector<HTMLElement>('[data-hero-scene]');
    const actions = heroEl?.querySelector<HTMLElement>('.hero__actions');
    if (actions) gsap.set(actions, { y: 0 });
    const umbral = document.querySelector<HTMLElement>('[data-umbral-fade]');
    if (umbral) gsap.set(umbral, { opacity: 1 });
    ScrollTrigger.refresh();
  };

  const scrollTo = (anchor: string): void => {
    const element = document.querySelector<HTMLElement>(anchor);
    if (!element) return;
    const top = element.getBoundingClientRect().top + window.scrollY;
    const proxy = { value: window.scrollY };
    const root = document.documentElement;
    const w = window as unknown as { __publiaLastProgrammaticScroll?: number };
    root.dataset['scrolling'] = 'programmatic';
    w.__publiaLastProgrammaticScroll = performance.now();
    gsap.to(proxy, {
      value: top,
      duration: reducedMotion ? 0 : 1.5,
      ease: 'power2.inOut',
      onUpdate: () => {
        w.__publiaLastProgrammaticScroll = performance.now();
        window.scrollTo({ top: proxy.value, behavior: 'instant' as ScrollBehavior });
      },
      onComplete: () => {
        w.__publiaLastProgrammaticScroll = performance.now();
        root.dataset['scrolling'] = '';
      },
    });
  };

  const reveal = (anchor: string, tl?: gsap.core.Timeline): void => {
    const element = document.querySelector<HTMLElement>(anchor);
    if (!element) return;
    const items = element.querySelectorAll('[data-reveal]');
    if (tl && !reducedMotion) {
      // dentro de la transición unificada: el contenido emerge mientras el portal cruza
      tl.fromTo(
        items,
        { opacity: 0, y: 34 },
        { opacity: 1, y: 0, duration: 0.9, stagger: 0.09, ease: 'power3.out', overwrite: 'auto' },
        1.9 * 0.45,
      );
      return;
    }
    gsap.fromTo(
      items,
      { opacity: 0, y: 34 },
      {
        opacity: 1,
        y: 0,
        duration: reducedMotion ? 0 : 0.9,
        stagger: 0.09,
        ease: 'power3.out',
        delay: reducedMotion ? 0 : 0.55,
        overwrite: 'auto',
      },
    );
  };

  const enterAct = (actId: ActId): void => {
    if (actId === 'hero') {
      returnToHero();
      return;
    }
    const act = ACTS[actId];
    if (!act) return;
    cancelHeroPin(); // 7M-F §5.12: nunca quedar atrapado por el pin
    if (traveling) return;
    traveling = true;
    setTransitioning(true);

    setPrimaryRoute(act.route, 'button');
    if (act.traits) addTraits(act.traits);
    track(act.event as 'hero_enterprise_selected' | 'hero_efficiency_selected' | 'hero_cooperative_selected', { world: act.world });
    universe?.gesture();

    stack.push(act.id);
    if (stack.length > 12) stack.shift();

    // UNA sola línea de tiempo conduce la transición por botón:
    // cámara 3D + capas del portal + contenido de llegada (p 0→1 temporal).
    const duration = reducedMotion ? 0 : 1.9;
    const tl = gsap.timeline({
      onComplete: () => {
        traveling = false;
        setTransitioning(false);
      },
    });
    portal?.playOnTimeline(tl, duration);
    universe?.travelTo(act.world, { duration, timeline: tl });
    reveal(act.anchor, tl);
    scrollTo(act.anchor);

    // marca el acto en el documento para la UI (control «volver», viñeta)
    document.documentElement.dataset['act'] = act.id;
    window.setTimeout(() => {
      traveling = false;
      setTransitioning(false);
    }, reducedMotion ? 0 : 2000);
  };

  const enterFreeRoute = (): void => {
    // Guardas innegociables: sólo sin ruta elegida, sólo desde el hero, sólo
    // con scroll de intención real (el llamador ya filtró rueda/touch/teclado
    // y excluyó desplazamientos programáticos) y sin transición en curso.
    const state = getState();
    if (state.primary !== 'unclassified') return;
    if (state.transitioning) return;
    if (stack[stack.length - 1] !== 'hero') return;
    if (window.scrollY > window.innerHeight * 0.8) return;
    if (traveling) return;
    traveling = true;
    setTransitioning(true);

    const heroElement = document.querySelector<HTMLElement>('[data-hero-scene]');
    setPrimaryRoute('explorer', 'scroll');
    track('iniciar_scroll_libre', { world: 'cooperative' });
    universe?.gesture();

    stack.push('cooperative');
    if (stack.length > 12) stack.shift();

    // 7M-G §1: desktop >=1024 y sin reduced-motion → UN pin con scrub 0.6 y
    // distancia HERO_PIN_SCREENS×vh (18 pantallas); móvil/tablet/reduced-motion
    // → scroll natural sin pin. Un solo timeline dentro del ScrollTrigger para
    // que el scrub amortigüe de verdad los tweens (no gsap.set en onUpdate).
    const canPin = !reducedMotion && window.innerWidth >= 1024 && heroElement;
    if (canPin && heroElement) {
      const actions = heroElement.querySelector<HTMLElement>('.hero__actions');
      const copy = [...heroElement.querySelectorAll<HTMLElement>('.hero__eyebrow, .hero__title, .hero__subtitle')];
      const inner = heroElement.querySelector<HTMLElement>('.hero__inner');
      const navbar = document.querySelector<HTMLElement>('[data-navbar]');
      const navbarH = navbar?.offsetHeight ?? 64;
      const H = window.innerHeight;
      // Rebote medido en coordenadas del hero, sin transformaciones aplicadas
      const heroTop = heroElement.getBoundingClientRect().top;
      const actionsTop0 = actions ? actions.getBoundingClientRect().top - heroTop : 0;
      const actionsH = actions?.offsetHeight ?? 0;
      const topNear = navbarH + 40;
      const topLow = Math.min(0.62 * H, H - actionsH - 56);
      const canBounce = actions !== null && topLow >= topNear;
      const yNear = topNear - actionsTop0;
      const yLow = topLow - actionsTop0;
      const umbral = document.querySelector<HTMLElement>('[data-umbral-fade]');
      heroPinEls = { actions, copy, umbral };

      heroPinTl = gsap.timeline({
        scrollTrigger: {
          trigger: heroElement,
          start: 'top top',
          end: `+=${Math.round(H * HERO_PIN_SCREENS)}`,
          pin: true,
          scrub: 0.6,
          invalidateOnRefresh: true, // end recalculable con el viewport
          onUpdate: (self) => { universe?.setHeroPin(self.progress); },
          onLeave: () => { if (umbral) gsap.set(umbral, { opacity: 1 }); },
          onRefresh: () => { /* invalidateOnRefresh recalcula end; nada que limpiar */ },
        },
      });
      heroPin = heroPinTl.scrollTrigger as ScrollTrigger | null;
      if (actions && canBounce) {
        // 0–0.12 subida hacia yNear; 0.12–0.22 descenso hacia yLow (power3.out)
        heroPinTl.to(actions, { y: yNear, duration: 0.12, ease: 'none' }, 0);
        heroPinTl.to(actions, { y: yLow, duration: 0.10, ease: 'power3.out' }, 0.12);
      }
      // El bloque de copy se desvanece durante la subida para que los CTA no
      // crucen encima de las letras (0–0.12)
      copy.forEach((el) => heroPinTl?.to(el, { opacity: 0.08, y: -28, duration: 0.12, ease: 'power1.out' }, 0));
      // 0.70–0.88 apertura del prisma + conexión visual con el umbral
      if (umbral) heroPinTl.fromTo(umbral, { opacity: 0 }, { opacity: 1, duration: 0.18, ease: 'none' }, 0.70);
      // 0.88–1 salida gradual del hero (CTA operativos hasta el final)
      if (inner) heroPinTl.to(inner, { opacity: 0, duration: 0.12, ease: 'power1.in' }, 0.88);
      universe?.travelTo('cooperative', { duration: 0 }); // fija mundo destino; el pin conduce
    } else {
      universe?.travelTo('cooperative', {
        scrub: heroElement ? { trigger: heroElement, start: 'top top', end: '+=150%' } : undefined,
        duration: reducedMotion ? 0 : 1.9,
        onComplete: () => { traveling = false; setTransitioning(false); },
      });
      if (reducedMotion || !heroElement) universe?.travelTo('cooperative', { duration: 0 });
    }

    document.documentElement.dataset['act'] = 'cooperative';
    window.setTimeout(() => {
      traveling = false;
      setTransitioning(false);
    }, reducedMotion ? 0 : 3000);
  };

  const goBack = (): void => {
    cancelHeroPin(); // 7M-F §5.12: el pin nunca atrapa al volver
    if (stack.length <= 1 || traveling) return;
    stack.pop();
    const previous = stack[stack.length - 1] ?? 'hero';
    const act = previous === 'hero' ? HERO_ACT : ACTS[previous];
    if (!act) return;

    traveling = true;
    if (previous !== 'hero') {
      setPrimaryRoute(act.route);
    }
    track('act_back', { to: previous });

    universe?.travelTo(act.world, {
      duration: reducedMotion ? 0 : 1.6,
      onComplete: () => {
        traveling = false;
      },
    });
    scrollTo(act.anchor);
    document.documentElement.dataset['act'] = act.id;
    window.setTimeout(() => {
      traveling = false;
    }, reducedMotion ? 0 : 1700);
  };

  const returnToHero = (): void => {
    cancelHeroPin();
    stack.length = 0;
    stack.push('hero');
    universe?.travelTo('hero', { duration: reducedMotion ? 0 : 1.6 });
    scrollTo(HERO_ACT.anchor);
    document.documentElement.dataset['act'] = 'hero';
    track('hero_returned', {});
  };

  return {
    enterAct,
    enterFreeRoute,
    cancelHeroPin,
    heroPinEnd(): number | null {
      if (heroPin) return heroPin.end + 1;
      const heroEl = document.querySelector<HTMLElement>('[data-hero-scene]');
      return heroEl ? heroEl.offsetTop + window.innerHeight * HERO_PIN_SCREENS + 1 : null;
    },
    heroPinScreens(): number {
      return HERO_PIN_SCREENS;
    },
    goBack,
    currentAct(): ActId {
      return stack[stack.length - 1] ?? 'hero';
    },
    history(): ActId[] {
      return [...stack];
    },
    returnToHero,
  };
}

export { getState };
