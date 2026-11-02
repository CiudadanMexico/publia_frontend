/**
 * Motivo visual: EL PRISMA.
 *
 * Un núcleo cristalino con facetas orbitando en los tres ejes. La orientación,
 * la paleta y el ritmo cambian con la ruta del visitante: cada transformación
 * corresponde a una transición narrativa, no a un giro decorativo.
 *
 * Sin WebGL o con `prefers-reduced-motion`, la escena se dibuja estática.
 */

import * as THREE from 'three';
import type { PrimaryRoute } from '../experience/state';

export interface PrismHandle {
  setRoute: (route: PrimaryRoute) => void;
  setScrollProgress: (progress: number) => void;
  setPointer: (x: number, y: number) => void;
  destroy: () => void;
}

interface RouteLook {
  core: number;
  facets: number;
  accent: number;
  spin: number;
}

const LOOKS: Record<PrimaryRoute, RouteLook> = {
  unclassified: { core: 0xb48bff, facets: 0x8b5cf6, accent: 0x4fd1c5, spin: 0.1 },
  enterprise: { core: 0xd8dbe6, facets: 0x9aa0b2, accent: 0xffffff, spin: 0.055 },
  efficiency: { core: 0xffb547, facets: 0xff8a3d, accent: 0xffe2a8, spin: 0.16 },
  explorer: { core: 0x4fd1c5, facets: 0x2bb3a6, accent: 0xb48bff, spin: 0.13 },
};

