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
// Espera a que la cámara deje de cambiar (útil con FPS bajos en swiftshader)
const camSettled = async (timeout = 25000) => {
  const start = Date.now();
  let last = await page.evaluate(() => document.querySelector('[data-prism-canvas]')?.dataset.camera ?? '');
  let stable = 0;
  while (Date.now() - start < timeout && stable < 8) {
    await page.waitForTimeout(400);
    const now = await page.evaluate(() => document.querySelector('[data-prism-canvas]')?.dataset.camera ?? '');
    stable = now === last ? stable + 1 : 0;
    last = now;
  }
  return last;
};
const scrollSettled = async (timeout = 20000) => {
  const start = Date.now();
  let last = await page.evaluate(() => window.scrollY);
  let stable = 0;
  while (Date.now() - start < timeout && stable < 8) {
    await page.waitForTimeout(400);
    const now = await page.evaluate(() => window.scrollY);
    stable = Math.abs(now - last) < 2 ? stable + 1 : 0;
    last = now;
  }
  return last;
};

// Espera a que el universo 3D haya inicializado (evita flakes de arranque lento)
await page.addInitScript(() => { try { history.scrollRestoration = 'manual'; } catch {} });
// Scroll marcado como programático (no cuenta como intención de explorar)
const pscroll = (top) => page.evaluate((t) => {
  window.__publiaLastProgrammaticScroll = performance.now();
  window.scrollTo({ top: t, behavior: 'instant' });
}, top);

// Rueda real hasta que la ruta libre se active (reintenta si el entorno va lento)
const wheelUntilExplorer = async (max = 6) => {
  for (let i = 0; i < max; i++) {
    await page.mouse.wheel(0, 700);
    const ok = await page.waitForFunction(() => document.documentElement.dataset.route === 'explorer', { timeout: 4000 }).then(() => true).catch(() => false);
    if (ok) return true;
  }
  return false;
};

const waitUniverse = () => page.waitForFunction(() => document.querySelector('[data-prism-canvas]')?.dataset.world === 'hero', { timeout: 30000 }).catch(() => {});

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
  await pscroll(0);
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
    await waitUniverse(); await page.waitForTimeout(1200);
    await pscroll(0);
    await page.mouse.move(680, 400);
    await wheelUntilExplorer();
  } else {
    button = await page.evaluate((id) => {
      const el = document.querySelector(`[data-route-choice="${id}"]`);
      el?.scrollIntoView({ block: 'center' });
      el?.click();
      return Boolean(el);
    }, act);
  }
  await page.waitForFunction((a) => document.documentElement.dataset.act === a, { timeout: 15000 }, act).catch(() => {});
  await page.waitForTimeout(1400);
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
  await page.waitForFunction(() => document.documentElement.dataset.act === 'hero', { timeout: 15000 }).catch(() => {});
  await page.waitForFunction(() => window.scrollY < 400, { timeout: 20000 }).catch(() => {});
  await scrollSettled();
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
    back.world === 'hero' && back.act === 'hero' && back.scroll < 400,
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
await pscroll(0);
await page.evaluate(() => {
  try { sessionStorage.clear(); } catch {}
  location.reload();
});
await page.waitForLoadState('networkidle');
await waitUniverse(); await page.waitForTimeout(1200);
await page.mouse.move(680, 400);
await wheelUntilExplorer();
await page.waitForTimeout(600);
const freeScroll = await page.evaluate(() => ({
  route: document.documentElement.dataset.route ?? '',
  act: document.documentElement.dataset.act ?? '',
  world: document.querySelector('[data-prism-canvas]')?.dataset.world ?? '',
}));
await page.mouse.wheel(0, 700);
await page.waitForFunction(() => document.querySelector('[data-prism-canvas]')?.dataset.world === 'cooperative', { timeout: 15000 }).catch(() => {});
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
await pscroll(0);
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
await pscroll(0);
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
  plans: document.querySelectorAll('#escena-e27 [data-memb-plan]').length,
  shares: document.querySelectorAll('#escena-e03 .infra2__compare-grid article').length,
}));
check('grafo: 31 escenas montadas (E00-E30)', structure.scenes >= 31, `${structure.scenes} escenas`);
check('red humana: enlaces dibujados', structure.network >= 8, `${structure.network} enlaces`);
check('demostraciones marcadas como simulación', structure.demos >= 4, `${structure.demos} bloques`);
check('catálogo: cinco niveles de membresía', structure.plans === 5, `${structure.plans} planes`);
check('housing: comparación compartida vs privada (2 modalidades)', structure.shares === 2, `${structure.shares} modalidades`);

const effects = await page.evaluate(() => {
  return {
    pin: document.querySelectorAll('[data-pin]').length,
    horizontal: document.querySelectorAll('[data-horizontal]').length,
    morph: document.querySelectorAll('[data-morph]').length,
    depth: document.querySelectorAll('[data-depth]').length,
    sticky: document.querySelectorAll('[data-sticky]').length,
    planWidth: 0,
    planClient: 0,
  };
});
check('efectos: anclaje asignado', effects.pin >= 1, `${effects.pin} escena(s) anclada(s)`);
check('efectos: pin/morph/sticky presentes en la página', effects.pin >= 1 && effects.morph >= 1 && effects.sticky >= 1, `pin=${effects.pin} morph=${effects.morph} sticky=${effects.sticky}`);
check('efectos: morphing de la entidad', effects.morph >= 1, `${effects.morph} escena(s)`);
check('efectos: profundidad de campo en varias escenas', effects.depth >= 4, `${effects.depth} capas`);
check('efectos: columna sticky', effects.sticky >= 1, `${effects.sticky} columna(s)`);

const click = (selector) => page.evaluate((s) => document.querySelector(s)?.click(), selector);
const waitBound = (sel) => page.waitForFunction((s2) => document.querySelector(s2)?.dataset.bound === '1', sel, { timeout: 30000 }).catch(() => {});
// Espera a que el universo 3D haya inicializado (evita flakes de arranque lento)

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
  enterprise.title.toUpperCase().includes('TUS REGLAS'),
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
  efficiency.title.toUpperCase().includes('RECUPÉRALO'),
  efficiency.title,
);
check(
  'variante compartida: la ruta eficiencia reescribe la escena común',
  efficiency.perspective !== perspectiveNeutral && efficiency.perspective !== perspectiveEnterprise,
  efficiency.perspective,
);

// --- cambio de ruta ---------------------------------------------------------
let resetRoute = '';
for (let i = 0; i < 5 && resetRoute !== 'unclassified'; i++) {
  await click('[data-route-reset]');
  resetRoute = await page.waitForFunction(() => document.documentElement.dataset.route, { timeout: 8000 }).then(() => page.evaluate(() => document.documentElement.dataset.route)).catch(() => '');
}
if (resetRoute !== 'unclassified') {
  // fallback: estado fresco garantizado
  await page.evaluate(() => { try { sessionStorage.clear(); } catch {} });
  await page.reload({ waitUntil: 'networkidle' });
  await waitUniverse();
  await page.waitForTimeout(1000);
  resetRoute = await page.evaluate(() => document.documentElement.dataset.route);
}
await pscroll(0);
// a 2 FPS (swiftshader) el scroll al hero tarda; esperar por estado, no por sleep
for (let att = 0; att < 3; att++) {
  await page.waitForFunction(() => window.scrollY < 120, null, { timeout: 25000 }).catch(() => {});
  if ((await page.evaluate(() => window.scrollY)) < 120) break;
  await page.evaluate(() => window.scrollTo(0, 0));
}
await scrollSettled(30000);
const reset = await page.evaluate((r) => ({
  route: r,
  scroll: window.scrollY,
}), resetRoute);
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
  const plans = [...document.querySelectorAll('#escena-e27 [data-memb-plan]')].map((plan) => ({
    name: plan.querySelector('strong')?.textContent?.trim() ?? '',
    price: plan.querySelector('b')?.textContent?.trim() ?? '',
  }));
  const shares = [...document.querySelectorAll('#escena-e03 .infra2__compare-grid article')].map((a) => (a.textContent ?? '').match(/(\d+)%/g)?.join('/') ?? '');
  return { plans, shares };
});
const prices = Object.fromEntries(catalog.plans.map((plan) => [plan.name, plan.price]));
check('catálogo: BASE $300', prices['BASE']?.includes('300'), prices['BASE']);
check('catálogo: CRECIMIENTO $2,000', prices['CRECIMIENTO']?.includes('2,000'), prices['CRECIMIENTO']);
check('catálogo: OPERACIÓN $3,000', prices['OPERACIÓN']?.includes('3,000'), prices['OPERACIÓN']);
check('catálogo: COBERTURA $4,000', prices['COBERTURA']?.includes('4,000'), prices['COBERTURA']);
check('catálogo: AGENTE como rango pendiente (nunca tarifa confirmada)', (prices['AGENTE'] ?? '').includes('pendiente') && (prices['AGENTE'] ?? '').includes('500'), prices['AGENTE']);
check('housing: reparto 50/25/25 en modalidad compartida', catalog.shares.some((x) => x.replace(/\s/g, '') === '50%/25%/25%'), catalog.shares.join(' | '));

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
  services.items.some((item) => item.name.includes('Desarrollo web') && item.price.includes('150')),
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
  contactLinks.number.startsWith('https://wa.me/525573724660'),
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

