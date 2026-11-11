/**
 * E27 Membresías — binder 7M-G: restaurado desde la estructura previa
 * (núcleo/chips/selectores/detalle/diagnóstico) con datos de
 * COPY_7MF.memberships.plans. El selector guarda la selección explícita y NO
 * abre WhatsApp; el CTA separado «Conversar sobre este plan» usa
 * contact.planMessage y SÍ persiste al hacer click. El diagnóstico marca
 * sugerencia (badge) sin pisar la selección confirmada.
 */
import { getState, setMembership, type MembershipSlug } from './state';
import { track } from './events';
import { COPY_7MF } from '../../data/copy7mf';

const PLANS = COPY_7MF.memberships.plans;
const ORDER: readonly string[] = PLANS.map((p) => p.id);
const byId = (id: string) => PLANS.find((p) => p.id === id);
const fmt = (n: number): string => `$${n.toLocaleString('es-MX')}`;

/** Lógica de recomendación (tests de comercio); contrato {plan, housing}. */
export function recommend(goal: string | null, team: string | null): { plan: MembershipSlug | null; housing: boolean } | null {
  if (!goal || !team) return null;
  if (goal === 'agent') return { plan: 'agente', housing: false };
  if (goal === 'growth') return { plan: 'crecimiento', housing: false };
  if (goal === 'support') return { plan: team === 'large' ? 'cobertura' : 'operacion', housing: false };
  if (goal === 'start') return { plan: team === 'large' ? 'crecimiento' : 'base', housing: false };
  // infrastructure → Housing independiente, sin plan forzado
  return { plan: null, housing: true };
}

