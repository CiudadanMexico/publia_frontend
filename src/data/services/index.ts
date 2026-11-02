/**
 * Catálogo de servicios de Publia 6.0.
 *
 * Tres fuentes, distinguidas por `source`:
 *
 * - `catalogo-actual`: familias comerciales vigentes (membresías y
 *   complements). Los precios confirmados vienen de `src/data/memberships`.
 * - `snapshot-precios`: servicios del catálogo anterior de WordPress. Los
 *   precios son **reales** (leídos de la columna `_price` de la base) y se
 *   presentan como venta puntual, no como membresía.
 * - `brief`: ofertas del brief actual sin tarifa publicada (asesoría,
 *   capacitación, Club de Influencers). Su precio es `null` y se cotiza.
 *
 * Regla: si no hay precio confirmado, `priceMxn` es `null` y
 * `quoteRequired` es `true`. No seEstimate rangos ni se inventan cifras.
 */

import type {
  AdvisoryOffer,
  CooperativeOffering,
  Service,
  ServiceFamily,
  ServiceSource,
  ServiceStatus,
  TrainingModule,
} from './types';

export type {
  AdvisoryOffer,
  CooperativeOffering,
  Service,
  ServiceFamily,
  ServiceSource,
  ServiceStatus,
  TrainingModule,
} from './types';

/** Servicios del catálogo anterior de WordPress (precios reales de la base). */
const LEGACY_SERVICES: ReadonlyArray<
  Pick<Service, 'id' | 'name' | 'priceMxn' | 'publishable'> &
    Partial<Pick<Service, 'priceFrom' | 'priceTo' | 'priceConfirmed' | 'quoteRequired'>>
> = [
  { id: 'desarrollo-web-apps', name: 'Desarrollo Web & Apps', priceMxn: 150, publishable: true },
  { id: 'ecommerce-a-medida', name: 'E-commerce a medida', priceMxn: 200, publishable: true },
  { id: 'chatbots-inteligentes', name: 'ChatBots Inteligentes', priceMxn: 200, publishable: true },
  { id: 'chatbots-semiinteligentes', name: 'ChatBots SemiInteligentes', priceMxn: 200, publishable: true },
  { id: 'chatbots-whatsapp-messenger', name: 'ChatBots WhatsApp y FB Messenger', priceMxn: 200, publishable: true },
  { id: 'diseno-web-basico', name: 'Diseño Web Básico', priceMxn: 200, publishable: true },
  { id: 'campanas-social-seo-ads', name: 'Campañas Social Media, SEO y ads', priceMxn: 500, publishable: true },
  { id: 'edicion-video-inteligente', name: 'Edición de Video Inteligente', priceMxn: 500, publishable: true },
  { id: 'produccion-multimedia', name: 'Producción MultiMedia Digital', priceMxn: 500, publishable: true },
  { id: 'organizacion-eventos', name: 'Organización de Eventos', priceMxn: 500, publishable: true },
  { id: 'asesorias-ia', name: 'Asesorías I.A.', priceMxn: 800, publishable: true },
  { id: 'foto-producto', name: 'Foto de Producto', priceMxn: 800, publishable: true },
  { id: 'servidores-ia-empresariales', name: 'Servidores I.A. Empresariales', priceMxn: 800, publishable: true },
  { id: 'gestion-empresarial-movil', name: 'Gestión Empresarial Móvil', priceMxn: 5000, publishable: true },
  { id: 'diseno-web-personalizado', name: 'Diseño Web Personalizado', priceMxn: 5000, publishable: true },
  { id: 'sistemas-reparto-entregas', name: 'Sistemas de Reparto y Entregas', priceMxn: 200, publishable: true },
  { id: 'sistemas-entrega-reparto-cobranza', name: 'Sistemas de Entrega, Reparto y Cobranza', priceMxn: 1500, publishable: true },
  { id: 'desarrollo-aplicaciones', name: 'Desarrollo de Aplicaciones', priceMxn: 10000, publishable: true },
  // Producto de prueba interno: no se publica.
  { id: 'sucri-prueba', name: 'Sucri (prueba)', priceMxn: 15, publishable: false },
];

