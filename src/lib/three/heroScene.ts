/**
 * Hero 3D de Publia · escena aprobada.
 *
 * Puerto fiel de `src/main.js` (versión con el parche de iconos) al proyecto
 * Astro. Se conservan la cámara, las luces, el bloom, el rig, la plataforma,
 * las estelas, las partículas, el fondo, la mascota, el prisma y las ocho
 * tarjetas holográficas con sus iconos.
 *
 * Lo que añade la integración (no cambia la dirección artística):
 *  · ciclo de vida completo: `destroy()` libera geometrías, materiales,
 *    texturas, contexto WebGL, tweens y ScrollTriggers;
 *  · ScrollTrigger para el ambiente y la transición de salida;
 *  · reacción a las tres rutas narrativas;
 *  · pausa cuando la sección sale del viewport o la pestaña se oculta;
 *  · `prefers-reduced-motion`: un único fotograma estático.
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

export type HeroRoute = 'enterprise' | 'efficiency' | 'explorer';

export interface HeroSceneOptions {
  canvas: HTMLCanvasElement;
  /** Sección que hace de disparador del ScrollTrigger. */
  trigger?: HTMLElement | null;
  reducedMotion?: boolean;
}

export interface HeroSceneHandle {
  /** Enciende o apaga el render (pausa por visibilidad). */
  setActive(active: boolean): void;
  /** Reacción visual a la ruta elegida. */
  setRoute(route: HeroRoute): void;
  /** Fragmentación / recomposición (efecto aprobado). */
  burst(): void;
  /** Recomposición suave (control «Reiniciar»). */
  reset(): void;
  /** Pausa la animación ambiental sin desmontar la escena. */
  setPaused(value: boolean): void;
  /** Tarjetas holográficas dentro del encuadre. */
  cardsInView(): number;
  /** Errores de carga (modelos o texturas). */
  errors(): string[];
  destroy(): void;
}

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

