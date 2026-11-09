/**
 * A08 Housing (paquete PUBLIA_A08_HOUSING_ESCENA_INTERACTIVA_V1_COMPLETO.zip):
 * datos estructurados de modos.json + textos del prototipo escena.js.
 * Regla comercial: SIN precios confirmados ni claims de infraestructura real.
 * Fuente canónica de condiciones preliminares: src/data/memberships/housing.ts
 */

import type { HousingMode as CanonicalHousingMode } from './memberships/housing';

/** Fuente canónica del modo: src/data/memberships/housing.ts */
export type HousingMode = CanonicalHousingMode;
export const HOUSING_MODES: readonly HousingMode[] = ['compartido', 'privado'];

export interface HousingShare {
  actor: string;
  porcentaje: number;
  /** clase del segmento/dot en el visualizador */
  tone: 'c' | 's' | 'm';
}

export interface HousingPlan {
  id: HousingMode;
  label: string;
  title: string;
  text: string;
  distribution: HousingShare[];
  note: string;
  statusShared: string;
  statusPrivate: string;
  demoStatus: string;
  demoPaused: string;
  demoResumed: string;
  demoDone: string;
  rackToastPrivate: string;
  rackToastShared: (n: number) => string;
  hardware: string;
}

export const HOUSING_PLANS: Record<HousingMode, HousingPlan> = {
  compartido: {
    id: 'compartido',
    label: '◉ COMPARTIDO · 50 / 25 / 25',
    title: 'Capacidad que se multiplica',
    text: 'El 50% de los recursos se reserva al cliente; el resto se comparte entre la red de socios, becarios y miembros, bajo las condiciones del servicio.',
    distribution: [
      { actor: 'Cliente', porcentaje: 50, tone: 'c' },
      { actor: 'Socios y becarios', porcentaje: 25, tone: 's' },
      { actor: 'Miembros del ecosistema', porcentaje: 25, tone: 'm' },
    ],
    note: 'Modalidad compartida: precio administrativo y comisiones pendientes de confirmación.',
    statusShared: '🔗 Capacidad compartida: 50 / 25 / 25',
    statusPrivate: '🔒 Capacidad aislada: 100% para el cliente',
    demoStatus: '⚡ Simulación: solicitudes distribuidas entre tres grupos',
    demoPaused: '⏸ Simulación visual pausada',
    demoResumed: '▶ Simulación visual reanudada',
    demoDone: '✓ Demostración completada. Ningún servicio externo fue utilizado.',
    rackToastPrivate: '🔒 Capacidad exclusiva del cliente',
    rackToastShared: (n) => `⚡ Nodo ${n}: ilustración de infraestructura compartida`,
    hardware: 'RTX 4060 o equivalente + 64 GB RAM objetivo, sujeto a validación',
  },
  privado: {
    id: 'privado',
    label: '⬡ PRIVADO · 100%',
    title: 'Tu capacidad, en exclusiva',
    text: 'El 100% de la capacidad contratada se dedica al cliente. No hay préstamo de recursos a terceros salvo elección expresa.',
    distribution: [{ actor: 'Cliente', porcentaje: 100, tone: 'c' }],
    note: 'Modalidad privada: precio por cotizar según infraestructura y condiciones.',
    statusShared: '🔗 Capacidad compartida: 50 / 25 / 25',
    statusPrivate: '🔒 Capacidad aislada: 100% para el cliente',
    demoStatus: '🔒 Simulación: procesamiento reservado en un nodo privado',
    demoPaused: '⏸ Simulación visual pausada',
    demoResumed: '▶ Simulación visual reanudada',
    demoDone: '✓ Demostración completada. Ningún servicio externo fue utilizado.',
    rackToastPrivate: '🔒 Capacidad exclusiva del cliente',
    rackToastShared: (n) => `⚡ Nodo ${n}: ilustración de infraestructura compartida`,
    hardware: 'Configuración por dimensionar',
  },
};

export const HOUSING_DISCLAIMER =
  'La distribución porcentual no garantiza disponibilidad técnica, prestaciones ni precio. Demostración ilustrativa no contractual.';
