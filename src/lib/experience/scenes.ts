/**
 * Motor de escenas: resuelve el contenido de una escena según el estado
 * acumulado del visitante. Las escenas comunes leen el estado y adaptan
 * texto, paleta y énfasis sin duplicar implementaciones.
 */

import { SCENES, type SceneCopy } from '../../data/copy';
import type { PrimaryRoute, VisitorState } from './state';

export interface ResolvedScene extends SceneCopy {
  routeFor: PrimaryRoute;
  resolved: {
    eyebrow: string;
    title: string;
    body: string;
  };
}

const byId = new Map<string, SceneCopy>(SCENES.map((scene) => [scene.id, scene]));

export function getScene(id: string): SceneCopy | undefined {
  return byId.get(id);
}

export function allScenes(): SceneCopy[] {
  return SCENES;
}

function mergeScene(scene: SceneCopy, state: VisitorState): ResolvedScene {
  let eyebrow = scene.eyebrow;
  let title = scene.title;
  let body = scene.body;

  const routeVariant = scene.variants?.[state.primary];
  if (routeVariant) {
    eyebrow = routeVariant.eyebrow ?? eyebrow;
    title = routeVariant.title ?? title;
    body = routeVariant.body ?? body;
  }

  for (const trait of state.traits) {
    const traitVariant = scene.traitVariants?.[trait];
    if (traitVariant) {
      eyebrow = traitVariant.eyebrow ?? eyebrow;
      title = traitVariant.title ?? title;
      body = traitVariant.body ?? body;
    }
  }

  return {
    ...scene,
    routeFor: state.primary,
    resolved: { eyebrow, title, body },
  };
}

export function resolveScene(sceneId: string, state: VisitorState): ResolvedScene | undefined {
  const scene = byId.get(sceneId);
  return scene ? mergeScene(scene, state) : undefined;
}

/** Escenas que aplican a la ruta actual (propia + compartidas). */
export function scenesForRoute(route: PrimaryRoute, state: VisitorState): ResolvedScene[] {
  return SCENES.filter(
    (scene) => scene.route === route || scene.route === 'shared',
  ).map((scene) => mergeScene(scene, state));
}
