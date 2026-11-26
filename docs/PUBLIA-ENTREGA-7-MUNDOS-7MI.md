# PUBLIA 6.0 — Entrega 7M-I: cierre visual, refinamiento de interacciones y activación comercial del Home

**Base:** `feature/publia-6-frontend` @ `020afb3` (7M-H entregado y verde). Recuperación: tag `recovery/pre-7mi`.
**Staging:** https://dam-boulevard-explaining-alaska.trycloudflare.com (sirve `dist/`; producción publia.mx intacta).
**Alcance:** refinamiento y funcionalidad comercial del Home; no rediseño. Hero 3D, pins, transiciones, reversibilidad y carga silenciosa intactos (QA de regresión verde).

## Cambios por sección

### §2 E30 — sin duplicación del formulario de WhatsApp
- `CtaModule` conserva el único encabezado «Vamos a conocernos» + introducción + tarjetas; su botón suelto de WhatsApp se sustituyó por **correo alternativo** (`mailto:hola@publia.mx`) y un ancla «Ir al formulario de WhatsApp ↓».
- `FormModule` queda como **único formulario** (su submit es el CTA principal de WhatsApp, con validación y `formMessage` con nombre/negocio/necesidad). Sin listeners duplicados: `bindWaForm` sigue con guard `data-bound`.
- 7M-I §7: el mensaje del formulario incluye ahora la **ruta recordada** del recorrido.
- QA: 1 formulario, 1 submit, 1 enlace wa.me en E30, 1 h2, correo presente.

### §3 E22 — representación gráfica de servidores recuperada
- Se recuperó del historial (commit 7M-G) el **stage 3D de racks** (`A08_anillos/nucleo`): 3 racks — *Tu negocio*, *Socios y becarios*, *Miembros de la red*; en privado un solo rack al 100 % (los otros se atenúan).
- Escritorio: **dos columnas** — izquierda (entradas editables, demanda, resultados compartido/privado, controles), derecha (stage + chips de tareas en proceso/espera). Móvil: apilado.
- **Una sola fuente de datos**: los slots encendidos del rack 0 = unidades usadas del mismo `housingModel` (compartido 50/5 por slot → 10 encendidos; privado 85/10 → 9); racks de red marcados reservados 25/25. Caso inicial intacto: compartido 3 activas/4 espera, privado 7/0.
- Sin métricas vacías ni tráfico decorativo; disclaimer «unidades ilustrativas» conservado.

### §4 E11 — demo automática y cíclica, composición horizontal
- Ciclo automático **1→2→3→4→1…** con un solo controlador de timeouts; arranque por `IntersectionObserver`, suspensión fuera de vista o pestaña inactiva; `prefers-reduced-motion` = estático con reanudación manual.
- Eliminados ejecutar/pausar/paso a paso/reiniciar; quedan **3 selectores** (Atención/Creatividad/Soporte) + control discreto «⏸ Detener animación». Colisión `data-pers-step` corregida (`data-pers-stage`).
- Diagrama horizontal ≈2.8:1 (2.5–3:1) con solicitud/agente/persona en espacios propios; panel azul de 4 etapas compacto; selectores+diagrama+panel caben a la vez en 1440×900 y 1366×768 (medido en QA).
- Ilustración conservada en **slot reemplazable** (`data-pers-portrait-slot`); disclaimer «personajes ilustrativos, no integrantes del equipo».
- CTA del módulo: «Ver opciones de apoyo humano» → `#escena-e27`.

### §5 E07 — inicio automático, un solo mecanismo
- Nuevo `flow.ts`: la demo arranca sola al entrar en pantalla y recorre las 4 etapas en continuo; chips de foco actualizan resultado + persisten respuesta y el ciclo continúa; sin «Ejecutar demostración»/«Reiniciar». Los dos mecanismos previos de `experience.ts` se unificaron localmente; el controlador global de scroll no se tocó.

### §6 E27 — textos comerciales (precios intactos)
- Nuevos literales en `copy7mi.ts` (copy7mf.ts sigue siendo generado, intocable): intro «Empieza con las herramientas que necesita tu negocio hoy…», «¿Qué incluye este plan?», «Agrega los servicios que necesites.», «Me interesa este plan», «Ver opciones de apoyo humano».
- Cada plan responde **para quién es / qué problema resuelve / qué incluye / precio / qué se cotiza aparte**. Precios verificados: $300 / $550 / $2,000 / $3,000 / $4,000 MXN/mes.
- Leyenda que distingue **chatbot de atención vs agente personal vs membresía con acompañamiento humano vs Housing**.

