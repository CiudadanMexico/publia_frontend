/**
 * E03 Infraestructura — binder 7M-H §7.
 * Stage 3D (infra3d.ts) con 4 topologías; panel con 4 filas por modo
 * (INFRA_ROWS_7MH, siempre visibles); hotspots HTML con copys literales;
 * «Ver recorrido de una tarea» + pausa; ruta alternativa en red distribuida;
 * vínculo a E22 en Housing; SVG como detalle opcional; persistencia en
 * state.infra (ids canónicos). Sin telemetría falsa.
 */
import { COPY_7MF } from '../../data/copy7mf';
import { INFRA_ROWS_7MH, INFRA_STAGE_7MH } from '../../data/copy7mh';
import { getState, setInfraPreference, type InfraPreference } from './state';
import { track } from './events';
import { createInfraStage, type Infra3DHandle, type InfraModeId } from './infra3d';

const modes = COPY_7MF.infra.modes;
const byId = new Map(modes.map((m) => [m.id as InfraPreference, m]));
const waBase = `https://wa.me/${COPY_7MF.contact.number}?text=`;
const reduced = typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches;

export function bindInfra(_universe?: unknown): void {
  document.querySelectorAll<HTMLElement>('[data-infra7]').forEach((wrap) => {
    const buttons = [...wrap.querySelectorAll<HTMLButtonElement>('[data-infra7-mode]')];
    const canvas = wrap.querySelector<HTMLCanvasElement>('[data-infra7-canvas]');
    const hotspotBox = wrap.querySelector<HTMLElement>('[data-infra7-hotspots]');
    const tagBox = wrap.querySelector<HTMLElement>('[data-infra7-tags]');
    const tip = wrap.querySelector<HTMLElement>('[data-infra7-tip]');
    const runBtn = wrap.querySelector<HTMLButtonElement>('[data-infra7-run]');
    const pauseBtn = wrap.querySelector<HTMLButtonElement>('[data-infra7-pause]');
    const altBtn = wrap.querySelector<HTMLButtonElement>('[data-infra7-altroute]');
    const elTitle = wrap.querySelector<HTMLElement>('[data-infra7-title]');
    const elBody = wrap.querySelector<HTMLElement>('[data-infra7-body]');
    const rowsBox = wrap.querySelector<HTMLElement>('[data-infra7-rows]');
    const compareLink = wrap.querySelector<HTMLElement>('[data-infra7-compare]');
    const elCta = wrap.querySelector<HTMLAnchorElement>('[data-infra7-cta]');
    const svgs = new Map<string, HTMLElement>();
    wrap.querySelectorAll<HTMLElement>('[data-infra7-svg]').forEach((el) => {
      const id = el.dataset['infra7Svg'];
      if (id) svgs.set(id, el);
    });

    let stage: Infra3DHandle | null = null;
    if (canvas) {
      try {
        stage = createInfraStage(canvas);
      } catch {
        stage = null; // sin WebGL: el panel y controles HTML siguen operando
      }
    }

    const apply = (id: InfraPreference, persist: boolean): void => {
      const mode = byId.get(id);
      if (!mode) return;
      buttons.forEach((b) => b.setAttribute('aria-pressed', b.dataset['infra7Mode'] === id ? 'true' : 'false'));
      svgs.forEach((el, key) => { el.hidden = key !== id; });
      stage?.setMode(id as InfraModeId, { instant: reduced });
      if (altBtn) altBtn.hidden = id !== 'distributed-network';
      if (altBtn) { altBtn.setAttribute('aria-pressed', 'false'); altBtn.textContent = INFRA_STAGE_7MH.altRoute; }
      if (compareLink) compareLink.hidden = id !== 'managed-housing'; // 7M-H §7: vínculo a E22 en Housing
      if (elTitle) elTitle.textContent = mode.title;
      if (elBody) elBody.textContent = mode.body;
      if (rowsBox) {
        const rows = INFRA_ROWS_7MH[id] ?? [];
        rowsBox.innerHTML = rows
          .map((r) => `<div class="infra7__row"><dt>${r.label}</dt><dd>${r.text}</dd></div>`)
          .join('');
      }
      if (elCta) {
        elCta.href = `${waBase}${encodeURIComponent(COPY_7MF.contact.infraMessage.replace('{label}', mode.label))}`;
      }
      if (persist) {
        setInfraPreference(id);
        track('scene_viewed', { scene: 'E03', mode: id });
      }
    };

    buttons.forEach((b) => {
      b.addEventListener('click', () => {
        const id = b.dataset['infra7Mode'] as InfraPreference | undefined;
        if (id && byId.has(id)) apply(id, true);
      });
    });

    runBtn?.addEventListener('click', () => stage?.runTask());
    pauseBtn?.addEventListener('click', () => {
      const p = pauseBtn.getAttribute('aria-pressed') !== 'true';
      pauseBtn.setAttribute('aria-pressed', String(p));
      pauseBtn.textContent = p ? INFRA_STAGE_7MH.resume : INFRA_STAGE_7MH.pause;
      stage?.setPaused(p);
    });
    altBtn?.addEventListener('click', () => {
      const on = stage?.toggleAltRoute() ?? false;
      altBtn.setAttribute('aria-pressed', String(on));
      altBtn.textContent = on ? INFRA_STAGE_7MH.altRouteOn : INFRA_STAGE_7MH.altRoute;
    });

    // hotspots proyectados desde el stage 3D
    stage?.onFrame(({ hotspots, tags }) => {
      if (!hotspotBox || !tagBox) return;
      const stageRect = wrap.querySelector('[data-infra7-stage]')?.getBoundingClientRect();
      if (!stageRect) return;
      hotspotBox.innerHTML = '';
      hotspots.forEach((h) => {
        const b = document.createElement('button');
        b.type = 'button';
        b.className = 'infra7__hotspot';
        b.style.left = `${h.x - stageRect.left}px`;
        b.style.top = `${h.y - stageRect.top}px`;
        b.setAttribute('aria-label', h.text);
        b.title = h.text;
        b.addEventListener('click', () => { if (tip) tip.textContent = h.text; });
        b.addEventListener('focus', () => { if (tip) tip.textContent = h.text; });
        hotspotBox.appendChild(b);
      });
      tagBox.innerHTML = '';
      tags.forEach((t) => {
        const s = document.createElement('span');
        s.className = 'infra7__tag';
        s.style.left = `${t.x - stageRect.left}px`;
        s.style.top = `${t.y - stageRect.top}px`;
        s.textContent = t.text;
        tagBox.appendChild(s);
      });
    });

    // estado persistido (ya migrado por state.ts); default local-private
    const saved = getState().infra ?? 'local-private';
    apply(saved, false);

    window.addEventListener('pagehide', () => stage?.dispose());
  });
}
