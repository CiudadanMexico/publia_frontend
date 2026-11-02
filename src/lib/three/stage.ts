/**
 * Escenario 3D persistente de Publia 6.0.
 *
 * Una sola escena WebGL acompaña todo el relato. El prisma no se recrea en
 * cada sección: evoluciona. Cada estado narrativo (abstract, enterprise,
 * efficiency, explorer, cooperative, housing, convergence) define su propia
 * paleta, su geometría dominante, su cámara y su ritmo; las transiciones
 * interpolan parámetros en lugar de reconstruir objetos.
 *
 * Reglas de rendimiento y accesibilidad:
 * - Un único renderer, un único bucle de render.
 * - Se pausa cuando la pestaña está oculta o el lienzo sale del viewport.
 * - Con `prefers-reduced-motion` se dibuja un único fotograma estático.
 * - Toda la geometría y los materiales se liberan al destruir.
 */

import * as THREE from 'three';
import type { StageState } from '../experience/types';

interface Look {
  core: number;
  shards: number;
  accent: number;
  fog: number;
  /** Separación de las facetas (0 = entidad compacta, 1 = fragmentada). */
  spread: number;
  /** Velocidad de rotación base. */
  speed: number;
  /** Opacidad de la celosía empresarial (0 = oculta). */
  lattice: number;
  /** Opacidad de la red de nodos (0 = oculta). */
  nodes: number;
  /** Posición de cámara. */
  camera: [number, number, number];
  /** Objetivo de la cámara. */
  target: [number, number, number];
  /** Intensidad de la luz de acento. */
  accentLight: number;
}

const LOOKS: Record<StageState, Look> = {
  abstract: {
    core: 0x8b7bff,
    shards: 0xc9b8ff,
    accent: 0xb48bff,
    fog: 0x07070a,
    spread: 0.45,
    speed: 0.22,
    lattice: 0,
    nodes: 0.12,
    camera: [0, 0, 7.4],
    target: [0, 0, 0],
    accentLight: 1.1,
  },
  enterprise: {
    core: 0x9aa3b8,
    shards: 0xd7dbe6,
    accent: 0x8fa2c8,
    fog: 0x0a0b0f,
    spread: 0.22,
    speed: 0.12,
    lattice: 0.85,
    nodes: 0.05,
    camera: [1.6, 0.4, 6.2],
    target: [0, 0, 0],
    accentLight: 0.8,
  },
  efficiency: {
    core: 0xffb547,
    shards: 0xffd08a,
    accent: 0xff9f1c,
    fog: 0x0b0906,
    spread: 0.3,
    speed: 0.34,
    lattice: 0.18,
    nodes: 0.1,
    camera: [-1.4, -0.6, 6],
    target: [0, 0, 0],
    accentLight: 1.5,
  },
  explorer: {
    core: 0x4fd1c5,
    shards: 0x9bf3ea,
    accent: 0x2bb3a7,
    fog: 0x050a0b,
    spread: 0.72,
    speed: 0.42,
    lattice: 0,
    nodes: 0.22,
    camera: [0.8, 1.1, 6.8],
    target: [0, 0, 0],
    accentLight: 1.35,
  },
  cooperative: {
    core: 0x6ee7a8,
    shards: 0xb7f7d1,
    accent: 0x38c98a,
    fog: 0x050b08,
    spread: 0.5,
    speed: 0.26,
    lattice: 0,
    nodes: 0.85,
    camera: [0, 0.8, 7],
    target: [0, 0, 0],
    accentLight: 1.25,
  },
  housing: {
    core: 0x8ab4ff,
    shards: 0xc6d9ff,
    accent: 0x5b8cff,
    fog: 0x060910,
    spread: 0.62,
    speed: 0.16,
    lattice: 0.35,
    nodes: 0.7,
    camera: [-0.6, 1.4, 7.6],
    target: [0, 0, 0],
    accentLight: 1,
  },
  convergence: {
    core: 0xb48bff,
    shards: 0xe6dcff,
    accent: 0xd0b3ff,
    fog: 0x08070d,
    spread: 0.18,
    speed: 0.2,
    lattice: 0.12,
    nodes: 0.3,
    camera: [0, 0, 6.6],
    target: [0, 0, 0],
    accentLight: 1.45,
  },
};

const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;
const lerpColor = (a: number, b: number, t: number): THREE.Color =>
  new THREE.Color(a).lerp(new THREE.Color(b), t);

export interface StageOptions {
  canvas: HTMLCanvasElement;
  reducedMotion: boolean;
}

export interface Stage {
  setStage(state: StageState): void;
  /** Progreso dentro de la escena activa (0-1). */
  setSceneProgress(progress: number): void;
  /** Progreso global del recorrido (0-1). */
  setScrollProgress(progress: number): void;
  setPointer(x: number, y: number): void;
  destroy(): void;
}

