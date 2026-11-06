/**
 * Las 8 soluciones del Ecosistema (P0-04, paquete 7 mundos).
 * Textos portados del prototipo aprobado; los iconos son los PNG reales
 * de `01_ESCENAS_FUENTE/03_ecosistema/assets/` servidos en /assets/ecosistema/.
 */
export interface EcosystemService {
  name: string;
  title: string;
  emoji: string;
  color: string;
  file: string;
  detail: string;
  flow: [string, string, string];
  example: string;
}

export const ECOSYSTEM_SERVICES: readonly EcosystemService[] = [
  { name: 'IA APLICADA', title: 'Inteligencia artificial', emoji: '✦', color: '#66efff', file: '01', detail: 'Modelos y herramientas que ayudan a resolver tareas concretas. Puedes incorporar revisión humana.', flow: ['CONSULTA', 'ANÁLISIS', 'RESPUESTA'], example: 'Una consulta se clasifica y propone una respuesta para revisión.' },
  { name: 'WEB Y TIENDAS', title: 'Sitios web y e-commerce', emoji: '⌘', color: '#84ddff', file: '02', detail: 'Una presencia digital conectada con catálogo, pedidos y canales de contacto.', flow: ['VISITA', 'CATÁLOGO', 'PEDIDO'], example: 'Una persona encuentra un producto y envía su pedido desde la tienda.' },
  { name: 'AGENTES DE IA', title: 'Agentes de IA', emoji: '◉', color: '#a389ff', file: '03', detail: 'Asistentes que ejecutan tareas dentro de reglas y permisos definidos.', flow: ['SOLICITUD', 'AGENTE', 'HUMANO'], example: 'Un agente prepara el seguimiento de una solicitud y la deriva cuando hace falta.' },
  { name: 'COOPERATIVAS', title: 'Cooperación y comunidad', emoji: '✳', color: '#81ffb8', file: '04', detail: 'Conectar personas, capacidades, proyectos y conocimiento compartido.', flow: ['PERSONAS', 'ACUERDOS', 'PROYECTO'], example: 'Varias personas comparten habilidades para desarrollar una solución.' },
  { name: 'MULTIMEDIA', title: 'Producción multimedia', emoji: '▶', color: '#ff73dc', file: '05', detail: 'Imagen, video, audio y experiencias digitales diseñadas para comunicar mejor.', flow: ['IDEA', 'PRODUCCIÓN', 'PUBLICACIÓN'], example: 'Una idea se convierte en piezas de contenido listas para revisar.' },
  { name: 'MARKETING', title: 'Marketing y contenidos', emoji: '↗', color: '#ffcc55', file: '06', detail: 'Campañas, contenidos y seguimiento pensados para públicos y objetivos reales.', flow: ['OBJETIVO', 'CAMPAÑA', 'MEDICIÓN'], example: 'Una campaña organiza contenidos y permite observar su desempeño.' },
  { name: 'ECOLOGÍA', title: 'Tecnología y sostenibilidad', emoji: '❀', color: '#79f5a6', file: '07', detail: 'Evaluar cómo producir, operar y usar tecnología con criterios de sostenibilidad.', flow: ['RECURSOS', 'DISEÑO', 'MEJORA'], example: 'Un proyecto identifica oportunidades de ahorro y eficiencia en recursos.' },
  { name: 'INFRAESTRUCTURA', title: 'Infraestructura distribuida', emoji: '▤', color: '#6ac8ff', file: '08', detail: 'Alojamiento administrado, capacidad tecnológica y sistemas bajo distintos esquemas de control.', flow: ['NODO', 'SERVICIO', 'RED'], example: 'Un nodo ofrece un servicio y coopera con el resto de la infraestructura.' },
] as const;