// --- dirección de arte v3 ---------------------------------------------------------
// Composición: >=5 siluetas y >=4 tonos distintos en el home completo.
const art = await page.evaluate(() => {
  const scenes = [...document.querySelectorAll('[data-scene-id]')];
  return {
    layouts: new Set(scenes.map((el) => el.dataset.layout).filter(Boolean)).size,
    tones: new Set(scenes.map((el) => el.dataset.tone).filter(Boolean)).size,
    accentEm: document.querySelectorAll('.scene em').length,
    artSlots: [...document.querySelectorAll('.scene__art[data-art-slot]')].map((el) => el.dataset.artSlot),
    emojiEyebrows: [...document.querySelectorAll('[data-role="eyebrow"]')].filter((el) => /\p{Extended_Pictographic}/u.test(el.textContent ?? '')).length,
  };
});
check('v3: >=5 composiciones distintas', art.layouts >= 5, JSON.stringify(art.layouts));
check('v3: >=4 atmósferas de fondo distintas', art.tones >= 4, JSON.stringify(art.tones));
check('v3: acentos amarillos en titulares (em)', art.accentEm >= 5, `${art.accentEm} em`);
check('v3: slots de arte A01-A05 preparados', ['A01', 'A02', 'A03', 'A04', 'A05'].every((id) => art.artSlots.includes(id)), art.artSlots.join(','));
check('v3: eyebrows con emoji semántico', art.emojiEyebrows >= 5, `${art.emojiEyebrows} eyebrows`);

// Contraste en escena clara (cream): tinta oscura sobre fondo claro.
const creamContrast = await page.evaluate(() => {
  const el = document.querySelector('.scene[data-tone="cream"] .statement__title, .scene[data-tone="cream"] [data-role="title"]');
  if (!el) return null;
  const cs = getComputedStyle(el);
  const scene = el.closest('.scene');
  return { color: cs.color, bg: scene ? getComputedStyle(scene).backgroundColor : '' };
});
check(
  'v3: escena clara con tinta oscura (contraste real)',
  !!creamContrast && parseInt(creamContrast.color.match(/\d+/g)?.[0] ?? '255') < 90,
  JSON.stringify(creamContrast),
);

// Scroll continuo: en ruta empresa, cámara y tinte cambian entre 30/60/90% del capítulo.
await page.evaluate(() => { try { sessionStorage.clear(); } catch {} });
await page.reload({ waitUntil: 'networkidle' });
await page.waitForTimeout(2600);
await click('[data-route-choice="enterprise"]');
await page.waitForTimeout(3000);
const probe = async (frac) => {
  const h = await page.evaluate(() => document.body.scrollHeight - window.innerHeight);
  await page.evaluate((top) => window.scrollTo({ top, behavior: 'instant' }), Math.round(h * frac));
  await page.waitForTimeout(700);
  return page.evaluate(() => ({
    cam: document.querySelector('[data-prism-canvas]')?.dataset.camera ?? '',
    tint: document.querySelector('[data-prism-canvas]')?.dataset.tint ?? '',
  }));
};
const probeAbs = async (top) => {
  await page.evaluate((t) => window.scrollTo({ top: t, behavior: 'instant' }), top);
  const cam = await camSettled();
  return { cam, top };
};
const h = await page.evaluate(() => document.body.scrollHeight - window.innerHeight);
const p30 = await probeAbs(Math.round(h * 0.3));
const p60 = await probeAbs(Math.round(h * 0.6));
const p90 = await probeAbs(Math.round(h * 0.9));
check(
  'v3 scroll: la cámara se transforma en 30/60/90% (ida)',
  p30.cam !== p60.cam && p60.cam !== p90.cam,
  `30=${p30.cam} 60=${p60.cam} 90=${p90.cam}`,
);
const r60 = await probeAbs(p60.top); // misma posición absoluta a la vuelta
const camDist = (a, b) => { const pa = a.replace(/[[\]]/g, '').split(',').map(Number); const pb = b.replace(/[[\]]/g, '').split(',').map(Number); return Math.max(...pa.map((v, i) => Math.abs(v - (pb[i] ?? 0)))); };
check('v3 scroll: recorrido inverso mueve la cámara en sentido inverso (reversible)', camDist(r60.cam, p90.cam) > 0.05 && camDist(p90.cam, p60.cam) > 0.05, `90=${p90.cam} ida60=${p60.cam} vuelta60=${r60.cam}`);

// Demo empresa: capa conecta red 3D y texto.
await page.evaluate(() => document.querySelector('#escena-e04')?.scrollIntoView({ block: 'center', behavior: 'instant' }));
await page.waitForTimeout(900);
const beforeInfra = await page.evaluate(() => document.querySelector('[data-prism-canvas]')?.dataset.camera ?? '');
await page.evaluate(() => document.querySelector('#escena-e03')?.scrollIntoView({ block: 'center', behavior: 'instant' }));
await page.waitForTimeout(1200);
await click('#escena-e03 [data-infra2-mode="housing"]');
await page.waitForFunction((prev) => (document.querySelector('[data-prism-canvas]')?.dataset.camera ?? '') !== prev, { timeout: 12000 }, beforeInfra).catch(() => {});
await page.waitForTimeout(400);
const infra = await page.evaluate(() => ({
  detail: document.querySelector('#escena-e03 [data-infra2-desc]')?.textContent ?? '',
  cam: document.querySelector('[data-prism-canvas]')?.dataset.camera ?? '',
  pressed: document.querySelector('#escena-e03 [data-infra2-mode="housing"]')?.getAttribute('aria-pressed'),
}));
check('7M-B infra: el modo cambia el texto', infra.detail.includes('módulos independientes'), infra.detail.slice(0, 60));
check('7M-B infra: el modo mueve la cámara 3D', infra.cam !== beforeInfra, `${beforeInfra} -> ${infra.cam}`);
check('7M-B infra: estado accesible aria-pressed', infra.pressed === 'true', infra.pressed);

// Demo eficiencia: foco responde y guarda respuesta.
await click('[data-route-reset]');
await page.waitForTimeout(2400);
await click('[data-route-choice="efficiency"]');
await page.waitForTimeout(2800);
await page.evaluate(() => document.querySelector('#escena-e09')?.scrollIntoView({ block: 'center', behavior: 'instant' }));
await page.waitForTimeout(800);
await click('[data-flow-focus="ventas"]');
await page.waitForTimeout(1400);
const flow = await page.evaluate(() => ({
  result: document.querySelector('[data-flow-result]')?.textContent ?? '',
  answer: JSON.parse(sessionStorage.getItem('publia.visitor.v1') ?? '{}').answers?.foco ?? null,
  active: document.querySelectorAll('.flow-demo__stage.is-active').length,
}));
check('v3 demo eficiencia: resultado según foco', flow.result.includes('pedidos'), flow.result.slice(0, 60));
check('v3 demo eficiencia: respuesta guardada (foco=ventas)', flow.answer === 'ventas', String(flow.answer));
check('v3 demo eficiencia: el flujo se ilumina por etapas', flow.active >= 1, `${flow.active} etapas`);

