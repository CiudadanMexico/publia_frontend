/**
 * Simulador del umbral (7M-F §6). Fórmulas y textos literales de
 * copy.es-MX.json (`simulator`): los porcentajes son supuestos del visitante.
 *   total = tasks * minutes / 60
 *   addressable = total * (fraction/100) * (adoption/100)
 * Sin división por cero: entradas inválidas muestran error y no actualizan cifras.
 */
import { COPY_7MF } from '../../data/copy7mf';

const sim = COPY_7MF.simulator;
const fmt = new Intl.NumberFormat('es-MX', { maximumFractionDigits: 1 });

type Key = 'tasks' | 'minutes' | 'fraction' | 'adoption';
const KEYS: Key[] = ['tasks', 'minutes', 'fraction', 'adoption'];

function readLimits(key: Key): { min: number; max: number } {
  const [min, max] = sim.limits[key];
  return { min: min ?? 0, max: max ?? 100 };
}

export function bindSimulator(): void {
  const root = document.querySelector<HTMLElement>('[data-simulator]');
  if (!root) return;

  const inputs = new Map<Key, HTMLInputElement>();
  const ranges = new Map<Key, HTMLInputElement>();
  KEYS.forEach((k) => {
    const input = root.querySelector<HTMLInputElement>(`[data-sim-input="${k}"]`);
    const range = root.querySelector<HTMLInputElement>(`[data-sim-range="${k}"]`);
    if (input) inputs.set(k, input);
    if (range) ranges.set(k, range);
  });
  const elTotal = root.querySelector<HTMLElement>('[data-sim-result="total"]');
  const elAddr = root.querySelector<HTMLElement>('[data-sim-result="addressable"]');
  const elError = root.querySelector<HTMLElement>('[data-sim-error]');
  const elLive = root.querySelector<HTMLElement>('[data-sim-live]');
  const resetBtn = root.querySelector<HTMLButtonElement>('[data-sim-reset]');

  let liveTimer: number | undefined;

  const announce = (message: string): void => {
    // debounce 300ms: un anuncio por racha de cambios, no cascada de lecturas
    window.clearTimeout(liveTimer);
    liveTimer = window.setTimeout(() => {
      if (elLive) elLive.textContent = message;
    }, 300);
  };

  const compute = (): { total: number; addressable: number } | null => {
    const values: Record<Key, number> = { tasks: 0, minutes: 0, fraction: 0, adoption: 0 };
    for (const k of KEYS) {
      const raw = inputs.get(k)?.value ?? '';
      const n = Number(raw);
      const { min, max } = readLimits(k);
      if (raw.trim() === '' || Number.isNaN(n) || n < min || n > max) return null;
      values[k] = n;
    }
    const total = (values.tasks * values.minutes) / 60;
    const addressable = total * (values.fraction / 100) * (values.adoption / 100);
    return { total, addressable };
  };

  const render = (): void => {
    const result = compute();
    if (elError) elError.hidden = result !== null;
    if (!result) return; // sin cifra hasta corregir
    if (elTotal) elTotal.textContent = `${fmt.format(result.total)} h`;
    if (elAddr) elAddr.textContent = `${fmt.format(result.addressable)} h`;
    announce(`${sim.result}: ${fmt.format(result.addressable)} h. ${sim.baseline}: ${fmt.format(result.total)} h.`);
  };

  const sync = (key: Key, source: HTMLInputElement): void => {
    const range = ranges.get(key);
    const input = inputs.get(key);
    if (range && source !== range) range.value = source.value;
    if (input && source !== input) input.value = source.value;
    render();
  };

  inputs.forEach((input, k) => input.addEventListener('input', () => sync(k, input)));
  ranges.forEach((range, k) => range.addEventListener('input', () => sync(k, range)));

  resetBtn?.addEventListener('click', () => {
    KEYS.forEach((k) => {
      const v = sim.defaults[k];
      const input = inputs.get(k);
      const range = ranges.get(k);
      if (input) input.value = String(v);
      if (range) range.value = String(v);
    });
    render();
  });

  render();
}
