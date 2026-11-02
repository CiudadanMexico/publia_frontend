# Publia 6.0 — Mapa de escenas (E00–E30)

Fecha: 2026-11-02 · Fuente: `src/data/routes/scenes.ts` (30 escenas) + hero `E01`.

Cada escena es un nodo del grafo narrativo (`src/lib/experience/graph.ts`).
Las columnas **Ruta** y **Segmentos** gobiernan la visibilidad; **Etapa** gobierna el estado del escenario 3D; **Módulos** indican los componentes reutilizables que la componen.

## Leyenda

- **Ruta**: `shared` (visible en todas), `enterprise`, `efficiency`, `explorer`.
- **Segmentos**: rasgos que la escena exige (`enterprise`, `efficiency`, `explorer`, `cooperative`, `values`, `practical`, `beginner`, `growing`, `established`, `advanced`). `[]` = visible para cualquiera.
- **Etapa**: estado visual del escenario 3D (`abstract`, `enterprise`, `efficiency`, `explorer`, `cooperative`, `housing`, `convergence`).
- **Módulos**: `statement`, `split`, `features`, `network`, `tasks`, `conversation`, `escalation`, `contentFlow`, `coverage`, `branch`, `plans`, `services`, `comparison`, `distribution`, `catalog`, `cta`.

## Recorrido por actos

| Acto | Escenas | Idea |
|---|---|---|
| I · Apertura | E00–E02 | El mundo cambió; elige por dónde entrar. |
| II · Empresa | E03–E06 | Ya tienes mucho construido: el riesgo es que nada se conecte. |
| III · Eficiencia | E07–E12 | Hacer más con menos: asistente, tareas, escalamiento y cobertura. |
| IV · Exploración | E13–E15 | Todos te quieren vender; bifurcamos por valor o necesidad. |
| V · Ecosistema | E16–E22 | Ciudadan, cooperativas 6.0, impacto, red y tu propio nodo. |
| VI · Oferta | E23–E28 | Aprender, asesoría, comunicación, complementos, niveles y operación. |
| VII · Cierre | E29–E30 | Convergencia y contacto con contexto. |

## Tabla completa

| ID | Eyebrow | Título | Ruta | Segmentos | Módulos | Etapa | Transición | Datos | CTA |
|---|---|---|---|---|---|---|---|---|---|
| E00 | Publia 6.0 | Antes de empezar: qué es esto. | shared | — | statement | abstract | fade | — | — |
| E02 | Cambio de perspectiva | Elige por dónde quieres entrar. El resto se arma solo. | shared | — | statement | abstract | morph | — | — |
| E03 | Ruta empresa | Ya tienes mucho construido. El riesgo no es empezar: es que nada se conecte. | enterprise | enterprise, established, advanced | split | enterprise | rise | — | — |
| E04 | Ruta empresa | El control es tuyo. | enterprise | enterprise, established, advanced | features | enterprise | slide | — | — |
| E05 | Red humana | Una red de talento, no una plantilla de consultores. | shared | — | network | cooperative | scale | datos | — |
| E06 | Ruta empresa · Ruta eficiencia | Inteligencia en tus procesos, no en un chat aparte. | shared | enterprise, efficiency | tasks | efficiency | rise | datos | — |
| E07 | Ruta eficiencia | Hacer más con menos no es trabajar más rápido. Es dejar de repetirte. | efficiency | efficiency, practical, beginner, growing | split | efficiency | rise | — | — |
| E08 | Ruta eficiencia · Demostración | Tu negocio responde mientras tú atiendes lo importante. | efficiency | efficiency, practical, beginner, growing | conversation | efficiency | slide | datos | — |
| E09 | Ruta eficiencia · Demostración | Un chatbot responde. Un asistente avanza. | efficiency | efficiency, practical, growing, advanced | tasks | efficiency | slide | datos | — |
| E10 | Ruta eficiencia · Demostración | Tu negocio se mantiene activo sin que estés pegado al celular. | efficiency | efficiency, practical, growing | contentFlow | efficiency | rise | datos | — |
| E11 | Ruta eficiencia · Ruta empresa | Detrás de la IA hay personas. Y son una red, no unbuzz de atención. | shared | — | escalation | cooperative | scale | datos | — |
| E12 | Ruta eficiencia | La cobertura importa: no es más contenido, es más ventana. | efficiency | efficiency, practical, growing, established | coverage | efficiency | fade | datos | — |
| E13 | Exploración | Todos quieren venderte algo. | explorer | — | statement | explorer | morph | — | — |
| E14 | Exploración | Nosotros queremos conocerte. | explorer | — | branch | explorer | slide | datos | — |
| E15 | Exploración · Cooperativas | Otra forma de colaborar. | explorer | cooperative, values | split | cooperative | rise | — | — |
| E16 | Ecosistema | Ciudadan: la plataforma que da contexto al cooperativismo. | shared | — | split | cooperative | fade | — | — |
| E17 | Ecosistema · Cooperativas 6.0 | Cooperativas 6.0: herramientas para consume en común. | shared | — | features | cooperative | slide | — | — |
| E18 | Ecosistema · Economía | Una economía conectada, no una promesa de rendimiento. | shared | — | features | cooperative | fade | — | — |
| E19 | Ecosistema · Publicidad | Publicidad por elección, no por interrupción. | shared | — | split | convergence | slide | — | — |
| E20 | Ecosistema · Impacto | El cómputo también tiene una huella. | shared | — | statement | housing | morph | — | — |
| E21 | Ecosistema · Infraestructura | De un centro a una red. | shared | — | infrastructure | housing | scale | datos | — |
| E22 | Ecosistema · Housing | Tu propio nodo. | shared | — | distribution | housing | morph | datos | — |
| E23 | Productos · Capacitación | Aprende a usar lo que contrataste. | shared | — | catalog | efficiency | fade | datos | — |
| E24 | Productos · Asesoría | Antes de construir. | shared | — | catalog | efficiency | slide | datos | — |
| E25 | Productos · Comunicación | Tu comunicación también evoluciona. | shared | — | contentFlow | efficiency | rise | datos | — |
| E26 | Productos · Más allá de lo digital | Eventos, activaciones y producción con manos. | shared | — | catalog | convergence | fade | datos | — |
| E27 | Productos · Membresías | Encuentra tu nivel. | shared | — | plans | convergence | rise | datos | — |
| E28 | Productos · Servicios | Completa tu operación. | shared | — | catalog | convergence | slide | datos | — |
| E29 | Convergencia | Una misma esencia, distintas posibilidades. | shared | — | statement | convergence | morph | — | — |
| E30 | Conversión | Vamos a conocernos. | shared | — | cta | convergence | fade | — | CTA |

