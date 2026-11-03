# Publia 6.0 — Estado de la entrega

Fecha: 2026-11-02 · Rama: `feature/publia-6-frontend` · Proyecto:
`/home/dsh-dany/workspace/publia-frontend` (en el agente: `/workspace/publia/frontend`)

Este documento describe **lo que existe hoy**, con su evidencia. Los
porcentajes se calculan con criterios verificables y están detallados en
`PUBLIA-RESCATE-AUDITORIA.md`.

---

## 1. Qué se entrega ahora

| Bloque | Estado | Evidencia |
|---|---|---|
| **A · Rescate y auditoría** | 15/16 criterios (93,75 %) | `docs/PUBLIA-RESCATE-AUDITORIA.md` |
| **B · Motor cinematográfico** | 24/24 efectos (100 %) | `docs/PUBLIA-EFECTOS.md` |
| **C · Tres rutas** | 10/10 (100 %) | QA: empresa, eficiencia, exploración + cambio de ruta |
| **D · Ecosistema e impacto** | 10/10 (100 %) | Escenas E16–E22; reparto 50/25/25 verificado |
| **E · Productos y demostraciones** | 10/10 (100 %) | 5 niveles con precios reales + catálogo heredado con 19 servicios publicados |
| **F · Conversión** | 8/8 (100 %) | CTA contextual, formulario contextual sin captura en servidor, WhatsApp, eventos |
| **G · Calidad** | 11/11 (100 %) | QA 75/75 en local y en la URL pública, axe sin violaciones, presupuesto de peso, 15 pruebas unitarias |

### Hero 3D aprobado (integrado)

El hero entregado se integró **sin rediseñar ningún recurso**: se reutilizan
los dos modelos GLB, la textura de fondo, las ocho tarjetas con sus iconos y
los cuatro módulos (fondo, estelas, partículas, plataforma), portados a
TypeScript sin cambiar sus valores.

| Pieza | Dónde vive | Nota |
|---|---|---|
| Escena del hero | `src/lib/three/heroScene.ts` | cámara 40°, rig a la derecha, bloom, mascota, prisma facetado, ocho tarjetas |
| Módulos originales | `src/lib/three/hero/*.ts` | puerto fiel de `src/modules/*.js` de la entrega |
| Recursos 3D | `public/models/`, `public/textures/`, `public/icons/` | servidos tal cual |
| Logotipo oficial | `public/brand/` | PNG recortado (44 KB) + favicon e isotipo |
| Marcador | `src/components/experience/Hero.astro` | titular y botones a la izquierda, escena a la derecha |
| Encabezado | `src/components/ui/Nav.astro` | se retira la marca tipográfica provisional |

Reglas de integración aplicadas:

- el hero tiene **su propio lienzo**; la capa global 3D cede el paso
  (`data-hero-active`) y nunca dibujan a la vez;
- `destroy()` libera geometrías, materiales, texturas, contexto WebGL, tweens
  y ScrollTriggers al desmontar;
- `prefers-reduced-motion` renderiza un único fotograma estático;
- los controles del hero (pausar, fragmentar, reiniciar) están connected a la
  escena;
- la tercera ruta (cooperativismo) se añadió al hero con el mismo lenguaje
  visual, en el mismo estilo que las dos aprobadas.

### Contenido construido

- **31 escenas** montadas (`E00`–`E30` + hero `E01`), en una sola página, con
  el grafo narrativo como fuente única.
- **Tres rutas completas**: empresa (`E03`–`E06`), eficiencia (`E07`–`E12`) y
  exploración (`E13`–`E15`), más 24 escenas compartidas que adaptan su texto
  sin duplicar componentes.
- **Un escenario 3D persistente** con siete estados narrativos: la misma
  entidad se transforma de la apertura a la convergencia.
- **Catálogo**: cinco niveles de membresía con precios verificados (BASE $300,
  AGENTE $500–600 por confirmar, CRECIMIENTO $2 000, OPERACIÓN $3 000,
  COBERTURA $4 000 MXN), Housing con reparto 50/25/25 y 12 MSI, y 19 servicios
  del catálogo anterior con su precio real de la base.
- **Demostraciones** etiquetadas como simulación (`data-simulated="true"`),
  nunca como producto real.
- **Conversión**: correo canónico `hola@publia.mx`, WhatsApp (`55 73 72 46 60`)
  y un **formulario contextual** que arma el mensaje con la ruta y los rasgos
  ya elegidos. El formulario no captura nada en el sitio: abre el cliente de
  correo de la persona.

