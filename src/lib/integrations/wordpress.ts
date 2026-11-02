/**
 * Adaptador de WordPress (CMS headless).
 *
 * Reglas:
 * - El frontend nunca habla con WordPress en tiempo de ejecución: el contenido
 *   se resuelve en compilación y se guarda como snapshot local.
 * - Si la API no está disponible, se usa el snapshot versionado: la
 *   compilación nunca depende de la disponibilidad del CMS.
 * - No se exponen credenciales: sólo lectura pública del REST API.
 */

import snapshot from '../../data/content.snapshot.json';

export interface WordPressPage {
  id: number;
  slug: string;
  title: string;
  excerpt: string;
  link: string;
  modified: string;
}

export interface WordPressProduct {
  id: number;
  slug: string;
  title: string;
  excerpt: string;
  price: string;
  regularPrice: string;
  currency: string;
  link: string;
}

export interface WordPressSnapshot {
  generatedAt: string;
  source: string;
  pages: WordPressPage[];
  products: WordPressProduct[];
}

export const LOCAL_SNAPSHOT = snapshot as WordPressSnapshot;

export interface FetchOptions {
  baseUrl: string;
  perPage?: number;
  timeoutMs?: number;
}

async function fetchJson<T>(url: string, timeoutMs: number): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: { Accept: 'application/json' },
    });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status} en ${url}`);
    }
    return (await response.json()) as T;
  } finally {
    clearTimeout(timer);
  }
}

function stripHtml(value: string): string {
  return value
    .replace(/<[^>]*>/g, ' ')
    .replace(/&[a-z#0-9]+;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Descarga páginas y productos publicados. Pensado para el paso de sync. */
export async function fetchWordPressContent(options: FetchOptions): Promise<WordPressSnapshot> {
  const { baseUrl, perPage = 100, timeoutMs = 15000 } = options;
  const root = baseUrl.replace(/\/$/, '');

  const [rawPages, rawProducts] = await Promise.all([
    fetchJson<Array<Record<string, unknown>>>(
      `${root}/wp-json/wp/v2/pages?per_page=${perPage}&status=publish&_fields=id,slug,title,excerpt,link,modified`,
      timeoutMs,
    ),
    fetchJson<Array<Record<string, unknown>>>(
      `${root}/wp-json/wp/v2/product?per_page=${perPage}&status=publish&_fields=id,slug,title,excerpt,link,price,regular_price,currency`,
      timeoutMs,
    ),
  ]);

  const pages: WordPressPage[] = rawPages.map((page) => ({
    id: Number(page['id']),
    slug: String(page['slug']),
    title: stripHtml(String((page['title'] as { rendered?: string })?.rendered ?? '')),
    excerpt: stripHtml(String((page['excerpt'] as { rendered?: string })?.rendered ?? '')),
    link: String(page['link'] ?? ''),
    modified: String(page['modified'] ?? ''),
  }));

  const products: WordPressProduct[] = rawProducts.map((product) => ({
    id: Number(product['id']),
    slug: String(product['slug']),
    title: stripHtml(String((product['title'] as { rendered?: string })?.rendered ?? '')),
    excerpt: stripHtml(String((product['excerpt'] as { rendered?: string })?.rendered ?? '')),
    price: String(product['price'] ?? ''),
    regularPrice: String(product['regular_price'] ?? ''),
    currency: String(product['currency'] ?? 'MXN'),
    link: String(product['link'] ?? ''),
  }));

  return {
    generatedAt: new Date().toISOString(),
    source: root,
    pages,
    products,
  };
}

/** Contenido disponible en compilación, con respaldo en el snapshot local. */
export async function resolveContent(): Promise<WordPressSnapshot> {
  const baseUrl = import.meta.env['PUBLIC_WP_BASE_URL'];
  if (!baseUrl) {
    return LOCAL_SNAPSHOT;
  }
  try {
    return await fetchWordPressContent({ baseUrl });
  } catch (error) {
    console.warn(
      `[wordpress] no se pudo contactar el CMS (${String(error)}); se usa el snapshot local.`,
    );
    return LOCAL_SNAPSHOT;
  }
}
