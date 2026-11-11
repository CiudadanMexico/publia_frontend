/**
 * Ecosistema (7M-F §8): órbita visual conservada; el panel muestra las ocho
 * familias textuales literales de copy.es-MX.json (`ecosystem.families`) con
 * tipo de intervención, cuatro pasos y resultado. La órbita selecciona la
 * familia correspondiente cuando existe equivalencia documentada (abajo);
 * una familia sin nodo sigue disponible en el selector. Selección inicial ia.
 * Persiste en answers.servicio sólo con interacción explícita (7M-E P0-01).
 */
import { COPY_7MF } from '../../data/copy7mf';
import { getState, setAnswer } from './state';
import { track } from './events';

export interface EcosystemUniverse {
  cardPulse(index: number): void;
  gesture(): void;
}

/** Correspondencia documentada por significado: familia → índice de nodo de la órbita. */
const FAMILY_NODE: Record<string, number> = { ia: 0, web: 1, agentes: 2, cooperacion: 3, multimedia: 4, marketing: 5, ecologia: 6, infraestructura: 7 };
const NODE_FAMILY: Record<number, string> = Object.fromEntries(Object.entries(FAMILY_NODE).map(([f, n]) => [n, f]));

const eco = COPY_7MF.ecosystem;
/** 7M-G §5: familia Ecología restaurada (nodo 6) con los textos definitivos de la orden. */
import { ECOLOGIA_FAMILY } from '../../data/copy7mg';
const families = [...eco.families, ECOLOGIA_FAMILY] as unknown as typeof eco.families;
type FamilyId = (typeof families)[number]['id'];
const byId = new Map<string, (typeof families)[number]>(families.map((f) => [f.id, f]));
const waBase = `https://wa.me/${COPY_7MF.contact.number}?text=`;

