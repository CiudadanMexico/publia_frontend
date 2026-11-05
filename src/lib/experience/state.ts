/**
 * Motor de estado del visitante.
 *
 * Reglas de diseño (ver docs/PUBLIA-MAPA-NARRATIVO.md):
 * - El visitante nunca responde un cuestionario: sólo decide dos o tres
 *   decisiones explícitas; el resto se infiere de su recorrido.
 * - El estado sobrevive mientras navega (sessionStorage) y puede cambiar de
 *   opinión en cualquier momento.
 * - Los estados no son excluyentes: una ruta primaria convive con rasgos.
 */

export type PrimaryRoute = 'unclassified' | 'enterprise' | 'efficiency' | 'explorer';

export type VisitorTrait =
  | 'cooperative'
  | 'needs_help'
  | 'value_driven'
  | 'starting'
  | 'existing'
  | 'advanced';

export type RouteOrigin = 'button' | 'scroll' | null;

export interface VisitorAnswers {
  /** Ruta A2: ¿ya hay sistemas o se empieza desde cero? */
  arranque?: 'existente' | 'desde_cero';
  /** Ruta B2: ¿qué consume más tiempo? */
  foco?: 'mensajes' | 'marketing' | 'ventas' | 'operacion' | 'explorando';
  /** Ruta B4: escala del negocio. */
  escala?: 'solo' | 'equipo_pequeno' | 'creciendo' | 'operacion_grande';
  /** Mosaico de soluciones (E25): familia seleccionada. */
  servicio?: string;
}

export interface VisitorState {
  /** Ruta elegida de forma explícita; `unclassified` mientras no elija. */
  primary: PrimaryRoute;
  /** Cómo se eligió la ruta: por botón o por scroll libre. */
  origin: RouteOrigin;
  /** Rasgos inferidos o declarados, acumulables. */
  traits: VisitorTrait[];
  /** Respuestas guardadas para adaptar escenas posteriores. */
  answers: VisitorAnswers;
  /** Escenas ya vistas, para no repetir la misma entrada. */
  visitedScenes: string[];
  /** Última escena visitada. */
  lastScene: string | null;
  /** Semáforo de transición en curso (evita tweens peleando). */
  transitioning: boolean;
  /** Marca de tiempo de la última actualización. */
  updatedAt: number;
}

export const ROUTES: readonly PrimaryRoute[] = [
  'unclassified',
  'enterprise',
  'efficiency',
  'explorer',
];

export const TRAITS: readonly VisitorTrait[] = [
  'cooperative',
  'needs_help',
  'value_driven',
  'starting',
  'existing',
  'advanced',
];

const STORAGE_KEY = 'publia.visitor.v1';

type Listener = (state: VisitorState) => void;

const listeners = new Set<Listener>();

function emptyState(): VisitorState {
  return {
    primary: 'unclassified',
    origin: null,
    traits: [],
    answers: {},
    visitedScenes: [],
    lastScene: null,
    transitioning: false,
    updatedAt: Date.now(),
  };
}

function isRoute(value: unknown): value is PrimaryRoute {
  return typeof value === 'string' && (ROUTES as readonly string[]).includes(value);
}

function isTrait(value: unknown): value is VisitorTrait {
  return typeof value === 'string' && (TRAITS as readonly string[]).includes(value);
}

function load(): VisitorState {
  if (typeof sessionStorage === 'undefined') {
    return emptyState();
  }
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return emptyState();
    }
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== 'object' || parsed === null) {
      return emptyState();
    }
    const candidate = parsed as Partial<VisitorState>;
    const primary = isRoute(candidate.primary) ? candidate.primary : 'unclassified';
    const traits = Array.isArray(candidate.traits)
      ? candidate.traits.filter(isTrait)
      : [];
    const visitedScenes = Array.isArray(candidate.visitedScenes)
      ? candidate.visitedScenes.filter((id): id is string => typeof id === 'string')
      : [];
    const origin: RouteOrigin =
      candidate.origin === 'button' || candidate.origin === 'scroll' ? candidate.origin : null;
    const answers: VisitorAnswers =
      typeof candidate.answers === 'object' && candidate.answers !== null
        ? (candidate.answers as VisitorAnswers)
        : {};
    return {
      primary,
      origin,
      traits,
      answers,
      visitedScenes,
      lastScene: typeof candidate.lastScene === 'string' ? candidate.lastScene : null,
      transitioning: false,
      updatedAt: typeof candidate.updatedAt === 'number' ? candidate.updatedAt : Date.now(),
    };
  } catch {
    return emptyState();
  }
}

