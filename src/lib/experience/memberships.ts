/**
 * E27 Membresías — binder 7M-F §10.
 * Fuente única: COPY_7MF.memberships (mismos textos/precios que E29 y la
 * exportación). El clic en el CTA persiste la membresía elegida y abre el
 * enlace real de WhatsApp (nunca se afirma envío). «Ver alcance» es un
 * <details> nativo que puede abrirse antes de contactar.
 */
import { getState, setMembership, type MembershipSlug } from './state';
import { track } from './events';

/** Recomendación del diagnóstico (tests de comercio); sin cambios 7M-F. */
export function recommend(goal: string | null, team: string | null): { plan: MembershipSlug | null; housing: boolean } | null {
  if (!goal || !team) return null;
  if (goal === 'agent') return { plan: 'agente', housing: false };
  if (goal === 'growth') return { plan: 'crecimiento', housing: false };
  if (goal === 'support') return { plan: team === 'large' ? 'cobertura' : 'operacion', housing: false };
  if (goal === 'start') return { plan: team === 'large' ? 'crecimiento' : 'base', housing: false };
  return { plan: null, housing: true };
}

export function bindMemberships(): void {
  document.querySelectorAll<HTMLElement>('[data-memb7]').forEach((wrap) => {
    if (wrap.dataset.bound === '1') return;
    wrap.dataset.bound = '1';
    wrap.querySelectorAll<HTMLAnchorElement>('[data-memb7-cta]').forEach((cta) => {
      cta.addEventListener('click', () => {
        const slug = cta.dataset['memb7Cta'] as MembershipSlug | undefined;
        if (slug) {
          setMembership(slug);
          track('scene_viewed', { scene: 'E27', plan: slug });
        }
      });
    });
    // restaurar marca visual de la selección persistida
    const saved = getState().membership;
    if (saved) {
      wrap.querySelector<HTMLElement>(`[data-memb7-card="${saved}"]`)?.setAttribute('data-selected', '1');
    }
    // CTA de E11: abrir «Ver alcance» de Operación/Cobertura al llegar
    wrap.addEventListener('click', () => undefined);
    document.querySelectorAll<HTMLAnchorElement>('[data-open-alcance]').forEach((a) => {
      a.addEventListener('click', () => {
        window.setTimeout(() => {
          ['operacion', 'cobertura'].forEach((id) => {
            const d = wrap.querySelector<HTMLDetailsElement>(`[data-memb7-scope="${id}"]`);
            if (d) d.open = true;
          });
        }, 600);
      });
    });
  });
}
