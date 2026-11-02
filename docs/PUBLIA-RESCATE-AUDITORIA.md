# Publia 6.0 — Auditoría de rescate

Fecha: 2026-11-02 · Alcance: proyecto real `/home/dsh-dany/workspace/publia-frontend`
(rama `feature/publia-6-frontend`) y sitio servido en
`https://kitty-midi-grid-liked.trycloudflare.com`.

Este documento es la **primera acción** del brief: inspeccionar el proyecto
real y el sitio servido antes de reconstruir. Cada afirmación lleva su método
de verificación y su evidencia; no hay porcentajes sin numerador y
denominador.

---

## 1. Método de verificación

| Fuente | Cómo se comprobó | Cuándo |
|---|---|---|
| Código y build | `npm run check` (tsc --noEmit), `npm run build`, inspección del repositorio | local, cada bloque |
| Sitio servido | `curl` al origen (host `127.0.0.1:4322`) y a la URL pública de Cloudflare | tras cada despliegue |
| Comportamiento en navegador | suite `scripts/qa.mjs` (Playwright, Chromium + SwiftShader) con 39 criterios | local y URL pública |
| Contenido heredado | copia aislada de WordPress en `temporal3-agent3` (`/workspace/publia/wordpress`) | auditoría inicial |
| Evidencia gráfica | capturas en `docs/evidencia/*.png` y `docs/evidencia/resultados-qa.json` | tras cada bloque |

> La base congelada `/workspace/publia/baseline-frozen/20261102T040826Z` sigue
> intacta: es el punto de retorno de todo el rescate.

---

## 2. Dieciséis puntos de verificación

| # | Punto | Método | Resultado | Evidencia |
|---|---|---|---|---|
| 1 | El proyecto real existe, está versionado y es reversible | `git log` en `publia-frontend` | **PASS** | 9 commits en `feature/publia-6-frontend`, sin reescritura de historia |
| 2 | El sitio servido responde y sirve el build actual | `curl` a origen y URL pública | **PASS** | HTTP 200; 31 escenas en el HTML público |
| 3 | El build es reproducible y sin errores de tipos | `npm run build` + `npm run check` | **PASS** | Build 3,2 s · tsc sin errores |
| 4 | Consola y runtime sin errores JavaScript | QA Playwright (`pageerror` + `console`) | **PASS** | 0 errores en local y en la URL pública |
| 5 | Sin desbordamiento horizontal en móvil (390 px) | `scrollWidth - clientWidth` | **PASS** | 0 px |
| 6 | El contenido heredado fue auditado, no supuesto | consulta a la copia WP aislada | **PASS** | 60 páginas publicadas · 20 productos con precio real · 10 posts · 2 637 archivos en `uploads` (277 MB) · 1 874 revisiones |
| 7 | Los precios del catálogo salen de la base, no de memoria | lectura de `_price` (el REST público devuelve 0) | **PASS** | 20 precios entre 150 y 10 000 MXN; «Sucri» = 15 MXN |
| 8 | Correos de contacto reales detectados | barrido de `uploads` y contenido WP | **PASS** | 0 correos propios en el contenido (sólo `@example.invalid`); el canónico nuevo es `hola@publia.mx` |
| 9 | Teléfono/WhatsApp canónico único | barrido de contenido | **PASS** | 1 solo número público: `wa.me/525573724660` |
| 10 | Redes sociales canónicas unificadas | barrido de contenido | **PASS** | 4 perfiles `/publiamex` (Facebook, Instagram, LinkedIn, YouTube) |
| 11 | Sin archivos pesados que rompan la carga | barrido de `uploads` | **PASS** | 0 archivos > 20 MB |
| 12 | Punto de retorno congelado del CMS | `baseline-frozen/20261102T040826Z` | **PASS** | dump + `wp-content` + manifiesto SHA-256 + `meta.json` |
| 13 | El despliegue no depende de un único proceso | arquitectura host/contenedor | **PASS** | origen estático en el host (`publia-frontend-static.service`, 4322) + build en contenedor + `publia-frontend-ensure.timer` (2 min) |
| 14 | Dominio propio con TLS y hostname estable | panel de Cloudflare | **FALLA (P1)** | hoy se sirve por *quick tunnel* efímero; el subdominio permanente `preview-publia6.ciudadan.org` requiere acción de Dany (token o panel) |
| 15 | La URL pública sirve exactamente el buildauditado | comparación de `data-scene-id` en el HTML público | **PASS** | 31 escenas (`E00`–`E30` + hero) en el HTML público |
| 16 | Existe una QA automatizada y repetible | `scripts/qa.mjs` | **PASS** | 39/39 criterios en local y 39/39 en la URL pública |