export async function createHeroScene({
  canvas,
  trigger = null,
  reducedMotion = false,
}: HeroSceneOptions): Promise<HeroSceneHandle | null> {
  const failures: string[] = [];

  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: false,
    powerPreference: 'high-performance',
    // Permite capturar el lienzo (evidencia de QA yvista previa).
    preserveDrawingBuffer: true,
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.7));
  renderer.setSize(window.innerWidth, window.innerHeight, false);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.25;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#050b1b');

  const camera = new THREE.PerspectiveCamera(40, window.innerWidth / window.innerHeight, 0.1, 100);
  const cameraBase = new THREE.Vector3(0, 2.4, 11.6);
  camera.position.copy(cameraBase);
  const target = new THREE.Vector3(0, 1.05, 0);
  camera.lookAt(target);

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
  let shardOrigins: Array<{ pos: THREE.Vector3; rot: THREE.Euler }> = [];

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
      const material = mesh.material as THREE.Material & { side?: THREE.Side };
      material.side = THREE.DoubleSide;
    });

    prism = normalizeModel(prismAsset.scene, 3.75);
    prism.position.set(0.3, 2.25, -0.45);
    rig.add(prism);
    prism.traverse((object) => {
      const mesh = object as THREE.Mesh;
      if (!mesh.isMesh) return;
      const source = mesh.material as THREE.MeshStandardMaterial;
      const material = source.clone();
      mesh.material = material;
      material.transparent = true;
      material.opacity = 0.36;
      material.depthWrite = false;
      material.side = THREE.DoubleSide;
      if (mesh.name.startsWith('Facet_')) {
        shardMeshes.push(mesh);
      }
    });
    shardOrigins = shardMeshes.map((mesh) => ({
      pos: mesh.position.clone(),
      rot: mesh.rotation.clone(),
    }));
  } catch (error) {
    failures.push(`modelos: ${(error as Error).message}`);
  }

  // --- ocho tarjetas holográficas ----------------------------------------------
  const iconGroups: THREE.Group[] = [];
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

    // Tarjetas visibles alrededor de la P, por delante del prisma y de sus reflejos.
    const column = i < 4 ? 0 : 1;
    const row = i % 4;
    group.position.set(column === 0 ? -1.75 : 1.85, 1.12 + row * 1.02, 2.4);
    group.scale.setScalar(0.83);
    group.userData['base'] = group.position.clone();
    group.userData['phase'] = i * 0.8;
    rig.add(group);
    iconGroups.push(group);
  }

  // --- estado y bucle -----------------------------------------------------------
  const pointer = new THREE.Vector2();
  let paused = reducedMotion;
  let active = true;
  let disposed = false;
  let explosion = 0;
  let elapsed = 0;
  let scrollProgress = 0;
  const state = { explode: 0 };

  const isMobile = (): boolean => window.innerWidth < 700;

  function placeRig(): void {
    rig.position.x = isMobile() ? 0.8 : window.innerWidth < 1100 ? 1.8 : 2.35;
    rig.position.y = isMobile() ? -1.65 : -0.25;
    rig.scale.setScalar(isMobile() ? 0.72 : window.innerWidth < 1100 ? 0.83 : 1);
  }
  placeRig();

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

  function frame(): void {
    if (disposed) return;
    const dt = Math.min(clock.getDelta(), 0.05);
    if (!paused && !reducedMotion) elapsed += dt;
    const t = elapsed;
    const phase = state.explode;

    if (mascot) {
      mascot.rotation.y = 0.13 * Math.sin(t * 0.5) + phase * 0.65;
      mascot.rotation.x = 0.045 * Math.sin(t * 0.7);
      mascot.position.y = 2.18 + Math.sin(t * 1.1) * 0.095;
    }
    if (prism) {
      prism.rotation.y = t * 0.085;
      prism.rotation.x = Math.sin(t * 0.27) * 0.1;
      prism.scale.setScalar(1 + phase * 0.13);
      prism.traverse((object) => {
        const mesh = object as THREE.Mesh;
        if (!mesh.isMesh) return;
        const material = mesh.material as THREE.MeshStandardMaterial;
        material.opacity = mesh.name === 'Prism_Core' ? 0.22 + phase * 0.08 : 0.38 + phase * 0.2;
      });
    }
    shardMeshes.forEach((mesh, i) => {
      const origin = shardOrigins[i];
      if (!origin) return;
      const a = i * 2 * Math.PI / shardMeshes.length;
      mesh.position
        .copy(origin.pos)
        .add(new THREE.Vector3(Math.cos(a) * phase * 0.9, Math.sin(a * 2) * phase * 0.55, Math.sin(a) * phase * 0.8));
      mesh.rotation.set(origin.rot.x + phase * 0.4, origin.rot.y + phase * 0.6, origin.rot.z);
    });

    trails.actualizar(t);
    trails.configurar({ expandir: phase * 0.8, intensidad: 1.15 });
    platform.state.expansion = Math.max(phase * 0.8, scrollProgress * 0.35);
    platform.update(t);
    particles.state.explode = Math.max(phase, Math.sin(Math.PI * scrollProgress));
    particles.state.orbit = 0.4;
    particles.update(t, dt);

    iconGroups.forEach((group, i) => {
      const base = group.userData['base'] as THREE.Vector3;
      group.position.set(
        base.x + Math.sin(t * 0.3 + i) * 0.1,
        base.y + Math.sin(t * 0.8 + i) * 0.12 + phase * Math.sin(i * 2) * 0.9,
        base.z + phase * 0.5,
      );
      group.rotation.y = Math.sin(t * 0.42 + i) * 0.17;
      group.lookAt(camera.position);
    });

    background?.update({ time: t, pointerX: pointer.x, pointerY: pointer.y, scroll: scrollProgress });

    camera.position.x = THREE.MathUtils.lerp(
      camera.position.x,
      cameraBase.x + pointer.x * 0.3,
      dt * 2,
    );
    camera.position.y = THREE.MathUtils.lerp(
      camera.position.y,
      cameraBase.y + pointer.y * 0.15,
      dt * 2,
    );
    camera.lookAt(target);
    composer.render();
  }

  renderer.setAnimationLoop(frame);

  // --- eventos ------------------------------------------------------------------
  const onPointerMove = (event: PointerEvent): void => {
    pointer.set(
      (event.clientX / window.innerWidth - 0.5) * 2,
      (0.5 - event.clientY / window.innerHeight) * 2,
    );
  };
  window.addEventListener('pointermove', onPointerMove, { passive: true });

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

  // --- API ----------------------------------------------------------------------
  const cardsInView = (): number => {
    const framed = new THREE.Vector3();
    let visible = 0;
    for (const group of iconGroups) {
      group.getWorldPosition(framed);
      const projected = framed.clone().project(camera);
      if (
        projected.x >= -1.08 &&
        projected.x <= 1.08 &&
        projected.y >= -1.08 &&
        projected.y <= 1.08 &&
        projected.z <= 1
      ) {
        visible += 1;
      }
    }
    return visible;
  };

  if (reducedMotion) {
    // Un solo fotograma estático: sin bucle de animación.
    renderer.setAnimationLoop(null);
    frame();
  }

  return {
    setActive(next: boolean): void {
      active = next;
      if (reducedMotion) return;
      if (active) {
        renderer.setAnimationLoop(frame);
      } else {
        renderer.setAnimationLoop(null);
      }
    },
    setRoute(): void {
      gsap.to(state, {
        explode: state.explode > 0.5 ? 0 : 1,
        duration: 1.6,
        ease: 'power2.inOut',
      });
    },
    burst(): void {
      gsap.to(state, {
        explode: state.explode > 0.5 ? 0 : 1,
        duration: 1.6,
        ease: 'power2.inOut',
      });
    },
    reset(): void {
      gsap.to(state, { explode: 0, duration: 1.1 });
    },
    setPaused(value: boolean): void {
      if (reducedMotion) return;
      paused = Boolean(value);
    },
    cardsInView,
    errors(): string[] {
      return [...failures];
    },
    destroy(): void {
      disposed = true;
      renderer.setAnimationLoop(null);
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
      iconGroups.forEach((group) => disposeObject(group));
      iconTextures.forEach((texture) => texture.dispose());

      bloom.dispose();
      renderPass.dispose?.();
      composer.dispose?.();
      renderer.dispose();
      renderer.forceContextLoss();
    },
  };
}
