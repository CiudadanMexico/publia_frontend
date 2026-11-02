/**
 * Housing de Publia 6.0: capacidad compartida o privada.
 *
 * Este módulo será la fuente canónica cuando se complete el BLOQUE E. Durante
 * la transición, `src/data/catalog.ts` se conserva sin cambios.
 */

export type HousingMode = 'compartido' | 'privado';

/** Precio administrativo; los importes no confirmados se mantienen en `null`. */
export interface HousingPrice {
  monthlyMxn: number | null;
  /** Valor considerado, pero no aprobado; nunca se presenta como tarifa final. */
  candidateMonthlyMxn: number | null;
  priceConfirmed: boolean;
  pending?: string;
}

/** Porcentaje de capacidad asignado dentro de una modalidad. */
export interface HousingAllocation {
  id: string;
  label: string;
  percent: number;
}

/** Objetivo técnico de hardware, todavía sujeto a validación de inventario. */
export interface HousingHardwareTarget {
  gpu: string;
  ramGb: number;
  remainingSpecifications: string | null;
  confirmed: boolean;
  pending: string[];
}

/** Esquema financiero considerado; las condiciones legales no están aprobadas. */
export interface HousingFinancing {
  installments: number;
  permanence: 'contractual';
  confirmed: boolean;
  pending: string[];
}

/** Modalidad completa de housing. */
export interface HousingPlan {
  id: HousingMode;
  name: string;
  capacity: 'compartida' | 'exclusiva';
  summary: string;
  price: HousingPrice;
  allocation: HousingAllocation[];
  includes: string[];
  clientResponsibilities: string[];
  capabilities: string[];
  optionalSharing: boolean;
  /** Cantidad fija de Laborys en la modalidad compartida; aún no está definida. */
  laborysMonthlyAllocation: number | null;
  /** Comisión variable compartida; el porcentaje aún no está definido. */
  sharedConsumptionCommissionPercent: number | null;
  pending: string[];
}

export const HOUSING_HARDWARE_TARGET: HousingHardwareTarget = {
  gpu: 'RTX 4060 o equivalente',
  ramGb: 64,
  remainingSpecifications: null,
  confirmed: false,
  pending: [
    'El resto de las especificaciones está pendiente de validación de inventario y costos.',
    'La equivalencia de la GPU objetivo debe validarse antes de comprometer una configuración.',
  ],
};

export const HOUSING_FINANCING: HousingFinancing = {
  installments: 12,
  permanence: 'contractual',
  confirmed: false,
  pending: [
    'El esquema de 12 MSI y la permanencia contractual están considerados, pero las condiciones financieras y legales requieren aprobación.',
    'La propiedad del hardware, las condiciones de salida y las licencias deben definirse contractualmente.',
  ],
};

export const HOUSING_PLANS: HousingPlan[] = [
  {
    id: 'compartido',
    name: 'Modalidad compartida',
    capacity: 'compartida',
    summary:
      'La capacidad se reparte entre el cliente, la red de desarrolladores y becarios, y los miembros del ecosistema.',
    price: {
      monthlyMxn: null,
      candidateMonthlyMxn: 0,
      priceConfirmed: false,
      pending:
        'La mensualidad administrativa de $0 es posible, pero sigue pendiente de confirmación comercial.',
    },
    allocation: [
      { id: 'cliente', label: 'Cliente', percent: 50 },
      { id: 'red', label: 'Red de desarrolladores y becarios', percent: 25 },
      { id: 'ecosistema', label: 'Miembros del ecosistema', percent: 25 },
    ],
    includes: [
      'Agentes e infraestructura administrada.',
      'Herramientas abiertas configuradas.',
      'Asignación fija de Laborys mensuales, cuya cantidad está pendiente.',
      'Comisión variable pequeña por consumo compartido, cuyo porcentaje está pendiente.',
    ],
    clientResponsibilities: [
      'Equipo, electricidad, internet y alojamiento a cargo del cliente según contrato.',
      'El cliente responde por la disponibilidad física de su equipo y sus agentes.',
    ],
    capabilities: [
      'La red compartida puede aportar redundancia para sus usuarios.',
      'Los límites reales son hardware, concurrencia, almacenamiento, seguridad y configuración.',
    ],
    optionalSharing: false,
    laborysMonthlyAllocation: null,
    sharedConsumptionCommissionPercent: null,
    pending: [
      'La mensualidad administrativa de $0 es posible, pero no está confirmada.',
      'La cantidad fija de Laborys mensuales está pendiente.',
      'El porcentaje de comisión variable por consumo compartido está pendiente.',
    ],
  },
  {
    id: 'privado',
    name: 'Modalidad privada',
    capacity: 'exclusiva',
    summary:
      'El cliente dispone de capacidad exclusiva; la compartición es opcional y requiere una decisión expresa.',
    price: {
      monthlyMxn: null,
      candidateMonthlyMxn: null,
      priceConfirmed: false,
      pending: 'La mensualidad de administración está pendiente de definición al dimensionar la capacidad.',
    },
    allocation: [{ id: 'cliente', label: 'Cliente', percent: 100 }],
    includes: [
      'Capacidad contratada en exclusiva.',
      'Administración del entorno.',
      'Modelos locales, agentes y herramientas abiertas.',
    ],
    clientResponsibilities: [
      'Equipo, electricidad, internet y alojamiento a cargo del cliente según contrato.',
      'El cliente responde por la disponibilidad física de su equipo y sus agentes.',
    ],
    capabilities: [
      'Puede ejecutar sistemas multiagente dentro de los recursos disponibles.',
      'La compartición con terceros es opcional y no ocurre por omisión.',
    ],
    optionalSharing: true,
    laborysMonthlyAllocation: null,
    sharedConsumptionCommissionPercent: null,
    pending: ['La mensualidad de administración de la modalidad privada está pendiente.'],
  },
];

export const HOUSING_PRINCIPLES: string[] = [
  'No se impone un límite artificial al número de agentes; los límites reales son técnicos y de configuración.',
  'Son posibles modelos locales, APIs propias, proveedores externos, modelos gratuitos, herramientas abiertas, aplicaciones propias y automatizaciones.',
  'La configuración inicial se cobra aparte.',
  'El software Ciudadan queda sujeto a las condiciones de licencia y permanencia acordadas.',
];
