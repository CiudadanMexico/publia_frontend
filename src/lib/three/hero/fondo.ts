/**
 * PUBLIA R03-F · Fondo espacial.
 *
 * Puerto TypeScript del módulo entregado (`src/modules/fondo.js`).
 * No se modifica la lógica ni los valores: sólo se tipan y se añade el
 * `dispose()` que exige el ciclo de vida de Astro.
 */
import * as THREE from 'three';

export interface SpaceBackgroundOptions {
  textureUrl?: string;
  farCount?: number;
  nearCount?: number;
}

export interface SpaceBackgroundHandle {
  group: THREE.Group;
  update(params?: { time?: number; pointerX?: number; pointerY?: number; scroll?: number }): void;
  setReducedMotion(value: boolean): void;
  dispose(): void;
}

export async function createPubliaSpaceBackground(
  scene: THREE.Scene,
  { textureUrl = '/textures/atmosfera.webp', farCount = 110, nearCount = 35 }: SpaceBackgroundOptions = {},
): Promise<SpaceBackgroundHandle> {
  const group = new THREE.Group();
  group.name = 'PubliaSpaceBackground';
  scene.add(group);

  const loader = new THREE.TextureLoader();
  const texture = await loader.loadAsync(textureUrl);
  texture.colorSpace = THREE.SRGBColorSpace;

  const nebula = new THREE.Mesh(
    new THREE.PlaneGeometry(28, 16),
    new THREE.MeshBasicMaterial({
      map: texture,
      transparent: true,
      opacity: 0.92,
      depthWrite: false,
      side: THREE.DoubleSide,
    }),
  );
  nebula.name = 'NebulaLayer';
  nebula.position.set(0, 0, -16);
  nebula.renderOrder = -20;
  group.add(nebula);

  const layers: THREE.Points[] = [];
  const layersConfig: Array<[number, number, number, number]> = [
    [farCount, -11, 0.025, 0.42],
    [nearCount, -7, 0.052, 0.68],
  ];
  for (const [count, depth, size, opacity] of layersConfig) {
    const points = new Float32Array(count * 3);
    let seed = count * 11 + 7;
    const random = (): number => {
      seed = (1664525 * seed + 1013904223) >>> 0;
      return seed / 4294967296;
    };
    for (let i = 0; i < count; i += 1) {
      points[i * 3] = (random() - 0.5) * 25;
      points[i * 3 + 1] = (random() - 0.5) * 13;
      points[i * 3 + 2] = depth + (random() - 0.5) * 0.8;
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(points, 3));
    const material = new THREE.PointsMaterial({
      color: 0xb5dfff,
      size,
      transparent: true,
      opacity,
      depthWrite: false,
      sizeAttenuation: true,
    });
    const cloud = new THREE.Points(geometry, material);
    cloud.name = depth === -11 ? 'FarStars' : 'NearStars';
    group.add(cloud);
    layers.push(cloud);
  }

  let progress = 0;
  let reduced =
    typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function update({
    time = 0,
    pointerX = 0,
    pointerY = 0,
    scroll = progress,
  }: { time?: number; pointerX?: number; pointerY?: number; scroll?: number } = {}): void {
    progress = THREE.MathUtils.clamp(scroll, 0, 1);
    const mx = reduced ? 0 : pointerX;
    const my = reduced ? 0 : pointerY;
    nebula.position.x = -mx * 0.11;
    nebula.position.y = -my * 0.07 - progress * 0.14;
    layers[0]?.position.set(mx * 0.14, my * 0.09, 0);
    layers[1]?.position.set(mx * 0.39, my * 0.22, 0);
    if (!reduced) {
      if (layers[0]) layers[0].rotation.z = Math.sin(time * 0.04) * 0.003;
      if (layers[1]) layers[1].rotation.z = Math.sin(time * 0.08) * 0.006;
    }
  }

  return {
    group,
    update,
    setReducedMotion(value: boolean): void {
      reduced = Boolean(value);
    },
    dispose(): void {
      group.traverse((object) => {
        const mesh = object as THREE.Mesh;
        mesh.geometry?.dispose();
        const material = mesh.material;
        if (material) {
          if (Array.isArray(material)) material.forEach((item) => item.dispose());
          else material.dispose();
        }
      });
      texture.dispose();
      scene.remove(group);
    },
  };
}