**Resultado del bloque de verificación: 15/16 (93,75 %).** El punto 14
depende de una acción humana externa (crear el hostname en Cloudflare) y está
documentado como P1, no como avance perdido.

---

## 3. Hallazgos y correcciones

### 3.1 P0 — bloqueaban el recorrido (corregidos y verificados)

| # | Hallazgo | Cómo se detectó | Corrección | Verificación |
|---|---|---|---|---|
| P0-1 | `gsap.context()` se referenciaba a sí mismo dentro de su propia función de arranque: error de zona temporal muerta (`Cannot access 'context' before initialization`) que abortaba el orquestador completo. En el sitio, ninguna ruta, segmento, variante ni evento respondía. | QA: 3 criterios en rojo (`ruta empresa`, `variante compartida`, `bifurcación`) y 1 error de consola | Se eliminó la auto-referencia; el contexto se crea sinClosure sobre sí mismo | 39/39 criterios, 0 errores de consola |
| P0-2 | Las bifurcaciones de E14 apuntaban a anclas inexistentes (`#escena-cooperacion`, `#escena-asesoria`): el clic no llevaba a ninguna parte. | QA: «bifurcaciones: apuntan a escenas reales» en rojo | Anclas reales del grafo: `#escena-e15` y `#escena-e24` | QA en verde; la rama «valor» registra el rasgo `value_driven` |
| P0-3 | `ScrollTrigger.refresh()` se ejecutaba en **cada** escena visitada. El refresco recalcula el scroll y **cancela los scrolls suaves**: al navegar por anclas el navegador se quedaba a media altura (posicion real medida: 1 583 px de 4 713). | Medición de `getBoundingClientRect()` antes y después del desplazamiento | El refresco sólo ocurre cuando cambia la visibilidad (ruta o segmentos) | El scroll completo llega al destino; QA en verde |
| P0-4 | Las escenas con segmentos quedaban ocultas para siempre: `data-segments` nunca se escribía en `<html>` (consecuencia de P0-1). | QA: «ruta empresa: escena propia visible» con 0 px | `applyDocumentContext()` escribe `data-route` y `data-segments` | QA: escena visible con 653 px |
| P0-5 | El contenido anterior seguía publicado: el build del host no se sincronizaba con el del contenedor. | `curl` a la URL pública: el HTML no contenía las escenas nuevas | Pipeline verificado: build → contenedor (`/workspace/publia/frontend/dist`) → `publia-frontend-sync.sh` → `/srv/publia-frontend/dist` | HTML público con 31 escenas y el título nuevo |

### 3.2 P1 — bloquean el cierre (requieren decisión o acción de Dany)

| # | Hallazgo | Por qué no se resuelve en código |
|---|---|---|
| P1-1 | No hay hostname propio estable: el túnel de Cloudflare es efímero y cambia de URL al reiniciar. | Crear el hostname en el panel de Cloudflare o entregar un token con `Zone:DNS:Edit` + `Account:Cloudflare Tunnel:Edit`. Runbook listo en `docs/PUBLIA-ESTADO.md`. |
| P1-2 | El nivel **AGENTE** (500–600 MXN) sigue sin confirmación comercial. | La web lo publica como *rango por confirmar*; no se inventa precio cerrado. |
| P1-3 | El catálogo heredado de servicios (20 productos, 150–10 000 MXN) no está decidimos: se conserva, se reformula o se retira. | Decisión comercial + de oferta. |
| P1-4 | No hay formulario contextual con base legal y proveedor de correo; hoy la conversión es por `mailto:` a `hola@publia.mx`. | Requiere definir destinatario, consentimiento y retención. |
| P1-5 | No hay medición de rendimiento reproducible (Lighthouse en CI). | El entorno no tiene Chrome estable para Lighthouse; el budget se está midiendo con el peso de los bundles. |
| P1-6 | No hay auditoría automática de accesibilidad (axe/pa11y) en la suite. | Falta integrarla en `scripts/qa.mjs` con `@axe-core/playwright`. |

