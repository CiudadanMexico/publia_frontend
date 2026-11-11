/**
 * Universo 3D persistente de Publia 6.0 (fase 2).
 *
 * Un único lienzo, una única escena y los recursos aprobados del hero:
 * mascota GLB, prisma GLB facetado, plataforma, estelas, partículas, fondo
 * espacial y las ocho tarjetas holográficas. A eso se suma la red de nodos
 * que ya acompañaba las escenas de cooperativa y housing.
 *
 * La navegación inmersiva funciona con «mundos»: cada ruta es un mundo con
 * su propia cámara, iluminación, disposición de tarjetas y comportamiento
 * del prisma. `travelTo()` anima todos esos parámetros a la vez en una
 * timeline GSAP, de modo que elegir una ruta se siente como entrar a otro
 * entorno dentro del mismo universo 3D, no como bajar a otra sección.
 *
 * Reglas:
 *  - Los modelos aprobados nunca se destruyen ni se sustituyen durante las
 *    transiciones: sólo cambian sus parámetros.
 *  - `prefers-reduced-motion`: el viaje es inmediato (sin animación).
 *  - `destroy()` libera todo al desmontar.
 */
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

import { createPubliaSpaceBackground } from './hero/fondo';
import { crearEstelasOrbitales } from './hero/estelas';
import { crearPlataformaPublia } from './hero/plataforma';
import { createPubliaParticles } from './hero/particulas';

gsap.registerPlugin(ScrollTrigger);

export type UniverseWorld = 'hero' | 'enterprise' | 'efficiency' | 'cooperative' | 'diagnosis';

export interface UniverseOptions {
  canvas: HTMLCanvasElement;
  /** Sección del hero: disparador del ScrollTrigger de ambiente. */
  trigger?: HTMLElement | null;
  reducedMotion?: boolean;
}

/** Modulación continua de la escena activa (conduce ScrollTrigger por scrub). */
export interface SceneLook {
  camX: number;
  camY: number;
  camZ: number;
  /** Matiz hacia el que se desplaza el fondo (mezcla 0-1). */
  tint: THREE.Color;
  tintMix: number;
  /** Refuerzo de la red de nodos (0-1). */
  network: number;
  /** Apertura extra del prisma/estelas. */
  spread: number;
  /** Multiplicador de la luz clave. */
  lightBoost: number;
}

export interface TravelOptions {
  duration?: number;
  onComplete?: () => void;
  /** Si se indica, los tweens de cámara se agregan a esta timeline (transición unificada). */
  timeline?: gsap.core.Timeline;
  /** Si se indica, el viaje lo conduce el scroll (pin + scrub) en vez del tiempo. */
  scrub?: { trigger: HTMLElement; start?: string; end?: string };
}

export interface UniverseHandle {
  /** Viaje cinematográfico a otro mundo del mismo universo. */
  travelTo(world: UniverseWorld, options?: TravelOptions): void;
  /** Pulso temporal sobre una tarjeta (hover/tap). */
  cardPulse(index: number): void;
  /** Resalta una tarjeta de forma sostenida (foco/hover). */
  cardFocus(index: number, on: boolean): void;
  /** Gesto sutil de la P ante una decisión. */
  gesture(): void;
  world(): UniverseWorld;
  /** Modulación por escena (progreso 0-1 dentro de la escena activa). */
  setSceneProgress(progress: number): void;
  /** Modulación continua de la escena visible (camera/tinte/red/luz). */
  setSceneLook(look: Partial<SceneLook> & { tintHex?: number }): void;
  setPointer(x: number, y: number): void;
  /** Pausa el render cuando el lienzo no se usa. */
  setActive(active: boolean): void;
  /** Pausa la animación ambiental (control «Pausar» del hero). */
  setPaused(paused: boolean): void;
  /** Fragmentación y recomposición del prisma (control «Fragmentar»). */
  burst(): void;
  /** 7M-F §5.9: conduce el prisma con el progreso normalizado (0–1) del pin del hero. */
  setHeroPin(progress: number): void;
  /** Frames renderizados (para retirar el preloader tras el primer frame). */
  frames(): number;
  /** Posición de cámara actual (para QA). */
  cameraPosition(): [number, number, number];
  /** Color dominante de la escena (para QA). */
  dominantTint(): string;
  /** Tarjetas dentro del encuadre (para QA). */
  cardsInView(): number;
  errors(): string[];
  destroy(): void;
}

interface CardLayout {
  position(i: number): [number, number, number];
  scale(i: number): number;
}

interface WorldSpec {
  camera: [number, number, number];
  target: [number, number, number];
  rig: { x: number; y: number; scale: number };
  lights: {
    hemi: number;
    key: number;
    rim: number;
    amber: number;
    keyColor: number;
    rimColor: number;
    amberColor: number;
    fog: number;
  };
  cards: CardLayout;
  prism: { opacity: number; scale: number; spread: number };
  platform: { expansion: number; intensity: number };
  particles: { intensity: number; orbit: number };
  network: number;
  background: number;
}

const TAU = Math.PI * 2;

