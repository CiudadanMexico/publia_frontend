/**
 * Modelo determinista de reparto de capacidad (E22) — 7M-H §8.
 * 100 unidades ilustrativas (no GB/tokens/RTX). Asignación por prioridad
 * ascendente y orden estable; cada tarea se atiende entera si cabe; si no
 * cabe entra a cola y se siguen evaluando otras tareas que sí quepan.
 * Compartido usa sólo 50 para el cliente (25 socios/becarios + 25 miembros
 * permanecen reservados aunque estén ociosos); privado usa 100.
 */

export type TaskTypeId = 'calls' | 'wa' | 'docs' | 'auto';

export interface TaskType {
  id: TaskTypeId;
  label: string;
  cost: number;
  qty: number;
  priority: number;
}

export const TASK_TYPES: TaskType[] = [
  { id: 'calls', label: 'Agentes de llamadas', cost: 20, qty: 2, priority: 1 },
  { id: 'wa', label: 'Agentes de WhatsApp', cost: 10, qty: 2, priority: 2 },
  { id: 'docs', label: 'Documentos y reportes', cost: 15, qty: 1, priority: 3 },
  { id: 'auto', label: 'Automatizaciones internas', cost: 5, qty: 2, priority: 4 },
];

export const TOTAL_CAPACITY = 100;
export const SHARED_CLIENT_CAP = 50;
export const SHARED_RESERVED = [
  { actor: 'Socios y becarios', porcentaje: 25 },
  { actor: 'Miembros de la red', porcentaje: 25 },
];

export interface TypeResult {
  type: TaskType;
  active: number;
  waiting: number;
  units: number;
}

export interface AssignmentResult {
  cap: number;
  results: TypeResult[];
  activeTasks: number;
  waitingTasks: number;
  used: number;
  available: number;
}

/** Asignación determinista para una capacidad dada (50 compartido / 100 privado). */
export function assign(cap: number, types: TaskType[] = TASK_TYPES): AssignmentResult {
  let left = cap;
  const ordered = [...types].sort((a, b) => a.priority - b.priority || TASK_TYPES.findIndex((t) => t.id === a.id) - TASK_TYPES.findIndex((t) => t.id === b.id));
  const results: TypeResult[] = ordered.map((t) => {
    const cost = Math.max(1, Math.floor(t.cost));
    const qty = Math.max(0, Math.floor(t.qty));
    const active = Math.min(qty, Math.floor(left / cost));
    left -= active * cost;
    return { type: t, active, waiting: qty - active, units: active * cost };
  });
  const activeTasks = results.reduce((a, r) => a + r.active, 0);
  const waitingTasks = results.reduce((a, r) => a + r.waiting, 0);
  const used = cap - Math.max(0, left);
  return { cap, results, activeTasks, waitingTasks, used, available: Math.max(0, left) };
}

export const assignShared = (types?: TaskType[]): AssignmentResult => assign(SHARED_CLIENT_CAP, types);
export const assignPrivate = (types?: TaskType[]): AssignmentResult => assign(TOTAL_CAPACITY, types);
