/**
 * PUBLIA · Plataforma holográfica.
 *
 * Puerto TypeScript del módulo entregado (`src/modules/plataforma.js`).
 * Geometría real, sin imágenes: no se altera ningún valor.
 */
import * as THREE from 'three';

export interface PlatformState {
  intensity: number;
  expansion: number;
  paused: boolean;
}

export interface PlatformHandle {
  group: THREE.Group;
  state: PlatformState;
  update(time: number): void;
  dispose(): void;
}

/** Plataforma holográfica Publia. Geometría real; sin imágenes ni dependencias extra. */
export function crearPlataformaPublia({ radius = 2.1 }: { radius?: number } = {}): PlatformHandle {
  const group = new THREE.Group();
  group.name = 'PUBLIA_Plataforma_Luminosa';
  const dark = new THREE.MeshStandardMaterial({ color: 0x091b35, metalness: 0.76, roughness: 0.24 });
  const rim = new THREE.MeshStandardMaterial({ color: 0x12385a, metalness: 0.86, roughness: 0.19 });
  const cyan = new THREE.MeshBasicMaterial({ color: 0x4deaff, transparent: true, opacity: 0.85, depthWrite: false });
  const blue = new THREE.MeshBasicMaterial({ color: 0x238cff, transparent: true, opacity: 0.8, depthWrite: false });
  const amber = new THREE.MeshBasicMaterial({ color: 0xffb53b, transparent: true, opacity: 0.9, depthWrite: false });
  const glow = new THREE.MeshBasicMaterial({
    color: 0x28baff,
    transparent: true,
    opacity: 0.09,
    depthWrite: false,
    side: THREE.DoubleSide,
  });

  const add = (geometry: THREE.BufferGeometry, material: THREE.Material, y = 0, name = ''): THREE.Mesh => {
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.y = y;
    mesh.name = name;
    group.add(mesh);
    return mesh;
  };

  add(new THREE.CylinderGeometry(radius, radius * 1.03, 0.18, 96), dark, -0.1, 'base');
  add(new THREE.CylinderGeometry(radius * 0.94, radius * 0.98, 0.045, 96), rim, 0.014, 'tapa');

  const rings: THREE.Mesh[] = [];
  const ring = (
    r: number,
    t: number,
    material: THREE.Material,
    y: number,
    name: string,
  ): THREE.Mesh => {
    const mesh = add(new THREE.TorusGeometry(r, t, 8, 128), material, y, name);
    mesh.rotation.x = Math.PI / 2;
    rings.push(mesh);
    return mesh;
  };
  ring(radius * 0.96, 0.026, cyan, 0.047, 'aro_exterior');
  ring(radius * 0.78, 0.013, blue, 0.05, 'aro_intermedio');
  ring(radius * 0.47, 0.018, amber, 0.053, 'aro_central');

  const segmented = new THREE.Group();
  segmented.name = 'segmentos_rotatorios';
  group.add(segmented);
  for (let i = 0; i < 32; i += 1) {
    const a = i * Math.PI * 2 / 32;
    const segment = new THREE.Mesh(
      new THREE.BoxGeometry(0.14, 0.012, 0.025),
      i % 4 === 0 ? amber : cyan,
    );
    segment.position.set(Math.cos(a) * radius * 0.86, 0.063, Math.sin(a) * radius * 0.86);
    segment.rotation.y = -a;
    segmented.add(segment);
  }

  const beam = add(
    new THREE.CylinderGeometry(radius * 0.52, radius * 0.72, 1.8, 96, 1, true),
    glow,
    0.92,
    'columna_luminosa',
  );
  const pulseMat = new THREE.MeshBasicMaterial({
    color: 0x5ddfff,
    transparent: true,
    opacity: 0.2,
    depthWrite: false,
    side: THREE.DoubleSide,
  });
  const pulse = add(new THREE.CircleGeometry(radius * 0.76, 96), pulseMat, 0.067, 'pulso');
  pulse.rotation.x = -Math.PI / 2;

  const light = new THREE.PointLight(0x35baff, 8, 6);
  light.position.set(0, 0.75, 0);
  group.add(light);

  const state: PlatformState = { intensity: 1, expansion: 0, paused: false };

  function update(time: number): void {
    if (state.paused) return;
    segmented.rotation.y = time * 0.13;
    const breath = 0.5 + 0.5 * Math.sin(time * 1.6);
    pulse.scale.setScalar(0.94 + breath * 0.09 + state.expansion * 0.22);
    pulseMat.opacity = (0.07 + 0.12 * breath) * state.intensity;
    (beam.material as THREE.MeshBasicMaterial).opacity = (0.045 + 0.055 * breath) * state.intensity;
    light.intensity = (3.8 + 2.4 * breath) * state.intensity;
    rings.forEach((item, i) => item.scale.setScalar(1 + state.expansion * (0.08 + i * 0.035)));
  }

  function dispose(): void {
    group.traverse((object) => {
      const mesh = object as THREE.Mesh;
      if (mesh.isMesh) mesh.geometry.dispose();
    });
    [dark, rim, cyan, blue, amber, glow, pulseMat].forEach((material) => material.dispose());
    group.removeFromParent();
  }

  return { group, state, update, dispose };
}
