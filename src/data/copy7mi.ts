/**
 * 7M-I — textos escritos por DSH según la orden literal del bloque (base 020afb3).
 * copy7mf.ts es GENERADO (zip externo) y no se toca a mano: estos literales
 * viven aquí, igual que los de 7M-H en copy7mh.ts. Precios intactos del
 * catálogo 7M-H: 300 / 550 / 2000 / 3000 / 4000 MXN/mes.
 */

export const E27_LEAD_7MI =
  'Empieza con las herramientas que necesita tu negocio hoy. Conforme crezcas, incorpora asistentes de inteligencia artificial, creación de contenidos y apoyo de nuestro equipo.';

export const E27_LEGEND_7MI =
  'Un chatbot atiende consultas por WhatsApp; un agente personal te asiste en tu trabajo diario; las membresías con acompañamiento agregan personas de nuestro equipo; el Housing es la infraestructura de servidores para tu operación (ver la comparación de arriba).';

export const E27_DETAIL_LABEL_7MI = '¿Qué incluye este plan?';
export const E27_EXTRAS_TITLE_7MI = 'Agrega los servicios que necesites.';
export const E27_PLAN_CTA_7MI = 'Me interesa este plan';
export const E27_SUPPORT_CTA_7MI = 'Ver opciones de apoyo humano';

/** Cada plan responde: ¿para quién es? ¿qué problema resuelve? ¿qué incluye? ¿cuánto cuesta? ¿qué se cotiza aparte? */
export const E27_PLANS_7MI: Record<string, { forWho: string; problem: string }> = {
  base: {
    forWho: 'Para negocios que empiezan y necesitan presencia digital y atención básica por WhatsApp.',
    problem: 'Resuelve tener un sitio o tienda publicado y responder consultas sin estar pegado al celular.',
  },
  agente: {
    forWho: 'Para quien trabaja solo y necesita un asistente para sus tareas diarias.',
    problem: 'Resuelve que las tareas repetitivas de una sola persona le quiten tiempo valioso.',
  },
  crecimiento: {
    forWho: 'Para negocios con un equipo pequeño que quieren publicar contenido con constancia.',
    problem: 'Resuelve rehacer contenido cada mes sin un proceso claro.',
  },
  operacion: {
    forWho: 'Para negocios con operación diaria que necesitan que alguien vigile y responda.',
    problem: 'Resuelve el costo de coordinar pedidos, mensajes y tareas sin descanso.',
  },
  cobertura: {
    forWho: 'Para negocios cuyos clientes escriben en horario amplio y necesitan atención extendida.',
    problem: 'Resuelve tener una ventana de atención más amplia sin contratar más personas de golpe.',
  },
};