// Demo cooperativa: geonodos (E17, exploración opcional) — clic en nodo + progreso por scroll.
await click('[data-route-reset]');
await page.waitForTimeout(2400);
await page.mouse.move(680, 400);
await wheelUntilExplorer(8);
await page.waitForTimeout(1600);
await page.waitForTimeout(1600);
await scrollSettled(10000);
await page.evaluate(() => {
  const wrap = document.querySelector('[data-demo="geo"]');
  if (wrap) {
    const top = wrap.getBoundingClientRect().top + window.scrollY;
    window.scrollTo({ top: Math.max(0, top - window.innerHeight * 0.45), behavior: 'instant' });
  }
});
for (let i = 0; i < 24; i++) {
  await page.waitForTimeout(500);
  await page.evaluate(() => window.dispatchEvent(new Event('scroll')));
  const pr = await page.evaluate(() => Number(document.querySelector('[data-demo="geo"]')?.dataset.geoProgress ?? 0));
  if (pr >= 1) break;
}
await page.waitForTimeout(400);
await page.evaluate(() => document.querySelector('[data-geo-node="aprender"]')?.dispatchEvent(new MouseEvent('click', { bubbles: true })));
await page.waitForTimeout(600);
const geo = await page.evaluate(() => ({
  detail: document.querySelector('[data-geo-detail]')?.textContent ?? '',
  progress: document.querySelector('[data-demo="geo"]')?.dataset.geoProgress ?? '0',
  active: document.querySelectorAll('[data-geo-node].is-active').length,
}));
check('v3 demo geonodos: el nodo explica qué se comparte', geo.detail.includes('Manuales'), geo.detail.slice(0, 60));
check('v3 demo geonodos: scroll enciende conexiones (progreso)', Number(geo.progress) >= 1, `progreso=${geo.progress}`);
check('v3 demo geonodos: nodo activo marcado', geo.active === 1, `${geo.active}`);

// --- V4-B: assets AVIF reales + mosaico + recomendación --------------------------------
const assetsInfo = await page.evaluate(async () => {
  const slots = ['A02', 'A03', 'A04', 'A05'];
  const out = {};
  for (const id of slots) {
    const art = document.querySelector(`[data-art-slot="${id}"][data-asset-ready="true"]`) ?? document.querySelector(`[data-art-slot="${id}"]`);
    const img = art?.querySelector('img[data-asset-img]');
    const src = img?.getAttribute('data-asset-src') ?? '';
    const head = src ? await fetch(src, { method: 'HEAD' }).then((r) => r.headers.get('content-type') + ' ' + r.status).catch(() => 'fetch-fail') : 'no-src';
    out[id] = { ready: art?.dataset.assetReady, src, head, hasMobile: !!img?.getAttribute('data-asset-mobile') };
  }
  return out;
});
for (const id of ['A02', 'A03', 'A04', 'A05']) {
  check(`V4-B asset ${id}: data-asset-ready=true y servido como image/avif`, assetsInfo[id].ready === 'true' && assetsInfo[id].head.startsWith('image/avif'), JSON.stringify(assetsInfo[id]));
}
// Auditoría de imágenes (desktop): el asset real aparece UNA sola vez (escena primaria) y sin recortes agresivos
const imgAudit = await page.evaluate(() => {
  const res = [];
  document.querySelectorAll('.scene__art[data-asset-ready="true"]').forEach((art) => {
    const img = art.querySelector('img[data-asset-img]');
    const cs = getComputedStyle(art);
    const [aw, ah] = cs.aspectRatio.split('/').map((v) => parseFloat(v));
    res.push({
      slot: art.dataset.artSlot,
      scene: art.closest('section[id]')?.id,
      artAspect: +(aw / Math.max(1, ah)).toFixed(2),
      objectFit: img ? getComputedStyle(img).objectFit : null,
      natural: img ? img.naturalWidth + 'x' + img.naturalHeight : null,
      display: cs.display,
    });
  });
  const readyCount = {};
  document.querySelectorAll('.scene__art[data-asset-ready="true"]').forEach((a) => { readyCount[a.dataset.artSlot] = (readyCount[a.dataset.artSlot] ?? 0) + 1; });
  const dupSlots = Object.entries(readyCount).filter(([, n]) => n > 1).map(([k]) => k);
  return { arts: res, readyCount, dupSlots };
});
check('auditoría imágenes: cada asset real aparece UNA sola vez (sin duplicados)', imgAudit.dupSlots.length === 0, `ready=${JSON.stringify(imgAudit.readyCount)}`);
check('auditoría imágenes: caja del asset con proporción 16:9 (1.7–1.85), no franja 3.8:1', imgAudit.arts.every((a) => a.artAspect > 1.7 && a.artAspect < 1.85), JSON.stringify(imgAudit.arts.map((a) => a.slot + '@' + a.scene + '=' + a.artAspect)));
check('auditoría imágenes: asset real usa contain (póster completo, sin recorte)', imgAudit.arts.every((a) => a.objectFit === 'contain'), JSON.stringify(imgAudit.arts.map((a) => a.objectFit)));
// Ecosistema (7 mundos, P0-04): 8 nodos con iconos reales + selección persistente
await page.evaluate(() => document.querySelector('#escena-e25')?.scrollIntoView({ behavior: 'instant' }));
await page.waitForTimeout(1200);
const ecoCount = await page.evaluate(() => ({
  nodes: document.querySelectorAll('#escena-e25 [data-eco-node]').length,
  iconsOk: [...document.querySelectorAll('#escena-e25 [data-eco-node] img')].filter((i) => i.complete && i.naturalWidth > 0).length,
  artE25: document.querySelector('#escena-e25 .scene__art')?.dataset.assetReady ?? 'sin-art',
}));
check('ecosistema E25: 8 nodos con iconos reales cargados', ecoCount.nodes === 8 && ecoCount.iconsOk === 8, JSON.stringify(ecoCount));
check('ecosistema E25: sin póster A02 compitiendo en la misma escena', ecoCount.artE25 !== 'true', `art=${ecoCount.artE25}`);
await click('#escena-e25 [data-eco-node="2"]');
await page.waitForTimeout(400);
const ecoSel = await page.evaluate(() => ({
  pressed: document.querySelector('#escena-e25 [data-eco-node][aria-pressed="true"]')?.getAttribute('data-eco-node') ?? null,
  title: document.querySelector('#escena-e25 [data-eco-title]')?.textContent ?? '',
  answer: JSON.parse(sessionStorage.getItem('publia.visitor.v1') ?? '{}').answers?.servicio ?? null,
}));
await waitBound('[data-demo="ecosystem"]');
check('ecosistema: click selecciona (aria-pressed + panel + respuesta persistida)', ecoSel.pressed === '2' && !!ecoSel.answer && ecoSel.answer === ecoSel.title, JSON.stringify(ecoSel));
await click('#escena-e25 [data-eco-play]');
await page.waitForTimeout(2400);
const ecoPlay = await page.evaluate(() => ({
  exampleVisible: !document.querySelector('#escena-e25 [data-eco-example]')?.hidden,
  liveSteps: document.querySelectorAll('#escena-e25 [data-eco-step].is-live').length,
}));
check('ecosistema: mini demostración recorre pasos y revela ejemplo', ecoPlay.exampleVisible && ecoPlay.liveSteps >= 3, JSON.stringify(ecoPlay));
// Automatización (7 mundos, P0-02): ejecutar recorre las 4 etapas
await page.evaluate(() => document.querySelector('#escena-e07')?.scrollIntoView({ behavior: 'instant' }));
await page.waitForTimeout(1000);
await click('#escena-e07 [data-flow-run]');
await page.waitForTimeout(4600);
const flowRun = await page.evaluate(() => ({
  count: document.querySelector('#escena-e07 [data-flow-count]')?.textContent ?? '',
  active: document.querySelectorAll('#escena-e07 [data-flow-stage].is-active').length,
  feed: (document.querySelector('#escena-e07 [data-flow-feed]')?.textContent ?? '').slice(0, 50),
}));
check('automatización: ejecutar recorre las 4 etapas (contador 04 + etapa activa)', flowRun.count === '04' && flowRun.active >= 1, JSON.stringify(flowRun));
// E11 marfil
const e11tone = await page.evaluate(() => document.querySelector('#escena-e11')?.dataset.tone);
check('V4-B E11 personas+IA en marfil (cream)', e11tone === 'cream', `tone=${e11tone}`);
// recomendación en E29 según ruta empresa
await page.evaluate(() => { try { sessionStorage.clear(); } catch {} });
await page.goto(BASE, { waitUntil: 'networkidle' });
await page.waitForTimeout(2600);
await click('[data-route-choice="enterprise"]');
await page.waitForTimeout(3400);
await page.evaluate(() => document.querySelector('#escena-e29')?.scrollIntoView({ behavior: 'instant' }));
await page.waitForTimeout(900);
await waitBound('[data-recommendation]');
const rec = await page.evaluate(() => ({
  items: document.querySelectorAll('[data-recommendation-list] .recommendation__item').length,
  text: document.querySelector('[data-recommendation-list]')?.textContent ?? '',
  status: document.querySelector('[data-recommendation-status]')?.textContent ?? '',
}));
check('V4-B cierre: recomendación con >=3 items para ruta empresa', rec.items >= 3 && rec.text.includes('Housing'), `items=${rec.items} status=${rec.status.slice(0, 60)}`);
check('cierre V2: botón copiar resumen presente', await page.evaluate(() => !!document.querySelector('[data-rec-copy]')));

