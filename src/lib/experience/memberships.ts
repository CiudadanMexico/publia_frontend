/**
 * Membresías (Bloque D): selección de nivel desde la fuente canónica
 * (src/data/memberships), diagnóstico de 2 preguntas y persistencia en
 * state.membership. AGENTE nunca se presenta con tarifa confirmada.
 */
import { MEMBERSHIPS, type Membership } from '../../data/memberships';
import { setMembership, getState } from './state';
import { track } from './events';

const fmtPrice = (p: Membership['price']): string =>
  p.priceConfirmed && p.priceFrom != null
    ? `$${p.priceFrom.toLocaleString('es-MX')} MXN/mes`
    : `pendiente de confirmar${p.priceFrom != null ? ` (objetivo $${p.priceFrom.toLocaleString('es-MX')}${p.priceTo != null && p.priceTo !== p.priceFrom ? `–$${p.priceTo.toLocaleString('es-MX')}` : ''} MXN/mes)` : ''}`;

const bySlug = (slug: string): Membership | undefined => MEMBERSHIPS.find((m) => m.slug === slug);

/** Lógica del prototipo 06, mapeada a los slugs canónicos. */
function recommend(goal: string | null, team: string | null): Membership | null {
  if (!goal || !team) return null;
  if (goal === 'agent') return bySlug('agente') ?? null;
  if (goal === 'growth') return bySlug('crecimiento') ?? null;
  if (goal === 'support') return team === 'large' ? bySlug('cobertura') ?? null : bySlug('operacion') ?? null;
  if (goal === 'infrastructure') return bySlug('cobertura') ?? null; // Housing + asesoría: precio por cotizar
  if (goal === 'start') return team === 'large' ? bySlug('crecimiento') ?? null : bySlug('base') ?? null;
  return bySlug('base') ?? null;
}

export function bindMemberships(): void {
  const wrap = document.querySelector<HTMLElement>('[data-demo="memberships"]');
  if (!wrap) return;
  const planBtns = [...wrap.querySelectorAll<HTMLButtonElement>('[data-memb-plan]')];
  const chips = [...wrap.querySelectorAll<HTMLElement>('[data-memb-chip]')];
  const elName = wrap.querySelector('[data-memb-name]');
  const elSummary = wrap.querySelector('[data-memb-summary]');
  const elPrice = wrap.querySelector('[data-memb-price]');
  const elPending = wrap.querySelector<HTMLElement>('[data-memb-pending]');
  const elIncludes = wrap.querySelector('[data-memb-includes]');
  const elExcludes = wrap.querySelector('[data-memb-excludes]');
  const elWindow = wrap.querySelector<HTMLElement>('[data-memb-window]');
  const core = wrap.querySelector<HTMLElement>('[data-memb-core]');
  const goalBtns = [...wrap.querySelectorAll<HTMLButtonElement>('[data-memb-goal]')];
  const teamBtns = [...wrap.querySelectorAll<HTMLButtonElement>('[data-memb-team]')];
  const recoBtn = wrap.querySelector<HTMLButtonElement>('[data-memb-recommend]');
  const elReco = wrap.querySelector<HTMLElement>('[data-memb-reco]');

  let goal: string | null = null;
  let team: string | null = null;

  const ORDER = ['base', 'agente', 'crecimiento', 'operacion', 'cobertura'];

  const select = (slug: string): void => {
    const plan = bySlug(slug);
    if (!plan) return;
    planBtns.forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.membPlan === slug)));
    const upto = ORDER.slice(0, ORDER.indexOf(slug) + 1);
    chips.forEach((chip) => chip.classList.toggle('is-on', upto.includes(chip.dataset.membChip ?? '')));
    if (elName) elName.textContent = plan.name;
    if (elSummary) elSummary.textContent = plan.summary;
    if (elPrice) elPrice.textContent = fmtPrice(plan.price);
    if (elPending) {
      elPending.textContent = plan.price.priceConfirmed === false ? plan.price.pending ?? 'Precio pendiente de confirmación comercial.' : '';
      elPending.style.display = plan.price.priceConfirmed === false ? '' : 'none';
    }
    if (elIncludes) elIncludes.innerHTML = plan.features.filter((f) => f.kind === 'incluye').map((f) => `<li>${f.label}${f.confirmed ? '' : ' *'}</li>`).join('');
    if (elExcludes) elExcludes.innerHTML = plan.features.filter((f) => f.kind !== 'incluye').map((f) => `<li>${f.label}${f.confirmed ? '' : ' *'}</li>`).join('');
    if (elWindow) {
      elWindow.textContent = plan.serviceWindow
        ? `Ventana confirmada: ${plan.serviceWindow.start}–${plan.serviceWindow.end} h${plan.serviceWindow.note ? ` · ${plan.serviceWindow.note}` : ''}`
        : '';
      elWindow.style.display = plan.serviceWindow ? '' : 'none';
    }
    if (core) core.style.boxShadow = `0 10px 34px rgba(7,26,49,.25), 0 0 ${18 + upto.length * 8}px rgba(255, 209, 46, .55)`;
    setMembership(plan.slug as never);
    track('membership_selected', { membresia: plan.slug });
  };

  planBtns.forEach((b) => b.addEventListener('click', () => select(b.dataset.membPlan ?? 'base')));
  goalBtns.forEach((b) => b.addEventListener('click', () => {
    goal = b.dataset.membGoal ?? null;
    goalBtns.forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
  }));
  teamBtns.forEach((b) => b.addEventListener('click', () => {
    team = b.dataset.membTeam ?? null;
    teamBtns.forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
  }));
  recoBtn?.addEventListener('click', () => {
    if (!elReco) return;
    if (!goal || !team) {
      elReco.hidden = false;
      elReco.textContent = '⚠ Selecciona ambas respuestas para obtener una recomendación.';
      return;
    }
    const rec = recommend(goal, team);
    if (!rec) return;
    elReco.hidden = false;
    elReco.textContent = goal === 'infrastructure'
      ? `💡 Recomendación orientativa: ${rec.name} como base, con Housing + asesoría (infraestructura: precio por cotizar).`
      : `💡 Recomendación orientativa: ${rec.name} · ${fmtPrice(rec.price)} · referencia, no es una oferta vinculante.`;
    select(rec.slug);
    track('membership_diagnosis', { goal, team, recomendacion: rec.slug });
  });

  select(getState().membership ?? 'base');
}
