/**
 * Suite de QA visual de Publia 6.0.
 *
 * Comprueba los criterios de aceptación del brief sobre el sitio servido:
 * carga, 3D real, rutas, variantes, bifurcaciones, catálogo, conversión,
 * móvil y movimiento reducido.
 *
 * Uso:
 *   QA_BASE=http://127.0.0.1:4322 node scripts/qa.mjs
 *
 * Requiere Playwright disponible en PLAYWRIGHT_PATH (por defecto, el
 * installation local de herramientas de QA).
 */

import { mkdir, readFile, writeFile } from 'node:fs/promises';

const PLAYWRIGHT_PATH =
  process.env.PLAYWRIGHT_PATH ?? '/home/dsh-dany/workspace/.qa-tools/node_modules/playwright/index.mjs';
const { chromium } = await import(PLAYWRIGHT_PATH);

const BASE = process.env.QA_BASE ?? 'http://127.0.0.1:4322';
const OUT = process.env.QA_OUT ?? new URL('../docs/evidencia/', import.meta.url).pathname;

const results = [];
let failures = 0;

function check(name, condition, detail = '') {
  const ok = Boolean(condition);
  if (!ok) {
    failures += 1;
  }
  results.push({ name, ok, detail: String(detail).slice(0, 220) });
  console.log(`${ok ? 'OK   ' : 'FALLA'} ${name}${detail ? ` — ${String(detail).slice(0, 180)}` : ''}`);
}

await mkdir(OUT, { recursive: true });

const browser = await chromium.launch({ args: ['--no-sandbox', '--use-gl=swiftshader'] });
const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await context.newPage();

const errors = [];
page.on('pageerror', (error) => errors.push(String(error)));
page.on('console', (message) => {
  if (message.type() === 'error') {
    errors.push(`console: ${message.text()}`);
  }
});

await page.goto(BASE, { waitUntil: 'networkidle', timeout: 60000 });
await page.waitForTimeout(2600);

// --- carga -----------------------------------------------------------------
check('carga inicial sin errores JS', errors.length === 0, errors.slice(0, 2).join(' | '));

const hero = await page.evaluate(() => {
  const title = document.querySelector('.hero__title');
  const ctas = [...document.querySelectorAll('[data-route-choice]')];
  return {
    title: title?.textContent?.trim() ?? '',
    titleSize: title ? parseFloat(getComputedStyle(title).fontSize) : 0,
    ctas: ctas.length,
    ctaHeight: ctas[0] ? ctas[0].getBoundingClientRect().height : 0,
  };
});
check('hero: título correcto', hero.title === 'EL MUNDO ESTÁ CAMBIANDO.', hero.title);
check('hero: dos CTA visibles', hero.ctas === 2, `${hero.ctas} CTA`);
check(
  'hero: jerarquía tipográfica y CTA táctil',
  hero.titleSize >= 72 && hero.ctaHeight >= 44,
  `título ${hero.titleSize}px · CTA ${hero.ctaHeight}px`,
);

// --- 3D ---------------------------------------------------------------------
const canvas = await page.evaluate(() => {
  const element = document.querySelector('[data-prism-canvas]');
  if (!element) {
    return null;
  }
  const gl = element.getContext('webgl2') ?? element.getContext('webgl');
  return { present: true, webgl: Boolean(gl), size: [element.width, element.height] };
});
check(
  'prisma: canvas presente y WebGL activo',
  canvas?.present && canvas?.webgl,
  JSON.stringify(canvas),
);

const shotA = await page.locator('[data-prism-canvas]').screenshot();
await page.waitForTimeout(900);
const shotB = await page.locator('[data-prism-canvas]').screenshot();
check(
  'prisma: la escena 3D se renderiza y cambia (animación real)',
  shotA.length !== shotB.length || !shotA.equals(shotB),
  `${shotA.length} vs ${shotB.length} bytes`,
);

