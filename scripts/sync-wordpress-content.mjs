#!/usr/bin/env node
/**
 * Sincroniza el snapshot de contenido desde el WordPress headless.
 *
 * Uso:
 *   npm run sync:content                       # usa WP_BASE_URL (por defecto http://127.0.0.1:6103)
 *   WP_BASE_URL=http://localhost:6103 npm run sync:content
 *
 * El script sólo lee del REST API público y escribe
 * `src/data/content.snapshot.json`. No toca la base de datos ni el WordPress.
 */

import { writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const outputPath = resolve(here, '..', 'src', 'data', 'content.snapshot.json');
const baseUrl = process.env.WP_BASE_URL ?? 'http://127.0.0.1:6103';

function stripHtml(value) {
  return String(value ?? '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&[a-z#0-9]+;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

async function fetchJson(path) {
  const url = `${baseUrl.replace(/\/$/, '')}${path}`;
  const response = await fetch(url, { headers: { Accept: 'application/json' } });
  if (!response.ok) {
    throw new Error(`HTTP ${response.status} en ${url}`);
  }
  return response.json();
}

const fields = 'id,slug,title,excerpt,link,modified';

const rawPages = await fetchJson(
  `/wp-json/wp/v2/pages?per_page=100&status=publish&_fields=${fields}`,
);
const rawProducts = await fetchJson(
  '/wp-json/wp/v2/product?per_page=100&status=publish&_fields=id,slug,title,excerpt,link,price,regular_price,currency',
);

const snapshot = {
  generatedAt: new Date().toISOString(),
  source: baseUrl,
  pages: rawPages.map((page) => ({
    id: page.id,
    slug: page.slug,
    title: stripHtml(page.title?.rendered),
    excerpt: stripHtml(page.excerpt?.rendered),
    link: page.link,
    modified: page.modified,
  })),
  products: rawProducts.map((product) => ({
    id: product.id,
    slug: product.slug,
    title: stripHtml(product.title?.rendered),
    excerpt: stripHtml(product.excerpt?.rendered),
    price: product.price,
    regularPrice: product.regular_price,
    currency: product.currency || 'MXN',
    link: product.link,
  })),
};

await writeFile(outputPath, `${JSON.stringify(snapshot, null, 2)}\n`, 'utf8');
console.log(
  `snapshot escrito: ${snapshot.pages.length} páginas, ${snapshot.products.length} productos → ${outputPath}`,
);
