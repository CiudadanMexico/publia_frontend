/**
 * Evidencia 7M-H: capturas acreditadas por viewport + videos de scroll real.
 * Exigido por la orden 14-nov: E00, E03 (los 4 modos), E22 (ambas modalidades)
 * y E27 por viewport, con sidecar JSON (escena, rect, opacidad, loadState,
 * título, ruta/act). E00 es exclusivo de exploración libre: se arma con rueda.
 */
import { createRequire } from 'node:module';
import { mkdir, writeFile } from 'node:fs/promises';
const require = createRequire('/home/dsh-dany/workspace/publia-frontend/package.json');
const { chromium } = require('/home/dsh-dany/workspace/.qa-tools/node_modules/playwright/index.mjs');

const BASE = process.env.QA_BASE ?? 'https://dam-boulevard-explaining-alaska.trycloudflare.com';
const OUT = '/home/dsh-dany/workspace/publia-frontend/docs/audit/7mundos';
const VIDS = '/home/dsh-dany/workspace/publia-frontend/.tmp-vids';
await mkdir(OUT, { recursive: true });
await mkdir(VIDS, { recursive: true });

const browser = await chromium.launch({ args: ['--no-sandbox', '--use-gl=swiftshader'] });

const VIEWPORTS = [
  [390, 844],
  [768, 1024],
  [1366, 768],
  [1440, 900],
  [1920, 1080],
];
// escenas acreditadas 7M-H: E03 con los 4 modos y E22 con ambas modalidades
const MODES = ['local-private', 'local-collaborative', 'managed-housing', 'distributed-network'];

const newPage = async (w, h, videoDir) => {
  const ctx = await browser.newContext({
    viewport: { width: w, height: h },
    recordVideo: videoDir ? { dir: videoDir, size: { width: w, height: h } } : undefined,
  });
  const page = await ctx.newPage();
  await page.addInitScript(() => { try { history.scrollRestoration = 'manual'; } catch {} });
  await page.bringToFront();
  return { ctx, page };
};

const waitReady = (page) => page.waitForFunction(
  () => ['ready', 'silent', 'error'].includes(document.querySelector('.prism-layer')?.getAttribute('data-load-state') ?? ''),
  null,
  { timeout: 60000 },
).catch(() => {});

const armFree = async (page) => {
  await page.evaluate(() => { window.__publiaLastProgrammaticScroll = 0; });
  await page.mouse.wheel(0, 300);
  await page.waitForFunction(() => document.documentElement.dataset.act === 'cooperative', null, { timeout: 30000 }).catch(() => {});
  await page.waitForTimeout(400);
};

const shoot = async (page, w, h, id, sel, extraMeta = {}) => {
  await page.evaluate((s) => document.querySelector(s)?.scrollIntoView({ behavior: 'instant', block: 'start' }), sel);
  await page.waitForTimeout(2200);
  const meta = await page.evaluate((s) => {
    const el = document.querySelector(s);
    if (!el) return { found: false };
    const r = el.getBoundingClientRect();
    const cs = getComputedStyle(el);
    const title = el.querySelector('[data-role="title"], h2')?.textContent?.trim().slice(0, 90) ?? '';
    return {
      found: true,
      rect: { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) },
      opacity: cs.opacity,
      display: cs.display,
      loadState: document.querySelector('.prism-layer')?.getAttribute('data-load-state') ?? '',
      title,
      route: document.documentElement.dataset.route ?? '',
      act: document.documentElement.dataset.act ?? '',
    };
  }, sel);
  const name = `7mh-${w}x${h}-${id}.png`;
  await page.screenshot({ path: `${OUT}/${name}`, timeout: 90000 }).catch(() => {});
  await writeFile(`${OUT}/${name}.json`, JSON.stringify({ viewport: [w, h], scene: id, ...extraMeta, ...meta }, null, 2));
  console.log('shot', name, JSON.stringify(meta).slice(0, 170));
};

