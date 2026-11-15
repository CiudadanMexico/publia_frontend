# PUBLIA 7 Mundos — Corrección final 7M-H (informe de hechos)

> DSH reporta hechos medidos; no afirma aprobación visual. La revisión visual final corresponde al bloque con las capturas acreditadas.

- Rama: `feature/publia-6-frontend` · staging: `https://dam-boulevard-explaining-alaska.trycloudflare.com` (sirve `dist/` en vivo)
- Base de la orden: commit `348c238` (fin de 7M-G en verde). Punto de recuperación previo: tag `recovery/pre-7mg` (= `4ae71d7`).
- QA automatizado: **256/256 criterios verificados en verde** (`scripts/qa.mjs`, `EXIT=0`, `.tmp/qa-7mh.log`).
- Pruebas unitarias: **25/25** (`npm test`, incluye 6 tests nuevos del modelo de reparto E22). `tsc --noEmit` limpio. Build OK.
- Producción (`publia.mx`) no tocada; todo en staging.

## Fases entregadas (orden §9)

1. **Ciclo del hero + WebGL independiente (F1)** — estados `idle→armed→pinned→completed` + `route-selected` explícito; ruta transitoria por visita separada de la recordada (`rememberedRoute`); autoridad única de ruta libre (`tryEnterFreeRoute(): boolean`, sólo intenciones hacia abajo: rueda abajo, touch abajo, ArrowDown/PageDown/espacio, arrastre real de scrollbar; nunca arriba/Home/End/PageUp/teclado en inputs); pin único desktop ≥1024 sin reduced-motion de `18×H` con `topNear=navbarH+40`, `topLow=min(0.62H, H−btnH−56)`, fases 0–.12/.12–.22/.22–.70/.70–.88/.88–1, medidas dinámicas (ResizeObserver navbar/acciones/hero, fonts.ready, debounced, preservando progreso y restaurando `.hero__inner`), `pageshow`/bfcache rearma una vez. Carga silenciosa: sin «La escena está tardando…» ni «Reintentar escena» en DOM ni copy; a los 8 s spinner fuera y composición estática; renderer tardío entra con crossfade 240 ms; watchdog sigue observando; `aria-busy` sólo mientras se espera; controles HTML se inician una vez aunque WebGL falle. Verificado: 20 ciclos entrada libre→ruta→volver→reentrada con 1 pin y 0 tras reset (0 fallos), rueda arriba no arma, recarga → `unclassified` + `rememberedRoute` aparte, rebote medido CTA **104 px (topNear) en p=0.12 → 558 px (topLow) en p=0.25, drop 454 px**.
2. **Contenedores/cabezales/carga (F2)** — `.scene__surface` único dueño del padding: max-w 1536; ≥1440:80, 1024–1439:56, 768–1023:32, <768:20; gap 40/32/24/20; panel 32/28/24/20; `max(pad, safe-area)`; medido a 1440 borde de contenido ≤ 1360. Un H2 visible por sección (E03, E22, E27 con sus títulos literales; resto clamp(36px,4.2vw,64px)). E03 H2 «Soberanía digital.» `#F4F7FF` + «Tu tecnología, bajo tus reglas.» `#80E5FF` sobre `#020910`, clamp(48px,5vw,80px) lh 1.04 w800 max-22ch.
3. **Copy + umbral (F3)** — E00 exclusivo de exploración libre (`route: 'explorer'`, oculto tras elegir ruta y visible de nuevo al volver; verificado en QA), copy literal 7M-H (`A TU MANERA` / «Se nota que prefieres abrir tu propio camino» / «Bien. Aquí tú marcas el ritmo.»), paleta `#FFFCFA/#26141A/#B51F3A/#EE725F/#FBE9E7`, banda `#A91E38` con 4 herramientas, 4 summaries. Simulador con 5 presets (WhatsApp 80/6/60/70 → **8 h / 3,36 h / 4,64 h** verificado), barra apilada 42%/58%, 4 resúmenes, CTA WhatsApp con categoría+estimaciones (sin autoenvío). Botón hero literal «SOY UNA GRAN EMPRESA, O ESTOY EN CAMINO DE SERLO» (2 líneas desktop, 16px/1.3 w750, max-w 440, padding 18/26, min-h 76; móvil 15px — verificado por computed style).
4. **E03 escenas 3D (F4)** — `infra3d.ts`: un renderer Three.js, 4 topologías low-poly distintas (oficina 6×4 con servidor interno; oficina desplazada con 2 espacios externos + puerta de permisos; oficina compacta + edificio con 2 racks; 4 nodos en esquinas + oficina cliente con ruta alternativa), coordenadas x −5..5 / z −3..3 / y0, cámara (10,10,12)→(0,0,0), transición 900 ms (inmediata con reduced-motion), «Ver recorrido de una tarea» + pausa, hotspots HTML proyectados con copys literales, panel con 4 filas por modo siempre visibles, CTA «Diseñar mi infraestructura», vínculo «Comparar recursos compartidos y privados» → E22 en Housing; SVG como detalle opcional. Verificado en QA (canvas ≥520 px, 4 filas por modo, botón ruta alternativa sólo en distribuida, vínculo sólo en housing) y en capturas por viewport × 4 modos.
5. **E22 modelo (F5)** — `housingModel.ts` determinista + 6 tests: 100 unidades ilustrativas, compartido 50/25/25 vs privado 100, demanda inicial 85 → **compartido 3 activas/4 en espera (50 usadas), privado 7 activas/0 espera (85 usadas, 15 disponibles)**; entradas editables cantidad 0–10 y coste 1–100; dos columnas siempre visibles y consistentes; selector no altera inputs; rack segmentado 50/50 con reservas visibles sólo en compartido; 4 estaciones etiquetadas (Llamadas/WhatsApp/Documentos/Automatizaciones) con chips En proceso/En espera; secuencia de 6 s con pausa/restablecer (inmediata con reduced-motion); CTA WhatsApp con prefijo «Escenario ilustrativo que quiero dimensionar» + modalidad y cantidades; sin panel de métricas vacío ni tráfico decorativo. Verificado en QA (incl. edición auto→0 → demanda 75, compartido 3 / privado 5 activas).
6. **Regresión visual (F7)** — QA actualizado a 7M-H y corrido completo: **256/256, EXIT=0** (axe sin violaciones graves/moderadas en rutas, matriz de viewports sin overflow horizontal, reduced-motion, cargas silent sin mensaje/reintento, E00 exclusivo, bordes de contenedor, H2 únicos visibles, persistencias).

