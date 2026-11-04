# Entrega P0 — Refinamiento fase 2 (según `Publia_Fase2_Dany_CORREGIDO.zip`)

- **URL de staging:** https://kitty-midi-grid-liked.trycloudflare.com (no se publicó a producción).
- **Commit:** ver `git log` — rama `feature/publia-6-frontend`; último commit de esta entrega: *feat(P0): ruta C por scroll silencioso, dos botones, tarjetas accesibles y contrato de estado*.
- **Fecha:** 2026-11-04.
- **QA:** 93/93 criterios en local y 93/93 en la URL pública · tests unitarios 15/15 · `tsc --noEmit` limpio · `npm run build` sin errores · 0 errores de consola/pageerror/HTTP≥400 en escritorio, móvil y movimiento reducido.

## 1. Qué cambió respecto a la entrega anterior (antes → después)

| # | Antes | Después (P0) |
|---|---|---|
| 1 | Tercer botón «cooperar» en el hero | **Eliminado.** Sólo dos botones visibles; la tercera ruta entra por **scroll silencioso** (rueda/touch/teclado/barra), con pin+scrub: la cámara atraviesa el prisma hacia el mundo cooperativo mientras el visitante baja. |
| 2 | Ruta implícita por "escena explorer en vista" | **Intención real de scroll** con guardas: ruta `null` + acto hero + no programático (marca de tiempo anti-rezago) + no transición en curso. Tras elegir botón, el scroll **nunca** deriva a exploración (verificado). |
| 3 | Contrato de estado básico | Contrato ampliado: `origin: 'button' \| 'scroll' \| null`, `answers` (arranque/foco/escala), `transitioning` (semáforo), eventos `iniciar_scroll_libre`, `responder`, `cambiar_ruta`, `saltar_animacion`. Verificado: origen `scroll` al entrar por rueda, `button` al hacer clic. |
| 4 | 8 tarjetas sólo 3D | **8 chips DOM accesibles** en el hero: hover/foco/tap → pulso + foco en la tarjeta 3D + tooltip con beneficio real + enlace al recorrido; teclado: Tab/Enter verificados. |
| 5 | Pista de scroll genérica | «¿Prefieres explorar a tu manera? Desplázate ↓» (copy doc 02). |
| 6 | Sin gesto de la P | La P hace un gesto sutil (se acerca/señala) al elegir ruta o entrar por scroll. |
| 7 | Textos con fallos | 3 correcciones editoriales (abajo). |

## 2. Capturas (docs/evidencia/)
- `22-hero-sin-tercer-boton.png` — hero con dos botones + pista de scroll + 8 chips.
- `23-tarjeta-foco-tooltip.png` / `24-tarjeta-seleccionada.png` — tarjeta 3D resaltada + tooltip por foco/teclado.
- `25-scroll-libre-mitad-scrub.png` — mitad del viaje pin+scrub (cámara atravesando el prisma).
- `26-mundo-exploracion.png` — mundo cooperativo tras scroll libre (`route=explorer`, `origin=scroll`).
- `27-vuelta-desde-exploracion.png` — «← Volver» regresa al hero (scrollY 0) sin perder la ruta.
- `28-mundo-empresa-p0.png` / `29-mundo-eficiencia-p0.png` — mundos por botón (`origin=button`), cámaras [1.9,1.7,8.4] y [-2.1,1.9,8.8].
- `30-movil-hero-p0.png` / `31-movil-exploracion-scroll.png` — móvil 390×844: scroll libre entra a exploración, sin overflow horizontal.

