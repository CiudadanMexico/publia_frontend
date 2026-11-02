# Publia 6.0 — Estado de la entrega

Fecha: 2026-11-02 · Rama: `feature/publia-6-frontend` · Base: `main`

## 1. Qué se entrega ahora

**Fase 0 (auditoría) + Fase 1 (fundación Astro) + Fase 2 (hero funcional) +
un tramo mínimo de Fase 3 (una escena propia por ruta y una escena compartida
adaptativa).**

| Entregable | Estado |
|---|---|
| `docs/PUBLIA-AUDITORIA.md` | ✅ completo |
| `docs/PUBLIA-ARQUITECTURA.md` | ✅ completo |
| `docs/PUBLIA-MAPA-NARRATIVO.md` | ✅ completo (escenas implementadas + escenas planificadas) |
| `docs/PUBLIA-CATALOGO.md` | ✅ completo |
| `docs/PUBLIA-RECURSOS.md` | ✅ completo |
| `docs/PUBLIA-ESTADO.md` | ✅ este documento |
| Fundación Astro + tokens + layout + componentes | ✅ |
| Motor de estados y navegación entre escenas | ✅ |
| Hero con prisma 3D, dos CTA y ruta implícita por scroll | ✅ |
| Adaptador headless de WordPress + snapshot real (60 páginas, 20 productos) | ✅ |
| Catálogo en pantalla (membresías, housing, servicios, cooperativas) | ⏳ Fase 4 |
| Páginas de detalle (SEO) | ⏳ Fase 4 |
| Formulario de conversión | ⏳ Fase 4 (requiere correo de contacto real) |
| Assets finales de marca | ⏳ Fase 5 |

## 2. Criterios de aceptación de la primera entrega

Verificados con Chromium headless (Playwright) sobre `npm run preview`:

| # | Criterio | Resultado |
|---|---|---|
| 1 | Abrir el frontend en entorno local | ✅ `npm run dev` (4321) / `npm run preview` (4322) |
| 2 | Hero visualmente trabajado | ✅ título 126 px, dos CTA de 74 px de alto, prisma pintando 17,3 % del viewport |
| 3 | Movimiento 3D real sobre varios ejes | ✅ prisma con rotación X/Y/Z, cámara y facetas; dos capturas consecutivas difieren (animación activa) |
| 4 | Elegir la ruta empresarial | ✅ `html[data-route=enterprise]`, escena propia visible, paleta grafito |
| 5 | Elegir la ruta eficiencia | ✅ `html[data-route=efficiency]`, escena propia visible, paleta ámbar |
| 6 | Descubrir la ruta exploratoria por scroll | ✅ al llegar a su escena se activa `explorer` sin ningún clic |
| 7 | Llegar a una escena compartida | ✅ `escena-compartida` con variantes por ruta |
| 8 | El contenido cambia según la ruta | ✅ tres textos distintos verificados («ACTIVOS DIGITALES…», «CONECTA LO QUE…», «HAY OTRA FORMA…») |
| 9 | Regresar y cambiar de elección | ✅ «Cambiar de ruta» reinicia a `unclassified` y vuelve al hero |
| 10 | Navegar en móvil | ✅ 390×844 sin desbordamiento horizontal; CTA operativos |
| 11 | Movimiento reducido | ✅ `prefers-reduced-motion` sin bucle de animación y contenido visible |
| 12 | Compilación de producción sin errores | ✅ `npm run build` → 1 página + sitemap, sin errores |

**Resultado de la suite: 18/18 comprobaciones correctas**
(evidencia en `docs/evidencia/`, resultados en `docs/evidencia/resultados-qa.json`).

## 3. Comandos

```bash
npm install          # dependencias (Node ≥ 20.3)
npm run dev          # desarrollo en http://127.0.0.1:4321
npm run build        # compilación estática en dist/
npm run preview      # sirve dist/ en http://127.0.0.1:4322
npm run check        # Astro Check (TypeScript estricto)
npm run sync:content # regenera el snapshot desde el REST de WordPress
```

Sincronizar contenido contra la copia aislada (desde el host del agente, con el
WordPress en `http://127.0.0.1:8080` dentro del contenedor):

```bash
WP_BASE_URL=http://127.0.0.1:8080 npm run sync:content
```

Suite de QA visual (requiere el Chromium de `.qa-tools`, fuera del proyecto):

```bash
cd /home/dsh-dany/workspace/.qa-tools
PLAYWRIGHT_BROWSERS_PATH=$PWD/browsers QA_BASE=http://127.0.0.1:4322 node qa.mjs
```

