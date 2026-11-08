/**
 * Infraestructura soberana (P0-01, paquete 7 mundos): 3 modos de operación.
 * Textos portados del prototipo aprobado; todo etiquetado como SIMULACIÓN.
 * Sin precios ni claims de rendimiento.
 */
export interface InfraMode {
  id: 'ia_privada' | 'housing' | 'red_distribuida';
  label: string;
  subtitle: string;
  num: string;
  status: string;
  description: string;
  benefits: string[];
  limitations: string[];
  /** Tinte del mundo 3D al seleccionar el modo. */
  tintHex: number;
  /** Desplazamiento de cámara (prototipo: focus x/y/ry). */
  cam: { camX: number; camY: number; camZ: number };
}

export const INFRA_MODES: readonly InfraMode[] = [
  {
    id: 'ia_privada',
    label: 'IA PRIVADA',
    subtitle: 'Datos y modelos bajo control',
    num: '01',
    status: 'SIMULACIÓN · IA PRIVADA',
    description:
      'Un nodo procesa una solicitud local y muestra cómo fluye hacia el resto de los servicios.',
    benefits: [
      'Los datos y los modelos corren en tu propio equipo o entorno contratado.',
      'Tú defines las reglas: qué se registra, qué se comparte y qué no.',
      'No dependes de un único proveedor para operar.',
    ],
    limitations: [
      'La capacidad depende del hardware disponible.',
      'La configuración inicial se acuerda y se cobra aparte.',
    ],
    tintHex: 0x48e9ff,
    cam: { camX: -14 / 60, camY: -5 / 60, camZ: -0.35 },
  },
  {
    id: 'housing',
    label: 'HOUSING ADMINISTRADO',
    subtitle: 'Nodos físicos e infraestructura',
    num: '02',
    status: 'SIMULACIÓN · HOUSING',
    description:
      'Selecciona y observa los servidores de Publia, representados como módulos independientes.',
    benefits: [
      'Equipo físico administrado: tú aportas el hardware, nosotros lo operamos.',
      'Respaldo y monitoreo dentro de la capacidad contratada.',
      'Puede operar en modalidad compartida o privada.',
    ],
    limitations: [
      'La mensualidad se define al dimensionar la capacidad contratada.',
      'En modalidad compartida la disponibilidad física del equipo es responsabilidad del cliente.',
      'Propiedad, licencias y condiciones de salida se definen contractualmente.',
    ],
    tintHex: 0xffd232,
    cam: { camX: 20 / 60, camY: 0, camZ: -0.45 },
  },
  {
    id: 'red_distribuida',
    label: 'RED DISTRIBUIDA',
    subtitle: 'Servicios que cooperan',
    num: '03',
    status: 'SIMULACIÓN · NODOS',
    description:
      'Activa rutas ilustrativas entre nodos. La topología y los datos son conceptuales.',
    benefits: [
      'Varios nodos cooperan para sostener los servicios.',
      'La red puede aportar redundancia para tus usuarios.',
      'La infraestructura se comparte sin perder el control de tus datos.',
    ],
    limitations: [
      'La topología real depende de la configuración acordada.',
      'Compartir recursos no equivale a capacidad ilimitada.',
    ],
    tintHex: 0x4affdf,
    cam: { camX: -28 / 60, camY: 3 / 60, camZ: -0.5 },
  },
] as const;

/** Posiciones de los 10 racks (x, y del prototipo, normalizadas a %). */
export const RACK_POSITIONS: ReadonlyArray<readonly [number, number]> = [
  [-385, -275], [-276, -280], [-165, -292], [153, -288], [266, -279],
  [367, -270], [-290, -253], [-184, -259], [169, -261], [277, -254],
] as const;

/** 13 nodos del mapa de red (viewBox 0 0 340 115, del prototipo). */
export const MAP_NODES: ReadonlyArray<readonly [number, number]> = [
  [19, 31], [75, 37], [115, 31], [146, 45], [182, 46], [213, 69], [257, 67],
  [315, 88], [168, 18], [233, 27], [274, 13], [106, 85], [178, 96],
] as const;

/** Rutas ilustrativas del mapa (d del prototipo). */
export const MAP_LINES = [
  'M19 31 C60 40, 90 30, 115 31 S 130 42, 146 45 S 170 44, 182 46 S 200 60, 213 69 S 240 70, 257 67 S 300 82, 315 88',
  'M168 18 C 190 22, 210 25, 233 27 S 260 16, 274 13',
  'M106 85 C 130 80, 150 95, 178 96',
] as const;