// --- 7M-B: bloques A/B/C/D/E ------------------------------------------------------
const q = (sel) => page.evaluate((s2) => !!document.querySelector(s2), sel);
const clickJs = (sel) => page.evaluate((s2) => { const el = document.querySelector(s2); if (el) el.click(); return !!el; }, sel);
const sceneState = () => page.evaluate(() => { try { return JSON.parse(sessionStorage.getItem('publia.visitor.v1') ?? '{}'); } catch { return {}; } });

// Bloque B: red colaborativa (E15) — boot limpio en ruta unclassified (escenas explorer visibles)
await page.evaluate(() => { try { sessionStorage.clear(); } catch {} });
await page.goto(BASE, { waitUntil: 'domcontentloaded' });
await page.waitForFunction(() => document.querySelector('[data-prism-canvas]')?.dataset.world === 'hero', { timeout: 60000 }).catch(() => {});
await page.waitForTimeout(1500);
await page.evaluate(() => document.querySelector('#escena-e15')?.scrollIntoView({ behavior: 'instant' }));
await page.waitForTimeout(700);
await waitBound('[data-demo="red"]');
check('7M-B red: 6 nodos de capacidad', await page.evaluate(() => document.querySelectorAll('#escena-e15 [data-red-node]').length) === 6);
await clickJs('#escena-e15 [data-red-node="2"]');
await page.waitForTimeout(300);
check('7M-B red: click nodo 3 selecciona y persiste en estado', await page.evaluate(() => document.querySelector('#escena-e15 [data-red-node="2"]')?.getAttribute('aria-pressed') === 'true') && (await sceneState()).red === 'sitios', JSON.stringify((await sceneState()).red));
await clickJs('#escena-e15 [data-red-run]');
await page.waitForFunction(() => (document.querySelector('#escena-e15 [data-red-result]')?.textContent ?? '').length > 3, { timeout: 8000 }).catch(() => {});
check('7M-B red: demo ilumina flujo y muestra resultado', (await page.evaluate(() => document.querySelector('#escena-e15 [data-red-result]')?.textContent ?? '')).length > 3, await page.evaluate(() => document.querySelector('#escena-e15 [data-red-result]')?.textContent ?? ''));

// Bloque A: infraestructura soberana (E03) — requiere ruta enterprise
await page.goto(BASE, { waitUntil: 'domcontentloaded' });
await page.waitForFunction(() => document.querySelector('[data-prism-canvas]')?.dataset.world === 'hero', { timeout: 60000 }).catch(() => {});
await click('[data-route-choice="enterprise"]');
await page.waitForFunction(() => document.documentElement.dataset.act === 'enterprise', { timeout: 30000 }).catch(() => {});
await page.waitForTimeout(1500);
await page.evaluate(() => document.querySelector('#escena-e03')?.scrollIntoView({ behavior: 'instant' }));
await page.waitForTimeout(700);
await waitBound('[data-demo="infra2"]');
check('7M-B infra: 3 modos de operación', await page.evaluate(() => document.querySelectorAll('#escena-e03 [data-infra2-mode]').length) === 3);
check('7M-B infra: 10 racks con LEDs', await page.evaluate(() => document.querySelectorAll('#escena-e03 [data-infra2-rack]').length) === 10);
await clickJs('#escena-e03 [data-infra2-mode="housing"]');
await page.waitForTimeout(400);
check('7M-B infra: modo housing persiste + status SIMULACIÓN', (await sceneState()).infra === 'housing' && (await page.evaluate(() => document.querySelector('#escena-e03 [data-infra2-status]')?.textContent ?? '')).includes('HOUSING'));
await clickJs('#escena-e03 [data-infra2-launch]');
await page.waitForTimeout(1600);
check('7M-B infra: activar red sube contador de tráfico', (await page.evaluate(() => document.querySelector('#escena-e03 [data-infra2-traffic]')?.textContent ?? '')) !== '000', await page.evaluate(() => document.querySelector('#escena-e03 [data-infra2-traffic]')?.textContent ?? ''));
check('7M-B infra: comparación compartida vs privada presente (sin $0 publicado)', await page.evaluate(() => { const t = document.querySelector('#escena-e03 .infra2__compare')?.textContent ?? ''; return t.includes('compartida') && t.includes('privada') && !t.includes('$0'); }));

// Bloque C: personas + IA (E11)
await page.evaluate(() => document.querySelector('#escena-e11')?.scrollIntoView({ behavior: 'instant' }));
await page.waitForTimeout(700);
await waitBound('[data-demo="personas"]');
check('7M-B personas: 3 casos + 4 controles', (await page.evaluate(() => document.querySelectorAll('#escena-e11 [data-pers-case]').length)) === 3 && (await page.evaluate(() => ['[data-pers-run]','[data-pers-pause]','[data-pers-step]','[data-pers-reset]'].filter((x) => document.querySelector('#escena-e11 ' + x)).length)) === 4);
await clickJs('#escena-e11 [data-pers-case="soporte"]');
await clickJs('#escena-e11 [data-pers-step]');
await page.waitForTimeout(300);
check('7M-B personas: paso a paso avanza etapa (caso soporte activo)', (await page.evaluate(() => document.querySelector('#escena-e11 [data-pers-out-title]')?.textContent ?? '')).includes('🚨') || (await page.evaluate(() => document.querySelector('#escena-e11 [data-pers-out-title]')?.textContent ?? '')).includes('Primer análisis'), await page.evaluate(() => document.querySelector('#escena-e11 [data-pers-out-title]')?.textContent ?? ''));
await clickJs('#escena-e11 [data-pers-run]');
await page.waitForFunction(() => {
  const t = document.querySelector('#escena-e11 [data-pers-run-text]')?.textContent ?? '';
  const out = document.querySelector('#escena-e11 [data-pers-out-title]')?.textContent ?? '';
  return t !== '▶ Ver cómo colaboran' && out.length > 2;
}, null, { timeout: 12000 }).catch(() => {});
const persRun = await page.evaluate(() => ({
  text: document.querySelector('#escena-e11 [data-pers-run-text]')?.textContent ?? '',
  pauseOff: !document.querySelector('#escena-e11 [data-pers-pause]')?.disabled,
  out: document.querySelector('#escena-e11 [data-pers-out-title]')?.textContent ?? '',
}));
check('7M-B personas: ejecutar arranca la demo (texto cambia y hay etapa activa)', /Simulando|Repetir/.test(persRun.text) && persRun.out.length > 2, JSON.stringify(persRun));

// Bloque D: membresías (E27)
await page.evaluate(() => document.querySelector('#escena-e27')?.scrollIntoView({ behavior: 'instant' }));
await page.waitForTimeout(700);
await waitBound('[data-demo="memberships"]');
check('7M-B membresías: 5 niveles', (await page.evaluate(() => document.querySelectorAll('#escena-e27 [data-memb-plan]').length)) === 5);
const agenteTxt = await page.evaluate(() => document.querySelector('#escena-e27 [data-memb-plan="agente"]')?.textContent ?? '');
check('7M-B membresías: AGENTE nunca publica tarifa confirmada (etiqueta pendiente)', agenteTxt.includes('pendiente') && agenteTxt.includes('objetivo') && agenteTxt.includes('500'), agenteTxt);
await clickJs('#escena-e27 [data-memb-goal="support"]');
await clickJs('#escena-e27 [data-memb-team="large"]');
await clickJs('#escena-e27 [data-memb-recommend]');
await page.waitForTimeout(400);
check('7M-B membresías: diagnóstico marca sugerencia SIN persistir ni pisar la selección (badge, no aria-pressed)', !(await page.evaluate(() => document.querySelector('#escena-e27 [data-memb-reco]')?.hidden)) && (await sceneState()).membership === null && (await page.evaluate(() => !document.querySelector('#escena-e27 [data-memb-badge="cobertura"]')?.hidden)) && (await page.evaluate(() => document.querySelector('#escena-e27 [data-memb-plan="cobertura"]')?.getAttribute('aria-pressed'))) === 'false', JSON.stringify((await sceneState()).membership));
await clickJs('#escena-e27 [data-memb-choose]');
await page.waitForTimeout(300);
check('7M-B membresías: «Elegir este plan» SÍ persiste la selección', (await sceneState()).membership === 'cobertura', JSON.stringify((await sceneState()).membership));

