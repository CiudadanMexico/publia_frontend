# Auditoría exhaustiva de staging — Publia 6.0 (fase 2 en curso)

- **URL auditada:** https://kitty-midi-grid-liked.trycloudflare.com (túnel efímero sobre el servicio estático local 127.0.0.1:4322).
- **Fecha:** 2026-11-03 · **Método:** `scripts/audit.mjs` (Playwright) + QA `scripts/qa.mjs` (85/85) + recorrido manual por capturas.
- **Datos crudos:** `docs/audit/audit-staging.json` · capturas en `docs/audit/`.

## Resumen ejecutivo

| Área | Estado | Detalle |
|---|---|---|
| Escenas (grafo E00–E30) | ✅ Implementado | 31 escenas montadas, 249 elementos con revelado, 12 botones/enlaces internos, 1 formulario contextual. |
| Hero 3D aprobado | ✅ Implementado | Universo único listo, 0 errores de recursos, 8/8 tarjetas en escritorio; composición verificada contra la captura aprobada (35/35 izq, 40/40 der). |
| Tres entradas narrativas con transición 3D | ✅ Implementado | `enterprise` / `efficiency` / `cooperative`: la cámara viaja ([1.9,1.7,8.4] / [-2.1,1.9,8.8] / [0,1.9,9.4]), cambia el tinte del mundo (#0a0e18 / #0d0a05 / #060d08), el prisma se recompone y las tarjetas se reorganizan, con scroll contextual al destino. |
| Navegación reversible | ✅ Implementado | «← Volver» regresa al acto anterior con viaje de cámara inverso y scrollY 0, sin recargar; «Cambiar de ruta» vuelve al hero y limpia el estado. |
| Scroll | ⚠️ Parcial | Scroll suave global + transiciones programáticas OK; el mundo 3D reacciona a la entrada de acto, pero **noScene por escena** dentro del recorrido (sólo modulación leve del prisma vía `sceneProgress`). |
| Textos / variantes por ruta | ✅ Implementado | Variantes por ruta y rasgos con visibilidad de dos capas (`data-scene-route` / `data-scene-segments`). |
| Interacciones (botones) | ✅ Implementado | 3 CTAs del hero, 3 controles del hero (pausar/fragmentar/reiniciar), bifurcaciones E14, reset de ruta, formulario con validación. |
| Móvil | ⚠️ Parcial | Sin desbordamiento horizontal, título y 3 CTAs visibles, transiciones OK; pero sólo **4/8 tarjetas** entran en el encuadre en 390 px. |
| Movimiento reducido | ✅ Implementado | Lienzo listo con fotograma estático, revelados visibles, viajes instantáneos. |
| Errores | ✅ 0 | Consola, pageerror y HTTP ≥400: 0 en escritorio, móvil, reducido y formulario. |
| Formulario | ✅ Implementado | Validación de correo (mensaje de error verificado) + composición mailto con contexto; **pendiente**: captura server-side (P1-4). |

## Detalle por categoría

### Implementado y verificado
1. **Universo 3D único** (`src/lib/three/universe.ts`): un solo lienzo con los recursos aprobados (mascota, prisma facetado, plataforma, estelas, partículas, fondo, 8 tarjetas) + red de nodos. Los modelos **nunca** se destruyen en las transiciones.
2. **Mundos por ruta** con cámara/luces/tarjetas/prisma propios; `travelTo()` anima todo en una timeline GSAP.
3. **Actos reversibles** (`narrative.ts`): pila de actos; volver sin reiniciar; respuestas conservadas en `sessionStorage` (ruta + rasgos: p. ej. cooperativo → `route=explorer`, `traits=cooperative`).
4. **QA automatizada 85/85** (local y pública): incluye composición contra la captura aprobada, transiciones por ruta, volver, axe sin violaciones, presupuestos de peso, móvil y reducido.
5. **Tests unitarios 15/15**, `tsc` estricto limpio, build de producción sin errores.

### Parcialmente resuelto
1. **Vida 3D del resto de la página**: hoy el mundo cambia al entrar a un acto; dentro del recorrido la escena sólo modula el prisma. Falta reacción por escena (paleta/luz/cámara sutil por bloque narrativo) — es el núcleo de la siguiente entrega.
2. **Tarjetas en móvil**: 4/8 en encuadre a 390 px (el rig móvil escala 0.72 y baja -1.65). Aceptable para legibilidad, pero se puede mejorar el encuadre.
3. **Diagnóstico común convergente**: las tres rutas aún no convergen en una escena de diagnóstico compartida (E14 existe, pero como bifurcación, no como convergencia adaptada a respuestas).
4. **Scroll contextual por escena**: existe el viaje al entrar al acto; falta que cada escena clave (E04, E09, E16, E21, E27…) provoque micro-movimientos de cámara/luz al entrar.

### Falta (pendientes identificados)
1. Reacción 3D por escena dentro del recorrido (ver parcial 1).
2. Convergencia de las tres rutas en el diagnóstico común con contenido adaptado a las respuestas guardadas.
3. Captura server-side del formulario (hoy mailto cliente; P1-4 con base legal).
4. Subdominio permanente de preview (P1-1), precio AGENTE (P1-2), Lighthouse en CI (P1-5), axe por ruta (P1-6).
5. `PUBLIA_DANY_REFINAMIENTO_FASE2.zip` (5 documentos de especificación): **aún no llega a la bandeja** — se seguirá en cuanto se reciba por la URL de carga.

## Evidencia
- `docs/audit/audit-staging.json` (inventario completo: 31 escenas, botones, nav, hero, móvil, reducido, form, errores).
- `docs/audit/escritorio-final.png`, `movil-hero.png`, `movil-empresa.png`, `reducido.png`.
- `docs/evidencia/14…21` (hero, transiciones, mundos, vuelta y móvil de la fase 2).
- QA: 85/85 en https://kitty-midi-grid-liked.trycloudflare.com.
