# PUBLIA 6.0 — Bloque 7M-C: consolidación, A08 Housing, A06 preparado

Rama: `feature/publia-6-frontend` · Base: `764e016` · Solo staging; hero 3D, universo Three.js, ScrollTrigger y estado compartido intactos. Sin iframes.

## FASE 1 · Correcciones auditadas (commit `6955c68`)

| # | Problema | Corrección |
|---|---|---|
| 1 | Racks E03 con `transform: translate(calc(-50% + var(--rx) * 0.55px), …)` → Chromium calculaba `none` | Posicionamiento con `left/top: calc(50% + var(--rx) * 0.1)` / `calc(50% + var(--ry) * 0.085)` + `translate(-50%,-50%)` (porcentaje × número = válido). QA verifica 10 `getBoundingClientRect` distintos en ruta enterprise |
| 2 | `red.ts` inicializaba con `choose(0)` y reescribía el estado | `choose(i, persist)`: el render inicial restaura `getState().red` (o default visual) **sin persistir**; sólo los clics del visitante guardan |
| 3 | `red_demo_run` se emitía al inicio y al final | `red_demo_start` al arrancar, `red_demo_run` al completar (nuevo evento en el contrato) |
| 4 | `postHero.ts` y `cierre.ts` ambos tocaban `[data-recommendation]`; el listener de copiar se acumulaba en cada re-render | `bindPostHero` con guard de una sola vez; el botón copiar usa **`buildSummary()` de `cierre.ts`** — copiar, TXT, WhatsApp y correo comparten exactamente el mismo resumen (incluye capacidades, membresía, infraestructura, red y housing) |
| 5 | `memberships.ts`/`infra.ts` persistían BASE/IA privada sin interacción | Split `render()` (visual) vs `select()` (persiste). Default visual sin escribir estado; la recomendación del diagnóstico es visual; la selección explícita tiene prioridad y persiste |

## FASE 2 · A08 Housing integrado (commit `6955c68`)

- Paquete `PUBLIA_HOUSING_A08.zip` (subido a la bandeja de carga) integrado **nativo**: `HousingCompare.astro` en **E22**, sin iframe, sin tocar hero/universe/InfraDemo E03.
- **Compartido:** 3 racks separados y conectados (50/25/25 con segmentos y leyenda). **Privado:** rack principal escala a 100%, otros dos se atenúan y el escudo se activa — la distribución se transforma físicamente (CSS 3D por `data-mode`).
- Nuevo campo **`state.housingMode: 'compartido' | 'privado' | null`** (separado de `infra`), con migración de sesiones v1 (sanitizer) y recuperación tras recarga.
- Demo "Simular tráfico" con play/pausa/reanudar/restablecer + copiar resumen (mismo `buildSummary` + bloque Housing); eventos `housing_mode_selected` / `housing_demo{action}`.
- El **cierre E29 muestra la modalidad** (`meta` y `buildSummary()`).
- Assets del paquete en `public/assets/a08/` (fondo blueprint, anillos, núcleo, servidor). **Sin precios publicados**; textos del contrato respetados; nada dentro de los SVG; toda interacción en HTML accesible (aria-pressed, role=status, role=img en el stage, reduced-motion sin animaciones).
- E22 ya no repite el módulo `distribution` (el comparador A08 muestra el reparto real).

## FASE 3 · Continuidad cinematográfica

- Una sola fuente de propuesta (cierre), un solo controlador post-hero, binders lazy por escena con disparo por viewport/visita (sin cargas duplicadas ni listeners acumulados).
- Identidad por mundo conservada (tones por escena); E22 sin contenido repetido; transiciones/cámara por escena existentes intactas.
- Verificado en QA: 3 rutas, back/forth, recarga, persistencia, móvil 390, ultrawide 3440, reduced-motion.

## FASE 4 · A06 preparado (commit `92f1d1d`)

- **E26** incorpora `MarketingModule.astro`: 5 áreas (estudio, pantallas, campañas, audiovisual, redes) + 3 demostraciones seleccionables con ejecutar/reiniciar y resultado narrado (no tabla estática).
- Arquitectura lista para el paquete: suelta los recursos en `public/assets/a06/` y se referencian en `src/data/marketing.ts` (`art`); los placeholders SVG actuales evitan 404 y se reemplazan sin tocar código.
- Eventos: `marketing_demo_selected|start|run`. Binder lazy como los demás módulos.

## FASE 5 · Auditoría

- **QA Playwright ampliado a 179 criterios** (`scripts/qa.mjs`, sección 7M-C): racks E03, red con recarga, housing compartido/privado + recarga, cierre con Housing, A06, matriz 390×844 / 1366×768 / 1440×900 / 1920×1080 / 3440×1440 sin overflow horizontal, reduced-motion, axe wcag2aa sin violaciones graves.
- Resultado final: **179/179 criterios verificados** (bitácora `qa-7mc4`; axe wcag2aa sin violaciones graves ni menores).
- **Seguridad (repo público):** `git grep` de secretos en archivos trackeados y últimos 50 commits del historial sin hallazgos (sólo nombre de dependencia en package-lock); sin `.env`/llaves trackeadas; `.tmp/` (túneles, tokens de carga, zips) está en `.gitignore`; token de carga nunca en el repo.
- `tsc --noEmit` limpio · tests 15/15 · build OK · presupuesto inicial sin regresión (253 kB < 260 kB).

## Evidencia

- Capturas comparativas: `docs/audit/7mundos/7mc-01…7mc-09-*.png` + matriz por resolución `docs/audit/7mc-res-*.png` (390/1366/1440/1920/3440).
- Videos con acciones reales sobre tarjetas/demos: `docs/audit/video/7mc-ruta-empresa.webm` (E03 housing+activar red → E22 privado → E27 diagnóstico → E29 tarjetas), `7mc-ruta-eficiencia.webm` (flujo → personas → housing compartido+demo → cierre), `7mc-ruta-exploracion.webm` (red nodo+demo → A06 demo → cierre).
- QA: `docs/evidencia/resultados-qa.json`.

## Pendientes

1. **Paquete A06 pendiente de recibir** — la arquitectura ya está; al llegar, sólo se sueltan recursos en `public/assets/a06/` y se ajustan textos en `src/data/marketing.ts`.
2. Host temporal-3 sigue inalcanzable; staging vigente vía túnel local: `https://dam-boulevard-explaining-alaska.trycloudflare.com`. Bandeja de carga: `https://contract-treasures-thank-que.trycloudflare.com/up/049e455195bab6989ac19908e9d10950af9709180e10c4cf`.
3. GeoNodos (E17) sigue como exploración opcional; P1 previos sin cambios.
