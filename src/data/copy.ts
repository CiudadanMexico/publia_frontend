/**
 * Copy narrativo de la experiencia.
 *
 * El contenido comercial vive aquí, separado de la lógica de navegación.
 * Cada escena declara su ruta, su propósito y su adaptación por estado.
 */

import type { PrimaryRoute, VisitorTrait } from '../lib/experience/state';

export interface RouteDefinition {
  id: PrimaryRoute;
  label: string;
  /** Texto que resume la ruta en una línea. */
  summary: string;
  /** Significado del camino, para la navegación. */
  intent: string;
  paletteNote: string;
}

export const ROUTE_DEFINITIONS: Record<PrimaryRoute, RouteDefinition> = {
  unclassified: {
    id: 'unclassified',
    label: 'Sin ruta',
    summary: 'Todavía no sabemos qué te mueve; por eso la escena se adapta.',
    intent: 'Entrada',
    paletteNote: 'Violeta de transición',
  },
  enterprise: {
    id: 'enterprise',
    label: 'Gran empresa',
    summary: 'Ya tienes mucho construido; haz que tu tecnología trabaje a tu favor.',
    intent: 'Control y soberanía',
    paletteNote: 'Grafito metálico',
  },
  efficiency: {
    id: 'efficiency',
    label: 'Más con menos',
    summary: 'Hacer más no siempre significa gastar más.',
    intent: 'Operación integrada',
    paletteNote: 'Ámbar cálido',
  },
  explorer: {
    id: 'explorer',
    label: 'Exploración',
    summary: 'Todo el mundo quiere venderte algo. Nosotros queremos conocerte.',
    intent: 'Descubrimiento',
    paletteNote: 'Verde azulado',
  },
};

export interface HeroCopy {
  title: string;
  subtitle: string;
  ctas: Array<{
    id: 'enterprise' | 'efficiency';
    label: string;
    target: string;
    hint: string;
  }>;
}

export const HERO: HeroCopy = {
  title: 'EL MUNDO ESTÁ CAMBIANDO.',
  subtitle: 'Tu negocio también puede cambiar las reglas.',
  ctas: [
    {
      id: 'enterprise',
      label: 'Soy una gran empresa, o estoy en camino de serlo',
      target: '#ruta-empresa',
      hint: 'Soberanía, control y una red de especialistas a tu disposición.',
    },
    {
      id: 'efficiency',
      label: 'Quiero hacer más con menos',
      target: '#ruta-eficiencia',
      hint: 'Integrar lo que ya tienes en una sola operación.',
    },
  ],
};

export interface SceneCopy {
  id: string;
  route: PrimaryRoute | 'shared';
  eyebrow: string;
  title: string;
  body: string;
  /** Texto alternativo cuando el visitante ya eligió ruta. */
  variants?: Partial<Record<PrimaryRoute, { title?: string; body?: string; eyebrow?: string }>>;
  /** Rasgos que activan una variante concreta. */
  traitVariants?: Partial<Record<VisitorTrait, { title?: string; body?: string; eyebrow?: string }>>;
  cta?: { label: string; target: string; event?: string };
  /** El CTA abre el correo de contacto con el contexto de navegación. */
  contact?: boolean;
  product?: string;
}

