/**
 * Infraestructura soberana (Bloque A): selección de modo con cambio de
 * cámara/iluminación en el universo, demo "activar red" con contador y
 * pulsos, y persistencia de la preferencia en state.infra.
 */
import { INFRA_MODES } from '../../data/infra';
import { setInfraPreference, getState } from './state';
import { track } from './events';

export interface InfraUniverse {
  setSceneLook(params: Record<string, unknown>): void;
  cardPulse(index: number): void;
}

export function bindInfra(universe: InfraUniverse | null): void {
  document.querySelectorAll<HTMLElement>('[data-demo="infra2"]').forEach((w) => {
    if (w.dataset.bound === '1') return;
    w.dataset.bound = '1';
    bindOne(w, universe);
  });
}

function bindOne(wrap: HTMLElement, universe: InfraUniverse | null): void {
  const modeBtns = [...wrap.querySelectorAll<HTMLButtonElement>('[data-infra2-mode]')];
  const elStatus = wrap.querySelector('[data-infra2-status]');
  const elDesc = wrap.querySelector('[data-infra2-desc]');
  const elBenefits = wrap.querySelector('[data-infra2-benefits]');
  const elLimits = wrap.querySelector('[data-infra2-limits]');
  const elLaunch = wrap.querySelector<HTMLButtonElement>('[data-infra2-launch]');
  const elToast = wrap.querySelector<HTMLElement>('[data-infra2-toast]');
  const elTraffic = wrap.querySelector('[data-infra2-traffic]');
  const racks = [...wrap.querySelectorAll<HTMLElement>('[data-infra2-rack]')];
  const flow = wrap.querySelector<SVGPathElement>('[data-infra2-flow]');
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  let traffic = 0;
  let toastTimer = 0;
  const timers: number[] = [];

  const toast = (msg: string): void => {
    if (!elToast) return;
    elToast.textContent = msg;
    elToast.classList.add('visible');
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => elToast.classList.remove('visible'), 2200);
  };

  const select = (id: string): void => {
    const mode = INFRA_MODES.find((m) => m.id === id);
    if (!mode) return;
    modeBtns.forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.infra2Mode === id)));
    if (elStatus) elStatus.textContent = mode.status;
    if (elDesc) elDesc.textContent = mode.description;
    if (elBenefits) elBenefits.innerHTML = mode.benefits.map((b) => `<li>${b}</li>`).join('');
    if (elLimits) elLimits.innerHTML = mode.limitations.map((l) => `<li>${l}</li>`).join('');
    setInfraPreference(mode.id);
    universe?.setSceneLook({
      tintHex: mode.tintHex,
      tintMix: 0.55,
      network: mode.id === 'red_distribuida' ? 1 : 0.85,
      spread: mode.id === 'housing' ? 0.55 : 0.4,
      lightBoost: 1.15,
      ...mode.cam,
    });
    universe?.cardPulse(INFRA_MODES.indexOf(mode));
    track('infra_selected', { modo: mode.id });
  };

  modeBtns.forEach((b) => b.addEventListener('click', () => select(b.dataset.infra2Mode ?? 'ia_privada')));

  elLaunch?.addEventListener('click', () => {
    timers.forEach(window.clearTimeout);
    if (elLaunch) elLaunch.disabled = true;
    traffic += 17;
    if (elTraffic) elTraffic.textContent = String(traffic).padStart(3, '0');
    racks.forEach((rack, i) => {
      timers.push(
        window.setTimeout(() => {
          rack.classList.add('is-on');
          timers.push(window.setTimeout(() => rack.classList.remove('is-on'), 460));
        }, reduced ? 0 : i * 65),
      );
    });
    if (flow) {
      flow.style.filter = 'drop-shadow(0 0 11px #fff482)';
      timers.push(window.setTimeout(() => (flow.style.filter = ''), reduced ? 80 : 1000));
    }
    toast('✓ Simulación: tráfico distribuido entre nodos');
    timers.push(window.setTimeout(() => { if (elLaunch) elLaunch.disabled = false; }, reduced ? 200 : 1200));
    track('infra_red_activated', {});
  });

  select(getState().infra ?? 'ia_privada');
}
