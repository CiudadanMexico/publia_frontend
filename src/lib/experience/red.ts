/**
 * Red Colaborativa (P0-05): órbita de 6 capacidades + 3 demostraciones con
 * flujo iluminado. Selección persiste en state.red; corre el demo con timers.
 */
import { RED_CAPABILITIES, RED_DEMOS } from '../../data/red';
import { setRedCapability, getState } from './state';
import { track } from './events';

export interface RedUniverse {
  cardPulse(index: number): void;
  setSceneLook(params: Record<string, unknown>): void;
  gesture(): void;
}

const pad = (n: number): string => String(n).padStart(2, '0');

export function bindRed(universe: RedUniverse | null): void {
  const wrap = document.querySelector<HTMLElement>('[data-demo="red"]');
  if (!wrap || wrap.dataset.bound === '1') return;
  const universeEl = wrap.querySelector<HTMLElement>('[data-red-universe]');
  const nodesWrap = wrap.querySelector<HTMLElement>('[data-red-nodes]');
  const wires = [...wrap.querySelectorAll<SVGLineElement>('[data-red-wire]')];
  if (!universeEl || !nodesWrap) return;
  const nodes = [...nodesWrap.querySelectorAll<HTMLButtonElement>('[data-red-node]')];
  const elNum = wrap.querySelector('[data-red-num]');
  const elIcon = wrap.querySelector('[data-red-icon]');
  const elTitle = wrap.querySelector('[data-red-title]');
  const elDesc = wrap.querySelector('[data-red-desc]');
  const elExampleBtn = wrap.querySelector<HTMLButtonElement>('[data-red-example]');
  const elExample = wrap.querySelector<HTMLElement>('[data-red-example-text]');
  const elToast = wrap.querySelector<HTMLElement>('[data-red-toast]');
  const elInfo = wrap.querySelector<HTMLElement>('[data-red-info]');
  const elScenarioTitle = wrap.querySelector('[data-red-scenario-title]');
  const elResult = wrap.querySelector<HTMLElement>('[data-red-result]');
  const chips = [...wrap.querySelectorAll<HTMLButtonElement>('[data-red-case]')];
  const runBtn = wrap.querySelector<HTMLButtonElement>('[data-red-run]');
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  let selected = 0;
  let caseIndex = 0;
  let toastTimer = 0;
  let runTimers: number[] = [];

  const toast = (msg: string): void => {
    if (!elToast) return;
    elToast.textContent = msg;
    elToast.classList.add('visible');
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => elToast.classList.remove('visible'), 2600);
  };

  // persist=false solo para el renderizado inicial (restaurar o default visual);
  // las selecciones del visitante siempre persisten.
  const choose = (i: number, persist = true): void => {
    selected = ((i % nodes.length) + nodes.length) % nodes.length;
    const c = RED_CAPABILITIES[selected];
    if (!c) return;
    nodes.forEach((n, j) => n.setAttribute('aria-pressed', String(j === selected)));
    if (elNum) elNum.textContent = `${pad(selected + 1)} / ${pad(nodes.length)}`;
    if (elIcon) elIcon.textContent = c.icon;
    if (elTitle) elTitle.textContent = c.title;
    if (elDesc) elDesc.textContent = c.desc;
    if (elInfo) elInfo.style.borderColor = c.color;
    if (elExample) elExample.hidden = true;
    if (persist) {
      setRedCapability(c.id);
      track('red_capability_selected', { capacidad: c.id });
    }
    universe?.cardPulse(selected);
  };

  const setCase = (i: number): void => {
    caseIndex = i;
    chips.forEach((ch, j) => ch.setAttribute('aria-pressed', String(j === i)));
    const d = RED_DEMOS[i];
    if (elScenarioTitle && d) elScenarioTitle.textContent = d.title;
  };

  const stopRun = (): void => {
    runTimers.forEach(window.clearTimeout);
    runTimers = [];
    nodes.forEach((n) => n.classList.remove('is-running'));
    wires.forEach((w) => w.classList.remove('is-live'));
    if (runBtn) runBtn.disabled = false;
  };

  const run = (): void => {
    stopRun();
    const d = RED_DEMOS[caseIndex];
    if (!d || !elResult) return;
    if (runBtn) runBtn.disabled = true;
    toast(`⚡ Simulación visual: ${d.title}`);
    const delay = reduced ? 75 : 850;
    d.path.forEach((nodeIdx, step) => {
      runTimers.push(
        window.setTimeout(() => {
          nodes.forEach((n) => n.classList.remove('is-running'));
          wires.forEach((w) => w.classList.remove('is-live'));
          const node = nodes[nodeIdx];
          const wire = wires[nodeIdx];
          node?.classList.add('is-running');
          wire?.classList.add('is-live');
          choose(nodeIdx);
          if (elResult) elResult.textContent = `${step + 1}/3 · ${d.labels[step] ?? ''}`;
          universe?.cardPulse(nodeIdx);
        }, step * delay),
      );
    });
    runTimers.push(
      window.setTimeout(() => {
        if (elResult) elResult.textContent = d.text;
        stopRun();
        if (elResult) elResult.textContent = d.text;
        track('red_demo_run', { demo: d.id }); // fin de la demo: un evento por acción completada
      }, d.path.length * delay + (reduced ? 80 : 900)),
    );
    track('red_demo_start', { demo: d.id }); // inicio: evento separado
  };

  nodes.forEach((node, i) => node.addEventListener('click', () => choose(i)));
  chips.forEach((ch, i) => ch.addEventListener('click', () => { stopRun(); setCase(i); }));
  runBtn?.addEventListener('click', run);
  elExampleBtn?.addEventListener('click', () => {
    const c = RED_CAPABILITIES[selected];
    if (!elExample || !c) return;
    elExample.hidden = !elExample.hidden;
    if (!elExample.hidden) elExample.textContent = c.example;
    toast(`Ejemplo de ${c.name.toLowerCase()}`);
  });

  // Restaurar selección previa del estado; si no hay, default visual sin persistir.
  const saved = getState().red;
  const savedIdx = RED_CAPABILITIES.findIndex((c) => c.id === saved);
  choose(savedIdx >= 0 ? savedIdx : 0, false);
  setCase(0);
  wrap.dataset.bound = '1';

  // Órbita ligada al scroll de la escena (reversible); rAF sólo cerca del viewport
  const scene = wrap.closest<HTMLElement>('section[id]');
  const place = (progress: number, rot: number): void => {
    const w = universeEl.clientWidth;
    const h = universeEl.clientHeight;
    const rx = Math.min(w * 0.31, 300);
    const ry = Math.min(h * 0.33, 210);
    nodes.forEach((el, i) => {
      const theta = -Math.PI / 2 + 0.1 + i * (Math.PI * 2 / 6) + rot + progress * 0.18;
      const x = Math.cos(theta) * rx;
      const y = Math.sin(theta) * ry;
      const z = Math.sin(theta * 1.2) * 40 + (i === selected ? 55 : 0);
      const s = (i === selected ? 1.12 : 1) * (window.innerWidth < 900 ? 0.82 : 1);
      el.style.transform = `translate3d(calc(-50% + ${x}px), calc(-50% + ${y}px), ${z}px) scale(${s})`;
      el.style.zIndex = String(20 + Math.floor(z));
      const wire = wires[i];
      if (wire) {
        wire.setAttribute('x2', String(50 + (x / Math.max(1, w)) * 50));
        wire.setAttribute('y2', String(50 + (y / Math.max(1, h)) * 50));
      }
    });
  };

  if (!reduced) {
    let raf = 0;
    let rot = 0;
    let visible = false;
    let sceneTop = 0;
    let sceneTotal = 1;
    const measure = (): void => {
      if (!scene) return;
      sceneTop = scene.getBoundingClientRect().top + window.scrollY;
      sceneTotal = Math.max(1, scene.offsetHeight - window.innerHeight);
    };
    measure();
    window.addEventListener('resize', measure, { passive: true });
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(
        (entries) => {
          visible = entries.some((e) => e.isIntersecting);
          if (visible) measure();
        },
        { rootMargin: '40% 0px' },
      ).observe(universeEl);
    } else {
      visible = true;
    }
    const tick = (): void => {
      raf = requestAnimationFrame(tick);
      if (!visible) return;
      rot += 0.0018;
      const progress = Math.min(1, Math.max(0, (window.scrollY - sceneTop) / sceneTotal));
      place(progress, rot);
      universeEl.style.transform = `rotateY(${progress * 13}deg) rotateX(${-8 * progress}deg) scale(${1 + 0.045 * Math.sin(Math.PI * progress)})`;
    };
    raf = requestAnimationFrame(tick);
    window.addEventListener('pagehide', () => cancelAnimationFrame(raf), { once: true });
  } else {
    place(0, 0);
  }
}
