/**
 * Personas + IA (Bloque C): máquina de estados caso × etapa 0..3 con
 * ejecutar / pausar / paso a paso / reiniciar. Etapa 1 = IA, etapa 2 = humana.
 */
import { PERSONAS_CASES, type PersonasCase } from '../../data/personas';
import { track } from './events';

export function bindPersonas(): void {
  const wrap = document.querySelector<HTMLElement>('[data-demo="personas"]');
  if (!wrap) return;
  const caseBtns = [...wrap.querySelectorAll<HTMLButtonElement>('[data-pers-case]')];
  const runBtn = wrap.querySelector<HTMLButtonElement>('[data-pers-run]');
  const runText = wrap.querySelector('[data-pers-run-text]');
  const pauseBtn = wrap.querySelector<HTMLButtonElement>('[data-pers-pause]');
  const stepBtn = wrap.querySelector<HTMLButtonElement>('[data-pers-step]');
  const resetBtn = wrap.querySelector<HTMLButtonElement>('[data-pers-reset]');
  const visual = wrap.querySelector<HTMLElement>('.pers__visual');
  const elSourceTitle = wrap.querySelector('[data-pers-source-title]');
  const elSourceMsg = wrap.querySelector('[data-pers-source-msg]');
  const elAgentRole = wrap.querySelector('[data-pers-agent-role]');
  const elHumanName = wrap.querySelector('[data-pers-human-name]');
  const elHumanRole = wrap.querySelector('[data-pers-human-role]');
  const elIndicator = wrap.querySelector('[data-pers-indicator]');
  const elWork = wrap.querySelector('[data-pers-work-status]');
  const elKind = wrap.querySelector('[data-pers-kind]');
  const elOutTitle = wrap.querySelector('[data-pers-out-title]');
  const elOutText = wrap.querySelector('[data-pers-out-text]');
  const stepEls = [...wrap.querySelectorAll<HTMLElement>('[data-pers-step]')];
  const aiEl = wrap.querySelector<HTMLElement>('[data-pers-ai]');
  const humanEl = wrap.querySelector<HTMLElement>('[data-pers-human]');
  const sourceEl = wrap.querySelector<HTMLElement>('[data-pers-source]');
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const DELAY = reduced ? 120 : 1250;

  let current: PersonasCase = PERSONAS_CASES[0]!;
  let stage = 0;
  let running = false;
  let timers: number[] = [];

  const clearTimers = (): void => {
    timers.forEach(window.clearTimeout);
    timers = [];
  };

  const setStage = (i: number): void => {
    stage = Math.max(0, Math.min(3, i));
    const c = current;
    stepEls.forEach((el, j) => {
      el.classList.toggle('is-active', j === stage);
      el.classList.toggle('is-done', j < stage);
    });
    const step = c.steps[stage];
    if (elOutTitle && step) elOutTitle.textContent = step[0];
    if (elOutText && step) elOutText.textContent = step[1];
    if (elWork) elWork.textContent = c.workStatus[stage] ?? '';
    if (elIndicator) elIndicator.innerHTML = `<i></i> ${c.humanIndicator[stage] ?? 'DISPONIBLE'}`;
    sourceEl?.classList.toggle('pulse', stage === 0);
    aiEl?.classList.toggle('is-running', stage === 1);
    humanEl?.classList.toggle('is-active', stage === 2);
  };

  const stop = (label: string): void => {
    clearTimers();
    running = false;
    visual?.classList.remove('is-running');
    if (runBtn) runBtn.disabled = false;
    if (runText) runText.textContent = label;
    if (pauseBtn) pauseBtn.disabled = true;
  };

  const run = (): void => {
    const resuming = runText?.textContent?.includes('Reanudar') === true && stage < 3;
    if (resuming) {
      clearTimers();
      running = true;
      visual?.classList.add('is-running');
      if (runBtn) runBtn.disabled = true;
      if (pauseBtn) pauseBtn.disabled = false;
      if (runText) runText.textContent = '● Simulando…';
      for (let i = stage + 1; i <= 3; i++) timers.push(window.setTimeout(() => setStage(i), (i - stage) * DELAY));
      timers.push(window.setTimeout(() => {
        running = false;
        visual?.classList.remove('is-running');
        if (runBtn) runBtn.disabled = false;
        if (runText) runText.textContent = '↻ Repetir demostración';
        if (pauseBtn) pauseBtn.disabled = true;
      }, (4 - stage) * DELAY + 50));
      return;
    }
    stop('● Simulando…');
    running = true;
    visual?.classList.add('is-running');
    if (runBtn) runBtn.disabled = true;
    if (pauseBtn) pauseBtn.disabled = false;
    if (runText) runText.textContent = '● Simulando…';
    setStage(0);
    for (let i = 1; i <= 3; i++) {
      timers.push(window.setTimeout(() => setStage(i), i * DELAY));
    }
    timers.push(
      window.setTimeout(() => {
        running = false;
        visual?.classList.remove('is-running');
        if (runBtn) runBtn.disabled = false;
        if (runText) runText.textContent = '↻ Repetir demostración';
        if (pauseBtn) pauseBtn.disabled = true;
      }, 4 * DELAY + 50),
    );
    track('personas_demo', { caso: current.id, modo: 'auto' });
  };

  const updateCase = (id: string): void => {
    const c = PERSONAS_CASES.find((x) => x.id === id);
    if (!c) return;
    current = c;
    stop('▶ Repetir demostración');
    caseBtns.forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.persCase === id)));
    if (elSourceTitle) elSourceTitle.textContent = c.source;
    if (elSourceMsg) elSourceMsg.textContent = c.message;
    if (elAgentRole) elAgentRole.textContent = c.agent;
    if (elHumanName) elHumanName.textContent = c.human;
    if (elHumanRole) elHumanRole.textContent = c.role;
    if (elKind) elKind.textContent = c.kind;
    stepEls.forEach((el, j) => {
      const s = c.steps[j];
      const span = el.querySelector('span');
      if (span && s) span.textContent = s[0].replace(/^[^\s]+\s/, '');
    });
    setStage(0);
    if (elOutTitle) elOutTitle.textContent = `🟡 ${c.steps[0]?.[0] ?? ''}`;
    if (elOutText) elOutText.textContent = 'Elige «Ver cómo colaboran» o «Paso a paso».';
  };

  caseBtns.forEach((b) => b.addEventListener('click', () => updateCase(b.dataset.persCase ?? 'cliente')));
  runBtn?.addEventListener('click', run);
  pauseBtn?.addEventListener('click', () => {
    if (!running) return;
    stop('▶ Reanudar demostración');
    track('personas_demo', { caso: current.id, modo: 'pausa', etapa: stage });
  });
  stepBtn?.addEventListener('click', () => {
    stop('▶ Repetir demostración');
    if (stage >= 3) { updateCase(current.id); return; }
    setStage(stage + 1);
    track('personas_demo', { caso: current.id, modo: 'paso', etapa: stage });
  });
  resetBtn?.addEventListener('click', () => updateCase(current.id));
  updateCase('cliente');
}