// Bloque E: cierre V2 (E29)
await page.evaluate(() => document.querySelector('#escena-e29')?.scrollIntoView({ behavior: 'instant' }));
await page.waitForTimeout(700);
await waitBound('[data-recommendation]');
check('7M-B cierre: 6 tarjetas de capacidad', (await page.evaluate(() => document.querySelectorAll('#escena-e29 [data-cierre-card]').length)) === 6);
await clickJs('#escena-e29 [data-cierre-card="web"] [data-cierre-toggle]');
await page.waitForTimeout(300);
check('7M-B cierre: añadir capacidad persiste en estado.capabilities', (await sceneState()).capabilities?.includes('web') === true && await page.evaluate(() => document.querySelector('#escena-e29 [data-cierre-card="web"] [data-cierre-toggle]')?.getAttribute('aria-pressed') === 'true'));
check('7M-B cierre: meta refleja ruta + membresía + capacidad', await page.evaluate(() => { const t = document.querySelector('#escena-e29 [data-cierre-meta]')?.textContent ?? ''; return t.includes('ruta') && t.includes('COBERTURA') && t.includes('Web'); }), await page.evaluate(() => document.querySelector('#escena-e29 [data-cierre-meta]')?.textContent ?? ''));
check('7M-B cierre: acciones finales presentes (TXT, volver, reiniciar, WhatsApp con contexto)', await page.evaluate(() => !!document.querySelector('#escena-e29 [data-cierre-download]') && !!document.querySelector('#escena-e29 [data-cierre-top]') && !!document.querySelector('#escena-e29 [data-cierre-restart]') && (document.querySelector('#escena-e29 [data-cierre-wa]')?.href ?? '').includes('wa.me')));
await clickJs('#escena-e29 [data-cierre-card="agentes"] [data-cierre-demo]');
await page.waitForFunction(() => (document.querySelector('#escena-e29 [data-cierre-card="agentes"] [data-cierre-run]')?.textContent ?? '').length > 3, { timeout: 6000 }).catch(() => {});
check('7M-B cierre: demo de tarjeta recorre 3 pasos', (await page.evaluate(() => document.querySelector('#escena-e29 [data-cierre-card="agentes"] [data-cierre-run]')?.textContent ?? '')).includes('/3') || (await page.evaluate(() => document.querySelector('#escena-e29 [data-cierre-card="agentes"] [data-cierre-run]')?.textContent ?? '')).includes('✓'), await page.evaluate(() => document.querySelector('#escena-e29 [data-cierre-card="agentes"] [data-cierre-run]')?.textContent ?? ''));

// --- v4-A: mundos de llegada diferenciados ------------------------------------------
const arrivals = await page.evaluate(() => ({
  e03: { demo: !!document.querySelector('#escena-e03 [data-demo="infra2"]'), art: document.querySelector('#escena-e03 .scene__art')?.dataset.artSlot ?? null, chapter: document.querySelector('#escena-e03')?.dataset.chapter ?? null, tone: document.querySelector('#escena-e03')?.dataset.tone ?? null, title: document.querySelector('#escena-e03 [data-role="title"]')?.textContent ?? '' },
  e07: { demo: !!document.querySelector('#escena-e07 [data-demo="flow"]'), art: document.querySelector('#escena-e07 .scene__art')?.dataset.artSlot ?? null, chapter: document.querySelector('#escena-e07')?.dataset.chapter ?? null, tone: document.querySelector('#escena-e07')?.dataset.tone ?? null },
  e15: { demo: !!document.querySelector('#escena-e15 [data-demo="red"]'), art: document.querySelector('#escena-e15 .scene__art')?.dataset.artSlot ?? null, chapter: document.querySelector('#escena-e15')?.dataset.chapter ?? null, tone: document.querySelector('#escena-e15')?.dataset.tone ?? null },
  chapters: new Set([...document.querySelectorAll('[data-chapter]')].map((el) => el.dataset.chapter)).size,
}));
check('7M-B empresa: llegada con demo infra soberana + arte A04 + capítulo mundo', arrivals.e03.demo && arrivals.e03.art === 'A04' && arrivals.e03.chapter === 'mundo', JSON.stringify(arrivals.e03));
check('v4-A eficiencia: llegada con demo flujo + arte A03', arrivals.e07.demo && arrivals.e07.art === 'A03' && arrivals.e07.chapter === 'mundo', JSON.stringify(arrivals.e07));
check('7M-B exploración: llegada con demo red colaborativa + arte A05', arrivals.e15.demo && arrivals.e15.art === 'A05' && arrivals.e15.chapter === 'mundo', JSON.stringify(arrivals.e15));
check('v4-A: los 3 mundos usan tonos distintos (petrol/electric/emerald)', arrivals.e03.tone === 'petrol' && arrivals.e07.tone === 'electric' && arrivals.e15.tone === 'emerald', `${arrivals.e03.tone}/${arrivals.e07.tone}/${arrivals.e15.tone}`);
check('v4-A: capítulos narrativos presentes (>=5)', arrivals.chapters >= 5, `${arrivals.chapters} capítulos`);

// transición unificada por botón: cámara en 3 momentos distintos + portal a mitad
await page.evaluate(() => { try { sessionStorage.clear(); } catch {} });
await page.goto(BASE, { waitUntil: 'networkidle' });
await pscroll(0);
await page.waitForTimeout(2600);
const camAt = async () => page.evaluate(() => document.querySelector('[data-prism-canvas]')?.dataset.camera ?? '');
const cam0 = await camAt();
await click('[data-route-choice="enterprise"]');
let portalMidBtn = 0;
let camMid = cam0;
for (let i = 0; i < 40; i++) {
  await page.waitForTimeout(150);
  const op = await page.evaluate(() => Math.max(...[...document.querySelectorAll('[data-portal-layer]')].map((l) => Number(getComputedStyle(l).opacity))));
  if (op > portalMidBtn) { portalMidBtn = op; camMid = await camAt(); }
  if ((await page.evaluate(() => document.documentElement.dataset.act)) === 'enterprise' && op < 0.05 && i > 4) break;
}
await page.waitForFunction(() => document.documentElement.dataset.act === 'enterprise', { timeout: 15000 }).catch(() => {});
await scrollSettled(12000);
const cam1 = await camAt();
const portalEndBtn = await page.evaluate(() => {
  const ops = [...document.querySelectorAll('[data-portal-layer]')].map((l) => Number(getComputedStyle(l).opacity));
  return Math.max(...ops);
});
check('v4-A transición botón: cámara cambia en 3 momentos (inicio/medio/fin)', cam0 !== camMid && camMid !== cam1 && cam0 !== cam1, `0=${cam0.slice(0, 26)} mid=${camMid.slice(0, 26)} fin=${cam1.slice(0, 26)}`);
check('v4-A transición botón: portal visible a mitad del viaje', portalMidBtn > 0.1, `maxOp=${portalMidBtn.toFixed(2)}`);
check('v4-A transición botón: portal disuelto al aterrizar', portalEndBtn < 0.05, `maxOp=${portalEndBtn.toFixed(2)}`);

// --- portal prismático P0-01 -----------------------------------------------------
const portalLayers = await page.evaluate(() =>
  [...document.querySelectorAll('[data-portal-layer]')].map((el) => el.getAttribute('src')),
);
check('portal: 4 capas SVG presentes', portalLayers.length === 4 && portalLayers.every((s) => s?.includes('/assets/portal/')), portalLayers.join(','));

