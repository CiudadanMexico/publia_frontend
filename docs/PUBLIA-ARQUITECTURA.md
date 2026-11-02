# Publia 6.0 — Arquitectura del frontend

## 1. Principios

1. **Nada de SPA.** Astro pre-renderiza; en el navegador sólo corre el
   orquestador de experiencia (~48 kB gzip) y Three.js bajo demanda
   (~134 kB gzip, carga diferida).
2. **Separación estricta** entre contenido comercial, navegación, estado del
   visitante, representación visual, animación e integraciones.
3. **CMS desacoplado.** WordPress nunca se consulta en tiempo de ejecución:
   el contenido llega como snapshot versionado.
4. **Accesibilidad y rendimiento como requisito**, no como ajuste posterior.
5. **Sin promesas inventadas.** El contenido comercial vive en datos
   estructurados con campos `null` explícitos para lo no confirmado.

## 2. Estructura

```text
publia-frontend/
├─ astro.config.mjs          Astro 5.18.2 + sitemap; React se activa en Fase 4
├─ tsconfig.json             TypeScript estricto (noUncheckedIndexedAccess)
├─ scripts/
│  └─ sync-wordpress-content.mjs   Snapshot del REST API → src/data/content.snapshot.json
├─ src/
│  ├─ layouts/BaseLayout.astro     Metadatos, OG, JSON-LD, skip-link
│  ├─ pages/index.astro            Composición de escenas
│  ├─ components/
│  │  ├─ experience/               Escenas y transiciones narrativas
│  │  │  ├─ Hero.astro
│  │  │  └─ SceneBlock.astro       Escena reutilizable + variantes por estado
│  │  ├─ three/PrismLayer.astro    Capa fija del prisma + fallback SVG
│  │  └─ ui/Nav.astro              Navegación principal
│  ├─ lib/
│  │  ├─ experience/
│  │  │  ├─ state.ts               Motor de estado del visitante (sessionStorage)
│  │  │  ├─ scenes.ts              Resolución de contenido por estado
│  │  │  └─ events.ts              Eventos semánticos con consentimiento
│  │  ├─ three/prism.ts            Escena Three.js del prisma
│  │  └─ integrations/wordpress.ts Adaptador headless (snapshot + REST)
│  ├─ data/
│  │  ├─ copy.ts                   Copy del hero, rutas y escenas
│  │  ├─ catalog.ts                Membresías, complementos, housing, asesoría…
│  │  └─ content.snapshot.json     Contenido publicado del CMS
│  ├─ scripts/experience.ts        Orquestador de cliente
│  └─ styles/                      tokens.css · global.css
└─ docs/                           Auditoría, arquitectura, mapa, catálogo, recursos, estado
```

## 3. Motor de estado

`src/lib/experience/state.ts`

```ts
type PrimaryRoute = 'unclassified' | 'enterprise' | 'efficiency' | 'explorer';
type VisitorTrait = 'cooperative' | 'needs_help' | 'value_driven'
                   | 'starting' | 'existing' | 'advanced';

interface VisitorState {
  primary: PrimaryRoute;
  traits: VisitorTrait[];
  visitedScenes: string[];
  lastScene: string | null;
  updatedAt: number;
}
```

- **No es un cuestionario**: el visitante decide como máximo dos veces (los
  CTA del hero). El resto se infiere por `inferTraits()` a partir de la ruta.
- **Acumulativo**: los rasgos no se excluyen (`efficiency + existing +
  cooperative` es un estado válido).
- **Persistente en la sesión**: `sessionStorage` bajo `publia.visitor.v1`;
  refrescar la página no pierde la elección.
- **Reactivo**: `subscribe()` notifica a la UI; el documento recibe
  `data-route` y `data-traits`, y el CSS adapts la paleta con transiciones.
- **Reversible**: `resetExperience()` vuelve al estado neutro (botón
  «Cambiar de ruta»).

## 4. Motor de escenas

`src/lib/experience/scenes.ts` resuelve, para cada escena, el texto final a
partir del estado: primero la variante de ruta, después las variantes de
rasgos (la última aplica). El servidor renderiza la variante por defecto y
el cliente intercambia el texto mediante un JSON embebido por escena
(`data-role="variants"`), sin recargar y sin duplicar implementaciones.

Visibilidad por ruta (CSS sobre `html[data-route]`):

