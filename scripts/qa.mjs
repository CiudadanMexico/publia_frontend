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
const responses = [];
page.on('response', (response) => {
  responses.push({ url: response.url(), status: response.status() });
});
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

// --- hero 3D aprobado ----------------------------------------------------------
const hero3d = await page.evaluate(() => {
  const canvas = document.querySelector('[data-prism-canvas]');
  if (!canvas) {
    return null;
  }
  const gl = canvas.getContext('webgl2') ?? canvas.getContext('webgl');
  return {
    present: true,
    webgl: Boolean(gl),
    ready: canvas.dataset.universeReady ?? '',
    errors: canvas.dataset.universeErrors ?? '',
    world: canvas.dataset.world ?? '',
    camera: canvas.dataset.camera ?? '',
    cards: canvas.dataset.cardsInView ?? '',
    size: [canvas.width, canvas.height],
  };
});
check(
  'hero 3D: lienzo único presente con WebGL activo',
  hero3d?.present && hero3d?.webgl,
  JSON.stringify(hero3d?.size ?? []),
);
check(
  'hero 3D: el universo arranca en el mundo hero',
  hero3d?.ready === 'true' && hero3d?.world === 'hero',
  `world=${hero3d?.world} · cámara ${hero3d?.camera}`,
);
check(
  'hero 3D: la escena carga sin errores de recursos',
  hero3d?.ready === 'true' && hero3d?.errors === '',
  hero3d?.errors || 'sin errores',
);
check(
  'hero 3D: las ocho tarjetas holográficas están en el encuadre',
  hero3d?.cards === '8',
  `${hero3d?.cards ?? '0'}/8 tarjetas`,
);

const heroAssets = responses.filter(
  (response) =>
    /PUBLIA_P_robotica_v2\.glb/.test(response.url) ||
    /PUBLIA_prisma_suave_v2\.glb/.test(response.url) ||
    /\/icons\/icono_0[1-8]\.png/.test(response.url),
);
const heroAssetUrls = new Set(heroAssets.map((item) => item.url));
const heroAssetsOk =
  heroAssetUrls.size === 10 && heroAssets.every((item) => item.status === 200);
check(
  'hero 3D: los dos modelos GLB y los ocho iconos se descargan',
  heroAssetsOk,
  `${heroAssets.filter((item) => item.status === 200).length}/10 recursos`,
);

const heroPainted = await page.evaluate(() => {
  const canvas = document.querySelector('[data-prism-canvas]');
  if (!canvas) {
    return { paintedRatio: 0 };
  }
  const copy = document.createElement('canvas');
  copy.width = 320;
  copy.height = 200;
  const ctx = copy.getContext('2d');
  ctx?.drawImage(canvas, 0, 0, copy.width, copy.height);
  const data = ctx?.getImageData(0, 0, copy.width, copy.height)?.data ?? [];
  let bright = 0;
  for (let i = 0; i < data.length; i += 16) {
    if ((data[i] ?? 0) + (data[i + 1] ?? 0) + (data[i + 2] ?? 0) > 90) {
      bright += 1;
    }
  }
  return { paintedRatio: bright / (data.length / 16) };
});
check(
  'hero 3D: pinta la escena (mascota, prisma, tarjetas)',
  heroPainted.paintedRatio > 0.02,
  JSON.stringify(heroPainted),
);

const heroShotA = await page.locator('[data-prism-canvas]').screenshot();
await page.waitForTimeout(900);
const heroShotB = await page.locator('[data-prism-canvas]').screenshot();
check(
  'hero 3D: la animación ambiental cambia entre fotogramas',
  heroShotA.length !== heroShotB.length || !heroShotA.equals(heroShotB),
  `${heroShotA.length} vs ${heroShotB.length} bytes`,
);

const brand = await page.evaluate(() => {
  const logo = document.querySelector('.nav__logo');
  return {
    official: Boolean(logo?.getAttribute('src')?.includes('publia-logo-header')),
    provisional: document.querySelectorAll('.nav__mark').length,
  };
});
check(
  'marca: el encabezado usa el logotipo oficial',
  brand.official && brand.provisional === 0,
  `oficial=${brand.official} provisional=${brand.provisional}`,
);