/** Disposición aprobada del hero: dos columnas de cuatro tarjetas. */
const heroCards: CardLayout = {
  position(i) {
    const column = i < 4 ? 0 : 1;
    const row = i % 4;
    return [column === 0 ? -1.75 : 1.85, 1.12 + row * 1.02, 2.4];
  },
  scale: () => 0.83,
};

/** Gran empresa: las tarjetas se abren en un arco amplio, tipo panel de control. */
const enterpriseCards: CardLayout = {
  position(i) {
    const a = -1.22 + (i / 7) * 2.44;
    return [Math.sin(a) * 3.1, 2.15 + Math.sin(i * 1.3) * 0.55, 1.9 + Math.cos(a) * 0.5];
  },
  scale: () => 0.7,
};

/** Eficiencia: las tarjetas se agrupan en una espiral compacta. */
const efficiencyCards: CardLayout = {
  position(i) {
    const a = i * 0.9;
    const r = 0.9 + i * 0.17;
    return [Math.cos(a) * r * 1.25, 1.15 + i * 0.3, 1.7 + Math.sin(a) * r * 0.4];
  },
  scale: () => 0.62,
};

/** Cooperativa: anillo alrededor de la red de nodos. */
const cooperativeCards: CardLayout = {
  position(i) {
    const a = (i / 8) * TAU + 0.35;
    return [Math.cos(a) * 3.4, 1.1 + Math.sin(a * 2) * 0.85, Math.sin(a) * 1.25];
  },
  scale: () => 0.66,
};

/** Diagnóstico común: las tarjetas forman un halo sobre el prisma. */
const diagnosisCards: CardLayout = {
  position(i) {
    const a = (i / 8) * TAU;
    return [Math.cos(a) * 2.3, 2.3 + Math.sin(a * 2) * 0.35, 0.7 + Math.sin(a) * 0.5];
  },
  scale: () => 0.58,
};

export const WORLDS: Record<UniverseWorld, WorldSpec> = {
  hero: {
    camera: [0, 2.4, 11.6],
    target: [0, 1.05, 0],
    rig: { x: 2.35, y: -0.25, scale: 1 },
    lights: {
      hemi: 3.3,
      key: 5,
      rim: 110,
      amber: 45,
      keyColor: 0xbcefff,
      rimColor: 0x7c66ff,
      amberColor: 0xffba43,
      fog: 0x050b1b,
    },
    cards: heroCards,
    prism: { opacity: 0.36, scale: 1, spread: 0 },
    platform: { expansion: 0, intensity: 1 },
    particles: { intensity: 0.75, orbit: 0.4 },
    network: 0,
    background: 0x050b1b,
  },
  enterprise: {
    camera: [1.9, 1.7, 8.4],
    target: [0.4, 1.0, 0],
    rig: { x: 0.9, y: -0.35, scale: 0.92 },
    lights: {
      hemi: 2.6,
      key: 6.2,
      rim: 90,
      amber: 18,
      keyColor: 0xcfe6ff,
      rimColor: 0x5b8cff,
      amberColor: 0xffc873,
      fog: 0x0a0e18,
    },
    cards: enterpriseCards,
    prism: { opacity: 0.5, scale: 1.06, spread: 0.35 },
    platform: { expansion: 0.3, intensity: 1.2 },
    particles: { intensity: 0.6, orbit: 0.15 },
    network: 0.08,
    background: 0x0a0e18,
  },
  efficiency: {
    camera: [-2.1, 1.9, 8.8],
    target: [-0.3, 1.1, 0],
    rig: { x: 1.4, y: -0.3, scale: 0.95 },
    lights: {
      hemi: 3.6,
      key: 4.2,
      rim: 70,
      amber: 80,
      keyColor: 0xffe9c4,
      rimColor: 0xff9f1c,
      amberColor: 0xffba43,
      fog: 0x0d0a05,
    },
    cards: efficiencyCards,
    prism: { opacity: 0.42, scale: 1.1, spread: 0.55 },
    platform: { expansion: 0.45, intensity: 1.35 },
    particles: { intensity: 0.9, orbit: 1 },
    network: 0.1,
    background: 0x0d0a05,
  },
  cooperative: {
    camera: [0, 1.9, 9.4],
    target: [0, 1.0, 0],
    rig: { x: 1.1, y: -0.3, scale: 0.98 },
    lights: {
      hemi: 3.1,
      key: 4.6,
      rim: 120,
      amber: 40,
      keyColor: 0xd6ffe9,
      rimColor: 0x38c98a,
      amberColor: 0xffba43,
      fog: 0x060d08,
    },
    cards: cooperativeCards,
    prism: { opacity: 0.3, scale: 0.94, spread: 0.2 },
    platform: { expansion: 0.25, intensity: 1.1 },
    particles: { intensity: 0.85, orbit: 0.9 },
    network: 0.9,
    background: 0x060d08,
  },
  diagnosis: {
    camera: [0, 2.1, 7.6],
    target: [0, 1.2, 0],
    rig: { x: 0, y: -0.2, scale: 1.05 },
    lights: {
      hemi: 3.8,
      key: 5.4,
      rim: 130,
      amber: 50,
      keyColor: 0xe6dcff,
      rimColor: 0xb48bff,
      amberColor: 0xffca34,
      fog: 0x08070d,
    },
    cards: diagnosisCards,
    prism: { opacity: 0.62, scale: 1.14, spread: 0.8 },
    platform: { expansion: 0.55, intensity: 1.4 },
    particles: { intensity: 1, orbit: 0.5 },
    network: 0.35,
    background: 0x08070d,
  },
};

