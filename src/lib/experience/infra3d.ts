/**
 * Stage 3D de E03 — 7M-H §7. Una sola escena/renderer; cuatro topologías
 * reconstruidas por modo (sin cargar cuatro motores). Coordenadas
 * normalizadas: x −5..5, z −3..3, suelo y=0; cámara isométrica (10,10,12)→(0,0,0).
 * Objetos low-poly mates: escritorio, monitor, silla, oficina, servidor,
 * edificios con ventanas, documento y enlaces. Etiquetas = HTML superpuesto.
 */
import * as THREE from 'three';
import { INFRA_HOTSPOTS_7MH } from '../../data/copy7mh';

export type InfraModeId = 'local-private' | 'local-collaborative' | 'managed-housing' | 'distributed-network';

export interface InfraHotspot {
  key: keyof typeof INFRA_HOTSPOTS_7MH;
  pos: THREE.Vector3;
}

interface ModeScene {
  group: THREE.Group;
  hotspots: InfraHotspot[];
  /** ruta de la tarea explicativa (ida y vuelta) */
  taskPath: THREE.Vector3[];
  altPaths?: THREE.Vector3[][];
  tags?: { text: string; pos: THREE.Vector3 }[];
}

export interface Infra3DHandle {
  setMode(id: InfraModeId, opts?: { instant?: boolean }): void;
  runTask(): void;
  setPaused(p: boolean): void;
  toggleAltRoute(): boolean;
  currentMode(): InfraModeId;
  onFrame(cb: (data: { hotspots: { key: string; x: number; y: number; text: string }[]; tags: { text: string; x: number; y: number }[] }) => void): void;
  resize(): void;
  dispose(): void;
}

const C = {
  platform: 0x9fb4cc,
  floorOffice: 0x8fa6c4,
  wall: 0x6f87a8,
  desk: 0xc7d3e6,
  deskLeg: 0x3c4a63,
  monitor: 0x1d2c47,
  screen: 0x80e5ff,
  chair: 0x54688a,
  rack: 0x22334f,
  rackSlot: 0x80e5ff,
  building: 0x54688a,
  window: 0xffd12e,
  doc: 0xf4f7ff,
  link: 0x80e5ff,
  linkAlt: 0xffca34,
  packet: 0xffca34,
  gate: 0x25d366,
};

function mat(color: number, opts: THREE.MeshStandardMaterialParameters = {}): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({ color, roughness: 0.85, metalness: 0.05, ...opts });
}

function box(w: number, h: number, d: number, color: number, x: number, y: number, z: number, parent: THREE.Group): THREE.Mesh {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat(color));
  m.position.set(x, y, z);
  parent.add(m);
  return m;
}

function makeDesk(parent: THREE.Group, x: number, z: number): void {
  box(1.4, 0.08, 0.8, C.desk, x, 0.75, z, parent); // tapa
  const legs: [number, number][] = [[-0.6, -0.3], [0.6, -0.3], [-0.6, 0.3], [0.6, 0.3]];
  legs.forEach(([lx, lz]) => box(0.07, 0.72, 0.07, C.deskLeg, x + lx, 0.36, z + lz, parent));
  const mon = box(0.7, 0.45, 0.06, C.monitor, x, 1.1, z - 0.25, parent); // monitor
  box(0.3, 0.05, 0.24, C.monitor, x, 0.83, z - 0.25, parent); // base
  const scr = box(0.62, 0.37, 0.02, C.screen, x, 1.12, z - 0.21, parent);
  scr.material = mat(C.screen, { emissive: 0x1c4a5e });
  void mon;
}

function makeChair(parent: THREE.Group, x: number, z: number): void {
  box(0.5, 0.06, 0.5, C.chair, x, 0.45, z, parent);
  box(0.5, 0.55, 0.06, C.chair, x, 0.75, z + 0.27, parent);
  box(0.06, 0.45, 0.06, C.deskLeg, x, 0.22, z + 0.24, parent);
}

function makeRack(parent: THREE.Group, x: number, z: number, scale = 1): void {
  box(0.9 * scale, 1.6 * scale, 0.7 * scale, C.rack, x, 0.8 * scale, z, parent);
  for (let i = 0; i < 5; i++) {
    box(0.7 * scale, 0.12, 0.05, C.rackSlot, x, 0.35 * scale + i * 0.28 * scale, z + 0.36 * scale, parent);
  }
}