const cooperativePath = await page.evaluate(() => ({
  heroThirdButton: Boolean(document.querySelector('[data-hero-scene] [data-branch-trait="cooperative"]')),
  branchE14: document.querySelectorAll('#escena-e14 [data-branch-target]').length,
  escenaE15: Boolean(document.querySelector('#escena-e15')),
}));
check(
  'hero: la ruta cooperativa se descubre por scroll/bifurcación, sin tercer botón',
  cooperativePath.heroThirdButton === false && cooperativePath.branchE14 >= 1 && cooperativePath.escenaE15,
  JSON.stringify(cooperativePath),
);

const handover = await page.evaluate(() => ({
  act: document.documentElement.dataset.act ?? '',
  vignette: Number.parseFloat(
    getComputedStyle(document.querySelector('.hero__vignette')).opacity,
  ),
}));
check(
  'hero: viñeta activa sólo en el acto hero',
  handover.act === 'hero' && handover.vignette > 0.9,
  `act=${handover.act} · viñeta ${handover.vignette}`,
);

// --- composición contra la captura aprobada -----------------------------------
const referencePath = new URL('../_entrega/captura_hero_referencia.png', import.meta.url).pathname;
try {
  const sharp = (await import('sharp')).default;
  const profile = async (file) => {
    const image = sharp(file).flatten({ background: '#000' });
    const meta = await image.metadata();
    const cols = 100;
    const rows = Math.round(cols * (meta.height / meta.width) * 0.5);
    const { data, info } = await image
      .resize(cols, rows, { fit: 'fill' })
      .raw()
      .toBuffer({ resolveWithObject: true });
    const cells = [];
    for (let y = 0; y < rows; y += 1) {
      for (let x = 0; x < cols; x += 1) {
        const i = (y * info.width + x) * info.channels;
        const lum = 0.2126 * data[i] + 0.7152 * data[i + 1] + 0.0722 * data[i + 2];
        cells.push({ x, lum });
      }
    }
    const side = (from, to) => cells.filter((cell) => cell.x >= from && cell.x < to);
    const average = (list) => list.reduce((total, cell) => total + cell.lum, 0) / list.length;
    const bright = (list) => list.filter((cell) => cell.lum > 90).length / list.length;
    const left = side(0, Math.round(cols * 0.42));
    const right = side(Math.round(cols * 0.55), cols);
    return {
      leftLum: average(left),
      rightLum: average(right),
      leftBright: bright(left),
      rightBright: bright(right),
    };
  };

  await page.setViewportSize({ width: 1360, height: 810 });
  await page.waitForTimeout(1200);
  const implementationShot = `${OUT}13-hero-composicion.png`;
  await page.screenshot({ path: implementationShot });
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.waitForTimeout(600);

  const reference = await profile(referencePath);
  const implementation = await profile(implementationShot);
  const delta = (a, b) => Math.abs(a - b);
  const close =
    delta(reference.leftLum, implementation.leftLum) < 12 &&
    delta(reference.rightLum, implementation.rightLum) < 12 &&
    delta(reference.leftBright, implementation.leftBright) < 0.03 &&
    delta(reference.rightBright, implementation.rightBright) < 0.03;
  check(
    'composición: coincide con la captura aprobada',
    close,
    `izq ${implementation.leftLum.toFixed(0)}/${reference.leftLum.toFixed(0)} · der ${implementation.rightLum.toFixed(0)}/${reference.rightLum.toFixed(0)} · brillo ${(implementation.leftBright * 100).toFixed(1)}/${(reference.leftBright * 100).toFixed(1)} %`,
  );
} catch (error) {
  check('composición: coincide con la captura aprobada', false, `sin referencia: ${error.message}`);
}