## Conservado (per 7M-H: no sustituir)

Membresías restauradas (5 planes + diagnóstico), rutas, copy comercial vigente (`COPY_7MF`), contactos (WA `wa.me/525573724660`, `hola@publia.mx`), avances útiles de 7M-F/7M-G (carga, migración de estado, accesos). Nada de producción.

## Evidencia

- Capturas acreditadas PNG + sidecar JSON (escena, modo, rect, opacidad, loadState, título, ruta/act) por viewport {390×844, 768×1024, 1366×768, 1440×900, 1920×1080}: `docs/audit/7mundos/7mh-*` — **45 PNG** (E01, E00, E03×4 modos, E22×2 modalidades, E27 por viewport). Sanity: 30 hashes distintos, 113–827 KB.
- Videos de scroll real: `.tmp-vids/7mh-empresa/`, `.tmp-vids/7mh-eficiencia/`, `.tmp-vids/7mh-libre-pin/` (en disco; gitignored por política de videos).
- QA: `QA_BASE=https://dam-boulevard-explaining-alaska.trycloudflare.com PLAYWRIGHT_BROWSERS_PATH=<browsers> node scripts/qa.mjs` → 256/256, EXIT=0.

## Pendiente

Nada bloqueante. La aprobación visual final es del bloque con las capturas `7mh-*`.
