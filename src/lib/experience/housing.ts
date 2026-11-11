/**
 * A08 Housing (E22): comparación compartido/privado portada del paquete zip.
 * - Selección de modalidad persiste en state.housingMode (campo nuevo, distinto
 *   de `infra`) y se restaura al recargar SIN reescribir decisiones previas.
 * - Demo de tráfico con play/pausa/restablecer; eventos housing_demo{action}.
 * - Copiar resumen usa el mismo bloque de cierre (buildSummary) + detalle Housing.
 * - Nada de precios confirmados.
 */
import { HOUSING_PLANS, HOUSING_DISCLAIMER, type HousingMode } from '../../data/housing';
import { setHousingMode, getState } from './state';
import { COPY_7MF } from '../../data/copy7mf';
import { track } from './events';
import { buildSummary } from './cierre';

export function bindHousing(): void {
  const root = document.querySelector<HTMLElement>('[data-demo="housing"]');
  if (!root || root.dataset.bound === '1') return;
  const stage = root.querySelector<HTMLElement>('[data-housing-stage]');
  const modes = [...root.querySelectorAll<HTMLButtonElement>('[data-housing-mode]')];
  const elTitle = root.querySelector('[data-housing-title]');
  const elDesc = root.querySelector('[data-housing-desc]');
  const elSegs = root.querySelector('[data-housing-segments]');
  const elLegend = root.querySelector('[data-housing-legend]');
  const elNote = root.querySelector('[data-housing-note]');
  const elStatus = root.querySelector<HTMLElement>('[data-housing-status]');
  const playBtn = root.querySelector<HTMLButtonElement>('[data-housing-play]');
  const pauseBtn = root.querySelector<HTMLButtonElement>('[data-housing-pause]');
  const resetBtn = root.querySelector<HTMLButtonElement>('[data-housing-reset]');
  const copyBtn = root.querySelector<HTMLButtonElement>('[data-housing-copy]');
  const hardware = root.querySelector<HTMLElement>('[data-housing-hardware]');
  const racks = [...root.querySelectorAll<HTMLButtonElement>('[data-housing-rack]')];
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  let mode: HousingMode = 'compartido';
  let playing = false;
  let paused = false;
  let demoTimer = 0;
  let demoRemain = 4000;
  let demoStart = 0;
  let orbit = 0;

  const announce = (msg: string): void => {
    if (elStatus) elStatus.textContent = msg;
  };

  /** Render visual de la modalidad; persist=false en la restauración inicial. */
  const render = (id: HousingMode, persist: boolean): void => {
    mode = id;
    const plan = HOUSING_PLANS[id];
    if (stage) {
      stage.dataset.mode = id;
      stage.dataset.demoState = playing && !paused ? 'on' : 'off';
    }
    modes.forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.housingMode === id)));
    if (elTitle) elTitle.textContent = id === 'compartido' ? COPY_7MF.housing.sharedTitle : COPY_7MF.housing.privateTitle;
    if (elDesc) elDesc.textContent = id === 'compartido' ? COPY_7MF.housing.sharedBody : COPY_7MF.housing.privateBody;
    if (elNote) elNote.textContent = COPY_7MF.housing.note;
    // §9: el CTA añade las etiquetas de housing.fields sólo si el visitante eligió modalidad
    const cta = root.querySelector<HTMLAnchorElement>('[data-housing-cta]');
    if (cta) {
      const base = COPY_7MF.contact.housingMessage;
      const extra = id ? '\n' + COPY_7MF.housing.fields.join('\n') : '';
      cta.href = `https://wa.me/${COPY_7MF.contact.number}?text=${encodeURIComponent(base + extra)}`;
    }
    if (elSegs) {
      elSegs.replaceChildren(
        ...plan.distribution.map((d) => {
          const s = document.createElement('span');
          s.className = `housing__seg housing__seg--${d.tone}`;
          s.style.width = `${d.porcentaje}%`;
          return s;
        }),
      );
    }
    if (elLegend) {
      elLegend.replaceChildren(
        ...plan.distribution.map((d) => {
          const row = document.createElement('div');
          row.className = 'housing__legend-row';
          const span = document.createElement('span');
          const dot = document.createElement('i');
          dot.className = `housing__dot housing__dot--${d.tone}`;
          span.append(dot, d.actor);
          const b = document.createElement('b');
          b.textContent = `${d.porcentaje}%`;
          row.append(span, b);
          return row;
        }),
      );
    }
    if (persist) {
      setHousingMode(id);
      track('housing_mode_selected', { mode: id });
      announce(id === 'privado' ? plan.statusPrivate : plan.statusShared);
    }
  };

  const stopDemo = (): void => {
    window.clearTimeout(demoTimer);
    demoRemain = 4000;
    playing = false;
    paused = false;
    if (stage) stage.dataset.demoState = 'off';
    if (playBtn) playBtn.textContent = '▶ Simular tráfico';
    if (pauseBtn) {
      pauseBtn.textContent = 'Ⅱ Pausar';
      pauseBtn.disabled = true;
    }
  };

  const finishDemo = (): void => {
    stopDemo();
    announce(HOUSING_PLANS[mode].demoDone);
    track('housing_demo', { mode, action: 'complete' });
  };

  const armDemo = (): void => {
    demoStart = Date.now();
    demoTimer = window.setTimeout(finishDemo, demoRemain);
  };

  modes.forEach((b) =>
    b.addEventListener('click', () => {
      stopDemo();
      render((b.dataset.housingMode as HousingMode) ?? 'compartido', true);
    }),
  );

  playBtn?.addEventListener('click', () => {
    stopDemo();
    playing = true;
    if (stage) stage.dataset.demoState = 'on';
    if (playBtn) playBtn.textContent = '↻ Repetir flujo';
    if (pauseBtn) pauseBtn.disabled = false;
    announce(HOUSING_PLANS[mode].demoStatus);
    track('housing_demo', { mode, action: 'start' });
    armDemo();
  });

  pauseBtn?.addEventListener('click', () => {
    if (!playing) return;
    paused = !paused;
    if (paused) {
      demoRemain = Math.max(0, demoRemain - (Date.now() - demoStart));
      window.clearTimeout(demoTimer);
    } else {
      armDemo();
    }
    if (stage) stage.dataset.demoState = paused ? 'off' : 'on';
    if (pauseBtn) pauseBtn.textContent = paused ? '▶ Reanudar' : 'Ⅱ Pausar';
    announce(paused ? HOUSING_PLANS[mode].demoPaused : HOUSING_PLANS[mode].demoResumed);
    track('housing_demo', { mode, action: paused ? 'pause' : 'resume' });
  });

  resetBtn?.addEventListener('click', () => {
    stopDemo();
    orbit = 0;
    if (hardware) hardware.style.setProperty('--orbit', '0deg');
    // Restablecer vuelve al default visual SIN borrar la elección persistida:
    // si el visitante ya eligió, se restaura esa; si no, compartido visual.
    const saved = getState().housingMode;
    render(saved ?? 'compartido', false);
    announce('↺ Restablecido.');
    track('housing_demo', { mode, action: 'reset' });
  });

  copyBtn?.addEventListener('click', async () => {
    const plan = HOUSING_PLANS[mode];
    const text = [
      buildSummary(),
      '',
      `Housing (modalidad ${mode}): ${plan.title}`,
      ...plan.distribution.map((d) => `- ${d.actor}: ${d.porcentaje}%`),
      plan.note,
      HOUSING_DISCLAIMER,
    ].join('\n');
    try {
      await navigator.clipboard.writeText(text);
      announce('✓ Resumen copiado al portapapeles.');
    } catch {
      const blob = new Blob([text], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'publia-housing.txt';
      a.click();
      URL.revokeObjectURL(url);
      announce('✓ Resumen guardado en TXT.');
    }
    track('housing_demo', { mode, action: 'copy' });
  });

  racks.forEach((r) =>
    r.addEventListener('click', () => {
      const n = Number(r.dataset.housingRack ?? 0) + 1;
      announce(mode === 'privado' ? HOUSING_PLANS.privado.rackToastPrivate : HOUSING_PLANS.compartido.rackToastShared(n));
    }),
  );

  // Drag orbital del hardware (teclado no aplica; los racks son botones nativos)
  let dragging = false;
  let point = 0;
  hardware?.addEventListener('pointerdown', (e) => {
    if ((e.target as HTMLElement).closest('button')) return;
    dragging = true;
    point = e.clientX;
    hardware.setPointerCapture(e.pointerId);
  });
  hardware?.addEventListener('pointermove', (e) => {
    if (!dragging) return;
    orbit = Math.max(-21, Math.min(21, orbit + (e.clientX - point) * 0.15));
    point = e.clientX;
    hardware.style.setProperty('--orbit', `${orbit.toFixed(2)}deg`);
  });
  hardware?.addEventListener('pointerup', () => (dragging = false));
  hardware?.addEventListener('pointercancel', () => (dragging = false));

  if (reduced) {
    // Sin animaciones: estado estático coherente
    const saved = getState().housingMode;
    render(saved ?? 'compartido', false);
  } else {
    // Restaurar modalidad previa si existe; si no, default visual sin persistir
    const saved = getState().housingMode;
    render(saved ?? 'compartido', false);
  }
  root.dataset.bound = '1';
}
