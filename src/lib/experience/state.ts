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

/** Identificadores estables de capacidades del cierre V2 (nunca cadenas libres). */
export type CapabilityId =
  | 'web'
  | 'agentes'
  | 'marketing'
  | 'personas'
  | 'housing'
  | 'capacitacion';

export const CAPABILITY_IDS: readonly CapabilityId[] = [
  'web',
  'agentes',
  'marketing',
  'personas',
  'housing',
  'capacitacion',
];

/** Preferencia de infraestructura (Bloque A). */
export type InfraPreference = 'ia_privada' | 'housing' | 'red_distribuida';

export type HousingMode = 'compartido' | 'privado';

export const HOUSING_MODES: readonly HousingMode[] = ['compartido', 'privado'];

function isHousingMode(value: unknown): value is HousingMode {
  return value === 'compartido' || value === 'privado';
}

export const INFRA_PREFERENCES: readonly InfraPreference[] = [
  'ia_privada',
  'housing',
  'red_distribuida',
];

/** Niveles de membresía (Bloque D). */
export type MembershipSlug = 'base' | 'agente' | 'crecimiento' | 'operacion' | 'cobertura';

export const MEMBERSHIP_SLUGS: readonly MembershipSlug[] = [
  'base',
  'agente',
  'crecimiento',
  'operacion',
  'cobertura',
];

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
  /** Capacidades seleccionadas para la propuesta final (cierre V2). */
  capabilities: CapabilityId[];
  /** Membresía orientativa elegida en E27 (null = sin elegir). */
  membership: MembershipSlug | null;
  /** Preferencia de infraestructura elegida en E03/E21 (null = sin elegir). */
  infra: InfraPreference | null;
  /** Preferencia de red colaborativa (Bloque B). */
  red: string | null;
  /** Cambios manuales a la propuesta hechos en el cierre. */
  proposalTouched: boolean;
  /** Modalidad de Housing elegida en E22 (A08); null = sin elegir. Distinto de `infra`. */
  housingMode: HousingMode | null;
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
    capabilities: [],
    membership: null,
    infra: null,
    red: null,
    proposalTouched: false,
    housingMode: null,
  };
}

function isRoute(value: unknown): value is PrimaryRoute {
  return typeof value === 'string' && (ROUTES as readonly string[]).includes(value);
}

function isTrait(value: unknown): value is VisitorTrait {
  return typeof value === 'string' && (TRAITS as readonly string[]).includes(value);
}

function isCapability(value: unknown): value is CapabilityId {
  return typeof value === 'string' && (CAPABILITY_IDS as readonly string[]).includes(value);
}

function isInfra(value: unknown): value is InfraPreference {
  return typeof value === 'string' && (INFRA_PREFERENCES as readonly string[]).includes(value);
}

function isMembership(value: unknown): value is MembershipSlug {
  return typeof value === 'string' && (MEMBERSHIP_SLUGS as readonly string[]).includes(value);
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
      // Migración compatible: sesiones antiguas de publia.visitor.v1 obtienen
      // los campos nuevos con defaults; nada se pierde ni se reescribe mal.
      capabilities: Array.isArray(candidate.capabilities)
        ? candidate.capabilities.filter(isCapability)
        : [],
      membership: isMembership(candidate.membership) ? candidate.membership : null,
      infra: isInfra(candidate.infra) ? candidate.infra : null,
      red: typeof candidate.red === 'string' && candidate.red.trim() ? candidate.red : null,
      proposalTouched: candidate.proposalTouched === true,
      housingMode: isHousingMode(candidate.housingMode) ? candidate.housingMode : null,
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

/** Añade o quita una capacidad de la propuesta final (cierre V2). */
export function toggleCapability(id: CapabilityId): boolean {
  const has = state.capabilities.includes(id);
  commit({
    ...state,
    capabilities: has
      ? state.capabilities.filter((c) => c !== id)
      : [...state.capabilities, id],
    proposalTouched: true,
    updatedAt: Date.now(),
  });
  return !has;
}

/** Guarda la membresía orientativa elegida (E27). */
export function setMembership(slug: MembershipSlug | null): void {
  if (slug !== null && !isMembership(slug)) return;
  if (state.membership === slug) return;
  commit({ ...state, membership: slug, updatedAt: Date.now() });
}

/** Guarda la preferencia de infraestructura (E03/E21). */
export function setInfraPreference(pref: InfraPreference | null): void {
  if (pref !== null && !isInfra(pref)) return;
  if (state.infra === pref) return;
  commit({ ...state, infra: pref, updatedAt: Date.now() });
}

/** Guarda la capacidad de red colaborativa elegida (E15–E19). */
export function setRedCapability(value: string | null): void {
  const clean = value ? value.trim() : null;
  if (!clean) return;
  if (state.red === clean) return;
  commit({ ...state, red: clean, updatedAt: Date.now() });
}

/** Guarda la modalidad de Housing elegida en E22 (A08). */
export function setHousingMode(mode: HousingMode | null): void {
  if (mode !== null && !isHousingMode(mode)) return;
  if (state.housingMode === mode) return;
  commit({ ...state, housingMode: mode, updatedAt: Date.now() });
}

/** Marca que el visitante editó manualmente la propuesta en el cierre. */
export function markProposalTouched(): void {
  if (state.proposalTouched) return;
  commit({ ...state, proposalTouched: true, updatedAt: Date.now() });
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
