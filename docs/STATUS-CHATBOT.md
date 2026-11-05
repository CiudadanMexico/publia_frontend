# STATUS CHATBOT PUBLIA.mx — para revisión del orquestador central

Fecha: 2026-11-05 · Rama: `feature/publia-6-frontend` @ `0dd9d2c` · Staging: https://kitty-midi-grid-liked.trycloudflare.com · **Producción publia.mx (WordPress) intacta — sin cambios.**

## 1. Qué es hoy el "chatbot" en lo que tenemos montado
Este repo (`publia-frontend`, Astro 5) es el **sitio de marketing/experiencia** en staging. El chatbot aparece en tres formas, todas consistentes:

1. **Producto comercial (datos validados):** catálogo de servicios y membresías tomado del snapshot WordPress validado (`src/data/content.snapshot.json` → `src/data/services/index.ts`, `src/data/memberships/index.ts`).
2. **Demo interactiva (simulación etiquetada):** `FlowDemo` en E07/E09 — pipeline consulta → clasificación/agente → persona → seguimiento, con foco seleccionable (mensajes/contenido/ventas/operación); guarda `answers.foco` en sesión; etiquetado «simulación conceptual». Escena E08 muestra una conversación de ejemplo estilo WhatsApp con derivación a humano.
3. **Contacto real:** WhatsApp `https://wa.me/525573724660` (etiqueta «55 73 72 46 60») y correo `hola@publia.mx`; el formulario es contextual vía `mailto:` — **la captura server-side del formulario está pendiente (P1-4)**.

**No hay widget de chatbot en vivo ni llamadas a API de chatbot en este frontend.** La demo es DOM/SVG + estado de sesión, deliberadamente marcada como simulación.

## 2. Oferta comercial (precios del snapshot validado, MXN — no inventados)
| Producto | Precio | Estado |
|---|---|---|
| Chatbots inteligentes | $200 (inicial) | publicable |
| Chatbots semiinteligentes | $200 | publicable |
| Chatbots WhatsApp + Messenger | $200 | publicable |
| **BASE** (membresía) | $300/mes | incluye hosting WordPress/WooCommerce + **chatbot de WhatsApp orientado a clientes** + integración al sitio; configuración inicial cotizada aparte; **no incluye agente personal** |
| AGENTE | $500–600/mes | **precio pendiente de confirmar** (rango tentativo, no publicado) |
| CRECIMIENTO | $2 000/mes | BASE + agente personal + chatbot con **derivación a varios humanos** + 2–3 redes + ~8 piezas/mes |
| OPERACIÓN | $3 000/mes | + operación extendida (sin prometer "≈4 h/día") |
| COBERTURA | $4 000/mes | ventana humana 9:00–18:00 |

Distinción de copy protegida: **«chatbot ≠ agente»** — el chatbot clasifica y deriva; el agente investiga/actúa con aprobación humana explícita (`docs/PUBLIA-CATALOGO.md`). No se publican «IA ilimitada», ahorros garantizados ni métricas ficticias.

## 3. Infraestructura declarada (fuera de este repo — por confirmar con infraestructura)
- Producción: WordPress en publia.mx (fuente del snapshot; no tocado).
- Hosting: el que vende BASE (WordPress/WooCommerce administrado); housing = servidores administrados (opciones compartida 50/25/25 o privada, explicadas en E21/E22).
- Consumo de IA declarado en catálogo: «API propia, Laborys si el servicio lo permite o modelos gratuitos».
- **No verificado desde este repo:** WhatsApp Business API / app de Meta, webhook, modelo LLM usado, hosting del bot, colas y derivación. El orquestador debe confirmar esos componentes en su inventario real.

## 4. Dónde vive en el código (staging)
- `src/data/services/index.ts` — servicios chatbot (familia `ia`).
- `src/data/memberships/index.ts` — BASE/CRECIMIENTO incluyen chatbot; AGENTE = agente personal.
- `src/components/experience/modules/FlowDemo.astro` + `src/lib/experience/` (`bindDemos`, evento `demo_flujo_foco`, `answers.foco`).
- Escenas: E07/E08/E09 (ruta eficiencia), E11 (escalación humano), E29 (recomendación según foco).
- QA: 136/136 (incluye demo de flujo funcional, foco persistido, axe limpio) · unit 15/15.

## 5. Evolución (commits)
`a41f983` datos (catálogo + membresías) → `3ec052f` escenas E00–E30 → `94967e6` formulario contextual + WhatsApp + axe → `4a40523` tests de catálogo → `b8eb9ab` P0 → `182be03` v3 (FlowDemo + español natural) → `5e89f1e` portal P0-01 → `4950064` V4-A mundos → `6f5078f` V4-B imágenes AVIF + cierre personalizado → `0dd9d2c` auditoría de imágenes.

## 6. Pendientes abiertos (para el orquestador)
1. P1-4: captura server-side del formulario (hoy `mailto:`).
2. Precio AGENTE confirmado (hoy rango 500–600 no publicado).
3. Infra real del bot (Meta/WA Business, webhook, modelo, hosting) — fuera de este repo.
4. D5: diagnóstico compartido con recomendación por respuestas (parcial: E29 ya recomienda por ruta+foco).
5. Capas de imágenes P0-02..05 por separado (sin texto incrustado) — en producción con el equipo gráfico.
