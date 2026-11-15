/**
 * Textos literales de la orden 7M-H (14 nov 2026). DSH los implementa tal
 * cual; no se reescriben ni se generan. Archivo escrito a mano (como copy7mg).
 */

export const UMBRAL_7MH = {
  eyebrow: 'A TU MANERA',
  titleA: 'Se nota que prefieres abrir',
  titleRed: 'tu propio camino',
  titleB: '.',
  lead: 'Bien. Aquí tú marcas el ritmo.',
  body: 'Conecta tu negocio con tecnología, talento y conocimiento compartido. Esa misma colaboración puede impulsar cooperativas y comunidades productivas con mayor autonomía.',
  alt: 'Ecoaldea productiva conectada en red',
  caption: 'Comunidades productivas conectadas: la imagen ilustra la visión; tu punto de partida puede ser una sola tarea.',
} as const;

export interface UmbralTool {
  id: 'whatsapp' | 'agent' | 'automation' | 'tasks';
  icon: 'whatsapp' | 'robot' | 'workflow' | 'checklist';
  title: string;
  body: string;
}

export const UMBRAL_TOOLS: UmbralTool[] = [
  {
    id: 'whatsapp',
    icon: 'whatsapp',
    title: 'WhatsApp conectado',
    body: 'Responde preguntas frecuentes, reúne los datos de una consulta y deriva a una persona cuando hace falta.',
  },
  {
    id: 'agent',
    icon: 'robot',
    title: 'Un agente a tu lado',
    body: 'Prepara información, organiza pendientes y trabaja con las herramientas y permisos que tú le das.',
  },
  {
    id: 'automation',
    icon: 'workflow',
    title: 'Automatizaciones que conectan',
    body: 'Une formularios, pedidos, recordatorios y seguimiento para evitar capturar lo mismo una y otra vez.',
  },
  {
    id: 'tasks',
    icon: 'checklist',
    title: 'Tareas con seguimiento',
    body: 'Distingue lo que está en proceso, lo que necesita tu revisión y lo que ya quedó resuelto.',
  },
];

export interface SimPreset {
  id: string;
  label: string;
  tasks: number;
  minutes: number;
  fraction: number;
  adoption: number;
}

export const SIM_7MH = {
  title: '¿Dónde recuperarías más tiempo?',
  lead: 'Elige una tarea y ajusta el escenario a tu semana.',
  editableBadge: 'Ejemplo editable',
  customPresetLabel: 'Mi propio escenario',
  presets: [
    { id: 'wa', label: 'Consultas por WhatsApp', tasks: 80, minutes: 6, fraction: 60, adoption: 70 },
    { id: 'followup', label: 'Seguimiento de clientes', tasks: 40, minutes: 10, fraction: 50, adoption: 60 },
    { id: 'docs', label: 'Documentos y reportes', tasks: 12, minutes: 35, fraction: 45, adoption: 60 },
    { id: 'admin', label: 'Pendientes administrativos', tasks: 50, minutes: 8, fraction: 50, adoption: 70 },
  ] as SimPreset[],
  fields: {
    tasks: 'Tareas por semana',
    minutes: 'Minutos por tarea',
    fraction: 'Porción automatizable (%)',
    adoption: 'Implementación (%)',
  },
  limits: {
    tasks: [0, 500, 1],
    minutes: [1, 240, 1],
    fraction: [0, 100, 1],
    adoption: [0, 100, 1],
  },
  results: {
    total: 'Tiempo actual por semana',
    potential: 'Tiempo potencialmente liberado',
    remaining: 'Tiempo restante estimado',
  },
  formula: 'tareas × minutos ÷ 60 · potencial = actual × porción ÷ 100 × implementación ÷ 100 · restante = actual − potencial',
  formulaTitle: 'Cómo se calcula',
  note: 'Estimación basada en tus datos; el resultado depende de la tarea y de cómo se implemente.',
  cta: 'Quiero automatizar estas tareas',
  error: 'Revisa los valores: deben estar dentro de los límites indicados.',
  barLabel: 'Distribución del tiempo semanal',
  units: 'h',
} as const;

export interface UmbralPanel {
  id: string;
  title: string;
  teaser: string;
  body: string[];
}

export const UMBRAL_PANELS: UmbralPanel[] = [
  {
    id: 'ciudadan',
    title: 'Ciudadan y el cooperativismo 6.0',
    teaser: 'Tecnología y organización para producir con más autonomía.',
    body: [
      'Publia es la puerta de entrada para resolver necesidades concretas de tu negocio: comunicación, ventas, herramientas digitales y automatización. Ciudadan conecta ese trabajo con una red de comunidades, profesionales y espacios productivos que comparten conocimiento y capacidades.',
      'El cooperativismo 6.0 combina cooperación, tecnología abierta y organización digital. Cada proyecto puede conservar su identidad y sus decisiones mientras colabora con otros, aprende de lo que ya funciona y aporta lo que sabe hacer.',
    ],
  },
  {
    id: 'labory',
    title: 'Labory: valor que circula dentro de la red',
    teaser: 'Una unidad de intercambio para conectar aportaciones y servicios.',
    body: [
      'Labory es la unidad de intercambio propuesta para el ecosistema Ciudadan. Su propósito es facilitar que el valor aportado a la red pueda circular entre actividades y servicios participantes.',
      'Cada programa debe indicar cómo se obtienen, dónde se utilizan y qué condiciones aplican. Antes de participar podrás conocer esas reglas; no equivalen por sí solos a una promesa de ingresos, rendimiento o conversión a pesos.',
    ],
  },
  {
    id: 'ads',
    title: 'Publicidad por elección',
    teaser: 'Tú decides cuándo participar y qué espacio quieres compartir.',
    body: [
      'La publicidad compartida busca conectar proyectos y públicos dentro del ecosistema mediante una participación voluntaria. Cada propuesta debe explicar qué se difundirá, en qué canal aparecerá, durante cuánto tiempo y qué recibe quien participa.',
      'Conocer una iniciativa no te incorpora automáticamente a una campaña. La participación se acuerda para cada caso, con condiciones claras sobre los contenidos, los espacios y la forma de terminarla.',
    ],
  },
  {
    id: 'comunidades',
    title: 'Comunidades que producen y comparten',
    teaser: 'Del negocio cotidiano a talleres, microfábricas y comunidades conectadas.',
    body: [
      'La visión reúne ecoaldeas, talleres, microfábricas y espacios de aprendizaje capaces de desarrollar su propia actividad. La tecnología permite documentar procesos, coordinar trabajo y compartir soluciones que otras comunidades pueden adaptar a su contexto.',
      'La autonomía crece cuando también existen capacidades productivas: herramientas, formación, energía, servicios y redes de colaboración. La imagen muestra esa visión; el punto de partida puede ser una tarea, un negocio o un equipo que decide organizarse de otra manera.',
    ],
  },
];

/** Paleta 7M-H §4 del umbral. */
export const UMBRAL_PALETTE = {
  bg: '#FFFCFA',
  ink: '#26141A',
  red: '#B51F3A',
  coral: '#EE725F',
  surface: '#FBE9E7',
  band: '#A91E38',
  bandInk: '#FFFFFF',
} as const;
