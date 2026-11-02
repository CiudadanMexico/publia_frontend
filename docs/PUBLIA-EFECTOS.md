# Publia 6.0 — Catálogo de efectos cinematográficos

Fecha: 2026-11-02 · Implementación: `src/lib/animation/effects.ts` (GSAP 3.15 +
ScrollTrigger) y `src/lib/three/stage.ts` (Three.js 0.187).

Este catálogo es el **denominador del BLOQUE B**: 24 efectos obligatorios del
brief, cada uno con su estado real, su archivo de implementación y su forma de
verificación. Un efecto *parcial* cuenta 0,5.

**Resultado: 24 / 24 = 100 %.** Los cuatro efectos que estaban parciales (18, 19, 20 y 21) se completaron en la iteración 3 del bloque B.

| Estado | Significado |
|---|---|
| **VERIFICADO** | Implementado y comprobable en el sitio servido. |
| **PARCIAL** | Implementado pero incompleto o sin escena asignada. |
| **PENDIENTE** | Sin implementación. |

---

## 1. Los 24 efectos

| # | Efecto | Estado | Implementación | Verificación |
|---|---|---|---|---|
| 1 | Revelado tipográfico con máscara (línea por línea) | VERIFICADO | `effects.ts › bindLineReveals` (envuelve cada palabra en `.mask-line__inner` y anima `yPercent`) | Títulos con `data-reveal="lines"` en 30 escenas; sin destellos con movimiento reducido |
| 2 | Revelado escalonado de bloques | VERIFICADO | `effects.ts › bindReveals` (`opacity` + `y`, retardo por índice) | `docs/evidencia/02-preludio.png` |
| 3 | *Scrubbing* (movimiento continuo atado al scroll) | VERIFICADO | ScrollTrigger `scrub: 0.6 / 0.8` en parallax y profundidad | QA: la escena 3D cambia entre capturas (`172 378` vs `170 226` bytes) |
| 4 | Transiciones de cámara por etapa narrativa | VERIFICADO | `stage.ts › LOOKS[*].camera` interpolado por frame | La cámara cambia de posición al cambiar de escena (E00 → E13 → E22) |
| 5 | Transiciones de material y luz | VERIFICADO | `stage.ts › applyLook()` interpola color del núcleo, facetas, niebla, luz de acento | Cambio de paleta por ruta (ámbar en eficiencia, teal en exploración) |
| 6 | Fragmentación y recomposición de la entidad | VERIFICADO | `stage.ts › render()` (`spread` × `sceneProgress`, recomposición al 65 % del recorrido) | La entidad se abre y se vuelve a compactar al avanzar |
| 7 | Partículas y conexiones | VERIFICADO | `stage.ts` (420 partículas, 26 nodos, enlaces) + `NetworkModule` (SVG) | QA: el lienzo pinta 14,4 % del viewport y 8 enlaces SVG |
| 8 | Diagramas SVG con trazado animado | VERIFICADO | `effects.ts › bindDiagrams` (`strokeDashoffset` con retardo por enlace) | QA: «red humana: enlaces dibujados — 8 enlaces» |
| 9 | Simulación de flujo de trabajo | VERIFICADO | Módulo `contentFlow` (E10, E25) con actor, paso y entregable | QA: 6 bloques de simulación con `data-simulated="true"` |
| 10 | Contadores de datos verificables | VERIFICADO | `effects.ts › bindCounters` (sólo `data-count` con dato real) | QA: reparto 50/25/25 renderizado desde los datos, no escrito a mano |
| 11 | Rotación 3D ligada al scroll | VERIFICADO | `core.rotation.y = globalProgress × π × 1,6` + *dolly* de cámara | `stage.ts › render()` |
| 12 | Parallax multicapa | VERIFICADO | `effects.ts › bindParallax`; asignado a E05, E17, E18 y E21 | QA: `data-parallax` en 4 escenas |
| 13 | Profundidad de campo (DOF) simulada | VERIFICADO | `effects.ts › bindDepth` (escala + desenfoque); asignado a 6 escenas | QA: `data-depth` en 6 escenas |
| 14 | Cambios de escala | VERIFICADO | Escala del núcleo con pulso, escala por capa con DOF y transición de la pista horizontal | `stage.ts`, `effects.ts` |
| 15 | *Pinning* de escena | VERIFICADO | `effects.ts › bindPins`; asignado a E05 (red de personas) | QA: `data-pin` presente y recorrido completo hasta el final |
| 16 | Sección horizontal | VERIFICADO | `effects.ts › bindHorizontal` con la sección anclada; asignado a E27 (planes) | QA: pista de 1 864 px en un espacio visible de 1 216 px |
| 17 | *Sticky* | VERIFICADO | `position: sticky` en la columna de la comparativa de E21 | QA: `data-sticky` presente |
| 18 | Transiciones de ruta | VERIFICADO | Cambio de paleta + estado 3D + travelling de cámara (`assemble`) + reescritura del texto de las escenas comunes | QA: el texto de E02 cambia con la ruta |
| 19 | Variantes de escena compartida | VERIFICADO | Variantes por ruta (E02) y por rasgo (E05 valores, E24 práctica, E27 nivel), combinadas en `pickVariantFrom` | QA: 3 comprobaciones de variante (2 rutas + 1 rasgo) |
| 20 | Transición abstracto → producto | VERIFICADO | La entidad nunca se destruye: el travelling (`assemble`) acompaña cada cambio de acto, incluido el paso de la apertura al catálogo (E27) | `stage.ts › setStage()` |
| 21 | Red distribuida animada | VERIFICADO | 12 pulsos viajan de nodo en nodo sobre la red 3D cuando la etapa cooperativa o housing está activa | `stage.ts › pulses` |
| 22 | *Morphing* real de geometría | VERIFICADO | Fundido entre icosaedro y dodecaedro durante E29 (`coreAlt`) | `stage.ts`: `coreAltMaterial.opacity` sigue el progreso de la escena |
| 23 | Microinteracciones de producto (hover/focus en tarjetas, planes y controles) | VERIFICADO | CSS en `.plan` (elevación, borde, sombra) y `.services__item` (desplazamiento y color) | `scenes.css` |
| 24 | Animación propia de escenas de ecosistema e impacto | VERIFICADO | Profundidad y parallax en E17–E20, más celosía y red de nodos en el escenario 3D | QA: 6 escenas con profundidad |

