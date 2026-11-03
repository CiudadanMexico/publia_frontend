/**
 * PUBLIA R03-E · Partículas reactivas.
 *
 * Puerto TypeScript del módulo entregado (`src/modules/particulas.js`).
 * Se conservan la paleta, los tamaños, las velocidades y los shaders.
 */
import * as THREE from 'three';

export interface ParticleState {
  mode: 'ambient' | 'orbit' | 'burst';
  intensity: number;
  explode: number;
  orbit: number;
  time: number;
}

export interface ParticlesHandle {
  root: THREE.Group;
  state: ParticleState;
  update(time: number, delta?: number): void;
  setMode(mode: 'ambient' | 'orbit' | 'burst'): void;
  setProgress(progress: number): void;
  dispose(): void;
}

function devicePixelRatioSafe(): number {
  return typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;
}

export function createPubliaParticles({
  count = 520,
  seed = 2026,
  reducedMotion = false,
}: { count?: number; seed?: number; reducedMotion?: boolean } = {}): ParticlesHandle {
  let s = seed >>> 0;
  const rand = (): number => ((s = (1664525 * s + 1013904223) >>> 0) / 4294967296);

  const root = new THREE.Group();
  root.name = 'Publia_ReactiveParticles';
  const geometry = new THREE.BufferGeometry();
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);
  const sizes = new Float32Array(count);
  const origins = new Float32Array(count * 3);
  const speeds = new Float32Array(count);
  const phases = new Float32Array(count);
  const palette = [
    new THREE.Color('#65eaff'),
    new THREE.Color('#8e7bff'),
    new THREE.Color('#ffc365'),
  ];

  for (let i = 0; i < count; i += 1) {
    const j = i * 3;
    const a = rand() * Math.PI * 2;
    const radius = 0.35 + Math.sqrt(rand()) * 3.6;
    origins[j] = Math.cos(a) * radius + 0.75;
    origins[j + 1] = (rand() - 0.5) * 4.6;
    origins[j + 2] = Math.sin(a) * radius - 0.3;
    positions.set(origins.subarray(j, j + 3), j);
    const c = palette[rand() < 0.62 ? 0 : rand() < 0.75 ? 1 : 2] ?? palette[0]!;
    colors[j] = c.r;
    colors[j + 1] = c.g;
    colors[j + 2] = c.b;
    sizes[i] = 0.45 + rand() * 1.6;
    speeds[i] = 0.25 + rand() * 0.85;
    phases[i] = rand() * Math.PI * 2;
  }

  geometry.setAttribute(
    'position',
    new THREE.BufferAttribute(positions, 3).setUsage(THREE.DynamicDrawUsage),
  );
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  geometry.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1));

  const material = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    vertexColors: true,
    uniforms: {
      uOpacity: { value: 0.85 },
      uPixelRatio: { value: Math.min(devicePixelRatioSafe(), 2) },
    },
    vertexShader: `attribute float aSize; varying vec3 vColor; uniform float uPixelRatio; void main(){vColor=color; vec4 mv=modelViewMatrix*vec4(position,1.); gl_Position=projectionMatrix*mv; gl_PointSize=clamp(aSize*9.0*uPixelRatio/max(1.0,-mv.z),1.0,18.0);}`,
    fragmentShader: `varying vec3 vColor; uniform float uOpacity; void main(){float r=length(gl_PointCoord-vec2(.5)); float glow=exp(-r*r*21.); float core=smoothstep(.22,.025,r); float alpha=(glow*.35+core*.8)*uOpacity; if(alpha<.01) discard; gl_FragColor=vec4(vColor,alpha);}`,
  });

  const points = new THREE.Points(geometry, material);
  points.frustumCulled = false;
  root.add(points);

  const state: ParticleState = { mode: 'ambient', intensity: 0.75, explode: 0, orbit: 0, time: 0 };

  function update(time: number, delta = 0.016): void {
    if (reducedMotion) time = 0;
    state.time = time;
    for (let i = 0; i < count; i += 1) {
      const j = i * 3;
      const x = origins[j] as number;
      const y = origins[j + 1] as number;
      const z = origins[j + 2] as number;
      const phase = phases[i] as number;
      const sp = speeds[i] as number;
      const t = time * sp + phase;
      let px = x + Math.sin(t * 0.8) * 0.065;
      let py = y + Math.sin(t) * 0.09;
      let pz = z + Math.cos(t * 0.7) * 0.065;
      const orbit = state.orbit;
      if (orbit > 0) {
        const a = time * 0.22 * sp + phase * 0.13;
        const cs = Math.cos(a);
        const sn = Math.sin(a);
        px = (x * cs - z * sn) * orbit + px * (1 - orbit);
        pz = (x * sn + z * cs) * orbit + pz * (1 - orbit);
      }
      const length = Math.max(0.25, Math.hypot(x, y, z));
      px += (x / length) * state.explode * 2.3;
      py += (y / length) * state.explode * 2.3;
      pz += (z / length) * state.explode * 2.3;
      positions[j] = px;
      positions[j + 1] = py;
      positions[j + 2] = pz;
    }
    geometry.attributes.position!.needsUpdate = true;
    material.uniforms.uOpacity!.value = state.intensity;
  }

  function setMode(mode: 'ambient' | 'orbit' | 'burst'): void {
    state.mode = mode;
    state.orbit = mode === 'orbit' ? 1 : 0;
    state.explode = mode === 'burst' ? 1 : 0;
  }

  function setProgress(progress: number): void {
    state.explode = THREE.MathUtils.clamp(
      Math.sin(Math.PI * THREE.MathUtils.clamp(progress, 0, 1)),
      0,
      1,
    );
  }

  function dispose(): void {
    root.remove(points);
    geometry.dispose();
    material.dispose();
    root.removeFromParent();
  }

  return { root, update, setMode, setProgress, state, dispose };
}