let state: VisitorState = load();

function persist(): void {
  if (typeof sessionStorage === 'undefined') {
    return;
  }
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    /* modo privado o cuota llena: el estado sigue viva en memoria */
  }
}

function commit(next: VisitorState): void {
  state = next;
  persist();
  applyDocumentState(state);
  for (const listener of listeners) {
    listener(state);
  }
}

/** Refleja el estado en el documento para que el CSS pueda adaptar la paleta. */
export function applyDocumentState(current: VisitorState): void {
  if (typeof document === 'undefined') {
    return;
  }
  const root = document.documentElement;
  root.dataset['route'] = current.primary;
  root.dataset['traits'] = current.traits.join(' ');
}

export function getState(): VisitorState {
  return state;
}

export function subscribe(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** Elige (o cambia) la ruta principal, con su origen. */
export function setPrimaryRoute(route: PrimaryRoute, origin: RouteOrigin = 'button'): void {
  if (!isRoute(route) || route === 'unclassified') {
    return;
  }
  if (state.primary === route) {
    return;
  }
  commit({
    ...state,
    primary: route,
    origin,
    updatedAt: Date.now(),
  });
}

/** Guarda una respuesta del visitante para adaptar las escenas posteriores. */
export function setAnswer(key: keyof VisitorAnswers, value: string): void {
  const allowed: Partial<Record<keyof VisitorAnswers, readonly string[]>> = {
    arranque: ['existente', 'desde_cero'],
    foco: ['mensajes', 'marketing', 'ventas', 'operacion', 'explorando'],
    escala: ['solo', 'equipo_pequeno', 'creciendo', 'operacion_grande'],
    // servicio: cualquier nombre de familia del catálogo (cadena no vacía)
  };
  const values = allowed[key];
  if (values ? !values.includes(value) : !value.trim()) {
    return;
  }
  commit({
    ...state,
    answers: { ...state.answers, [key]: value },
    updatedAt: Date.now(),
  });
}

/** Marca/desmarca una transición en curso. */
export function setTransitioning(value: boolean): void {
  if (state.transitioning === value) {
    return;
  }
  commit({ ...state, transitioning: value, updatedAt: Date.now() });
}

/** Añade rasgos sin eliminar los previos. */
export function addTraits(traits: readonly VisitorTrait[]): void {
  const fresh = traits.filter((trait) => !state.traits.includes(trait));
  if (fresh.length === 0) {
    return;
  }
  commit({
    ...state,
    traits: [...state.traits, ...fresh],
    updatedAt: Date.now(),
  });
}

/** Registra que una escena ya se vio (evita eventos duplicados). */
export function markSceneVisited(sceneId: string): boolean {
  if (state.visitedScenes.includes(sceneId)) {
    return false;
  }
  commit({
    ...state,
    visitedScenes: [...state.visitedScenes, sceneId],
    lastScene: sceneId,
    updatedAt: Date.now(),
  });
  return true;
}

export function hasVisited(sceneId: string): boolean {
  return state.visitedScenes.includes(sceneId);
}

export function hasTrait(trait: VisitorTrait): boolean {
  return state.traits.includes(trait);
}

/** Reinicia la experiencia (botón "empezar de nuevo"). */
export function resetExperience(): void {
  commit(emptyState());
}

/** Rasgos implícitos deducidos de la ruta, sin preguntas al visitante. */
export function inferTraits(current: VisitorState = state): VisitorTrait[] {
  const inferred: VisitorTrait[] = [];
  if (current.primary === 'enterprise') {
    inferred.push('existing', 'advanced');
  }
  if (current.primary === 'efficiency') {
    inferred.push('value_driven');
  }
  if (current.primary === 'explorer') {
    inferred.push('starting');
  }
  return inferred.filter((trait) => !current.traits.includes(trait));
}