/** Familia a la que pertenece cada servicio heredado. */
const LEGACY_FAMILY: Record<string, string> = {
  'desarrollo-web-apps': 'desarrollo',
  'ecommerce-a-medida': 'desarrollo',
  'chatbots-inteligentes': 'ia',
  'chatbots-semiinteligentes': 'ia',
  'chatbots-whatsapp-messenger': 'ia',
  'diseno-web-basico': 'desarrollo',
  'diseno-web-personalizado': 'desarrollo',
  'desarrollo-aplicaciones': 'desarrollo',
  'campanas-social-seo-ads': 'marketing',
  'edicion-video-inteligente': 'produccion',
  'produccion-multimedia': 'produccion',
  'organizacion-eventos': 'personas',
  'asesorias-ia': 'ia',
  'foto-producto': 'produccion',
  'servidores-ia-empresariales': 'infraestructura',
  'gestion-empresarial-movil': 'personas',
  'sistemas-reparto-entregas': 'personas',
  'sistemas-entrega-reparto-cobranza': 'personas',
  'sucri-prueba': 'economia',
};

/** Servicios heredados con precio real, ya normalizados al tipo `Service`. */
export const LEGACY_SERVICE_ITEMS: readonly Service[] = LEGACY_SERVICES.map((service) => ({
  ...service,
  familyId: LEGACY_FAMILY[service.id] ?? 'desarrollo',
  description: `Servicio puntual del catálogo anterior de Publia. Precio de venta única en MXN; la operación sostenida se cotiza como membresía.`,
  status: 'existente' as ServiceStatus,
  priceFrom: service.priceMxn,
  priceTo: service.priceMxn,
  priceConfirmed: true,
  quoteRequired: false,
  source: 'snapshot-precios' as ServiceSource,
  portalAvailable: true,
}));

/** Familias comerciales vigentes con sus servicios. */
export const SERVICE_FAMILIES: readonly ServiceFamily[] = [
  {
    id: 'marketing',
    name: 'Marketing y comunicación',
    description:
      'Comunicación que se sostiene en cooperativa: contenido, campañas y publicación continua.',
    status: 'existente',
    items: ['Gestión de redes', 'Campañas', 'Contenido', 'Presencia digital'],
    services: LEGACY_SERVICE_ITEMS.filter((service) => service.familyId === 'marketing'),
    soldSeparately: true,
  },
  {
    id: 'desarrollo',
    name: 'Desarrollo',
    description: 'Sitios, e-commerce y aplicaciones construidos para durar y poder crecer.',
    status: 'existente',
    items: ['Sitios', 'E-commerce', 'Aplicaciones'],
    services: LEGACY_SERVICE_ITEMS.filter((service) => service.familyId === 'desarrollo'),
    soldSeparately: true,
  },
  {
    id: 'ia',
    name: 'IA',
    description: 'Chatbots, asistentes y asesorías que se integran al trabajo diario.',
    status: 'existente',
    items: ['Chatbots', 'Agentes', 'Asesoría IA'],
    services: LEGACY_SERVICE_ITEMS.filter((service) => service.familyId === 'ia'),
    soldSeparately: true,
  },
  {
    id: 'personas',
    name: 'Personas',
    description: 'Capacitación, eventos y operaciones con equipo humano detrás.',
    status: 'existente',
    items: ['Capacitación', 'Eventos', 'Operación'],
    services: LEGACY_SERVICE_ITEMS.filter((service) => service.familyId === 'personas'),
    soldSeparately: true,
  },
  {
    id: 'produccion',
    name: 'Producción',
    description: 'Video, fotografía y piezas multiMedia listas para publicar.',
    status: 'existente',
    items: ['Video', 'Fotografía', 'MultiMedia'],
    services: LEGACY_SERVICE_ITEMS.filter((service) => service.familyId === 'produccion'),
    soldSeparately: true,
  },
  {
    id: 'infraestructura',
    name: 'Infraestructura',
    description: 'Servidores y nodos compartidos dentro del ecosistema.',
    status: 'existente',
    items: ['Servidores', 'Nodos', 'Housing'],
    services: LEGACY_SERVICE_ITEMS.filter((service) => service.familyId === 'infraestructura'),
    soldSeparately: true,
  },
  {
    id: 'economia',
    name: 'Economía',
    description: 'Modelos de reparto y retorno transparente para la economía del ecosistema.',
    status: 'en-desarrollo',
    items: ['Club de Influencers', 'Reparto de ingresos', 'Membresías'],
    services: LEGACY_SERVICE_ITEMS.filter((service) => service.familyId === 'economia'),
    soldSeparately: false,
    pending: ['Definir el modelo de reparto del Club de Influencers.'],
  },
];

