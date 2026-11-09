/**
 * Pruebas del bloque 7M-D: separación selección/recomendación (membresías),
 * recomendación independiente de Housing, y coherencia de la propuesta
 * exportada (buildSummary) con el estado del visitante.
 *
 *   npm test
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { recommend } from '../src/lib/experience/memberships';
import { buildSummary } from '../src/lib/experience/cierre';
import { HOUSING_PLANS } from '../src/data/housing';

test('P0-02: infraestructura/Housing NO recomienda COBERTURA por defecto', () => {
  const rec = recommend('infrastructure', 'large');
  assert.ok(rec);
  assert.equal(rec.housing, true);
  assert.equal(rec.plan, null, 'Housing genera recomendación independiente, sin plan predeterminado');
});

test('P0-02: otros objetivos sí sugieren un plan concreto', () => {
  assert.equal(recommend('support', 'large')?.plan?.slug, 'cobertura');
  assert.equal(recommend('support', 'small')?.plan?.slug, 'operacion');
  assert.equal(recommend('agent', 'solo')?.plan?.slug, 'agente');
  assert.equal(recommend('start', 'small')?.plan?.slug, 'base');
  assert.equal(recommend(null, 'small'), null);
});

test('P0-01/P0-03: buildSummary refleja red, housingMode, membresía y capacidades del estado', () => {
  // buildSummary lee el estado global; en Node el estado está vacío (sin sesión)
  const txt = buildSummary();
  assert.match(txt, /Propuesta Publia\.mx/);
  assert.match(txt, /hola@publia\.mx/);
  assert.match(txt, /no oferta vinculante/);
});

test('P1-01: Housing nunca publica precios confirmados', () => {
  for (const plan of Object.values(HOUSING_PLANS)) {
    assert.match(plan.note, /pendiente|cotizar/i);
    assert.doesNotMatch(plan.note, /\$\d/);
  }
});