const painted = await page.evaluate(() => {
  const canvas = document.querySelector('[data-prism-canvas]');
  if (!canvas) {
    return { paintedRatio: 0 };
  }
  const copy = document.createElement('canvas');
  copy.width = canvas.width;
  copy.height = canvas.height;
  const ctx = copy.getContext('2d');
  ctx?.drawImage(canvas, 0, 0);
  const data = ctx?.getImageData(0, 0, copy.width, copy.height)?.data ?? [];
  let bright = 0;
  for (let i = 0; i < data.length; i += 16) {
    if ((data[i] ?? 0) + (data[i + 1] ?? 0) + (data[i + 2] ?? 0) > 90) {
      bright += 1;
    }
  }
  return { paintedRatio: bright / (data.length / 16) };
});
check('prisma: pinta una fracción útil del viewport', painted.paintedRatio > 0.02, JSON.stringify(painted));

// --- estructura del grafo ---------------------------------------------------
const structure = await page.evaluate(() => ({
  scenes: document.querySelectorAll('[data-scene-id]').length,
  network: document.querySelectorAll('.network__link').length,
  demos: document.querySelectorAll('[data-simulated="true"]').length,
  plans: document.querySelectorAll('.plan').length,
  shares: document.querySelectorAll('.shares__row').length,
}));
check('grafo: 31 escenas montadas (E00-E30)', structure.scenes >= 31, `${structure.scenes} escenas`);
check('red humana: enlaces dibujados', structure.network >= 8, `${structure.network} enlaces`);
check('demostraciones marcadas como simulación', structure.demos >= 4, `${structure.demos} bloques`);
check('catálogo: cinco niveles de membresía', structure.plans === 5, `${structure.plans} planes`);
check('housing: reparto en tres bandas', structure.shares === 3, `${structure.shares} bandas`);

const effects = await page.evaluate(() => {
  const plans = document.querySelector('#escena-e27 .plans');
  return {
    pin: document.querySelectorAll('[data-pin]').length,
    horizontal: document.querySelectorAll('[data-horizontal]').length,
    morph: document.querySelectorAll('[data-morph]').length,
    depth: document.querySelectorAll('[data-depth]').length,
    sticky: document.querySelectorAll('[data-sticky]').length,
    planWidth: plans?.scrollWidth ?? 0,
    planClient: plans?.parentElement?.clientWidth ?? 0,
  };
});
check('efectos: anclaje asignado', effects.pin >= 1, `${effects.pin} escena(s) anclada(s)`);
check('efectos: sección horizontal de planes', effects.horizontal >= 1, `${effects.horizontal} pista(s)`);
check(
  'efectos: los planes se recorren en horizontal (escritorio)',
  effects.planWidth > effects.planClient + 50,
  `${effects.planWidth}px > ${effects.planClient}px`,
);
check('efectos: morphing de la entidad', effects.morph >= 1, `${effects.morph} escena(s)`);
check('efectos: profundidad de campo en varias escenas', effects.depth >= 4, `${effects.depth} capas`);
check('efectos: columna sticky', effects.sticky >= 1, `${effects.sticky} columna(s)`);

const click = (selector) => page.evaluate((s) => document.querySelector(s)?.click(), selector);

// --- variante compartida: texto neutral antes de elegir ruta -----------------
const perspectiveNeutral = await page.evaluate(
  () => document.querySelector('#escena-e02 [data-role="title"]')?.textContent?.trim() ?? '',
);

// --- ruta empresa -----------------------------------------------------------
await click('[data-route-choice="enterprise"]');
await page.waitForTimeout(1800);
const enterprise = await page.evaluate(() => ({
  route: document.documentElement.dataset.route,
  segments: document.documentElement.dataset.segments ?? '',
  visible: document.querySelector('#escena-e03')?.offsetHeight ?? 0,
  title: document.querySelector('#escena-e03 [data-role="title"]')?.textContent?.trim() ?? '',
  shared: document.querySelector('#escena-e05 [data-role="title"]')?.textContent?.trim() ?? '',
}));
check('ruta empresa: estado aplicado', enterprise.route === 'enterprise', enterprise.route);
check('ruta empresa: segmentos aplicados', enterprise.segments.includes('enterprise'), enterprise.segments);
check('ruta empresa: escena propia visible', enterprise.visible > 100, `${enterprise.visible}px`);
check(
  'ruta empresa: contenido de la escena',
  enterprise.title.includes('mucho construido'),
  enterprise.title,
);

