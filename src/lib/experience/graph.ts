/**
 * Motor de escenas del grafo narrativo.
 *
 * Resuelve, a partir del estado del visitante, qué escenas se ven, qué texto
 * corresponde a cada una y a dónde se puede ir. No toca el DOM: el render y
 * la animación consumen estos datos.
 */

import { SCENES } from '../../data/routes/scenes';
import type {
  PaletteName,
  PrimaryRoute,
  SceneDefinition,
  SceneData,
  SceneVariant,
  Segment,
  StageState,
  VisitorState,
} from './types';

export interface ResolvedScene extends SceneDefinition {
  /** Variante que aplica a esta visita. */
  variant: SceneVariant | null;
  /** Escena efectiva de la que el visitante parte. */
  eyebrow: string;
  title: string;
  lead: string;
  body: string;
  bullets: string[];
  data: SceneData | undefined;
  stage: StageState;
  palette: PaletteName;
}

const byId = new Map<string, SceneDefinition>(SCENES.map((scene) => [scene.id, scene]));

/** Cada rasgo del visitante se expresa como un segmento narrativo. */
const TRAIT_SEGMENTS: Record<string, Segment> = {
  cooperative: 'cooperative',
  needs_help: 'practical',
  value_driven: 'values',
  starting: 'beginner',
  existing: 'established',
  advanced: 'advanced',
};

/** La ruta elegida también es un segmento. */
const ROUTE_SEGMENTS: Record<PrimaryRoute, Segment> = {
  unclassified: 'explorer',
  enterprise: 'enterprise',
  efficiency: 'efficiency',
  explorer: 'explorer',
};

/** Segmentos que el visitante tiene ahora mismo. */
export function visitorSegments(state: VisitorState): Segment[] {
  const segments = new Set<Segment>([ROUTE_SEGMENTS[state.primary]]);
  for (const trait of state.traits) {
    const segment = TRAIT_SEGMENTS[trait];
    if (segment) {
      segments.add(segment);
    }
  }
  return [...segments];
}

export function allScenes(): SceneDefinition[] {
  return SCENES;
}

export function getScene(id: string): SceneDefinition | undefined {
  return byId.get(id);
}

/**
 * Ruta efectiva: mientras no se elige, el desplazamiento lleva a la ruta de
 * exploración (E13/E14), que es el tercer camino del hero.
 */
export function effectiveRoute(state: VisitorState): PrimaryRoute {
  return state.primary === 'unclassified' ? 'explorer' : state.primary;
}

/** ¿La escena aplica a este visitante? */
export function appliesTo(scene: SceneDefinition, state: VisitorState): boolean {
  if (scene.route !== 'shared' && scene.route !== effectiveRoute(state)) {
    return false;
  }
  if (scene.requires?.route && !scene.requires.route.includes(state.primary)) {
    return false;
  }
  if (scene.requires?.traits && !scene.requires.traits.some((trait) => state.traits.includes(trait))) {
    return false;
  }
  if (scene.segments.length === 0) {
    return true;
  }
  // La escena por segmentos se abre si el visitante tiene alguno de ellos.
  const segments = visitorSegments(state);
  return scene.segments.some((segment) => segments.includes(segment));
}

/** Variante que aplica: primero por ruta, luego por rasgo, luego por segmento. */
export function pickVariant(scene: SceneDefinition, state: VisitorState): SceneVariant | null {
  return pickVariantFrom(scene.variants ?? [], state);
}

/** Variante aplicable a partir de una lista de variantes y el estado actual. */
export function pickVariantFrom(
  variants: readonly SceneVariant[],
  state: VisitorState,
): SceneVariant | null {
  if (variants.length === 0) {
    return null;
  }
  // La variante de ruta y la de segmento se combinan: el segmento (rasgo)
  // tiene prioridad porque describe mejor a la persona.
  const routeVariant = variants.find((variant) => variant.route && variant.route === state.primary);
  const traitSegments = state.traits
    .map((trait) => TRAIT_SEGMENTS[trait])
    .filter((segment): segment is Segment => Boolean(segment));
  const segmentVariant =
    variants.find((variant) => variant.segment && traitSegments.includes(variant.segment)) ??
    variants.find((variant) => variant.segment && variant.segment === ROUTE_SEGMENTS[state.primary]);
  if (!routeVariant && !segmentVariant) {
    return null;
  }
  return { ...(routeVariant ?? {}), ...(segmentVariant ?? {}) };
}

/** Resuelve el contenido final de una escena para este visitante. */
export function resolveScene(scene: SceneDefinition, state: VisitorState): ResolvedScene {
  const variant = pickVariant(scene, state);
  return {
    ...scene,
    variant,
    eyebrow: variant?.eyebrow ?? scene.eyebrow ?? '',
    title: variant?.title ?? scene.title,
    lead: variant?.lead ?? scene.lead ?? '',
    body: variant?.body ?? scene.body ?? '',
    bullets: variant?.bullets ?? scene.bullets ?? [],
    data: variant?.data ?? scene.data,
    stage: variant?.stage ?? scene.stage ?? 'abstract',
    palette: variant?.palette ?? scene.palette ?? 'ink',
  };
}

/** Escenas visibles para este visitante, en orden narrativo. */
export function scenesForState(state: VisitorState): ResolvedScene[] {
  return SCENES.filter((scene) => appliesTo(scene, state)).map((scene) => resolveScene(scene, state));
}

/** Todas las escenas que el render debe emitir (visibles u ocultas por ruta). */
export function renderableScenes(): ResolvedScene[] {
  return SCENES.map((scene) =>
    resolveScene(scene, {
      primary: 'unclassified',
      origin: null,
      traits: [],
      answers: {},
      visitedScenes: [],
      lastScene: null,
      transitioning: false,
      capabilities: [],
      membership: null,
      infra: null,
      red: null,
      proposalTouched: false,
      housingMode: null,
      exploreAll: false,
      updatedAt: 0,
    }),
  );
}

/** Siguiente escena visible a partir de una escena dada. */
export function nextScene(sceneId: string, state: VisitorState): ResolvedScene | null {
  const visible = scenesForState(state);
  const index = visible.findIndex((scene) => scene.id === sceneId);
  if (index === -1) {
    return visible[0] ?? null;
  }
  return visible[index + 1] ?? null;
}

/** Escena anterior visible. */
export function previousScene(sceneId: string, state: VisitorState): ResolvedScene | null {
  const visible = scenesForState(state);
  const index = visible.findIndex((scene) => scene.id === sceneId);
  if (index <= 0) {
    return null;
  }
  return visible[index - 1] ?? null;
}

/** Destinos declarados por una escena (para navegación explícita). */
export function destinationsOf(scene: SceneDefinition, state: VisitorState): string[] {
  const declared = scene.destinations ?? [];
  const branchTargets = scene.data?.branches?.map((branch) => branch.target.replace('#', '')) ?? [];
  return [...declared, ...branchTargets].filter((id) => byId.has(id) || id.startsWith('escena'));
}
