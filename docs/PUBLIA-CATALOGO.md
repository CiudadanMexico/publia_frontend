# Publia 6.0 — Catálogo comercial

Fuente de verdad de los datos: `src/data/catalog.ts`. Este documento explica
las reglas con las que se modeló; el código las aplica.

## Reglas globales

1. Todos los precios en **pesos mexicanos**.
2. Todo paquete incluye una **asignación mensual de Laborys**, con cantidad
   **configurable y pendiente de confirmación**: el campo `laborysMonthly` es
   `null`, nunca un número inventado.
3. Los costos de **configuración inicial se cobran aparte** cuando
   corresponde, y se declara explícitamente.
4. No se inventan **garantías de respuesta**, **atención humana ilimitada** ni
   **capacidad de cómputo ilimitada**.
5. **Chatbot ≠ agente.** El chatbot clasifica y deriva; el agente investiga,
   redacta, organiza, analiza y ejecuta tareas autorizadas.
6. La disponibilidad del agente **no equivale** a capacidad de cómputo
   ilimitada, y el número de agentes no se limita artificialmente: los límites
   reales son hardware, concurrencia, almacenamiento, seguridad y configuración.
7. Lo que existe y lo que está en desarrollo se distinguen
   (`status: 'existente' | 'en-desarrollo' | 'planeado'`).

---

## 1. Membresías

| Plan | Precio | Núcleo | Condiciones declaradas |
|---|---|---|---|
| **BASE** | $300/mes | Hosting · WordPress o WooCommerce · chatbot de WhatsApp · integración con sitio existente o implementación inicial cotizada aparte | No incluye agente personal. Dominio aparte. Consumo de IA con API propia, Laborys si el servicio lo permite o modelos gratuitos. |
| **AGENTE** | objetivo $500–600/mes (sin precio cerrado) | Base + un agente personal para un usuario · investigar, redactar, organizar, analizar y ejecutar tareas autorizadas · integraciones según configuración | No es bolsa de horas artificial. El tiempo de respuesta varía con saturación y capacidad técnica. Sin recursos ilimitados. |
| **CRECIMIENTO** | $2 000/mes | Base + agente personal + chatbot con derivación a varios humanos del negocio · 2–3 redes · ~8 piezas de contenido con IA · programación, copys y adaptación básica | La producción humana especializada se cobra aparte. |
| **OPERACIÓN** | $3 000/mes | Lo anterior + presencia multicanal ampliada · ~12 piezas con IA · soporte humano de primer nivel con red de becarios capacitados | Disponibilidad humana compartida. No es un trabajador exclusivo. Sin ventana horaria publicada: la cobertura se define en COBERTURA. Bolsa limitada de atención efectiva, pendiente de fijar comercialmente. La IA clasifica; los casos humanos entran a cola. |
| **COBERTURA** | $4 000/mes | Todo lo de OPERACIÓN + cobertura organizada entre varios becarios de 9:00 a 18:00 según calendario | Atención efectiva limitada. No equivale a 9 h de trabajo humano exclusivo. La diferencia es la amplitud de la ventana, no más contenido. |

> **Distinción clave** entre OPERACIÓN y COBERTURA: cambia la **ventana de
> cobertura humana**, no el volumen de contenido.

### Presentación

- No se muestran todos los precios a la vez: la membresía se introduce tras
  la demostración de la operación (escena `E27`, «Encuentra tu nivel»).
- Cada tarjeta declara **incluye** y **no incluye** con el mismo peso visual.
- La comparación se apoya en la **composición de la operación**, no en una
  tabla de Checking.

---

## 2. Housing / Nodo Ciudadan

Producto de infraestructura, no un nivel superior de agentes.

**Hardware objetivo**

| Elemento | Valor | Estado |
|---|---|---|
| GPU | Tipo RTX 4060 | confirmado |
| RAM | 64 GB | confirmado |
| Resto | Por definir según inventario y costos | pendiente |

**Adquisición:** esquema de adquisición o financiamiento a **12 MSI** con
plazo de permanencia contractual. La propiedad del hardware, las condiciones de
salida y las licencias se definen contractualmente **antes** de publicar
promesas definitivas.

**Modalidad compartida** — mensualidad **$0**. El cliente aporta equipo,
espacio, electricidad e internet.

| Receptor | Asignación |
|---|---|
| Cliente | 50 % |
| Red de socios y becarios de la agencia responsable | 25 % |
| Usuarios con membresía del ecosistema | 25 % |

Incluye agentes, infraestructura administrada, herramientas open source
configuradas, una cantidad fija de Laborys mensuales y una pequeña comisión
variable por consumo de recursos compartidos.

**Modalidad privada** — mensualidad por uso exclusivo de la capacidad
contratada (precio por definir al dimensionar). No comparte recursos salvo
decisión voluntaria del cliente.

**Principios**

- El cliente puede ejecutar sistemas multiagente dentro de sus recursos.
- No se limita artificialmente el número de agentes por membresía.
- Se pueden usar: modelos locales, APIs propias, proveedores externos, modelos
  gratuitos, herramientas open source, aplicaciones propias y automatizaciones.
