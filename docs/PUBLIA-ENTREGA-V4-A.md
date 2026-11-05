# Entrega V4-A — Tres mundos de llegada + transición unificada por el portal

Según `PUBLIA_DANY_PARIDAD_VISUAL_SCROLL_V4_COMPLETO.zip` (referencia: `REFERENCIAS/visualizador_distribucion_APROBADO.html`).

- **commit:** `git log` rama `feature/publia-6-frontend` (feat v4-A)
- **URL staging:** https://kitty-midi-grid-liked.trycloudflare.com (producción intacta; hero congelado y verificado igual)
- **QA:** 125/125 local y pública · unit 15/15 · tsc/build limpios · 0 errores JS/HTTP

## Evidencia A/B (prototipo aprobado vs staging, 1440×900, mismos scrolls)
`docs/audit/v4/`: `ref-000/025/050/075/100.png` (visualizador aprobado) · `staging-{neutral,empresa,eficiencia,exploracion}-*.png` · **comparativos lado a lado** `comparativo-*.jpg` (izquierda referencia, derecha staging).

## Escenas de llegada (capturas)
- `v4-llegada-empresa-E03.png` — noche tecnológica petrol + rack (slot A04) + chips Datos/Agentes/Operación + titular «TU INFRAESTRUCTURA. **TUS REGLAS.**»
- `v4-llegada-eficiencia-E07.png` — azul eléctrico + pipeline consulta→agente→persona→seguimiento (slot A03) + «EL TIEMPO NO VUELVE. **RECUPÉRALO.**»
- `v4-llegada-exploracion-E15.png` — verde profundo + GeoNodos (slot A05) + «UNA IDEA CRECE. **UNA RED LA MULTIPLICA.**»
- `v4-movil-llegada-empresa.png` — 390×844, misma llegada legible

## Videos sin cortes (ida completa + regreso + «← Volver»)
`docs/audit/video/v4-01-ruta-empresa-ida-vuelta.webm`, `v4-02-ruta-eficiencia-ida-vuelta.webm`, `v4-03-ruta-exploracion-ida-vuelta.webm`, `v4-04-movil-exploracion-ida-vuelta.webm` — 0 errores JS en los cuatro; estado final correcto (act=hero, world=hero, scroll=0, ruta conservada).

## Valores de cámara (dataset del canvas)
| ruta | p=0 | p=.25 | p=.5 | p=.75 | p=1 |
|---|---|---|---|---|---|
| empresa (botón) | [0,2.4,11.6] | [1.35,1.71,8.43] | [2.77,1.69,8.97] | [1.9,1.61,8.32] | [1.9,1.3,7.8] |
| eficiencia (botón) | [0,2.4,11.6] | [-1.92,1.71,8.32] | [-1.92,1.71,8.32] | [-2.1,2.17,9.32] | [-2.1,1.5,8.2] |
| exploración (scroll) | [0,2.4,11.6] portal 0 | [0,2.2,9.76] portal 1 | [0.89,1.9,9.99] | [0,1.82,9.33] | [0,1.5,8.8] |

La cámara recorre el mundo destino de forma continua y distinta por ruta; el portal acompaña con scrub (progreso 0→1 y de vuelta) en ruta libre, y con pulso dentro de la MISMA timeline que mueve cámara y contenido en rutas por botón (`travelTo(..., {timeline})` + `portal.playOnTimeline` + `reveal(anchor, tl)`).

## Estados alcanzados (QA automatizado)
route/origin correctos (button/scroll), `transitioning` como semáforo, capítulos `data-chapter` (descubrimiento/mundo/interaccion/convergencia/cierre), demos funcionales en la llegada (infra/flow/geo) que cambian entorno 3D y contenido, respuestas `answers.foco` persistentes, volver sin pérdida, reducido/móvil/teclado OK.

## Cambios introducidos
- `src/lib/three/universe.ts`: `TravelOptions.timeline` (tweens de cámara dentro de una timeline externa).
- `src/lib/experience/portal.ts`: `playOnTimeline`; fade final a 0 en todas las capas.
- `src/lib/experience/narrative.ts`: `enterAct` con UNA timeline (portal + cámara + reveal del destino); `NarrativeOptions.portal`.
- `src/scripts/experience.ts`: portal creado antes que la narrativa y pasado a ella; drive por route+origin.
- `src/data/routes/scenes.ts`: llegadas E03/E07/E15 con demo + arte + copy de referencia; capítulos en `ART_DIRECTION`.
- `src/components/experience/SceneBlock.astro`: `data-chapter`; layout split con arte protagonista a la derecha.
- `scripts/compare-ref.mjs` (nuevo): A/B referencia vs staging. QA 125 (8 nuevos v4-A).

## Pendientes / decisiones por aprobar
1. Paridad del RESTO del home (sprint V4-B): mosaico violeta con selección real, marfil personas+IA, amarillo membresías, cierre personalizado — los tonos ya existen, faltan las composiciones ricas.
2. Recursos P0-02..05 al llegar: los slots A02–A05 ya están cableados (build-time), el portal P0-01 ya integrado.
3. Microinteracciones específicas del doc 03 (halo en botón amarillo, circuito luminoso al primer objeto, P gestual por decisión).
4. P1 previos sin cambio: precio AGENTE, captura server-side, subdominio permanente, Lighthouse CI, axe por ruta.