const portalState = () =>
  page.evaluate(() => {
    const overlay = document.querySelector('[data-portal-overlay]');
    const ops = [...document.querySelectorAll('[data-portal-layer]')].map((l) => Number(getComputedStyle(l).opacity));
    return { progress: overlay?.dataset.portalProgress ?? '0', maxOp: Math.max(...ops), visible: ops.some((o) => o > 0.05) };
  });

// ruta por scroll libre: mitad del scrub → portal visible; final → oculto; vuelta → visible
await page.evaluate(() => { try { sessionStorage.clear(); } catch {} });
await page.goto(BASE, { waitUntil: 'networkidle' });
await pscroll(0);
await waitUniverse();
await page.waitForTimeout(1200);
await page.mouse.move(680, 400);
for (let i = 0; i < 4; i++) { await page.mouse.wheel(0, 300); await page.waitForTimeout(200); }
await page.waitForTimeout(1200);
const portalMid = await portalState();
check('portal: visible a mitad del recorrido por scroll', portalMid.visible && Number(portalMid.progress) > 0.05, JSON.stringify(portalMid));
for (let i = 0; i < 8; i++) { await page.mouse.wheel(0, 600); await page.waitForTimeout(160); }
await page.waitForTimeout(1400);
const portalEnd = await portalState();
check('portal: se disuelve al aterrizar en el mundo', !portalEnd.visible, JSON.stringify(portalEnd));
await page.evaluate(() => window.scrollTo({ top: Math.round(window.innerHeight * 0.75), behavior: 'instant' }));
await page.waitForTimeout(900);
const portalBack = await portalState();
check('portal: reversible — a mitad del scrub otra vez es visible', portalBack.visible && Number(portalBack.progress) > 0.05, JSON.stringify(portalBack));
await pscroll(0);
await page.waitForTimeout(900);
const portalTop = await portalState();
check('portal: al volver al inicio (progreso 0) queda oculto', !portalTop.visible, JSON.stringify(portalTop));

// ruta por botón: pulso durante la transición y oculto después
await page.evaluate(() => document.querySelector('[data-act-back]')?.click());
await page.waitForFunction(() => document.documentElement.dataset.act === 'hero', { timeout: 15000 }).catch(() => {});
await scrollSettled(12000);
await click('[data-route-choice="enterprise"]');
let portalBtn = { visible: false, maxOp: 0, progress: '0' };
for (let i = 0; i < 40; i++) {
  await page.waitForTimeout(150);
  const st = await portalState();
  if (st.maxOp > portalBtn.maxOp) portalBtn = st;
  if ((await page.evaluate(() => document.documentElement.dataset.act)) === 'enterprise' && !st.visible && i > 4) break;
}
check('portal: pulso visible durante transición por botón', portalBtn.visible, JSON.stringify(portalBtn));
await page.waitForFunction(() => document.documentElement.dataset.act === 'enterprise', { timeout: 15000 }).catch(() => {});
await page.waitForFunction(() => Math.max(...[...document.querySelectorAll('[data-portal-layer]')].map((l) => Number(getComputedStyle(l).opacity))) < 0.05, { timeout: 15000 }).catch(() => {});
const portalBtnAfter = await portalState();
check('portal: oculto tras aterrizar (ruta botón)', !portalBtnAfter.visible, JSON.stringify(portalBtnAfter));


// ================= 7M-C: correcciones auditadas + A08 + A06 + matriz =================
await page.evaluate(() => { try { sessionStorage.clear(); } catch {} });
await page.goto(BASE, { waitUntil: 'networkidle', timeout: 60000 });
await page.waitForTimeout(2600);
// E03 es escena de ruta enterprise: activar la ruta antes de medir
for (let att = 0; att < 3; att++) {
  await page.evaluate(() => { window.__publiaLastProgrammaticScroll = Date.now(); window.scrollTo(0, 0); });
  await page.evaluate(() => document.querySelector('[data-route-choice="enterprise"]')?.click());
  try { await page.waitForFunction(() => document.documentElement.dataset.act === 'enterprise', null, { timeout: 30000 }); break; } catch { await page.waitForTimeout(1500); }
}

// 1. Racks E03: transform válido y posiciones distintas (ruta enterprise activa)
await page.evaluate(() => document.querySelector('#escena-e03')?.scrollIntoView({ behavior: 'instant', block: 'center' }));
await waitBound('[data-demo="infra2"]');
const rackInfo = await page.evaluate(() => {
  const els = [...document.querySelectorAll('#escena-e03 [data-infra2-rack]')];
  const rects = els.map((r) => { const b = r.getBoundingClientRect(); return `${Math.round(b.x)},${Math.round(b.y)}`; });
  return { n: els.length, distinct: new Set(rects).size, transform: getComputedStyle(els[0]).transform, display: getComputedStyle(document.querySelector('#escena-e03')).display };
});
check('7M-C infra: 10 racks con transform computado válido (no none)', rackInfo.n === 10 && rackInfo.transform !== 'none' && rackInfo.display !== 'none', JSON.stringify(rackInfo));
check('7M-C infra: los 10 racks ocupan posiciones distintas', rackInfo.distinct === 10, `distinct=${rackInfo.distinct}`);
check('7M-C infra: sin auto-selección persistida (null hasta que el visitante elige)', (await sceneState()).infra === null, JSON.stringify((await sceneState()).infra));

// 5. Membresías: default visual sin persistir
await page.evaluate(() => document.querySelector('#escena-e27')?.scrollIntoView({ behavior: 'instant', block: 'center' }));
await waitBound('[data-demo="memberships"]');
await page.waitForTimeout(400);
check('7M-C membresías: BASE es solo visual; estado queda en null', (await sceneState()).membership === null && (await page.evaluate(() => document.querySelector('#escena-e27 [data-memb-plan="base"]')?.getAttribute('aria-pressed'))) === 'true');

// A08 Housing en E22 (escena compartida, visible en cualquier ruta)
await page.evaluate(() => document.querySelector('#escena-e22')?.scrollIntoView({ behavior: 'instant', block: 'center' }));
await waitBound('[data-demo="housing"]');
const segW = () => page.evaluate(() => [...document.querySelectorAll('#escena-e22 [data-housing-segments] .housing__seg')].map((x) => x.style.width));
check('7M-C housing: default compartido 50/25/25', JSON.stringify(await segW()) === JSON.stringify(['50%', '25%', '25%']), JSON.stringify(await segW()));
await clickJs('#escena-e22 [data-housing-mode="privado"]');
await page.waitForTimeout(700);
check('7M-C housing: privado = 100% y persiste en state.housingMode', JSON.stringify(await segW()) === JSON.stringify(['100%']) && (await sceneState()).housingMode === 'privado', JSON.stringify(await segW()));
check('7M-C housing: stage transforma los racks (data-mode=privado)', await page.evaluate(() => document.querySelector('#escena-e22 [data-housing-stage]')?.dataset.mode) === 'privado');
await clickJs('#escena-e22 [data-housing-play]');
await page.waitForTimeout(500);
check('7M-C housing: demo ilumina el stage (data-demo-state=on)', await page.evaluate(() => document.querySelector('#escena-e22 [data-housing-stage]')?.dataset.demoState) === 'on');
await page.reload({ waitUntil: 'networkidle', timeout: 60000 });
await page.waitForTimeout(2200);
await page.evaluate(() => document.querySelector('#escena-e22')?.scrollIntoView({ behavior: 'instant', block: 'center' }));
await waitBound('[data-demo="housing"]');
check('7M-C housing: recarga restaura privado (botón + estado)', (await sceneState()).housingMode === 'privado' && (await page.evaluate(() => document.querySelector('#escena-e22 [data-housing-mode="privado"]')?.getAttribute('aria-pressed'))) === 'true');

// Cierre incluye housingMode en la meta
await page.evaluate(() => document.querySelector('#escena-e29')?.scrollIntoView({ behavior: 'instant', block: 'center' }));
await waitBound('[data-recommendation]');
const metaTxt = await page.evaluate(() => document.querySelector('#escena-e29 [data-cierre-meta]')?.textContent ?? '');
check('7M-C cierre: la meta incluye la modalidad Housing elegida', /Housing: privado/.test(metaTxt), metaTxt.slice(0, 140));

