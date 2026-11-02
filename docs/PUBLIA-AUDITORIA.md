# Publia 6.0 — Auditoría previa al frontend (Fase 0)

Fecha: 2026-11-02 · Alcance: copia **aislada** de WordPress en el contenedor
`temporal3-agent3` (host `159.54.133.219`), nunca producción.

---

## 1. Entorno y repositorio

| Elemento | Hallazgo |
|---|---|
| Repositorio Git del sitio | **No existe**. Ni `/home/dsh-dany/workspace/publia-wordpress` ni el workspace del agente están versionados. |
| Ubicación de la copia WP | `/workspace/publia/wordpress` dentro del contenedor `temporal3-agent3` (bind del host `/srv/ciudadan-agents/agents/temporal3-agent3/workspace/publia`). |
| WordPress | 7.1.4 · PHP 8.3.6 · MariaDB 10.11.14 · Nginx (contenedor) · prefijo de tablas `wpnv_`. |
| Tema | Flatsome 3.20.5 (producción) — en la copia aislada el activo inicial era Twenty Twenty-Five. |
| Plugins | 33 instalados, 0 activos tras la importación saneada (ver §6). |
| Copia congelada | `baseline-frozen/20261102T040826Z` (root, inmutable) con `wp-content`, dump de base, manifiesto SHA-256 y `meta.json`. Es la referencia de rollback. |
| Node local | v24.21.0 · npm 11.19.0 (red npm operativa). |
| Node en el agente | v20.20.2 → **Astro 7 no arranca ahí** (exige Node ≥ 22.23.4); por eso el proyecto usa Astro 5.18.2, que corre en ambos. |

**Decisión:** el frontend Astro nace como **proyecto nuevo y separado**
(`/home/dsh-dany/workspace/publia-frontend`), con su propio repositorio Git y
rama propia. No se toca ni se sobrescribe WordPress: la copia convive como
CMS y fuente de contenido.

## 2. Inventario de contenido

| Métrica | Valor |
|---|---|
| Páginas publicadas | 60 |
| Borradores | 0 |
| Productos WooCommerce publicados | 20 |
| Productos con precio real | 20 (el REST público los devuelve a 0; los precios están en `_price`) |
| Adjuntos totales | 2 637 archivos en `uploads` (898 PNG, 391 JPG, 69 WebP, 22 GIF, 6 PDF, 5 SVG, 3 MP4 + 1 232 JS/CSS generados) · 344 registrados en la biblioteca |
| Posts publicados | 10 (2 auto-draft) |
| Revisiones | 1 874 (pendientes de depurar) |
| Volumen de `uploads` | 277 MB |
| Archivos > 20 MB | ninguno |

### Servicios del catálogo heredado (precios vigentes en la base)

| Producto | Precio MXN | Producto | Precio MXN |
|---|---|---|---|
| Desarrollo Web & Apps | 150 | E-commerce a medida | 200 |
| ChatBots Inteligentes | 200 | ChatBots SemiInteligentes | 200 |
| ChatBots WhatsApp y FB Messenger | 200 | Diseño Web Básico | 200 |
| Campañas Social Media, SEO y ads | 500 | Edición de Video Inteligente | 500 |
| Producción MultiMedia Digital | 500 | Organización de Eventos | 500 |
| Asesorías I.A. | 800 | Foto de Producto | 800 |
| Servidores I.A. Empresariales | 800 | Diseño Web Personalizado | 5 000 |
| Gestión Empresarial Móvil | 5 000 | Sistemas de Reparto y Entregas | 200 |
| Sistemas de Entrega, Reparto y Cobranza | 1 500 | Desarrollo de Aplicaciones | 10 000 |
| Sucri (prueba) | 15 | | |

> Estos precios son del catálogo viejo, basado en **servicios puntuales**. La
> oferta nueva (membresías) convive con ellos en la Fase 4: hay que decidir
> qué se conserva, qué se reformula y qué se retira.

### Páginas destacadas (reutilizables como contenido editorial)

`integraciones`, `sitios`, `e-commerce`, `servidores` (Servidores I.A.),
`aplicaciones`, `multimedia` (Producción MultiMedia), `ventajas`, `soluciones-x-sector`,
`preguntas-frecuentes`, `contacto`, `politica-de-privacidad`, `gana`, `trabaja`,
más las páginas de cuenta del usuario y de membresía heredadas
(`membership-levels`, `membership-checkout`, `membership-account`, `tu-cuenta`,
`carrito`, `checkout`, `shop`).

> Las páginas `membership-*` y `login` provienen de plugins de membresía del
> sitio viejo: su lógica no se replica; el frontend nuevo define su propia
> conversión (Fase 4).

### Navegación heredada

- `Main Menu` con **27 elementos** (10 páginas, 15 productos, 2 posts).
- Otros menús: `+INFO` (6) y `SERVICIOSS` (14).
- `nav_menu_locations` está **vacío**: no hay ubicación asignada, el menú se
  identificó por nombre. La navegación del sitio nuevo se reconstruye (§7).

### Membresías heredadas (inactivas)

