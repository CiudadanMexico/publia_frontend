/**
 * E11 Personas + IA — 7M-I §4. UN controlador de animación (una cadena de
 * timeouts) que recorre las 4 etapas en ciclo 0→1→2→3→0… y arranca solo al
 * entrar en viewport. Sin botones de ejecutar/pausar/paso/reiniciar: sólo los
 * 3 selectores de caso y un control discreto para detener el movimiento.
 * Al cambiar de caso se actualizan todos los textos y el ciclo continúa sin
 * acumular temporizadores. Se suspende fuera de viewport o con pestaña inactiva.
 * prefers-reduced-motion: arranque detenido (estático en etapa 1).
 */
import { PERSONAS_CASES, type PersonasCase } from '../../data/personas';
import { track } from './events';

export function bindPersonas(): void {
  const wrap = document.querySelector<HTMLElement>('[data-demo="personas"]');
  if (!wrap || wrap.dataset.bound === '1') return;
  wrap.dataset.bound = '1';

  const caseBtns = [...wrap.querySelectorAll<HTMLButtonElement>('[data-pers-case]')];
  const motionBtn = wrap.querySelector<HTMLButtonElement>('[data-pers-motion]');
  const motionText = wrap.querySelector('[data-pers-motion-text]');
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
  const stepEls = [...wrap.querySelectorAll<HTMLElement>('[data-pers-stage]')];
  const aiEl = wrap.querySelector<HTMLElement>('[data-pers-ai]');
  const humanEl = wrap.querySelector<HTMLElement>('[data-pers-human]');
  const sourceEl = wrap.querySelector<HTMLElement>('[data-pers-source]');
  const packetEls = [...wrap.querySelectorAll<SVGElement>('[data-pers-packet]')];
  const wireEls = [...wrap.querySelectorAll<SVGPathElement>('.pers__wire')];
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const DELAY = reduced ? 900 : 1400;

  let current: PersonasCase = PERSONAS_CASES[0]!;
  let stage = 0;
  let timer: number | undefined;
  let running = false;      // el ciclo está activo
  let inView = false;
  let userStopped = false;  // control discreto del visitante
  let raf = 0;

  const setStage = (i: number): void => {
    stage = ((i % 4) + 4) % 4;
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

  const setCase = (c: PersonasCase): void => {
    current = c;
    if (elSourceTitle) elSourceTitle.textContent = c.source;
    if (elSourceMsg) elSourceMsg.textContent = c.message;
    if (elAgentRole) elAgentRole.textContent = c.agent;
    if (elHumanName) elHumanName.textContent = c.human;
    if (elHumanRole) elHumanRole.textContent = c.role;
    if (elKind) elKind.textContent = c.kind;
    // los pasos del nuevo caso se repintan con el nuevo markup
    const stepsBox = wrap.querySelector('[data-pers-steps]');
    if (stepsBox) {
      stepsBox.innerHTML = c.steps.map((s, i) => `<li class="pers__step" data-pers-stage="${i}" data-index="${i}"><b>${String(i + 1).padStart(2, '0')}</b><span>${s[0].replace(/^[^\s]+\s/, '')}</span></li>`).join('');
    }
    // re-coleccionar referencias a los pasos (acabamos de reescribirlos)
    stepEls.length = 0;
    wrap.querySelectorAll<HTMLElement>('[data-pers-stage]').forEach((el) => stepEls.push(el));
    stage = 0;
    setStage(0);
    schedule(); // continuar el ciclo sin acumular temporizadores
  };

  const schedule = (): void => {
    window.clearTimeout(timer);
    timer = undefined;
    if (!running || !inView || document.hidden || userStopped) return;
    timer = window.setTimeout(() => {
      setStage(stage + 1);
      schedule();
    }, DELAY);
  };

  const setRunning = (on: boolean): void => {
    running = on;
    visual?.classList.toggle('is-running', on);
    void on;
    schedule();
  };

  const start = (): void => {
    if (userStopped) return;
    setRunning(true);
  };
  const halt = (): void => {
    running = false;
    window.clearTimeout(timer);
    timer = undefined;
    visual?.classList.remove('is-running');
  };

  // movimiento de los paquetes sobre los cables (un solo rAF)
  const animatePackets = (): void => {
    raf = requestAnimationFrame(animatePackets);
    if (!running || document.hidden) return;
    wireEls.forEach((w, wi) => {
      const len = w.getTotalLength();
      const t = ((performance.now() / 2400) + wi * 0.5) % 1;
      const p = w.getPointAtLength(t * len);
      const pkt = packetEls[wi];
      if (pkt) { pkt.setAttribute('cx', String(p.x)); pkt.setAttribute('cy', String(p.y)); }
    });
  };
  if (!reduced) animatePackets();

  caseBtns.forEach((b) => b.addEventListener('click', () => {
    const id = b.dataset['persCase'];
    const c = PERSONAS_CASES.find((x) => x.id === id);
    if (!c) return;
    caseBtns.forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
    track('scene_viewed', { scene: 'E11', caso: id ?? '' });
    setCase(c); // actualiza textos y continúa el ciclo
  }));

  // control discreto y accesible para detener el movimiento continuo
  motionBtn?.addEventListener('click', () => {
    userStopped = !userStopped;
    motionBtn.setAttribute('aria-pressed', String(userStopped));
    if (motionText) motionText.textContent = userStopped ? '▶ Reanudar animación' : '⏸ Detener animación';
    if (userStopped) halt();
    else start();
  });

  // arranque automático al entrar en pantalla; suspensión al salir / pestaña inactiva
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((es) => {
      inView = es[0]?.isIntersecting ?? false;
      if (inView) { if (!reduced) start(); }
      else halt();
    }, { threshold: 0.25 });
    io.observe(wrap);
  } else {
    inView = true;
    if (!reduced) start();
  }
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) halt();
    else if (inView && !reduced) start();
  });

  if (reduced) {
    // movimiento reducido: contenido estático en etapa 1, el visitante puede reanudar manualmente
    running = false;
    setStage(0);
    if (motionText) motionText.textContent = '▶ Reanudar animación';
  } else {
    setStage(0);
  }
}
