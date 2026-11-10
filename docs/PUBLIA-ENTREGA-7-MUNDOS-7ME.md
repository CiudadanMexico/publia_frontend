# PUBLIA 6.0 — Entrega Bloque 7M-E (rama `feature/publia-6-frontend`)

Base: `8d662ae` (7M-D). Recuperación: tag `recovery/pre-7m-e`. Producción `publia.mx` intacta. Staging: `https://dam-boulevard-explaining-alaska.trycloudflare.com` (sirve `dist/` del HEAD 7M-E).

## Fase 0 — Inventario
- HEAD remoto == local confirmado; tag de recuperación creado y empujado.
- Matriz completa de las 30 escenas en `docs/MATRIZ-ESCENAS-7ME.md` (ID, ruta, estado, módulos, título).
- Mapa de dependencias: `graph.ts` + `narrative.ts` son el motor canónico (20+ consumidores); `lib/experience/scenes.ts` tenía 0 consumidores.

## Fase 1 — Estado y navegación
- **P0-01** (`ecosystem.ts`): `select(i, persist)`; al iniciar restaura `answers.servicio` con `select(idx, false)` — la inicialización ya no persiste. QA: estado vacío al cargar → clic persiste → demo no pisa → recarga restaura (estado + aria-pressed + panel).
- **P0-02** (`scenes.ts` E15): segmentos `['cooperative','values','explorer']` — sesión nueva con scroll libre (sin botones) llega a E15 visible y enlazada.

## Fase 2 — Recorrido reducido
- 18 escenas pasan a `optional: true`; 12 esenciales. Por ruta: **enterprise 8, efficiency 9, explorer 9 capítulos** (antes 22/25/23).
- «Explorar todo el recorrido» (toggle en hero y en E29, `data-explore-toggle`, estado `exploreAll` persistido en sesión) muestra todas las escenas de la ruta; GeoNodos (E16/E17) y el resto quedan como exploración contextual, no capítulos obligatorios.
- E11 (Personas+IA) pasa a ruta efficiency; E09 queda sin `flowDemo` duplicado; E04 sin `infraDemo` repetido. Los 7 mundos y sus funciones se conservan.

## Fase 3 — Consolidación técnica/comercial
- Retirado `src/lib/experience/scenes.ts` (0 consumidores; verificado con grep de imports).
- `HousingMode`/`HOUSING_MODES` con fuente canónica única en `src/data/memberships/housing.ts`; `data/housing.ts` sólo aporta textos visuales del comparador.
- `data/catalog.ts` seguía vivo (consumido por `routes/scenes.ts`) — se conserva. Servicios WordPress viven en `data/services/` con `source: 'snapshot-precios'` y precios `null`/`quoteRequired` cuando no hay confirmación; membresías canónicas en `data/memberships/`. Sin cambios de condiciones comerciales.

## Fase 4 — Recursos visuales
- E15 ya no usa A05 (GeoNodos): `redDemo` es el visual. E20 ya no usa A02. E22/E26/E27 ya no muestran tile genérico junto al módulo interactivo.
- `A05.scenes` = [E16, E17] (primaria E16 → `data-asset-ready` correcto).
- Sin etiquetas internas visibles: fuera `.art-slot-tag`, el README de `public/assets/a06/`, y la nota con ruta de archivo en el panel A06.
- Fuentes de arte convertidas avif→webp (móvil y desktop, con sharp); `ArtPlaceholder` sirve `image/webp`.

## Fase 5 — A06 integrado en E26
- Los 5 SVG definitivos (`estudio/pantallas/campanas/audiovisual/redes.svg`) extraídos del prototipo entregado y servidos desde `public/assets/a06/` (sin texto ni marcas registradas dentro del SVG).
- `MarketingModule` incorpora el stage visual del prototipo: al elegir un área, el SVG correspondiente toma el foco (`data-mkt-stage-img`) y se abre su panel; las 3 demostraciones siguen con ejecutar/pausar/reiniciar. Sin escena nueva, sin iframe, todo conceptual sin promesas de plazos/volúmenes.

## Fase 6 — Higiene
- 8 iconos duplicados (`/public/icons/` vs `/public/assets/ecosistema/`) consolidados: canónico `/icons/icono_XX.png`, módulo de ecosistema apunta ahí.
- Evidencia antigua de auditoría (v4, rutas, rutas-v3, imagenes, PNGs viejos de evidencia, matriz de resolución regenerable) retirada del árbol (queda en historial Git) y gitignored. **Trackeado: 154.8 → 30.7 MiB.**
- Videos QA en `docs/audit/video/` (gitignored, compartibles como artefactos).

## Fase 7 — Aceptación
- QA: **216/216** (sección 7M-E: recorrido esencial por ruta, explorar-todo persistido, P0-01/P0-02, A06 5 SVG + stage + 3 demos, sin etiquetas internas; axe rutas, teclado, reduced-motion, matriz de resoluciones mantenidos).
- Unitarios 19/19 · `tsc` limpio · build OK.
- Videos del recorrido nuevo: `docs/audit/video/7me-ruta-{empresa,eficiencia,exploracion}.webm`; capturas `docs/audit/7mundos/7me-01…06-*.png` (hero esencial, E03 empresa, E22 housing, cierre, A06 stage campanas, A06 demo redes).
- Resultados: `docs/evidencia/resultados-qa.json`.

## Commits por fase
`51ef8ae`/`eb2956f` F1 · `08098f1` F2 · `bf038e9` F3 · `507ed4e` F4 · `ffbc4f5`/`803523d` F5 · `c76e096` F6 · `f51786e` QA 7M-E.

## Pendientes (requieren decisión)
- Assets A01/A06/A08/A09 como arte de escena (A02 retirado): el paquete A06 ya entró en E26 como módulo; A08 quedó dentro de `housingCompare`; A09/A01 siguen como placeholders procedurales por aprobación previa.
- Eliminar de raíz los videos antiguos de 7M-B/7M-C si se quiere aligerar más el volumen en disco (no trackeados).
