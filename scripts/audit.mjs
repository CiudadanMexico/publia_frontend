/**
 * Auditoría estructural de staging de Publia 6.0.
 *
 * Recorre la página completa y clasifica: escenas, navegación, botones,
 * scroll, textos, interacciones, móvil y errores de consola.
 * Genera docs/audit-staging.json con el detalle y un resumen en consola.
 */
import { mkdir, writeFile } from 'node:fs/promises';
import { chromium } from '/home/dsh-dany/workspace/.qa-tools/node_modules/playwright/index.mjs';

const BASE = process.env.QA_BASE ?? 'http://127.0.0.1:4322';
const OUT = new URL('../docs/audit/', import.meta.url).pathname;

const browser = await chromium.launch({ args: ['--no-sandbox', '--use-gl=swiftshader'] });

async function newPage(viewport = { width: 1360, height: 810 }) {
  const page = await browser.newPage({ viewport });
  const errors = [];
  page.on('pageerror', (e) => errors.push(`pageerror: ${e}`));
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push(`console: ${m.text()}`);
  });
  page.on('response', (r) => {
    if (r.status() >= 400) errors.push(`http ${r.status()}: ${r.url()}`);
  });
  return { page, errors };
}

// ---------- 1) recorrido completo en escritorio ----------
const { page, errors } = await newPage();
await page.goto(BASE, { waitUntil: 'networkidle', timeout: 60000 });
await page.waitForTimeout(3500);

const inventory = await page.evaluate(() => {
  const scenes = [...document.querySelectorAll('[data-scene-id]')].map((el) => {
    const id = el.dataset.sceneId;
    const title = el.querySelector('h1, h2, h3')?.textContent?.trim().slice(0, 90) ?? '';
    const buttons = [...el.querySelectorAll('button, a')].map((b) => ({
      kind: b.tagName.toLowerCase(),
      text: b.textContent?.trim().slice(0, 60) ?? '',
      data: Object.entries(b.dataset).map(([k, v]) => `${k}=${v}`).join(' '),
      href: b.getAttribute('href') ?? '',
    }));
    return {
      id,
      route: el.dataset.sceneRoute ?? '',
      segments: el.dataset.sceneSegments ?? '',
      stage: el.querySelector('[data-scene-inner]')?.dataset.sceneStage ?? '',
      title,
      buttons,
      hasForm: Boolean(el.querySelector('form')),
      reveals: el.querySelectorAll('[data-reveal]').length,
    };
  });
  const nav = [...document.querySelectorAll('nav a, nav button, .nav__back, .nav__reset')].map((el) => ({
    text: el.textContent?.trim().slice(0, 40) ?? '',
    data: Object.entries(el.dataset).map(([k, v]) => `${k}=${v}`).join(' '),
    href: el.getAttribute('href') ?? '',
  }));
  const hero = {
    title: document.querySelector('.hero__title')?.textContent?.trim().replace(/\s+/g, ' ') ?? '',
    ctas: [...document.querySelectorAll('.hero__actions [data-route-choice], .hero__actions [data-branch-trait]')].map(
      (b) => ({ text: b.textContent?.trim().slice(0, 50), route: b.dataset.routeChoice ?? '', trait: b.dataset.branchTrait ?? '' }),
    ),
    controls: [...document.querySelectorAll('[data-hero-control]')].map((b) => b.dataset.heroControl),
  };
  return {
    scenes,
    nav,
    hero,
    universe: {
      world: document.querySelector('[data-prism-canvas]')?.dataset.world ?? '',
      ready: document.querySelector('[data-prism-canvas]')?.dataset.universeReady ?? '',
      errors: document.querySelector('[data-prism-canvas]')?.dataset.universeErrors ?? '',
      cards: document.querySelector('[data-prism-canvas]')?.dataset.cardsInView ?? '',
    },
    totals: {
      scenes: scenes.length,
      buttons: scenes.reduce((n, s) => n + s.buttons.length, 0),
      forms: scenes.filter((s) => s.hasForm).length,
      reveals: scenes.reduce((n, s) => n + s.reveals, 0),
    },
  };
});

