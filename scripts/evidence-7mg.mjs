/**
 * Evidencia 7M-G: capturas acreditadas por viewport + 3 videos de scroll real.
 * Cada PNG lleva sidecar JSON con: escena, rect visible, opacidad final,
 * estado de carga 3D (ready/fallback), título correcto y ruta.
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
// escenas acreditadas por viewport (las exigidas por 7M-G)
const TARGETS = [
  { id: 'E01', sel: '[data-hero-scene]', title: 'EL MUNDO' },
  { id: 'E00', sel: '#escena-e00', title: 'independencia' },
  { id: 'E03', sel: '#escena-e03', title: 'inteligencia' },
  { id: 'E25', sel: '#escena-e25', title: '' },
  { id: 'E27', sel: '#escena-e27', title: '' },
];

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
  () => ['ready', 'fallback', 'error'].includes(document.querySelector('.prism-layer')?.getAttribute('data-load-state') ?? ''),
  null,
  { timeout: 60000 },
).catch(() => {});

// --- capturas acreditadas ------------------------------------------------------
for (const [w, h] of VIEWPORTS) {
  const { ctx, page } = await newPage(w, h);
  await page.goto(BASE, { waitUntil: 'domcontentloaded', timeout: 90000 });
  await waitReady(page);
  await page.waitForTimeout(1500);
  for (const t of TARGETS) {
    await page.evaluate((s) => document.querySelector(s)?.scrollIntoView({ behavior: 'instant', block: 'start' }), t.sel);
    await page.waitForTimeout(2200);
    const meta = await page.evaluate((sel) => {
      const el = document.querySelector(sel);
      if (!el) return { found: false };
      const r = el.getBoundingClientRect();
      const cs = getComputedStyle(el);
      const title = el.querySelector('[data-role="title"]')?.textContent?.trim().slice(0, 80) ?? '';
      return {
        found: true,
        rect: { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) },
        opacity: cs.opacity,
        visibility: cs.visibility,
        loadState: document.querySelector('.prism-layer')?.getAttribute('data-load-state') ?? '',
        title,
        route: document.documentElement.dataset.route ?? '',
        act: document.documentElement.dataset.act ?? '',
      };
    }, t.sel);
    const name = `7mg-${w}x${h}-${t.id}.png`;
    await page.screenshot({ path: `${OUT}/${name}`, timeout: 90000 }).catch(() => {});
    await writeFile(`${OUT}/${name}.json`, JSON.stringify({ viewport: [w, h], scene: t.id, expectedTitle: t.title, ...meta }, null, 2));
    console.log('shot', name, JSON.stringify(meta).slice(0, 160));
  }
  await ctx.close();
}

// --- videos de scroll real ------------------------------------------------------
const recordScroll = async (name, w, h, script) => {
  const dir = `${VIDS}/7mg-${name}`;
  await mkdir(dir, { recursive: true });
  const { ctx, page } = await newPage(w, h, dir);
  await page.goto(BASE, { waitUntil: 'domcontentloaded', timeout: 90000 });
  await waitReady(page);
  await script(page);
  await page.waitForTimeout(1200);
  await ctx.close(); // cierra el video
  console.log('video', name);
};

// 1) ruta Empresa: click + scroll real por capítulos
await recordScroll('empresa', 1440, 900, async (page) => {
  await page.evaluate(() => { window.__publiaLastProgrammaticScroll = Date.now(); window.scrollTo(0, 0); document.querySelector('[data-route-choice="enterprise"]')?.click(); });
  await page.waitForFunction(() => document.documentElement.dataset.act === 'enterprise', null, { timeout: 30000 }).catch(() => {});
  for (let i = 0; i < 26; i++) { await page.mouse.wheel(0, 900); await page.waitForTimeout(450); }
});
// 2) ruta Eficiencia
await recordScroll('eficiencia', 1440, 900, async (page) => {
  await page.evaluate(() => { window.__publiaLastProgrammaticScroll = Date.now(); window.scrollTo(0, 0); document.querySelector('[data-route-choice="efficiency"]')?.click(); });
  await page.waitForFunction(() => document.documentElement.dataset.act === 'efficiency', null, { timeout: 30000 }).catch(() => {});
  for (let i = 0; i < 26; i++) { await page.mouse.wheel(0, 900); await page.waitForTimeout(450); }
});
// 3) exploración libre: pin completo de 18 pantallas + una reversión de scroll
await recordScroll('libre-pin', 1440, 900, async (page) => {
  await page.mouse.wheel(0, 400);
  await page.waitForFunction(() => document.documentElement.dataset.act === 'cooperative', null, { timeout: 30000 }).catch(() => {});
  for (let i = 0; i < 60; i++) { await page.mouse.wheel(0, 700); await page.waitForTimeout(320); } // recorre el pin 18×H
  for (let i = 0; i < 12; i++) { await page.mouse.wheel(0, -700); await page.waitForTimeout(320); } // reversión real
});

await browser.close();
console.log('EVIDENCIA LISTA');