export function bindMemberships(): void {
  const wrap = document.querySelector<HTMLElement>('[data-memb7]');
  if (!wrap || wrap.dataset.bound === '1') return;
  wrap.dataset.bound = '1';

  const planBtns = [...wrap.querySelectorAll<HTMLButtonElement>('[data-memb-plan]')];
  const chips = [...wrap.querySelectorAll<HTMLElement>('[data-memb-chip]')];
  const badges = [...wrap.querySelectorAll<HTMLElement>('[data-memb-badge]')];
  const elName = wrap.querySelector<HTMLElement>('[data-memb-name]');
  const elSummary = wrap.querySelector<HTMLElement>('[data-memb-summary]');
  const elPrice = wrap.querySelector<HTMLElement>('[data-memb-price]');
  const elIncludes = wrap.querySelector<HTMLElement>('[data-memb-includes]');
  const elChosen = wrap.querySelector<HTMLElement>('[data-memb-chosen]');
  const core = wrap.querySelector<HTMLElement>('[data-memb-core]');
  const cta = wrap.querySelector<HTMLAnchorElement>('[data-memb7-cta]');
  const goalBtns = [...wrap.querySelectorAll<HTMLButtonElement>('[data-memb-goal]')];
  const teamBtns = [...wrap.querySelectorAll<HTMLButtonElement>('[data-memb-team]')];
  const recoBtn = wrap.querySelector<HTMLButtonElement>('[data-memb-recommend]');
  const elReco = wrap.querySelector<HTMLElement>('[data-memb-reco]');
  const elRecoText = wrap.querySelector<HTMLElement>('[data-memb-reco-text]');
  const elRecoNote = wrap.querySelector<HTMLElement>('[data-memb-reco-note]');
  const elChoose = wrap.querySelector<HTMLButtonElement>('[data-memb-choose]');
  const elHousing = wrap.querySelector<HTMLAnchorElement>('[data-memb-housing]');

  let goal: string | null = null;
  let team: string | null = null;
  let suggested: string | null = null;

  const render = (id: string): void => {
    const plan = byId(id);
    if (!plan) return;
    planBtns.forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.membPlan === id)));
    const upto = ORDER.slice(0, ORDER.indexOf(id) + 1);
    chips.forEach((chip) => chip.classList.toggle('is-on', upto.includes(chip.dataset.membChip ?? '')));
    if (elName) elName.textContent = plan.label;
    if (elPrice) elPrice.textContent = `${fmt(plan.priceMXN)} ${COPY_7MF.memberships.currency}`;
    if (elSummary) elSummary.textContent = plan.tagline;
    if (elIncludes) elIncludes.innerHTML = plan.features.map((f) => `<li>${f}</li>`).join('');
    if (core) core.style.boxShadow = `0 10px 34px rgba(7,26,49,.25), 0 0 ${18 + upto.length * 8}px rgba(255, 209, 46, .55)`;
    if (cta) {
      cta.dataset.memb7Cta = id;
      cta.href = `https://wa.me/${COPY_7MF.contact.number}?text=${encodeURIComponent(COPY_7MF.contact.planMessage.replace('{label}', plan.label))}`;
    }
  };

  // Selección explícita: renderiza Y persiste (única vía junto al CTA).
  const select = (id: string): void => {
    const plan = byId(id);
    if (!plan) return;
    render(id);
    setMembership(plan.id as MembershipSlug);
    track('membership_selected', { membresia: plan.id });
    if (elChosen) elChosen.textContent = `Tu selección: ${plan.label}`;
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

  recoBtn?.addEventListener('click', () => {
    if (!elReco || !elRecoText) return;
    if (!goal || !team) {
      elReco.hidden = false;
      elRecoText.textContent = 'Elige una respuesta en cada pregunta.';
      if (elRecoNote) elRecoNote.hidden = true;
      if (elChoose) elChoose.hidden = true;
      if (elHousing) elHousing.hidden = true;
      return;
    }
    const rec = recommend(goal, team);
    if (!rec) return;
    elReco.hidden = false;
    suggested = rec.plan;
    badges.forEach((b) => (b.hidden = b.dataset.membBadge !== suggested));
    planBtns.forEach((b) => b.classList.toggle('is-suggested', b.dataset.membPlan === suggested));
    if (rec.housing) {
      elRecoText.textContent = 'Tu punto de partida es dimensionar una infraestructura para tu negocio.';
      if (elRecoNote) elRecoNote.hidden = true;
      if (elChoose) elChoose.hidden = true;
      if (elHousing) elHousing.hidden = false;
      track('membership_diagnosis', { goal, team, recomendacion: 'housing' });
    } else if (rec.plan) {
      const plan = byId(rec.plan);
      elRecoText.textContent = `Tu punto de partida sugerido: ${plan?.label ?? rec.plan}.`;
      if (elRecoNote) elRecoNote.hidden = false;
      if (elChoose) elChoose.hidden = false;
      if (elHousing) elHousing.hidden = true;
      track('membership_diagnosis', { goal, team, recomendacion: rec.plan });
    }
    // no se llama a select(): la selección confirmada no se pisa
  });

  elChoose?.addEventListener('click', () => {
    if (suggested) select(suggested);
  });

  // CTA WhatsApp: persiste la selección visible al confirmar
  cta?.addEventListener('click', () => {
    const id = cta.dataset.memb7Cta as MembershipSlug | undefined;
    if (id) {
      setMembership(id);
      track('membership_selected', { membresia: id, via: 'cta_whatsapp' });
    }
  });

  // Default visual BASE sin persistir; si ya eligió, se restaura
  const saved = getState().membership;
  if (saved && byId(saved)) {
    render(saved);
    if (elChosen) elChosen.textContent = `Tu selección: ${byId(saved)?.label ?? saved}`;
  } else {
    render('base');
  }

  // CTA de E11: abrir los alcances de Operación/Cobertura al llegar
  document.querySelectorAll<HTMLAnchorElement>('[data-open-alcance]').forEach((a) => {
    a.addEventListener('click', () => {
      window.setTimeout(() => {
        ['operacion', 'cobertura'].forEach((id) => {
          const d = wrap.querySelector<HTMLDetailsElement>(`[data-memb-scope="${id}"]`);
          if (d) d.open = true;
        });
      }, 600);
    });
  });
}