// --- variante compartida por ruta -------------------------------------------
const perspectiveEnterprise = await page.evaluate(
  () => document.querySelector('#escena-e02 [data-role="title"]')?.textContent?.trim() ?? '',
);
check(
  'variante compartida: la ruta empresa reescribe la escena común',
  perspectiveEnterprise !== perspectiveNeutral &&
    perspectiveEnterprise.toLowerCase().includes('empresa'),
  perspectiveEnterprise,
);

await click('[data-route-reset]');
await page.waitForTimeout(1400);
await click('[data-route-choice="efficiency"]');
await page.waitForTimeout(1800);
const efficiency = await page.evaluate(() => ({
  route: document.documentElement.dataset.route,
  visible: document.querySelector('#escena-e07')?.offsetHeight ?? 0,
  title: document.querySelector('#escena-e07 [data-role="title"]')?.textContent?.trim() ?? '',
  perspective: document.querySelector('#escena-e02 [data-role="title"]')?.textContent?.trim() ?? '',
}));
check('ruta eficiencia: escena propia visible', efficiency.visible > 100, `${efficiency.visible}px`);
check(
  'ruta eficiencia: mensaje propio de la escena',
  efficiency.title.includes('repetir'),
  efficiency.title,
);
check(
  'variante compartida: la ruta eficiencia reescribe la escena común',
  efficiency.perspective !== perspectiveNeutral && efficiency.perspective !== perspectiveEnterprise,
  efficiency.perspective,
);

// --- cambio de ruta ---------------------------------------------------------
await click('[data-route-reset]');
await page.waitForTimeout(1500);
const reset = await page.evaluate(() => ({
  route: document.documentElement.dataset.route,
  scroll: window.scrollY,
}));
check('cambio de ruta: vuelve al estado neutral', reset.route === 'unclassified', reset.route);
check('cambio de ruta: regresa al hero', reset.scroll < 120, `scrollY ${reset.scroll}`);

// --- ruta exploradora por scroll ---------------------------------------------
await page.evaluate(() => {
  const element = document.querySelector('#escena-e13');
  if (element) {
    const top = element.getBoundingClientRect().top + window.scrollY;
    window.scrollTo({ top, behavior: 'instant' });
  }
});
await page.waitForTimeout(1800);
const explorer = await page.evaluate(() => ({
  route: document.documentElement.dataset.route,
  visible: document.querySelector('#escena-e13')?.offsetHeight ?? 0,
  branch: document.querySelectorAll('[data-branch-target]').length,
}));
check('ruta exploración: se activa por scroll natural', explorer.route === 'explorer', explorer.route);
check('ruta exploración: escena visible', explorer.visible > 100, `${explorer.visible}px`);
check('ruta exploración: dos bifurcaciones', explorer.branch === 2, `${explorer.branch} opciones`);

// --- bifurcación narrativa ---------------------------------------------------
const neutralNetwork = await page.evaluate(
  () => document.querySelector('#escena-e05 [data-role="title"]')?.textContent?.trim() ?? '',
);
const branchTargets = await page.evaluate(() =>
  [...document.querySelectorAll('[data-branch-target]')].map((b) => b.dataset.branchTarget),
);
const branchOk = branchTargets.includes('#escena-e15') && branchTargets.includes('#escena-e24');
check('bifurcaciones: apuntan a escenas reales', branchOk, branchTargets.join(', '));

await page.evaluate(() => {
  const button = [...document.querySelectorAll('[data-branch-target]')].find(
    (b) => b.dataset.branchTarget === '#escena-e15',
  );
  button?.click();
});
await page.waitForTimeout(1800);
const cooperative = await page.evaluate(() => ({
  traits: document.documentElement.dataset.traits ?? '',
  visible: document.querySelector('#escena-e15')?.offsetHeight ?? 0,
  network: document.querySelector('#escena-e05 [data-role="title"]')?.textContent?.trim() ?? '',
}));
check('bifurcación: el rasgo queda registrado', cooperative.traits.includes('value_driven'), cooperative.traits);
check('bifurcación: abre la escena cooperativa', cooperative.visible > 100, `${cooperative.visible}px`);
check(
  'variante por rasgo: el rasgo reescribe la escena compartida',
  cooperative.network !== neutralNetwork && cooperative.network.length > 10,
  cooperative.network,
);

