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
│  ├─ qa.mjs                 Suite de QA (39 criterios, Playwright)
│  ├─ serve-dist.mjs         Servidor estático de `dist/` sin dependencias
│  └─ sync-wordpress-content.mjs   Snapshot del REST API → src/data/content.snapshot.json
├─ src/
│  ├─ layouts/BaseLayout.astro     Metadatos, OG, JSON-LD, skip-link
│  ├─ pages/index.astro            Composición del grafo de escenas
│  ├─ components/
│  │  ├─ experience/
│  │  │  ├─ Hero.astro             E01: dos decisiones de ruta
│  │  │  ├─ SceneBlock.astro       Escena del grafo + doble puerta de visibilidad
│  │  │  └─ modules/               Seis módulos reutilizables
│  │  │     ├─ StatementModule.astro   · TextModule.astro
│  │  │     ├─ NetworkModule.astro     · DemoModule.astro
│  │  │     └─ CatalogModule.astro     · CtaModule.astro
│  │  ├─ three/PrismLayer.astro    Capa fija del escenario + fallback SVG
│  │  └─ ui/Nav.astro              Navegación y «cambiar de ruta»
│  ├─ lib/
│  │  ├─ experience/
│  │  │  ├─ types.ts               Tipos de escena, variante, módulo y etapa
│  │  │  ├─ state.ts               Motor de estado del visitante (sessionStorage)
│  │  │  ├─ graph.ts               Resolución del grafo (variantes, segmentos, destinos)
│  │  │  └─ events.ts              Eventos semánticos con consentimiento
│  │  ├─ three/stage.ts            Escenario 3D persistente y evolutivo
│  │  ├─ animation/effects.ts      Biblioteca de efectos (GSAP + ScrollTrigger)
│  │  └─ integrations/wordpress.ts Adaptador headless (snapshot + REST)
│  ├─ data/
│  │  ├─ copy.ts                   Copy del hero
│  │  ├─ catalog.ts                Catálogo editorial heredado
│  │  ├─ memberships/              Niveles, Housing y reglas de precio
│  │  ├─ services/                 Familias de servicios y servicios heredados
│  │  ├─ routes/scenes.ts          Grafo narrativo E00–E30
│  │  └─ content.snapshot.json     Contenido publicado del CMS
│  ├─ scripts/experience.ts        Orquestador de cliente
│  └─ styles/                      tokens.css · global.css · scenes.css
└─ docs/                           Auditoría, rescate, arquitectura, mapa, catálogo,
                                   efectos, assets, recursos y estado
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

## 4. Motor de escenas: el grafo

`src/data/routes/scenes.ts` (datos) + `src/lib/experience/graph.ts` (resolución)

El grafo contiene 30 escenas (`E00`–`E30`) más el hero (`E01`). Cada escena
declara: propósito, módulos, segmentos, ruta, duración, transición, etapa 3D,
paleta, variantes de texto, datos y destinos.

```ts
interface SceneDefinition {
  id: string;
  purpose: string;
  modules: SceneModule[];
  segments: Segment[];
  route: 'shared' | PrimaryRoute;
  requires?: string[];
  produces?: string[];
  duration?: number;
  variants?: SceneVariant[];
  data?: SceneData;
  cta?: CTA;
  destinations?: string[];
  transition: 'fade' | 'rise' | 'slide' | 'morph';
  stage: StageState;
  palette: PaletteName;
  assets?: VisualAsset[];
}
```

### 4.1 Dos puertas de visibilidad

1. **Ruta** (capa exterior): `.scene[data-scene-route]`. El CSS decide si la
   escena existe para la ruta actual (`html[data-route]`).
2. **Segmentos** (capa interior): `.scene__inner[data-scene-segments]`. La
   escena sólo muestra su contenido si el visitante tiene alguno de los
   segmentos exigidos (`html[data-segments]`).

El filtro por segmento **no depende de JavaScript para el estado inicial**: el
HTML del servidor ya trae la variante neutral y el CSS resuelve el primer
filtro. JavaScript sólo actualiza `data-segments` cuando cambia el estado.

### 4.2 Segmentos

| Origen | Segmento |
|---|---|
| Ruta `enterprise` | `enterprise` |
| Ruta `efficiency` | `efficiency` |
| Ruta `explorer` / sin elegir | `explorer` |
| Rasgo `cooperative` | `cooperative` |
| Rasgo `value_driven` | `values` |
| Rasgo `needs_help` | `practical` |
| Rasgo `starting` | `beginner` |
| Rasgo `existing` | `established` |
| Rasgo `advanced` | `advanced` |

### 4.3 Variantes