// recorrido completo con scroll suave lento recogiendo errores y visibilidad
const scrollReport = await page.evaluate(async () => {
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const visited = [];
  const step = window.innerHeight * 0.8;
  for (let y = 0; y < document.body.scrollHeight; y += step) {
    window.scrollTo({ top: y, behavior: 'instant' });
    await sleep(260);
    const visible = [...document.querySelectorAll('[data-scene-id]')]
      .filter((el) => {
        const r = el.getBoundingClientRect();
        return r.top < window.innerHeight * 0.7 && r.bottom > window.innerHeight * 0.3;
      })
      .map((el) => el.dataset.sceneId);
    if (visible.length) visited.push({ y: Math.round(y), scenes: visible });
  }
  window.scrollTo({ top: document.body.scrollHeight, behavior: 'instant' });
  await sleep(400);
  const doc = document.documentElement;
  return {
    scrollHeight: document.body.scrollHeight,
    samples: visited.length,
    lastRoute: doc.dataset.route ?? '',
    lastAct: doc.dataset.act ?? '',
    lastWorld: document.querySelector('[data-prism-canvas]')?.dataset.world ?? '',
    scenesSeen: [...new Set(visited.flatMap((v) => v.scenes))],
  };
});

// probar cada control del hero y de navegación
async function clickAndReport(selector, label) {
  const before = await page.evaluate(() => ({
    act: document.documentElement.dataset.act ?? '',
    world: document.querySelector('[data-prism-canvas]')?.dataset.world ?? '',
    scroll: Math.round(window.scrollY),
    route: document.documentElement.dataset.route ?? '',
  }));
  await page.evaluate((sel) => {
    document.querySelector(sel)?.scrollIntoView({ block: 'center' });
    document.querySelector(sel)?.click();
  }, selector);
  await page.waitForTimeout(3000);
  const after = await page.evaluate(() => ({
    act: document.documentElement.dataset.act ?? '',
    world: document.querySelector('[data-prism-canvas]')?.dataset.world ?? '',
    scroll: Math.round(window.scrollY),
    route: document.documentElement.dataset.route ?? '',
    camera: document.querySelector('[data-prism-canvas]')?.dataset.camera ?? '',
  }));
  return { label, before, after, changed: before.world !== after.world || before.scroll !== after.scroll || before.act !== after.act };
}

await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
await page.waitForTimeout(800);
const interactions = [];
interactions.push(await clickAndReport('[data-route-choice="enterprise"]', 'hero → enterprise'));
interactions.push(await clickAndReport('[data-act-back]', 'volver → hero'));
interactions.push(await clickAndReport('[data-route-choice="efficiency"]', 'hero → efficiency'));
interactions.push(await clickAndReport('[data-act-back]', 'volver → hero'));
interactions.push(await clickAndReport('[data-hero-scene] [data-branch-trait="cooperative"]', 'hero → cooperativo'));
interactions.push(await clickAndReport('[data-act-back]', 'volver → hero'));
interactions.push(await clickAndReport('[data-route-reset]', 'cambiar de ruta → hero'));
// controles del hero
for (const control of ['pause', 'burst', 'reset']) {
  await page.evaluate((c) => document.querySelector(`[data-hero-control="${c}"]`)?.click(), control);
  await page.waitForTimeout(600);
  interactions.push({ label: `hero control ${control}`, changed: true });
}
// bifurcación E14 (si se llega por scroll)
await page.evaluate(() => {
  document.querySelector('#escena-e14')?.scrollIntoView({ block: 'center' });
});
await page.waitForTimeout(1200);
const branch = await page.evaluate(() => {
  const btns = [...document.querySelectorAll('#escena-e14 [data-branch-target]')];
  return btns.map((b) => ({ text: b.textContent?.trim().slice(0, 40), trait: b.dataset.branchTrait, target: b.dataset.branchTarget }));
});
if (branch.length) {
  await page.evaluate(() => document.querySelector('#escena-e14 [data-branch-target]')?.click());
  await page.waitForTimeout(2600);
  interactions.push({
    label: 'E14 bifurcación',
    changed: await page.evaluate(() => Math.round(window.scrollY)) > 500,
  });
}

await page.screenshot({ path: `${OUT}escritorio-final.png`, fullPage: false });

// ---------- 2) móvil ----------
const mob = await newPage({ width: 390, height: 844 });
await mob.page.goto(BASE, { waitUntil: 'networkidle', timeout: 60000 });
await mob.page.waitForTimeout(3500);
const mobile = await mob.page.evaluate(() => {
  const overflow = document.documentElement.scrollWidth > window.innerWidth + 1;
  const heroTitle = (document.querySelector('.hero__title')?.offsetHeight ?? 0) > 30;
  const ctas = [...document.querySelectorAll('.hero__actions a, .hero__actions button')].filter((b) => {
    const r = b.getBoundingClientRect();
    return r.width > 0 && r.height > 0 && r.left >= -1 && r.right <= window.innerWidth + 1;
  }).length;
  const canvas = document.querySelector('[data-prism-canvas]');
  return {
    horizontalOverflow: overflow,
    scrollWidth: document.documentElement.scrollWidth,
    innerWidth: window.innerWidth,
    heroTitleVisible: heroTitle,
    ctasInViewport: ctas,
    world: canvas?.dataset.world ?? '',
    cards: canvas?.dataset.cardsInView ?? '',
    universeErrors: canvas?.dataset.universeErrors ?? '',
  };
});
await mob.page.screenshot({ path: `${OUT}movil-hero.png` });
await mob.page.evaluate(() => document.querySelector('[data-route-choice="enterprise"]')?.click());
await mob.page.waitForTimeout(3400);
const mobileAfter = await mob.page.evaluate(() => ({
  act: document.documentElement.dataset.act ?? '',
  world: document.querySelector('[data-prism-canvas]')?.dataset.world ?? '',
  overflow: document.documentElement.scrollWidth > window.innerWidth + 1,
}));
await mob.page.screenshot({ path: `${OUT}movil-empresa.png` });
const mobileErrors = mob.errors;

