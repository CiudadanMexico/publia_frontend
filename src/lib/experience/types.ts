/**
 * Tipos canónicos del motor de experiencia (brief Publia 6.0, §21).
 *
 * El motor es dirigido por datos: una escena es una definición declarativa
 * con propósito, segmentos, estado requerido/producido, variantes de mensaje,
 * duración narrativa, destinos y directivas visuales. El render y la animación
 * son genéricos; cambiar el relato es cambiar datos, no componentes.
 */

import type { PrimaryRoute, VisitorState, VisitorTrait } from './state';

export type { PrimaryRoute, VisitorState, VisitorTrait };

/** Segmentos narrativos: no son excluyentes entre sí. */
export type Segment =
  | 'enterprise'
  | 'efficiency'
  | 'explorer'
  | 'cooperative'
  | 'values'
  | 'practical'
  | 'beginner'
  | 'growing'
  | 'established'
  | 'advanced';

/** Estado visual de la escena 3D persistente. */
export type StageState =
  | 'abstract'
  | 'enterprise'
  | 'efficiency'
  | 'explorer'
  | 'cooperative'
  | 'housing'
  | 'convergence';

/** Paleta narrativa activa (se aplica al documento y al escenario 3D). */
export type PaletteName = 'ink' | 'graphite' | 'amber' | 'teal' | 'verdant' | 'dawn';

/** Atmósfera luminosa de la escena (dirección de arte v3). */
export type SceneTone =
  | 'cosmos'
  | 'cream'
  | 'electric'
  | 'petrol'
  | 'emerald'
  | 'violet'
  | 'graphite'
  | 'sun';

/** Silueta compositiva de la escena (dirección de arte v3). */
export type SceneLayout =
  | 'split'
  | 'center'
  | 'mosaic'
  | 'pipeline'
  | 'map'
  | 'editorial'
  | 'plans';

/** Módulos visuales que una escena puede componer. */
export type SceneModule =
  | 'umbral'
  | 'statement'
  | 'form'
  | 'split'
  | 'features'
  | 'network'
  | 'conversation'
  | 'tasks'
  | 'escalation'
  | 'contentFlow'
  | 'coverage'
  | 'branch'
  | 'plans'
  | 'catalog'
  | 'distribution'
  | 'infrastructure'
  | 'infraDemo'
  | 'flowDemo'
  | 'geoDemo'
  | 'cta'
  | 'recommendation'
  | 'ecosystem'
  | 'redDemo'
  | 'personasDemo'
  | 'membershipsDemo'
  | 'housingCompare'
  | 'marketingDemo';

export interface CTA {
  label: string;
  /** Destino interno (#escena), correo (mailto:) o url externa. */
  target: string;
  /** Acción de analítica asociada. */
  event?: string;
  /** Añade el contexto de navegación al correo. */
  contact?: boolean;
}

export interface VisualAsset {
  id: string;
  kind: 'procedural' | 'image' | 'model' | 'video';
  src?: string;
  /** `procedural` = placeholder generado por código (no requiere archivo). */
  note?: string;
}

/** Variante de mensaje para un segmento o ruta concreta. */
export interface SceneVariant {
  route?: PrimaryRoute;
  segment?: Segment;
  eyebrow?: string;
  title?: string;
  lead?: string;
  body?: string;
  bullets?: string[];
  cta?: CTA;
  /** Datos para módulos de datos (demostraciones, planes, distribución). */
  data?: SceneData;
  /** Estado visual de la escena 3D para esta variante. */
  stage?: StageState;
  /** Paleta activa para esta variante. */
  palette?: PaletteName;
}