| Plan | Inicial | Recurrente | Periodicidad | Origen |
|---|---|---|---|---|
| «Abierto» | 0 MXN | 0 MXN | sin ciclo | PMPro (plugin inactivo) |
| «Zhatbot» | 10 MXN | 10 MXN | 1 día | PMPro (plugin inactivo) |

`paid-member-subscriptions` está instalado e inactivo con 4 registros de
suscripción residuales. **No se inspeccionaron clientes.** El frontend nuevo
no hereda esta lógica.

### Checkout actual

Sólo **transferencia bancaria (`bacs`), cheque (`cheque`) y efectivo (`cod`)**.
`stripe-payments` está instalado pero inactivo y hay **1 webhook de WooCommerce
configurado** (revisar antes de cualquier uso real).

## 3. Identidad y recursos reutilizables

| Recurso | Ubicación | Estado |
|---|---|---|
| Logo vigente (`site_logo`) | `uploads/2026/08/logo-publia.png` (con derivaciones de tamaño) | reutilizable |
| Logo transparente anterior | `uploads/2023/04/cropped-logo_trans_mx.png` (493×458) | reutilizable |
| Favicon vigente (`site_icon`) | `uploads/2023/03/cropped-icono-4.png` | reutilizable |
| Iconos de marca | `uploads/2023/03/cropped-icono-1..4.png`, `uploads/2023/04/icono_web.png` | reutilizable |
| Logos del tema (defaults, **no** de marca) | `themes/flatsome/assets/img/logo.png`, `logo-light.png` | no reutilizar |
| Referencias huérfanas | `uploads/2023/10/logo-light.png`, `uploads/2023/10/logo-publia.svg` | **no existen** |
| Fotografías de servicio | `uploads/2025`, `uploads/2023`, `uploads/2020` (WebP/JPG) | reutilizable con licencia por confirmar |
| Tipografías | Flatsome usa **Lato** (encabezados, texto y navegación) y **Dancing Script** (texto alterno), servidas por Google Fonts; en el repo sólo `fl-icons` | **no hay binarios de marca con licencia local** |
| Color | Predominan grises (`#ececec`, `#f1f1f1`) con acentos vivos (`#51cb5a`, `#fc7600`, `#e5086f`, `#fff600`) | identidad heredada ≠ paleta 6.0 |

**Riesgo de licencia:** el tema Flatsome es premium y sus fuentes de iconos y
el CSS forman parte de la licencia del tema. En el frontend nuevo sólo se
reutilizan **imágenes de marca** (logo) y fotos propias; no se copia el CSS del
tema.

**Decisión tipográfica:** como no existe tipografía de marca con licencia
verificada, la primera entrega usa la pila de sistema (`system-ui` / `ui-monospace`).
No se carga Google Fonts: cero peticiones a terceros y render inmediato. La
tipografía definitiva queda como decisión pendiente (§8).

## 4. Integraciones detectadas

- **Pagos:** plugin `stripe-payments` (Accept Stripe Payments) instalado y
  **inactivo**; claves saneadas en la base.
- **Correo:** MailPoet instalado e inactivo.
- **Analítica/social:** Shareaholic, Ultimate Social Media Icons, Sassy Social
  Share, TikTok for Business, WhatsApp, PChat: inactivos.
- **Formularios:** Contact Form 7 (con `uploads/wpcf7_uploads`).
- **Scripts de terceros:** ninguno activo en `src` (todo es local); sólo
  referencias `s.w.org` y `www.w3.org` en scripts inline.
- **Enlaces externos a validar** antes de depender de ellos: `5tierras.com.mx`,
  `colegiobajio.com`, `delvmeseguros.com`, `dinver.mx`, `ditracen.com`.
- **Soberanía de datos:** el sitio viejo acumula plugins de terceros; la
  experiencia nueva nace sin ninguno (sin píxeles de terceros, sin chat
  embebido, sin publicidad).

## 5. Riesgos

| Riesgo | Impacto | Mitigación |
|---|---|---|
| Heredar la lógica del catálogo viejo (precios y servicios sueltos) | Alto | Fase 4: mapa explícito de conservar / reformular / retirar |
| WordPress se queda como CMS *y* como sitio publicado | Medio | El frontend no enlaza ni redirige al viejo; conviven por ruta |
| Confundir membresía (producto recurrente) con servicio puntual | Alto | `catalog.ts` separa `MEMBERSHIPS` de `SERVICE_FAMILIES`; reglas de promesa en `PUBLIA-CATALOGO.md` |
| Prometer capacidades técnicas no confirmadas | Alto | Reglas de no-invención aplicadas en copy y datos (Laborys `null`, housing sin precio, publicidad no invasiva como estudio) |
| Coste de Three.js (538 kB / 134 kB gzip) | Medio | Carga diferida por `import()` dinámico; fallback SVG sin WebGL; reduced-motion sin bucle |
| Sin tipografía de marca | Bajo | Pila de sistema; decisión abierta en §8 |
| Dos fuentes de verdad del contenido (WP y `src/data`) | Medio | El snapshot se regenera con `npm run sync:content`; la compilación nunca depende de la API |
| Sin correo de contacto real | Alto | El formulario de conversión (Fase 4) necesita una dirección; queda pendiente de decisión |
| 20 colisiones de título y 4 duplicados | Medio | Depurar antes de migrar contenido; canonicización por slug |
| 1 webhook de WooCommerce activo | Medio | Revisar destino y desactivarlo en el flujo de publicación |
| 1 874 revisiones y 1 232 archivos generados | Bajo | Depurar en la copia, no afecta al frontend |