export const SCENES: SceneCopy[] = [
  {
    id: 'empresa',
    route: 'enterprise',
    eyebrow: 'Ruta empresa',
    title: 'YA TIENES MUCHO CONSTRUIDO.',
    body: 'Ahora haz que tu tecnología trabaje a tu favor. Publia es una red cooperativa de desarrollo: especialistas, desarrolladores, mentores, becarios y agentes de IA a disposición de tu transformación tecnológica. No te obligamos a adoptar una estructura cooperativa: construimos soluciones abiertas, documentadas, interoperables y administrables, con infraestructura exclusiva si la necesitas.',
    cta: { label: 'Ver Memberships para empresa', target: '#escena-compartida', event: 'membership_viewed' },
    product: 'IA soberana · agentes · CRM/ERP · red cooperativa',
  },
  {
    id: 'eficiencia',
    route: 'efficiency',
    eyebrow: 'Ruta eficiencia',
    title: 'HACER MÁS NO SIEMPRE SIGNIFICA GASTAR MÁS.',
    body: 'Tu sitio, tu chatbot, tu agente personal, tus redes, tu contenido con IA, tu soporte humano y tu automatización pueden funcionar como una sola operación. Housings e infraestructura compartida cierran el círculo. Las membresías aparecen cuando el recorrido muestra cómo encaja cada pieza, no antes.',
    cta: { label: 'Ver cómo se conecta', target: '#escena-compartida', event: 'membership_viewed' },
    product: 'Operación integrada · membresías · housing',
  },
  {
    id: 'exploracion',
    route: 'explorer',
    eyebrow: 'Ruta exploración',
    title: 'TODO EL MUNDO QUIERE VENDERTE ALGO.',
    body: 'Nosotros queremos conocerte. Hay dos caminos: crear algo que valga más que su precio, o necesitar ayuda para hacer crecer tu negocio. Elige el que te representa; el resto se va revelando.',
    cta: { label: 'Explorar Ciudadan', target: '#escena-compartida', event: 'cooperative_interest' },
    product: 'Cooperativas · Ciudadan · servicios',
  },
  {
    id: 'escena-compartida',
    route: 'shared',
    eyebrow: 'Lo que ya tienes',
    title: 'LO QUE YA TIENES PUEDE TRABAJAR CONTIGO.',
    body: 'Sitio, contenido, herramientas, equipo y datos. Nuestro trabajo es conectarlos y ponerles un agente encima. Este bloque cambia con lo que elegiste: cada ruta llega aquí con su propia lectura.',
    variants: {
      enterprise: {
        eyebrow: 'Lo que ya tienes',
        title: 'ACTIVOS DIGITALES, CONTROL TOTAL.',
        body: 'Tus datos siguen siendo tuyos. Diseñamos infraestructura privada o dedicada, modelos locales y agentes que se ejecutan dentro de tu perímetro, con trazabilidad y control sobre cada decisión.',
      },
      efficiency: {
        eyebrow: 'Lo que ya tienes',
        title: 'CONECTA LO QUE YA FUNCIONA.',
        body: 'Cada herramienta suelta se vuelve una pieza de una sola operación: contenido, atención, ventas y soporte trabajando con el mismo contexto y los mismos datos.',
      },
      explorer: {
        eyebrow: 'Lo que ya tienes',
        title: 'HAY OTRA FORMA DE ORGANIZAR EL TRABAJO.',
        body: 'Cooperativismo 6.0, Ciudadan, infraestructura compartida, Laborys y publicidad no invasiva: un ecosistema donde el valor se reparte en vez de concentrarse.',
      },
    },
    cta: { label: 'Vamos a conocernos', target: '#escena-cierre', event: 'consultation_requested' },
    product: 'Activos · agentes · nodos',
  },
  {
    id: 'escena-cierre',
    route: 'shared',
    eyebrow: 'Vamos a conocernos',
    title: 'CUENTANOS QUÉ QUIERES CAMBIAR.',
    body: 'No pedimos datos en la exploración. Cuando quieras, dejamos el contexto de lo que viste para que no tengas que repetirte. Diagnóstico, asesoría o ruta de implementación: los precios se cotizan después de entender el caso.',
    cta: { label: 'Solicitar diagnóstico', target: '#contacto', event: 'consultation_requested' },
    product: 'Asesoría · implementación',
    contact: true,
  },
];

/** Mapea ruta -> escena propia. */
export const ROUTE_SCENE: Record<Exclude<PrimaryRoute, 'unclassified'>, string> = {
  enterprise: 'empresa',
  efficiency: 'eficiencia',
  explorer: 'exploracion',
};
