/**
 * Cierre personalizado V2 (Bloque E): tarjetas de capacidad con demo de 3
 * pasos y toggle persistido (state.capabilities), propuesta final del estado
 * compartido, exportar TXT, contacto con contexto, volver al diagnóstico y
 * reiniciar. Nada se envía a servidor sin acción explícita del visitante.
 */
import { CIERRE_CAPABILITIES, CONTACTO } from '../../data/cierre';
import { getState, toggleCapability, resetExperience, CAPABILITY_IDS } from './state';
import { track } from './events';

export interface CierreUniverse {
  cardPulse(index: number): void;
}

const ROUTE_LABEL: Record<string, string> = {
  unclassified: 'exploración sin ruta fija',
  enterprise: 'ruta Empresa',
  efficiency: 'ruta Eficiencia',
  explorer: 'exploración libre',
};
const INFRA_LABEL: Record<string, string> = {
  ia_privada: 'IA privada',
  housing: 'Housing administrado',
  red_distribuida: 'Red distribuida',
};

export function buildSummary(): string {
  const s = getState();
  const caps = CAPABILITY_IDS.filter((c) => s.capabilities.includes(c));
  const capNames = CIERRE_CAPABILITIES.filter((c) => caps.includes(c.id)).map((c) => c.name);
  const lines = [
    `Propuesta Publia.mx — ${ROUTE_LABEL[s.primary] ?? s.primary}`,
    s.origin ? `- Elegiste la ruta por: ${s.origin === 'button' ? 'botón' : 'scroll libre'}` : null,
    s.answers.arranque ? `- Arranque: ${s.answers.arranque === 'desde_cero' ? 'desde cero' : 'ya tienes sistemas'}` : null,
    s.answers.foco ? `- Foco: ${s.answers.foco}` : null,
    s.answers.escala ? `- Escala: ${s.answers.escala.replace('_', ' ')}` : null,
    s.answers.servicio ? `- Servicio explorado: ${s.answers.servicio}` : null,
    s.red ? `- Red colaborativa: ${s.red}` : null,
    s.infra ? `- Infraestructura preferida: ${INFRA_LABEL[s.infra]}` : null,
    s.membership ? `- Membresía orientativa: ${s.membership.toUpperCase()}` : null,
    capNames.length ? `- Capacidades elegidas: ${capNames.join(', ')}` : null,
    s.proposalTouched ? '- Propuesta modificada manualmente por el visitante' : null,
    '',
    `Contacto: ${CONTACTO.email} · WhatsApp ${CONTACTO.whatsappLabel}`,
    'Sugerencia orientativa; precios preliminares, no oferta vinculante.',
    'https://publia.mx/',
  ];
  return lines.filter((l): l is string => l !== null).join('\n');
}

