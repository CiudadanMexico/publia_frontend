/**
 * Formulario WhatsApp E30 (7M-F §9): compone contact.formMessage con las
 * selecciones explícitas del visitante y actualiza el enlace real al vuelo.
 * Nombre obligatorio, negocio opcional («Sin especificar» si vacío),
 * necesidad obligatoria; maxlength + contador; nunca afirma envío.
 */
import { COPY_7MF } from '../../data/copy7mf';

const c = COPY_7MF.closing;
const waBase = `https://wa.me/${COPY_7MF.contact.number}?text=`;

export function bindWaForm(): void {
  document.querySelectorAll<HTMLElement>('[data-wa-form]').forEach((wrap) => {
    if (wrap.dataset.bound === '1') return;
    wrap.dataset.bound = '1';
    const form = wrap.querySelector<HTMLFormElement>('[data-wa-form-el]');
    const submit = wrap.querySelector<HTMLAnchorElement>('[data-wa-submit]');
    const elError = wrap.querySelector<HTMLElement>('[data-wa-error]');
    const nombre = wrap.querySelector<HTMLInputElement>('[data-wa-nombre]');
    const negocio = wrap.querySelector<HTMLInputElement>('[data-wa-negocio]');
    const necesidad = wrap.querySelector<HTMLTextAreaElement>('[data-wa-necesidad]');
    if (!form || !submit || !nombre || !negocio || !necesidad) return;

    const counters: [HTMLElement | null, HTMLInputElement | HTMLTextAreaElement][] = [
      [wrap.querySelector('[data-wa-count="nombre"]'), nombre],
      [wrap.querySelector('[data-wa-count="negocio"]'), negocio],
      [wrap.querySelector('[data-wa-count="necesidad"]'), necesidad],
    ];
    const syncCount = (): void => {
      counters.forEach(([el, input]) => {
        if (el) el.textContent = `${input.value.length}/${input.maxLength}`;
      });
    };
    [nombre, negocio, necesidad].forEach((el) => el.addEventListener('input', syncCount));
    syncCount();

    const updateLink = (): boolean => {
      const name = nombre.value.trim();
      const need = necesidad.value.trim();
      const valid = name.length > 0 && need.length > 0;
      if (elError) elError.hidden = valid || (name.length === 0 && need.length === 0);
      const msg = COPY_7MF.contact.formMessage
        .replace('{name}', name || '—')
        .replace('{business}', negocio.value.trim() || 'Sin especificar')
        .replace('{need}', need || '—');
      submit.href = `${waBase}${encodeURIComponent(msg)}`;
      return valid;
    };
    [nombre, negocio, necesidad].forEach((el) => el.addEventListener('input', updateLink));
    updateLink();

    const guard = (): boolean => {
      if (updateLink()) return true;
      if (elError) elError.hidden = false;
      (nombre.value.trim() ? necesidad : nombre).focus();
      return false;
    };
    form.addEventListener('submit', (ev) => {
      ev.preventDefault(); // el envío real lo hace el enlace de WhatsApp
      if (!guard()) return;
      submit.click(); // abre WhatsApp con el mensaje ya compuesto
    });
    // 7M-G §7: el click directo del CTA también pasa por la validación
    submit.addEventListener('click', (ev) => {
      if (!guard()) ev.preventDefault();
    });
  });
}