function makeOffice(parent: THREE.Group, w: number, d: number, x: number, z: number, walls: ('n' | 's' | 'e' | 'w')[]): void {
  box(w, 0.1, d, C.floorOffice, x, 0.05, z, parent); // piso
  const h = 1.6;
  if (walls.includes('n')) box(w, h, 0.12, C.wall, x, h / 2 + 0.1, z - d / 2, parent);
  if (walls.includes('s')) box(w, h, 0.12, C.wall, x, h / 2 + 0.1, z + d / 2, parent);
  if (walls.includes('w')) box(0.12, h, d, C.wall, x - w / 2, h / 2 + 0.1, z, parent);
  if (walls.includes('e')) box(0.12, h, d, C.wall, x + w / 2, h / 2 + 0.1, z, parent);
}

function makeBuilding(parent: THREE.Group, w: number, h: number, d: number, x: number, z: number): void {
  box(w, h, d, C.building, x, h / 2, z, parent);
  const cols = Math.max(1, Math.floor(w / 0.6));
  const rows = Math.max(1, Math.floor(h / 0.5));
  for (let i = 0; i < cols; i++) {
    for (let j = 0; j < rows; j++) {
      box(0.28, 0.26, 0.04, C.window, x - w / 2 + 0.35 + i * 0.6, 0.5 + j * 0.5, z + d / 2 + 0.02, parent);
    }
  }
}

function makeDoc(parent: THREE.Group, x: number, z: number): THREE.Mesh {
  return box(0.34, 0.06, 0.46, C.doc, x, 0.55, z, parent);
}

function makeLink(parent: THREE.Group, a: THREE.Vector3, b: THREE.Vector3, color = C.link): THREE.Line {
  const g = new THREE.BufferGeometry().setFromPoints([a, b]);
  const line = new THREE.Line(g, new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.9 }));
  parent.add(line);
  return line;
}

function v(x: number, y: number, z: number): THREE.Vector3 {
  return new THREE.Vector3(x, y, z);
}

