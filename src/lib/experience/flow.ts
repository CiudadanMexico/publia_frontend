/**
 * E07 Flujo de atención (ruta eficiencia) — 7M-I §5. UN mecanismo local:
 * la demo arranca sola al entrar en viewport y recorre las 4 etapas en
 * secuencia continua (0→1→2→3→0…). Los chips de caso sólo cambian el
 * contenido (resultado + foco persistido) y el ciclo sigue. Sin botones de
 * ejecutar/reiniciar: un control discreto para detener el movimiento.
 * Se suspende fuera de viewport o con pestaña inactiva; un solo temporizador
 * en cadena (sin acumulación). No toca el controlador global de scroll.
 */
import { track } from './events';
import { setAnswer } from './state';

interface UniverseLike {
  cardPulse?: (i: number) => void;
  setSceneLook?: (look: Record<string, unknown>) => void;
}

const STAGE_LINES = [
  'Llega la consulta al canal elegido.',
  'El agente la clasifica y prepara una propuesta.',
  'Una persona revisa y decide.',
  'Queda registro y seguimiento visible.',
];

export function bindFlow(universe?: UniverseLike | null): void {
  document.querySelectorAll<HTMLElement>('[data-demo="flow"]').forEach((wrap) => {
    if (wrap.dataset.bound === '1') return;
    wrap.dataset.bound = '1';
    const chips = [...wrap.querySelectorAll<HTMLButtonElement>('[data-flow-focus]')];
    const stages = [...wrap.querySelectorAll<HTMLElement>('[data-flow-stage]')];
    const dot = wrap.querySelector<HTMLElement>('[data-flow-dot]');
    const feed = wrap.querySelector<HTMLElement>('[data-flow-feed]');
    const count = wrap.querySelector<HTMLElement>('[data-flow-count]');
    const result = wrap.querySelector<HTMLElement>('[data-flow-result]');
    const motionBtn = wrap.querySelector<HTMLButtonElement>('[data-flow-motion]');
    const motionText = wrap.querySelector('[data-flow-motion-text]');
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const DELAY = reduced ? 1100 : 1500;

    let stage = 0;
    let timer: number | undefined;
    let running = false;
    let inView = false;
    let userStopped = false;

    const setStage = (i: number): void => {
      stage = ((i % 4) + 4) % 4;
      stages.forEach((st, j) => st.classList.toggle('is-active', j === stage));
      if (feed) feed.textContent = STAGE_LINES[stage] ?? '';
      if (count) count.textContent = String(stage + 1).padStart(2, '0');
      universe?.cardPulse?.(stage);
      if (dot) {
        const target = stages[stage];
        if (target) {
          dot.style.opacity = '1';
          dot.style.left = `${target.offsetLeft + target.offsetWidth / 2}px`;
        }
      }
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

    const start = (): void => {
      if (userStopped) return; // con reduced-motion el arranque es manual vía el control discreto
      running = true;
      wrap.classList.add('is-running');
      schedule();
    };
    const halt = (): void => {
      running = false;
      window.clearTimeout(timer);
      timer = undefined;
      wrap.classList.remove('is-running');
    };

    chips.forEach((chip) => chip.addEventListener('click', () => {
      chips.forEach((c) => c.setAttribute('aria-pressed', 'false'));
      chip.setAttribute('aria-pressed', 'true');
      if (result) result.textContent = chip.dataset['flowResult'] ?? '';
      setAnswer('foco', chip.dataset['flowFocus'] ?? '');
      universe?.setSceneLook?.({ network: 0.85, spread: 0.5, lightBoost: 1.1, tintMix: 0.45, camX: -0.5, camY: 0.25, camZ: -0.5 });
      track('demo_flujo_foco', { foco: chip.dataset['flowFocus'] ?? '' });
      setStage(0); // el flujo cambia de caso y el ciclo continúa desde el inicio
      schedule();
    }));

    motionBtn?.addEventListener('click', () => {
      userStopped = !userStopped;
      motionBtn.setAttribute('aria-pressed', String(userStopped));
      if (motionText) motionText.textContent = userStopped ? '▶ Reanudar animación' : '⏸ Detener animación';
      if (userStopped) halt();
      else start();
    });

    if ('IntersectionObserver' in window) {
      const io = new IntersectionObserver((es) => {
        inView = es[0]?.isIntersecting ?? false;
        if (inView) start();
        else halt();
      }, { threshold: 0.25 });
      io.observe(wrap);
    } else {
      inView = true;
      start();
    }
    // respaldo determinista además del IO: recalcular visibilidad en cada scroll
    const syncView = (): void => {
      const r = wrap.getBoundingClientRect();
      const vis = r.top < window.innerHeight * 0.75 && r.bottom > window.innerHeight * 0.15 && r.width > 0;
      if (vis !== inView) {
        inView = vis;
        if (inView) start();
        else halt();
      }
    };
    window.addEventListener('scroll', syncView, { passive: true });
    window.addEventListener('resize', syncView);
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) halt();
      else if (inView) start();
    });

    setStage(0);
    if (reduced && motionText) motionText.textContent = '▶ Reanudar animación';
  });
}