### §7 — Activación comercial de botones (inventario)
| Ubicación | Interacción | Destino real | Estado |
|---|---|---|---|
| Hero (2 tarjetas de ruta) | elegir ruta | `setPrimaryRoute` + scroll | OK |
| E30 tarjetas (8 chips) | ver en el recorrido | `#escena-*` | OK |
| E00 simulador CTA | cotizar tiempo liberado | `wa.me/525573724660` + categoría + horas estimadas | OK (nace con href real; ya no `href="#"`) |
| E03 infra: 4 modos + run/pausa/ruta alterna | cambio de escenario | estado local + 3D | OK |
| E03 CTA + «Comparar…» | cotizar infraestructura / ver E22 | `wa.me` con `{label}` / `#escena-e22` | OK |
| E07 chips de foco | elegir foco | persiste `answers.foco`; resultado inmediato | OK (sin botón de ejecutar) |
| E11 3 selectores + CTA | elegir caso / apoyo humano | textos al instante / `#escena-e27` | OK |
| E22 modos + ejecutar/pausar/reiniciar + CTA | simular Housing | `wa.me` con modo + demanda/activas/espera/usadas del modelo | OK |
| E25 familias + CTA | consultar solución | `wa.me` con `{label}` | OK |
| E27 5 planes + diagnóstico + CTA | seleccionar membresía / cotizar plan | persiste `membership`; `wa.me` con `planMessage {label}` | OK |
| E29 cierre | copiar/descargar propuesta, WhatsApp con contexto, correo | `data-cierre-wa` (wa.me con resumen), `mailto:` | OK |
| E30 formulario + ancla + correo | contacto | `wa.me` con formMessage + ruta / `mailto:hola@publia.mx` / `#e30-formulario` | OK |
| E23/E24 conocimiento CTA | consultar capacitación/asesoría | `wa.me` con mensaje contextual | OK |
| Nav marca | volver arriba | `#inicio` | OK |

- Auditoría: **cero `href="#"` o vacíos** en el Home (QA global); todo `wa.me` apunta al número verificado **525573724660** (55 73 72 46 60). Ningún mensaje se envía solo: siempre se abre WhatsApp para que el visitante decida.
- Productos sin página operativa propia conducen a **contacto comercial contextualizado** (producto/plan/selecciones en el mensaje), sin simular contratación.

### §8 E23 / E24 diferenciadas
- E23: «**Capacitación** para llevarlo a la práctica.» · E24: «**Asesoría** para elegir bien antes de contratar.» (antes compartían título).
- `KnowledgeModule` con slots preparados para contenidos reales (`data-know-panel="capacitacion|asesoria"`, `data-know-list`), listando el material existente; sin inventar cursos, fechas ni certificaciones.

### §9 Auditoría editorial
- Corregidos: «celularr»→celular, «cooperating»→cooperación, «autonomy»→autonomía, «Specialists»→personas especialistas, «propose»→proponen, «communications»→comunicaciones. Sin textos que remitan a botones retirados; identidad (tecnología abierta, soberanía, cooperación, capacidad humana) intacta.

## Pruebas
- Unitarias: 25/25 (`npm test`).
- QA E2E staging (`scripts/qa.mjs`): ver resultado final abajo (256+ criterios incl. regresión hero/scroll/navegación + nuevos 7M-I: 1 formulario E30, 4 ciclos E11, 4 ciclos E07, cambio repetido de casos, reentrada sin timers duplicados, correspondencia modelo↔racks E22, fit de viewport E11, CTAs funcionales, a11y/teclado/reduced-motion, sin overflow).
- Capturas: `docs/audit/7mundos/7mi-{viewport}-{E07,E11,E22-compartido,E22-privado,E27,E30}.png` (+sidecars JSON acreditados; "antes" = `7mh-*` de 7M-H). Videos continuos: `.tmp-vids/7mi-e07-continuo/`, `7mi-e11-continuo/` (1440×900).

## Funcionalidades comerciales pendientes (explícitas)
1. No existe flujo de contratación/pago real: los productos sin página operativa van a WhatsApp contextualizado (por diseño, hasta que exista checkout).
2. Campus educativo: estructura preparada (`data-know-list`), contenidos reales pendientes.
3. Fotografía definitiva de E11 pendiente (slot `data-pers-portrait-slot` listo).

**No se declara aprobación visual ni se toca producción sin revisión del propietario.**