export function createPrism(
  canvas: HTMLCanvasElement,
  options: { reducedMotion: boolean },
): PrismHandle | null {
  let renderer: THREE.WebGLRenderer;
  try {
    renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: true,
      // Permite capturar el prisma (capturas de pantalla, guardado y pruebas
      // visuales) sin perder el búfer ya compuesto.
      preserveDrawingBuffer: true,
      powerPreference: 'high-performance',
    });
  } catch {
    return null;
  }
  if (!renderer.getContext()) {
    renderer.dispose();
    return null;
  }

  const reduced = options.reducedMotion;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setClearColor(0x000000, 0);

  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x07070a, 0.08);

  const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100);
  camera.position.set(0, 0, 6.2);

  const root = new THREE.Group();
  scene.add(root);

  // Núcleo cristalino -----------------------------------------------------
  const coreGeometry = new THREE.IcosahedronGeometry(1.25, 0);
  const coreMaterial = new THREE.MeshPhysicalMaterial({
    color: LOOKS.unclassified.core,
    roughness: 0.08,
    metalness: 0.05,
    transmission: 0.92,
    thickness: 1.4,
    ior: 1.62,
    transparent: true,
    opacity: 0.96,
    side: THREE.DoubleSide,
  });
  const core = new THREE.Mesh(coreGeometry, coreMaterial);
  root.add(core);

  // Aristas: dan volumen sin coste de sombreado --------------------------
  const wireGeometry = new THREE.EdgesGeometry(coreGeometry);
  const wireMaterial = new THREE.LineBasicMaterial({
    color: 0xffffff,
    transparent: true,
    opacity: 0.16,
  });
  const wire = new THREE.LineSegments(wireGeometry, wireMaterial);
  root.add(wire);

  // Facetas orbitantes: cada una gira sobre un eje distinto --------------
  const facets: Array<{
    mesh: THREE.Mesh;
    axis: 'x' | 'y' | 'z';
    radius: number;
    speed: number;
    phase: number;
  }> = [];
  const facetGeometry = new THREE.TetrahedronGeometry(0.34, 0);
  const axes: ReadonlyArray<'x' | 'y' | 'z'> = ['x', 'y', 'z'];
  for (let i = 0; i < 7; i += 1) {
    const material = new THREE.MeshStandardMaterial({
      color: LOOKS.unclassified.facets,
      roughness: 0.22,
      metalness: 0.86,
      flatShading: true,
    });
    const mesh = new THREE.Mesh(facetGeometry, material);
    const axis = axes[i % axes.length] ?? 'y';
    const radius = 1.9 + (i % 3) * 0.28;
    facets.push({
      mesh,
      axis,
      radius,
      speed: 0.16 + i * 0.035,
      phase: (i / 7) * Math.PI * 2,
    });
    root.add(mesh);
  }

  // Partículas: profundidad atmosphere ----------------------------------
  const particleCount = 260;
  const positions = new Float32Array(particleCount * 3);
  for (let i = 0; i < particleCount; i += 1) {
    positions[i * 3] = (Math.random() - 0.5) * 9;
    positions[i * 3 + 1] = (Math.random() - 0.5) * 7;
    positions[i * 3 + 2] = (Math.random() - 0.5) * 6 - 1;
  }
  const particleGeometry = new THREE.BufferGeometry();
  particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  const particleMaterial = new THREE.PointsMaterial({
    color: 0x8f8fb0,
    size: 0.02,
    transparent: true,
    opacity: 0.55,
    sizeAttenuation: true,
  });
  const particles = new THREE.Points(particleGeometry, particleMaterial);
  scene.add(particles);

  // Luces ----------------------------------------------------------------
  scene.add(new THREE.HemisphereLight(0x9ea4ff, 0x0a0a12, 0.55));
  const keyLight = new THREE.DirectionalLight(0xffffff, 1.1);
  keyLight.position.set(4, 6, 5);
  scene.add(keyLight);
  const rimLight = new THREE.PointLight(LOOKS.unclassified.accent, 26, 22);
  rimLight.position.set(-3.4, -1.6, 2.6);
  scene.add(rimLight);

  let route: PrimaryRoute = 'unclassified';
  let scrollProgress = 0;
  let pointerX = 0;
  let pointerY = 0;
  let targetPointerX = 0;
  let targetPointerY = 0;
  let frame = 0;
  let elapsed = 0;
  let disposed = false;

  const look = LOOKS[route];

  function applyRoute(next: PrimaryRoute): void {
    route = next;
    const nextLook = LOOKS[next];
    coreMaterial.color.setHex(nextLook.core);
    coreMaterial.needsUpdate = true;
    rimLight.color.setHex(nextLook.accent);
    for (const facet of facets) {
      (facet.mesh.material as THREE.MeshStandardMaterial).color.setHex(nextLook.facets);
    }
  }

  function resize(): void {
    const parent = canvas.parentElement;
    const width = parent?.clientWidth ?? window.innerWidth;
    const height = parent?.clientHeight ?? window.innerHeight;
    renderer.setSize(width, height, false);
    camera.aspect = width / Math.max(height, 1);
    camera.updateProjectionMatrix();
  }

  function renderFrame(): void {
    const lookNow = LOOKS[route];
    const t = elapsed;

    // Movimiento sobre los tres ejes: cada faceta gira sobre su eje y el
    // conjunto rota con una velocidad propia de la ruta.
    root.rotation.x = Math.sin(t * 0.21) * 0.34 + scrollProgress * 0.8;
    root.rotation.y = t * lookNow.spin + scrollProgress * 1.4;
    root.rotation.z = Math.cos(t * 0.17) * 0.22 - scrollProgress * 0.5;

    for (const facet of facets) {
      const angle = t * facet.speed + facet.phase + scrollProgress * 2.2;
      const x = Math.cos(angle) * facet.radius;
      const y = Math.sin(angle * 0.8) * facet.radius * 0.6;
      const z = Math.sin(angle) * facet.radius * 0.8;
      facet.mesh.position.set(x, y, z);
      facet.mesh.rotation.x = angle * 1.3;
      facet.mesh.rotation.y = angle * 0.9;
      facet.mesh.rotation.z = angle * 0.6;
    }

    // Cámara: parallax suave con el puntero + travelled con el scroll.
    pointerX += (targetPointerX - pointerX) * 0.045;
    pointerY += (targetPointerY - pointerY) * 0.045;
    camera.position.x = pointerX * 0.55;
    camera.position.y = pointerY * 0.4;
    camera.position.z = 6.2 - scrollProgress * 1.5;
    camera.lookAt(0, 0, 0);

    particles.rotation.y = t * 0.02;
    particles.rotation.x = scrollProgress * 0.35;

    renderer.render(scene, camera);
  }

  function loop(): void {
    if (disposed) {
      return;
    }
    frame = window.requestAnimationFrame(loop);
    elapsed += 0.016;
    renderFrame();
  }

  resize();
  window.addEventListener('resize', resize, { passive: true });

  if (reduced) {
    // Composición estática: una sola pasada, sin bucle de animación.
    elapsed = 1.4;
    renderFrame();
  } else {
    loop();
  }

  return {
    setRoute: applyRoute,
    setScrollProgress: (progress: number) => {
      scrollProgress = Math.max(0, Math.min(1, progress));
    },
    setPointer: (x: number, y: number) => {
      if (reduced) {
        return;
      }
      targetPointerX = x;
      targetPointerY = y;
    },
    destroy: () => {
      disposed = true;
      window.cancelAnimationFrame(frame);
      window.removeEventListener('resize', resize);
      coreGeometry.dispose();
      coreMaterial.dispose();
      wireGeometry.dispose();
      wireMaterial.dispose();
      facetGeometry.dispose();
      for (const facet of facets) {
        (facet.mesh.material as THREE.Material).dispose();
      }
      particleGeometry.dispose();
      particleMaterial.dispose();
      renderer.dispose();
    },
  };
}
