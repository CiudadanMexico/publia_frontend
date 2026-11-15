import { test } from 'node:test';
import assert from 'node:assert/strict';
import { assignShared, assignPrivate, TASK_TYPES, TOTAL_CAPACITY, SHARED_CLIENT_CAP } from '../src/lib/experience/housingModel';

test('caso inicial 85: compartido atiende 2 llamadas + 1 WhatsApp = 50, 3 activas, 4 en espera', () => {
  const r = assignShared();
  assert.equal(r.cap, SHARED_CLIENT_CAP);
  assert.equal(r.activeTasks, 3);
  assert.equal(r.waitingTasks, 4);
  assert.equal(r.used, 50);
  assert.equal(r.available, 0);
  const calls = r.results.find((x) => x.type.id === 'calls')!;
  const wa = r.results.find((x) => x.type.id === 'wa')!;
  assert.equal(calls.active, 2);
  assert.equal(wa.active, 1);
  assert.equal(wa.waiting, 1);
});

test('caso inicial 85: privado atiende las 7 tareas = 85, 0 en espera, 15 disponibles', () => {
  const r = assignPrivate();
  assert.equal(r.cap, TOTAL_CAPACITY);
  assert.equal(r.activeTasks, 7);
  assert.equal(r.waitingTasks, 0);
  assert.equal(r.used, 85);
  assert.equal(r.available, 15);
});

test('demanda 0: sin tareas en el escenario', () => {
  const none = TASK_TYPES.map((t) => ({ ...t, qty: 0 }));
  const r = assignShared(none);
  assert.equal(r.activeTasks, 0);
  assert.equal(r.waitingTasks, 0);
  assert.equal(r.used, 0);
  assert.equal(r.available, 50);
});

test('saturación: capacidad 10 con llamadas (20) → todo en espera, nada fraccionado', () => {
  const r = assignShared(TASK_TYPES.map((t) => (t.id === 'calls' ? { ...t, qty: 3 } : { ...t, qty: 0 })));
  // cap 50, llamadas 3×20: entran 2 (40), la tercera espera; used 40, waiting 1
  assert.equal(r.activeTasks, 2);
  assert.equal(r.waitingTasks, 1);
  assert.equal(r.used, 40);
});

test('costes editados: coste 100 agota todo en una tarea, no divide entre cero', () => {
  const types = TASK_TYPES.map((t) => (t.id === 'wa' ? { ...t, cost: 100, qty: 2 } : { ...t, qty: 0 }));
  const r = assignPrivate(types);
  assert.equal(r.activeTasks, 1);
  assert.equal(r.waitingTasks, 1);
  assert.equal(r.used, 100);
  assert.equal(r.available, 0);
});

test('orden estable por prioridad ascendente aunque se reordene la entrada', () => {
  const shuffled = [...TASK_TYPES].reverse();
  const a = assignShared(TASK_TYPES);
  const b = assignShared(shuffled);
  assert.deepEqual(a.results.map((r) => [r.type.id, r.active, r.waiting]), b.results.map((r) => [r.type.id, r.active, r.waiting]));
});
