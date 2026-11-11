/**
 * E03 Infraestructura — binder 7M-F §7.
 * Cuatro escenarios (ids canónicos de copy.es-MX.json), un solo SVG visible,
 * crossfade 180ms (CSS), persistencia migrada en state.infra (state.ts aplica
 * INFRA_MIGRATION: valores viejos por significado, desconocidos → local-private).
 * IntersectionObserver + visibilitychange pausan las animaciones fuera de vista.
 */
import { COPY_7MF } from '../../data/copy7mf';
import { getState, setInfraPreference, type InfraPreference } from './state';
import { track } from './events';

const modes = COPY_7MF.infra.modes;
const byId = new Map(modes.map((m) => [m.id as InfraPreference, m]));
const waBase = `https://wa.me/${COPY_7MF.contact.number}?text=`;

export function bindInfra(_universe?: unknown): void {
  document.querySelectorAll<HTMLElement>('[data-infra7]').forEach((wrap) => {
    const buttons = [...wrap.querySelectorAll<HTMLButtonElement>('[data-infra7-mode]')];
    const stage = wrap.querySelector<HTMLElement>('[data-infra7-stage]');
    const svgs = new Map<string, HTMLElement>();
    wrap.querySelectorAll<HTMLElement>('[data-infra7-svg]').forEach((el) => {
      const id = el.dataset['infra7Svg'];
      if (id) svgs.set(id, el);
    });
    const elTitle = wrap.querySelector<HTMLElement>('[data-infra7-title]');
    const elBody = wrap.querySelector<HTMLElement>('[data-infra7-body]');
    const elDetail = wrap.querySelector<HTMLElement>('[data-infra7-detail]');
    const elCta = wrap.querySelector<HTMLAnchorElement>('[data-infra7-cta]');

    const apply = (id: InfraPreference, persist: boolean): void => {
      const mode = byId.get(id);
      if (!mode) return;
      buttons.forEach((b) => b.setAttribute('aria-pressed', b.dataset['infra7Mode'] === id ? 'true' : 'false'));
      svgs.forEach((el, key) => {
        el.hidden = key !== id;
      });
      if (stage) {
        stage.dataset['mode'] = id;
        stage.setAttribute('aria-label', mode.alt); // único nombre accesible del gráfico
      }
      if (elTitle) elTitle.textContent = mode.title;
      if (elBody) elBody.textContent = mode.body;
      if (elDetail) elDetail.textContent = mode.detail;
      if (elCta) {
        elCta.href = `${waBase}${encodeURIComponent(COPY_7MF.contact.infraMessage.replace('{label}', mode.label))}`;
      }
      if (persist) {
        setInfraPreference(id as InfraPreference);
        track('scene_viewed', { scene: 'E03', mode: id });
      }
    };

    buttons.forEach((b) => {
      b.addEventListener('click', () => {
        const id = b.dataset['infra7Mode'] as InfraPreference | undefined;
        if (id && byId.has(id)) apply(id, true);
      });
    });

    // estado persistido (ya migrado por state.ts); default local-private
    const saved = getState().infra ?? 'local-private';
    apply(saved, false);

    // pausa fuera de viewport / pestaña oculta (§7)
    const pause = (on: boolean): void => { wrap.classList.toggle('is-paused', on); };
    if ('IntersectionObserver' in window) {
      const io = new IntersectionObserver(
        (entries) => { entries.forEach((e) => pause(!e.isIntersecting || document.hidden)); },
        { threshold: 0.05 },
      );
      io.observe(wrap);
    }
    document.addEventListener('visibilitychange', () => pause(document.hidden));
  });
}
