# Publia 6.0 — Mapa narrativo

Cada escena se documenta con: identificador, ruta, propósito, mensaje,
producto asociado, interacción, animación, estado de entrada, estado de
salida y destino.

Las rutas: **E** = empresa · **F** = eficiencia · **X** = exploración ·
**C** = compartida.

---

## 1. Escenas de la primera entrega

### `hero` — El mundo está cambiando
- **Ruta:** transversal (entrada)
- **Propósito:** abrir con impacto y ofrecer dos decisiones, sin mencionar la
  tercera.
- **Mensaje:** «EL MUNDO ESTÁ CAMBIANDO. / Tu negocio también puede cambiar las
  reglas.»
- **Producto:** ninguno (marca).
- **Interacción:** dos CTA (`SOY UNA GRAN EMPRESA, O ESTOY EN CAMINO DE SERLO` →
  ruta E; `QUIERO HACER MÁS CON MENOS` → ruta F). Pointer con parallax.
- **Animación:** prisma con movimiento en X/Y/Z; entrada tipográfica; línea de
  scroll discreta.
- **Estado de entrada:** `unclassified`.
- **Estado de salida:** `enterprise` o `efficiency` (por clic) o `explorer`
  (si el visitante sigue el scroll).
- **Destino:** `#ruta-empresa`, `#ruta-eficiencia` o `#ruta-exploracion`.

### `empresa` — Ya tienes mucho construido
- **Ruta:** E
- **Propósito:** hablar de control y soberanía sin imponer una estructura cooperativa.
- **Mensaje:** «YA TIENES MUCHO CONSTRUIDO. / AHORA HAZ QUE TU TECNOLOGÍA
  TRABAJE A TU FAVOR.»
- **Producto:** IA soberana · agentes · integración CRM/ERP · red cooperativa ·
  infraestructura dedicada · club de empresarios · capacitación de equipos.
- **Interacción:** CTA a la escena compartida; botón «Cambiar de ruta».
- **Animación:** paleta grafito metálico; el prisma reduce su velocidad de giro
  y se orienta en X.
- **Estado de entrada:** `enterprise` (o `unclassified` + inferencia
  `existing`, `advanced`).
- **Estado de salida:** escena compartida con variante «empresa».
- **Destino:** `#escena-compartida`.

### `eficiencia` — Hacer más no siempre significa gastar más
- **Ruta:** F
- **Propósito:** mostrar la operación integrada y abrir la conversación de
  membresías sin mostrar precios de golpe.
- **Mensaje:** «HACER MÁS NO SIEMPRE SIGNIFICA GASTAR MÁS.»
- **Producto:** sitio · chatbot · agente personal · redes · contenido con IA ·
  soporte humano · automatización · housing · infraestructura compartida.
- **Interacción:** CTA a la escena compartida; botón «Cambiar de ruta».
- **Animación:** paleta ámbar; el prisma acelera y se inclina en Z.
- **Estado de entrada:** `efficiency` (rasgo inferido `value_driven`).
- **Estado de salida:** escena compartida con variante «eficiencia».
- **Destino:** `#escena-compartida`.

### `exploracion` — Todo el mundo quiere venderte algo
- **Ruta:** X (también implícita)
- **Propósito:** invertir la relación comercial y bifurcar entre creación y
  ayuda.
- **Mensaje:** «TODO EL MUNDO QUIERE VENDERTE ALGO. / NOSOTROS QUEREMOS
  CONOCERTE.»
- **Producto:** cooperación · Ciudadan · cooperativismo 6.0 · infraestructura
  compartida · Laborys · publicidad no invasiva · servicios · membresías.
- **Interacción:** visible por scroll sin decisión previa; dos caminos
  (crear / necesitar ayuda) en Fase 3; botón «Cambiar de ruta».
- **Animación:** paleta verde azulado; el prisma se abre y cambia de eje.
- **Estado de entrada:** `unclassified` → `explorer` por scroll; o `explorer`
  explícito en Fase 3.
- **Estado de salida:** escena compartida con variante «exploración».
- **Destino:** `#escena-compartida`.

### `escena-compartida` — Lo que ya tienes
- **Ruta:** C
- **Propósito:** escena adaptativa: el mismo bloque lee el estado y cambia
  mensaje, producto y énfasis.
- **Mensaje:** por ruta — E: «ACTIVOS DIGITALES, CONTROL TOTAL.» · F: «CONECTA
  LO QUE YA FUNCIONA.» · X: «HAY OTRA FORMA DE ORGANIZAR EL TRABAJO, LA
  TECNOLOGÍA Y EL VALOR.»