## Propósito por escena

- **E00 — Antes de empezar: qué es esto.**: Presentar el universo y el tono antes de pedir ninguna decisión.
- **E02 — Elige por dónde quieres entrar. El resto se arma solo.**: Traducir las dos decisiones del hero en un cambio de escena real.
- **E03 — Ya tienes mucho construido. El riesgo no es empezar: es que nada se conecte.**: Validar que la ruta empresarial habla de su realidad antes de proponer nada.
- **E04 — El control es tuyo.**: Marcar el diferenciador de Publia frente a una agencia clásica.
- **E05 — Una red de talento, no una plantilla de consultores.**: Humanizar el sistema y mostrar cómo se sostiene la calidad.
- **E06 — Inteligencia en tus procesos, no en un chat aparte.**: Pasar de la promesa de IA a una demostración de tareas reales.
- **E07 — Hacer más con menos no es trabajar más rápido. Es dejar de repetirte.**: Poner nombre al costo invisible de la operación manual.
- **E08 — Tu negocio responde mientras tú atiendes lo importante.**: Mostrar el producto funcionando, no descrito.
- **E09 — Un chatbot responde. Un asistente avanza.**: Separar con claridad chatbot de agente.
- **E10 — Tu negocio se mantiene activo sin que estés pegado al celular.**: Visualizar cómo se sostiene la presencia con una carga real.
- **E11 — Detrás de la IA hay personas. Y son una red, no unbuzz de atención.**: Cerrar el ciclo: la tecnología no sustituye a la red, la ordena.
- **E12 — La cobertura importa: no es más contenido, es más ventana.**: Explicar con honestidad la diferencia entre los dos niveles altos.
- **E13 — Todos quieren venderte algo.**: Romper el tono comercial habitual con una escena de alto impacto.
- **E14 — Nosotros queremos conocerte.**: Bifurcar la exploración sin imponer una tendencia al visitante.
- **E15 — Otra forma de colaborar.**: Introducir el modelo cooperativo con sus criterios concretos.
- **E16 — Ciudadan: la plataforma que da contexto al cooperativismo.**: Integrar Ciudadan donde corresponde, sin vender humo de plataforma.
- **E17 — Cooperativas 6.0: herramientas para consume en común.**: Mostrar el catálogo cooperativo con estados verificables, sin prometer lo que no existe.
- **E18 — Una economía conectada, no una promesa de rendimiento.**: Introducir la economía conectada con sus límites claros.
- **E19 — Publicidad por elección, no por interrupción.**: Contrastar publicidad invasiva y publicidad voluntaria con una escena propia.
- **E20 — El cómputo también tiene una huella.**: Meter la responsabilidad ambiental en la narrativa con peso y sin inventar cifras.
- **E21 — De un centro a una red.**: Visualizar la transformación de infraestructura centralizada a distribuida.
- **E22 — Tu propio nodo.**: Explicar Housing con el reparto real, sin inventar cifras financieras.
- **E23 — Aprende a usar lo que contrataste.**: Mostrar la capacitación como adopción, no como curso.
- **E24 — Antes de construir.**: Convertir la asesoría en el paso natural antes de cualquier compra grande.
- **E25 — Tu comunicación también evoluciona.**: Abrir la categoría de comunicación integral con su alcance real.
- **E26 — Eventos, activaciones y producción con manos.**: Mostrar la amplitud real del oferta sin mezclarlo con las membresías.
- **E27 — Encuentra tu nivel.**: Presentar el catálogo comercial sin ambigüedad.
- **E28 — Completa tu operación.**: Separar membresías de servicios y mostrar laamplitude del catálogo.
- **E29 — Una misma esencia, distintas posibilidades.**: Cerrar el relato con una convergencia visual y narrativa.
- **E30 — Vamos a conocernos.**: Convertir el recorrido en una acción concreta y medible.

## Notas de diseño

- E01 es el hero (no vive en el grafo de datos): su CTA dispara la elección de ruta y fija la escena en `E03` o `E07`.
- Las escenas compartidas (E00, E02, E05, E06, E11, E16–E28) reutilizan el mismo componente y **cambian su texto** según ruta o rasgos; el HTML inicial es la variante neutral.
- E13–E15 son propias de la ruta exploración; E03–E06 de empresa; E07–E12 de eficiencia. Las demás son comunes a las tres.
- E14 es la única bifurcación: elige rasgos (`value_driven` / `needs_help`) y salta a E15 o E24.
- E17–E19 mantienen su mensaje cooperativo y de impacto para las tres rutas (decisión de contenido del brief): la visión de red no se esconde detrás de una ruta.
- E30 cierra con un CTA de correo que ya incluye ruta y rasgos del visitante en el cuerpo del mensaje.
