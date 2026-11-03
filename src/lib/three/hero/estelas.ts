/**
 * PUBLIA R03-C v2 · Estelas tridimensionales.
 *
 * Puerto TypeScript del módulo entregado (`src/modules/estelas.js`).
 * No se modifican las curvas, los colores ni las velocidades.
 */
import * as THREE from 'three';

interface Spec {
  name: string;
  color: number;
  phase: number;
  tilt: number;
  speed: number;
  opacity: number;
}

const specs: Spec[] = [
  { name: 'Estela_Cian', color: 0x45ddff, phase: 0.15, tilt: 0.3, speed: 0.13, opacity: 0.9 },
  { name: 'Estela_Violeta', color: 0x9c78ff, phase: 2.15, tilt: -0.42, speed: -0.09, opacity: 0.67 },
  { name: 'Estela_Ambar', color: 0xffba53, phase: 4.05, tilt: 0.56, speed: 0.105, opacity: 0.77 },
];

const TAU = Math.PI * 2;

function orbitPoint(u: number, s: Spec, t = 0): THREE.Vector3 {
  const a = u * TAU + s.phase + t * s.speed;
  const radius = 1.95 + 0.21 * Math.sin(3 * a + s.phase) + 0.12 * Math.cos(5 * a);
  return new THREE.Vector3(
    radius * Math.cos(a),
    0.48 * Math.sin(2 * a + s.phase) + 0.26 * Math.sin(a * 1.4) + s.tilt * Math.sin(a),
    0.85 * radius * Math.sin(a) + 0.26 * Math.cos(3 * a + s.phase),
  );
}

export interface TrailsHandle {
  grupo: THREE.Group;
  actualizar(time?: number): void;
  configurar(params?: { expandir?: number; intensidad?: number; visible?: number }): void;
  destruir(): void;
}

export function crearEstelasOrbitales({ quality = 'high' }: { quality?: 'low' | 'high' } = {}): TrailsHandle {
  const grupo = new THREE.Group();
  grupo.name = 'PUBLIA_Estelas_Cinematograficas';
  const resolution = quality === 'low' ? 90 : 220;
  const items: Array<{
    s: Spec;
    halo: THREE.Mesh;
    line: THREE.Mesh;
    dots: THREE.Mesh[];
  }> = [];

  for (const s of specs) {
    const curve = new THREE.CatmullRomCurve3(
      Array.from({ length: resolution + 1 }, (_, i) => orbitPoint(i / resolution, s)),
    );
    // Tubos de energía superpuestos: núcleo definido + halo translúcido.
    const halo = new THREE.Mesh(
      new THREE.TubeGeometry(curve, resolution, 0.043, 6, false),
      new THREE.MeshBasicMaterial({
        color: s.color,
        transparent: true,
        opacity: 0.16,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
    );
    const line = new THREE.Mesh(
      new THREE.TubeGeometry(curve, resolution, 0.01, 5, false),
      new THREE.MeshBasicMaterial({
        color: s.color,
        transparent: true,
        opacity: s.opacity,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
    );
    const dots: THREE.Mesh[] = [];
    const dotGeo = new THREE.SphereGeometry(0.028, 8, 6);
    for (let j = 0; j < 4; j += 1) {
      const dot = new THREE.Mesh(
        dotGeo,
        new THREE.MeshBasicMaterial({
          color: s.color,
          transparent: true,
          opacity: 0.85,
          depthWrite: false,
          blending: THREE.AdditiveBlending,
        }),
      );
      grupo.add(dot);
      dots.push(dot);
    }
    grupo.add(halo, line);
    items.push({ s, halo, line, dots });
  }

  let expansion = 0;
  let energy = 1;
  let visibility = 1;

  function actualizar(time = 0): void {
    for (const { s, halo, line, dots } of items) {
      const wave = 0.92 + 0.08 * Math.sin(time * 0.8 + s.phase);
      (halo.material as THREE.MeshBasicMaterial).opacity = 0.14 * energy * visibility * wave;
      (line.material as THREE.MeshBasicMaterial).opacity = s.opacity * energy * visibility * wave;
      dots.forEach((dot, i) => {
        dot.position.copy(orbitPoint(((time * 0.09 + i / 4 + s.phase / TAU) % 1 + 1) % 1, s, time));
        dot.scale.setScalar(0.8 + 0.3 * Math.sin(time * 2 + i));
        (dot.material as THREE.MeshBasicMaterial).opacity = energy * visibility;
      });
    }
    grupo.rotation.y = 0.09 * Math.sin(time * 0.14);
    grupo.rotation.x = 0.04 * Math.sin(time * 0.22);
    grupo.scale.setScalar(1 + 0.28 * expansion);
  }

  function configurar({
    expandir = expansion,
    intensidad = energy,
    visible = visibility,
  }: { expandir?: number; intensidad?: number; visible?: number } = {}): void {
    expansion = THREE.MathUtils.clamp(expandir, 0, 1);
    energy = THREE.MathUtils.clamp(intensidad, 0, 2);
    visibility = THREE.MathUtils.clamp(visible, 0, 1);
  }

  function destruir(): void {
    grupo.traverse((object) => {
      const mesh = object as THREE.Mesh;
      if (mesh.isMesh) {
        mesh.geometry.dispose();
        const material = mesh.material;
        if (Array.isArray(material)) material.forEach((item) => item.dispose());
        else material.dispose();
      }
    });
    grupo.removeFromParent();
  }

  actualizar();

  return { grupo, actualizar, configurar, destruir };
}