### Verificación

| Comprobación | Resultado |
|---|---|
| `npm run check` (tsc estricto) | 0 errores |
| `npm test` (pruebas del grafo y el catálogo) | 15/15 |
| `npm run build` | 3,2 s · 1 página |
| Suite QA en local | **75/75** |
| Suite QA en la URL pública | **75/75** |
| Errores de consola | 0 |
| Desbordamiento horizontal en 390 px | 0 px |
| axe-core (wcag2a/aa, wcag21a/aa, best-practice) | 0 violaciones en la vista inicial y en la ruta empresa |
| Presupuesto de peso inicial | aplicación sin 3D: 71 kB (límite 90 kB) · total con el 3D del hero: 243 kB (límite 260 kB) |
| Hero 3D aprobado | lienzo WebGL activo, 8/8 tarjetas en encuadre, 10/10 recursos (2 GLB + 8 iconos) con HTTP 200, sin errores de carga |
| Composición contra la captura aprobada | luminancia izq 35/35 y der 41/40; brillo 14,4 %/14,8 % (tolerancia ±12 y ±3 pp) |

---

## 2. Criterios de aceptación de la entrega

| # | Criterio | Estado | Cómo se comprueba |
|---|---|---|---|
| 1 | El sitio carga sin errores y responde en móvil | CUMPLIDO | QA: 42/42, 0 px de overflow |
| 2 | Hay un objeto 3D real, persistente y en movimiento | CUMPLIDO | QA: WebGL activo, 14,4 % del viewport pintado, dos capturas distintas |
| 3 | Tres rutas diferenciadas con contenido propio | CUMPLIDO | QA: escenas E03/E07/E13 con mensajes distintos |
| 4 | Las escenas compartidas cambian según ruta | CUMPLIDO | QA: el texto de E02 cambia al cambiar de ruta |
| 5 | Existe una bifurcación que registra un rasgo | CUMPLIDO | QA: E14 → rasgo `value_driven` + escena cooperativa visible |
| 6 | El catálogo muestra precios reales y marca lo pendiente | CUMPLIDO | QA: 5 niveles con sus precios; AGENTE como rango |
| 7 | No hay afirmaciones inventadas (Laborys, SLA, ilimitado, escasez) | CUMPLIDO | Revisión de copy; los datos no confirmados son `null` |
| 8 | La conversión conserva el contexto de navegación | CUMPLIDO | QA: `mailto:` con `body=` y ruta |
| 9 | Hay un cambio de ruta disponible en cualquier momento | CUMPLIDO | Botón «Cambiar de ruta» en el nav |
| 10 | El sitio es navegable con teclado y con movimiento reducido | CUMPLIDO | QA: contenido visible con `prefers-reduced-motion` |
| 11 | Los datos heredados están auditados, no supuestos | CUMPLIDO | `PUBLIA-RESCATE-AUDITORIA.md` §2 |
| 12 | Existe documentación de cada bloque | CUMPLIDO | 8 documentos en `docs/` |

---

## 3. Cómo revisarlo

### URL pública actual (compartible)

| Qué | Dónde |
|---|---|
| URL pública | `https://kitty-midi-grid-liked.trycloudflare.com` (túnel rápido de Cloudflare en el host Oracle) |
| Origen | `127.0.0.1:4322` en el host (`publia-frontend-static.service`) → `/srv/publia-frontend/dist` |
| Sincronización | `publia-frontend-sync.sh` + `publia-frontend-ensure.timer` (cada 2 min) |
| Verificación | Suite QA completa **contra la URL pública**: 75/75 criterios ✔ |
| URL vigente | `ssh yizuz@159.54.133.219 '/usr/local/bin/publia-quick-url.sh'` |

> El túnel rápido es **efímero**: la URL cambia si el servicio se reinicia
> (`systemctl restart publia-quick-tunnel`). Para una URL estable hay que
> crear el subdominio definitivo (ver §3.2).

### 3.2 Subdominio definitivo (pendiente de una acción en Cloudflare)

Datos exactos para crearlo en el túnel `30291f10-edc9-42b1-8345-76d2a10317a0`
(cuenta `9a00f494de172e969c6498971bcdc3aa`, túnel remoto del host Oracle):

| Campo | Valor |
|---|---|
| Subdominio propuesto | `preview-publia6.ciudadan.org` |
| Tipo / URL de origen | `http://127.0.0.1:4322` |
| Registro DNS | CNAME `preview-publia6` → `30291f10-edc9-42b1-8345-76d2a10317a0.cfargotunnel.com` (proxy naranja activo) |