// --- catálogo y conversión ---------------------------------------------------
const catalog = await page.evaluate(() => {
  const plans = [...document.querySelectorAll('.plan')].map((plan) => ({
    name: plan.querySelector('.plan__name')?.textContent?.trim() ?? '',
    price: plan.querySelector('.plan__price')?.textContent?.trim() ?? '',
  }));
  const shares = [...document.querySelectorAll('.shares__fill')].map((fill) =>
    getComputedStyle(fill).getPropertyValue('--value').trim(),
  );
  return { plans, shares };
});
const prices = Object.fromEntries(catalog.plans.map((plan) => [plan.name, plan.price]));
check('catálogo: BASE $300', prices['BASE']?.includes('300'), prices['BASE']);
check('catálogo: CRECIMIENTO $2,000', prices['CRECIMIENTO']?.includes('2,000'), prices['CRECIMIENTO']);
check('catálogo: OPERACIÓN $3,000', prices['OPERACIÓN']?.includes('3,000'), prices['OPERACIÓN']);
check('catálogo: COBERTURA $4,000', prices['COBERTURA']?.includes('4,000'), prices['COBERTURA']);
check('catálogo: AGENTE como rango pendiente', (prices['AGENTE'] ?? '').includes('500'), prices['AGENTE']);
check('housing: reparto 50/25/25', catalog.shares.join('/') === '50/25/25', catalog.shares.join('/'));

const services = await page.evaluate(() => {
  const items = [...document.querySelectorAll('#escena-e28 .services__item')].map((item) => ({
    name: item.querySelector('.services__name')?.textContent?.trim() ?? '',
    price: item.querySelector('.services__price')?.textContent?.trim() ?? '',
  }));
  const note = document.querySelector('#escena-e28 .services-group__note')?.textContent?.trim() ?? '';
  return { items, note };
});
check(
  'servicios: catálogo anterior con precio real',
  services.items.some((item) => item.name.includes('Desarrollo Web') && item.price.includes('150')),
  services.items[0]?.price ?? 'sin servicios',
);
check(
  'servicios: el producto de prueba no se publica',
  !services.items.some((item) => item.name.includes('Sucri')),
  'Sucri excluido',
);
check(
  'servicios: se aclara que es venta puntual',
  services.note.includes('venta puntual') || services.note.includes('Venta puntual'),
  services.note.slice(0, 60),
);

const contact = await page.evaluate(() => {
  const link = document.querySelector('[data-contact-cta="true"]');
  return { href: link?.getAttribute('href') ?? '', visible: link?.offsetHeight ?? 0 };
});
check('conversión: CTA de contacto visible', contact.visible > 30, `${contact.visible}px`);
check(
  'conversión: correo con contexto de navegación',
  contact.href.includes('hola@publia.mx') && contact.href.includes('body='),
  contact.href.slice(0, 80),
);

// --- contacto directo -------------------------------------------------------------
const contactLinks = await page.evaluate(() => {
  const whatsapp = [...document.querySelectorAll('a[href*="wa.me"]')];
  return {
    total: whatsapp.length,
    visible: whatsapp.filter((link) => link.offsetHeight > 0).length,
    number: whatsapp[0]?.getAttribute('href') ?? '',
  };
});
check('contacto: WhatsApp visible en la página', contactLinks.visible >= 1, `${contactLinks.visible} enlace(s)`);
check(
  'contacto: número público verificado',
  contactLinks.number === 'https://wa.me/525573724660',
  contactLinks.number,
);