export function bindEcosystem(universe: EcosystemUniverse | null): void {
  const wrap = document.querySelector<HTMLElement>('[data-demo="ecosystem"]');
  if (!wrap || wrap.dataset.bound === '1') return;
  wrap.dataset.bound = '1';
  const cloud = wrap.querySelector<HTMLElement>('[data-eco-cloud]');
  const orbit = wrap.querySelector<HTMLElement>('[data-eco-orbit]');
  const scene = wrap.closest<HTMLElement>('section[id]');
  if (!cloud || !orbit) return;
  const nodes = [...cloud.querySelectorAll<HTMLButtonElement>('[data-eco-node]')];
  const familyBtns = [...wrap.querySelectorAll<HTMLButtonElement>('[data-eco-family]')];
  const elTitle = wrap.querySelector<HTMLElement>('[data-eco-title]');
  const elMode = wrap.querySelector<HTMLElement>('[data-eco-mode]');
  const elSteps = wrap.querySelector<HTMLOListElement>('[data-eco-steps]');
  const elResult = wrap.querySelector<HTMLElement>('[data-eco-result]');
  const elCta = wrap.querySelector<HTMLAnchorElement>('[data-eco-cta]');
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  let selected: string = 'ia';

  const select = (id: FamilyId | string, persist = true): void => {
    const fam = byId.get(id);
    if (!fam) return;
    selected = id;
    familyBtns.forEach((b) => b.setAttribute('aria-pressed', b.dataset['ecoFamily'] === id ? 'true' : 'false'));
    const nodeIdx = FAMILY_NODE[id];
    nodes.forEach((n, j) => n.setAttribute('aria-pressed', nodeIdx === j ? 'true' : 'false'));
    if (elTitle) elTitle.textContent = fam.label;
    if (elMode) elMode.textContent = fam.mode;
    if (elSteps) {
      elSteps.innerHTML = fam.steps
        .map((st) => `<li data-eco-step><strong data-eco-step-title>${st.title}</strong><span data-eco-step-body>${st.body}</span></li>`)
        .join('');
    }
    if (elResult) elResult.textContent = fam.result;
    if (elCta) elCta.href = `${waBase}${encodeURIComponent(COPY_7MF.contact.ecosystemMessage.replace('{label}', fam.label))}`;
    if (persist) {
      setAnswer('servicio', fam.label);
      track('ecosystem_selected', { familia: fam.label });
    }
    if (nodeIdx !== undefined) universe?.cardPulse(nodeIdx);
  };

  familyBtns.forEach((b) => b.addEventListener('click', () => {
    const id = b.dataset['ecoFamily'];
    if (id) select(id);
  }));
  nodes.forEach((node, i) => {
    node.addEventListener('click', () => {
      const famId = NODE_FAMILY[i];
      if (famId) select(famId);
    });
  });
  wrap.addEventListener('keydown', (ev) => {
    const tag = (ev.target as HTMLElement).tagName;
    const idx = families.findIndex((f) => f.id === selected);
    if (ev.key === 'ArrowRight' && !['BUTTON', 'INPUT', 'TEXTAREA'].includes(tag)) select(families[(idx + 1) % families.length]!.id);
    if (ev.key === 'ArrowLeft' && !['BUTTON', 'INPUT', 'TEXTAREA'].includes(tag)) select(families[(idx - 1 + families.length) % families.length]!.id);
  });

  // 7M-E P0-01: restaurar sin persistir; default 'ia' (§8)
  const prev = getState().answers.servicio;
  const initial = prev && families.some((f) => f.label === prev) ? families.find((f) => f.label === prev)!.id : 'ia';
  select(initial, false);

  // 7M-G §5: órbita ligada al progreso de scroll de la escena (reversible),
  // restaurada del binder previo; tiempo ambiental con delta subordinado al
  // scroll. Sólo corre cerca del viewport y fuera de pestaña oculta.
  if (!reduced) {
    let raf = 0;
    let rot = 0;
    let lastT = 0;
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
      new IntersectionObserver((entries) => {
        visible = entries.some((e) => e.isIntersecting);
        if (visible) measure();
      }, { rootMargin: '40% 0px' }).observe(orbit);
    } else {
      visible = true;
    }
    const tick = (t: number): void => {
      raf = window.requestAnimationFrame(tick);
      if (!visible || document.hidden) { lastT = t; return; }
      const dt = Math.min(0.05, (t - lastT) / 1000 || 0);
      lastT = t;
      rot += dt * 0.09; // ambiental, con delta
      const progress = Math.min(1, Math.max(0, (window.scrollY - sceneTop) / sceneTotal));
      const w = orbit.clientWidth;
      const h = orbit.clientHeight;
      const rx = Math.min(w * 0.36, 340);
      const ry = h * 0.3;
      cloud.style.transform = `rotateY(${rot * 40 + progress * 30}deg) rotateX(${-4 + Math.sin(progress * Math.PI) * 10}deg)`;
      nodes.forEach((el, i) => {
        const angle = (i * Math.PI * 2) / nodes.length - Math.PI / 2 + rot + progress * 0.6;
        const x = Math.cos(angle) * rx;
        const y = Math.sin(angle) * ry;
        const z = Math.sin(angle * 1.3) * 60 + (i === nodes.findIndex((n) => n.getAttribute('aria-pressed') === 'true') ? 70 : 0);
        const scale = (i === nodes.findIndex((n) => n.getAttribute('aria-pressed') === 'true') ? 1.18 : 1) * (window.innerWidth < 900 ? 0.78 : 0.95);
        el.style.transform = `translate3d(calc(-50% + ${x}px), calc(-50% + ${y}px), ${z}px) scale(${scale})`;
        el.style.zIndex = String(20 + Math.floor(z));
      });
    };
    raf = window.requestAnimationFrame(tick);
    window.addEventListener('pagehide', () => window.cancelAnimationFrame(raf), { once: true });
  } else {
    // reduced-motion: anillo estático
    const w = orbit.clientWidth;
    const h = orbit.clientHeight;
    const rx = Math.min(w * 0.36, 340);
    const ry = h * 0.3;
    nodes.forEach((el, i) => {
      const angle = (i * Math.PI * 2) / nodes.length - Math.PI / 2;
      el.style.transform = `translate3d(calc(-50% + ${Math.cos(angle) * rx}px), calc(-50% + ${Math.sin(angle) * ry}px), 0)`;
    });
  }
}
