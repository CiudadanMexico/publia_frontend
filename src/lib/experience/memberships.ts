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
export interface Recommendation {
  plan: Membership | null;
  /** true cuando la recomendación es de Housing (independiente del plan) */
  housing: boolean;
}
export function recommend(goal: string | null, team: string | null): Recommendation | null {
  if (!goal || !team) return null;
  if (goal === 'agent') return { plan: bySlug('agente') ?? null, housing: false };
  if (goal === 'growth') return { plan: bySlug('crecimiento') ?? null, housing: false };
  if (goal === 'support') return { plan: team === 'large' ? bySlug('cobertura') ?? null : bySlug('operacion') ?? null, housing: false };
  if (goal === 'start') return { plan: team === 'large' ? bySlug('crecimiento') ?? null : bySlug('base') ?? null, housing: false };
  // P0-02: infraestructura/Housing NO recomienda COBERTURA por defecto.
  // Genera una recomendación independiente de Housing + invitación a dimensionar el equipo.
  return { plan: null, housing: true };
}

export function bindMemberships(): void {
  const wrap = document.querySelector<HTMLElement>('[data-demo="memberships"]');
  if (!wrap || wrap.dataset.bound === '1') return;
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
  const elRecoText = wrap.querySelector<HTMLElement>('[data-memb-reco-text]');
  const elChoose = wrap.querySelector<HTMLButtonElement>('[data-memb-choose]');
  const elChosen = wrap.querySelector<HTMLElement>('[data-memb-chosen]');
  const badges = [...wrap.querySelectorAll<HTMLElement>('[data-memb-badge]')];

  let goal: string | null = null;
  let team: string | null = null;

  const ORDER = ['base', 'agente', 'crecimiento', 'operacion', 'cobertura'];

  const render = (slug: string): void => {
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
  };
  // Selección explícita del visitante: renderiza Y persiste (única vía que toca state.membership).
  const select = (slug: string): void => {
    render(slug);
    const plan = bySlug(slug);
    if (!plan) return;
    setMembership(plan.slug as never);
    track('membership_selected', { membresia: plan.slug });
    if (elChosen) elChosen.textContent = `Tu selección: ${plan.name}`;
    badges.forEach((b) => (b.hidden = true));
    planBtns.forEach((b) => b.classList.remove('is-suggested'));
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
  let suggested: string | null = null;
  recoBtn?.addEventListener('click', () => {
    if (!elReco || !elRecoText) return;
    if (!goal || !team) {
      elReco.hidden = false;
      elRecoText.textContent = '⚠ Selecciona ambas respuestas para obtener una recomendación.';
      if (elChoose) elChoose.hidden = true;
      return;
    }
    const rec = recommend(goal, team);
    if (!rec) return;
    elReco.hidden = false;
    suggested = rec.plan?.slug ?? null;
    // La sugerencia se marca visualmente pero NO reemplaza la selección confirmada
    badges.forEach((b) => (b.hidden = b.dataset.membBadge !== suggested));
    planBtns.forEach((b) => b.classList.toggle('is-suggested', b.dataset.membPlan === suggested));
    if (rec.housing) {
      elRecoText.textContent = '💡 Recomendación orientativa: Housing con modalidad compartida o privada a definir contigo (E22). El plan de membresía se dimensiona con tu equipo y tu operación — no hay tarifa predeterminada.';
      if (elChoose) elChoose.hidden = true;
      track('membership_diagnosis', { goal, team, recomendacion: 'housing' });
    } else if (rec.plan) {
      elRecoText.textContent = `💡 Nuestra sugerencia: ${rec.plan.name} · ${fmtPrice(rec.plan.price)} · referencia orientativa, no es una oferta vinculante.`;
      if (elChoose) elChoose.hidden = false;
      track('membership_diagnosis', { goal, team, recomendacion: rec.plan.slug });
    }
    // no se llama a render(): el detalle sigue mostrando la selección confirmada (o BASE visual)
  });
  // «Elegir este plan»: ÚNICO botón que persiste la recomendación como selección
  elChoose?.addEventListener('click', () => {
    if (suggested) select(suggested);
  });

  // Default visual BASE sin persistir; si el visitante ya eligió, se restaura sin reescribir.
  const savedMemb = getState().membership ?? 'base';
  render(savedMemb);
  if (elChosen) elChosen.textContent = getState().membership ? `Tu selección: ${bySlug(savedMemb)?.name ?? savedMemb}` : 'Tu selección: aún no confirmas un plan (BASE es sólo la vista inicial)';
  wrap.dataset.bound = '1';
}
