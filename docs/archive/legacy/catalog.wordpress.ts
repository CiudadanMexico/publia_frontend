/**
 * Configuración comercial: membresías, complementos, housing, cooperativas,
 * capacitación y asesoría.
 *
 * Reglas de la misión que este archivo respeta:
 * - Todos los precios en pesos mexicanos.
 * - La asignación mensual de Laborys es configurable y está pendiente de
 *   confirmación: se declara como `null`, nunca como una cantidad inventada.
 * - No se prometen respuestas garantizadas, atención humana ilimitada ni
 *   capacidad de cómputo sin límite.
 * - Chatbot y agente se presentan como cosas distintas.
 */

export interface Membership {
  slug: string;
  name: string;
  priceMxn: number | null;
  priceNote?: string;
  summary: string;
  includes: string[];
  excludes: string[];
  /** Condiciones operativas explícitas (no promesas). */
  conditions: string[];
  /** Asignación mensual de Laborys: pendiente de confirmación comercial. */
  laborysMonthly: number | null;
  highlights: string[];
}

export const MEMBERSHIPS: Membership[] = [
  {
    slug: 'base',
    name: 'BASE',
    priceMxn: 300,
    summary: 'Hosting, WordPress o WooCommerce y atención con chatbot de WhatsApp.',
    includes: [
      'Hosting.',
      'WordPress o WooCommerce.',
      'Chatbot de WhatsApp para atención a clientes.',
      'Integración con sitio existente o implementación inicial cotizada aparte.',
      'Laborys mensuales (cantidad por confirmar).',
    ],
    excludes: [
      'No incluye agente personal.',
      'El dominio se paga aparte.',
      'El consumo de IA se paga con API propia, Laborys si el servicio lo permite o modelos gratuitos disponibles.',
    ],
    conditions: [],
    laborysMonthly: null,
    highlights: ['Operación mínima', 'Sin agente personal'],
  },
  {
    slug: 'agente',
    name: 'AGENTE',
    priceMxn: null,
    priceNote: 'Precio objetivo: $500–$600 MXN/mes (por confirmar comercialmente).',
    summary: 'Base más un agente personal para un usuario.',
    includes: [
      'Todo lo de BASE.',
      'Un agente personal para un usuario.',
      'Capacidad de investigar, redactar, organizar, analizar y ejecutar tareas autorizadas.',
      'Integraciones según configuración.',
    ],
    excludes: [
      'No es una bolsa de horas artificial.',
      'El tiempo de respuesta puede variar según saturación y capacidad técnica.',
    ],
    conditions: [
      'No se prometen recursos ilimitados.',
      'La disponibilidad del agente no equivale a capacidad de cómputo ilimitada.',
    ],
    laborysMonthly: null,
    highlights: ['Un agente personal', 'Sin bolsa de horas'],
  },
  {
    slug: 'crecimiento',
    name: 'CRECIMIENTO',
    priceMxn: 2000,
    summary: 'Base, un agente personal, derivación a humanos, redes y contenido con IA.',
    includes: [
      'Todo lo de BASE.',
      'Un agente personal para un usuario.',
      'Chatbot con derivación hacia varios humanos elegidos por el negocio.',
      'Gestión de 2–3 redes.',
      'Aproximadamente 8 piezas de contenido mensuales, principalmente producidas con IA.',
      'Programación, copys y adaptación básica.',
      'Laborys mensuales (cantidad por confirmar).',
    ],
    excludes: ['La producción humana especializada se cobra aparte.'],
    conditions: [],
    laborysMonthly: null,
    highlights: ['8 piezas/mes', '2–3 redes'],
  },
  {
    slug: 'operacion',
    name: 'OPERACIÓN',
    priceMxn: 3000,
    summary: 'Lo anterior con presencia multicanal ampliada y soporte humano de primer nivel.',
    includes: [
      'Todo lo de CRECIMIENTO.',
      'Presencia multicanal ampliada.',
      'Aproximadamente 12 piezas mensuales con IA.',
      'Soporte humano de primer nivel mediante red de becarios capacitados.',
    ],
    excludes: ['La disponibilidad humana es compartida entre clientes.'],
    conditions: [
      'No equivale a un trabajador exclusivo.',
      'Ventana aproximada de cuatro horas diarias.',
      'Bolsa limitada de atención efectiva, pendiente de fijar comercialmente.',
      'La IA recibe y clasifica solicitudes; los casos humanos entran a una cola.',
    ],
    laborysMonthly: null,
    highlights: ['12 piezas/mes', 'Cola humana'],
  },
  {
    slug: 'cobertura',
    name: 'COBERTURA',
    priceMxn: 4000,
    summary: 'Nivel Operación con cobertura humana organizada entre varios becarios.',
    includes: [
      'Todas las prestaciones del nivel OPERACIÓN.',
      'Cobertura humana organizada entre varios becarios de 9:00 a 18:00, conforme al calendario de servicio.',
    ],
    excludes: [],
    conditions: [
      'Capacidad limitada de atención efectiva por cliente.',
      'No equivale a nueve horas de trabajo humano exclusivo.',
      'La diferencia principal es la amplitud de la ventana de cobertura, no más contenido.',
    ],
    laborysMonthly: null,
    highlights: ['Ventana 9:00–18:00', 'Varios becarios'],
  },
];