for (const [w, h] of VIEWPORTS) {
  const { ctx, page } = await newPage(w, h);
  await page.goto(BASE, { waitUntil: 'domcontentloaded', timeout: 90000 });
  await waitReady(page);
  await page.waitForTimeout(1500);
  // E01 hero
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(1200);
  await shoot(page, w, h, 'E01', '[data-hero-scene]', { expectedTitle: 'hero' });
  // E00: exclusivo de exploración libre
  await armFree(page);
  await shoot(page, w, h, 'E00', '#escena-e00', { expectedTitle: 'tu propio camino', routeRequired: 'explorer/unclassified' });
  // E03 cuatro modos (la ruta libre muestra todas las escenas)
  for (const m of MODES) {
    await page.evaluate((id) => document.querySelector(`#escena-e03 [data-infra7-mode="${id}"]`)?.click(), m);
    await page.waitForTimeout(1400);
    await shoot(page, w, h, `E03-${m}`, '#escena-e03', { infraMode: m, expectedTitle: 'Soberanía digital.' });
  }
  // E22 ambas modalidades
  await shoot(page, w, h, 'E22-compartido', '#escena-e22', { housing: 'compartido', expectedTitle: '¿Cómo quieres repartir tu capacidad?' });
  await page.evaluate(() => document.querySelector('#escena-e22 [data-housing-mode="privado"]')?.click());
  await page.waitForTimeout(900);
  await shoot(page, w, h, 'E22-privado', '#escena-e22', { housing: 'privado' });
  await page.evaluate(() => document.querySelector('#escena-e22 [data-housing-mode="compartido"]')?.click());
  // E27
  await shoot(page, w, h, 'E27', '#escena-e27', { expectedTitle: 'Una membresía para tu siguiente paso.' });
  await ctx.close();
}

// --- videos de scroll real ------------------------------------------------------
const recordScroll = async (name, w, h, script) => {
  const dir = `${VIDS}/7mh-${name}`;
  await mkdir(dir, { recursive: true });
  const { ctx, page } = await newPage(w, h, dir);
  await page.goto(BASE, { waitUntil: 'domcontentloaded', timeout: 90000 });
  await waitReady(page);
  await script(page);
  await page.waitForTimeout(1200);
  await ctx.close();
  console.log('video', name);
};

await recordScroll('empresa', 1440, 900, async (page) => {
  await page.evaluate(() => { window.__publiaLastProgrammaticScroll = Date.now(); window.scrollTo(0, 0); document.querySelector('[data-route-choice="enterprise"]')?.click(); });
  await page.waitForFunction(() => document.documentElement.dataset.act === 'enterprise', null, { timeout: 30000 }).catch(() => {});
  for (let i = 0; i < 26; i++) { await page.mouse.wheel(0, 900); await page.waitForTimeout(450); }
});
await recordScroll('eficiencia', 1440, 900, async (page) => {
  await page.evaluate(() => { window.__publiaLastProgrammaticScroll = Date.now(); window.scrollTo(0, 0); document.querySelector('[data-route-choice="efficiency"]')?.click(); });
  await page.waitForFunction(() => document.documentElement.dataset.act === 'efficiency', null, { timeout: 30000 }).catch(() => {});
  for (let i = 0; i < 26; i++) { await page.mouse.wheel(0, 900); await page.waitForTimeout(450); }
});
await recordScroll('libre-pin', 1440, 900, async (page) => {
  await page.mouse.wheel(0, 400);
  await page.waitForFunction(() => document.documentElement.dataset.act === 'cooperative', null, { timeout: 30000 }).catch(() => {});
  for (let i = 0; i < 60; i++) { await page.mouse.wheel(0, 700); await page.waitForTimeout(320); }
  for (let i = 0; i < 12; i++) { await page.mouse.wheel(0, -700); await page.waitForTimeout(320); }
});

await browser.close();
console.log('EVIDENCIA 7M-H LISTA');