export interface SceneData {
  /** Pasos de una demostración (conversación, tareas, escalamiento). */
  steps?: Array<{ label: string; detail?: string; actor?: string }>;
  /** Elementos de una red (personas, nodos, canales). */
  nodes?: Array<{ label: string; role?: string }>;
  /** Conexiones de red: pares de índices de nodos. */
  links?: Array<[number, number]>;
  /** Reparto porcentual (housing 50/25/25). */
  shares?: Array<{ label: string; value: number; note?: string }>;
  /** Planes de membresía resumidos para la escena de catálogo. */
  plans?: Array<{ name: string; price: string; highlight?: boolean; features: string[] }>;
  /** Servicios resumidos. */
  services?: Array<{
    name: string;
    detail: string;
    price?: string | null;
    family?: string;
    status?: 'existente' | 'en-desarrollo' | 'planeado';
    priceConfirmed?: boolean;
  }>;
  /** Ventanas de servicio (cobertura). */
  windows?: Array<{ label: string; value: string; note?: string }>;
  /** Comparativa centralizado vs red. */
  comparison?: { centralized: string[]; distributed: string[] };
  /** Dos salidas de una bifurcación. */
  branches?: Array<{ label: string; target: string; trait?: VisitorTrait; route?: PrimaryRoute }>;
}

/**
 * Efectos declarativos que una escena activa. Los implementa
 * `src/lib/animation/effects.ts` a partir de estos atributos.
 */
export interface SceneEffects {
  /** Duración del anclaje en viewports (1 = una pantalla). */
  pin?: number;
  /** Recorrido horizontal de su contenido (desktop). */
  horizontal?: boolean;
  /** Columna sticky dentro de la escena. */
  sticky?: boolean;
  /** Profundidad de parallax (fracción de la altura). */
  parallax?: number;
  /** Intensidad de la profundidad de campo simulada. */
  depth?: number;
  /** Morphing de la entidad 3D durante la escena. */
  morph?: boolean;
}

export interface SceneDefinition {
  /** Identificador del mapa narrativo (E00…E30). */
  id: string;
  eyebrow?: string;
  title: string;
  lead?: string;
  body?: string;
  bullets?: string[];
  /** Función narrativa: por qué existe esta escena. */
  purpose: string;
  /** Módulos que la componen, en orden. */
  modules: SceneModule[];
  /** Segmentos a los que aplica (vacío = todos). */
  segments: Segment[];
  /** Ruta principal que la dispara (`shared` = todas). */
  route: PrimaryRoute | 'shared';
  /** 7M-E: fuera del recorrido esencial; visible sólo con "explorar todo". */
  optional?: boolean;
  /** Estado que la escena requiere para mostrarse. */
  requires?: { route?: PrimaryRoute[]; traits?: VisitorTrait[] };
  /** Estado que la escena produce al entrar. */
  produces?: { route?: PrimaryRoute; traits?: VisitorTrait[] };
  /** Duración narrativa en unidades de scroll (1 = una pantalla). */
  duration: number;
  /** Variantes de mensaje por segmento o ruta. */
  variants?: SceneVariant[];
  /** Datos de los módulos (demostraciones, planes, reparto, comparativas). */
  data?: SceneData;
  /** Efectos cinematográficos que la escena activa. */
  effects?: SceneEffects;
  cta?: CTA;
  /** Destinos narrativos (ids de escena). */
  destinations?: string[];
  /** Transición de entrada. */
  transition?: 'fade' | 'rise' | 'slide' | 'scale' | 'morph';
  /** Estado visual de la escena 3D. */
  stage?: StageState;
  palette?: PaletteName;
  /** Atmósfera luminosa (v3). */
  tone?: SceneTone;
  /** Silueta compositiva (v3). */
  layout?: SceneLayout;
  /** Slot de arte protagonista (A01–A10); placeholder sustituible sin refactor. */
  art?: string;
  /** Capítulo narrativo (hero, descubrimiento, mundo, interaccion, convergencia, cierre). */
  chapter?: string;
  assets?: VisualAsset[];
}

/** Grafo navegable: resuelve escenas, destinos y rutas. */
export interface SceneGraph {
  scenes: SceneDefinition[];
  byId: Map<string, SceneDefinition>;
}