export interface ServiceFamily {
  id: string;
  name: string;
  items: string[];
  note?: string;
}

export const SERVICE_FAMILIES: ServiceFamily[] = [
  {
    id: 'marketing',
    name: 'Marketing y comunicación',
    items: [
      'Redes sociales',
      'Contenido con IA',
      'Community management',
      'SEO',
      'Campañas tradicionales',
      'Gestión de anuncios',
      'Publicidad no invasiva experimental',
    ],
  },
  {
    id: 'desarrollo',
    name: 'Desarrollo',
    items: [
      'Sitios web',
      'E-commerce',
      'Aplicaciones',
      'Integraciones',
      'Sistemas',
      'Automatizaciones',
      'Desarrollo personalizado',
    ],
  },
  {
    id: 'ia',
    name: 'IA',
    items: ['Agentes', 'Modelos locales', 'Integraciones', 'Implementaciones', 'Capacitación práctica'],
  },
  {
    id: 'personas',
    name: 'Personas',
    items: [
      'Soporte adicional',
      'Más cobertura',
      'Becarios capacitados',
      'Especialistas',
      'Red de skills',
    ],
  },
  {
    id: 'produccion',
    name: 'Producción',
    items: [
      'Fotografía',
      'Video',
      'Animación',
      'Casting',
      'Influencers',
      'Eventos',
      'Activaciones',
      'Streaming',
      'Impresión y maquila publicitaria',
    ],
  },
  {
    id: 'infraestructura',
    name: 'Infraestructura',
    items: ['Hosting', 'Housing', 'Sistemas privados', 'Administración', 'Herramientas abiertas'],
  },
  {
    id: 'economia',
    name: 'Economía',
    items: ['Laborys', 'Integraciones de criptomonedas', 'Soluciones económicas del ecosistema'],
  },
];

export interface HousingMode {
  id: 'compartida' | 'privada';
  name: string;
  monthlyMxn: number | null;
  summary: string;
  allocation: Array<{ label: string; percent: number }>;
  includes: string[];
  conditions: string[];
}

export const HOUSING: {
  hardware: Array<{ label: string; value: string; confirmed: boolean }>;
  financing: string;
  modes: HousingMode[];
  principles: string[];
} = {
  hardware: [
    { label: 'GPU objetivo', value: 'Tipo RTX 4060', confirmed: true },
    { label: 'Memoria', value: '64 GB RAM', confirmed: true },
    { label: 'Resto de especificaciones', value: 'Por definir según inventario y costos', confirmed: false },
  ],
  financing:
    'El equipo se incorpora mediante un esquema de adquisición o financiamiento a 12 MSI con plazo de permanencia contractual. La propiedad del hardware, las condiciones de salida y las licencias deben definirse contractualmente antes de publicar promesas definitivas.',
  modes: [
    {
      id: 'compartida',
      name: 'Modalidad compartida',
      // Nunca publicar $0 como tarifa confirmada: la mensualidad administrativa
      // es candidata pendiente de confirmación comercial (ver memberships/housing.ts).
      monthlyMxn: null,
      summary:
        'El cliente aporta equipo, espacio, electricidad y conexión; el cómputo se reparte entre el cliente, la red de socios y becarios, y los usuarios con membresía del ecosistema.',
      allocation: [
        { label: 'Cliente', percent: 50 },
        { label: 'Red de socios y becarios', percent: 25 },
        { label: 'Usuarios con membresía', percent: 25 },
      ],
      includes: [
        'Agentes.',
        'Infraestructura administrada.',
        'Herramientas open source configuradas.',
        'Una cantidad fija de Laborys mensuales.',
        'Una pequeña comisión variable por consumo de recursos compartidos.',
      ],
      conditions: [
        'El cliente es responsable de la disponibilidad física de su equipo y de sus propios agentes.',
        'La red compartida puede tener redundancia para sus usuarios.',
      ],
    },
    {
      id: 'privada',
      name: 'Modalidad privada',
      monthlyMxn: null,
      summary:
        'El cliente paga una mensualidad por uso exclusivo de la capacidad contratada y no comparte recursos salvo que voluntariamente lo elija.',
      allocation: [{ label: 'Cliente', percent: 100 }],
      includes: ['Capacidad contratada en exclusiva', 'Administración del entorno'],
      conditions: ['La mensualidad se define al dimensionar la capacidad contratada.'],
    },
  ],
  principles: [
    'El cliente puede ejecutar sistemas multiagente dentro de sus recursos disponibles.',
    'No se limita artificialmente el número de agentes por membresía.',
    'Los límites reales son hardware, concurrencia, almacenamiento, seguridad y configuración.',
    'Se pueden usar modelos locales, APIs propias, proveedores externos, modelos gratuitos, herramientas open source, aplicaciones propias y automatizaciones.',
    'La configuración inicial se cobra aparte.',
    'El software Ciudadan está sujeto a las condiciones de licencia y permanencia acordadas.',
  ],
};

