# Auditoría de imágenes desktop — PUBLIA (staging, commit base `6f5078f` + parche)

Entrada externa: `Publia_Auditoria_Imagenes.zip` (SHA-256 `a15a00b6…d405ee6be`, 3 336 793 B) — sus SHA-256 de las 4 piezas coinciden exactamente con los archivos de `imagenes1.zip` que recibí, así que **se integraron las versiones aprobadas vigentes** (no variantes viejas).

## 1. Mapa de apariciones (antes del parche) — auditado en vivo con Playwright sobre el túnel
Componente responsable único: `src/components/experience/ArtPlaceholder.astro` (un `.scene__art` por escena con slot vía `src/data/sceneAssets.ts`).

| Asset | Escenas con slot (antes) | Apariciones simultáneas del mismo póster |
|---|---|---|
| A04 (P0-03 infraestructura) | E03, E04, E21 | **3** |
| A03 (P0-02 automatización) | E06, E07, E08, E09 | **4** |
| A05 (P0-05 geonodos) | E15, E16, E17 | **3** |
| A02 (P0-04 ecosistema) | E25 | 1 |

Regla CSS aplicada antes: `.scene__art img { position:absolute; inset:0; width/height:100%; object-fit:cover }` → en layouts pipeline/mosaic la caja medía **1214×318 (3.82:1)**, recortando ~72% del alto del póster 16:9 (1.78:1); en split 665×522 (1.27:1) recortaba los laterales. Coincide con el diagnóstico del auditor externo (pérdida ~24% de alto en 21:9).

## 2. Inventario de problemas
- **Duplicados:** mismo archivo AVIF visible en 3–4 escenas consecutivas de cada ruta (tabla anterior).
- **Recortados:** cover en cajas 3.82:1 y 1.27:1 (letras/CTA incrustados del póster quedaban fuera).
- **Faltantes:** escenas sin slot (E10, E12, E13…) quedaban sólo con placeholder genérico; A01/A06/A08/A09 siguen sin recurso real (placeholder procedural, `data-asset-ready=false`).
- **No rotos:** hero 3D intacto; A02 servía 200 `image/avif`; sin 404.

## 3. Correcciones inmediatas (con archivos existentes, sin nuevas imágenes)
1. `ArtPlaceholder.astro`: el asset real (`data-asset-ready=true`) sólo en la **escena primaria** del slot (E03/E07/E15/E25). En el resto del slot no se emite ni `src` (no se descargan duplicados) y se conserva el placeholder procedural.
2. `global.css`: con asset real, `.scene__art` adopta `aspect-ratio: 16/9` (móvil `4/5` con el recorte vertical AVIF), `max-height: min(64vh, 620px)`, fondo ambiental por gradiente del tono de escena, y el `img` usa **`object-fit: contain`** → el póster se ve completo, nunca como fondo recortado. Textos/CTA/controles siguen siendo 100% HTML accesible.
3. QA nuevo (3 checks): cada asset aparece una vez; caja 16:9 (1.7–1.85); `contain` confirmed → **136/136** local y pública.

## 4. Evidencias
- Antes (10 capturas, estado roto): `docs/audit/imagenes/antes-*.png` (1440×900).
- Después: `docs/audit/imagenes/despues-*-1440x900.png` y `despues-*-1920x1080.png` — E03/E07/E15/E25 con póster completo + escenas E04/E06/E16 sin duplicar.

## 5. Recursos por capas que necesitamos de ustedes (BLOQUE C del auditor)
Por escena, en WebP/AVIF de fondo + PNG/WebP alfa de primer plano + SVG de mapas, **sin textos ni botones incrustados** (todo texto/CTA será HTML nuestro), conservando personajes/gatos/logos aprobados sin reilustrar:
1. **E07 (P0-02):** fondo de oficina/luz con hologramas sin texto; mujer protagonista y mascota en capa alfa separada; pipeline como DOM/SVG nuestro. Variante panorámica + vertical específica.
2. **E03 (P0-03):** centro de datos estilizado sin rótulos; hombre, robot señalando y gatita tricolor en capas; los **dos servidores con símbolo Ciudadan** aislados; anillos en capas. Variante vertical. (La infraestructura ilustrada no se presentará como foto de instalaciones reales.)
3. **E25 (P0-04):** no hace falta otro póster — usamos la P 3D real + los 8 iconos del hero como objetos; como máximo, halo/elementos decorativos transparentes de color violeta.
4. **E15 (P0-05):** paisaje sustentable autónomo sin rótulos; hombre elegante + mujer creativa + gato en primer plano separados; **mapa GeoNodos como SVG animable nuestro** (el mapa por scroll debe funcionar sin la ilustración); versión vertical diseñada (no el póster horizontal comprimido).
5. **A01 (E00/E02):** túnel prismático limpio sin texto (placeholder procedural actual como respaldo).
6. **A06/A08/A09:** según prioridad de escenas E26/E22/E27.

## 6. Matriz de paridad pendiente (BLOQUE D)
Capturas con scroll 0/25/50/75/100% en 1366×768, 1440×900, 1920×1080, 2560×1440, 3440×1440 y 390×844 para hero + 3 llegadas — se ejecuta al cerrar el parche (hoy: 1440×900 y 1920×1080 de las 4 llegadas ✔ en `docs/audit/imagenes/`).