| Escena | unclassified | enterprise | efficiency | explorer |
|---|---|---|---|---|
| `empresa` | oculta | visible | oculta | oculta |
| `eficiencia` | oculta | oculta | visible | oculta |
| `exploracion` | **visible** | oculta | oculta | visible |
| `escena-compartida` | visible | visible | visible | visible |
| `escena-cierre` | visible | visible | visible | visible |

## 5. Capa 3D: el prisma

`src/lib/three/prism.ts`

- Núcleo `IcosahedronGeometry` con `MeshPhysicalMaterial` (transmisión 0.92,
  IOR 1.62) y aristas con `EdgesGeometry`.
- Siete facetas `Tetrahedron` orbitando, cada una girando sobre un eje
  distinto (X, Y, Z), con radios y velocidades propios.
- Movimiento sobre **los tres ejes** del conjunto (`rotation.x/y/z`), la cámara
  avanza con el scroll (`z` de 6.2 → 4.7) y se desplaza con el puntero.
- La paleta y la velocidad de giro dependen de la ruta: grafito metálico
  (empresa, lenta), ámbar (eficiencia, rápida), verde azulado (exploración),
  violeta (sin elegir).
- Partículas para profundidad y niebla exponencial suave.
- `prefers-reduced-motion` → una sola pasada estática, sin bucle de animación.
- Sin WebGL → se mantiene el SVG de respaldo; el contenido sigue legible.
- `preserveDrawingBuffer: true` permite capturar el prisma (capturas de
  pantalla, pruebas visuales).

## 6. Movimiento

- **GSAP ScrollTrigger** para el progreso global (prisma) y el registro de
  escenas vistas.
- **IntersectionObserver** para las entradas `[data-reveal]` (más barato que
  un trigger por elemento).
- **Sin scroll-jacking**: el scroll nativo nunca se bloquea; sólo se sincroniza
  con la narrativa.
- La ruta implícita por scroll se decide con una comprobación de viewport
  determinista (`updateImplicitRoute`), no con el estado interno de
  ScrollTrigger: así un reflujo de layout no la activa por error.

## 7. Integraciones

| Adaptador | Archivo | Comportamiento |
|---|---|---|
| WordPress headless | `src/lib/integrations/wordpress.ts` | `resolveContent()` usa `PUBLIC_WP_BASE_URL` en compilación y cae al snapshot local si la API no responde. Sin peticiones en runtime. |
| Analítica | `src/lib/experience/events.ts` | Cola local + `sendBeacon` **sólo** si hay `PUBLIC_ANALYTICS_ENDPOINT` y consentimiento. Sin endpoint configurado no sale nada del navegador. |
| Formularios | — | Fase 4: hoy no hay captura de datos personales. |

## 8. Rendimiento

| Recurso | Tamaño | Estrategia |
|---|---|---|
| HTML + CSS crítico | ~11 kB CSS | Inline automático de Astro |
| Orquestador (GSAP + estado) | 121 kB (48 kB gzip) | Carga modular |
| Three.js | 538 kB (134 kB gzip) | `import()` diferido tras el primer render |
| Runtime de React | — | **No se carga**: la integración se activa en Fase 4 |

## 9. Accesibilidad

- HTML semántico (`header`, `nav`, `main`, `section`, `footer`), `aria-labelledby`
  por escena y enlace «Saltar al contenido».
- Foco visible con anillo de foco propio; objetivos táctiles ≥ 44 px.
- Contraste alto sobre fondo oscuro; el texto de apoyo usa `color-mix` con
  transparencias controladas.
- `prefers-reduced-motion` desactiva animaciones, scroll suave y el bucle 3D.
- Sin desbordamiento horizontal (verificado en móvil 390×844).
- Si WebGL falla, la representación estática mantiene la legibilidad.

## 10. SEO

- Metadatos y Open Graph por página, canonical, `robots.txt` y sitemap
  (`@astrojs/sitemap`).
- JSON-LD de `Organization`.
- Contenido indexable renderizado en servidor; las variantes de ruta se
  inyectan como JSON (no texto duplicado en el DOM).
- Pendiente Fase 4: páginas de detalle por membresía y servicio con sus
  propias URLs y metadatos.

## 11. Reglas de trabajo con el repositorio

- Rama de trabajo: `feature/publia-6-frontend` (partiendo de `main`).
- `npm run build` debe terminar sin errores antes de cada entrega.
- `npm run check` (Astro Check) valida TypeScript.
- No se versionan secretos ni el snapshot de credenciales; el snapshot de
  contenido sólo contiene material publicado.
