/**
 * Ecosistema (P0-04): órbita de 8 soluciones + panel de lectura.
 * Selección persiste en answers.servicio y alimenta el cierre V2.
 * Progreso de órbita ligado al scroll de la escena (reversible); sin rAF
 * cuando hay prefers-reduced-motion.
 */
import { ECOSYSTEM_SERVICES } from '../../data/ecosystem';
import { setAnswer } from './state';
import { track } from './events';

export interface EcosystemUniverse {
  cardPulse(index: number): void;
  gesture(): void;
}

const pad = (n: number): string => String(n).padStart(2, '0');

export function bindEcosystem(universe: EcosystemUniverse | null): void {
  const wrap = document.querySelector<HTMLElement>('[data-demo="ecosystem"]');
  if (!wrap || wrap.dataset.bound === '1') return;
  const cloud = wrap.querySelector<HTMLElement>('[data-eco-cloud]');
  const orbit = wrap.querySelector<HTMLElement>('[data-eco-orbit]');
  const scene = wrap.closest<HTMLElement>('section[id]');
  if (!cloud || !orbit) return;
  const nodes = [...cloud.querySelectorAll<HTMLButtonElement>('[data-eco-node]')];
  const elIndex = wrap.querySelector('[data-eco-index]');
  const elEmoji = wrap.querySelector('[data-eco-emoji]');
  const elTitle = wrap.querySelector('[data-eco-title]');
  const elDetail = wrap.querySelector('[data-eco-detail]');
  const elFlow = wrap.querySelector('[data-eco-flow]');
  const elExample = wrap.querySelector<HTMLElement>('[data-eco-example]');
  const elToast = wrap.querySelector<HTMLElement>('[data-eco-toast]');
  const elPanel = wrap.querySelector<HTMLElement>('[data-eco-panel]');
  const btnPlay = wrap.querySelector<HTMLButtonElement>('[data-eco-play]');
  const btnMore = wrap.querySelector<HTMLButtonElement>('[data-eco-more]');
  const btnNext = wrap.querySelector<HTMLButtonElement>('[data-eco-next]');
  const btnActivate = wrap.querySelector<HTMLButtonElement>('[data-eco-activate]');
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  let selected = 0;
  let toastTimer = 0;
  let playTimers: number[] = [];

  const toast = (msg: string): void => {
    if (!elToast) return;
    elToast.textContent = msg;
    elToast.classList.add('visible');
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => elToast.classList.remove('visible'), 2400);
  };

  const select = (i: number): void => {
    selected = ((i % nodes.length) + nodes.length) % nodes.length;
    const s = ECOSYSTEM_SERVICES[selected];
    if (!s) return;
    nodes.forEach((n, j) => n.setAttribute('aria-pressed', String(j === selected)));
    if (elIndex) elIndex.textContent = `${pad(selected + 1)} / ${pad(nodes.length)}`;
    if (elEmoji) {
      elEmoji.textContent = s.emoji;
      (elEmoji as HTMLElement).style.color = s.color;
    }
    if (elTitle) elTitle.textContent = s.title;
    if (elDetail) elDetail.textContent = s.detail;
    if (elFlow) {
      elFlow.innerHTML = s.flow
        .map((f, k) => `${k ? '<b aria-hidden="true">⟶</b>' : ''}<span data-eco-step="${k}">${f}</span>`)
        .join('');
    }
    if (elExample) elExample.hidden = true;
    if (btnMore) btnMore.setAttribute('aria-expanded', 'false');
    if (elPanel) elPanel.style.borderColor = s.color;
    setAnswer('servicio', s.title);
    universe?.cardPulse(selected);
    track('ecosystem_selected', { servicio: s.title });
  };

  const playExample = (): void => {
    const s = ECOSYSTEM_SERVICES[selected];
    if (!s || !elFlow) return;
    playTimers.forEach(window.clearTimeout);
    playTimers = [];
    const spans = [...elFlow.querySelectorAll('[data-eco-step]')] as HTMLElement[];
    spans.forEach((sp) => sp.classList.remove('is-live'));
    if (elExample) elExample.hidden = true;
    toast(`▶ Demostración conceptual: ${s.name.toLowerCase()}`);
    spans.forEach((sp, i) => {
      playTimers.push(
        window.setTimeout(() => {
          sp.classList.add('is-live');
          if (i === spans.length - 1 && elExample) {
            elExample.hidden = false;
            elExample.textContent = s.example;
          }
        }, reduced ? 0 : i * 590),
      );
    });
    if (orbit) {
      orbit.classList.remove('is-burst');
      void orbit.offsetWidth;
      orbit.classList.add('is-burst');
    }
    track('ecosystem_demo', { servicio: s.title });
  };

  nodes.forEach((node, i) => {
    node.addEventListener('click', () => select(i));
  });
  btnNext?.addEventListener('click', () => select(selected + 1));
  btnPlay?.addEventListener('click', playExample);
  btnMore?.addEventListener('click', () => {
    if (!elExample) return;
    elExample.hidden = !elExample.hidden;
    btnMore.setAttribute('aria-expanded', String(!elExample.hidden));
    if (!elExample.hidden) {
      const s = ECOSYSTEM_SERVICES[selected];
      if (s) elExample.textContent = s.example;
    }
  });
  btnActivate?.addEventListener('click', () => {
    toast('⚡ Los ocho servicios conectados en una misma red');
    if (orbit) {
      orbit.classList.remove('is-burst');
      void orbit.offsetWidth;
      orbit.classList.add('is-burst');
    }
    universe?.gesture();
    track('ecosystem_activated', {});
  });
  wrap.addEventListener('keydown', (ev) => {
    const tag = (ev.target as HTMLElement).tagName;
    if (ev.key === 'ArrowRight' && !['BUTTON', 'INPUT', 'TEXTAREA'].includes(tag)) select(selected + 1);
    if (ev.key === 'ArrowLeft' && !['BUTTON', 'INPUT', 'TEXTAREA'].includes(tag)) select(selected - 1);
  });

  select(0);

  // Órbita continua ligada al progreso de scroll de la escena (reversible).
  //Sólo corre mientras la órbita está cerca del viewport (sin costo en el hero).
  if (!reduced) {
    let raf = 0;
    let rot = 0;
    let visible = false;
    let sceneTop = 0;
    let sceneTotal = 1;
    const measure = (): void => {
      if (!scene) return;
      sceneTop = scene.getBoundingClientRect().top + window.scrollY;
      sceneTotal = Math.max(1, scene.offsetHeight - window.innerHeight);
    };
    measure();
    window.addEventListener('resize', measure, { passive: true });
    if ('IntersectionObserver' in window) {
      new IntersectionObserver((entries) => {
        visible = entries.some((e) => e.isIntersecting);
        if (visible) measure();
      }, { rootMargin: '40% 0px' }).observe(orbit);
    } else {
      visible = true;
    }
    const tick = (): void => {
      raf = requestAnimationFrame(tick);
      if (!visible) return;
      rot += 0.0022;
      const progress = Math.min(1, Math.max(0, (window.scrollY - sceneTop) / sceneTotal));
      const w = orbit.clientWidth;
      const h = orbit.clientHeight;
      const rx = Math.min(w * 0.36, 340);
      const ry = h * 0.3;
      cloud.style.transform = `rotateY(${rot * 40 + progress * 30}deg) rotateX(${-4 + Math.sin(progress * Math.PI) * 10}deg)`;
      nodes.forEach((el, i) => {
        const angle = (i * Math.PI * 2) / nodes.length - Math.PI / 2 + rot + progress * 0.6;
        const x = Math.cos(angle) * rx;
        const y = Math.sin(angle) * ry;
        const z = Math.sin(angle * 1.3) * 60 + (i === selected ? 70 : 0);
        const scale = (i === selected ? 1.18 : 1) * (window.innerWidth < 900 ? 0.78 : 0.95);
        el.style.transform = `translate3d(calc(-50% + ${x}px), calc(-50% + ${y}px), ${z}px) scale(${scale})`;
        el.style.zIndex = String(20 + Math.floor(z));
      });
    };
    raf = requestAnimationFrame(tick);
    // limpieza al salir de la página
    window.addEventListener('pagehide', () => cancelAnimationFrame(raf), { once: true });
  } else {
    // reducido: distribución estática en anillo
    const w = orbit.clientWidth;
    const h = orbit.clientHeight;
    const rx = Math.min(w * 0.36, 340);
    const ry = h * 0.3;
    nodes.forEach((el, i) => {
      const angle = (i * Math.PI * 2) / nodes.length - Math.PI / 2;
      el.style.transform = `translate3d(calc(-50% + ${Math.cos(angle) * rx}px), calc(-50% + ${Math.sin(angle) * ry}px), 0)`;
    });
  }
  wrap.dataset.bound = '1';
}
