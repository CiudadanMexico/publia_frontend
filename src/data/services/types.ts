/**
 * Tipos del catálogo de servicios de Publia 6.0.
 *
 * Este módulo será la fuente canónica cuando se complete el BLOQUE E. Durante
 * la transición, `src/data/catalog.ts` se conserva sin cambios.
 */

/** Estado de una capacidad u oferta; `planeado` equivale a “planned”. */
export type ServiceStatus = 'existente' | 'en-desarrollo' | 'planeado';

/** Origen del dato para distinguir reglas vigentes de precios históricos. */
export type ServiceSource = 'catalogo-actual' | 'snapshot-precios' | 'brief';

/** Llamada a la acción vinculada a un servicio, sin comportamiento de UI. */
export interface CTA {
  label: string;
  href: string;
  event?: string;
}

/** Recurso visual asociado a un servicio. */
export interface VisualAsset {
  id: string;
  kind: 'imagen' | 'video' | 'poster' | 'icono';
  src: string;
  alt: string;
  caption?: string;
  licenseStatus: 'confirmada' | 'pendiente';
}

/** Servicio individual dentro de una familia comercial. */
export interface Service {
  id: string;
  name: string;
  familyId: string;
  description: string;
  status: ServiceStatus;
  /** Precio real en MXN; `null` cuando no existe precio confirmado. */
  priceMxn: number | null;
  /** Rango conocido, sólo para precios aún no cerrados. */
  priceFrom: number | null;
  priceTo: number | null;
  priceConfirmed: boolean;
  quoteRequired: boolean;
  pricingNote?: string;
  source: ServiceSource;
  /** Slug exacto del producto en el snapshot, cuando existe. */
  sourceSlug?: string;
  includes?: string[];
  excludes?: string[];
  cta?: CTA;
  visualAssets?: VisualAsset[];
  /** Permite excluir productos internos o de prueba de una futura UI. */
  publishable?: boolean;
  /** `false` cuando el producto no dispone de portal en este sprint. */
  portalAvailable?: boolean;
  pending?: string[];
}

/** Familia comercial con los ítems del catálogo y sus servicios tipados. */
export interface ServiceFamily {
  id: string;
  name: string;
  description: string;
  status: ServiceStatus;
  /** Nombres exactos de la familia en el catálogo comercial actual. */
  items: string[];
  services: Service[];
  /** Los complementos pueden venderse por separado cuando proceda. */
  soldSeparately: boolean;
  pending?: string[];
}

/** Complemento concrete que puede añadirse a otro servicio o membresía. */
export interface AddOn {
  id: string;
  name: string;
  familyId: string;
  serviceId?: string;
  description: string;
  status: ServiceStatus;
  priceMxn: number | null;
  quoteRequired: boolean;
  pricingNote?: string;
  includes?: string[];
  pending?: string[];
}

/** Oferta de asesoría sin tarifa publicada. */
export interface AdvisoryOffer {
  id: string;
  name: string;
  description: string;
  duration: string;
  deliverables: string[];
  priceMxn: null;
  quoteRequired: true;
  status: ServiceStatus;
}

/** Módulo de capacitación práctica para adopción de herramientas Publia. */
export interface TrainingModule {
  id: string;
  name: string;
  audience: string;
  replicable: boolean;
  includedInBase: false;
  pending: string;
}

/** Capacidad cooperativa con estado explícito de disponibilidad. */
export interface CooperativeOffering {
  id: string;
  name: string;
  status: ServiceStatus;
  note?: string;
  priceMxn: null;
  quoteRequired: true;
  portalAvailable: boolean | null;
}
