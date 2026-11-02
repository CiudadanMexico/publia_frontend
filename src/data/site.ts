/**
 * Datos de marca y contacto del sitio.
 *
 * El correo `hola@publia.mx` es una decisión del cliente (no aparece en la
 * copia de WordPress: el saneo dejó las direcciones en `@example.invalid`).
 * Los datos de redes sociales provienen del contenido publicado auditado.
 */

export const SITE = {
  name: 'Publia',
  domain: 'publia.mx',
  url: 'https://publia.mx',
  email: 'hola@publia.mx',
  emailSubject: 'Diagnóstico empresarial — Publia',
  city: 'Ciudad de México',
  country: 'México',
  whatsapp: 'https://wa.me/525573724660',
  socials: [
    { label: 'Facebook', href: 'http://facebook.com/publiamex' },
    { label: 'Instagram', href: 'http://instagram.com/publiamex' },
    { label: 'LinkedIn', href: 'https://www.linkedin.com/in/publiamex/' },
    { label: 'YouTube', href: 'https://www.youtube.com/@publiamx' },
  ],
} as const;

/** Enlace de correo con el contexto de navegación (sin datos personales). */
export function buildMailto(context: { route: string; traits: string[] }): string {
  const routeLabel: Record<string, string> = {
    unclassified: 'sin ruta elegida',
    enterprise: 'empresa',
    efficiency: 'eficiencia',
    explorer: 'exploración',
  };
  const route = routeLabel[context.route] ?? context.route;
  const traits = context.traits.length > 0 ? context.traits.join(', ') : 'ninguno';
  const body = [
    'Contexto de navegación (se comparte sólo para no repetirme):',
    `Ruta: ${route}`,
    `Intereses detectados: ${traits}`,
    '',
    'Qué quiero conseguir:',
    '',
  ].join('\n');
  const subject = encodeURIComponent(`${SITE.emailSubject} (${route})`);
  return `mailto:${SITE.email}?subject=${subject}&body=${encodeURIComponent(body)}`;
}
