/**
 * Personas + IA (P0-04, paquete 7 mundos): 3 demostraciones con pasos
 * literales del prototipo. Etapa 1 siempre IA, etapa 2 siempre humana.
 * Demo ilustrativa: sin mensajes reales ni conexión a servicios externos.
 */
export interface PersonasCase {
  id: 'cliente' | 'creatividad' | 'soporte';
  kind: string;
  source: string;
  message: string;
  agent: string;
  human: string;
  role: string;
  steps: ReadonlyArray<readonly [string, string]>;
  workStatus: readonly string[];
  humanIndicator: readonly string[];
}

export const PERSONAS_CASES: readonly PersonasCase[] = [
  {
    id: 'cliente', kind: '💬 ATENCIÓN', source: 'Una consulta llegó', message: '«¿Puedo cambiar la dirección de entrega?»',
    agent: 'Reconoce la solicitud', human: 'Mar, atención humana', role: 'Comprueba el caso antes de confirmar',
    steps: [
      ['💬 Consulta recibida', 'El cliente pregunta por un cambio de dirección.'],
      ['🤖 IA organiza', 'Clasifica el asunto y reúne los datos necesarios.'],
      ['🤝 Revisamos juntos', 'Mar verifica qué cambios son posibles y decide la respuesta.'],
      ['✅ Seguimiento listo', 'Queda una respuesta preparada para que la persona la confirme.'],
    ],
    workStatus: ['Solicitud recibida', 'El agente está trabajando', 'Revisión humana en curso', 'Siguiente acción preparada'],
    humanIndicator: ['DISPONIBLE', 'DISPONIBLE', 'PARTICIPANDO', 'LISTO PARA SEGUIR'],
  },
  {
    id: 'creatividad', kind: '🎨 CREATIVIDAD', source: 'Llegó una nueva idea', message: '«Quiero anunciar el lanzamiento de mi tienda».',
    agent: 'Propone alternativas', human: 'Mar, coordinación creativa', role: 'Selecciona, mejora y aprueba el enfoque',
    steps: [
      ['🎨 Idea recibida', 'Hay un objetivo, pero todavía no hay una campaña.'],
      ['🤖 IA hace borradores', 'Sugiere tres enfoques y estructura posibles piezas.'],
      ['🧑‍🎨 Creatividad humana', 'Mar elige el tono, corrige el mensaje y revisa la identidad.'],
      ['✨ Listo para validar', 'Se presenta una propuesta revisable; publicar requiere aprobación.'],
    ],
    workStatus: ['Solicitud recibida', 'El agente está trabajando', 'Revisión humana en curso', 'Siguiente acción preparada'],
    humanIndicator: ['DISPONIBLE', 'DISPONIBLE', 'PARTICIPANDO', 'LISTO PARA SEGUIR'],
  },
  {
    id: 'soporte', kind: '🛠️ SOPORTE', source: 'Una alerta apareció', message: '«Mi sitio tarda demasiado en cargar».',
    agent: 'Reúne señales', human: 'Mar, coordinación de soporte', role: 'Prioriza el caso y coordina revisión',
    steps: [
      ['🚨 Problema reportado', 'Una persona detectó lentitud en su sitio.'],
      ['🤖 Primer análisis', 'El agente reúne síntomas, contexto y posibles causas.'],
      ['👩🏽‍💻 Revisión humana', 'Mar prioriza la incidencia y decide qué revisar primero.'],
      ['🧰 Seguimiento abierto', 'Se prepara un plan de acción; ninguna reparación real se ha ejecutado.'],
    ],
    workStatus: ['Solicitud recibida', 'El agente está trabajando', 'Revisión humana en curso', 'Siguiente acción preparada'],
    humanIndicator: ['DISPONIBLE', 'DISPONIBLE', 'PARTICIPANDO', 'LISTO PARA SEGUIR'],
  },
] as const;
