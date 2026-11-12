# PUBLIA 7 Mundos — Auditoría y restauración 7M-G (informe de hechos)

> DSH reporta hechos medidos; no afirma aprobación visual. La aprobación corresponde al bloque.

- Rama: `feature/publia-6-frontend` · staging: `https://dam-boulevard-explaining-alaska.trycloudflare.com` (sirve `dist/` en vivo)
- Punto de recuperación creado antes de editar: tag `recovery/pre-7mg` (= `4ae71d7`, fin de 7M-F en verde).
- QA automatizado: **242/242 criterios verificados** (`scripts/qa.mjs`, última corrida en verde).
- Pruebas unitarias: 19/19. `tsc --noEmit` limpio. Build OK.

## Restaurado (lo que 7M-G ordenó recuperar)

1. **Hero con pin largo**: un único pin de `18×H` (medido: span = 16200 px a H=900), `invalidateOnRefresh`, scrub 0.6 dentro del ScrollTrigger, timeline 0–0.12 subida a `yNear`, 0.12–0.22 descenso a `yLow` (power3.out), hold con 4 momentos de cámara/prisma, 0.70–0.88 apertura del umbral, 0.88–1 salida. Rebote medido en coordenadas del hero: CTA a **104 px** (topNear) en p=0.12 y a **558 px** (topLow) en p=0.25 (drop 454 px). Click de ruta cancela el pin; scroll inverso revierte (verificado en QA y en video).
2. **E00 umbral layout dedicado** `umbral` a ancho completo (`min(calc(100% - 2*clamp(20px,4vw,76px)),1440px)`), paleta crema, tinta `#091933`, simulador con inputs blancos (no vidrio oscuro), beneficios tipográficos 01–04 (SVG retirado), fórmula en `<details>` «Cómo se calcula».
3. **E27 membresías**: estructura completa (5 selectores + Ver alcance + panel de detalle + diagnóstico de 2 preguntas con textos exactos de la orden). Selector selecciona y persiste sin abrir WhatsApp; CTA aparte «Conversar sobre este plan». Diagnóstico con badge que no pisa la selección; rama Housing → E22 sin auto-elegir cobertura.
4. **E03 infraestructura**: `art:'A04'` retirado sólo del wrapper de E03; stage nativo restaurado (10 racks + núcleo + mapa); los 4 SVG como `<details>` «Ver esquema de conexiones»; modo local-colaborativo con etiqueta HTML «Servicio compartido autorizado»; sin «Activar red» ni contador.
5. **E25 ecosistema**: 9 familias (Ecología restaurada en nodo 6 con textos definitivos de la orden, en `src/data/copy7mg.ts`); órbita ligada al progreso de scroll (reversible).
6. **Contrato de carga**: `data-load-state`/`aria-busy` en la superficie 3D, fondo por tono desde el primer frame, loader HTML, watchdog 8 s → fallback «La escena está tardando…» + «Reintentar escena», error duro con mensaje propio, token de generación, prewarm a 600 px, pausa fuera de viewport.
7. **Contacto/cierre**: waform valida click y submit; WhatsApp del cierre incorpora el resumen visible con prefijos «Plan de interés:», «Área de interés:», «Infraestructura:», «Housing:» (los no elegidos se omiten), recalculado en cada cambio de estado. Catálogos de E23/E24 como listas compactas dentro de los paneles de conocimiento.

## Conservado de 7M-F (sin revert)

Copy generado (`COPY_7MF`), fórmula del simulador, fixes de 404, migración de estado, enlaces WA válidos, dos rutas del hero + acceso por scroll, sin controles de depuración, sin tercer botón de marketing.

## Pendiente

Nada bloqueante. Nota operativa: bajo swiftshader (2 FPS) el watchdog de 8 s puede mostrar el estado `fallback` en cargas frías; en hardware real con WebGL el estado `ready` se alcanza antes (verificado: `loadState: ready` en la mayoría de las capturas acreditadas).

## Evidencia

- Capturas acreditadas (PNG + sidecar JSON con escena, rect, opacidad, estado de carga, título y ruta): `docs/audit/7mundos/7mg-{390x844,768x1024,1366x768,1440x900,1920x1080}-{E01,E00,E03,E25,E27}*` (E03/E27 además bajo ruta Empresa).
- Videos de scroll real continuo (empresa / eficiencia / libre con pin completo de 18 pantallas + reversión): `.tmp-vids/7mg-empresa/`, `.tmp-vids/7mg-eficiencia/`, `.tmp-vids/7mg-libre-pin/` (en disco; gitignored por política de videos).
- QA: `QA_BASE=<staging> node scripts/qa.mjs` → 242/242.
