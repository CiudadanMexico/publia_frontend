/**
 * V4-B: interacciones post-hero — mosaico de soluciones seleccionable (E25)
 * y cierre personalizado con recomendación según ruta + respuestas (E29).
 */
import { getState, setAnswer } from './state';
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

  const items: { tag: string; title: string; body: string }[] = [];
  if (route === 'enterprise') {
    items.push(
      { tag: 'Infraestructura', title: 'Housing: tu propio nodo administrado', body: 'Servidores propios con administración incluida; decide privado o compartido al platicarlo.' },
      { tag: 'Agentes', title: 'Agentes de IA con aprobación humana', body: 'Cada acción de un agente espera tu visto bueno. Nada se ejecuta solo.' },
      { tag: 'Operación', title: 'Cobertura humana en horario definido', body: 'Ventana de atención real, no un bot que simula responder.' },
    );
  } else if (route === 'efficiency') {
    const focoTxt = foco ? FOCO_LABEL[foco] ?? 'tu área de foco' : 'lo que más te quita tiempo';
    items.push(
      { tag: 'Automatización', title: `Empieza por ${focoTxt}`, body: 'Un flujo de atención real: mensaje → clasificación → persona → seguimiento.' },
      { tag: 'Personas + IA', title: 'La IA ayuda, las personas deciden', body: 'Asistencia automatizada con escalación a humanos con criterio.' },
    );
    if (escala === 'solo' || escala === 'equipo_pequeno') {
      items.push({ tag: 'Membresía', title: 'Empieza con BASE', body: 'Capacidad compartida para arrancar sin contratarlo todo.' });
    } else {
      items.push({ tag: 'Membresía', title: 'Crece según tu operación', body: 'CRECIMIENTO u OPERACIÓN cuando la ventana de atención lo pida.' });
    }
  } else if (route === 'explorer') {
    items.push(
      { tag: 'Comunidad', title: 'GeoNodos: una idea crece en red', body: 'Comunidades que comparten herramientas, conocimiento y capacidad de producción.' },
      { tag: 'Plataforma', title: 'Ciudadan da contexto al cooperativismo', body: 'Tecnología abierta con datos bajo control de quien la usa.' },
      { tag: 'Economía', title: 'Consumo y producción en común', body: 'Servicios compartidos sin intermediarios que encarecen.' },
    );
  } else {
    items.push(
      { tag: 'Conversación', title: 'Hablemos de tu negocio', body: 'Sin cuestionario obligatorio: escríbenos y armamos el siguiente paso contigo.' },
      { tag: 'Explora', title: 'Recorre las tres rutas', body: 'Empresa, eficiencia o exploración libre: elige por dónde entrar.' },
    );
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

  // Copiar resumen (acción explícita del visitante, V2)
  const copyBtn = root.querySelector<HTMLButtonElement>('[data-rec-copy]');
  const copied = root.querySelector<HTMLElement>('[data-rec-copied]');
  copyBtn?.addEventListener('click', async () => {
    const lines = [
      `Recorrido Publia.mx — ${routeLabel}`,
      foco ? `- Foco: ${FOCO_LABEL[foco]}` : null,
      escala ? `- Escala: ${escala.replace('_', ' ')}` : null,
      servicio ? `- Solución elegida: ${servicio}` : null,
      '- Contacto: hola@publia.mx · WhatsApp 55 73 72 46 60',
    ].filter(Boolean) as string[];
    try {
      await navigator.clipboard.writeText(lines.join('\n'));
      if (copied) copied.textContent = '✓ Resumen copiado al portapapeles.';
      track('recommendation_copied', { route });
    } catch {
      if (copied) copied.textContent = 'No se pudo copiar; selecciona y copia el texto de arriba.';
    }
  });
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

export function bindPostHero(universe: PostHeroUniverse | null): void {
  bindSolutionsMosaic(universe);
  renderRecommendation();
  // re-render al cambiar de ruta (ej. volver y elegir otra)
  window.addEventListener('publia:state', () => renderRecommendation());
}
