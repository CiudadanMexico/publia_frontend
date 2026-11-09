/**
 * A06 Marketing (E26): demostraciones seleccionables con pasos animados.
 * Pensado paraIntegrar recursos A06 sin tocar el binder: los `art` viven en
 * public/assets/a06/ y se pintan desde el componente vía data/marketing.ts.
 */
import { MARKETING_DEMOS } from '../../data/marketing';
import { track } from './events';

export function bindMarketing(): void {
  const root = document.querySelector<HTMLElement>('[data-demo="marketing"]');
  if (!root || root.dataset.bound === '1') return;
  const chips = [...root.querySelectorAll<HTMLButtonElement>('[data-mkt-demo]')];
  const stepsEl = root.querySelector<HTMLElement>('[data-mkt-steps]');
  const resultEl = root.querySelector<HTMLElement>('[data-mkt-result]');
  const runBtn = root.querySelector<HTMLButtonElement>('[data-mkt-run]');
  const resetBtn = root.querySelector<HTMLButtonElement>('[data-mkt-reset]');
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  let demoIndex = 0;
  let timers: number[] = [];

  const renderSteps = (): void => {
    const d = MARKETING_DEMOS[demoIndex];
    if (!d || !stepsEl) return;
    stepsEl.replaceChildren(...d.steps.map((s) => {
      const li = document.createElement('li');
      li.textContent = s;
      return li;
    }));
    if (resultEl) resultEl.textContent = '';
  };

  const stop = (): void => {
    timers.forEach(window.clearTimeout);
    timers = [];
    if (runBtn) runBtn.disabled = false;
  };

  const run = (): void => {
    stop();
    const d = MARKETING_DEMOS[demoIndex];
    if (!d || !stepsEl || !resultEl) return;
    if (runBtn) runBtn.disabled = true;
    const lis = [...stepsEl.querySelectorAll('li')];
    const delay = reduced ? 90 : 800;
    lis.forEach((li, i) => {
      timers.push(window.setTimeout(() => {
        lis.forEach((x) => x.classList.remove('is-on'));
        li.classList.add('is-on');
        resultEl.textContent = `${i + 1}/${lis.length} · ${d.steps[i] ?? ''}`;
      }, i * delay));
    });
    timers.push(window.setTimeout(() => {
      if (resultEl) resultEl.textContent = d.result;
      stop();
      track('marketing_demo_run', { demo: d.id });
    }, lis.length * delay + (reduced ? 60 : 500)));
    track('marketing_demo_start', { demo: d.id });
  };

  chips.forEach((c, i) =>
    c.addEventListener('click', () => {
      stop();
      demoIndex = i;
      chips.forEach((x) => x.setAttribute('aria-pressed', String(x === c)));
      renderSteps();
      track('marketing_demo_selected', { demo: MARKETING_DEMOS[i]?.id ?? '' });
    }),
  );
  runBtn?.addEventListener('click', run);
  resetBtn?.addEventListener('click', () => {
    stop();
    renderSteps();
    if (resultEl) resultEl.textContent = '↺ Demo reiniciada.';
  });

  renderSteps();
  root.dataset.bound = '1';
}
