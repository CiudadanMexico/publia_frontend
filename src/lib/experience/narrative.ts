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

import type { UniverseHandle, UniverseWorld } from '../three/universe';
import type { PrimaryRoute, VisitorTrait } from './state';
import { addTraits, getState, setPrimaryRoute } from './state';
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
}

export interface NarrativeHandle {
  /** Entra a un acto: viaje de cámara + scroll + estado. */
  enterAct(act: ActId): void;
  /** Vuelve al acto anterior (sin reiniciar). */
  goBack(): void;
  /** Acto actual. */
  currentAct(): ActId;
  /** Pila de actos visitados (para el control «volver»). */
  history(): ActId[];
  /** Reinicia al hero. */
  returnToHero(): void;
}

export function createNarrative({ universe, reducedMotion }: NarrativeOptions): NarrativeHandle {
  const stack: ActId[] = ['hero'];
  let traveling = false;

  const scrollTo = (anchor: string): void => {
    const element = document.querySelector<HTMLElement>(anchor);
    if (!element) return;
    const top = element.getBoundingClientRect().top + window.scrollY;
    const proxy = { value: window.scrollY };
    const root = document.documentElement;
    root.dataset['scrolling'] = 'programmatic';
    gsap.to(proxy, {
      value: top,
      duration: reducedMotion ? 0 : 1.5,
      ease: 'power2.inOut',
      onUpdate: () => {
        window.scrollTo({ top: proxy.value, behavior: 'instant' as ScrollBehavior });
      },
      onComplete: () => {
        root.dataset['scrolling'] = '';
      },
    });
  };

  const reveal = (anchor: string): void => {
    const element = document.querySelector<HTMLElement>(anchor);
    if (!element) return;
    gsap.fromTo(
      element.querySelectorAll('[data-reveal]'),
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
    if (traveling) return;
    traveling = true;

    setPrimaryRoute(act.route);
    if (act.traits) addTraits(act.traits);
    track(act.event as 'hero_enterprise_selected' | 'hero_efficiency_selected' | 'hero_cooperative_selected', { world: act.world });

    stack.push(act.id);
    if (stack.length > 12) stack.shift();

    universe?.travelTo(act.world, {
      duration: reducedMotion ? 0 : 1.9,
      onComplete: () => {
        traveling = false;
      },
    });
    scrollTo(act.anchor);
    reveal(act.anchor);

    // marca el acto en el documento para la UI (control «volver», viñeta)
    document.documentElement.dataset['act'] = act.id;
    window.setTimeout(() => {
      traveling = false;
    }, reducedMotion ? 0 : 2000);
  };

  const goBack = (): void => {
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
    stack.length = 0;
    stack.push('hero');
    universe?.travelTo('hero', { duration: reducedMotion ? 0 : 1.6 });
    scrollTo(HERO_ACT.anchor);
    document.documentElement.dataset['act'] = 'hero';
    track('hero_returned', {});
  };

  return {
    enterAct,
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