export function bindCierre(universe: CierreUniverse | null): void {
  const root = document.querySelector<HTMLElement>('[data-recommendation]');
  if (!root) return;
  const meta = root.querySelector<HTMLElement>('[data-cierre-meta]');
  const cards = [...root.querySelectorAll<HTMLElement>('[data-cierre-card]')];
  const downloadBtn = root.querySelector<HTMLButtonElement>('[data-cierre-download]');
  const topBtn = root.querySelector<HTMLButtonElement>('[data-cierre-top]');
  const restartBtn = root.querySelector<HTMLButtonElement>('[data-cierre-restart]');
  const waLink = root.querySelector<HTMLAnchorElement>('[data-cierre-wa]');
  const mailLink = root.querySelector<HTMLAnchorElement>('[data-cierre-mail]');
  const copied = root.querySelector<HTMLElement>('[data-rec-copied]');
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const DELAY = reduced ? 90 : 900;
  const timers = new Map<string, number[]>();

  const renderMeta = (): void => {
    if (!meta) return;
    const s = getState();
    const caps = s.capabilities
      .map((id) => CIERRE_CAPABILITIES.find((c) => c.id === id)?.name)
      .filter((n): n is string => Boolean(n));
    meta.textContent =
      `Ruta: ${ROUTE_LABEL[s.primary] ?? s.primary}` +
      (s.infra ? ` · Infraestructura: ${INFRA_LABEL[s.infra]}` : '') +
      (s.membership ? ` · Membresía orientativa: ${s.membership.toUpperCase()}` : '') +
      (s.answers.servicio ? ` · Servicio: ${s.answers.servicio}` : '') +
      (caps.length ? ` · Capacidades (${caps.length}/6): ${caps.join(', ')}` : ' · Aún no añades capacidades: toca «＋ Añadir a mi Publia» en las tarjetas');
  };

  const renderCards = (): void => {
    const s = getState();
    cards.forEach((card) => {
      const id = card.dataset.cierreCard as (typeof CAPABILITY_IDS)[number];
      const on = s.capabilities.includes(id);
      card.classList.toggle('is-on', on);
      const toggle = card.querySelector<HTMLButtonElement>('[data-cierre-toggle]');
      if (toggle) {
        toggle.setAttribute('aria-pressed', String(on));
        toggle.textContent = on ? '✓ Quitar de mi Publia' : '＋ Añadir a mi Publia';
      }
    });
    renderMeta();
  };

  cards.forEach((card) => {
    const id = card.dataset.cierreCard ?? '';
    const cap = CIERRE_CAPABILITIES.find((c) => c.id === id);
    if (!cap) return;
    const toggle = card.querySelector<HTMLButtonElement>('[data-cierre-toggle]');
    const demo = card.querySelector<HTMLButtonElement>('[data-cierre-demo]');
    const info = card.querySelector<HTMLButtonElement>('[data-cierre-info]');
    const stepsEl = card.querySelector<HTMLElement>('[data-cierre-steps]');
    const exampleEl = card.querySelector<HTMLElement>('[data-cierre-example]');
    const runEl = card.querySelector<HTMLElement>('[data-cierre-run]');
    const stepEls = [...card.querySelectorAll<HTMLElement>('[data-cierre-steps] li')];

    toggle?.addEventListener('click', () => {
      const nowOn = toggleCapability(cap.id);
      universe?.cardPulse(CIERRE_CAPABILITIES.indexOf(cap));
      track('capability_toggled', { capacidad: cap.id, activa: nowOn });
      renderCards();
    });

    info?.addEventListener('click', () => {
      if (exampleEl) exampleEl.hidden = !exampleEl.hidden;
    });

    demo?.addEventListener('click', () => {
      timers.get(cap.id)?.forEach(window.clearTimeout);
      const t: number[] = [];
      timers.set(cap.id, t);
      if (stepsEl) stepsEl.hidden = false;
      stepEls.forEach((el) => { el.classList.remove('is-active', 'is-done'); });
      if (runEl) runEl.textContent = '';
      cap.steps.forEach((_, i) => {
        t.push(window.setTimeout(() => {
          stepEls.forEach((el, j) => {
            el.classList.toggle('is-active', j === i);
            el.classList.toggle('is-done', j < i);
          });
          if (runEl) runEl.textContent = `${i + 1}/3 · ${cap.steps[i]}`;
        }, i * DELAY));
      });
      t.push(window.setTimeout(() => {
        stepEls.forEach((el, j) => { el.classList.toggle('is-active', false); el.classList.toggle('is-done', j < 3); });
        if (runEl) runEl.textContent = `✓ ${cap.example}`;
        track('cierre_demo', { capacidad: cap.id });
      }, cap.steps.length * DELAY + (reduced ? 60 : 500)));
    });
  });

  downloadBtn?.addEventListener('click', () => {
    const blob = new Blob([buildSummary()], { type: 'text/plain;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'PUBLIA_mi_propuesta.txt';
    a.click();
    URL.revokeObjectURL(a.href);
    if (copied) copied.textContent = '✓ Propuesta descargada como PUBLIA_mi_propuesta.txt';
    track('cierre_export_txt', {});
  });

  const contextLinks = (): void => {
    const text = encodeURIComponent(`Hola Publia, vengo del recorrido web.\n\n${buildSummary()}`);
    if (waLink) waLink.href = `${CONTACTO.whatsapp}?text=${text}`;
    if (mailLink) mailLink.href = `mailto:${CONTACTO.email}?subject=${encodeURIComponent('Mi propuesta desde publia.mx')}&body=${text}`;
  };

  topBtn?.addEventListener('click', () => {
    const diag = document.querySelector<HTMLElement>('#escena-e27');
    (diag ?? root).scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' });
    track('cierre_back_to_diagnosis', {});
  });

  restartBtn?.addEventListener('click', () => {
    resetExperience();
    track('cierre_restart', {});
    window.scrollTo({ top: 0, behavior: reduced ? 'auto' : 'smooth' });
  });

  waLink?.addEventListener('click', () => track('cierre_contact', { canal: 'whatsapp' }));
  mailLink?.addEventListener('click', () => track('cierre_contact', { canal: 'email' }));

  renderCards();
  contextLinks();
  window.addEventListener('publia:state', () => {
    renderCards();
    contextLinks();
  });
}
