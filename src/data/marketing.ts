/**
 * A06 Marketing y Multimedia (E26) — ARQUITECTURA PREPARADA, recursos pendientes.
 * Cuando llegue el paquete A06, sus SVG/PNG van a public/assets/a06/ y se
 * referencian aquí por `art` (ruta opcional). El componente renderiza el
 * recurso si existe; si no, muestra el bloque estructurado sin romper la escena.
 * Las demostraciones son seleccionables (aria-pressed) y no son tabla estática.
 */

export interface MarketingArea {
  id: string;
  name: string;
  desc: string;
  /** recurso opcional del paquete A06 (ej. '/assets/a06/estudio.svg') */
  art?: string;
  icon: string;
}

export interface MarketingDemo {
  id: string;
  areaId: string;
  title: string;
  steps: string[];
  result: string;
  /** recurso opcional del paquete A06 */
  art?: string;
}

export const MARKETING_AREAS: readonly MarketingArea[] = [
  { id: 'estudio', name: 'Estudio creativo y multimedia', desc: 'Identidad, diseño y producción creativa con equipo propio.', icon: '🎨', art: '/assets/a06/estudio.svg' },
  { id: 'pantallas', name: 'Pantallas y herramientas', desc: 'Displays y utilidades de operación independientes.', icon: '🖥️', art: '/assets/a06/pantallas.svg' },
  { id: 'campanas', name: 'Producción de campañas', desc: 'Planeación y producción de campañas con medición.', icon: '📣', art: '/assets/a06/campanas.svg' },
  { id: 'audiovisual', name: 'Contenido audiovisual', desc: 'Video, foto y streaming producido en casa.', icon: '🎬', art: '/assets/a06/audiovisual.svg' },
  { id: 'redes', name: 'Marketing y redes', desc: 'Gestión de comunidades y contenido para redes.', icon: '📱', art: '/assets/a06/redes.svg' },
];

export const MARKETING_DEMOS: readonly MarketingDemo[] = [
  {
    id: 'campana-local',
    areaId: 'campanas',
    title: 'Campaña de lanzamiento local',
    steps: ['Brief del negocio', 'Definición de creatividades', 'Publicación según calendario acordado'],
    result: 'Campaña con calendario y responsables definidos; plazos y alcance según contrato, sin promesas previas.',
  },
  {
    id: 'contenido-mes',
    areaId: 'audiovisual',
    title: 'Mes de contenido audiovisual',
    steps: ['Guion y producción', 'Edición', 'Publicación según calendario'],
    result: 'Contenido programado según lo acordado; el volumen se define en contrato, no se promete de antemano.',
  },
  {
    id: 'redes-comunidad',
    areaId: 'redes',
    title: 'Comunidad en redes',
    steps: ['Voz de marca', 'Calendario editorial', 'Respuesta a mensajes'],
    result: 'Perfil activo con comunidad atendida según lo contratado.',
  },
];
