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
const FAMILY_NODE: Record<string, number> = { ia: 0, web: 1, agentes: 2, cooperacion: 3, multimedia: 4, marketing: 5, infraestructura: 7 };
const NODE_FAMILY: Record<number, string> = Object.fromEntries(Object.entries(FAMILY_NODE).map(([f, n]) => [n, f]));

const eco = COPY_7MF.ecosystem;
const families = eco.families;
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

  // Órbita continua ligada al scroll de la escena (reversible), sólo cerca del viewport
  if (!reduced) {
    let raf = 0;
    let rot = 0;
    let visible = false;
    const measure = (): void => { void scene; };
    measure();
    if ('IntersectionObserver' in window) {
      new IntersectionObserver((entries) => { visible = entries.some((e) => e.isIntersecting); }, { rootMargin: '40% 0px' }).observe(orbit);
    }
    const tick = (): void => {
      if (visible && !document.hidden) {
        rot = (rot + 0.05) % 360;
        cloud.style.transform = `rotate(${rot}deg)`;
        nodes.forEach((n) => { n.style.transform = `rotate(${-rot}deg)`; });
      }
      raf = window.requestAnimationFrame(tick);
    };
    raf = window.requestAnimationFrame(tick);
    window.addEventListener('pagehide', () => window.cancelAnimationFrame(raf));
  }
}