/** Topologías por modo (coordenadas normalizadas x −5..5, z −3..3). */
function buildMode(id: InfraModeId): ModeScene {
  const g = new THREE.Group();
  const hotspots: InfraHotspot[] = [];
  const tags: { text: string; pos: THREE.Vector3 }[] = [];
  let taskPath: THREE.Vector3[] = [];
  let altPaths: THREE.Vector3[][] | undefined;

  // plataforma común
  box(10.4, 0.12, 6.4, C.platform, 0, -0.06, 0, g);

  if (id === 'local-private') {
    makeOffice(g, 6, 4, 0, 0, ['n', 'w', 'e']); // oficina central 6×4, perímetro visible
    makeDesk(g, -1.6, 0.4); makeChair(g, -1.6, 1.1);
    makeDesk(g, 0, 0.4); makeChair(g, 0, 1.1);
    makeDesk(g, 1.6, 0.4); makeChair(g, 1.6, 1.1);
    makeRack(g, 0, -1.55); // servidor al fondo, dentro del perímetro
    makeDoc(g, 1.1, -1.55); // archivo junto al servidor
    hotspots.push(
      { key: 'desk', pos: v(-1.6, 1.4, 0.4) },
      { key: 'server', pos: v(0, 2.0, -1.55) },
      { key: 'doc', pos: v(1.1, 0.9, -1.55) },
    );
    const deskP = v(-1.6, 1.2, 0.4);
    const srvP = v(0, 1.2, -1.55);
    taskPath = [deskP, v(-0.8, 1.3, -0.6), srvP, v(-0.8, 1.3, -0.6), deskP];
    makeLink(g, deskP, srvP);
    hotspots.push({ key: 'link', pos: v(-0.8, 1.05, -0.55) });
  } else if (id === 'local-collaborative') {
    makeOffice(g, 6, 4, -2, 0, ['n', 'w', 'e']); // misma oficina desplazada x−2
    makeDesk(g, -3.6, 0.4); makeChair(g, -3.6, 1.1);
    makeDesk(g, -2, 0.4); makeChair(g, -2, 1.1);
    makeRack(g, -2, -1.55);
    makeDoc(g, -0.9, -1.55);
    // dos espacios externos pequeños
    makeBuilding(g, 1.2, 1.0, 1.2, 3, -1.8);
    makeBuilding(g, 1.2, 1.0, 1.2, 3, 1.8);
    // puerta de permisos visible en el límite (x≈1)
    box(0.14, 1.4, 0.9, C.gate, 1, 0.8, 0, g);
    tags.push({ text: 'Datos internos', pos: v(-2, 2.1, -0.5) });
    tags.push({ text: 'Servicio autorizado', pos: v(2.1, 1.4, 0) });
    hotspots.push(
      { key: 'desk', pos: v(-3.6, 1.4, 0.4) },
      { key: 'server', pos: v(-2, 2.0, -1.55) },
      { key: 'doc', pos: v(-0.9, 0.9, -1.55) },
      { key: 'link', pos: v(0.5, 1.05, 0) },
    );
    const deskP = v(-3.6, 1.2, 0.4);
    const gate = v(1, 1.2, 0);
    const ext = v(3, 1.2, -1.8);
    taskPath = [deskP, v(-1, 1.3, 0.2), gate, ext, gate, v(-1, 1.3, 0.2), deskP];
    makeLink(g, deskP, gate);
    makeLink(g, gate, ext, C.gate);
  } else if (id === 'managed-housing') {
    makeOffice(g, 3.4, 3, -3, 0, ['n', 'w']); // oficina compacta x−3
    makeDesk(g, -3.6, 0.3); makeChair(g, -3.6, 1.0);
    makeDoc(g, -2.6, 0.6);
    makeBuilding(g, 3.2, 2.6, 2.6, 2.5, 0); // edificio de infraestructura x2.5
    makeRack(g, 2.0, -0.6, 0.8);
    makeRack(g, 3.0, -0.6, 0.8); // dos racks visibles
    const remote = makeChair(g, -3, 1.6); void remote; // usuario remoto al frente
    hotspots.push(
      { key: 'desk', pos: v(-3.6, 1.4, 0.3) },
      { key: 'server', pos: v(2.5, 2.2, -0.6) },
      { key: 'doc', pos: v(-2.6, 0.9, 0.6) },
      { key: 'link', pos: v(-0.3, 1.05, 0) },
    );
    const deskP = v(-3.6, 1.2, 0.3);
    const srvP = v(2.5, 1.2, -0.6);
    taskPath = [deskP, v(0, 1.3, 0), srvP, v(0, 1.3, 0), deskP];
    makeLink(g, deskP, srvP);
  } else {
    // distributed-network: 4 nodos en esquinas + oficina cliente al centro/frente
    const nodes = [v(-3, 0, -2), v(3, 0, -2), v(-3, 0, 2), v(3, 0, 2)];
    nodes.forEach((n) => {
      makeBuilding(g, 1.4, 1.8, 1.4, n.x, n.z);
      makeRack(g, n.x, n.z, 0.55);
    });
    makeOffice(g, 2.6, 2, 0, 1.2, ['s', 'w', 'e']); // oficina cliente al centro
    makeDesk(g, -0.4, 1.2); makeChair(g, -0.4, 1.9);
    hotspots.push(
      { key: 'desk', pos: v(-0.4, 1.4, 1.2) },
      { key: 'server', pos: v(3, 2.2, -2) },
      { key: 'doc', pos: v(0.6, 0.9, 1.2) },
      { key: 'link', pos: v(1.6, 1.05, -0.2) },
    );
    makeDoc(g, 0.6, 1.2);
    const client = v(-0.4, 1.2, 1.2);
    const main = v(3, 1.2, -2);
    const alt = v(-3, 1.2, 2);
    taskPath = [client, v(1.5, 1.3, 0), main, v(1.5, 1.3, 0), client];
    altPaths = [[client, v(-1.5, 1.3, 0.5), alt, v(-1.5, 1.3, 0.5), client]];
    makeLink(g, client, main, C.link);
    { const l = makeLink(g, client, alt, C.linkAlt); (l.material as THREE.LineBasicMaterial).opacity = 0.25; }
    tags.push({ text: 'Ruta alternativa configurada', pos: v(-1.5, 1.8, 0.8) });
  }

  return { group: g, hotspots, taskPath, altPaths, tags };
}