interface Card {
  group: THREE.Group;
  base: THREE.Vector3;
  scale: number;
}

export async function createUniverse({
  canvas,
  trigger = null,
  reducedMotion = false,
}: UniverseOptions): Promise<UniverseHandle | null> {
  const failures: string[] = [];

  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: false,
    powerPreference: 'high-performance',
    preserveDrawingBuffer: true,
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.7));
  renderer.setSize(window.innerWidth, window.innerHeight, false);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.25;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(WORLDS.hero.background);

  const camera = new THREE.PerspectiveCamera(40, window.innerWidth / window.innerHeight, 0.1, 100);
  const cameraBase = new THREE.Vector3(0, 2.4, 11.6);
  camera.position.copy(cameraBase);
  const lookTarget = new THREE.Vector3(0, 1.05, 0);
  camera.lookAt(lookTarget);

  const hemi = new THREE.HemisphereLight(0xcdefff, 0x1b2148, 3.3);
  scene.add(hemi);
  const key = new THREE.DirectionalLight(0xbcefff, 5);
  key.position.set(-3, 6, 6);
  scene.add(key);
  const rim = new THREE.PointLight(0x7c66ff, 110, 13);
  rim.position.set(3, 3, -2);
  scene.add(rim);
  const amber = new THREE.PointLight(0xffba43, 45, 9);
  amber.position.set(-2, 3, 4);
  scene.add(amber);

  const composer = new EffectComposer(renderer);
  const renderPass = new RenderPass(scene, camera);
  composer.addPass(renderPass);
  const bloom = new UnrealBloomPass(
    new THREE.Vector2(window.innerWidth, window.innerHeight),
    0.67,
    0.65,
    0.85,
  );
  composer.addPass(bloom);

  const rig = new THREE.Group();
  scene.add(rig);

  const platform = crearPlataformaPublia({ radius: 2.15 });
  rig.add(platform.group);

  const trails = crearEstelasOrbitales({ quality: window.innerWidth < 700 ? 'low' : 'high' });
  trails.grupo.position.y = 2.1;
  rig.add(trails.grupo);

  const particles = createPubliaParticles({
    count: window.innerWidth < 700 ? 180 : 460,
    reducedMotion,
  });
  particles.root.position.y = 2.0;
  rig.add(particles.root);

  let background: Awaited<ReturnType<typeof createPubliaSpaceBackground>> | null = null;
  try {
    background = await createPubliaSpaceBackground(scene, {
      textureUrl: '/textures/atmosfera.webp',
    });
  } catch (error) {
    failures.push(`fondo: ${(error as Error).message}`);
  }

  // --- modelos aprobados -------------------------------------------------------
  const loader = new GLTFLoader();
  let mascot: THREE.Group | null = null;
  let prism: THREE.Group | null = null;
  const shardMeshes: THREE.Mesh[] = [];
  const shardOrigins: Array<{ pos: THREE.Vector3; rot: THREE.Euler }> = [];

  const normalizeModel = (model: THREE.Object3D, height: number): THREE.Group => {
    const box = new THREE.Box3().setFromObject(model);
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());
    model.position.sub(center);
    const wrap = new THREE.Group();
    wrap.add(model);
    wrap.scale.setScalar(height / Math.max(size.y, 0.001));
    return wrap;
  };

  try {
    const [robotAsset, prismAsset] = await Promise.all([
      loader.loadAsync('/models/PUBLIA_P_robotica_v2.glb'),
      loader.loadAsync('/models/PUBLIA_prisma_suave_v2.glb'),
    ]);
    mascot = normalizeModel(robotAsset.scene, 3.15);
    mascot.position.set(0, 2.18, 0);
    rig.add(mascot);
    mascot.traverse((object) => {
      const mesh = object as THREE.Mesh;
      if (!mesh.isMesh) return;
      mesh.castShadow = false;
      (mesh.material as THREE.Material).side = THREE.DoubleSide;
    });

    prism = normalizeModel(prismAsset.scene, 3.75);
    prism.position.set(0.3, 2.25, -0.45);
    rig.add(prism);
    prism.traverse((object) => {
      const mesh = object as THREE.Mesh;
      if (!mesh.isMesh) return;
      const material = (mesh.material as THREE.MeshStandardMaterial).clone();
      mesh.material = material;
      material.transparent = true;
      material.opacity = 0.36;
      material.depthWrite = false;
      material.side = THREE.DoubleSide;
      if (mesh.name.startsWith('Facet_')) shardMeshes.push(mesh);
    });
    shardOrigins.push(
      ...shardMeshes.map((mesh) => ({ pos: mesh.position.clone(), rot: mesh.rotation.clone() })),
    );
  } catch (error) {
    failures.push(`modelos: ${(error as Error).message}`);
  }

  // --- ocho tarjetas holográficas (iconos aprobados) ----------------------------
  const ICON_LABELS = [
    'INTELIGENCIA ARTIFICIAL',
    'DESARROLLO WEB',
    'AGENTES IA',
    'COOPERATIVISMO',
    'MULTIMEDIA',
    'MARKETING',
    'ECOLOGÍA',
    'INFRAESTRUCTURA',
  ] as const;
  const cards: Card[] = [];
  const iconTextures: THREE.Texture[] = [];
  const texLoader = new THREE.TextureLoader();
  for (let i = 0; i < 8; i += 1) {
    const file = `icono_${String(i + 1).padStart(2, '0')}.png`;
    let texture: THREE.Texture;
    try {
      texture = await texLoader.loadAsync(`/icons/${file}`);
    } catch (error) {
      failures.push(`icono ${file}: ${(error as Error).message}`);
      continue;
    }
    texture.colorSpace = THREE.SRGBColorSpace;
    iconTextures.push(texture);

    const group = new THREE.Group();
    group.name = `Tarjeta_${String(i + 1).padStart(2, '0')}_${ICON_LABELS[i]}`;
    const plate = new THREE.Mesh(
      new THREE.PlaneGeometry(0.84, 0.96),
      new THREE.MeshBasicMaterial({
        color: 0x0b2e54,
        transparent: true,
        opacity: 0.48,
        side: THREE.DoubleSide,
        depthWrite: false,
      }),
    );
    const border = new THREE.LineSegments(
      new THREE.EdgesGeometry(new THREE.PlaneGeometry(0.84, 0.96)),
      new THREE.LineBasicMaterial({
        color: i % 3 === 0 ? 0xffc365 : 0x64cfff,
        transparent: true,
        opacity: 0.7,
      }),
    );
    border.position.z = 0.008;
    const icon = new THREE.Mesh(
      new THREE.PlaneGeometry(0.65, 0.65),
      new THREE.MeshBasicMaterial({
        map: texture,
        transparent: true,
        depthWrite: false,
        side: THREE.DoubleSide,
      }),
    );
    icon.position.z = 0.02;
    group.add(plate, border, icon);

    const [px, py, pz] = WORLDS.hero.cards.position(i);
    group.position.set(px, py, pz);
    group.scale.setScalar(WORLDS.hero.cards.scale(i));
    group.userData['phase'] = i * 0.8;
    rig.add(group);
    cards.push({ group, base: group.position.clone(), scale: WORLDS.hero.cards.scale(i) });
  }

  // --- red de nodos (cooperativa / housing) -------------------------------------
  const nodeGroup = new THREE.Group();
  const nodeGeometry = new THREE.SphereGeometry(0.11, 14, 14);
  const nodeMaterial = new THREE.MeshStandardMaterial({
    color: 0x38c98a,
    emissive: new THREE.Color(0x38c98a),
    emissiveIntensity: 0.55,
    transparent: true,
    opacity: 0,
  });
  const linkMaterial = new THREE.LineBasicMaterial({
    color: 0xb7f7d1,
    transparent: true,
    opacity: 0,
  });
  const nodeCount = 26;
  const nodePositions: THREE.Vector3[] = [];
  for (let i = 0; i < nodeCount; i += 1) {
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
  nodeGroup.add(new THREE.LineSegments(linkGeometry, linkMaterial));
  nodeGroup.position.set(0, 2.0, 0);
  rig.add(nodeGroup);

  const pulseGeometry = new THREE.SphereGeometry(0.075, 10, 10);
  const pulseMaterial = new THREE.MeshBasicMaterial({
    color: 0xb7f7d1,
    transparent: true,
    opacity: 0,
  });
  const pulses: Array<{
    mesh: THREE.Mesh;
    from: THREE.Vector3;
    to: THREE.Vector3;
    progress: number;
    speed: number;
  }> = [];
  for (let i = 0; i < 12; i += 1) {
    const mesh = new THREE.Mesh(pulseGeometry, pulseMaterial);
    const from = nodePositions[i % nodePositions.length] ?? new THREE.Vector3();
    const to = nodePositions[(i * 5 + 3) % nodePositions.length] ?? new THREE.Vector3();
    mesh.position.copy(from);
    rig.add(mesh);
    pulses.push({ mesh, from, to, progress: (i * 0.37) % 1, speed: 0.18 + (i % 5) * 0.05 });
  }

  // --- parámetros animables del mundo activo -------------------------------------
  const hero = WORLDS.hero;
  const current = {
    world: 'hero' as UniverseWorld,
    camera: { x: hero.camera[0], y: hero.camera[1], z: hero.camera[2] },
    target: { x: hero.target[0], y: hero.target[1], z: hero.target[2] },
    rig: { x: hero.rig.x, y: hero.rig.y, scale: hero.rig.scale },
    lights: {
      hemi: hero.lights.hemi,
      key: hero.lights.key,
      rim: hero.lights.rim,
      amber: hero.lights.amber,
      keyColor: new THREE.Color(hero.lights.keyColor),
      rimColor: new THREE.Color(hero.lights.rimColor),
      amberColor: new THREE.Color(hero.lights.amberColor),
      fog: new THREE.Color(hero.lights.fog),
    },
    prism: { opacity: hero.prism.opacity, scale: hero.prism.scale, spread: hero.prism.spread },
    platform: { expansion: hero.platform.expansion, intensity: hero.platform.intensity },
    particles: { intensity: hero.particles.intensity, orbit: hero.particles.orbit },
    network: hero.network,
    background: new THREE.Color(hero.background),
  };

  let sceneProgress = 0;
  let active = true;
  let disposed = false;
  let paused = reducedMotion;
  let elapsed = 0;
  let scrollProgress = 0;
  const sceneLook: SceneLook = {
    camX: 0,
    camY: 0,
    camZ: 0,
    tint: new THREE.Color(0x020817),
    tintMix: 0,
    network: 0,
    spread: 0,
    lightBoost: 1,
  };
  const tmpTint = new THREE.Color();
  let travel: gsap.core.Timeline | null = null;
  let scrollTriggerTravel: ScrollTrigger | null = null;
  const gestureOffset = { x: 0, y: 0, rz: 0 };
  // 7M-F §5.7: Pubix sigue el puntero sólo con pointer:fine (yaw ±0.12, pitch ±0.06)
  const pointerTarget = { yaw: 0, pitch: 0 };
  const pointerSmooth = { yaw: 0, pitch: 0 };
  let framesRendered = 0;
  if (window.matchMedia('(pointer: fine)').matches) {
    window.addEventListener('pointermove', (ev) => {
      pointerTarget.yaw = (ev.clientX / window.innerWidth - 0.5) * 2 * 0.12;
      pointerTarget.pitch = (ev.clientY / window.innerHeight - 0.5) * 2 * 0.06;
    });
    window.addEventListener('pointerleave', () => { pointerTarget.yaw = 0; pointerTarget.pitch = 0; });
    document.addEventListener('mouseleave', () => { pointerTarget.yaw = 0; pointerTarget.pitch = 0; });
  }
  const cardFocusSet = new Set<number>();

  const pointer = new THREE.Vector2();
  const clock = new THREE.Clock();

  const gsapContext = gsap.context(() => {
    ScrollTrigger.create({
      trigger: trigger ?? canvas,
      start: 'top top',
      end: 'bottom top',
      scrub: true,
      onUpdate: (self) => {
        scrollProgress = self.progress;
      },
    });
  });

  const applyCurrent = (): void => {
    camera.position.set(
      current.camera.x + sceneLook.camX,
      current.camera.y + sceneLook.camY,
      current.camera.z + sceneLook.camZ,
    );
    lookTarget.set(current.target.x, current.target.y, current.target.z);
    camera.lookAt(lookTarget);

    rig.position.x = current.rig.x;
    rig.position.y = current.rig.y;
    rig.scale.setScalar(current.rig.scale);

    hemi.intensity = current.lights.hemi * sceneLook.lightBoost;
    key.intensity = current.lights.key * sceneLook.lightBoost;
    key.color.copy(current.lights.keyColor);
    rim.intensity = current.lights.rim;
    rim.color.copy(current.lights.rimColor);
    amber.intensity = current.lights.amber;
    amber.color.copy(current.lights.amberColor);

    scene.background = tmpTint.copy(new THREE.Color(current.background)).lerp(sceneLook.tint, sceneLook.tintMix);
    if ('fog' in scene) {
      // sin niebla densa: el fondo espacial ya da profundidad
    }

    const network = Math.max(current.network, sceneLook.network);
    nodeMaterial.opacity = network * 0.95;
    linkMaterial.opacity = network * 0.35;
    pulseMaterial.opacity = network * 0.85;
    nodeGroup.visible = network > 0.01;

    // La modulación por escena no toca el hero: su composición está aprobada.
    const sceneBoost = current.world === 'hero' ? 0 : sceneProgress + sceneLook.spread;
    platform.state.expansion = current.platform.expansion + sceneBoost * 0.12;
    platform.state.intensity = current.platform.intensity;
    trails.configurar({
      expandir: current.prism.spread + sceneBoost * 0.2 + sceneLook.spread * 0.5,
      intensidad: 1.15,
    });
    particles.state.intensity = current.particles.intensity;
    particles.state.orbit = current.particles.orbit;
  };

  function frame(): void {
    if (disposed) return;
    applyCurrent();
    const dt = Math.min(clock.getDelta(), 0.05);
    if (!paused && !reducedMotion) elapsed += dt;
    const t = elapsed;
    const sceneBoost = current.world === 'hero' ? 0 : sceneProgress;
    const spread = current.prism.spread + sceneBoost * 0.25 + sceneLook.spread;

    framesRendered += 1;
    // amortiguación independiente de FPS (damping ~8/s)
    const damp = 1 - Math.exp(-dt * 8);
    pointerSmooth.yaw += (pointerTarget.yaw - pointerSmooth.yaw) * damp;
    pointerSmooth.pitch += (pointerTarget.pitch - pointerSmooth.pitch) * damp;
    if (mascot) {
      mascot.rotation.y = 0.13 * Math.sin(t * 0.5) + spread * 0.65 + pointerSmooth.yaw;
      mascot.rotation.x = 0.045 * Math.sin(t * 0.7) + pointerSmooth.pitch;
      mascot.position.y = 2.18 + Math.sin(t * 1.1) * 0.095 + gestureOffset.y;
      mascot.position.x = gestureOffset.x;
      mascot.rotation.z = gestureOffset.rz;
    }
    if (prism) {
      prism.rotation.y = t * 0.085;
      prism.rotation.x = Math.sin(t * 0.27) * 0.1;
      prism.scale.setScalar(current.prism.scale * (1 + spread * 0.13));
      prism.traverse((object) => {
        const mesh = object as THREE.Mesh;
        if (!mesh.isMesh) return;
        const material = mesh.material as THREE.MeshStandardMaterial;
        material.opacity =
          mesh.name === 'Prism_Core'
            ? current.prism.opacity * 0.6 + spread * 0.08
            : current.prism.opacity + spread * 0.2;
      });
    }
    shardMeshes.forEach((mesh, i) => {
      const origin = shardOrigins[i];
      if (!origin) return;
      const a = (i * TAU) / shardMeshes.length;
      mesh.position
        .copy(origin.pos)
        .add(
          new THREE.Vector3(
            Math.cos(a) * spread * 0.9,
            Math.sin(a * 2) * spread * 0.55,
            Math.sin(a) * spread * 0.8,
          ),
        );
      mesh.rotation.set(origin.rot.x + spread * 0.4, origin.rot.y + spread * 0.6, origin.rot.z);
    });

    trails.actualizar(t);
    platform.update(t);
    particles.state.explode = Math.max(spread * 0.6, Math.sin(Math.PI * scrollProgress) * 0.5);
    particles.update(t, dt);

    cards.forEach((card, i) => {
      const phase = card.group.userData['phase'] as number;
      card.group.position.set(
        card.base.x + Math.sin(t * 0.3 + i) * 0.1,
        card.base.y + Math.sin(t * 0.8 + i) * 0.12,
        card.base.z,
      );
      card.group.rotation.y = Math.sin(t * 0.42 + i) * 0.17;
      const focused = cardFocusSet.has(i) ? 1.18 : 1;
      card.group.scale.setScalar(card.scale * (1 + spread * 0.06) * focused);
      card.group.lookAt(camera.position);
      const borderMat = (card.group.children[1] as THREE.LineSegments).material as THREE.LineBasicMaterial;
      borderMat.opacity = cardFocusSet.has(i) ? 1 : 0.7;
      void phase;
    });

    nodeGroup.rotation.y -= dt * 0.08;
    nodeGroup.rotation.x = Math.sin(elapsed * 0.12) * 0.16;
    if (current.network > 0.01) {
      for (const pulse of pulses) {
        pulse.progress += dt * pulse.speed * (0.6 + current.network);
        if (pulse.progress > 1) {
          pulse.progress = 0;
          pulse.from = pulse.to.clone();
          const next = nodePositions[Math.floor(Math.random() * nodePositions.length)];
          if (next) pulse.to = next.clone();
        }
        pulse.mesh.position.lerpVectors(pulse.from, pulse.to, pulse.progress);
        pulse.mesh.scale.setScalar(0.7 + Math.sin(pulse.progress * Math.PI) * 0.6);
      }
    }

    background?.update({ time: t, pointerX: pointer.x, pointerY: pointer.y, scroll: scrollProgress });

    // parallax del puntero sobre la cámara del mundo
    camera.position.x += pointer.x * 0.3;
    camera.position.y += pointer.y * 0.15;
    camera.lookAt(lookTarget);

    composer.render();
  }

  renderer.setAnimationLoop(frame);

  const onPointerMove = (event: PointerEvent): void => {
    pointer.set(
      (event.clientX / window.innerWidth - 0.5) * 2,
      0.5 - event.clientY / window.innerHeight,
    );
  };
  window.addEventListener('pointermove', onPointerMove, { passive: true });

  const placeRig = (): void => {
    const mobile = window.innerWidth < 700;
    const tablet = window.innerWidth < 1100;
    const base = mobile ? { x: 0.8, y: -1.65, scale: 0.72 } : tablet ? { x: 1.8, y: -0.25, scale: 0.83 } : { x: 2.35, y: -0.25, scale: 1 };
    if (current.world === 'hero') {
      current.rig.x = base.x;
      current.rig.y = base.y;
      current.rig.scale = base.scale;
    }
  };

  const onResize = (): void => {
    renderer.setSize(window.innerWidth, window.innerHeight, false);
    composer.setSize(window.innerWidth, window.innerHeight);
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    placeRig();
  };
  window.addEventListener('resize', onResize);

  const onVisibility = (): void => {
    active = document.visibilityState === 'visible';
  };
  document.addEventListener('visibilitychange', onVisibility);

  placeRig();
  applyCurrent();

  if (reducedMotion) {
    renderer.setAnimationLoop(null);
    frame();
  }

  const setSceneLook = (look: Partial<SceneLook> & { tintHex?: number }): void => {
    if (typeof look.tintHex === 'number') sceneLook.tint.set(look.tintHex);
    // La composición del hero está aprobada: ahí la modulación es neutra.
    if (current.world === 'hero') {
      sceneLook.camX = 0; sceneLook.camY = 0; sceneLook.camZ = 0;
      sceneLook.tintMix = 0; sceneLook.network = 0; sceneLook.spread = 0; sceneLook.lightBoost = 1;
      if (reducedMotion) frame();
      return;
    }
    if (typeof look.camX === 'number') sceneLook.camX = look.camX;
    if (typeof look.camY === 'number') sceneLook.camY = look.camY;
    if (typeof look.camZ === 'number') sceneLook.camZ = look.camZ;
    if (look.tint) sceneLook.tint.copy(look.tint);
    if (typeof look.tintMix === 'number') sceneLook.tintMix = look.tintMix;
    if (typeof look.network === 'number') sceneLook.network = look.network;
    if (typeof look.spread === 'number') sceneLook.spread = look.spread;
    if (typeof look.lightBoost === 'number') sceneLook.lightBoost = look.lightBoost;
    if (reducedMotion) frame();
  };

  return {
    travelTo(world, options = {}) {
      const duration = options.duration ?? (reducedMotion ? 0 : 1.9);
      const spec = WORLDS[world];
      if (!spec) return;
      const external = options.timeline ?? null;
      if (!external) {
        travel?.kill();
        scrollTriggerTravel?.kill();
      }
      current.world = world;

      const tl =
        external ??
        gsap.timeline({
          defaults: { duration, ease: 'power2.inOut' },
          onComplete: () => options.onComplete?.(),
          paused: Boolean(options.scrub),
        });
      if (!external) travel = tl;

      tl.to(current.camera, { x: spec.camera[0], y: spec.camera[1], z: spec.camera[2] }, 0)
        .to(current.target, { x: spec.target[0], y: spec.target[1], z: spec.target[2] }, 0)
        .to(current.rig, { x: spec.rig.x, y: spec.rig.y, scale: spec.rig.scale }, 0)
        .to(current.lights, { hemi: spec.lights.hemi, key: spec.lights.key, rim: spec.lights.rim, amber: spec.lights.amber }, 0)
        .to(current.lights.keyColor, { r: new THREE.Color(spec.lights.keyColor).r, g: new THREE.Color(spec.lights.keyColor).g, b: new THREE.Color(spec.lights.keyColor).b }, 0)
        .to(current.lights.rimColor, { r: new THREE.Color(spec.lights.rimColor).r, g: new THREE.Color(spec.lights.rimColor).g, b: new THREE.Color(spec.lights.rimColor).b }, 0)
        .to(current.lights.amberColor, { r: new THREE.Color(spec.lights.amberColor).r, g: new THREE.Color(spec.lights.amberColor).g, b: new THREE.Color(spec.lights.amberColor).b }, 0)
        .to(current.background, { r: new THREE.Color(spec.background).r, g: new THREE.Color(spec.background).g, b: new THREE.Color(spec.background).b }, 0)
        .to(current.prism, { opacity: spec.prism.opacity, scale: spec.prism.scale, spread: spec.prism.spread }, 0)
        .to(current.platform, { expansion: spec.platform.expansion, intensity: spec.platform.intensity }, 0)
        .to(current.particles, { intensity: spec.particles.intensity, orbit: spec.particles.orbit }, 0)
        .to(current, { network: spec.network }, 0);

      cards.forEach((card, i) => {
        const [px, py, pz] = spec.cards.position(i);
        tl.to(card.base, { x: px, y: py, z: pz, duration: duration * 0.9 }, i * 0.035);
        tl.to(card, { scale: spec.cards.scale(i), duration: duration * 0.9 }, i * 0.035);
      });

      // destello de partículas durante el cambio de mundo
      tl.to(particles.state, { explode: 0.8, duration: duration * 0.4, ease: 'power2.out' }, 0)
        .to(particles.state, { explode: 0, duration: duration * 0.6, ease: 'power2.inOut' }, duration * 0.4);

      if (options.scrub && !reducedMotion) {
        scrollTriggerTravel = ScrollTrigger.create({
          trigger: options.scrub.trigger,
          start: options.scrub.start ?? 'top top',
          end: options.scrub.end ?? '+=150%',
          scrub: 1,
          animation: tl,
        });
      } else if (reducedMotion) {
        if (!external) tl.progress(1);
      } else if (!external) {
        tl.play();
      }
      applyCurrent();
    },
    cardPulse(index: number): void {
      const card = cards[index];
      if (!card || reducedMotion) return;
      gsap.fromTo(
        card,
        { scale: card.scale },
        { scale: card.scale * 1.3, duration: 0.28, ease: 'power2.out', yoyo: true, repeat: 1 },
      );
    },
    cardFocus(index: number, on: boolean): void {
      if (on) cardFocusSet.add(index);
      else cardFocusSet.delete(index);
    },
    gesture(): void {
      if (reducedMotion || !mascot) return;
      gsap.to(gestureOffset, {
        x: -0.32,
        y: 0.12,
        rz: -0.08,
        duration: 0.5,
        ease: 'power2.out',
        yoyo: true,
        repeat: 1,
      });
    },
    world(): UniverseWorld {
      return current.world;
    },
    setSceneProgress(progress: number): void {
      sceneProgress = Math.min(1, Math.max(0, progress));
      if (reducedMotion) frame();
    },
    setSceneLook,
    setPointer(x: number, y: number): void {
      pointer.set(
        Math.min(1, Math.max(-1, x)),
        Math.min(1, Math.max(-1, y)),
      );
    },
    setActive(value: boolean): void {
      active = value;
      if (reducedMotion) return;
      renderer.setAnimationLoop(active ? frame : null);
    },
    setPaused(value: boolean): void {
      if (reducedMotion) return;
      paused = Boolean(value);
    },
    setHeroPin(progress: number): void {
      // 7M-F §5.9: timeline normalizada mapeada al parámetro de fragmentación existente
      const p = Math.min(1, Math.max(0, progress));
      const lerp = (a: number, b: number, t: number) => a + (b - a) * Math.min(1, Math.max(0, t));
      const seg = (p0: number, p1: number) => (p - p0) / (p1 - p0);
      current.prism.scale =
        p <= 0.18 ? lerp(1, 1.06, seg(0, 0.18)) :
        p <= 0.36 ? lerp(1.06, 1.12, seg(0.18, 0.36)) : 1.12;
      current.prism.spread =
        p <= 0.18 ? 0 :
        p <= 0.36 ? lerp(0, 0.12, seg(0.18, 0.36)) :
        p <= 0.54 ? lerp(0.12, 0.30, seg(0.36, 0.54)) :
        p <= 0.72 ? lerp(0.30, 0.45, seg(0.54, 0.72)) :
        p <= 0.88 ? lerp(0.45, 0.60, seg(0.72, 0.88)) : 0.60;
      // la cámara acompaña el mismo progreso (hero → cooperativo), sin nuevo modelo
      const from = WORLDS.hero;
      const to = WORLDS.cooperative;
      current.world = 'cooperative';
      current.camera.x = lerp(from.camera[0], to.camera[0], p);
      current.camera.y = lerp(from.camera[1], to.camera[1], p);
      current.camera.z = lerp(from.camera[2], to.camera[2], p);
      current.target.x = lerp(from.target[0], to.target[0], p);
      current.target.y = lerp(from.target[1], to.target[1], p);
      current.target.z = lerp(from.target[2], to.target[2], p);
      current.rig.scale = lerp(from.rig.scale, to.rig.scale, p);
      if (reducedMotion) frame();
    },
    frames(): number {
      return framesRendered;
    },
    burst(): void {
      if (reducedMotion || disposed) return;
      const target = WORLDS[current.world] ?? WORLDS.hero;
      gsap.to(current.prism, {
        spread: Math.max(target.prism.spread, 0.7),
        duration: 0.7,
        ease: 'power2.out',
        onComplete: () => {
          gsap.to(current.prism, {
            spread: target.prism.spread,
            duration: 1.1,
            ease: 'power2.inOut',
          });
        },
      });
    },
    cameraPosition(): [number, number, number] {
      return [camera.position.x, camera.position.y, camera.position.z];
    },
    dominantTint(): string {
      return `#${current.background.getHexString()}`;
    },
    cardsInView(): number {
      const framed = new THREE.Vector3();
      let visible = 0;
      for (const card of cards) {
        card.group.getWorldPosition(framed);
        const projected = framed.clone().project(camera);
        if (
          projected.x >= -1.1 && projected.x <= 1.1 &&
          projected.y >= -1.1 && projected.y <= 1.1 &&
          projected.z <= 1
        ) {
          visible += 1;
        }
      }
      return visible;
    },
    errors(): string[] {
      return [...failures];
    },
    destroy(): void {
      disposed = true;
      renderer.setAnimationLoop(null);
      travel?.kill();
      scrollTriggerTravel?.kill();
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('resize', onResize);
      document.removeEventListener('visibilitychange', onVisibility);
      gsapContext.revert();

      platform.dispose();
      trails.destruir();
      particles.dispose();
      background?.dispose();

      const disposeObject = (object: THREE.Object3D): void => {
        object.traverse((child) => {
          const mesh = child as THREE.Mesh;
          if (mesh.geometry) mesh.geometry.dispose();
          const material = mesh.material;
          if (material) {
            if (Array.isArray(material)) material.forEach((item) => item.dispose());
            else material.dispose();
          }
        });
      };
      if (mascot) disposeObject(mascot);
      if (prism) disposeObject(prism);
      cards.forEach((card) => disposeObject(card.group));
      disposeObject(nodeGroup);
      pulses.forEach((pulse) => disposeObject(pulse.mesh));
      iconTextures.forEach((texture) => texture.dispose());

      bloom.dispose();
      renderPass.dispose?.();
      composer.dispose?.();
      renderer.dispose();
      renderer.forceContextLoss();
    },
  };
}