### Calidad del contenido heredado

- **0 páginas publicadas con cuerpo vacío** (las 60 tienen contenido).
- Duplicados exactos: páginas `Desarrollo de Aplicaciones`, `E-commerce a
  medida`, `Producción MultiMedia Digital` (×2 cada una) y el producto
  `Producción MultiMedia Digital` (×2).
- **20 colisiones de título** entre página, producto y post: complican
  canonicalización, SEO y analítica.
- Variantes que sólo difieren en mayúsculas: `E-commerce a medida` /
  `E-Commerce a Medida`.
- URLs `localhost:6103` embebidas en el contenido: hay que sustituirlas antes
  de publicar.

### Contacto y marca

- **0 correos propios** en el contenido publicado (las 40 direcciones que hay
  en options/meta son `@example.invalid`, resultado del saneado).
- **1 teléfono público** (enlace `tel:` y botón de WhatsApp en «Contacto»).
- Redes oficiales: Facebook `facebook.com/publiamex`, Instagram
  `instagram.com/publiamex`, LinkedIn `linkedin.com/in/publiamex`, YouTube
  `youtube.com/@publiamx`, WhatsApp `wa.me/525573724660`.
- Ubicación configurada: Ciudad de México, México (sin calle postal pública).
- **Consecuencia para el frontend:** hace falta una dirección de contacto real
  (correo) antes de montar el formulario de conversión de la Fase 4.

## 6. Estado del WordPress aislado (no se modifica)

- Plugins activos en la copia editable: WooCommerce 11.2.0, Contact Form 7,
  DK PDF, PDF & Print, DearFlip Lite, Spectra/Ultimate Addons, AI.
- Inactivos por política: Code Snippets, LiteSpeed Cache, Stripe, MailPoet,
  chat/redes/analítica, membresías.
- `blog_public=0`, búsqueda global desactivada, 0 agentes activos, 0 residuals
  de secretos en contenido y base de datos.

## 7. Arquitectura propuesta (resumen)

Frontend Astro **estático** (SEO y velocidad) + WordPress como CMS headless
(opcional, vía snapshot) + capas separadas: contenido comercial
(`src/data`), motor de estado (`src/lib/experience`), navegación de escenas
(`src/lib/experience/scenes.ts`), 3D (`src/lib/three`), integraciones
(`src/lib/integrations`) y presentación (`src/components`, `src/styles`).
Detalle en `PUBLIA-ARQUITECTURA.md`.

## 8. Decisiones pendientes de confirmar

1. **Tipografía de marca**: ¿se contrata/licencia una tipografía concreta o
   se adopta la pila de sistema? (hoy: sistema).
2. **Paleta**: la identidad heredada usa acentos verdes/naranjas sobre grises.
   La propuesta 6.0 usa grafito + violeta/teal/ámbar. ¿Se mantiene la
   saturación heredada o se asume la paleta 6.0?
3. **Catálogo viejo**: ¿qué servicios se conservan con su precio, cuáles se
   reformulan y cuáles se retiran al llegar la oferta por membresías?
4. **Oferta cooperativa**: sigue sin precio ni beneficios contractuales
   (se modela como configurable, sin números inventados).
5. **Laborys**: cantidad mensual por membresía sin confirmar.
6. **Housing**: mensualidad de la modalidad privada sin definir; hardware
   completo y condiciones de salida pendientes de contrato.
7. **Memoria histórica**: la consulta automática al consultor (`chatgpt-web/auto`)
   devolvió vacío en esta sesión; **no se ha recuperado ningún acuerdo
   histórico** y no se ha asumido ninguno. Los acuerdos que se han
   respetado aquí son los explícitos en la misión.

## 9. Requisitos y dependencias

- Node ≥ 20.3 (Astro 5.18.2), npm ≥ 9.6.
- `astro`, `@astrojs/sitemap`, `gsap`, `three`; `react` instalado pero su
  integración se activa en la Fase 4 (primera isla con estado complejo).
- Playwright + Chromium sólo para QA visual (instalados en espacio de usuario,
  sin tocar el sistema).
- Sin dependencias de servidor: el resultado es estático y publicable en
  cualquier hosting.

## 10. Procedencia de los datos

Todo lo anterior procede de lecturas en vivo de la copia aislada
(`wp post list`, `wp plugin list`, consultas `SELECT` de solo lectura sobre
`wpnv_posts`/`wpnv_postmeta` y recorrido de `wp-content/uploads`). No se
exportaron credenciales, hashes, tokens ni datos personales.