## 4. Archivos creados

```text
publia-frontend/
├─ astro.config.mjs · tsconfig.json · package.json · .gitignore · README.md
├─ scripts/sync-wordpress-content.mjs
├─ public/favicon.svg · public/og-publia-6.svg
├─ docs/PUBLIA-AUDITORIA.md · PUBLIA-ARQUITECTURA.md · PUBLIA-MAPA-NARRATIVO.md
│      PUBLIA-CATALOGO.md · PUBLIA-RECURSOS.md · PUBLIA-ESTADO.md
│      evidencia/01-hero-escritorio.png · 02-ruta-empresa.png · 03-ruta-eficiencia.png
│      evidencia/04-ruta-exploracion.png · 05-movil-hero.png · 06-movimiento-reducido.png
│      evidencia/resultados-qa.json
├─ src/layouts/BaseLayout.astro
├─ src/pages/index.astro
├─ src/components/experience/Hero.astro · SceneBlock.astro
├─ src/components/three/PrismLayer.astro
├─ src/components/ui/Nav.astro
├─ src/data/copy.ts · catalog.ts · content.snapshot.json
├─ src/lib/experience/state.ts · scenes.ts · events.ts
├─ src/lib/three/prism.ts
├─ src/lib/integrations/wordpress.ts
├─ src/scripts/experience.ts
└─ src/styles/tokens.css · global.css
```

## 5. Problemas encontrados y resueltos

| Problema | Causa | Resolución |
|---|---|---|
| El scroll suave se cancelaba al cambiar de ruta | El documento cambiaba de altura durante la animación (reflujo de layout) | `scrollTo()` espera dos frames y calcula la posición final; el reinicio usa scroll instantáneo |
| La ruta de exploración se activaba sola al reiniciar | El reflujo traía la escena a la vista y disparaba el evento de entrada | Comprobación determinista de viewport (`updateImplicitRoute`) con supresión tras el reinicio |
| `overflow-x: clip` en `html` rompía el desplazamiento vertical en Chromium | El root se convertía en contenedor de scroll | `overflow-x: hidden` en el root y `clip` en el body |
| La escena de exploración seguía visible al elegir empresa | Faltaba la regla de ocultación por ruta | Reglas CSS explícitas por `html[data-route]` |
| El runtime de React (224 kB) se descargaba sin usarse | La integración estaba activa sin ninguna isla | Integración desactivada hasta la Fase 4 |
| No había forma de medir el render 3D | `readPixels` sobre un búfer ya compuesto devuelve ceros | `preserveDrawingBuffer: true` + comparación de capturas |
| Sin navegador en el entorno para la evidencia visual | No hay Chromium ni sudo | Chromium de Playwright con librerías extraídas en espacio de usuario (sin tocar el sistema) |

## 6. Riesgos abiertos

1. **Memoria histórica no recuperada**: la consulta automática al consultor
   (`chatgpt-web/auto`) devolvió vacío. No se ha asumido ningún acuerdo
   histórico; las decisiones de esta entrega se limitan a lo explícito en la
   misión. Si existen acuerdos previos sobre tipos de letra, paleta o
   mensajes, hay que contrastarlos antes de la Fase 5.
2. **Correo de contacto**: no hay dirección propia en el contenido; el
   formulario de la Fase 4 la necesita.
3. **Catálogo heredado**: 20 servicios con precio y 20 colisiones de títulos
   por depurar antes de migrarlos.
4. **Tipografía de marca**: sin definir (hoy pila de sistema).
5. **Modelos 3D y fotografía final**: placeholders geométricos propios, a
   falta de los definitivos.
6. **Contenido incrustado con `localhost:6103`**: hay que sustituirlo al
   migrar.

## 7. Siguiente paso propuesto (no ejecutado)

**Fase 3 completa**: las dos bifurcaciones de la ruta de exploración («quiero
crear algo que valga más que su precio» / «necesito ayuda para hacer crecer mi
negocio»), la escena de personas detrás de la tecnología y las escenas
propias completas de empresa y eficiencia, con sus transiciones. Revisión
previa de esta entrega antes de seguir.

## 8. Notas de despliegue

- La salida es **estática** (`dist/`): sirve en cualquier hosting; no hay
  dependencias de servidor ni de WordPress en runtime.
- No se ha desplegado nada: **producción intacta** y sin autorización.
- La copia en el agente (`/workspace/publia/frontend`) es una copia de
  trabajo para el agente Cline; el repositorio Git local es la referencia.