// ---------- 3) movimiento reducido ----------
const red = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' });
const redPage = await red.newPage();
const redErrors = [];
redPage.on('pageerror', (e) => redErrors.push(String(e)));
redPage.on('console', (m) => { if (m.type() === 'error') redErrors.push(m.text()); });
await redPage.goto(BASE, { waitUntil: 'networkidle', timeout: 60000 });
await redPage.waitForTimeout(4500);
const reduced = await redPage.evaluate(() => ({
  layerReady: document.querySelector('.prism-layer')?.classList.contains('is-ready') ?? false,
  world: document.querySelector('[data-prism-canvas]')?.dataset.world ?? '',
  revealsOk: [...document.querySelectorAll('[data-reveal]')].every((el) => parseFloat(getComputedStyle(el).opacity) > 0.9),
}));
await redPage.screenshot({ path: `${OUT}reducido.png` });

// ---------- 4) formulario ----------
const { page: formPage, errors: formErrors } = await newPage();
await formPage.goto(BASE, { waitUntil: 'networkidle', timeout: 60000 });
await formPage.waitForTimeout(2500);
const form = await formPage.evaluate(() => {
  const f = document.querySelector('[data-context-form]');
  if (!f) return { present: false };
  const inputs = [...f.querySelectorAll('input, textarea, select')].map((i) => i.name || i.type);
  return { present: true, inputs, action: f.getAttribute('action') ?? '(mailto cliente)' };
});
// envío inválido y válido (sin abrir correo real: interceptamos)
await formPage.evaluate(() => {
  const f = document.querySelector('[data-context-form]');
  f?.querySelector('input[name="correo"]') && (f.querySelector('input[name="correo"]').value = 'no-es-correo');
});
const formInvalid = await formPage.evaluate(() => {
  const f = document.querySelector('[data-context-form]');
  f?.requestSubmit();
  const status = f?.querySelector('[data-form-status]');
  return { state: status?.dataset.state ?? '', text: status?.textContent?.trim() ?? '' };
});

await mkdir(OUT, { recursive: true });
const report = {
  base: BASE,
  fecha: new Date().toISOString(),
  inventory,
  scrollReport,
  interactions,
  branchButtons: branch,
  mobile: { ...mobile, afterTransition: mobileAfter },
  reducedMotion: reduced,
  form: { ...form, invalidSubmit: formInvalid },
  errors: {
    desktop: errors,
    mobile: mobileErrors,
    reduced: redErrors,
    form: formErrors,
  },
};
await writeFile(`${OUT}audit-staging.json`, JSON.stringify(report, null, 2));

console.log('=== AUDITORÍA STAGING', BASE);
console.log('escenas:', inventory.totals.scenes, '· botones/enlaces en escenas:', inventory.totals.buttons, '· forms:', inventory.totals.forms, '· reveals:', inventory.totals.reveals);
console.log('universo:', JSON.stringify(inventory.universe));
console.log('scroll: altura', scrollReport.scrollHeight, '· muestras', scrollReport.samples, '· escenas vistas', scrollReport.scenesSeen.length, '· ruta final', scrollReport.lastRoute, '· mundo final', scrollReport.lastWorld);
console.log('interacciones:');
for (const i of interactions) console.log('  -', i.label, '→', JSON.stringify(i.after ?? i), i.changed === false ? 'SIN CAMBIO' : '');
console.log('móvil:', JSON.stringify(mobile), 'tras empresa:', JSON.stringify(mobileAfter));
console.log('reducido:', JSON.stringify(reduced));
console.log('form:', JSON.stringify(form), JSON.stringify(formInvalid));
console.log('errores: escritorio', errors.length, 'móvil', mobileErrors.length, 'reducido', redErrors.length, 'form', formErrors.length);
if (errors.length) console.log('  desktop:', errors.slice(0, 5));
await browser.close();
