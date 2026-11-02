#!/usr/bin/env node
/**
 * Servidor estático mínimo para `dist/`.
 *
 * Sustituye a `astro preview` cuando el sitio se publica detrás de un túnel
 * público: el preview de Astro usa el servidor de Vite, que rechaza por
 * defecto cualquier `Host` que no sea local (403) y no sirve el sitio con un
 * dominio real.
 *
 * Uso: node scripts/serve-dist.mjs [--port 8090] [--host 0.0.0.0] [--root dist]
 */

import { createReadStream, existsSync, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { extname, join, normalize, resolve, sep } from 'node:path';

const args = process.argv.slice(2);
const getArg = (name, fallback) => {
  const index = args.indexOf(`--${name}`);
  return index !== -1 && args[index + 1] ? args[index + 1] : fallback;
};

const port = Number(getArg('port', process.env.PORT ?? '8090'));
const host = getArg('host', '0.0.0.0');
const root = resolve(getArg('root', 'dist'));

if (!existsSync(root)) {
  console.error(`[serve-dist] no existe "${root}". Ejecuta primero: npm run build`);
  process.exit(1);
}

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.webmanifest': 'application/manifest+json',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.avif': 'image/avif',
  '.gif': 'image/gif',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.txt': 'text/plain; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8',
  '.pdf': 'application/pdf',
  '.mp4': 'video/mp4',
};

function resolveFile(urlPath) {
  const clean = decodeURIComponent(urlPath.split('?')[0] ?? '/');
  const candidate = resolve(join(root, normalize(clean)));
  // Sin path traversal fuera de dist/
  if (candidate !== root && !candidate.startsWith(root + sep)) return null;
  if (existsSync(candidate) && statSync(candidate).isFile()) return candidate;
  const withIndex = join(candidate, 'index.html');
  if (existsSync(withIndex) && statSync(withIndex).isFile()) return withIndex;
  const fallback = join(root, '404.html');
  return existsSync(fallback) ? fallback : null;
}

const server = createServer((req, res) => {
  const file = resolveFile(req.url ?? '/');
  if (!file) {
    res.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' });
    res.end('404 — no encontrado\n');
    return;
  }
  const extension = extname(file).toLowerCase();
  const isHashedAsset = file.includes(`${sep}_astro${sep}`);
  const isHtml = extension === '.html';
  res.writeHead(200, {
    'content-type': MIME[extension] ?? 'application/octet-stream',
    'cache-control': isHashedAsset
      ? 'public, max-age=31536000, immutable'
      : isHtml
        ? 'no-cache'
        : 'public, max-age=3600',
    'x-content-type-options': 'nosniff',
  });
  createReadStream(file).pipe(res);
});

server.listen(port, host, () => {
  console.log(`[serve-dist] ${root} -> http://${host}:${port}`);
});