Una misma escena puede tener una variante por ruta y por segmento. El servidor
renderiza la variante neutral; el cliente intercambia el texto leyendo el JSON
embebido en `data-variants` y escribiendo en los nodos marcados con
`data-role` (`eyebrow`, `title`, `lead`, `body`). No se duplica ningún
componente: una escena compartida es **una** escena con textos intercambiables.

## 5. Escenario 3D: la entidad persistente

`src/lib/three/stage.ts`

Una sola escena WebGL acompaña todo el relato. **El prisma no se recrea**: se
transforma. Cada estado narrativo define una «mirada» completa y las
transiciones interpolan parámetros en lugar de reconstruir objetos.

| Elemento | Detalle |
|---|---|
| Núcleo | `IcosahedronGeometry` con `MeshPhysicalMaterial` (transmisión 0.92, IOR 1.62, clearcoat) |
| Facetas | 7 `Tetrahedron` en órbita, cada una con eje, radio, fase y velocidad propios |
| Celosía | `EdgesGeometry` de un cubo: aparece en empresa (precisión) |
| Red | 26 nodos con enlaces: aparece en cooperativa y housing |
| Atmósfera | 420 partículas y niebla exponencial |
| Luces | direccional + luz de acento puntual + hemisférica, con color e intensidad interpolados |

Siete estados: `abstract`, `enterprise`, `efficiency`, `explorer`,
`cooperative`, `housing`, `convergence`. Cada uno define color, separación de
facetas, velocidad, opacidad de celosía y de red, posición de cámara, objetivo
y luz de acento.

- El **scroll** desplaza la cámara (`dolly`) y abre/compone las facetas según
  el progreso de la escena.
- El **puntero** añade parallax a la cámara.
- `prefers-reduced-motion` → un único fotograma estático, sin bucle.
- Sin WebGL → permanece el SVG de respaldo y el contenido sigue legible.
- La escena **se pausa** si la pestaña se oculta o el lienzo sale del viewport.
- `destroy()` libera geometrías, materiales, observadores y el renderer.

## 6. Movimiento

`src/lib/animation/effects.ts`

Biblioteca declarativa y reversible: cada efecto se activa con atributos
`data-*` y se revierte con `context.revert()`.

| Efecto | Mecanismo |
|---|---|
| Revelado de bloques | `gsap.fromTo` con `ScrollTrigger` `once: true` |
| Revelado con máscara | Envuelve cada palabra en `.mask-line__inner` y anima `yPercent` |
| Parallax multicapa | `yPercent` ligado a `scrub` |
| DOF simulada | `scale` + `filter: blur()` con `scrub` |
| Contadores | Tween de un objeto de estado; sólo datos verificables |
| Diagramas SVG | `strokeDashoffset` con retardo por enlace |
| Progreso por escena | `onUpdate` alimenta la etapa 3D y la cámara |
| Pinning | `ScrollTrigger` con `pin` y `anticipatePin` |
| Sección horizontal | `x` ligado a `scrub` con `pin` |

Reglas: sin *scroll-jacking* (el scroll nativo nunca se bloquea), sin contadores
decorativos, con alternativas estáticas bajo `prefers-reduced-motion`.

**Refresco condicional**: `ScrollTrigger.refresh()` recalcula el scroll y
cancela los scrolls suaves en curso. Sólo se dispara cuando cambia la
visibilidad (ruta o segmentos), nunca por cada escena visitada.

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

## Hero 3D aprobado

```
src/
  components/experience/Hero.astro   marcado del hero (titular, botones, controles)
  lib/three/
    heroScene.ts                     escena aprobada: cámara, rig, bloom, mascota,
                                     prisma facetado y ocho tarjetas holográficas
    hero/
      fondo.ts  estelas.ts  particulas.ts  plataforma.ts
                                     módulos originales portados a TypeScript
public/
  models/    PUBLIA_P_robotica_v2.glb, PUBLIA_prisma_suave_v2.glb
  textures/  atmosfera.webp
  icons/     icono_01.png … icono_08.png
  brand/     logotipo oficial, isotipo y favicon
```

Flujo de ejecución:

1. `experience.ts` importa el módulo del hero de forma diferida y lo inicializa
   con su propio lienzo (`data-hero-canvas`).
2. Un `IntersectionObserver` sobre la sección del hero escribe
   `data-hero-active` en `<html>`: la capa global 3D se apaga (CSS) y su
   `setActive(false)` deja de renderizar mientras el hero está en pantalla.
3. La escena registra su estado en el lienzo (`data-hero-ready`,
   `data-hero-errors`, `data-cards-in-view`) para que la QA pueda verificarlo
   sin depender de la imagen.
4. Al salir de la vista, el hero pausa su bucle y la capa global vuelve a
   tomar el lienzo.
5. `destroy()` (en `pagehide`) libera recursos, tweens, ScrollTriggers y el
   contexto WebGL.