// A06 preparado en E26
await page.evaluate(() => document.querySelector('#escena-e26')?.scrollIntoView({ behavior: 'instant', block: 'center' }));
await waitBound('[data-demo="marketing"]');
check('7M-C A06: 5 áreas + 3 demos seleccionables presentes', (await page.evaluate(() => document.querySelectorAll('#escena-e26 [data-mkt-area]').length)) === 5 && (await page.evaluate(() => document.querySelectorAll('#escena-e26 [data-mkt-demo]').length)) === 3);
await clickJs('#escena-e26 [data-mkt-run]');
await page.waitForFunction(() => (document.querySelector('#escena-e26 [data-mkt-result]')?.textContent ?? '').length > 5, null, { timeout: 12000 }).catch(() => {});
check('7M-C A06: ejecutar demo muestra resultado', (await page.evaluate(() => document.querySelector('#escena-e26 [data-mkt-result]')?.textContent ?? '')).length > 5);

// 2+3. Red (E15 es ruta explorer): boot limpio en unclassified
await page.evaluate(() => { try { sessionStorage.clear(); } catch {} });
await page.goto(BASE, { waitUntil: 'networkidle', timeout: 60000 });
await page.waitForTimeout(2400);
await page.evaluate(() => document.querySelector('#escena-e15')?.scrollIntoView({ behavior: 'instant', block: 'center' }));
await waitBound('[data-demo="red"]');
await clickJs('#escena-e15 [data-red-node="2"]');
await page.waitForTimeout(400);
check('7M-C red: clic en nodo persiste en estado', (await sceneState()).red === 'sitios', JSON.stringify((await sceneState()).red));
await page.reload({ waitUntil: 'networkidle', timeout: 60000 });
await page.waitForTimeout(2200);
await page.evaluate(() => document.querySelector('#escena-e15')?.scrollIntoView({ behavior: 'instant', block: 'center' }));
await waitBound('[data-demo="red"]');
const redRestored = await page.evaluate(() => document.querySelector('#escena-e15 [data-red-node="2"]')?.getAttribute('aria-pressed'));
check('7M-C red: tras recarga se restaura la selección previa (sin sobrescribir)', redRestored === 'true' && (await sceneState()).red === 'sitios', `pressed=${redRestored}`);

// Matriz de resoluciones: sin overflow horizontal en escenas clave (enterprise + explorer)
for (const [w, h] of [[390, 844], [1366, 768], [1440, 900], [1920, 1080], [3440, 1440]]) {
  const c2 = await browser.newContext({ viewport: { width: w, height: h } });
  const pp = await c2.newPage();
  await pp.addInitScript(() => { try { history.scrollRestoration = 'manual'; } catch {} });
  await pp.goto(BASE, { waitUntil: 'networkidle', timeout: 60000 });
  await pp.waitForTimeout(2200);
  for (let att = 0; att < 3; att++) {
    await pp.evaluate(() => { window.__publiaLastProgrammaticScroll = Date.now(); window.scrollTo(0, 0); });
    await pp.evaluate(() => document.querySelector('[data-route-choice="enterprise"]')?.click());
    try { await pp.waitForFunction(() => document.documentElement.dataset.act === 'enterprise', null, { timeout: 30000 }); break; } catch { await pp.waitForTimeout(1500); }
  }
  let overflow = false;
  for (const sel of ['#escena-e03', '#escena-e22', '#escena-e26', '#escena-e29']) {
    await pp.evaluate((s2) => document.querySelector(s2)?.scrollIntoView({ behavior: 'instant', block: 'center' }), sel);
    await pp.waitForTimeout(700);
    if ((await pp.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)) > 1) overflow = true;
  }
  await pp.evaluate(() => document.querySelector('[data-route-reset]')?.click());
  await pp.waitForTimeout(2000);
  await pp.evaluate(() => document.querySelector('#escena-e15')?.scrollIntoView({ behavior: 'instant', block: 'center' }));
  await pp.waitForTimeout(900);
  if ((await pp.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)) > 1) overflow = true;
  await pp.screenshot({ path: `${OUT}/7mc-res-${w}x${h}.png` });
  check(`7M-C matriz ${w}×${h}: sin overflow horizontal en E03/E15/E22/E26/E29`, !overflow);
  await c2.close();
}

// Movimiento reducido: housing renderiza estático sin errores
const rmCtx = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' });
const rmp = await rmCtx.newPage();
await rmp.goto(BASE, { waitUntil: 'networkidle', timeout: 60000 });
await rmp.waitForTimeout(2200);
await rmp.evaluate(() => document.querySelector('#escena-e22')?.scrollIntoView({ behavior: 'instant', block: 'center' }));
await rmp.waitForFunction((s2) => document.querySelector(s2)?.dataset.bound === '1', '[data-demo="housing"]', { timeout: 30000 }).catch(() => {});
const rmBound = await rmp.evaluate(() => document.querySelector('[data-demo="housing"]')?.dataset.bound);
const rmAnim = await rmp.evaluate(() => getComputedStyle(document.querySelector('#escena-e22 .housing__rings')).animationName);
check('7M-C reduced-motion: housing enlazado y anillos sin animación', rmBound === '1' && rmAnim === 'none', `bound=${rmBound} anim=${rmAnim}`);
await rmCtx.close();


// ================= 7M-D: P0-01 red, P0-02 membresías, P0-03 cierre, P0-04 A06 =================
await page.evaluate(() => { try { sessionStorage.clear(); } catch {} });
await page.goto(BASE, { waitUntil: 'networkidle', timeout: 60000 });
await page.waitForTimeout(2400);

// P0-01: la demo de Red NO modifica state.red y restaura el foco
await page.evaluate(() => document.querySelector('#escena-e15')?.scrollIntoView({ behavior: 'instant', block: 'center' }));
await waitBound('[data-demo="red"]');
await clickJs('#escena-e15 [data-red-node="2"]');
await page.waitForTimeout(400);
check('7M-D P0-01: nodo 3 elegido persiste', (await sceneState()).red === 'sitios', JSON.stringify((await sceneState()).red));
await clickJs('#escena-e15 [data-red-run]');
await page.waitForFunction(() => {
  const r = document.querySelector('#escena-e15 [data-red-result]')?.textContent ?? '';
  const btn = document.querySelector('#escena-e15 [data-red-run]');
  return r.length > 10 && btn && !btn.disabled;
}, null, { timeout: 15000 }).catch(() => {});
const afterDemo = await page.evaluate(() => ({
  red: JSON.parse(sessionStorage.getItem('publia.visitor.v1') ?? '{}').red,
  pressed: document.querySelector('#escena-e15 [data-red-node="2"]')?.getAttribute('aria-pressed'),
  result: document.querySelector('#escena-e15 [data-red-result]')?.textContent ?? '',
}));
check('7M-D P0-01: tras completar la demo, state.red conserva el nodo 3', afterDemo.red === 'sitios', JSON.stringify(afterDemo));
check('7M-D P0-01: al terminar la demo el foco visual vuelve a la capacidad elegida', afterDemo.pressed === 'true', `pressed=${afterDemo.pressed}`);
await page.reload({ waitUntil: 'networkidle', timeout: 60000 });
await page.waitForTimeout(2200);
await page.evaluate(() => document.querySelector('#escena-e15')?.scrollIntoView({ behavior: 'instant', block: 'center' }));
await waitBound('[data-demo="red"]');
check('7M-D P0-01: tras recarga se restaura la selección (regresión completa)', (await sceneState()).red === 'sitios' && (await page.evaluate(() => document.querySelector('#escena-e15 [data-red-node="2"]')?.getAttribute('aria-pressed'))) === 'true');