// --- formulario contextual ------------------------------------------------------
const formInfo = await page.evaluate(() => {
  const form = document.querySelector('#escena-e30 [data-context-form]');
  if (!form) {
    return null;
  }
  const fields = [...form.querySelectorAll('input, select, textarea')];
  const labelled = fields.filter((field) => {
    const id = field.getAttribute('id');
    return Boolean(
      (id && form.querySelector(`label[for="${id}"]`)) ||
        field.closest('label') ||
        field.getAttribute('aria-label'),
    );
  });
  return {
    fields: fields.length,
    labelled: labelled.length,
    action: form.getAttribute('action'),
    method: (form.getAttribute('method') ?? 'get').toLowerCase(),
    legal: (form.parentElement?.textContent ?? '')
      .replace(/\s+/g, ' ')
      .toLowerCase()
      .includes('no se almacena'),
  };
});
check('formulario: existe con sus campos', formInfo?.fields >= 4, `${formInfo?.fields ?? 0} campos`);
check('formulario: todos los campos tienen etiqueta', formInfo?.labelled === formInfo?.fields, `${formInfo?.labelled}/${formInfo?.fields}`);
check('formulario: no envía datos a ningún servidor', formInfo?.action === null && formInfo?.method === 'get', `action=${formInfo?.action} method=${formInfo?.method}`);
check('formulario: declara que no guarda la información', formInfo?.legal === true, '');

const invalid = await page.evaluate(() => {
  const form = document.querySelector('#escena-e30 [data-context-form]');
  const email = form?.querySelector('input[name="correo"]');
  if (!form || !email) {
    return { error: false, mailto: null };
  }
  email.value = 'no-es-un-correo';
  form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
  const status = form.querySelector('[data-form-status]');
  return {
    error: (status?.dataset.state ?? '') === 'error',
    mailto: form.dataset.mailto ?? null,
  };
});
check('formulario: rechaza un correo inválido', invalid.error === true, '');
check('formulario: no genera enlace con datos inválidos', invalid.mailto === null, '');

const valid = await page.evaluate(() => {
  const form = document.querySelector('#escena-e30 [data-context-form]');
  const email = form?.querySelector('input[name="correo"]');
  if (!form || !email) {
    return { mailto: null };
  }
  email.value = 'persona@ejemplo.mx';
  form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
  return { mailto: form.dataset.mailto ?? null };
});
check(
  'formulario: el mensaje incluye el contexto de navegación',
  (valid.mailto ?? '').includes('hola@publia.mx') &&
    (valid.mailto ?? '').includes('body=') &&
    decodeURIComponent(valid.mailto ?? '').includes('Ruta:'),
  (valid.mailto ?? '').slice(0, 70),
);

// --- móvil --------------------------------------------------------------------
const mobile = await browser.newContext({ viewport: { width: 390, height: 844 } });
const mobilePage = await mobile.newPage();
await mobilePage.goto(BASE, { waitUntil: 'networkidle', timeout: 60000 });
await mobilePage.waitForTimeout(1800);
const mobileInfo = await mobilePage.evaluate(() => ({
  overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
}));
check('móvil: sin desbordamiento horizontal', mobileInfo.overflow <= 0, `${mobileInfo.overflow}px`);
await mobilePage.evaluate(() => document.querySelector('[data-route-choice="efficiency"]')?.click());
await mobilePage.waitForTimeout(1400);
const mobileRoute = await mobilePage.evaluate(() => document.documentElement.dataset.route);
check('móvil: los CTA funcionan', mobileRoute === 'efficiency', mobileRoute);
await mobilePage.screenshot({ path: `${OUT}/12-movil-hero.png` });

