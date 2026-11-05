# Entrega V4-B — Assets reales (AVIF), mosaico seleccionable, personas+IA marfil, cierre personalizado

Base: commit `4950064` (V4-A). Staging: https://kitty-midi-grid-liked.trycloudflare.com · QA **133/133** local y pública · unit 15/15 · tsc/build limpios · axe sin violaciones graves/moderadas · 0 errores JS en vídeos.

## 0. Recepción confirmada de `imagenes1.zip`
- Bandeja: `/srv/publia-upload/inbox/Imagenes1.zip` — **10 178 529 bytes** — **SHA-256 `d34b6f6d7965f77bdfe16cdd4903ffa686f6a0243e5640266f182ad0c68edb60`**
- 4 imágenes dentro (PNG, verificadas por muestreo de color, no sólo por nombre):

| archivo | bytes | resolución | SHA-256 | contenido verificado | slot | escenas |
|---|---:|---|---|---|---|---|
| P0_02_Automatizacion.png | 2 407 042 | 1672×941 | fdded3b6…4855aef | azul eléctrico + coral | A03 | E06–E09 |
| P0_03_Infraestructura.png | 2 650 257 | 1670×942 | 5fdac1b2…4a53c64 | noche azul + dorado | A04 | E03/E04/E06/E21 |
| P0_04_Ecosistema.png | 2 139 942 | 1672×941 | e3cf70c7…5a00f | violeta/majenta | A02 | E25 |
| P0_05_Comunidad_Geonodos.png | 3 117 168 | 1672×941 | 9ef65edf…92e3c4 | tierras cálidas + cielo | A05 | E15–E17 |

Registro completo en `src/data/sceneAssets.ts` (`RECEIVED_ASSETS`). Originales PNG conservados en `_entrega/analisis/imagenes1/`.

## 1. Integración optimizada (AVIF)
Cada imagen se derivó a **AVIF** (sharp): escritorio (≤1920 px, q58) + **recorte vertical móvil 4:5 centrado** (1080×1350, q60) servido vía `<picture><source media="(max-width:760px)">` — en móvil el texto DOM y los controles siguen siendo HTML accesible, la imagen es sólo arte de escena (no póster clicable, no se duplican rótulos rasterizados). Pesos: 153–404 KB escritorio, 100–246 KB móvil. Detección en build (`data-asset-ready`), sin 404s. QA verifica `image/avif` servido en los 4 slots.

## 2–6. Escenas V4-B
- **Llegadas (E03/E07/E15):** ahora muestran la imagen real aprobada como protagonista derecho (split) junto al demo interactivo; hero intacto.
- **E25 mosaico violeta:** 7 familias de soluciones como mosaico asimétrico (pieza doble protagonista) con **selección real**: click/teclado → expansión + `aria-pressed` + respuesta `servicio` persistida + pulso en las tarjetas 3D. Imagen P0-04 como arte de fondo del capítulo (sin sustituir el mosaico). E26 queda con lo "más allá de lo digital" (sin duplicar familias).
- **E11 personas+IA:** movida a **marfil (cream)** con composición split dentro de la ruta eficiencia — «LA IA AYUDA. **LAS PERSONAS DECIDEN.**» + escalación IA→cola→becario→especialista. Typos corregidos («un(resource) infinito», «supervision», «celula», «consume»).
- **E27 membresías amarillas:** módulos grandes sobre amarillo con precios validados en MXN (sin inventar AGENTE ni prometer disponibilidad).
- **E29 cierre personalizado:** nuevo módulo `recommendation` — lee ruta + `answers` (foco/escala) de la sesión y renderiza 2–3 sugerencias reales + contacto humano; se re-renderiza al cambiar de ruta.

## Evidencia visual (todas en `docs/audit/v4/`)
- **A/B por capítulo** referencia aprobada vs staging, 1440×900: `v4b-comparativo-{inicio,automatizacion,soluciones,empresa,cooperativismo,personas,membresias,cierre}.jpg` (izquierda referencia, derecha staging) + originales `v4b-ref-*.png` / `v4b-staging-*-desktop.png`.
- **Móvil 390×844** de cada capítulo: `v4b-staging-*-movil.png`.
- **Vídeos continuos ida+interacción+regreso+volver:** `docs/audit/video/v4b-01-ruta-empresa-interactiva-ida-vuelta.webm` (capa Agentes), `v4b-02-ruta-eficiencia-mosaico-ida-vuelta.webm` (foco marketing + selección de familia en E25), `v4b-03-ruta-exploracion-geonodo-ida-vuelta.webm` (GeoNodo «aprender») — 0 errores JS, estado final `act=hero world=hero` con ruta conservada.

## Pendiente declarado
- P0-02..05 como **capas/objetos** dentro de las escenas (no sólo arte de panel) cuando llegue la siguiente tanda; A01/A06/A08/A09 siguen en placeholder procedural.
- Microinteracciones del doc 03 (halo en CTA, circuito luminoso), diagnóstico compartido D5, P1 previos. Producción sin tocar.
