/**
 * Simulador del umbral — 7M-H §5. Presets editables + escenario propio.
 *   baseline   = tareas × minutos ÷ 60
 *   potencial  = baseline × fracción/100 × implementación/100
 *   restante   = baseline − potencial
 * Preset WhatsApp default (80×6, 60%, 70%) → 8 h / 3.36 h / 4.64 h.
 * Muestra 1 decimal sin redondear antes de calcular; la barra apilada
 * representa el mismo total (restante oscuro + potencial rojo/coral).
 * Textos literales: src/data/copy7mh.ts (SIM_7MH).
 */
import { SIM_7MH } from '../../data/copy7mh';
import { COPY_7MF } from '../../data/copy7mf';

const sim = SIM_7MH;
const fmt = new Intl.NumberFormat('es-MX', { maximumFractionDigits: 1 });
const WA_NUMBER = COPY_7MF.contact.number.replace(/\D/g, '');

type Key = 'tasks' | 'minutes' | 'fraction' | 'adoption';
const KEYS: Key[] = ['tasks', 'minutes', 'fraction', 'adoption'];

export function bindSimulator(): void {
  const root = document.querySelector<HTMLElement>('[data-simulator]');
  if (!root) return;

  const inputs = new Map<Key, HTMLInputElement>();
  KEYS.forEach((k) => {
    const input = root.querySelector<HTMLInputElement>(`[data-sim-input="${k}"]`);
    if (input) inputs.set(k, input);
  });
  const presetSel = root.querySelector<HTMLSelectElement>('[data-sim-preset]');
  const badge = root.querySelector<HTMLElement>('[data-sim-badge]');
  const elTotal = root.querySelector<HTMLElement>('[data-sim-result="total"]');
  const elPot = root.querySelector<HTMLElement>('[data-sim-result="potential"]');
  const elRem = root.querySelector<HTMLElement>('[data-sim-result="remaining"]');
  const barRem = root.querySelector<HTMLElement>('[data-sim-bar="remaining"]');
  const barPot = root.querySelector<HTMLElement>('[data-sim-bar="potential"]');
  const elError = root.querySelector<HTMLElement>('[data-sim-error]');
  const elLive = root.querySelector<HTMLElement>('[data-sim-live]');
  const cta = root.querySelector<HTMLAnchorElement>('[data-sim-cta]');

  let liveTimer: number | undefined;
  const announce = (message: string): void => {
    window.clearTimeout(liveTimer);
    liveTimer = window.setTimeout(() => {
      if (elLive) elLive.textContent = message;
    }, 300);
  };

  const readValues = (): Record<Key, number> | null => {
    const values: Record<Key, number> = { tasks: 0, minutes: 0, fraction: 0, adoption: 0 };
    for (const k of KEYS) {
      const raw = inputs.get(k)?.value ?? '';
      const n = Number(raw);
      const lim = sim.limits[k];
      const min = lim[0] ?? 0;
      const max = lim[1] ?? 100;
      if (raw.trim() === '' || Number.isNaN(n) || n < min || n > max) return null;
      values[k] = n;
    }
    return values;
  };

  const compute = (): { total: number; potential: number; remaining: number; label: string } | null => {
    const v = readValues();
    if (!v) return null;
    const total = (v.tasks * v.minutes) / 60;
    const potential = total * (v.fraction / 100) * (v.adoption / 100);
    const remaining = total - potential;
    const label = presetSel?.value === 'custom' || !presetSel
      ? sim.customPresetLabel
      : (sim.presets.find((p) => p.id === presetSel.value)?.label ?? sim.customPresetLabel);
    return { total, potential, remaining, label };
  };

  const render = (): void => {
    const r = compute();
    if (elError) elError.hidden = r !== null;
    if (!r) return; // entradas inválidas: no actualizar cifras
    if (elTotal) elTotal.textContent = `${fmt.format(r.total)} ${sim.units}`;
    if (elPot) elPot.textContent = `${fmt.format(r.potential)} ${sim.units}`;
    if (elRem) elRem.textContent = `${fmt.format(r.remaining)} ${sim.units}`;
    // barra apilada del mismo total; sin división por cero (total 0 → 0/0)
    const potPct = r.total > 0 ? Math.min(100, (r.potential / r.total) * 100) : 0;
    if (barPot) barPot.style.width = `${potPct}%`;
    if (barRem) barRem.style.width = `${100 - potPct}%`;
    if (cta) {
      const msg = `${sim.cta} — Categoría: ${r.label}. Tiempo actual: ${fmt.format(r.total)} h/semana; potencialmente liberado: ${fmt.format(r.potential)} h; restante: ${fmt.format(r.remaining)} h.`;
      cta.href = `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(msg)}`;
    }
    announce(`${sim.results.total}: ${fmt.format(r.total)} h. ${sim.results.potential}: ${fmt.format(r.potential)} h. ${sim.results.remaining}: ${fmt.format(r.remaining)} h.`);
  };

  const markCustom = (): void => {
    if (presetSel && presetSel.value !== 'custom') {
      presetSel.value = 'custom';
    }
    if (badge) badge.textContent = sim.customPresetLabel;
  };

  inputs.forEach((input, k) => input.addEventListener('input', () => { markCustom(); render(); }));

  presetSel?.addEventListener('change', () => {
    const p = sim.presets.find((pr) => pr.id === presetSel.value);
    if (p) {
      inputs.get('tasks') && (inputs.get('tasks')!.value = String(p.tasks));
      inputs.get('minutes') && (inputs.get('minutes')!.value = String(p.minutes));
      inputs.get('fraction') && (inputs.get('fraction')!.value = String(p.fraction));
      inputs.get('adoption') && (inputs.get('adoption')!.value = String(p.adoption));
      if (badge) badge.textContent = sim.editableBadge;
    } else if (badge) {
      badge.textContent = sim.customPresetLabel;
    }
    render();
  });

  render();
}
