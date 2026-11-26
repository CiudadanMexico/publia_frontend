/**
 * Evidencia 7M-I: capturas "después" de E07, E11, E22, E27 y E30 por viewport
 * (los "antes" son las 7mh-* ya acreditadas de 7M-H) + videos del
 * comportamiento continuo de E07 y E11. Sin acreditar escenas ocultas:
 * se verifica display/rect antes de disparar.
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

const wheelTo = async (page, sel) => {
  for (let i = 0; i < 45; i++) {
    const st = await page.evaluate((s2) => {
      const el = document.querySelector(s2);
      if (!el) return { vis: false, dir: 1 };
      const b = el.getBoundingClientRect();
      return { vis: b.top < window.innerHeight * 0.72 && b.bottom > window.innerHeight * 0.15, dir: b.bottom <= window.innerHeight * 0.15 ? -1 : 1 };
    }, sel);
    const vis = st.vis;
    if (vis) return true;
    await page.evaluate((d) => {
      window.__publiaLastProgrammaticScroll = 0;
      window.dispatchEvent(new WheelEvent('wheel', { deltaY: d * 700, bubbles: true }));
      window.scrollBy({ top: d * 500, behavior: 'instant' });
    }, st.dir ?? 1);
    await page.waitForTimeout(280);
  }
  return false;
};

const shoot = async (page, w, h, id, sel, extraMeta = {}) => {
  await wheelTo(page, sel); // rueda real: el controlador de ruta no reimpone scrollTo
  await page.waitForTimeout(2600); // demos auto-cíclicas: dejar que avancen
  const meta = await page.evaluate((s) => {
    const el = document.querySelector(s);
    if (!el) return { found: false };
    const r = el.getBoundingClientRect();
    const cs = getComputedStyle(el);
    const title = el.querySelector('[data-role="title"], h2')?.textContent?.trim().slice(0, 90) ?? '';
    return {
      found: true,
      visible: cs.display !== 'none' && cs.visibility !== 'hidden' && r.width > 0 && r.height > 0,
      rect: { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) },
      opacity: cs.opacity,
      loadState: document.querySelector('.prism-layer')?.getAttribute('data-load-state') ?? '',
      title,
      route: document.documentElement.dataset.route ?? '',
      act: document.documentElement.dataset.act ?? '',
    };
  }, sel);
  if (!meta.found || !meta.visible) {
    console.log('SKIP (oculta/cero)', id, JSON.stringify(meta).slice(0, 120));
    return;
  }
  const name = `7mi-${w}x${h}-${id}.png`;
  await page.screenshot({ path: `${OUT}/${name}`, timeout: 90000 }).catch(() => {});
  await writeFile(`${OUT}/${name}.json`, JSON.stringify({ viewport: [w, h], scene: id, ...extraMeta, ...meta }, null, 2));
  console.log('shot', name, JSON.stringify(meta).slice(0, 170));
};

for (const [w, h] of VIEWPORTS) {
  const { ctx, page } = await newPage(w, h);
  await page.goto(BASE, { waitUntil: 'domcontentloaded', timeout: 90000 });
  await waitReady(page);
  await page.waitForTimeout(1500);
  // ruta eficiencia para E07 visible; E11/E22/E27/E30 son compartidas (visibles en cualquier ruta tras reset)
  await page.evaluate(() => { window.__publiaLastProgrammaticScroll = Date.now(); window.scrollTo(0, 0); document.querySelector('[data-route-choice="efficiency"]')?.click(); });
  await page.waitForFunction(() => document.documentElement.dataset.act === 'efficiency', null, { timeout: 30000 }).catch(() => {});
  await page.waitForTimeout(1200);
  await shoot(page, w, h, 'E07', '#escena-e07', { expectedTitle: 'RECUPÉRALO', note: 'demo auto-cíclica' });
  await shoot(page, w, h, 'E11', '#escena-e11', { expectedTitle: 'Persona real', note: 'demo auto-cíclica horizontal' });
  // E22 ambas modalidades
  await shoot(page, w, h, 'E22-compartido', '#escena-e22', { housing: 'compartido', expectedTitle: '¿Cómo quieres repartir tu capacidad?' });
  await page.evaluate(() => document.querySelector('#escena-e22 [data-housing-mode="privado"]')?.click());
  await page.waitForTimeout(900);
  await shoot(page, w, h, 'E22-privado', '#escena-e22', { housing: 'privado', note: 'racks privados' });
  await page.evaluate(() => document.querySelector('#escena-e22 [data-housing-mode="compartido"]')?.click());
  await shoot(page, w, h, 'E27', '#escena-e27', { expectedTitle: 'Elige tu combinación' });
  await shoot(page, w, h, 'E30', '#escena-e30', { expectedTitle: 'Vamos a conocernos', note: 'un solo formulario' });
  await ctx.close();
}

// --- videos del comportamiento continuo de E07 y E11 ----------------------------
const recordDemo = async (name, sceneSel, w, h) => {
  const dir = `${VIDS}/7mi-${name}`;
  await mkdir(dir, { recursive: true });
  const { ctx, page } = await newPage(w, h, dir);
  await page.goto(BASE, { waitUntil: 'domcontentloaded', timeout: 90000 });
  await waitReady(page);
  await page.evaluate(() => { window.__publiaLastProgrammaticScroll = Date.now(); window.scrollTo(0, 0); document.querySelector('[data-route-choice="efficiency"]')?.click(); });
  await page.waitForFunction(() => document.documentElement.dataset.act === 'efficiency', null, { timeout: 30000 }).catch(() => {});
  await wheelTo(page, sceneSel);
  await page.waitForTimeout(26000); // ≈ 4+ ciclos de 4 etapas a 1.4–1.5 s
  await ctx.close();
  console.log('video', name);
};
await recordDemo('e07-continuo', '#escena-e07', 1440, 900);
await recordDemo('e11-continuo', '#escena-e11', 1440, 900);

await browser.close();
console.log('EVIDENCIA 7M-I LISTA');
