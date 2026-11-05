/**
 * Comparación visual: referencia aprobada (HTML offline) vs staging.
 * Uso: node scripts/compare-ref.mjs <ruta-al-visualizador-aprobado.html>
 * Genera docs/audit/v4/ref-*.png, staging-*.png y comparativos lado a lado.
 */
import { chromium } from '/home/dsh-dany/workspace/.qa-tools/node_modules/playwright/index.mjs';
import sharp from 'sharp';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const REF = process.argv[2];
if (!REF) { console.error('falta la ruta al HTML aprobado'); process.exit(1); }
const STAGING = process.env.QA_BASE ?? 'https://kitty-midi-grid-liked.trycloudflare.com';
const OUT = resolve(dirname(fileURLToPath(import.meta.url)), '../docs/audit/v4');
const refUrl = 'file://' + resolve(REF);

const browser = await chromium.launch({ args: ['--no-sandbox', '--use-gl=swiftshader'] });

// 1) referencia aprobada: capturas a 0/25/50/75/100% del scroll
{
  const p = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await p.goto(refUrl, { waitUntil: 'load' });
  await p.waitForTimeout(1200);
  const h = await p.evaluate(() => document.body.scrollHeight - window.innerHeight);
  for (const f of [0, 0.25, 0.5, 0.75, 1]) {
    await p.evaluate((top) => window.scrollTo({ top, behavior: 'instant' }), Math.round(h * f));
    await p.waitForTimeout(450);
    await p.screenshot({ path: `${OUT}/ref-${String(Math.round(f * 100)).padStart(3, '0')}.png` });
  }
  await p.close();
}

// 2) staging: mismas fracciones (ruta neutra y cada mundo)
const routes = {
  'staging-neutral': null,
  'staging-empresa': 'enterprise',
  'staging-eficiencia': 'efficiency',
};
for (const [name, route] of Object.entries(routes)) {
  const p = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await p.addInitScript(() => { try { history.scrollRestoration = 'manual'; } catch {} });
  await p.goto(STAGING, { waitUntil: 'networkidle', timeout: 60000 });
  await p.waitForTimeout(3000);
  await p.evaluate(() => { try { sessionStorage.clear(); } catch {} });
  await p.goto(STAGING, { waitUntil: 'networkidle', timeout: 60000 });
  await p.waitForTimeout(2600);
  if (route) { await p.evaluate((r) => document.querySelector(`[data-route-choice="${r}"]`)?.click(), route); await p.waitForTimeout(3200); }
  const h = await p.evaluate(() => document.body.scrollHeight - window.innerHeight);
  for (const f of [0, 0.25, 0.5, 0.75, 1]) {
    await p.evaluate((top) => window.scrollTo({ top, behavior: 'instant' }), Math.round(h * f));
    await p.waitForTimeout(700);
    await p.screenshot({ path: `${OUT}/${name}-${String(Math.round(f * 100)).padStart(3, '0')}.png` });
  }
  await p.close();
}
// exploración por scroll
{
  const p = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await p.addInitScript(() => { try { history.scrollRestoration = 'manual'; } catch {} });
  await p.goto(STAGING, { waitUntil: 'networkidle', timeout: 60000 });
  await p.waitForTimeout(3000);
  await p.evaluate(() => { try { sessionStorage.clear(); } catch {} });
  await p.goto(STAGING, { waitUntil: 'networkidle', timeout: 60000 });
  await p.waitForTimeout(2600);
  await p.mouse.move(720, 450);
  await p.mouse.wheel(0, 120);
  await p.waitForTimeout(1500);
  const h = await p.evaluate(() => document.body.scrollHeight - window.innerHeight);
  for (const f of [0, 0.25, 0.5, 0.75, 1]) {
    await p.evaluate((top) => window.scrollTo({ top, behavior: 'instant' }), Math.round(h * f));
    await p.waitForTimeout(700);
    await p.screenshot({ path: `${OUT}/staging-exploracion-${String(Math.round(f * 100)).padStart(3, '0')}.png` });
  }
  await p.close();
}

// 3) comparativos lado a lado (ref vs staging-neutral)
for (const f of ['000', '025', '050', '075', '100']) {
  const a = await sharp(`${OUT}/ref-${f}.png`).resize(700, 437, { fit: 'cover' }).jpeg({ quality: 82 }).toBuffer();
  const b = await sharp(`${OUT}/staging-neutral-${f}.png`).resize(700, 437, { fit: 'cover' }).jpeg({ quality: 82 }).toBuffer();
  await sharp({ create: { width: 1410, height: 447, channels: 3, background: '#111' } })
    .composite([{ input: a, left: 0, top: 5 }, { input: b, left: 710, top: 5 }])
    .jpeg({ quality: 85 }).toFile(`${OUT}/comparativo-${f}.jpg`);
}
console.log('comparativos en docs/audit/v4/');
await browser.close();
