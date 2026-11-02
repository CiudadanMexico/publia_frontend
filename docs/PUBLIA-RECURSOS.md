# Publia 6.0 — Recursos visuales

Estado: inventario de lo que existe en el WordPress aislado, lo que se puede
reutilizar y lo que falta. No se han descargado imágenes de Internet ni se han
sustituido los modelos 3D definitivos por gráficos genéricos.

## 1. Identidad reutilizable

| Recurso | Ruta en el WordPress aislado | Dimensiones | Uso previsto |
|---|---|---|---|
| Logo vigente (`site_logo`) | `wp-content/uploads/2026/08/logo-publia.png` | con derivaciones | Nav y cierre (Fase 4). Pendiente vectorizar. |
| Logo transparente anterior | `wp-content/uploads/2023/04/cropped-logo_trans_mx.png` | 493×458 | Alternativa transparente; es un raster a 493 px. |
| Favicon vigente (`site_icon`) | `wp-content/uploads/2023/03/cropped-icono-4.png` | — | Referencia; esta entrega usa `public/favicon.svg` (propio). |
| Iconos de marca | `wp-content/uploads/2023/03/cropped-icono-1..4.png`, `uploads/2023/04/icono_web.png` | — | Red social y app (Fase 4). |
| Logos del tema (defaults, **no** de marca) | `themes/flatsome/assets/img/logo.png`, `logo-light.png` | 400×84 | No se reutilizan. |
| Referencias huérfanas | `uploads/2023/10/logo-light.png`, `uploads/2023/10/logo-publia.svg` | — | **No existen**: el contenido los referencia pero no están en la copia. |
| Imagen de Open Graph | `public/og-publia-6.svg` | 1200×630 | Placeholder tipográfico propio, con el prisma. Sustituir por composición final. |

> **LICENCIA:** el logo y las fotografías son de la propia marca; el CSS, las
> fuentes de iconos y el resto del tema Flatsome **no** se reutilizan
> (licencia premium del tema).

## 2. Fotografía disponible

277 MB en `wp-content/uploads`, con fotos de servicio por año:

| Carpeta | Uso probable |
|---|---|
| `uploads/2025` | Campañas, IA, ChatBots, eventos (material más reciente) |
| `uploads/2023` | Catálogo histórico, logos, cabeceras de producto |
| `uploads/2020`, `uploads/2021`, `uploads/2018` | Material antiguo; revisar calidad y vigencia |
| `uploads/woocommerce_uploads` | Imágenes de producto (WebP/JPG) |
| `uploads/wpcf7_uploads` | Adjuntos de formularios |
| `uploads/ast-block-templates-json`, `uploads/uag-plugin` | Plantillas de bloques (Flatsome/Spectra) |

Formatos: 898 PNG, 391 JPG, 69 WebP, 22 GIF, 6 PDF, 5 SVG, 3 MP4.
No hay archivos de más de 20 MB.

**Antes de usar una foto en el frontend nuevo** hay que confirmar: autor,
licencia y que no contenga datos personales ni de terceros identificables.

## 3. Tipografía

- El tema Flatsome **no incluye** una tipografía de marca con licencia local:
  sólo `fl-icons.woff/woff2/ttf` (fuente de iconos del tema, no reutilizable).
- Flatsome usa **Lato** (encabezados, texto y navegación) y **Dancing Script**
  (texto alterno) mediante Google Fonts; no hay binarios en el repositorio.
  Son las tipografías de la identidad heredada y el punto de partida para
  elegir la definitiva (ambas de uso común con licencia abierta, pero hay que
  verificar y autoalojar la versión concreta).
- **Decisión de esta entrega:** pila de sistema (`system-ui`, `ui-monospace`).
  Cero peticiones a terceros, render inmediato y sin problemas de licencia.
- **Pendiente:** elegir y verificar la tipografía definitiva (autohospedada,
  con licencia comprobable) antes de la entrega de marca final.

## 4. Color

| Origen | Paleta observada |
|---|---|
| Tema heredado | Grises `#ececec`, `#f1f1f1`, `#f3f3f3` + acentos `#51cb5a` (verde), `#fc7600` (naranja), `#e5086f` (rosa), `#fff600` (amarillo) |
| Propuesta 6.0 | Base ink `#07070a`–`#343441`, acentos violeta `#b48bff`, teal `#4fd1c5`, ámbar `#ffb547`, grafito `#c8cad6` |

La paleta 6.0 se define por ruta (`tokens.css`), no por sección: cada ruta
cambia el carácter de la escena sin rehacer el sistema visual. **Decisión
pendiente:** confirmar si se conserva la saturación de la identidad heredada.

## 5. Modelo 3D

- **Estado:** el prisma es una construcción geométrica propia (icosaedro
  cristalino + siete facetas tetraédricas orbitando), no un modelo importado.
- **Falta:** el modelo 3D definitivo de marca (si existe). No se sustituye por
  un gráfico genérico: se documenta como pendiente y se entrega un placeholder
  geométrico coherente con el concepto.
- **Falta:** texturas, reflejos de entorno (HDRI) y post-procesado si se
  decide un acabado cinematográfico más elaborado.

## 6. Manifiesto de recursos faltantes

| # | Falta | Impacto | Fase sugerida | Nota |
|---|---|---|---|---|
| 1 | Tipografía de marca con licencia | Alto | Fase 5 | Hoy: pila de sistema |
| 2 | Logo vectorizado (SVG) y variantes por fondo | Medio | Fase 4 | El logo vigente es PNG; hay referencias a un SVG que no existe |
| 3 | Fotografía de marca para las rutas | Medio | Fase 4 | Catálogo heredado disponible, falta selección y licencia |
| 4 | Modelo 3D definitivo | Medio | Fase 5 | Placeholder geométrico en uso |
| 5 | Imagen OG rasterizada (PNG/JPG) | Bajo | Fase 5 | Hoy: SVG |
| 6 | Capturas reales del producto (dashboard, agente, nodo) | Medio | Fase 4 | El frontend puede mostrar interfaz ilustrada |
| 7 | Vídeo corto de marca (10–20 s) | Bajo | Fase 5 | Hay 3 MP4 en uploads: revisar |
| 8 | Ilustración del modelo cooperativo (nodos, gobernanza) | Medio | Fase 4 | Puede generarse con el sistema de nodos de Three.js |

## 7. Reglas de uso

1. Nada de imágenes descargadas al azar para rellenar huecos.
2. Todo recurso visual nuevo se registra aquí antes de usarse.
3. Los placeholders son geometría propia, señalada como tal.
4. Los modelos definitivos se incorporan después, sin reescribir la
   arquitectura: la escena del prisma ya acepta un modelo alternativo
   (interfaz única de creación).