- La configuración inicial se cobra aparte.
- El cliente responde por la disponibilidad física de su equipo y sus agentes;
  la red compartida puede tener redundancia para sus usuarios.
- El software Ciudadan está sujeto a las condiciones de licencia y
  permanencia acordadas.

---

## 3. Capacitación práctica

Publia no es una academia generalista: la capacitación existe para que el cliente
aproveche los productos adquiridos.

| Módulo | Audiencia | Replicable |
|---|---|---|
| Introducción al chatbot | Responsables de negocio | sí |
| Uso del agente | Usuarios del agente | sí |
| Administración de herramientas | Administradores internos | sí |
| IA en procesos | Equipos operativos | sí |
| Configuración operativa | Personal capacitado | sí |
| Capacitación para responsables internos | Líderes de área | sí |

Módulos breves, reutilizables y replicables entre agencias. La capacitación
inicial puede formar parte de implementaciones según el paquete; la
capacitación adicional se cotiza aparte.

---

## 4. Asesoría

| Oferta | Descripción | Entregables | Precio |
|---|---|---|---|
| Orientación inicial | Breve evaluación comercial y tecnológica | Diagnóstico inicial del contexto, orientación sobre siguientes pasos | a definir |
| Diagnóstico | Revisión de situación, herramientas, procesos y oportunidades | Inventario de herramientas y procesos, mapa de oportunidades | a definir |
| Ruta de implementación | Documento con prioridades, alcance, fases y presupuesto | Prioridades, alcance, fases, presupuesto | a definir |
| Acompañamiento | Sesiones y seguimiento | Sesiones de seguimiento, ajustes sobre la marcha | a definir |

Estructura de datos preparada para duración, entregables, especialidad,
número de participantes, horas de preparación, horas de especialistas,
complejidad, precio y alcance. **No se publican precios inventados.**

---

## 5. Complementos por familias

| Familia | Servicios |
|---|---|
| Marketing y comunicación | Redes sociales · contenido con IA · community management · SEO · campañas tradicionales · gestión de anuncios · publicidad no invasiva experimental |
| Desarrollo | Sitios web · e-commerce · aplicaciones · integraciones · sistemas · automatizaciones · desarrollo personalizado |
| IA | Agentes · modelos locales · integraciones · implementaciones · capacitación práctica |
| Personas | Soporte adicional · más cobertura · becarios capacitados · especialistas · red de skills |
| Producción | Fotografía · video · animación · casting · influencers · eventos · activaciones · streaming · impresión y maquila |
| Infraestructura | Hosting · housing · sistemas privados · administración · herramientas abiertas |
| Economía | Laborys · integraciones de criptomonedas · soluciones económicas del ecosistema |

Todos los complementos pueden venderse por separado cuando comercialmente
corresponda.

---

## 6. Ciudadan y cooperativas

| Capacidad | Estado |
|---|---|
| Infraestructura compartida | existente |
| Formación práctica | existente |
| Red de desarrollo | existente |
| Herramientas para cooperativas de consumo | en desarrollo |
| Roles y comunicación | en desarrollo |
| Laborys | en desarrollo |
| Publicidad no invasiva (estudio en curso) | en desarrollo |
| Herramientas abiertas | en desarrollo |
| Directorio de cooperativas | planeado |
| Organización de miembros | planeado |
| Participación y gobernanza | planeado |
| Comercio entre organizaciones y marketplace | planeado |

La membresía cooperativa **sigue sin definición comercial**: se modela como
oferta configurable, sin precio ni beneficios contractuales definitivos.
Publia también puede acompañar a grupos que quieren adoptar principios
cooperativos sin cambiar de inmediato su figura jurídica.

Mensaje: «NO TIENES QUE CONSTRUIRLO TODO EN SOLITARIO. / HAY OTRA FORMA DE
ORGANIZAR EL TRABAJO, LA TECNOLOGÍA Y EL VALOR.»

---

## 7. Publicidad no invasiva

- Modelo **experimental**: el usuario decide cuándo consumir publicidad y
  puede recibir Laborys por su participación.
- Los negocios usan Laborys para participar en el ecosistema.
- Existe una propuesta de **estudio comparativo de aproximadamente un año**
  para evaluar campañas no invasivas frente a campañas tradicionales.
- **No se afirma** que el modelo supere a Google, Meta u otras plataformas.
- Se distingue: publicidad tradicional operativa / publicidad no invasiva
  experimental / participación en el estudio / beneficios potenciales /
  métricas por evaluar.
- La propia experiencia Publia **no** usa publicidad interruptiva.

---

## 8. Relación con el catálogo heredado

El WordPress existente tiene 20 servicios con precio (de $150 a $10 000 MXN).
La decisión de qué se conserva, reformula o retira corresponde a la Fase 4 y
está listada como pendiente en `PUBLIA-ESTADO.md`. Hasta esa decisión, el
frontend nuevo **no publica esos precios**.
