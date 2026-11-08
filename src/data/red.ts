/**
 * Red Colaborativa de Publia (P0-05, paquete 7 mundos, prototipo 04).
 * Textos portados literalmente del prototipo aprobado; la demo es conceptual.
 */
export interface RedCapability {
  id: string;
  name: string;
  subtitle: string;
  icon: string;
  color: string;
  title: string;
  desc: string;
  example: string;
}

export const RED_CAPABILITIES: readonly RedCapability[] = [
  { id: 'profesionales', name: 'PROFESIONALES', subtitle: 'Talento creativo', icon: '🤝', color: '#ffdc60', title: 'Personas que sí responden', desc: 'Creativos, programadores y asesores que acompañan los proyectos cuando hace falta.', example: 'Una persona del equipo revisa una propuesta y da seguimiento al cliente.' },
  { id: 'agentes', name: 'AGENTES DE IA', subtitle: 'Automatización útil', icon: '🤖', color: '#64ecff', title: 'Agentes que ayudan', desc: 'Asistentes para organizar consultas, preparar contenidos y agilizar tareas, con reglas claras.', example: 'Un agente organiza una consulta y prepara información para que un humano la revise.' },
  { id: 'sitios', name: 'SITIOS Y VENTAS', subtitle: 'Web y tiendas', icon: '🛍️', color: '#fbbf56', title: 'Tu negocio en internet', desc: 'Sitios web, catálogos y comercio electrónico que conectan clientes y operación.', example: 'Una visita llega a la tienda, elige un producto y envía una solicitud.' },
  { id: 'marketing', name: 'MARKETING', subtitle: 'Ideas que conectan', icon: '🎨', color: '#ff76d0', title: 'Creatividad que comunica', desc: 'Diseño, contenidos, redes y campañas adaptadas a lo que quieres construir.', example: 'El equipo prepara una publicación y la IA ayuda con versiones para distintos canales.' },
  { id: 'infraestructura', name: 'INFRAESTRUCTURA', subtitle: 'Privada o compartida', icon: '🖥️', color: '#8ba6ff', title: 'La tecnología detrás', desc: 'Servidores administrados, almacenamiento y herramientas que sostienen los servicios digitales.', example: 'Un servidor aloja herramientas y permite que varias capacidades trabajen juntas.' },
  { id: 'aprendizaje', name: 'APRENDIZAJE', subtitle: 'Soporte y formación', icon: '🎓', color: '#66eeb2', title: 'Aprender también es crecer', desc: 'Asesoría, capacitación y soporte humano para aprovechar las herramientas con autonomía.', example: 'Un negocio aprende a administrar su sitio y entiende cuándo apoyarse en un especialista.' },
] as const;

export interface RedDemo {
  id: 'atencion' | 'ventas' | 'contenido';
  label: string;
  title: string;
  /** Índices de RED_CAPABILITIES que se iluminan en orden. */
  path: readonly number[];
  labels: readonly [string, string, string];
  text: string;
}

export const RED_DEMOS: readonly RedDemo[] = [
  { id: 'atencion', label: '💬 Atención', title: 'Atender mensajes sin perder el trato humano', path: [1, 0, 5], labels: ['LA IA ORGANIZA', 'UNA PERSONA REVISA', 'EL EQUIPO APRENDE'], text: 'Una consulta entra, un agente propone una respuesta y una persona decide qué enviar.' },
  { id: 'ventas', label: '🛍️ Ventas', title: 'Vender en línea con un proceso más claro', path: [2, 1, 0], labels: ['LLEGA UN PEDIDO', 'LA IA ORGANIZA', 'EQUIPO ACOMPAÑA'], text: 'La tienda recibe la solicitud, las herramientas la ordenan y el equipo da seguimiento.' },
  { id: 'contenido', label: '🎬 Contenido', title: 'Crear contenidos de forma más ágil', path: [3, 1, 0], labels: ['EQUIPO CREA', 'AGENTE PREPARA', 'HUMANO APRUEBA'], text: 'La creatividad marca el rumbo, la IA ayuda con borradores y una persona valida.' },
] as const;

export const CIUDADAN_LINK = 'https://ciudadan.org';