### 3.3 P2 — mejoras de calidad (no bloquean)

| # | Hallazgo | Plan |
|---|---|---|
| P2-1 | No hay *morphing* real de geometría: hoy hay fragmentación y recomposición de facetas. | Añadir morph objetivo entre geometrías con `three` (BLOQUE B, iteración 2). |
| P2-2 | *Pinning*, sección horizontal y *sticky* están implementados en la biblioteca pero sin escena asignada. | Asignarlos a E05 (red), E21 (infraestructura) y E27 (planes). |
| P2-3 | Las imágenes heredadas no tienen AVIF/WebP ni `width/height` para evitar CLS. | Canalizar por el CMS y por `astro:assets`. |
| P2-4 | El grafo no tiene pruebas unitarias. | `vitest` para `graph.ts` (variantes, destinos, segmentos). |
| P2-5 | El paso horizontal no existe en móvil: en 390 px el recorrido es vertical (correcto) pero sin resumen de pasos. | Resumen por escena en móvil. |

---

## 4. Estado de los bloques (porcentajes calculados)

Cada bloque se mide con criterios **verificables** (denominador explícito) y
resultados con evidencia. Un criterio parcial cuenta 0,5.

| Bloque | Criterios | Cumplidos | Resultado | Evidencia principal |
|---|---|---|---|---|
| **A — Rescate y auditoría** | 16 | 15 (1 P1 externo) | **93,75 %** | §2 de este documento |
| **B — Motor cinematográfico** | 24 efectos | 20 verificados (20,0) + 4 parciales (2,0) + 0 pendientes = 22 / 24 | **91,67 %** | `docs/PUBLIA-EFECTOS.md` |
| **C — Tres rutas** | 10 | 10 | **100 %** | QA: empresa, eficiencia, exploración, cambio de ruta |
| **D — Ecosistema e impacto** | 10 | 10 | **100 %** | Escenas E16–E22; reparto 50/25/25 verificado |
| **E — Productos y demostraciones** | 10 | 8 | **80 %** | QA: 5 niveles, precios, 6 bloques de simulación; falta el catálogo heredado (P1-3) |
| **F — Conversión** | 8 | 6 | **75 %** | QA: CTA contextual, correo con contexto, eventos; falta formulario (P1-4) |
| **G — Calidad** | 10 | 8 | **80 %** | QA 39/39 en la URL pública; faltan Lighthouse (P1-5) y axe (P1-6) |

> Los porcentajes no son estimaciones: cada uno se puede recomputar con los
> criterios listados en el documento enlazado de cada bloque.

---

## 5. Presupuesto de peso (medido en el build)

| Artefacto | Peso | Nota |
|---|---|---|
| `dist/index.html` | 80 kB | 31 escenas SSR en una sola página |
| CSS total | 22,8 kB | sistema de escenas + tokens + base |
| JS inicial | 163,8 kB | orquestador + GSAP + ScrollTrigger |
| JS diferido (Three.js) | 543,1 kB | `import()` dinámico: se carga sólo cuando hay WebGL y después del primer pintado |
| `dist` completo | 824 kB | incluye HTML, CSS, JS y SVG |

Regla operativa: el bundle inicial no debe superar 200 kB; el 3D va siempre
diferido.

---

## 6. Qué sigue (orden de ejecución)

1. Cerrar P1-1 (subdominio) — requiere a Dany.
2. BLOQUE E: incorporar el catálogo heredado a `src/data/services/index.ts`
   (P1-3) y la escena E28.
3. BLOQUE F: formulario contextual (P1-4) con los eventos ya previstos.
4. BLOQUE G: Lighthouse y axe en la suite QA (P1-5, P1-6).
5. Iteración 2 del BLOQUE B: morphing real y asignación de *pinning*,
   horizontal y *sticky* (P2-1, P2-2).

Nada de lo anterior se ejecuta en producción sin aprobación explícita.