export interface AdvisoryOffer {
  id: string;
  name: string;
  description: string;
  duration: string;
  deliverables: string[];
  priceMxn: number | null;
}

export const ADVISORY: AdvisoryOffer[] = [
  {
    id: 'orientacion-inicial',
    name: 'Orientación inicial',
    description: 'Breve evaluación comercial y tecnológica.',
    duration: 'A definir',
    deliverables: ['Diagnóstico inicial del contexto', 'Orientación sobre siguientes pasos'],
    priceMxn: null,
  },
  {
    id: 'diagnostico',
    name: 'Diagnóstico',
    description: 'Revisión de situación, herramientas, procesos y oportunidades.',
    duration: 'A definir',
    deliverables: ['Inventario de herramientas y procesos', 'Mapa de oportunidades'],
    priceMxn: null,
  },
  {
    id: 'ruta-implementacion',
    name: 'Ruta de implementación',
    description: 'Documento con prioridades, alcance, fases y presupuesto.',
    duration: 'A definir',
    deliverables: ['Prioridades', 'Alcance', 'Fases', 'Presupuesto'],
    priceMxn: null,
  },
  {
    id: 'acompanamiento',
    name: 'Acompañamiento',
    description: 'Sesiones y seguimiento para proyectos que requieren apoyo continuado.',
    duration: 'A definir',
    deliverables: ['Sesiones de seguimiento', 'Ajustes sobre la marcha'],
    priceMxn: null,
  },
];

export interface TrainingModule {
  id: string;
  name: string;
  audience: string;
  replicable: boolean;
}

export const TRAINING: TrainingModule[] = [
  { id: 'chatbot', name: 'Introducción al chatbot', audience: 'Responsables de negocio', replicable: true },
  { id: 'agente', name: 'Uso del agente', audience: 'Usuarios del agente', replicable: true },
  { id: 'herramientas', name: 'Administración de herramientas', audience: 'Administradores internos', replicable: true },
  { id: 'ia-procesos', name: 'IA en procesos', audience: 'Equipos operativos', replicable: true },
  { id: 'configuracion', name: 'Configuración operativa', audience: 'Personal capacitado', replicable: true },
  { id: 'equipos', name: 'Capacitación para responsables internos', audience: 'Líderes de área', replicable: true },
];

export interface CooperativeCapability {
  id: string;
  name: string;
  status: 'existente' | 'en-desarrollo' | 'planeado';
  note?: string;
}

export const COOPERATIVES: CooperativeCapability[] = [
  { id: 'consumo', name: 'Herramientas para cooperativas de consumo', status: 'en-desarrollo' },
  { id: 'directorio', name: 'Directorio de cooperativas', status: 'planeado' },
  { id: 'membros', name: 'Organización de miembros', status: 'planeado' },
  { id: 'roles', name: 'Roles y comunicación', status: 'en-desarrollo' },
  { id: 'gobernanza', name: 'Participación y gobernanza', status: 'planeado' },
  { id: 'comercio', name: 'Comercio entre organizaciones y marketplace', status: 'planeado' },
  { id: 'infraestructura', name: 'Infraestructura compartida', status: 'existente' },
  { id: 'formacion', name: 'Formación práctica', status: 'existente' },
  { id: 'laborys', name: 'Laborys', status: 'en-desarrollo' },
  { id: 'publicidad', name: 'Publicidad no invasiva (estudio en curso)', status: 'en-desarrollo' },
  { id: 'red', name: 'Red de desarrollo', status: 'existente' },
  { id: 'herramientas', name: 'Herramientas abiertas', status: 'en-desarrollo' },
];