/** Servicios con precio confirmado, listos para publicar. */
export const PUBLISHABLE_SERVICES: readonly Service[] = LEGACY_SERVICE_ITEMS.filter(
  (service) => service.publishable !== false,
);

/** Ofertas de asesoría sin tarifa publicada (se cotizan). */
export const ADVISORY_OFFERS: readonly AdvisoryOffer[] = [
  {
    id: 'orientacion-inicial',
    name: 'Orientación inicial',
    description: 'Lectura del contexto del negocio y encuadre del problema antes de proponer nada.',
    duration: 'a definir',
    deliverables: ['Diagnóstico inicial', 'Mapa de oportunidades'],
    priceMxn: null,
    quoteRequired: true,
    status: 'existente',
  },
  {
    id: 'diagnostico',
    name: 'Diagnóstico',
    description: 'Revisión de procesos, herramientas y capacidad instalada.',
    duration: 'a definir',
    deliverables: ['Informe de hallazgos', 'Prioridades por impacto y esfuerzo'],
    priceMxn: null,
    quoteRequired: true,
    status: 'existente',
  },
  {
    id: 'ruta-implementacion',
    name: 'Ruta de implementación',
    description: 'Plan de trabajo por fases, con responsables y entregables verificables.',
    duration: 'a definir',
    deliverables: ['Hoja de ruta', 'Alcance por fase'],
    priceMxn: null,
    quoteRequired: true,
    status: 'existente',
  },
  {
    id: 'acompanamiento',
    name: 'Acompañamiento',
    description: 'Acompañamiento durante la adopción: el equipo ejecuta, nosotros vigilamos el ritmo.',
    duration: 'a definir',
    deliverables: ['Sesiones de seguimiento', 'Ajustes de plan'],
    priceMxn: null,
    quoteRequired: true,
    status: 'existente',
  },
];

/** Capacitación práctica: módulos replicables, incluidos o cobrables aparte. */
export const TRAINING_MODULES: readonly TrainingModule[] = [
  {
    id: 'chatbot',
    name: 'Introducción al chatbot',
    audience: 'Responsables de negocio',
    replicable: true,
    includedInBase: false,
    pending: 'Definir el precio del módulo.',
  },
  {
    id: 'agente',
    name: 'Uso del agente',
    audience: 'Usuarios del agente',
    replicable: true,
    includedInBase: false,
    pending: 'Definir el precio del módulo.',
  },
  {
    id: 'herramientas',
    name: 'Administración de herramientas',
    audience: 'Administradores internos',
    replicable: true,
    includedInBase: false,
    pending: 'Definir el precio del módulo.',
  },
  {
    id: 'ia-procesos',
    name: 'IA en procesos',
    audience: 'Equipos operativos',
    replicable: true,
    includedInBase: false,
    pending: 'Definir el precio del módulo.',
  },
  {
    id: 'configuracion',
    name: 'Configuración operativa',
    audience: 'Personal capacitado',
    replicable: true,
    includedInBase: false,
    pending: 'Definir el precio del módulo.',
  },
  {
    id: 'equipos',
    name: 'Capacitación para responsables internos',
    audience: 'Líderes de área',
    replicable: true,
    includedInBase: false,
    pending: 'Definir el precio del módulo.',
  },
];

/** Capacidades cooperativas con estado explícito. */
export const COOPERATIVE_OFFERINGS: readonly CooperativeOffering[] = [
  {
    id: 'ciudadan',
    name: 'Ciudadan',
    status: 'existente',
    note: 'Infraestructura compartida y comunidad de nodos.',
    priceMxn: null,
    quoteRequired: true,
    portalAvailable: true,
  },
  {
    id: 'cooperativas-6',
    name: 'Cooperativas 6.0',
    status: 'en-desarrollo',
    note: 'Modelo de producción compartida con reparto transparente.',
    priceMxn: null,
    quoteRequired: true,
    portalAvailable: null,
  },
  {
    id: 'club-influencers',
    name: 'Club de Influencers',
    status: 'planeado',
    note: 'Espacio previsto para creadores y voices con intercambio de audiences.',
    priceMxn: null,
    quoteRequired: true,
    portalAvailable: false,
  },
];
