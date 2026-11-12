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
    scenes: [], // 7M-F: A01 nunca se entregó como archivo (no existía ni en avif); slot retirado sin borrar el registro
    desktop: '/assets/scenes/A01-tunel-prismatico-2560x1440.webp',
    mobile: '/assets/scenes/A01-tunel-prismatico-1080x1350.webp',
    layers: ['/assets/scenes/A01-overlay.png'],
    alt: 'Túnel prismático elegante con líneas de energía azules y amarillas, profundidad real.',
  },
  {
    id: 'A02',
    scenes: ['E20'],
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
    scenes: ['E04', 'E06', 'E21'], // 7M-G: E03 ya no usa el póster (stage nativo); primaria pasa a E04
    desktop: '/assets/scenes/A04-infraestructura-2560x1440.webp',
    mobile: '/assets/scenes/A04-infraestructura-1080x1350.webp',
    layers: ['/assets/scenes/A04-rack-1200x1600.png'],
    preload: true,
    alt: 'Rack de servidores premium en espacio oscuro azul cobalto con paneles cian y líneas doradas.',
  },
  {
    id: 'A05',
    scenes: ['E16', 'E17'],  // 7M-E: E15 ya no usa A05 (redDemo es el visual)
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

/**
 * Recurso P0-01 «Portal de transformación»: 4 capas SVG 1400×900 (mismo
 * viewBox, píxel a píxel) servidas desde /assets/portal/ y animadas como
 * overlay durante la transición hero → mundo (ver `lib/experience/portal.ts`).
 * No sustituye al prisma GLB aprobado.
 */
export const PORTAL_P0_01 = {
  id: 'P0-01',
  layers: [
    { file: '/assets/portal/01_umbral.svg', orden: 0, animacion: 'zoom, brillo, entrada a mundo' },
    { file: '/assets/portal/02_marco_cristalino.svg', orden: 1, animacion: 'escala, rotación suave, aperturas' },
    { file: '/assets/portal/03_fragmentos.svg', orden: 2, animacion: 'parallax y dispersión' },
    { file: '/assets/portal/04_energia_destellos.svg', orden: 3, animacion: 'glow, recorrido y ráfagas' },
  ],
  completo: '/assets/portal/00_portal_completo.svg',
} as const;

/**
 * Registro de assets recibidos (imagenes1.zip, entrega V4-B).
 * Origen: `_entrega/analisis/imagenes1/imagenes1.zip`
 * (SHA-256 del ZIP: d34b6f6d7965f77bdfe16cdd4903ffa686f6a0243e5640266f182ad0c68edb60,
 * 10 178 529 bytes). Se conserva el PNG original; en producción se sirven
 * los AVIF derivados (escritorio + recorte vertical móvil 4:5 centrado).
 */
export const RECEIVED_ASSETS = [
  {
    origen: 'P0_02_Automatizacion.png', sha256: 'fdded3b60dcadb7a2aaef1a077449a79ef2ac7b16bbe1889692c5fe384855aef',
    bytes: 2407042, resolucion: '1672x941', formato: 'PNG', slot: 'A03', escena: 'E07/E08/E09/E06',
    desktop: '/assets/scenes/A03-flujo-automatizacion-1920x1080.webp', mobile: '/assets/scenes/A03-flujo-automatizacion-1080x1350.webp',
    contenido: 'Automatización con IA: azul eléctrico con acentos coral (verificado por muestreo de color).',
  },
  {
    origen: 'P0_03_Infraestructura.png', sha256: '5fdac1b2c6402e7e60b80f2b2c69d84651bdfadc3935cf89c0160952f4a53c64',
    bytes: 2650257, resolucion: '1670x942', formato: 'PNG', slot: 'A04', escena: 'E03/E04/E06/E21',
    desktop: '/assets/scenes/A04-infraestructura-2560x1440.webp', mobile: '/assets/scenes/A04-infraestructura-1080x1350.webp',
    contenido: 'Infraestructura soberana: noche azul con dorado (racks/servidores).',
  },
  {
    origen: 'P0_04_Ecosistema.png', sha256: 'e3cf70c72a9e2640a1df51daf938f67aac33bb389c3f460525010ef58025a00f',
    bytes: 2139942, resolucion: '1672x941', formato: 'PNG', slot: 'A02', escena: 'E20',
    desktop: '/assets/scenes/A02-galaxia-soluciones-2560x1440.webp', mobile: '/assets/scenes/A02-galaxia-soluciones-1080x1350.webp',
    contenido: 'Ecosistema de soluciones: violeta/majenta con azules (mosaico E25).',
  },
  {
    origen: 'P0_05_Comunidad_Geonodos.png', sha256: '9ef65edfee705a2cfa6b1960d6b38639f1d0178385edc6f1c36128c83b92e3c4',
    bytes: 3117168, resolucion: '1672x941', formato: 'PNG', slot: 'A05', escena: 'E15/E16/E17',
    desktop: '/assets/scenes/A05-geonodos-2560x1440.webp', mobile: '/assets/scenes/A05-geonodos-1080x1350.webp',
    contenido: 'Comunidad/GeoNodos: tierras cálidas con cielo azul (paisaje cooperativo).',
  },
] as const;

/** Devuelve el slot declarado para una escena, si existe. */
export function assetSlotFor(sceneId: string): AssetSlot | undefined {
  return SCENE_ASSETS.find((slot) => slot.scenes.includes(sceneId));
}
