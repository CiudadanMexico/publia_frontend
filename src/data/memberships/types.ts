/**
 * Tipos del catálogo de membresías de Publia 6.0.
 *
 * Este módulo será la fuente canónica cuando se complete el BLOQUE E. Durante
 * la transición, `src/data/catalog.ts` se conserva sin cambios para no romper
 * la implementación vigente.
 */

/** Estado de disponibilidad comercial de una membresía. */
export type PlanStatus = 'disponible' | 'en-desarrollo' | 'planeado';

/** Naturaleza de una característica para evitar mezclar inclusiones y límites. */
export type MembershipFeatureKind = 'incluye' | 'no-incluye' | 'condicion' | 'regla';

/** Precio mensual de una membresía. Todos los importes están en MXN. */
export interface MembershipPrice {
  currency: 'MXN';
  billingPeriod: 'mensual';
  /** Límite inferior del rango conocido; `null` cuando no existe precio. */
  priceFrom: number | null;
  /** Límite superior del rango conocido; `null` cuando no existe precio. */
  priceTo: number | null;
  /** `false` cuando el precio es un objetivo o rango aún no confirmado. */
  priceConfirmed: boolean;
  /** Nota comercial breve; no sustituye la confirmación comercial. */
  note?: string;
  /** Motivo por el que el precio sigue pendiente. */
  pending?: string;
}

/** Ventana de servicio; sólo contiene horarios explícitamente confirmados. */
export interface MembershipServiceWindow {
  start: string;
  end: string;
  timezone: string;
  note?: string;
}

/** Regla, prestación o límite explícito de una membresía. */
export interface MembershipFeature {
  id: string;
  kind: MembershipFeatureKind;
  label: string;
  description: string;
  /** `false` cuando la regla existe, pero algún dato operativo sigue pendiente. */
  confirmed: boolean;
  pending?: string;
}

/** Definición comercial completa de una membresía. */
export interface Membership {
  id: string;
  slug: string;
  name: string;
  status: PlanStatus;
  summary: string;
  price: MembershipPrice;
  /** Plan heredado directamente, si aplica. */
  inheritsFrom: string | null;
  features: MembershipFeature[];
  /** Cantidad mensual de Laborys; se mantiene `null` hasta confirmarla. */
  laborysMonthly: number | null;
  /** Ventana horaria confirmada; `null` si no está definida o sigue pendiente. */
  serviceWindow: MembershipServiceWindow | null;
  /** Bolsa de atención efectiva en horas; `null` hasta definirla comercialmente. */
  effectiveSupportHours: number | null;
  /** Pendientes visibles y trazables de esta membresía. */
  pending: string[];
}

/** Contenedor canónico de membresías y sus unidades comerciales. */
export interface MembershipCatalog {
  currency: 'MXN';
  billingPeriod: 'mensual';
  memberships: Membership[];
  /** Ruta que este módulo sustituirá al completarse el BLOQUE E. */
  replacesModule: 'src/data/catalog.ts';
}
