# PUBLIA 7 Mundos — Entrega bloque 7M-F «Orden de ejecución cerrada»

- Rama: `feature/publia-6-frontend` · base verificada `e16a1065…` (igual a HEAD al iniciar) · tag de recuperación creado antes de tocar nada.
- Rango 7M-F: `9e562e9` … `66d36d5` (10 commits). Producción `publia.mx` intacta; despliegue sólo en staging (`https://dam-boulevard-explaining-alaska.trycloudflare.com`, sirve `dist/` en vivo).
- Texto comercial: 100 % literal desde `copy.es-MX.json` (generado a `src/data/copy7mf.ts` con `as const`; DSH no redactó ni parafraseó nada).
- Sin frameworks nuevos, sin iframes, sin canvas extra: se reutiliza Three.js + GSAP/ScrollTrigger existentes. Sin símbolo ®.

## Qué cambió (por fase, con commit)

| Fase | Commit(s) | Contenido |
|---|---|---|
| Hero §5 | `9e562e9` | 2 CTA con texto literal (`hero.routeEnterprise` / `hero.routeEfficiency`); 8 chips trasladados a E30 bajo `hero.more`; toggle «Explorar todo» al final de E29 con `hero.exploreAll`; eliminados `.hero__controls` y pista de scroll; preloader localizado en el área 3D (isotipo + `hero.loading`, pulso 1.4 s, fuera tras 1.er frame / error / 8 s); `hero.skip` por teclado; pin único ScrollTrigger (`pin:true`, `scrub:0.6`, `+=1.8*vh`, ≥1024 desktop sin reduced-motion) con timeline normalizada sobre el parámetro de fragmentación existente y desplazamiento vertical limitado de los CTA; Pubix sigue el puntero (`pointer:fine`, yaw ±0.12 / pitch ±0.06 amortiguado); elegir ruta durante el pin lo cancela |
| Umbral + simulador §6 | `0610d14`, `a6ee043` | E00 con módulo `umbral`: textos literales, paisaje `ecoaldea_red_productiva.png` + caption conceptual, `beneficios.svg`, simulador exacto (`total = tareas×min/60`, `abordables = total×(porción/100)×(adopción/100)`; defaults 65/18/40/55 → **19,5 h / 4,3 h** es-MX 1 decimal; 0→0; inválido→`simulator.error` sin cifra; reset; `aria-live` debounce 300 ms; fórmula y nota literales) y 4 `<details>` de `umbral.panels` |
| E03 infraestructura §7 | `b3aae52` | 4 escenarios desde `infra.modes` (`local-private` por defecto, `local-collaborative`, `managed-housing`, `distributed-network`) con los SVG vectoriales trusted inline (IDs conservados, `aria-hidden`, uno visible, superficie 16:9 `#101a35`, caption fuera, crossfade 180 ms), selector `aria-pressed`, animaciones dashoffset por modo (2.8 s / 3.6 s / 3 s / 4 s + ciclo 8 s distribuido), pausa con IO + `visibilitychange`, fuera «Activar red» y contador de tráfico, CTA WhatsApp con `contact.infraMessage` (`{label}`); **migración** de `state.infra` por significado (`ia_privada→local-private`, `housing→managed-housing`, `red_distribuida→distributed-network`, desconocido→`local-private`); `housingMode` separado; comparación compartida/privada queda sólo en E22 |
| Copy / E25 / contacto §8–9 | `6ef2e5f` | E25: selector de 8 `ecosystem.families` (inicial `ia`; órbita mapeada por significado; sin «Activar ecosistema»), modo + 4 pasos + resultado literales, CTA `ecosystem.cta` → `contact.ecosystemMessage`. E27: 5 planes desde `memberships.plans` (300 / 550 / 2.000 / 3.000 / 4.000 MXN/mes; 550 = propuesta de staging, no contractual), «Ver alcance» como `<details>`, CTA → `planMessage`, bloque de extras. E30: CTA único WhatsApp `https://wa.me/525573724660?text=…`, módulo knowledge con 2 paneles, formulario (nombre req 100 / negocio opt 150 → «Sin especificar» / necesidad req 1000, maxlength + contadores, nunca afirma envío, enlace real con `formMessage`). E11/E22/E23/E24 textos desde el JSON |
| QA + fixes | `9e93ebf`, `a5ba3ec`, `c5377c4`, `7b2428e`, `66d36d5` | `scripts/qa.mjs` reescrito a los checks 7M-F (233 criterios); `goBack`/`returnToHero` cancelan el pin; landmark duplicado en E30 corregido; slot A01 retirado (sus webp nunca existieron → 404 en preload); `/favicon.ico` servido (200) |

## Assets 7M-F

Copiados bajo `public/assets/publia-7mf/` (y los SVG además en `src/assets/7mf/` para import `?raw` inline): `ecoaldea_red_productiva.png`, `beneficios.svg`, `infra_local_privada.svg`, `infra_local_colaborativa.svg`, `infra_housing.svg`, `infra_distribuida.svg`. **A04 no se usó como fondo del panel de E03** (archivo conservado). E11 conserva su imagen humana existente → **no** se registra `E11-arte: pendiente`.

## Verificación ejecutada ahora (no heredada)

- `npm test`: 19/19 · `npm run build`: OK · `tsc --noEmit`: OK.
- QA automatizado contra staging (`scripts/qa.mjs`, Playwright + axe): **233/233 criterios** — ver `docs/evidencia/resultados-qa.json` (regenerado en la corrida final). Incluye: exactamente 2 CTA en hero; teclado/enlaces sin WebGL; 4 modos de E03 con persistencia + migración; casos matemáticos del simulador (19,5/4,3; 0→0; 100/100→total; inválido→error; reset); enlaces WhatsApp `wa.me/525573724660` con mensajes literales; precios idénticos tarjeta/resumen/export; matriz de viewports 390×844, 768×1024, 1366×768, 1440×900, 1920×1080, 3440×1440 sin overflow horizontal; axe wcag2aa 0 violaciones; reduced-motion; consola sin errores (incl. 0 404).
- Capturas identificadas por viewport/escena/commit: `docs/audit/7mundos/7mf-01…09-*.png` (1440×900, commit `66d36d5`).
- Videos continuos de ruta: `docs/audit/video/7mf-ruta-empresa.webm`, `7mf-ruta-eficiencia.webm`, `7mf-ruta-scroll.webm`.
- LCP/CLS medidos sólo en laboratorio (headless swiftshader, ~2 FPS): no son métrica de producción.
- **DSH no afirma aprobación visual**: las capturas son evidencia para revisión humana.

## Pendientes declarados

- `E11-arte`: **no aplica** (imagen humana existente conservada).
- A04 no usado en E03 (regla 7M-F); archivo retenido.
- Slot A01 «túnel prismático»: nunca se entregó archivo (ni avif ni webp en el historial) → slot retirado sin 404; si llega arte, se reactiva el registro.
- Número de bot 55 37 13 04 93 **no** incorporado (fuera de alcance 7M-F).
- Precio Agente $550 es propuesta de staging, no contractual.

## Estado

- `git ls-remote github feature/publia-6-frontend` == HEAD local (`66d36d5` + commit QA final tras la corrida verde).
- Staging responde 200 y sirve el build 7M-F.
