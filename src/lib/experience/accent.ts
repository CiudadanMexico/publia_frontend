/**
 * Convierte `**palabra**` en <em class="accent"> para acentos tipográficos
 * (amarillo Publia) sin romper el escape de HTML.
 */
export function accentify(text: string): string {
  const escaped = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
  return escaped.replace(/\*\*(.+?)\*\*/g, '<em>$1</em>');
}
