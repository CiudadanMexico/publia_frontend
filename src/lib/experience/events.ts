/**
 * Eventos semánticos de la experiencia.
 *
 * - No hay endpoint analítico inventado: sin `PUBLIC_ANALYTICS_ENDPOINT` los
 *   eventos se quedan en una cola local (útil para QA) y no salen del navegador.
 * - El consentimiento se decide antes de enviar nada.
 * - Sin datos sensibles: sólo ruta, escena y contexto de navegación.
 */

export type ExperienceEvent =
  | 'hero_entered'
  | 'hero_enterprise_selected'
  | 'hero_efficiency_selected'
  | 'hero_cooperative_selected'
  | 'hero_returned'
  | 'act_back'
  | 'demo_infra_capa'
  | 'demo_flujo_foco'
  | 'demo_geonodo'
  | 'iniciar_scroll_libre'
  | 'responder'
  | 'cambiar_ruta'
  | 'saltar_animacion'
  | 'explorer_path_entered'
  | 'cooperative_interest'
  | 'scene_viewed'
  | 'solution_selected'
  | 'recommendation_rendered'
  | 'ecosystem_selected'
  | 'ecosystem_demo'
  | 'ecosystem_activated'
  | 'demo_flujo_run'
  | 'recommendation_copied'
  | 'infra_selected'
  | 'infra_red_activated'
  | 'red_capability_selected'
  | 'red_demo_run'
  | 'red_demo_start'
  | 'housing_mode_selected'
  | 'housing_demo'
  | 'explore_all_toggled'
  | 'marketing_area_toggled'
  | 'marketing_demo_selected'
  | 'marketing_demo_start'
  | 'marketing_demo_run'
  | 'personas_demo'
  | 'membership_selected'
  | 'membership_diagnosis'
  | 'capability_toggled'
  | 'cierre_export_txt'
  | 'cierre_contact'
  | 'cierre_demo'
  | 'cierre_back_to_diagnosis'
  | 'cierre_restart'
  | 'membership_viewed'
  | 'membership_selected'
  | 'housing_interest'
  | 'consultation_requested'
  | 'lead_submitted';

export interface TrackedEvent {
  event: ExperienceEvent;
  payload: Record<string, string | number | boolean>;
  at: number;
}

const queue: TrackedEvent[] = [];
let consent: 'unknown' | 'granted' | 'denied' = 'unknown';
let endpoint: string | null = null;

function readEndpoint(): string | null {
  if (typeof window === 'undefined') {
    return null;
  }
  const fromEnv = import.meta.env['PUBLIC_ANALYTICS_ENDPOINT'];
  if (typeof fromEnv === 'string' && fromEnv.length > 0) {
    return fromEnv;
  }
  const meta = document.querySelector('meta[name="publia-analytics-endpoint"]');
  const value = meta?.getAttribute('content');
  return value && value.length > 0 ? value : null;
}

export function initAnalytics(): void {
  endpoint = readEndpoint();
}

export function setConsent(value: 'granted' | 'denied'): void {
  consent = value;
  if (value === 'granted') {
    flush();
  }
}

export function getConsent(): 'unknown' | 'granted' | 'denied' {
  return consent;
}

/** Registra un evento. Nunca lanza: la analítica no debe romper la página. */
export function track(event: ExperienceEvent, payload: Record<string, string | number | boolean> = {}): void {
  const entry: TrackedEvent = { event, payload, at: Date.now() };
  queue.push(entry);
  if (queue.length > 200) {
    queue.shift();
  }
  if (consent === 'granted') {
    send(entry);
  }
}

function send(entry: TrackedEvent): void {
  if (!endpoint || typeof navigator === 'undefined' || !navigator.sendBeacon) {
    return;
  }
  try {
    const body = JSON.stringify({ event: entry.event, payload: entry.payload, at: entry.at });
    navigator.sendBeacon(endpoint, new Blob([body], { type: 'application/json' }));
  } catch {
    /* sin analítica no hay fallo de usuario */
  }
}

function flush(): void {
  if (!endpoint || consent !== 'granted') {
    return;
  }
  for (const entry of queue) {
    send(entry);
  }
}

/** Cola local: sólo para depuración y pruebas, no sale del navegador. */
export function getEventLog(): readonly TrackedEvent[] {
  return queue;
}
