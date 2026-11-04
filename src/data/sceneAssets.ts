/**
 * Manifiesto de assets por escena (dirección de arte v3, doc 04).
 *
 * Cada slot A01–A10 mapea escena → recurso de escritorio → recorte móvil →
 * capas → preload → fallback. Mientras los assets reales se producen en
 * paralelo, las escenas muestran placeholders procedurales de calidad y el
 * atributo `data-asset-ready` queda en "false"; al llegar la imagen a
 * `public/assets/scenes/<id>-<variant>.webp` basta con apuntar `src` aquí y
 * el arte real sustituye al placeholder SIN tocar componentes.
 */
export interface AssetSlot {
  id: string;
  /** Escenas que lo usan. */
  scenes: string[];
  /** Ruta tentativa del recurso real (escritorio). */
  desktop: string;
  /** Recorte vertical para móvil. */
  mobile: string;
  /** Capas opcionales (objeto alpha, VFX). */
  layers?: string[];
  /** Precargar al entrar a la escena (prioridad). */
  preload?: boolean;
  /** Descripción accesible. */
  alt: string;
}

export const SCENE_ASSETS: readonly AssetSlot[] = [
  {
    id: 'A01',
    scenes: ['E00', 'E02'],
    desktop: '/assets/scenes/A01-tunel-prismatico-2560x1440.webp',
    mobile: '/assets/scenes/A01-tunel-prismatico-1080x1350.webp',
    layers: ['/assets/scenes/A01-overlay.png'],
    preload: true,
    alt: 'Túnel prismático elegante con líneas de energía azules y amarillas, profundidad real.',
  },
  {
    id: 'A02',
    scenes: ['E25'],
    desktop: '/assets/scenes/A02-galaxia-soluciones-2560x1440.webp',
    mobile: '/assets/scenes/A02-galaxia-soluciones-1080x1350.webp',
    layers: ['/assets/scenes/A02-cluster-1.png', '/assets/scenes/A02-cluster-2.png', '/assets/scenes/A02-cluster-3.png', '/assets/scenes/A02-cluster-4.png'],
    preload: false,
    alt: 'Universo de herramientas y objetos digitales flotando con la P como guía.',
  },
  {
    id: 'A03',
    scenes: ['E07', 'E08', 'E09', 'E06'],
    desktop: '/assets/scenes/A03-flujo-automatizacion-1920x1080.webp',
    mobile: '/assets/scenes/A03-flujo-automatizacion-1080x1350.webp',
    layers: ['/assets/scenes/A03-vineta-1.png', '/assets/scenes/A03-vineta-2.png', '/assets/scenes/A03-vineta-3.png', '/assets/scenes/A03-vineta-4.png'],
    preload: true,
    alt: 'Secuencia visual «consulta → clasificación → persona → seguimiento», interfaz clara.',
  },
  {
    id: 'A04',
    scenes: ['E03', 'E04', 'E06', 'E21'],
    desktop: '/assets/scenes/A04-infraestructura-2560x1440.webp',
    mobile: '/assets/scenes/A04-infraestructura-1080x1350.webp',
    layers: ['/assets/scenes/A04-rack-1200x1600.png'],
    preload: true,
    alt: 'Rack de servidores premium en espacio oscuro azul cobalto con paneles cian y líneas doradas.',
  },
  {
    id: 'A05',
    scenes: ['E15', 'E16', 'E17'],
    desktop: '/assets/scenes/A05-geonodos-2560x1440.webp',
    mobile: '/assets/scenes/A05-geonodos-1080x1350.webp',
    layers: ['/assets/scenes/A05-nodo-1.png', '/assets/scenes/A05-nodo-2.png', '/assets/scenes/A05-nodo-3.png'],
    preload: true,
    alt: 'Microcomunidades conectadas por luz verde y cian: aprendizaje, herramientas y capacidades compartidas.',
  },
  {
    id: 'A06',
    scenes: ['E26'],
    desktop: '/assets/scenes/A06-marketing-multimedia-1920x1080.webp',
    mobile: '/assets/scenes/A06-marketing-multimedia-1080x1350.webp',
    preload: false,
    alt: 'Collage dinámico de pantallas, filmación y redes sociales.',
  },
  {
    id: 'A08',
    scenes: ['E22'],
    desktop: '/assets/scenes/A08-housing-isometrico-1536x1536.webp',
    mobile: '/assets/scenes/A08-housing-isometrico-1080x1350.webp',
    preload: false,
    alt: 'Dos configuraciones isométricas de infraestructura: compartida y privada.',
  },
  {
    id: 'A09',
    scenes: ['E27'],
    desktop: '/assets/scenes/A09-membresias-modulos-1920x1080.webp',
    mobile: '/assets/scenes/A09-membresias-modulos-1080x1350.webp',
    layers: ['/assets/scenes/A09-modulo-1.png', '/assets/scenes/A09-modulo-2.png'],
    preload: false,
    alt: 'Componentes modulares abstractos que se ensamblan según las necesidades.',
  },
];

/** Devuelve el slot declarado para una escena, si existe. */
export function assetSlotFor(sceneId: string): AssetSlot | undefined {
  return SCENE_ASSETS.find((slot) => slot.scenes.includes(sceneId));
}
