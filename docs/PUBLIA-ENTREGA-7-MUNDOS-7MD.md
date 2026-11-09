# PUBLIA 6.0 — Entrega Bloque 7M-D (rama `feature/publia-6-frontend`)

Base: `54aadcb` (7M-C). Estado: **QA 195/195 OK**, `npm test` 19/19, `tsc` limpio, axe 0 violaciones graves/moderadas en rutas eficiencia y exploración con controles abiertos. Producción `publia.mx` intacta.

## Correcciones P0

- **P0-01 Red** (`src/lib/experience/red.ts`): la demo usa foco visual (`choose(nodeIdx, false)`) y al terminar restaura la selección original (`choose(restore, false)`). `state.red` jamás se pisa por demos. Regresión cubierta en QA: nodo 3 → demo completa → estado conserva `sitios` → recarga → restaurado (aria-pressed + estado).
- **P0-02 Membresías** (`memberships.ts` + `MembershipsModule.astro`): «Tu selección» (persiste sólo con clic en plan o «Elegir este plan», `data-memb-choose`) separado de «Nuestra sugerencia» (badge `data-memb-badge`, clase `is-suggested`, no persiste). `recommend()` con objetivo infraestructura devuelve `{ plan: null, housing: true }` — recomendación Housing independiente, invitación a dimensionar el equipo, sin tarifas inventadas.
- **P0-03 Cierre** (`postHero.ts`): la lista visible se construye desde el estado completo (capacidades manuales primero, membresía, infra, housingMode, red, servicio, ruta como orientación cuando hay <3 puntos; GeoNodos sin protagonismo en exploración). Meta, lista, WhatsApp, mail y TXT salen del mismo `getState()`/`buildSummary()` y se re-renderizan en `publia:state`. QA verifica coherencia lista ↔ meta ↔ enlace wa decodificado.
- **P0-04 A06** (`marketing.ts`, `MarketingModule.astro`, `marketing.ts`, `scenes.ts`): sin «48 h» ni «30 piezas»; las 5 áreas son controles funcionales (botón `aria-expanded` → panel de información + selección del caso con cambio visual); los 3 escenarios siguen ejecutables; E26 pasa a `modules: ['marketingDemo']` (sin doble catálogo). Assets `public/assets/a06/*.svg` siguen como placeholders documentados (paquete pendiente, sin gráficos definitivos).

## P1

- **P1-01 Housing**: etiqueta de alcance «animación ilustrativa, no simula cargas reales» + placeholder desacoplado `data-housing-metrics` (solicitudes/capacidad/utilización/cola) sin backend. Disclaimers sin precios.
- **P1-02 Tests**: `scripts/commerce.test.ts` (4 pruebas: recommend infraestructura→Housing sin plan, planes por objetivo, buildSummary sin oferta vinculante, Housing sin precios publicados) → 19/19. QA 7M-D (16 checks nuevos): P0-01 con recarga, P0-02 badge/selección/choose, P0-03 coherencia + teclado (Enter añade capacidad), P0-04 A06, axe en eficiencia/exploración tras abrir controles. Contraste AA corregido en catálogo (tone-card/tone-ink; el gris por defecto del UA en color-scheme dark rompía axe).
- **P1-03 Higiene**: `.tmp-vids/` quitado del índice (gitignored; 110 MB liberados), `.tmp/` y `docs/audit/video/` siguen gitignored; scan de credenciales en trabajo e historial limpio.
- **P1-04 Staging**: `docs/PREVIEW-STAGING.md` con build + serve + túnel reproducibles; staging vigente `https://dam-boulevard-explaining-alaska.trycloudflare.com` sirviendo `dist/` del HEAD 7M-D (rebuild actualiza sin reiniciar).

## Evidencia

- Capturas: `docs/audit/7mundos/7md-01-sugerencia-sin-pisar.png`, `7md-02-seleccion-cobertura-vs-sugerencia-base.png`, `7md-03-a06-area-abierta.png`.
- Videos: `docs/audit/video/7md-ruta-{empresa,eficiencia,exploracion}.webm` + demostraciones obligatorias `7md-demo-red-sobrevive.webm` (selección de Red sobrevive a la demo y a la recarga) y `7md-demo-membresia-vs-recomendacion.webm` (COBERTURA confirmada vs nueva sugerencia BASE; el cierre conserva ambas hasta que el visitante confirma).
- Resultados: `docs/evidencia/resultados-qa.json` (195 OK / 0 FALLA).

## Commits del bloque

`765978d` P0-01/P0-02 · `6d8d689` P0-03/P0-04/P1-01 + tests/QA 7M-D · commit de contraste/higiene/staging (ver `git log`).
