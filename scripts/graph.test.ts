/**
 * Pruebas unitarias del grafo narrativo y del catálogo.
 *
 * Se ejecutan con el runner de Node sobre el módulo empaquetado por esbuild:
 *
 *   npm test
 *
 * Comprueban las reglas que no deben romperse: precios, visibilidad,
 * resolución de variantes, navegación y la integridad del catálogo.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  allScenes,
  appliesTo,
  destinationsOf,
  effectiveRoute,
  nextScene,
  pickVariantFrom,
  previousScene,
  renderableScenes,
  visitorSegments,
} from '../src/lib/experience/graph';
import { MEMBERSHIPS } from '../src/data/memberships';
import { HOUSING_PLANS } from '../src/data/memberships/housing';
import { PUBLISHABLE_SERVICES, TRAINING_MODULES, COOPERATIVE_OFFERINGS } from '../src/data/services';
import type { VisitorState } from '../src/lib/experience/state';

const baseState: VisitorState = {
  primary: 'unclassified',
  origin: null,
  answers: {},
  transitioning: false,
  traits: [],
  visitedScenes: [],
  lastScene: null,
  updatedAt: 0,
  capabilities: [],
  membership: null,
  infra: null,
  red: null,
  proposalTouched: false,
};

const state = (patch: Partial<VisitorState>): VisitorState => ({ ...baseState, ...patch });

test('la ruta efectiva de un visitante sin clasificar es exploración', () => {
  assert.equal(effectiveRoute(baseState), 'explorer');
  assert.equal(effectiveRoute(state({ primary: 'enterprise' })), 'enterprise');
});

test('los segmentos combinan ruta y rasgos', () => {
  const segments = visitorSegments(state({ primary: 'enterprise', traits: ['value_driven'] }));
  assert.ok(segments.includes('enterprise'));
  assert.ok(segments.includes('values'));
  assert.equal(segments.includes('practical'), false);
});

test('una escena sin segmentos se aplica siempre', () => {
  const scene = { ...allScenes()[0]!, segments: [] };
  assert.equal(appliesTo(scene, baseState), true);
});

test('una escena con segmentos se aplica sólo si el visitante los tiene', () => {
  const scene = { ...allScenes()[0]!, segments: ['values' as const] };
  assert.equal(appliesTo(scene, baseState), false);
  assert.equal(appliesTo(scene, state({ traits: ['value_driven'] })), true);
});

test('la variante de rasgo tiene prioridad sobre la de ruta', () => {
  const variant = pickVariantFrom(
    [
      { route: 'enterprise', lead: 'lead de ruta' },
      { segment: 'values', lead: 'lead de rasgo' },
    ],
    state({ primary: 'enterprise', traits: ['value_driven'] }),
  );
  assert.equal(variant?.lead, 'lead de rasgo');
});

test('sin variante aplicable se devuelve null', () => {
  assert.equal(pickVariantFrom([], baseState), null);
  assert.equal(pickVariantFrom([{ route: 'efficiency' }], state({ primary: 'enterprise' })), null);
});

test('el grafo monta 30 escenas con identificadores únicos', () => {
  const scenes = allScenes();
  assert.equal(scenes.length, 30);
  assert.equal(new Set(scenes.map((scene) => scene.id)).size, scenes.length);
});

test('toda escena tiene título, propósito, etapa y módulos', () => {
  for (const scene of allScenes()) {
    assert.ok(scene.title.trim().length > 0, `${scene.id} sin título`);
    assert.ok(scene.purpose.trim().length > 0, `${scene.id} sin propósito`);
    assert.ok((scene.stage ?? '').trim().length > 0, `${scene.id} sin etapa`);
    assert.ok(scene.modules.length > 0, `${scene.id} sin módulos`);
  }
});

test('los destinos de las escenas apuntan a escenas o anclas reales', () => {
  const ids = new Set(allScenes().map((scene) => scene.id));
  const anchors = new Set(
    allScenes().map((scene) => `escena-${scene.id.toLowerCase()}`),
  );
  for (const scene of allScenes()) {
    for (const destination of destinationsOf(scene, baseState)) {
      const normalized = destination.replace('#', '');
      assert.ok(
        ids.has(destination) || ids.has(normalized.toUpperCase()) || anchors.has(normalized),
        `${scene.id} apunta a ${destination}, que no existe`,
      );
    }
  }
});

test('la navegación avanza y retrocede dentro del grafo', () => {
  const visible = renderableScenes();
  const first = visible[0]!;
  const second = nextScene(first.id, baseState);
  assert.ok(second, 'debe existir una escena siguiente');
  assert.equal(previousScene(second!.id, baseState)?.id, first.id);
});

test('los precios de membresía son los acordados', () => {
  const price = (name: string) => MEMBERSHIPS.find((membership) => membership.name === name)?.price;
  assert.equal(price('BASE')?.priceFrom, 300);
  assert.equal(price('CRECIMIENTO')?.priceFrom, 2000);
  assert.equal(price('OPERACIÓN')?.priceFrom, 3000);
  assert.equal(price('COBERTURA')?.priceFrom, 4000);
  const agente = price('AGENTE');
  assert.equal(agente?.priceConfirmed, false);
  assert.equal(agente?.priceFrom, 500);
  assert.equal(agente?.priceTo, 600);
});

test('el reparto de Housing compartido es 50/25/25', () => {
  const compartido = HOUSING_PLANS.find((plan) => plan.id === 'compartido');
  const reparto = compartido?.allocation ?? [];
  assert.equal(reparto.length, 3);
  assert.equal(reparto[0]?.percent, 50);
  assert.equal(reparto[1]?.percent, 25);
  assert.equal(reparto[2]?.percent, 25);
  assert.equal(compartido?.laborysMonthlyAllocation, null);
});

test('ningún servicio sin precio confirmado se publica como cifra', () => {
  for (const service of PUBLISHABLE_SERVICES) {
    if (service.priceConfirmed) {
      assert.equal(typeof service.priceMxn, 'number');
    } else {
      assert.equal(service.priceMxn, null);
      assert.equal(service.quoteRequired, true);
    }
  }
});

test('la capacitación y el Club de Influencers no tienen precio inventado', () => {
  for (const module of TRAINING_MODULES) {
    assert.equal(module.includedInBase, false);
  }
  const club = COOPERATIVE_OFFERINGS.find((offering) => offering.id === 'club-influencers');
  assert.equal(club?.status, 'planeado');
  assert.equal(club?.priceMxn, null);
});

test('el producto de prueba del catálogo heredado no se publica', () => {
  assert.equal(PUBLISHABLE_SERVICES.some((service) => service.name.includes('Sucri')), false);
});
