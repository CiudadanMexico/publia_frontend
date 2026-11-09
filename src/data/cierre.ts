/**
 * Cierre personalizado V2 (P0-07, Bloque E 7M-B): 6 capacidades con
 * identificadores estables (CapabiityId en state.ts), descripción y demo de
 * 3 pasos portados del prototipo 07. Nada se envía a servidor.
 */
import type { CapabilityId } from '../lib/experience/state';

export interface CierreCapability {
  id: CapabilityId;
  icon: string;
  name: string;
  desc: string;
  example: string;
  steps: readonly [string, string, string];
}

export const CIERRE_CAPABILITIES: readonly CierreCapability[] = [
  {
    id: 'web', icon: '🌐', name: 'Web + chatbot de WhatsApp',
    desc: 'Presencia digital, tienda y chatbot orientado a clientes. El agente personal es una capacidad distinta.',
    example: 'Una visita o un mensaje entra y el chatbot reúne la consulta.',
    steps: ['Visita o mensaje entrante', 'Chatbot reúne la consulta', 'Se registra una solicitud para seguimiento'],
  },
  {
    id: 'agentes', icon: '🤖', name: 'Agente personal o de procesos',
    desc: 'Un agente organiza tareas y prepara borradores; la persona responsable decide y aprueba.',
    example: 'El agente prepara la información para que un humano la revise.',
    steps: ['Identificar la necesidad', 'Organizar tareas y borradores', 'Presentar a la persona responsable'],
  },
  {
    id: 'marketing', icon: '📣', name: 'Marketing y contenidos',
    desc: 'Ideas, calendario y piezas con revisión humana. La producción audiovisual profesional se cotiza aparte.',
    example: 'La creatividad marca el rumbo y la IA prepara borradores.',
    steps: ['Definir objetivo y audiencia', 'Preparar ideas y calendario', 'Revisar y aprobar contenido'],
  },
  {
    id: 'personas', icon: '🤝', name: 'Acompañamiento humano',
    desc: 'Personas reales detrás de cada decisión: atención, creatividad y soporte con nombre y rostro.',
    example: 'Mar revisa el caso y decide la respuesta antes de enviarse.',
    steps: ['Detectar necesidad de apoyo', 'Enviar contexto al equipo', 'Atender dentro de la cobertura contratada'],
  },
  {
    id: 'housing', icon: '🖥️', name: 'Infraestructura / Housing',
    desc: 'Capacidad propia administrada, en modalidad compartida o privada según contrato. No es una foto de instalaciones: es tu nodo.',
    example: 'Se asigna la capacidad contratada con respaldos y monitoreo.',
    steps: ['Definir capacidad y privacidad', 'Asignar infraestructura y respaldos', 'Monitorear y escalar con control'],
  },
  {
    id: 'capacitacion', icon: '🎓', name: 'Capacitación y asesoría',
    desc: 'Aprender a administrar tus herramientas con autonomía, con acompañamiento cuando lo necesites.',
    example: 'Un ejercicio práctico para administrar tu sitio paso a paso.',
    steps: ['Identificar habilidades necesarias', 'Diseñar ejercicios aplicables', 'Practicar, medir y ajustar'],
  },
] as const;

export const CONTACTO = {
  email: 'hola@publia.mx',
  whatsapp: 'https://wa.me/525573724660',
  whatsappLabel: '55 73 72 46 60',
} as const;
