# Publia 6.0 — Assets pendientes

Fecha: 2026-11-02 · Estado: lo que la web **no** usa todavía porque falta una
decisión, una pieza de marca o una producción. Nada de esto bloquea la
revisión de la experiencia: la web funciona con sustitutos explícitos.

Regla del brief: **sin imágenes de stock**. Todo lo visual que se añada
debe ser original (producción propia, ilustración de marca o render 3D del
propio sistema).

| # | Asset | Sustituto actual | Para qué | Estado | Quién lo resuelve |
|---|---|---|---|---|---|
| A-01 | Marca y logotipo finales | Rombo CSS (`.nav__mark`) + wordmark tipográfico | Identidad de marca, favicon y firma de correo | PENDIENTE | Dany (dirección de marca) |
| A-02 | Tipografía definitiva | Pila de sistema (`system-ui`) | Carácter editorial y jerarquía de marca | PENDIENTE | Dany + diseño. La web hereda de Flatsome (Lato + Dancing Script) como referencia, no como decisión |
| A-03 | Fotografía de equipo y oficio | Sin fotos: sólo tipografía, SVG y 3D | E05 (red de personas), E11 (personas detrás), E16 (Ciudadan) | PENDIENTE | Producción propia; **no** stock |
| A-04 | Imágenes de producto del catálogo heredado | 20 productos de WordPress sin imagen propia en la web | E28 (operación y servicios) | PENDIENTE | Usar `uploads` (2 637 archivos, 277 MB) como fuente; hay que elegir y comprimir |
| A-05 | Render 3D del prisma en alta resolución | Prisma procedural en tiempo real | Portadas, prensa, LinkedIn | PENDIENTE | Captura del escenario 3D (`preserveDrawingBuffer` ya está activo) |
| A-06 | Imagen social Open Graph 1200×630 | `og-publia-6.svg` (vector, 1,2 kB) | Previsualización al compartir | PARCIAL | Falta la versión ráster que aceptan WhatsApp y LinkedIn |
| A-07 | Favicon definitivo | `favicon.svg` (493 B) | Pestaña y PWA | PARCIAL | Se regenerate al cerrar A-01 |
| A-08 | Set de iconografía | Pictogramas tipográficos y SVG dibujados a mano en los módulos | Catálogo, demos, red | PARCIAL | Falta un set unificado; hoy cada módulo usa su propia forma |
| A-09 | Ilustración del reparto 50/25/25 | Barras SVG animadas (E22) | Housing | HECHO | — |
| A-10 | Ambiente sonoro del recorrido | Sin audio | Inmersión opcional | PENDIENTE | Decisión de producto: el audio por defecto debe estar apagado |
| A-11 | Video-looper de fondo | Sin video: escena 3D real | Hero | PENDIENTE | Sólo si el 3D se sustituye en equipos sin WebGL |
| A-12 | Documentos legales (aviso de privacidad, términos) | Texto de enlace pendiente | Formulario contextual (P1-4) | PENDIENTE | Legal + Dany |
| A-13 | Textos de correo transaccional | `mailto:` con contexto de ruta y rasgos | Conversión | HECHO (parcial) | Falta el formulario con proveedor y base legal (P1-4) |
| A-14 | Vídeos de demostración de producto | Demos tipográficas con datos simulados | E08, E09, E10 | PENDIENTE | Producir con capturas reales del producto; nunca simular que es real |
| A-15 | Ilustración del modelo cooperativo | Red SVG de 8 enlaces + nodos 3D | E17, E18 | HECHO (parcial) | Falta una versión con casos reales de cooperativas |

## Notas

1. **Los datos de negocio nunca son assets pendientes.** Los precios,
   repartos y ventanas horarias salen del catálogo en `src/data/` y están
   verificados contra la base de datos. Lo pendiente es lo gráfico.
2. **Los heredados de WordPress están disponibles**: 2 637 archivos en
   `uploads` (898 PNG, 391 JPG, 69 WebP, 22 GIF, 6 PDF, 5 SVG, 3 MP4; 277 MB)
   y 344 registros en la biblioteca. Ninguno supera 20 MB. Sirven como fuente
   para A-03 y A-04 tras una revisión de licencia y compresión.
3. **El escenario 3D no necesita archivo externo**: el prisma, las facetas, la
   celosía, los nodos y las partículas se generan por código. Eso mantiene el
   peso de la escena en un único bundle diferido (543 kB) y evita depender de
   un `.glb` que nadie puede editar después.
4. Criterio de cierre: ningún asset "pendiente" puede aparecer en producción
   con un sustituto visible que parezca definitivo (por ejemplo, un logo de
   prueba en el pie o un `lorem ipsum` en una escena de catálogo).