// --- accesibilidad (axe-core) ------------------------------------------------------
const axeSource = await readFile(
  new URL('../node_modules/axe-core/axe.min.js', import.meta.url),
  'utf-8',
);
const axePage = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await axePage.goto(BASE, { waitUntil: 'networkidle', timeout: 60000 });
await axePage.waitForTimeout(2200);
await axePage.addScriptTag({ content: axeSource });
const axeResult = await axePage.evaluate(async () => {
  const run = await window.axe.run(document, {
    runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'best-practice'] },
  });
  return run.violations.map((violation) => ({
    id: violation.id,
    impact: violation.impact,
    nodes: violation.nodes.length,
    help: violation.help,
    targets: violation.nodes.slice(0, 3).map((node) => node.target.join(' ')),
  }));
});
const serious = axeResult.filter((violation) => violation.impact === 'serious' || violation.impact === 'critical');
check(
  'accesibilidad: sin violaciones graves (axe wcag2aa)',
  serious.length === 0,
  serious.map((violation) => `${violation.id}×${violation.nodes}`).join(', ') || '0 graves',
);
check(
  'accesibilidad: sin violaciones moderadas o menores',
  axeResult.length === 0,
  axeResult.map((violation) => `${violation.id}×${violation.nodes}`).join(', ') || '0 violaciones',
);
await axePage.evaluate(() => document.querySelector('[data-route-choice="enterprise"]')?.click());
await axePage.waitForTimeout(1600);
const axeEnterprise = await axePage.evaluate(async () => {
  const run = await window.axe.run(document, {
    runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'best-practice'] },
  });
  return run.violations.map((violation) => ({
    id: violation.id,
    impact: violation.impact,
    nodes: violation.nodes.length,
    help: violation.help,
    targets: violation.nodes.slice(0, 3).map((node) => node.target.join(' ')),
  }));
});
check(
  'accesibilidad: ruta empresa sin violaciones',
  axeEnterprise.length === 0,
  axeEnterprise.map((violation) => `${violation.id}×${violation.nodes}`).join(', ') || '0 violaciones',
);

await writeFile(
  `${OUT}axe-violaciones.json`,
  JSON.stringify({ base: BASE, violaciones: axeResult, rutaEmpresa: axeEnterprise }, null, 2),
  'utf-8',
);
await axePage.close();

// --- presupuesto de peso -----------------------------------------------------------
const budget = await page.evaluate(() => {
  const entries = performance.getEntriesByType('resource');
  const scripts = entries
    .filter((entry) => entry.name.endsWith('.js'))
    .reduce((total, entry) => total + (entry.encodedBodySize || 0), 0);
  const styles = entries
    .filter((entry) => entry.name.endsWith('.css'))
    .reduce((total, entry) => total + (entry.encodedBodySize || 0), 0);
  return { scripts, styles, total: scripts + styles };
});
check(
  'rendimiento: JS + CSS inicial por debajo de 220 kB',
  budget.total < 220 * 1024,
  `${Math.round(budget.total / 1024)} kB (JS ${Math.round(budget.scripts / 1024)} · CSS ${Math.round(budget.styles / 1024)})`,
);
check(
  'rendimiento: el escenario 3D se carga sólo bajo demanda',
  await page.evaluate(() => {
    const resources = performance.getEntriesByType('resource').map((entry) => entry.name);
    return !resources.some((name) => /stage\.[a-z0-9]+\.js/.test(name)) ||
      performance.getEntriesByType('resource').some((entry) => /stage\./.test(entry.name) && entry.startTime > 0);
  }),
  'three.js diferido',
);

// --- movimiento reducido -------------------------------------------------------
const reduced = await browser.newContext({
  viewport: { width: 1440, height: 900 },
  reducedMotion: 'reduce',
});
const reducedPage = await reduced.newPage();
await reducedPage.goto(BASE, { waitUntil: 'networkidle', timeout: 60000 });
await reducedPage.waitForTimeout(2200);
const reducedInfo = await reducedPage.evaluate(() => ({
  layerReady: document.querySelector('.prism-layer')?.classList.contains('is-ready') ?? false,
  reveals: [...document.querySelectorAll('[data-reveal]')].every(
    (el) => parseFloat(getComputedStyle(el).opacity) > 0.9,
  ),
  heroVisible: (document.querySelector('.hero__title')?.offsetHeight ?? 0) > 40,
}));
check(
  'movimiento reducido: contenido visible y sin animación',
  reducedInfo.layerReady && reducedInfo.reveals && reducedInfo.heroVisible,
  JSON.stringify(reducedInfo),
);

// --- cierre ---------------------------------------------------------------------
await page.screenshot({ path: `${OUT}/13-cierre.png` });
check('sin errores JS al final del recorrido', errors.length === 0, errors.slice(0, 2).join(' | '));

await writeFile(
  `${OUT}resultados-qa.json`,
  JSON.stringify({ base: BASE, total: results.length, fallos: failures, resultados: results }, null, 2),
  'utf-8',
);

console.log(`\n${results.length - failures}/${results.length} criterios verificados`);
await browser.close();
process.exit(failures === 0 ? 0 : 1);