## 3. Tres recorridos completos con retroceso (verificados en QA y a mano)
1. **Clic empresa** → mundo empresa (cámara [1.9,1.7,8.4], tinte #0a0e18, tarjetas en arco) → scroll posterior **no** cambia de ruta → «← Volver» → hero sin recargar.
2. **Clic eficiencia** → mundo eficiencia ([-2.1,1.9,8.8], #0d0a05, espiral) → volver → hero.
3. **Scroll libre sin clic** → mundo cooperativo ([0,1.9,9.4], #060d08, anillo sobre la red) con scrub conducido por el scroll → volver → hero (respuestas conservadas).

## 4. Archivos modificados (ruta exacta)
- `src/lib/experience/state.ts` — contrato ampliado (origen, respuestas, transitioning, setAnswer).
- `src/lib/experience/events.ts` — eventos nuevos.
- `src/lib/experience/narrative.ts` — `enterFreeRoute()` con scrub pin+scrub, guardas, `setTransitioning`, gesto.
- `src/lib/three/universe.ts` — `travelTo` con opción `scrub`, `cardPulse`, `cardFocus`, `gesture`.
- `src/scripts/experience.ts` — `bindFreeScrollIntent` (rueda/touch/teclado/scroll con guardas anti-programático y anti-rezago), `bindHeroCards`, handle ampliado.
- `src/components/experience/Hero.astro` — sin tercer botón, pista de scroll, lista DOM de 8 tarjetas con tooltip y enlaces.
- `src/data/copy.ts` — `HERO_CARDS` (8 tarjetas: etiqueta, beneficio, destino).
- `src/data/routes/scenes.ts` — 3 correcciones editoriales.
- `src/lib/experience/graph.ts`, `scripts/graph.test.ts` — tipos del contrato ampliado.
- `scripts/qa.mjs` — 8 criterios P0 nuevos (93 en total).
- `docs/PUBLIA-AUDITORIA-STAGING.md`, `docs/audit/*`, `docs/evidencia/22…31*`.

## 5. Copys corregidos (original → nuevo, ubicación, motivo)
| Original | Nuevo | Ubicación | Motivo |
|---|---|---|---|
| «La promesa fácil: máseys efficiency, más alcance…» | «La promesa fácil: más eficiencia, más alcance…» | `src/data/routes/scenes.ts` E13 `lead` | Token corrupto (spanglish residual) |
| «…con Hardware que puede ser tuyo.» | «…con equipo que puede ser tuyo.» | `scenes.ts` E22 `lead` | Anglicismo con mayúscula en medio de frase |
| «…la idea detrás de Housing.» | «…la idea del housing: tu propio espacio en un servidor administrado, compartido o privado según lo que necesites.» | `scenes.ts` E21 `body` | Término sin explicación en primera mención (doc 02) |

Auditoría editorial completa: se recorrieron todos los textos visibles (`src/data/copy.ts`, `src/data/routes/scenes.ts`, componentes) buscando «soberanía/orquestación/morphing/pipeline/housing/Laborys/IA ilimitada/metaverso/federación», anglicismos, contadores «0», promesas inventadas y residuos en inglés. Hallazgos: los de la tabla; «soberanía tecnológica» en E04 ya viene explicada en la misma frase ✔; «Laborys» se explica en E18 antes de usarse ✔; contadores con datos reales (50/25/25) que además fijan su valor final con movimiento reducido ✔; no hay precios sin aprobar ni testimonios ✔.

## 6. Estado R01–R14 (antes → ahora, con evidencia)
| ID | Antes | Ahora |
|---|---|---|
| R01 Dirección artística | base aprobada | **igual**: hero intacto (composición verificada contra la captura aprobada en QA) |
| R02 Identidad | logo oficial integrado | igual ✔ |
| R03 Hero | integrado | igual + 2 botones + scroll hint + chips accesibles |
| R04 Prisma 3D | elemento central | ahora también **se recorre** (scrub) en la ruta C |
| R05 Gramática de animación | 2 niveles | niveles 1–3 implementados (ambiente, hover/foco/tap, consecuencia por ruta); nivel 4 (scrub por tramo) en ruta C; nivel 5 (demos útiles) pendiente P1 |
| R06 Enrutamiento/scroll | parcial (3 botones) | **P0 completo**: 2 clics + scroll silencioso, máquina de estados con origen, transiciones reversibles, guardas |
| R07 Escenas post-hero | presentes, sin demos | pendiente P1 (Entrega C: interacción útil por ruta + bloque común de diagnóstico) |
| R08 Copy editorial | sin auditar | **auditado**: 3 correcciones + inventario (arriba) |
| R09 Productos/membresías | reglas preliminaries | sin cambios; precios sólo de fuente aprobada ✔ |
| R10 Housing/autonomía | texto | texto corregido (explicación llana) ✔ |
| R11 Humanos+IA, Ciudadan | escenas existentes | pendiente de demo específica P1 |
| R12 Conversión útil | mailto contextual | igual + pendiente captura server-side (P1-4) |
| R13 Rendimiento/accesibilidad | QA 85 | **QA 93/93**, axe 0, teclado en tarjetas ✔, reducido ✔, móvil ✔ |
| R14 CMS/SEO/analítica | Astro + eventos | igual; eventos ampliados con origen/respuestas |

## 7. Pendientes explícitos (no ocultos)
1. **Entrega C (P1)**: una escena con interacción útil por ruta (infraestructura / automatización / comunidad) + primer bloque común de diagnóstico que use `answers`; demos que hagan algo comprobable (nivel 5).
2. Convergencia de las tres rutas en componentes compartidos con recomendación personalizada según respuestas.
3. Tarjetas 3D: en móvil entran 4/8 en el encuadre (legibilidad primero); mejorar encuadre móvil es P2.
4. Captura server-side del formulario (hoy mailto cliente; requiere base legal) — P1-4.
5. Subdominio permanente de preview (P1-1), precio AGENTE por confirmar (P1-2), Lighthouse en CI (P1-5), axe por ruta (P1-6).
6. Servicio de carga de archivos sigue activo (por si se envían más documentos); se puede apagar a petición.