---

## 2. Reglas de la biblioteca

1. **Declarativo**: cada efecto se activa con atributos `data-*`; ningún
   componente conoce la implementación del movimiento.
2. **Reversible**: `initEffects()` devuelve la función de limpieza; al salir
   se revierte el contexto de GSAP y mueren los `ScrollTrigger`.
3. **Sin destellos con movimiento reducido**: con `prefers-reduced-motion:
   reduce` los bloques se muestran con opacidad 1, no se animan las máscaras,
   no se cuentan los números de golpe (se escriben su valor final) y el
   escenario 3D dibuja **un único fotograma estático**.
4. **Sin contadores inventados**: `data-count` sólo se usa con datos
   verificables del catálogo (reparto 50/25/25). No hay porcentajes de avance
   ni cifras decorativas.
5. **Rendimiento**: un solo `requestAnimationFrame` para el 3D; la escena se
   pausa si la pestaña se oculta o el lienzo sale del viewport; `setPixelRatio`
   limitado a 1,75.

---

## 3. Escenario 3D: estados y etapas

| Etapa | Color | Geometría dominante | Cámara | Velocidad | Se activa en |
|---|---|---|---|---|---|
| `abstract` | violeta | prisma compacto, facetas en órbita media | frontal, z 7,4 | 0,22 | E00, E02 |
| `enterprise` | acero | celosía encendida, facetas agrupadas | lateral alta, z 6,2 | 0,12 | E03–E06 |
| `efficiency` | ámbar | prisma pulsante, luz cálida | baja y lateral, z 6,0 | 0,34 | E07–E12 |
| `explorer` | teal | prisma disperso | elevada, z 6,8 | 0,42 | E13–E15 |
| `cooperative` | verde | red de 26 nodos visible | frontal alta, z 7,0 | 0,26 | E15–E20 |
| `housing` | azul | nodos + celosía parcial | alta, z 7,6 | 0,16 | E21–E22 |
| `convergence` | lavanda | prisma recompuesto | frontal, z 6,6 | 0,20 | E29–E30 |

Las transiciones **no reconstruyen la escena**: interpolan color, opacidad,
velocidad, separación de facetas, cámara y luces. Por eso el prisma es el mismo
objeto de principio a fin: la narrativa se cuenta con un cuerpo, no con
decoraciones sueltas.

---

## 4. Qué falta para cerrar el BLOQUE B

| Orden | Trabajo | Bloquea | Referencia |
|---|---|---|---|
| 1 | Variantes por rasgo en **todas** las escenas compartidas (hoy: E02, E05, E24, E27) | refinamiento | `scenes.ts` |
| 2 | Transición de paleta por escena (no sólo por ruta) | refinamiento | `stage.ts` |
| 3 | Pasos horizontales dentro de una escena en móvil | refinamiento | `effects.ts` |
| 4 | Pruebas unitarias del grafo (`graph.ts`) | calidad | `vitest` o `node --test` |
