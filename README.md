# Publia 6.0 — Frontend narrativo

Frontend nuevo de Publia (publia.mx): experiencia inmersiva, comercial y
progresivamente personalizada, construida con Astro, GSAP/ScrollTrigger y
Three.js sobre el motivo visual **EL PRISMA**.

No sustituye de golpe al WordPress existente: convive con él como CMS
headless opcional y catálogo heredado, mientras la experiencia nueva se
desarrolla y se revisa por fases.

## Documentación

| Documento | Contenido |
|---|---|
| [`docs/PUBLIA-AUDITORIA.md`](docs/PUBLIA-AUDITORIA.md) | Inventario del WordPress, riesgos, arquitectura propuesta y decisiones pendientes |
| [`docs/PUBLIA-ARQUITECTURA.md`](docs/PUBLIA-ARQUITECTURA.md) | Stack, estructura, motor de estado, 3D, movimiento, integraciones, rendimiento y accesibilidad |
| [`docs/PUBLIA-MAPA-NARRATIVO.md`](docs/PUBLIA-MAPA-NARRATIVO.md) | Escena por escena: propósito, mensaje, producto, interacción, animación, estados y destino |
| [`docs/PUBLIA-CATALOGO.md`](docs/PUBLIA-CATALOGO.md) | Membresías, housing, capacitación, asesoría, complementos, cooperativas y reglas de promesa |
| [`docs/PUBLIA-RECURSOS.md`](docs/PUBLIA-RECURSOS.md) | Activos reutilizables, faltantes y manifiesto de recursos |
| [`docs/PUBLIA-ESTADO.md`](docs/PUBLIA-ESTADO.md) | Estado de fases, criterios verificados, comandos, problemas y riesgos |

## Comandos

```bash
npm install          # Node ≥ 20.3
npm run dev          # http://127.0.0.1:4321
npm run build        # salida estática en dist/
npm run preview      # http://127.0.0.1:4322
npm run check        # TypeScript estricto
npm run sync:content # snapshot del REST de WordPress → src/data/content.snapshot.json
```

## Estructura

```text
src/
├─ layouts/       BaseLayout (metadatos, OG, JSON-LD)
├─ pages/         index.astro
├─ components/
│  ├─ experience/ Hero, SceneBlock
│  ├─ three/      PrismLayer (+ respaldo SVG)
│  └─ ui/         Nav
├─ lib/
│  ├─ experience/ state.ts · scenes.ts · events.ts
│  ├─ three/      prism.ts
│  └─ integrations/ wordpress.ts
├─ data/          copy.ts · catalog.ts · content.snapshot.json
├─ scripts/       experience.ts
└─ styles/        tokens.css · global.css
```

## Reglas

- El contenido comercial vive en `src/data`, la lógica de navegación en
  `src/lib/experience`, la representación en `src/components` y las
  integraciones en `src/lib/integrations`.
- No se inventa información comercial: lo no confirmado se modela como `null`
  y se declara como pendiente.
- `npm run build` debe terminar sin errores antes de cada entrega.
- Nada de despliegue a producción sin aprobación humana.
