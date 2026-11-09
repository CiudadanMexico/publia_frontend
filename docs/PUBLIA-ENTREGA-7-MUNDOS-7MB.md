# PUBLIA 6.0 — Bloque 7M-B: integración de los siete mundos (narrativa completa)

Rama: `feature/publia-6-frontend` · Base de partida: `17d8e92` (tag `recovery/7m-b-start`) · Solo staging; el hero 3D aprobado no se tocó; producción publia.mx intacta. Sin iframes: todo se adaptó a la arquitectura existente (un solo canvas Three.js, un solo estado en `publia.visitor.v1`, ScrollTrigger/GSAP compartidos).

## Commits del bloque

| Commit | Bloque | Contenido |
|---|---|---|
| `58ba0a0` | B | Red Colaborativa en E15: 6 capacidades en órbita con SVG de conexiones, 3 demos con flujo iluminado, selección persiste (`state.red`), Ciudadan como enlace secundario |
| `48c7219` | A | Infraestructura soberana (E03/E04): 3 modos (IA privada / Housing / Red distribuida) con cámara e iluminación propias vía `setSceneLook`, 10 racks con LEDs animados, mapa de red, demo "activar red" con contador, comparación compartida vs privada, persiste `state.infra` |
| `4ec0b40` | C | Personas + IA en E11 (marfil): 3 casos × 4 pasos (IA → humana → seguimiento), controles ejecutar/pausar/paso/reiniciar, retrato SVG original |
| `2c26358` | D | Membresías en E27 (amarillo): 5 niveles desde la fuente canónica `src/data/memberships/`, núcleo con chips acumulativos, diagnóstico de 2 preguntas, persiste `state.membership` |
| `955cdc3` | E+H | Cierre V2 en E29: 6 tarjetas (web/agentes/marketing/personas/housing/capacitación) con demo de 3 pasos y añadir/quitar; acciones copiar, descargar TXT, volver al diagnóstico, reiniciar y contactar con contexto (mailto/WhatsApp). Housing compartida ya no publica `$0` como tarifa |
| `2c8e6df` | E | Eventos del cierre en `ExperienceEvent` |
| `b51c636` | F/perf | Binders 7M-B en chunks perezosos + sección QA 7M-B (15 checks) |
| `c2b1138` | F/perf | LazyBind con IO + scroll + visitedScenes; 253 kB iniciales (< 260 kB) |
| `30bf764`+ | QA/docs | waitBound por binder en QA; presupuesto medido en carga; reporte 158/158 |

## Estado real de los siete mundos

| Mundo | Escena | Estado |
|---|---|---|
| 1. Infraestructura soberana | E03/E04 (+E21/E22 housing) | ✅ Integrado (Bloque A): modos, racks, red, demo, comparación, cámara por modo, persistencia |
| 2. Automatización | E07 | ✅ Previo (P0): flujo de 4 etapas ejecutable |
| 3. Ecosistema (8 servicios) | E25 | ✅ Previo (P0): órbita + selección + demo |
| 4. Red colaborativa | E15 (E16 Ciudadan secundario, E17 GeoNodos opcional) | ✅ Integrado (Bloque B) |
| 5. Personas + IA | E11 | ✅ Integrado (Bloque C), marfil |
| 6. Membresías | E27 | ✅ Integrado (Bloque D), fuente canónica `memberships/` |
| 7. Cierre personalizado V2 | E29 | ✅ Integrado (Bloque E): 6 tarjetas + propuesta del estado + 6 acciones finales |

## Estado compartido (migración compatible)

`publia.visitor.v1` conserva todos los campos previos y añade con defaults: `capabilities: CapabilityId[]`, `membership`, `infra`, `red`, `proposalTouched`. Sesiones v1 antiguas cargan sin pérdida (sanitizers por campo). Identificadores estables (`CAPABILITY_IDS`, `INFRA_PREFERENCES`, `MEMBERSHIP_SLUGS`), nunca cadenas libres.

## Verificación

- `tsc --noEmit` limpio · `npm test` 15/15 · `npm run build` OK.
- QA en staging (Playwright): **158/158 criterios verificados** (corrida final `qa-7mb10`: presupuesto medido en carga inicial, 253 kB < 260 kB).
- Presupuestos: 253 kB iniciales (JS 238 + CSS 15) < 260 kB; app sin 3D ≈ 69 kB < 90 kB.
- Rutas probadas: empresa, eficiencia, exploración (adelante/atrás, recarga, estado conservado, cambio de ruta) + móvil 390×844.

## Evidencia

- Capturas: `docs/audit/7mundos/7mb-01…7mb-14-*.png` (escritorio 1440 + móvil 390, por mundo).
- Videos continuos con interacción: `docs/audit/video/7mb-ruta-empresa.webm`, `7mb-ruta-eficiencia.webm`, `7mb-ruta-exploracion.webm`.
- Demo de selecciones → cierre: video empresa (E03 activar red → E11 correr demo → E27 diagnóstico → E29 añadir housing+agentes) + `docs/audit/7mundos/7mb-08-cierre-seleccion-desktop.png`.
- QA: `scripts/qa.mjs` (sección 7M-B con 15 checks propios).

## Pendientes / problemas encontrados

1. **Host temporal-3 (159.54.133.219) inalcanzable** desde esta sesión: el túnel quick anterior murió (`ERR_NAME_NOT_RESOLVED`). Staging actual servido desde túnel local: `https://dam-boulevard-explaining-alaska.trycloudflare.com` (build commiteado). Al recuperar el host, reactivar túnel canónico ahí.
2. **Enlace de carga** anterior también caído; el servidor de carga local quedó en `/home/dsh-dany/workspace/.upload-inbox/` (token en `.token`); falta reexponerlo con túnel nuevo si se requiere.
3. GeoNodos quedó como exploración opcional en E17 con enlace a Ciudadan (según cambio de dirección del Bloque B).
4. AGENTE sigue pendiente ($500–$600 objetivo, `priceConfirmed:false`); OPERACIÓN ventana horaria pendiente en fuente canónica; Laborys pendiente en todos los planes. Nada de esto se publica como confirmado.
5. QA a 2 FPS (swiftshader) es lento; los checks usan esperas por estado, no sleeps fijos.
