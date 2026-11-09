/**
 * V4-B: interacciones post-hero — mosaico de soluciones seleccionable (E25)
 * y cierre personalizado con recomendación según ruta + respuestas (E29).
 */
import { getState, setAnswer, CAPABILITY_IDS } from './state';
import { INFRA_LABEL } from './cierre';
import { buildSummary } from './cierre'; // única fuente del resumen compartido
import { track } from './events';
/** Contrato mínimo del universo 3D que usan estas interacciones. */
export interface PostHeroUniverse {
  cardPulse(index: number): void;
}

const FOCO_LABEL: Record<string, string> = {
  mensajes: 'la atención a mensajes',
  marketing: 'contenido y campañas',
  ventas: 'el seguimiento de ventas',
  operacion: 'los pedidos y la operación',
  explorando: 'explorar sin compromiso',
};

function renderRecommendation(): void {
  const root = document.querySelector('[data-recommendation]');
  if (!root) return;
  const list = root.querySelector('[data-recommendation-list]');
  const status = root.querySelector('[data-recommendation-status]');
  if (!list || !status) return;
  const state = getState();
  const route = state.primary;
  const foco = state.answers.foco;
  const escala = state.answers.escala;
  const servicio = state.answers.servicio;

  // P0-03: la lista visible se construye desde el ESTADO completo, no sólo la ruta.
  // Prioridad: lo que el visitante eligió/modificó explícitamente; la ruta sólo orienta
  // cuando aún no hay decisiones.
  const items: { tag: string; title: string; body: string }[] = [];
  const capNames = CAPABILITY_IDS.filter((c) => state.capabilities.includes(c)).map((c) => c.toUpperCase());
  if (capNames.length) {
    items.push({ tag: 'Elegiste', title: `Tus ${capNames.length} capacidad(es)`, body: `Añadiste: ${capNames.join(', ')}. Puedes quitarlas o sumar otras en las tarjetas de arriba.` });
  }
  if (state.membership) {
    items.push({ tag: 'Tu selección', title: `Membresía ${state.membership.toUpperCase()}`, body: 'La elegiste tú en E27; la recomendación del diagnóstico no la reemplaza.' });
  }
  if (state.infra) {
    items.push({ tag: 'Infraestructura', title: INFRA_LABEL[state.infra] ?? state.infra, body: state.infra === 'housing' ? 'Explora la modalidad compartida o privada en E22.' : 'Preferencia guardada de tu recorrido.' });
  }
  if (state.housingMode) {
    items.push({ tag: 'Housing', title: state.housingMode === 'privado' ? 'Modalidad privada (100% dedicada)' : 'Modalidad compartida (50/25/25)', body: 'Elegida en E22; sin elegirla no se asume contratación.' });
  }
  if (state.red) {
    items.push({ tag: 'Red colaborativa', title: `Capacidad de red: ${state.red}`, body: 'Seleccionada en E15; sobrevive a las demostraciones.' });
  }
  if (state.answers.servicio) {
    items.push({ tag: 'Servicio explorado', title: state.answers.servicio, body: 'Elegido en el ecosistema (E25).' });
  }
  if (!items.length) {
    // Sin decisiones previas: la ruta orienta (GeoNodos ya no tiene protagonismo en exploración)
    if (route === 'enterprise') {
      items.push(
        { tag: 'Infraestructura', title: 'Housing: tu propio nodo administrado', body: 'Modalidad compartida o privada según lo que necesites; sin elegirla no se asume.' },
        { tag: 'Agentes', title: 'Agentes de IA con aprobación humana', body: 'Cada acción de un agente espera tu visto bueno. Nada se ejecuta solo.' },
      );
    } else if (route === 'efficiency') {
      const focoTxt = foco ? FOCO_LABEL[foco] ?? 'tu área de foco' : 'lo que más te quita tiempo';
      items.push(
        { tag: 'Automatización', title: `Empieza por ${focoTxt}`, body: 'Un flujo de atención real: mensaje → clasificación → persona → seguimiento.' },
        { tag: 'Personas + IA', title: 'La IA ayuda, las personas deciden', body: 'Asistencia automatizada con escalación a humanos con criterio.' },
      );
    } else if (route === 'explorer') {
      items.push(
        { tag: 'Comunidad', title: 'Red colaborativa: ideas que crecen en red', body: 'Comparte herramientas y conocimiento con tu comunidad (E15).' },
        { tag: 'Plataforma', title: 'Tecnología con tus datos bajo tu control', body: 'Explora Ciudadan como contexto abierto del cooperativismo.' },
      );
    } else {
      items.push(
        { tag: 'Conversación', title: 'Hablemos de tu negocio', body: 'Sin cuestionario obligatorio: escríbenos y armamos el siguiente paso contigo.' },
        { tag: 'Explora', title: 'Recorre las tres rutas', body: 'Empresa, eficiencia o exploración libre: elige por dónde entrar.' },
      );
    }
  }
  items.push({ tag: 'Contacto', title: 'hola@publia.mx · WhatsApp 55 73 72 46 60', body: 'Respuesta humana, sin formularios que nadie lee.' });

  list.innerHTML = items
    .map(
      (it) =>
        `<li class="recommendation__item"><em>${it.tag}</em><strong>${it.title}</strong><span>${it.body}</span></li>`,
    )
    .join('');
  const routeLabel = route === 'unclassified' ? 'sin ruta elegida aún' : route === 'enterprise' ? 'ruta Empresa' : route === 'efficiency' ? 'ruta Eficiencia' : 'exploración libre';
  status.textContent = `Tu recorrido: ${routeLabel}${foco ? ` · foco en ${FOCO_LABEL[foco]}` : ''}${escala ? ` · escala: ${escala.replace('_', ' ')}` : ''}${servicio ? ` · solución: ${servicio}` : ''}. Estos son los siguientes pasos que cuadran:`;
  track('recommendation_rendered', { route, foco: foco ?? '', escala: escala ?? '', servicio: servicio ?? '' });
}