export function createStage({ canvas, reducedMotion }: StageOptions): Stage | null {
  let renderer: THREE.WebGLRenderer;
  try {
    renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
      preserveDrawingBuffer: true,
    });
  } catch {
    return null;
  }
  if (!renderer.getContext()) {
    renderer.dispose();
    return null;
  }

  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
  renderer.setSize(canvas.clientWidth || window.innerWidth, canvas.clientHeight || window.innerHeight, false);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.1;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(42, 16 / 9, 0.1, 100);
  camera.position.set(...LOOKS.abstract.camera);

  const world = new THREE.Group();
  scene.add(world);

  // --- entidad central (el prisma) ---------------------------------------
  const coreGeometry = new THREE.IcosahedronGeometry(1.55, 1);
  const coreMaterial = new THREE.MeshPhysicalMaterial({
    color: LOOKS.abstract.core,
    roughness: 0.12,
    metalness: 0.15,
    transmission: 0.92,
    thickness: 1.4,
    ior: 1.62,
    clearcoat: 1,
    clearcoatRoughness: 0.08,
    transparent: true,
    opacity: 0.94,
  });
  const core = new THREE.Mesh(coreGeometry, coreMaterial);
  world.add(core);

  // --- facetas orbitantes --------------------------------------------------
  const shardGeometry = new THREE.TetrahedronGeometry(0.38, 0);
  const shardMaterial = new THREE.MeshStandardMaterial({
    color: LOOKS.abstract.shards,
    roughness: 0.2,
    metalness: 0.85,
    flatShading: true,
    transparent: true,
    opacity: 0.95,
  });
  const shards: Array<{ mesh: THREE.Mesh; axis: 'x' | 'y' | 'z'; radius: number; speed: number; phase: number }> = [];
  const axes: ReadonlyArray<'x' | 'y' | 'z'> = ['x', 'y', 'z'];
  for (let i = 0; i < 7; i += 1) {
    const mesh = new THREE.Mesh(shardGeometry, shardMaterial);
    const axis = axes[i % axes.length] ?? 'y';
    const radius = 2.1 + (i % 3) * 0.3;
    mesh.userData['radius'] = radius;
    mesh.userData['phase'] = i * 0.9;
    mesh.userData['axis'] = axis;
    mesh.userData['speed'] = 0.5 + (i % 4) * 0.12;
    world.add(mesh);
    shards.push({
      mesh,
      axis,
      radius,
      speed: 0.5 + (i % 4) * 0.12,
      phase: i * 0.9,
    });
  }

  // --- celosía (precisión empresarial) -------------------------------------
  const latticeGeometry = new THREE.EdgesGeometry(new THREE.BoxGeometry(4.6, 4.6, 4.6));
  const latticeMaterial = new THREE.LineBasicMaterial({
    color: LOOKS.enterprise.accent,
    transparent: true,
    opacity: 0,
  });
  const lattice = new THREE.LineSegments(latticeGeometry, latticeMaterial);
  world.add(lattice);

  // --- red de nodos (cooperativas y housing) --------------------------------
  const nodeGroup = new THREE.Group();
  const nodeGeometry = new THREE.SphereGeometry(0.11, 14, 14);
  const nodeMaterial = new THREE.MeshStandardMaterial({
    color: LOOKS.cooperative.accent,
    emissive: new THREE.Color(LOOKS.cooperative.accent),
    emissiveIntensity: 0.55,
    transparent: true,
    opacity: 0,
  });
  const linkMaterial = new THREE.LineBasicMaterial({
    color: LOOKS.cooperative.shards,
    transparent: true,
    opacity: 0,
  });
  const nodeCount = 26;
  const nodePositions: THREE.Vector3[] = [];
  for (let i = 0; i < nodeCount; i += 1) {
    // distribución esférica irregular pero determinista
    const t = (i + 1) / nodeCount;
    const phi = Math.acos(1 - 2 * t);
    const theta = Math.PI * (1 + Math.sqrt(5)) * i;
    const radius = 3.1 + ((i * 37) % 11) * 0.06;
    const position = new THREE.Vector3(
      Math.sin(phi) * Math.cos(theta) * radius,
      Math.sin(phi) * Math.sin(theta) * radius,
      Math.cos(phi) * radius,
    );
    nodePositions.push(position);
    const node = new THREE.Mesh(nodeGeometry, nodeMaterial);
    node.position.copy(position);
    nodeGroup.add(node);
  }
  const linkGeometry = new THREE.BufferGeometry().setFromPoints(
    nodePositions.flatMap((position, index) => {
      const next = nodePositions[(index + 1) % nodePositions.length];
      return next ? [position, next] : [position, position];
    }),
  );
  const links = new THREE.LineSegments(linkGeometry, linkMaterial);
  nodeGroup.add(links);
  world.add(nodeGroup);

  // --- partículas de atmósfera ----------------------------------------------
  const particleCount = 420;
  const particlePositions = new Float32Array(particleCount * 3);
  for (let i = 0; i < particleCount; i += 1) {
    particlePositions[i * 3] = (Math.random() - 0.5) * 22;
    particlePositions[i * 3 + 1] = (Math.random() - 0.5) * 14;
    particlePositions[i * 3 + 2] = (Math.random() - 0.5) * 18 - 2;
  }
  const particleGeometry = new THREE.BufferGeometry();
  particleGeometry.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
  const particleMaterial = new THREE.PointsMaterial({
    color: LOOKS.abstract.shards,
    size: 0.035,
    transparent: true,
    opacity: 0.42,
    sizeAttenuation: true,
  });
  const particles = new THREE.Points(particleGeometry, particleMaterial);
  scene.add(particles);

  // --- luces ----------------------------------------------------------------
  const keyLight = new THREE.DirectionalLight(0xffffff, 1.6);
  keyLight.position.set(4, 6, 5);
  scene.add(keyLight);
  const rimLight = new THREE.PointLight(LOOKS.abstract.accent, LOOKS.abstract.accentLight * 22, 26);
  rimLight.position.set(-3.4, 2.2, 3.6);
  scene.add(rimLight);
  const fillLight = new THREE.HemisphereLight(0x9fb4ff, 0x0a0a12, 0.55);
  scene.add(fillLight);

  scene.fog = new THREE.FogExp2(LOOKS.abstract.fog, 0.055);

  // --- estado ----------------------------------------------------------------
  let currentLook: Look = LOOKS.abstract;
  let targetLook: Look = LOOKS.abstract;
  let sceneProgress = 0;
  let globalProgress = 0;
  let pointerX = 0;
  let pointerY = 0;
  let targetPointerX = 0;
  let targetPointerY = 0;
  let elapsed = 0;
  let running = reducedMotion ? false : true;
  let visible = true;
  let disposed = false;
  let frame = 0;

  const resize = (): void => {
    const width = canvas.clientWidth || window.innerWidth;
    const height = canvas.clientHeight || window.innerHeight;
    if (width === 0 || height === 0) {
      return;
    }
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
  };

  const observer = new ResizeObserver(resize);
  observer.observe(canvas);
  resize();

  const onVisibility = (): void => {
    visible = document.visibilityState === 'visible';
  };
  document.addEventListener('visibilitychange', onVisibility);

  const io = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        visible = entry.isIntersecting && document.visibilityState === 'visible';
      }
    },
    { threshold: 0 },
  );
  io.observe(canvas);

  const applyLook = (delta: number): void => {
    const t = Math.min(1, delta * 3.2);
    currentLook = {
      core: currentLook.core,
      shards: currentLook.shards,
      accent: currentLook.accent,
      fog: currentLook.fog,
      spread: lerp(currentLook.spread, targetLook.spread, t),
      speed: lerp(currentLook.speed, targetLook.speed, t),
      lattice: lerp(currentLook.lattice, targetLook.lattice, t),
      nodes: lerp(currentLook.nodes, targetLook.nodes, t),
      camera: [
        lerp(currentLook.camera[0], targetLook.camera[0], t),
        lerp(currentLook.camera[1], targetLook.camera[1], t),
        lerp(currentLook.camera[2], targetLook.camera[2], t),
      ],
      target: [
        lerp(currentLook.target[0], targetLook.target[0], t),
        lerp(currentLook.target[1], targetLook.target[1], t),
        lerp(currentLook.target[2], targetLook.target[2], t),
      ],
      accentLight: lerp(currentLook.accentLight, targetLook.accentLight, t),
    };
    currentLook.core = lerpColor(currentLook.core, targetLook.core, t).getHex();
    currentLook.shards = lerpColor(currentLook.shards, targetLook.shards, t).getHex();
    currentLook.accent = lerpColor(currentLook.accent, targetLook.accent, t).getHex();
    currentLook.fog = lerpColor(currentLook.fog, targetLook.fog, t).getHex();
  };

  const render = (delta: number): void => {
    elapsed += delta;
    applyLook(delta);

    // fragmentación y recomposición ligadas al progreso de la escena
    const spread = currentLook.spread * (0.55 + sceneProgress * 0.75);
    const recompose = 1 - Math.min(1, Math.max(0, (sceneProgress - 0.65) / 0.35)) * 0.45;

    core.rotation.x += delta * currentLook.speed * 0.7;
    core.rotation.y += delta * currentLook.speed;
    core.rotation.z += delta * currentLook.speed * 0.25;
    const pulse = 1 + Math.sin(elapsed * 1.1) * 0.03;
    core.scale.setScalar(pulse * (0.92 + (1 - spread) * 0.16));

    for (const shard of shards) {
      const axis = shard.axis;
      const angle = elapsed * shard.speed + shard.phase;
      const radius = shard.radius * spread * recompose + 0.4;
      const cos = Math.cos(angle) * radius;
      const sin = Math.sin(angle) * radius;
      if (axis === 'x') {
        shard.mesh.position.set(cos, sin, Math.sin(angle * 0.6) * radius * 0.35);
      } else if (axis === 'y') {
        shard.mesh.position.set(sin, cos, Math.cos(angle * 0.7) * radius * 0.35);
      } else {
        shard.mesh.position.set(Math.cos(angle * 0.8) * radius, Math.sin(angle * 0.5) * radius, cos);
      }
      shard.mesh.rotation.x += delta * shard.speed * 1.6;
      shard.mesh.rotation.y += delta * shard.speed * 1.1;
    }

    lattice.rotation.y += delta * 0.12;
    lattice.rotation.x = Math.sin(elapsed * 0.18) * 0.12;
    latticeMaterial.opacity = currentLook.lattice * 0.55;
    lattice.visible = currentLook.lattice > 0.01;

    nodeMaterial.opacity = currentLook.nodes;
    linkMaterial.opacity = currentLook.nodes * 0.35;
    nodeGroup.rotation.y -= delta * 0.08;
    nodeGroup.rotation.x = Math.sin(elapsed * 0.12) * 0.16;
    nodeGroup.visible = currentLook.nodes > 0.01;

    particles.rotation.y = elapsed * 0.012 + globalProgress * 0.6;
    particleMaterial.opacity = 0.28 + currentLook.nodes * 0.22;

    // cámara: dolly con el scroll + parallax del puntero
    pointerX = lerp(pointerX, targetPointerX, Math.min(1, delta * 4));
    pointerY = lerp(pointerY, targetPointerY, Math.min(1, delta * 4));
    const dolly = 1 - globalProgress * 0.22;
    camera.position.x = currentLook.camera[0] + pointerX * 0.85;
    camera.position.y = currentLook.camera[1] + pointerY * 0.6;
    camera.position.z = currentLook.camera[2] * dolly;
    camera.lookAt(...currentLook.target);

    coreMaterial.color.setHex(currentLook.core);
    shardMaterial.color.setHex(currentLook.shards);
    rimLight.color.setHex(currentLook.accent);
    rimLight.intensity = currentLook.accentLight * 22;
    particleMaterial.color.setHex(currentLook.shards);
    (scene.fog as THREE.FogExp2).color.setHex(currentLook.fog);

    renderer.render(scene, camera);
  };

  let last = performance.now();
  const loop = (now: number): void => {
    if (disposed) {
      return;
    }
    frame = requestAnimationFrame(loop);
    const delta = Math.min(0.05, (now - last) / 1000);
    last = now;
    if (!visible) {
      return;
    }
    render(delta);
  };

  if (reducedMotion) {
    // Un único fotograma estático: la escena sigue siendo legible sin movimiento.
    render(0.016);
  } else {
    frame = requestAnimationFrame(loop);
  }

  return {
    setStage(state: StageState): void {
      const look = LOOKS[state] ?? LOOKS.abstract;
      targetLook = look;
      if (reducedMotion) {
        currentLook = look;
        render(0.016);
      }
    },
    setSceneProgress(progress: number): void {
      sceneProgress = Math.min(1, Math.max(0, progress));
      if (reducedMotion) {
        render(0.016);
      }
    },
    setScrollProgress(progress: number): void {
      globalProgress = Math.min(1, Math.max(0, progress));
    },
    setPointer(x: number, y: number): void {
      targetPointerX = Math.min(1, Math.max(-1, x));
      targetPointerY = Math.min(1, Math.max(-1, y));
    },
    destroy(): void {
      disposed = true;
      cancelAnimationFrame(frame);
      observer.disconnect();
      io.disconnect();
      document.removeEventListener('visibilitychange', onVisibility);
      coreGeometry.dispose();
      coreMaterial.dispose();
      shardGeometry.dispose();
      shardMaterial.dispose();
      latticeGeometry.dispose();
      latticeMaterial.dispose();
      nodeGeometry.dispose();
      nodeMaterial.dispose();
      linkGeometry.dispose();
      linkMaterial.dispose();
      particleGeometry.dispose();
      particleMaterial.dispose();
      renderer.dispose();
    },
  };
}