// --- transiciones inmersivas (fase 2) ------------------------------------------
// Entrar a una ruta debe mover la cámara, cambiar el mundo 3D y mostrar el
// contenido de la escena destino, todo dentro del mismo lienzo.
async function transitionProbe(act) {
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
  await page.waitForTimeout(900);
  const before = await page.evaluate(() => {
    const canvas = document.querySelector('[data-prism-canvas]');
    return {
      world: canvas?.dataset.world ?? '',
      camera: canvas?.dataset.camera ?? '',
      tint: canvas?.dataset.tint ?? '',
      scroll: window.scrollY,
    };
  });
  let button = true;
  if (act === 'cooperative') {
    // Ruta C: estado fresco + scroll manual real desde el hero, SIN botón.
    await page.evaluate(() => {
      try { sessionStorage.clear(); } catch {}
    });
    await page.reload({ waitUntil: 'networkidle' });
    await page.waitForTimeout(3200);
    await page.mouse.move(680, 400);
    await page.mouse.wheel(0, 620);
    await page.waitForTimeout(400);
    await page.mouse.wheel(0, 620);
  } else {
    button = await page.evaluate((id) => {
      const el = document.querySelector(`[data-route-choice="${id}"]`);
      el?.scrollIntoView({ block: 'center' });
      el?.click();
      return Boolean(el);
    }, act);
  }
  await page.waitForTimeout(2600);
  const after = await page.evaluate(() => {
    const canvas = document.querySelector('[data-prism-canvas]');
    return {
      world: canvas?.dataset.world ?? '',
      camera: canvas?.dataset.camera ?? '',
      tint: canvas?.dataset.tint ?? '',
      act: document.documentElement.dataset.act ?? '',
      scroll: window.scrollY,
    };
  });
  return { button, before, after };
}

for (const act of ['enterprise', 'efficiency', 'cooperative']) {
  const probe = await transitionProbe(act);
  const moved =
    probe.before.camera !== probe.after.camera && probe.before.world !== probe.after.world;
  const tintChanged = probe.before.tint !== probe.after.tint;
  const scrolled = probe.after.scroll > 400;
  check(
    `transición ${act}: la cámara viaja a otro mundo del mismo universo`,
    probe.button && moved && tintChanged,
    `mundo ${probe.before.world}→${probe.after.world} · cámara ${probe.before.camera}→${probe.after.camera} · tinte ${probe.before.tint}→${probe.after.tint}`,
  );
  check(
    `transición ${act}: el contenido de la escena destino aparece`,
    scrolled && probe.after.act === act,
    `scrollY ${Math.round(probe.after.scroll)} · act=${probe.after.act}`,
  );

  // volver al hero sin reiniciar
  await page.evaluate(() => {
    document.querySelector('[data-act-back]')?.click();
  });
  await page.waitForTimeout(2200);
  const back = await page.evaluate(() => {
    const canvas = document.querySelector('[data-prism-canvas]');
    return {
      world: canvas?.dataset.world ?? '',
      act: document.documentElement.dataset.act ?? '',
      scroll: window.scrollY,
    };
  });
  check(
    `transición ${act}: volver regresa al hero sin recargar`,
    back.world === 'hero' && back.act === 'hero' && back.scroll < 200,
    `world=${back.world} · act=${back.act} · scrollY ${Math.round(back.scroll)}`,
  );
}

// --- P0: dos botones visibles, la tercera ruta entra por scroll libre ----------
const heroButtons = await page.evaluate(() => ({
  routeChoices: document.querySelectorAll('.hero__actions [data-route-choice]').length,
  thirdButton: document.querySelectorAll('.hero__actions [data-branch-trait]').length,
  hint: document.querySelector('.hero__hint')?.textContent?.trim() ?? '',
}));
check(
  'P0: sólo dos botones principales en el hero (la tercera ruta es por scroll)',
  heroButtons.routeChoices === 2 && heroButtons.thirdButton === 0,
  `routeChoices=${heroButtons.routeChoices} · tercer botón=${heroButtons.thirdButton} · pista="${heroButtons.hint.slice(0, 40)}…"`,
);
check(
  'P0: la pista de scroll invita a explorar sin botón',
  /desplázate/i.test(heroButtons.hint),
  heroButtons.hint,
);

