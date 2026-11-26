/**
 * E22 binder — 7M-H §8. Modelo determinista (housingModel.ts); dos salidas
 * (compartido 50 / privado 100) siempre visibles y consistentes; selector de
 * modalidad destaca columna y stage SIN cambiar inputs; secuencia de 6 s con
 * pausa/restablecer (reduced-motion: resultado inmediato); sin métricas
 * vacías ni tráfico decorativo; persistencia en state.housingMode; CTA WhatsApp
 * con prefijo «Escenario ilustrativo que quiero dimensionar» + modalidad y
 * cantidades. Ninguna interacción dispara llamadas ni mensajes externos.
 */
import { COPY_7MF } from '../../data/copy7mf';
import { E22_7MH } from '../../data/copy7mh';
import { getState, setHousingMode, type HousingMode } from './state';
import { track } from './events';
import {
  TASK_TYPES,
  assignShared,
  assignPrivate,
  type TaskType,
  type AssignmentResult,
} from './housingModel';

const waBase = `https://wa.me/${COPY_7MF.contact.number}?text=`;
const reduced = typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches;

export function bindHousing(): void {
  const wrap = document.querySelector<HTMLElement>('[data-housing]');
  if (!wrap) return;

  const qtyInputs = new Map<string, HTMLInputElement>();
  const costInputs = new Map<string, HTMLInputElement>();
  wrap.querySelectorAll<HTMLInputElement>('[data-housing-qty]').forEach((el) => {
    const id = el.dataset['housingQty'];
    if (id) qtyInputs.set(id, el);
  });
  wrap.querySelectorAll<HTMLInputElement>('[data-housing-cost]').forEach((el) => {
    const id = el.dataset['housingCost'];
    if (id) costInputs.set(id, el);
  });
  const demandEl = wrap.querySelector<HTMLElement>('[data-housing-demand]');
  const statusEl = wrap.querySelector<HTMLElement>('[data-housing-status]');
  const runBtn = wrap.querySelector<HTMLButtonElement>('[data-housing-run]');
  const pauseBtn = wrap.querySelector<HTMLButtonElement>('[data-housing-pause]');
  const resetBtn = wrap.querySelector<HTMLButtonElement>('[data-housing-reset]');
  const cta = wrap.querySelector<HTMLAnchorElement>('[data-housing-cta]');
  const stage = wrap.querySelector<HTMLElement>('[data-housing-stage]');
  const modeBtns = [...wrap.querySelectorAll<HTMLButtonElement>('[data-housing-mode]')];
  const cols = {
    compartido: wrap.querySelector<HTMLElement>('[data-housing-col="compartido"]'),
    privado: wrap.querySelector<HTMLElement>('[data-housing-col="privado"]'),
  };
  const rackFoots = new Map<string, HTMLElement>();
  wrap.querySelectorAll<HTMLElement>('[data-hrack-foot]').forEach((el) => {
    const id = el.dataset['hrackFoot'];
    if (id) rackFoots.set(id, el);
  });
  const slotEls = [...wrap.querySelectorAll<HTMLElement>('[data-hslot]')];
  slotEls.forEach((el, i) => { el.dataset['idx'] = String(i % 10); });
  const caption = wrap.querySelector<HTMLElement>('[data-housing-caption]');

  let types: TaskType[] = TASK_TYPES.map((t) => ({ ...t }));
  let mode: HousingMode = (getState().housingMode ?? 'compartido') as HousingMode;
  let seqTimer: number | undefined;
  let seqOn = false;

  const readTypes = (): TaskType[] =>
    TASK_TYPES.map((t) => {
      const q = Number(qtyInputs.get(t.id)?.value ?? t.qty);
      const c = Number(costInputs.get(t.id)?.value ?? t.cost);
      return {
        ...t,
        qty: Number.isFinite(q) ? Math.min(10, Math.max(0, Math.floor(q))) : t.qty,
        cost: Number.isFinite(c) ? Math.min(100, Math.max(1, Math.floor(c))) : t.cost,
      };
    });

  const demand = (): number => types.reduce((a, t) => a + t.qty * t.cost, 0);

  const renderColumn = (key: 'compartido' | 'privado', r: AssignmentResult): void => {
    const col = cols[key];
    if (!col) return;
    const set = (sel: string, v: string): void => {
      const el = col.querySelector<HTMLElement>(`[data-hs="${sel}"]`);
      if (el) el.textContent = v;
    };
    set('active', r.activeTasks > 0 ? `${r.activeTasks} tareas (${r.used} unidades)` : E22_7MH.empty);
    set('waiting', String(r.waitingTasks));
    set('used', `${r.used} / ${r.cap}`);
    set('available', String(r.available));
    const counts = col.querySelector<HTMLElement>('[data-hs-counts]');
    if (counts) counts.innerHTML = r.results.map((x) => `<li>${x.type.label}: ${x.active} ${E22_7MH.inProcess.toLowerCase()}, ${x.waiting} ${E22_7MH.queued.toLowerCase()}</li>`).join('');
  };

  const renderChips = (r: AssignmentResult): void => {
    types.forEach((t) => {
      const box = wrap.querySelector<HTMLElement>(`[data-hchips="${t.id}"]`);
      if (!box) return;
      const res = r.results.find((x) => x.type.id === t.id);
      box.innerHTML = '';
      for (let i = 0; i < t.qty; i++) {
        const chip = document.createElement('span');
        const active = res !== undefined && i < res.active;
        chip.className = `housing7__chip ${active ? 'housing7__chip--on' : 'housing7__chip--wait'}`;
        chip.textContent = active ? E22_7MH.inProcess : E22_7MH.queued;
        box.appendChild(chip);
      }
    });
  };

  /** 7M-I §3: los racks se pintan desde el MISMO modelo (rs/rp), sin segunda fuente. */
  const renderStage = (r?: AssignmentResult): void => {
    if (!stage) return;
    stage.dataset['mode'] = mode;
    const shared = mode === 'compartido';
    if (caption) caption.textContent = shared ? 'COMPARTIDO · 50/25/25' : 'PRIVADO · 100% TU OPERACIÓN';
    if (rackFoots.get('0')) rackFoots.get('0')!.textContent = shared ? '50 / 100' : '100 / 100';
    if (rackFoots.get('1')) rackFoots.get('1')!.textContent = shared ? '25 / 100 · RESERVADO' : '';
    if (rackFoots.get('2')) rackFoots.get('2')!.textContent = shared ? '25 / 100 · RESERVADO' : '';
    // slots del rack del cliente: 10 slots; compartido 5 unidades/slot (cap 50), privado 10 (cap 100)
    const slotUnits = shared ? 5 : 10;
    const used = r ? r.used : (shared ? assignShared(types).used : assignPrivate(types).used);
    const lit = Math.min(10, Math.round(used / slotUnits));
    slotEls.forEach((el) => {
      const rack = el.dataset['hslot'] ?? '';
      el.classList.remove('is-on', 'is-reserved');
      if (rack === '0') { if (Number(el.dataset['idx'] ?? '') < lit) el.classList.add('is-on'); }
      else if (shared) el.classList.add('is-reserved');
    });
    modeBtns.forEach((b) => b.setAttribute('aria-pressed', String(b.dataset['housingMode'] === mode)));
    cols.compartido?.setAttribute('data-active', String(shared));
    cols.privado?.setAttribute('data-active', String(!shared));
  };

  const renderAll = (): void => {
    types = readTypes();
    if (demandEl) demandEl.textContent = String(demand());
    const rs = assignShared(types);
    const rp = assignPrivate(types);
    renderColumn('compartido', rs);
    renderColumn('privado', rp);
    renderStage(mode === 'compartido' ? rs : rp);
    if (!seqOn) {
      renderChips(mode === 'compartido' ? rs : rp);
    }
    if (cta) {
      const label = mode === 'compartido' ? 'Compartido 50/25/25' : 'Privado 100%';
      const msg = `${E22_7MH.ctaPrefix} — Modalidad: ${label}. Demanda: ${demand()} unidades. Compartido: ${rs.activeTasks} activas / ${rs.waitingTasks} en espera. Privado: ${rp.activeTasks} activas / ${rp.waitingTasks} en espera.`;
      cta.href = `${waBase}${encodeURIComponent(msg)}`;
    }
  };

  const stopSeq = (): void => {
    window.clearInterval(seqTimer);
    seqTimer = undefined;
    seqOn = false;
    if (pauseBtn) { pauseBtn.disabled = true; pauseBtn.setAttribute('aria-pressed', 'false'); pauseBtn.textContent = E22_7MH.pause; }
    if (statusEl) statusEl.textContent = '';
  };

  const runSequence = (): void => {
    stopSeq();
    types = readTypes();
    const rs = assignShared(types);
    const rp = assignPrivate(types);
    if (reduced) {
      renderColumn('compartido', rs);
      renderColumn('privado', rp);
      renderChips(mode === 'compartido' ? rs : rp);
      if (statusEl) statusEl.textContent = `${rs.activeTasks}+${rp.activeTasks} tareas asignadas (resultado inmediato).`;
      return;
    }
    // secuencia de 6 s: revela la asignación calculada paso a paso
    seqOn = true;
    if (pauseBtn) { pauseBtn.disabled = false; }
    if (statusEl) statusEl.textContent = 'Repartiendo el trabajo…';
    const order = [...types].sort((a, b) => a.priority - b.priority);
    let step = 0;
    const totalSteps = order.length;
    seqTimer = window.setInterval(() => {
      step += 1;
      if (step >= totalSteps) {
        stopSeq();
        renderColumn('compartido', rs);
        renderColumn('privado', rp);
        renderChips(mode === 'compartido' ? rs : rp);
        if (statusEl) statusEl.textContent = `Reparto calculado: compartido ${rs.activeTasks} activas / ${rs.waitingTasks} en espera; privado ${rp.activeTasks} activas / ${rp.waitingTasks} en espera.`;
      } else {
        renderColumn('compartido', rs);
        renderColumn('privado', rp);
        if (statusEl) statusEl.textContent = `Asignando ${order[step]?.label ?? ''}…`;
      }
    }, 6000 / totalSteps);
  };

  qtyInputs.forEach((el) => el.addEventListener('input', () => { stopSeq(); renderAll(); }));
  costInputs.forEach((el) => el.addEventListener('input', () => { stopSeq(); renderAll(); }));

  modeBtns.forEach((b) => b.addEventListener('click', () => {
    const m = b.dataset['housingMode'] as HousingMode | undefined;
    if (!m) return;
    mode = m;
    setHousingMode(m);
    track('scene_viewed', { scene: 'E22', mode: m });
    renderStage(m === 'compartido' ? assignShared(readTypes()) : assignPrivate(readTypes()));
    const typesNow = readTypes();
    renderChips(m === 'compartido' ? assignShared(typesNow) : assignPrivate(typesNow));
    renderAll();
  }));

  runBtn?.addEventListener('click', runSequence);
  pauseBtn?.addEventListener('click', () => {
    if (!seqOn) return;
    const p = pauseBtn.getAttribute('aria-pressed') !== 'true';
    pauseBtn.setAttribute('aria-pressed', String(p));
    pauseBtn.textContent = p ? E22_7MH.resume : E22_7MH.pause;
    if (p) { window.clearInterval(seqTimer); seqTimer = undefined; if (statusEl) statusEl.textContent = 'Secuencia en pausa.'; }
    else runSequence();
  });
  resetBtn?.addEventListener('click', () => {
    stopSeq();
    types = TASK_TYPES.map((t) => ({ ...t }));
    TASK_TYPES.forEach((t) => {
      if (qtyInputs.get(t.id)) qtyInputs.get(t.id)!.value = String(t.qty);
      if (costInputs.get(t.id)) costInputs.get(t.id)!.value = String(t.cost);
    });
    renderAll();
  });

  renderAll();
}