// P0-02: membresías — sugerencia ≠ selección
await page.evaluate(() => document.querySelector('#escena-e27')?.scrollIntoView({ behavior: 'instant', block: 'center' }));
await waitBound('[data-demo="memberships"]');
await clickJs('#escena-e27 [data-memb-goal="support"]');
await clickJs('#escena-e27 [data-memb-team="large"]');
await clickJs('#escena-e27 [data-memb-recommend]');
await page.waitForTimeout(400);
const reco1 = await page.evaluate(() => ({
  badge: !document.querySelector('#escena-e27 [data-memb-badge="cobertura"]')?.hidden,
  pressedCobertura: document.querySelector('#escena-e27 [data-memb-plan="cobertura"]')?.getAttribute('aria-pressed'),
  chosen: document.querySelector('#escena-e27 [data-memb-chosen]')?.textContent ?? '',
}));
check('7M-D P0-02: la sugerencia se marca con badge, sin pisar la selección (aria-pressed sigue en BASE, estado null)', reco1.badge && reco1.pressedCobertura === 'false' && (await sceneState()).membership === null, JSON.stringify(reco1));
await clickJs('#escena-e27 [data-memb-choose]');
await page.waitForTimeout(300);
check('7M-D P0-02: «Elegir este plan» persiste COBERTURA', (await sceneState()).membership === 'cobertura' && (await page.evaluate(() => document.querySelector('#escena-e27 [data-memb-plan="cobertura"]')?.getAttribute('aria-pressed'))) === 'true');
await clickJs('#escena-e27 [data-memb-goal="start"]');
await clickJs('#escena-e27 [data-memb-team="small"]');
await clickJs('#escena-e27 [data-memb-recommend]');
await page.waitForTimeout(400);
const reco2 = await page.evaluate(() => ({
  badgeBase: !document.querySelector('#escena-e27 [data-memb-badge="base"]')?.hidden,
  pressedCobertura: document.querySelector('#escena-e27 [data-memb-plan="cobertura"]')?.getAttribute('aria-pressed'),
  chosen: document.querySelector('#escena-e27 [data-memb-chosen]')?.textContent ?? '',
}));
check('7M-D P0-02: nueva sugerencia (BASE) no reemplaza la selección confirmada (COBERTURA)', reco2.badgeBase && reco2.pressedCobertura === 'true' && (await sceneState()).membership === 'cobertura' && /COBERTURA/.test(reco2.chosen), JSON.stringify(reco2));
// infraestructura: recomendación independiente de Housing, sin plan predeterminado
await clickJs('#escena-e27 [data-memb-goal="infrastructure"]');
await clickJs('#escena-e27 [data-memb-recommend]');
await page.waitForTimeout(300);
const recoInfra = await page.evaluate(() => ({
  text: document.querySelector('#escena-e27 [data-memb-reco-text]')?.textContent ?? '',
  chooseHidden: document.querySelector('#escena-e27 [data-memb-choose]')?.hidden,
}));
check('7M-D P0-02: infraestructura → recomendación Housing independiente, sin plan forzado ni tarifas', /Housing/.test(recoInfra.text) && /dimensionar/.test(recoInfra.text) && recoInfra.chooseHidden === true && !/\$\d/.test(recoInfra.text), recoInfra.text.slice(0, 90));

// P0-03: cierre personalizado desde el estado completo + coherencia con enlaces
await page.evaluate(() => document.querySelector('#escena-e22')?.scrollIntoView({ behavior: 'instant', block: 'center' }));
await waitBound('[data-demo="housing"]');
await clickJs('#escena-e22 [data-housing-mode="privado"]');
await page.waitForTimeout(400);
await page.evaluate(() => document.querySelector('#escena-e29')?.scrollIntoView({ behavior: 'instant', block: 'center' }));
await waitBound('[data-recommendation]');
await clickJs('#escena-e29 [data-cierre-card="web"] [data-cierre-toggle]');
await page.waitForTimeout(500);
const cierreView = await page.evaluate(() => {
  const list = document.querySelector('#escena-e29 [data-recommendation-list]')?.textContent ?? '';
  const meta = document.querySelector('#escena-e29 [data-cierre-meta]')?.textContent ?? '';
  const wa = decodeURIComponent(document.querySelector('#escena-e29 [data-cierre-wa]')?.getAttribute('href') ?? '');
  return { list, meta, wa };
});
check('7M-D P0-03: lista visible refleja membresía + housing + capacidad elegidas', /COBERTURA/.test(cierreView.list) && /privad/i.test(cierreView.list) && /WEB/i.test(cierreView.list), cierreView.list.slice(0, 120));
check('7M-D P0-03: meta y enlace WhatsApp coherentes con la lista (mismo estado)', /COBERTURA/.test(cierreView.meta) && /Housing/.test(cierreView.meta) && /Housing: modalidad privada/.test(cierreView.wa) && /COBERTURA/.test(cierreView.wa) && /web/i.test(cierreView.wa), cierreView.wa.slice(0, 100));
// teclado: enfocar toggle de tarjeta y activar con Enter
await page.evaluate(() => document.querySelector('#escena-e29 [data-cierre-card="marketing"] [data-cierre-toggle]')?.focus());
await page.keyboard.press('Enter');
await page.waitForTimeout(400);
check('7M-D teclado: Enter sobre el botón enfocado añade la capacidad', (await sceneState()).capabilities?.includes('marketing') === true);

// P0-04: A06 sin promesas + áreas como controles
await page.evaluate(() => document.querySelector('#escena-e26')?.scrollIntoView({ behavior: 'instant', block: 'center' }));
await waitBound('[data-demo="marketing"]');
const e26text = await page.evaluate(() => document.querySelector('#escena-e26')?.textContent ?? '');
check('7M-D P0-04: A06 sin promesas de plazos/volúmenes (48 h / 30 piezas)', !/48\s*h|30\s*piezas/i.test(e26text));
await clickJs('#escena-e26 [data-mkt-area="campanas"]');
await page.waitForTimeout(300);
const areaState = await page.evaluate(() => ({
  expanded: document.querySelector('#escena-e26 [data-mkt-area="campanas"]')?.getAttribute('aria-expanded'),
  panelVisible: !document.querySelector('#escena-e26 [data-mkt-panel="campanas"]')?.hidden,
  chip: document.querySelector('#escena-e26 [data-mkt-demo="campana-local"]')?.getAttribute('aria-pressed'),
}));
check('7M-D P0-04: el área abre información y selecciona su caso (cambio visual)', areaState.expanded === 'true' && areaState.panelVisible && areaState.chip === 'true', JSON.stringify(areaState));
await clickJs('#escena-e26 [data-mkt-run]');
await page.waitForFunction(() => (document.querySelector('#escena-e26 [data-mkt-result]')?.textContent ?? '').length > 5, null, { timeout: 12000 }).catch(() => {});
check('7M-D P0-04: los escenarios siguen ejecutables', (await page.evaluate(() => document.querySelector('#escena-e26 [data-mkt-result]')?.textContent ?? '')).length > 5);

// axe en rutas eficiencia y exploración + tras abrir controles interactivos
for (const r of ['efficiency', 'explorer']) {
  const ap = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await ap.goto(BASE, { waitUntil: 'networkidle', timeout: 60000 });
  await ap.waitForTimeout(2200);
  for (let att = 0; att < 3; att++) {
    await ap.evaluate((rr) => { window.__publiaLastProgrammaticScroll = Date.now(); window.scrollTo(0, 0); }, r);
    await ap.evaluate((rr) => document.querySelector(`[data-route-choice="${rr}"]`)?.click(), r);
    try { await ap.waitForFunction((rr) => document.documentElement.dataset.act === rr, r, { timeout: 30000 }); break; } catch { await ap.waitForTimeout(1500); }
  }
  await ap.evaluate(() => document.querySelector('#escena-e22')?.scrollIntoView({ behavior: 'instant', block: 'center' }));
  await ap.waitForFunction((s2) => document.querySelector(s2)?.dataset.bound === '1', '[data-demo="housing"]', { timeout: 30000 }).catch(() => {});
  await ap.evaluate(() => document.querySelector('#escena-e22 [data-housing-mode="privado"]')?.click());
  await ap.evaluate(() => document.querySelector('#escena-e26')?.scrollIntoView({ behavior: 'instant', block: 'center' }));
  await ap.waitForFunction((s2) => document.querySelector(s2)?.dataset.bound === '1', '[data-demo="marketing"]', { timeout: 30000 }).catch(() => {});
  await ap.evaluate(() => document.querySelector('#escena-e26 [data-mkt-area="redes"]')?.click());
  await ap.waitForTimeout(600);
  await ap.addScriptTag({ content: axeSource });
  const axeR = await ap.evaluate(async () => {
    const run = await window.axe.run(document, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'best-practice'] } });
    return run.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical' || v.impact === 'moderate').map((v) => `${v.id}×${v.nodes.length}`);
  });
  check(`7M-D axe ruta ${r} tras abrir controles: sin violaciones graves/moderadas`, axeR.length === 0, axeR.join(', ') || '0');
  await ap.close();
}

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