export function createInfraStage(canvas: HTMLCanvasElement): Infra3DHandle {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x0a1626); // fondo petróleo
  const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100);
  camera.position.set(10, 10, 12);
  camera.lookAt(0, 0, 0);
  scene.add(new THREE.AmbientLight(0xffffff, 0.75));
  const key = new THREE.DirectionalLight(0xffffff, 1.1);
  key.position.set(6, 12, 4);
  scene.add(key);

  let mode: InfraModeId = 'local-private';
  let current: ModeScene | null = null;
  let packet: THREE.Mesh | null = null;
  let running = false;
  let paused = false;
  let altIdx = 0;
  let taskT = 0;
  let visible = true;
  const frameCbs: ((d: { hotspots: { key: string; x: number; y: number; text: string }[]; tags: { text: string; x: number; y: number }[] }) => void)[] = [];

  const setMode = (id: InfraModeId, opts?: { instant?: boolean }): void => {
    mode = id;
    running = false;
    paused = false;
    altIdx = 0;
    if (packet) { scene.remove(packet); packet = null; }
    const next = buildMode(id);
    const old = current;
    current = next;
    scene.add(next.group);
    if (old) {
      if (opts?.instant) {
        scene.remove(old.group);
      } else {
        // transición 900 ms: desvanecer el grupo anterior
        const t0 = performance.now();
        const fade = (): void => {
          const p = Math.min(1, (performance.now() - t0) / 900);
          old.group.traverse((o) => {
            const m = o as THREE.Mesh;
            if (m.material && 'opacity' in m.material) {
              (m.material as THREE.Material).transparent = true;
              (m.material as THREE.Material & { opacity: number }).opacity = 1 - p;
            }
          });
          if (p < 1) requestAnimationFrame(fade);
          else scene.remove(old.group);
        };
        requestAnimationFrame(fade);
      }
    }
  };

  const runTask = (): void => {
    if (!current || current.taskPath.length < 2) return;
    if (!packet) {
      packet = new THREE.Mesh(new THREE.SphereGeometry(0.12, 12, 12), mat(C.packet, { emissive: 0x6b5300 }));
      scene.add(packet);
    }
    running = true;
    paused = false;
    taskT = 0;
  };

  const pathAt = (t: number): THREE.Vector3 => {
    const path = (current?.altPaths && altIdx > 0 ? current.altPaths[altIdx - 1] : current?.taskPath) ?? [];
    if (path.length < 2) return v(0, 1, 0);
    const seg = Math.min(path.length - 2, Math.floor(t * (path.length - 1)));
    const f = t * (path.length - 1) - seg;
    return path[seg]!.lerp(path[seg + 1]!, f);
  };

  let raf = 0;
  const tick = (): void => {
    raf = requestAnimationFrame(tick);
    if (!visible || !current) return;
    if (running && !paused && packet) {
      taskT += 1 / 360; // ~6 s ida y vuelta a 60 fps
      if (taskT >= 1) { taskT = 0; }
      packet.position.copy(pathAt(taskT));
    }
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    if (w > 0 && h > 0 && (renderer.domElement.width !== Math.floor(w * renderer.getPixelRatio()) || renderer.domElement.height !== Math.floor(h * renderer.getPixelRatio()))) {
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    }
    renderer.render(scene, camera);
    // proyectar hotspots y tags a 2D
    const rect = canvas.getBoundingClientRect();
    const proj = (p: THREE.Vector3): { x: number; y: number } => {
      const q = p.clone().project(camera);
      return { x: rect.left + ((q.x + 1) / 2) * rect.width, y: rect.top + ((1 - q.y) / 2) * rect.height };
    };
    for (const cb of frameCbs) {
      cb({
        hotspots: current.hotspots.map((hs) => ({ key: hs.key, ...proj(hs.pos), text: INFRA_HOTSPOTS_7MH[hs.key] ?? '' })),
        tags: (current.tags ?? []).map((t) => ({ text: t.text, ...proj(t.pos) })),
      });
    }
  };

  const io = typeof IntersectionObserver !== 'undefined'
    ? new IntersectionObserver((es) => { visible = es[0]?.isIntersecting ?? true; }, { rootMargin: '200px' })
    : null;
  io?.observe(canvas);

  setMode('local-private', { instant: true });
  tick();

  return {
    setMode,
    runTask,
    setPaused: (p) => { paused = p; },
    toggleAltRoute: () => {
      if (!current?.altPaths) return false;
      altIdx = (altIdx + 1) % (current.altPaths.length + 1);
      return altIdx > 0;
    },
    currentMode: () => mode,
    onFrame: (cb) => { frameCbs.push(cb); },
    resize: () => { /* el tick recalcula tamaño */ },
    dispose: () => {
      cancelAnimationFrame(raf);
      io?.disconnect();
      renderer.dispose();
    },
  };
}