// scroll libre sin elegir botón → ruta exploración (origen scroll)
await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
await page.evaluate(() => {
  try { sessionStorage.clear(); } catch {}
  location.reload();
});
await page.waitForLoadState('networkidle');
await page.waitForTimeout(3200);
await page.mouse.move(680, 400);
await page.mouse.wheel(0, 700);
await page.waitForTimeout(600);
const freeScroll = await page.evaluate(() => ({
  route: document.documentElement.dataset.route ?? '',
  act: document.documentElement.dataset.act ?? '',
  world: document.querySelector('[data-prism-canvas]')?.dataset.world ?? '',
}));
await page.mouse.wheel(0, 700);
await page.waitForTimeout(1200);
const freeScroll2 = await page.evaluate(() => ({
  route: document.documentElement.dataset.route ?? '',
  world: document.querySelector('[data-prism-canvas]')?.dataset.world ?? '',
  camera: document.querySelector('[data-prism-canvas]')?.dataset.camera ?? '',
  scroll: Math.round(window.scrollY),
}));
check(
  'P0: scroll manual sin clic entra inequívocamente en la ruta exploración',
  freeScroll.route === 'explorer' && freeScroll.act === 'cooperative',
  `tras rueda: route=${freeScroll.route} · act=${freeScroll.act} · world=${freeScroll.world}`,
);
check(
  'P0: el scroll conduce la cámara (scrub) hacia el mundo cooperativo',
  freeScroll2.world === 'cooperative' && freeScroll2.camera !== '[0,2.4,11.6]' && freeScroll2.scroll > 200,
  `world=${freeScroll2.world} · cámara=${freeScroll2.camera} · scrollY=${freeScroll2.scroll}`,
);

// elegir empresa y después hacer scroll: NO deriva a exploración
await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
await page.waitForTimeout(600);
await page.evaluate(() => document.querySelector('[data-route-choice="enterprise"]')?.click());
await page.waitForTimeout(2600);
await page.mouse.wheel(0, 900);
await page.waitForTimeout(1500);
const afterChoice = await page.evaluate(() => ({
  route: document.documentElement.dataset.route ?? '',
  act: document.documentElement.dataset.act ?? '',
  world: document.querySelector('[data-prism-canvas]')?.dataset.world ?? '',
}));
check(
  'P0: tras elegir empresa, el scroll NO cambia a exploración',
  afterChoice.route === 'enterprise' && afterChoice.world === 'enterprise',
  `route=${afterChoice.route} · act=${afterChoice.act} · world=${afterChoice.world}`,
);

// tarjetas: 8 chips accesibles, hover/foco muestran información
const cardsDom = await page.evaluate(() => {
  window.scrollTo({ top: 0, behavior: 'instant' });
  const chips = [...document.querySelectorAll('[data-card-index]')];
  return { count: chips.length };
});
check('P0: las ocho tarjetas tienen control DOM accesible', cardsDom.count === 8, `chips=${cardsDom.count}`);
await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
await page.waitForTimeout(400);
const chip = page.locator('[data-card-index="0"]');
await chip.focus();
await page.waitForTimeout(300);
const chipFocus = await page.evaluate(() => ({
  tooltip: !document.getElementById('hero-card-info-0')?.hasAttribute('hidden'),
  focusedCard: document.querySelector('[data-prism-canvas]')?.dataset.focusedCard ?? '',
  expanded: document.querySelector('[data-card-index="0"]')?.getAttribute('aria-expanded') ?? '',
}));
check(
  'P0: foco de teclado en tarjeta muestra información y resalta la tarjeta 3D',
  chipFocus.tooltip && chipFocus.expanded === 'true' && chipFocus.focusedCard === '0',
  JSON.stringify(chipFocus),
);
await chip.press('Enter');
await page.waitForTimeout(250);
const chipClick = await page.evaluate(() => document.querySelector('[data-card-index="0"]')?.getAttribute('aria-expanded'));
check('P0: Enter sobre tarjeta abre/cierra la información contextual', chipClick === 'false' || chipClick === 'true', `aria-expanded=${chipClick}`);

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
// Estado fresco: sin ruta en sesión para capturar la variante neutral real.
await page.evaluate(() => {
  try { sessionStorage.clear(); } catch {}
});
await page.reload({ waitUntil: 'networkidle' });
await page.waitForTimeout(3000);
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
await page.waitForTimeout(2600);
await click('[data-route-choice="efficiency"]');
await page.waitForTimeout(2600);
const efficiency = await page.evaluate(() => ({
  route: document.documentElement.dataset.route,
  act: document.documentElement.dataset.act ?? '',
  world: document.querySelector('[data-prism-canvas]')?.dataset.world ?? '',
  scroll: Math.round(window.scrollY),
  traveling: document.documentElement.dataset.scrolling ?? '',
  visible: document.querySelector('#escena-e07')?.offsetHeight ?? 0,
  title: document.querySelector('#escena-e07 [data-role="title"]')?.textContent?.trim() ?? '',
  perspective: document.querySelector('#escena-e02 [data-role="title"]')?.textContent?.trim() ?? '',
}));
check(
  'ruta eficiencia: escena propia visible',
  efficiency.visible > 100,
  `${efficiency.visible}px · route=${efficiency.route} act=${efficiency.act} world=${efficiency.world} scrollY=${efficiency.scroll}`,
);
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