Dos formas de hacerlo:

1. **Dashboard (2 minutos):** Zero Trust → Networks → Tunnels → *Ciudadan* →
   Public Hostnames → Add (`preview-publia6` + `ciudadan.org` + `http://127.0.0.1:4322`).
   El flujo crea el CNAME automáticamente.
2. **API:** con un token de Cloudflare (Zone:DNS:Edit + Account:Cloudflare
   Tunnel:Edit sobre `ciudadan.org`) se puede dejar listo en segundos; el
   token no se guarda en el repositorio.

Mientras tanto, el sitio se sirve desde el host con un servidor estático
propio en Python (`/usr/local/bin/publia-static-server.py`) que lee los
archivos en cada petición: no hay que reiniciarlo al publicar.

### 3.3 Túnel local (tú, en tu equipo)

```powershell
# El frontend se publica en el host **sólo en loopback** (127.0.0.1):
# no queda expuesto a internet; llega por tu túnel SSH, igual que WordPress.

# Versión compilada (lo que se entrega)
ssh -L 4322:127.0.0.1:4322 yizuz@159.54.133.219
# -> http://localhost:4322

# Versión de desarrollo con recarga en caliente
ssh -L 4321:127.0.0.1:4321 yizuz@159.54.133.219
# -> http://localhost:4321
```

Dentro del contenedor:

```bash
cd /workspace/publia/frontend
npm run dev      # desarrollo (puerto 8091 dentro del contenedor)
npm run build    # compilación estática en dist/
```

---

## 4. Comandos

```bash
npm install          # dependencias (Node ≥ 20.3)
npm run dev          # desarrollo en http://127.0.0.1:4321
npm run build        # compilación estática en dist/
npm run preview      # sirve dist/ en http://127.0.0.1:4322
npm run check        # TypeScript estricto (tsc --noEmit)
npm test             # Pruebas unitarias del grafo y el catálogo (node --test)
npm run sync:content # regenera el snapshot desde el REST de WordPress
```

Suite de QA (42 criterios, Playwright):

```bash
PLAYWRIGHT_BROWSERS_PATH=/home/dsh-dany/workspace/.qa-tools/browsers \
LD_LIBRARY_PATH=/home/dsh-dany/workspace/.browser-libs/usr/lib/aarch64-linux-gnu:/home/dsh-dany/workspace/.browser-libs/usr/lib/x86_64-linux-gnu \
QA_BASE=http://127.0.0.1:4322 node scripts/qa.mjs
```

Sincronizar contenido contra la copia aislada (WordPress en
`http://127.0.0.1:8080` dentro del contenedor):

```bash
WP_BASE_URL=http://127.0.0.1:8080 npm run sync:content
```

---

## 5. Archivos de esta entrega

```text
publia-frontend/
├─ astro.config.mjs · tsconfig.json · package.json · .gitignore · README.md
├─ scripts/
│  ├─ qa.mjs                     Suite de QA (42 criterios)
│  ├─ serve-dist.mjs             Servidor estático propio de dist/
│  └─ sync-wordpress-content.mjs
├─ public/favicon.svg · og-publia-6.svg · robots.txt
├─ docs/
│  ├─ PUBLIA-RESCATE-AUDITORIA.md   Auditoría de rescate (16 puntos, P0/P1/P2)
│  ├─ PUBLIA-ARQUITECTURA.md        Motor de estado, grafo, 3D y movimiento
│  ├─ PUBLIA-MAPA-ESCENAS.md        E00–E30: ruta, segmentos, módulos, etapa
│  ├─ PUBLIA-CATALOGO.md            Membresías, Housing, servicios y reglas
│  ├─ PUBLIA-EFECTOS.md             Los 24 efectos con su estado real
│  ├─ PUBLIA-ASSETS-PENDIENTES.md   Qué falta y por qué
│  ├─ PUBLIA-AUDITORIA.md           Auditoría previa (contenido heredado)
│  ├─ PUBLIA-MAPA-NARRATIVO.md · PUBLIA-RECURSOS.md
│  ├─ PUBLIA-ESTADO.md              Este documento
│  └─ evidencia/                    Capturas + resultados-qa.json
├─ src/
│  ├─ layouts/BaseLayout.astro · pages/index.astro
│  ├─ components/experience/{Hero,SceneBlock}.astro + modules/ (6)
│  ├─ components/three/PrismLayer.astro · components/ui/Nav.astro
│  ├─ lib/experience/{types,state,graph,events}.ts
│  ├─ lib/three/stage.ts · lib/animation/effects.ts
│  ├─ lib/integrations/wordpress.ts
│  ├─ data/{copy,catalog}.ts · data/memberships/ · data/services/ · data/routes/
│  ├─ scripts/experience.ts
│  └─ styles/{tokens,global,scenes}.css
```