- **Producto:** activos · agentes · nodos; en X, Ciudadan y cooperativas.
- **Interacción:** CTA «Vamos a conocernos».
- **Animación:** la paleta y el prisma ya vienen de la ruta; la escena sólo
  cambia su contenido.
- **Estado de entrada:** cualquier ruta.
- **Estado de salida:** escena de cierre.
- **Destino:** `#escena-cierre`.

### `escena-cierre` — Vamos a conocernos
- **Ruta:** C
- **Propósito:** convertir sin presionar y sin pedir datos durante la
  exploración.
- **Mensaje:** «CUENTANOS QUÉ QUIERES CAMBIAR.»
- **Producto:** asesoría · diagnóstico · ruta de implementación.
- **Interacción:** CTA «Solicitar diagnóstico» (formulario en Fase 4).
- **Animación:** entrada suave, sin prisma competido.
- **Estado de entrada:** cualquier ruta.
- **Estado de salida:** formulario (Fase 4).
- **Destino:** `#contacto`.

---

## 2. Escenas planificadas (Fases 3–4, no implementadas aún)

| ID | Ruta | Propósito | Mensaje ancla | Producto | Interacción | Animación | Entrada → Salida | Destino |
|---|---|---|---|---|---|---|---|---|
| `empresa-sociedad` | E | Red de especialistas sin estructura cooperativa obligatoria | «Una red de especialistas, desarrolladores, mentores, becarios y agentes de IA a tu disposición.» | Red de desarrollo · club de empresarios | Ver casos | Prism en Y, luz frontal | E → común | `escena-compartida` |
| `empresa-soberania` | E | Datos bajo control e infraestructura exclusiva | «Tus datos siguen siendo tuyos.» | IA privada · modelos locales · trazabilidad | Alternar exclusiva/compartida | Contraste metálico | E → común | `empresa-sociedad` |
| `eficiencia-operacion` | F | Demostrar cómo las piezas se conectan | «Herramientas dispersas, una sola operación.» | Chatbot · agente · redes · contenido · soporte | Encadenar piezas | Ensamblaje en Z | F → común | `escena-compartida` |
| `eficiencia-membresias` | F | Introducir membresías sin volcar precios | «Empieza por la operación, no por el precio.» | Membresías | Comparador | Subida escalonada | F → común | `membresias` |
| `exploracion-crear` | X | Ruta de creación y cooperación | «NO TIENES QUE CONSTRUIRLO TODO EN SOLITARIO.» | Ciudadan · cooperativas · Laborys | Elegir crear | Prism se abre | X → común | `escena-compartida` |
| `exploracion-ayuda` | X | Ruta de ayuda y crecimiento | «NECESITO AYUDA PARA HACER CRECER MI NEGOCIO.» | Servicios · membresías · asesoría | Elegir ayuda | Enfoque estable | X → común | `escena-compartida` |
| `personas` | C | Humanizar la red | «Personas detrás de la tecnología.» | Becarios · mentores · especialistas | Perfiles | Retrato tipográfico | común → común | `escena-compartida` |
| `infraestructura` | C | Nodos e infraestructura abierta | «Más inteligencia. Menos dependencia de infraestructuras concentradas.» | Housing · modelos locales | Nodo compartido vs privado | Distribución de puntos | común → `housing` | `escena-compartida` |
| `publicidad` | C | Publicidad no invasiva | «Otra forma de hacer publicidad.» | Laborys · estudio comparativo | Ver diferencia | Banner que no interrumpe | común → común | `escena-cierre` |
| `conectados` | C | Ciudadan y economía del ecosistema | «Conectados.» | Cooperativas · marketplace · comercio entre organizaciones | Mapa de nodos | Enlace de nodos | común → común | `escena-cierre` |

## 3. Reglas de transición

1. Cada CTA desplaza **dentro de la misma página**; nunca hay tres sitios.
2. Cambiar de ruta reordena el tono (paleta, prisma, copy), nunca rompe el
  scroll ni oculta contenido informativo.
3. El scroll natural siempre ofrece un camino: si nadie pulsa nada, la ruta
   `explorer` se activa al llegar a su escena.
4. Volver atrás es posible («Cambiar de ruta») y reinicia el estado a
   `unclassified` sin recargar.
5. Ninguna escena pide datos personales; la captura ocurre al final
   (Fase 4) y con el contexto de navegación ya elegido.