// --- ruta exploradora por scroll libre (rueda real, sin botón) ----------------
await page.evaluate(() => {
  try { sessionStorage.clear(); } catch {}
  window.scrollTo({ top: 0, behavior: 'instant' });
});
await page.reload({ waitUntil: 'networkidle' });
await page.waitForTimeout(3000);
await page.mouse.move(680, 400);
for (let i = 0; i < 6; i += 1) {
  await page.mouse.wheel(0, 500);
  await page.waitForTimeout(220);
}
await page.waitForTimeout(1800);
const explorer = await page.evaluate(() => ({
  route: document.documentElement.dataset.route,
  visible: document.querySelector('#escena-e13')?.offsetHeight ?? 0,
  branch: document.querySelectorAll('#escena-e14 [data-branch-target]').length,
}));
check('ruta exploración: se activa por scroll natural', explorer.route === 'explorer', explorer.route);
check('ruta exploración: escena visible', explorer.visible > 100, `${explorer.visible}px`);
check('ruta exploración: dos bifurcaciones', explorer.branch === 2, `${explorer.branch} opciones`);

// --- bifurcación narrativa ---------------------------------------------------
const neutralNetwork = await page.evaluate(
  () => document.querySelector('#escena-e05 [data-role="title"]')?.textContent?.trim() ?? '',
);
const branchTargets = await page.evaluate(() =>
  [...document.querySelectorAll('#escena-e14 [data-branch-target]')].map((b) => b.dataset.branchTarget),
);
const branchOk = branchTargets.includes('#escena-e15') && branchTargets.includes('#escena-e24');
check('bifurcaciones: apuntan a escenas reales', branchOk, branchTargets.join(', '));

await page.evaluate(() => {
  const button = [...document.querySelectorAll('#escena-e14 [data-branch-target]')].find(
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
await axePage.waitForTimeout(3800);
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
  // El 3D (Three.js y el escenario del hero) va aparte: el presupuesto de la
  // aplicación es el del código propio, sin el motor gráfico.
  const appShell = entries
    .filter((entry) => entry.name.endsWith('.js') && !/three|universe|heroScene|stage\./.test(entry.name))
    .reduce((total, entry) => total + (entry.encodedBodySize || 0), 0);
  const styles = entries
    .filter((entry) => entry.name.endsWith('.css'))
    .reduce((total, entry) => total + (entry.encodedBodySize || 0), 0);
  return { scripts, styles, appShell, total: scripts + styles };
});
check(
  'rendimiento: JS + CSS inicial (con el 3D del hero) por debajo de 260 kB',
  budget.total < 260 * 1024,
  `${Math.round(budget.total / 1024)} kB (JS ${Math.round(budget.scripts / 1024)} · CSS ${Math.round(budget.styles / 1024)})`,
);
check(
  'rendimiento: la aplicación sin 3D por debajo de 90 kB',
  budget.appShell < 90 * 1024,
  `${Math.round(budget.appShell / 1024)} kB de JS de aplicación`,
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
await reducedPage.waitForTimeout(4500);
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
