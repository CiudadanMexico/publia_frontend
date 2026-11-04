# Entrega rediseño visual v3 (`PUBLIA_HOME_REDISENO_VISUAL_SCROLL_v3.zip`) — D1+D2+D3+copy+slots

- **Staging:** https://kitty-midi-grid-liked.trycloudflare.com (producción intacta)
- **Rama:** `feature/publia-6-frontend` · QA **110/110** local y pública · tests 15/15 · `tsc` limpio · build OK · 0 errores JS/HTTP/404 en escritorio, móvil y reducido
- **Hero intacto:** composición aprobada sin cambios (guarda explícita: la modulación por escena no toca el mundo hero; QA de composición vs captura de referencia sigue verde)

## 1. Auditoría visual previa (antes) — prioridad 1
- 3 vídeos sin cortes del estado anterior: `docs/audit/video/01…03-*.webm`
- Capturas por escena + mosaicos ANTES: `docs/audit/rutas/mosaico-{empresa,eficiencia,exploracion}.jpg` (monotonía confirmada: tarjetas sobre fondo oscuro plano tras el hero)

## 2. Evidencia DESPUÉS (v3)
- 3 vídeos sin cortes (ida completa + vuelta + «← Volver», 0 errores): `docs/audit/video/v3-01-ruta-empresa-completa.webm`, `v3-02-ruta-eficiencia-completa.webm`, `v3-03-ruta-exploracion-scroll-completa.webm`
- Capturas por escena (23/26/24) + mosaicos: `docs/audit/rutas-v3/` — verificación numérica de variedad: luminancia de celdas 4–238 con 6–7 niveles de tono distintos por ruta (alternancia oscuro/claro real)
- Móvil 390×844: `docs/audit/rutas-v3/movil-*.png` — sin overflow horizontal (0 px)

## 3. Qué se construyó
| Entrega | Implementación |
|---|---|
| **D1 composición** | 8 tonos luminosos (`cosmos, cream, electric, petrol, emerald, violet, graphite, sun`) con paleta v3 (#FFCD25/#168DE8/#62EAFF/#FF4D60/#965DFF/#54E5A4) · 7 siluetas (`split, center, mosaic, pipeline, map, editorial, plans`) asignadas por escena en `ART_DIRECTION` · tipografía dominante clamp(2.4rem→6.4rem) · acentos `**palabra**` → `<em>` amarilla en TODOS los módulos (el reveal por palabras ahora conserva los `<em>`) · eyebrows con emoji semántico (✨🧠⚡🤝🌱🖥️🧩) · escenas claras (crema/sol) con tinta oscura para contraste real |
| **D2 scroll continuo** | `setSceneLook` en el universo + `sceneLooks.ts`: cada escena conduce con ScrollTrigger scrub (0.8) su propia modulación de cámara/tinte/red/apertura del prisma — reversible por ser scrub (verificado 30/60/90% ida y vuelta en QA) · un solo canvas y un solo loop · guarda: mundo hero = modulación neutra |
| **D3 demos** | Empresa E04: chips Datos/Agentes/Operación → texto + red 3D + cámara (aria-pressed, evento `demo_infra_capa`). Eficiencia E09: foco (mensajes/contenido/ventas/operación/empezando) → guarda `answers.foco`, punto que viaja por consulta→agente→persona→seguimiento, etiqueta «simulación conceptual». Cooperativa E17: GeoNodos SVG — el scroll enciende conexiones por pasos, clic/teclado en nodo explica qué se comparte; sin cifras inventadas |
| **Slots A01–A05** | `src/data/sceneAssets.ts` (manifiesto escena→desktop/móvil/capas/preload/alt) + `ArtPlaceholder.astro` con arte procedural de calidad por slot; detección en **build time** (`existsSync`): al llegar las imágenes a `public/assets/scenes/` el próximo build las sirve solas, sin refactor y sin 404 |
| **Copy (prioridad 6)** | Titulares/eyebrows v3 aplicados (E00, E03, E07, E11, E21, E27…); barrido de las 4 rutas: «persona makeup» → «no finge ser persona» (E09); catálogo: «ChatBots Inteligentes/SemiInteligentes», «…y FB Messenger», «Producción MultiMedia Digital», «Desarrollo Web & Apps», «Campañas Social Media, SEO y ads», «Asesorías I.A.», «Servidores I.A. Empresariales», «Foto de Producto», «MultiMedia» → español natural (precios intactos, vienen del snapshot validado; «Sucri» sigue fuera). housing ya se explica en su primera mención (E21) |

## 4. Pruebas
- QA 110/110 (93 previos + 17 v3: ≥5 composiciones, ≥4 tonos, em-accent ≥5, slots A01–A05, emoji eyebrows, contraste en escena clara, cámara distinta a 30/60/90% y reversible, 3 demos funcionales con cambio de entorno 3D, respuesta guardada, geonodos por scroll) · unit 15/15 · móvil sin overflow · 0 errores de consola incl. 404

## 5. Pendientes
1. **A01–A05 en paralelo**: al recibirlos, colocar en `public/assets/scenes/` y rebuild — el manifiesto ya apunta ahí (D4 del paquete).
2. Segunda tanda A06–A10 (E26, E22, E27 tienen slots listos).
3. D5 del paquete: diagnóstico compartido con recomendación por `answers` y sección comercial completa.
4. P1 previos: precio AGENTE, captura server-side del formulario, subdominio permanente, Lighthouse CI, axe por ruta.
5. Videos en disco (fuera de git por peso, `.gitignore`).