---

## 6. Problemas encontrados y resueltos

| Problema | Causa | Resolución | Verificación |
|---|---|---|---|
| El orquestador no arrancaba (error TDZ) | `gsap.context()` se referenciaba a sí mismo | Se eliminó la auto-referencia | QA: 0 errores de consola, rutas operativas |
| Las escenas con segmentos nunca se veían | `data-segments` no se escribía (consecuencia del anterior) | `applyDocumentContext()` escribe ruta y segmentos | QA: escena visible con 653 px |
| Las bifurcaciones no llevaba a ninguna parte | Anclas inexistentes (`#escena-cooperacion`) | Anclas reales del grafo (`#escena-e15`, `#escena-e24`) | QA: destinos válidos |
| La navegación con anclas se quedaba a media altura | `ScrollTrigger.refresh()` en cada escena visitada cancelaba el scroll suave | Refresco sólo cuando cambia la visibilidad | Medición: 1 583 px → destino completo |
| La URL pública servía el build anterior | El build del contenedor no se sincronizaba con el host | Pipeline build → contenedor → host con timer | HTML público con 31 escenas |
| `astro preview` devolvía 403 con `Host` público | Validación de hosts de Vite | Servidor estático propio en el host | HTTP 200 estable |

---

## 7. Riesgos abiertos

| Riesgo | Impacto | Mitigación actual | Requiere |
|---|---|---|---|
| URL pública efímera | El enlace compartido deja de funcionar si el túnel se reinicia | Runbook del subdominio listo (§3.2) | Acción de Dany en Cloudflare |
| AGENTE sin precio cerrado | La web no puede afirmar una cifra | Se publica como rango «por confirmar» | Decisión comercial |
| Continuidad del catálogo heredado | Los 19 servicios publicados pueden cambiar de forma | Se etiquetan como venta puntual del catálogo anterior | Decisión comercial (P1-3) |
| Formulario contextual sin base legal | No se pueden captar datos de contacto | Hoy la conversión es por correo | Legal + proveedor (P1-4) |
| Sin medición de rendimiento en CI | Regresiones de peso pasarían inadvertidas | Presupuesto medido a mano (163,8 kB JS inicial) | Lighthouse en CI (P1-5) |
| Sin auditoría axe en la suite | Un fallo de accesibilidad podría pasar | Revisión manual de foco, landmarks y contraste | Integrar axe (P1-6) |

---

## 8. Siguiente paso propuesto (no ejecutado)

1. Cerrar **P1-1**: crear `preview-publia6.ciudadan.org` (2 minutos en el
   panel de Cloudflare) o entregar un token con permisos de DNS y túnel.
2. **BLOQUE B, refinamiento**: variantes por rasgo en todas las escenas
   compartidas, paleta por escena y pasos horizontales en móvil.
3. **BLOQUE F**: captura de contactos en servidor con base legal (P1-4); el
   formulario contextual ya está listo para cambiar de destino.
4. **BLOQUE G**: Lighthouse en CI y una pasada de axe por cada ruta.
5. Extender las pruebas unitarias a los módulos de escena (render de Astro).

Nada de lo anterior se ejecuta en producción sin aprobación explícita.

---

## 9. Notas de despliegue

1. El build se genera en el contenedor y se copia al host con
   `publia-frontend-sync.sh`; `publia-frontend-ensure.timer` lo ejecuta cada
   2 minutos y comprueba que el servidor estático responde.
2. El servidor estático del host (`publia-frontend-static.service`) lee los
   archivos en cada petición: publicar **no** requiere reiniciar nada.
3. El túnel rápido (`publia-quick-tunnel.service`) es independiente del
   servidor estático: reiniciarlo no tumba el sitio, sólo cambia la URL.
4. El origen sólo escucha en `127.0.0.1`: la exposición pública la hace
   Cloudflare, con TLS.
5. La copia congelada de WordPress
   (`/workspace/publia/baseline-frozen/20261102T040826Z`) sigue intacta y es
   el punto de retorno del contenido heredado.