function bindSolutionsMosaic(universe: PostHeroUniverse | null): void {
  const mosaic = document.querySelector('#escena-e25 .services');
  if (!mosaic) return;
  mosaic.addEventListener('click', (ev) => {
    const item = (ev.target as HTMLElement).closest('.services__item');
    if (!item) return;
    const name = item.querySelector('.services__name')?.textContent ?? '';
    const wasSelected = item.classList.contains('is-selected');
    mosaic.querySelectorAll('.services__item.is-selected').forEach((el) => {
      el.classList.remove('is-selected');
      el.setAttribute('aria-pressed', 'false');
    });
    if (!wasSelected) {
      item.classList.add('is-selected');
      item.setAttribute('aria-pressed', 'true');
      setAnswer('servicio', name);
      const items = [...mosaic.querySelectorAll('.services__item')];
      universe?.cardPulse(items.indexOf(item));
      track('solution_selected', { servicio: name });
    }
  });
}

let postHeroBound = false;
export function bindPostHero(universe: PostHeroUniverse | null): void {
  if (postHeroBound) return; // lazyBind puede llamarlo por dos selectores: una sola vez
  postHeroBound = true;
  bindSolutionsMosaic(universe);
  // Copiar (V2): listener único, y usa el MISMO buildSummary() del cierre V2,
  // así copiar/TXT/WhatsApp/correo comparten exactamente el mismo resumen.
  const root = document.querySelector('[data-recommendation]');
  const copyBtn = root?.querySelector<HTMLButtonElement>('[data-rec-copy]');
  const copied = root?.querySelector<HTMLElement>('[data-rec-copied]');
  copyBtn?.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(buildSummary());
      if (copied) copied.textContent = '✓ Resumen copiado al portapapeles.';
      track('recommendation_copied', {});
    } catch {
      if (copied) copied.textContent = 'No se pudo copiar; usa el botón de descargar TXT.';
    }
  });
  renderRecommendation();
  // re-render al cambiar de ruta (ej. volver y elegir otra); el listener de copiar NO se re-adjunta
  window.addEventListener('publia:state', () => renderRecommendation());
}
