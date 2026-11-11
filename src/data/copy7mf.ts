/*
 * Textos definitivos del bloque 7M-F, literales desde copy.es-MX.json
 * (PUBLIA_7MF_EJECUCION_DSH_CORREGIDA.zip). NO editar a mano: se regenera del JSON.
 */

export const COPY_7MF = {
  hero: {
    loading: "Preparando el universo Publia",
    routeEnterprise: "Gran negocio VIP",
    routeEfficiency: "Hacer más con menos",
    skip: "Saltar la animación",
    exploreAll: "Explorar todo el recorrido",
    more: "Explora más soluciones"
  },
  umbral: {
    eyebrow: "MÁS ALLÁ DE TU NEGOCIO",
    title: "Tu independencia crece en red.",
    lead: "Conecta tu negocio con tecnología, talento y conocimiento compartido. Esa misma colaboración puede impulsar cooperativas y comunidades productivas con mayor autonomía.",
    caption: "Una visión de comunidad productiva · ilustración conceptual.",
    alt: "Ilustración conceptual de una comunidad entre montañas, con cultivos, talleres, energía solar y espacios de colaboración.",
    benefitsTitle: "Más capacidad para hacer lo que importa.",
    benefits: [
      {
        title: "Control",
        body: "Elige cómo integrar tus herramientas y quién puede acceder a tu información."
      },
      {
        title: "Tiempo",
        body: "Identifica tareas repetitivas que podrían resolverse con automatización."
      },
      {
        title: "Talento",
        body: "Combina agentes de IA con acompañamiento humano según lo que necesites."
      },
      {
        title: "Conocimiento",
        body: "Documenta lo que funciona para que tu equipo pueda aprenderlo, adaptarlo y compartirlo."
      }
    ],
    panels: [
      {
        id: "ciudadan",
        title: "Ciudadan y el cooperativismo 6.0",
        body: "Publia conecta las necesidades de tu negocio con servicios tecnológicos y creativos. Ciudadan impulsa una red de comunidades autónomas que comparten conocimiento, herramientas y capacidades productivas. El cooperativismo 6.0 articula esa colaboración con tecnología abierta y organización digital."
      },
      {
        id: "labory",
        title: "Labory: intercambio dentro del ecosistema",
        body: "Labory es la unidad de intercambio propuesta para el ecosistema Ciudadan. Su uso en servicios y actividades dependerá de las condiciones de cada programa."
      },
      {
        id: "publicidad",
        title: "Publicidad por elección",
        body: "La participación en iniciativas de publicidad compartida es voluntaria. Cada propuesta debe explicar qué se difunde, dónde aparece y qué recibe quien participa."
      },
      {
        id: "comunidades",
        title: "Comunidades que producen y comparten",
        body: "La visión reúne ecoaldeas, talleres, microfábricas y espacios de aprendizaje conectados. Cada comunidad desarrolla su actividad y puede compartir conocimiento y capacidades con otras."
      }
    ]
  },
  simulator: {
    title: "¿Qué tareas podrías automatizar?",
    lead: "Explora un escenario con tus propios supuestos.",
    tasks: "Tareas repetitivas por semana",
    minutes: "Minutos por tarea",
    fraction: "Porción automatizable que estimas",
    adoption: "Parte de esa automatización que estimas implementar",
    result: "Horas semanales que podrían abordarse",
    baseline: "Horas semanales dedicadas a esas tareas",
    formula: "Horas abordables = tareas × minutos ÷ 60 × porción automatizable × implementación estimada.",
    note: "Este cálculo usa tus estimaciones. No mide ahorro real ni garantiza resultados.",
    reset: "Restablecer escenario",
    error: "Introduce valores dentro de los límites indicados.",
    defaults: {
      tasks: 65,
      minutes: 18,
      fraction: 40,
      adoption: 55
    },
    limits: {
      tasks: [
        0,
        1000,
        1
      ],
      minutes: [
        1,
        480,
        1
      ],
      fraction: [
        0,
        100,
        1
      ],
      adoption: [
        0,
        100,
        1
      ]
    }
  },
  infra: {
    eyebrow: "SOBERANÍA DIGITAL",
    title: "Tu tecnología. Tu operación. Tus decisiones.",
    lead: "Integra inteligencia, sistemas y datos en la operación que ya conoces. Elige una arquitectura abierta, con accesos definidos y herramientas que puedas auditar.",
    label: "Elige un escenario",
    caption: "Demostración conceptual de conexiones y recursos.",
    cta: "Diseñar mi infraestructura",
    modes: [
      {
        id: "local-private",
        label: "IA local privada",
        title: "Inteligencia dentro de tu organización.",
        body: "Procesa solicitudes con modelos y equipos locales. Define los accesos a tus documentos y las conexiones externas que autorices.",
        detail: "El esquema representa un despliegue local sin servicios externos conectados.",
        asset: "infra_local_privada.svg",
        alt: "Tres puestos de trabajo conectados con un servidor dentro de un mismo perímetro local; no hay enlaces al exterior."
      },
      {
        id: "local-collaborative",
        label: "IA local colaborativa",
        title: "Comparte capacidad. Define los límites.",
        body: "Mantén tus documentos dentro de la organización y habilita servicios concretos para colaborar. Tú defines qué recursos compartes y quién puede utilizarlos.",
        detail: "Compartir capacidad requiere permisos y aislamiento; no concede acceso a todos tus documentos.",
        asset: "infra_local_colaborativa.svg",
        alt: "Una oficina mantiene sus documentos dentro del perímetro local; una puerta de permisos conecta un servicio autorizado con dos usuarios externos."
      },
      {
        id: "managed-housing",
        label: "Housing administrado",
        title: "Tu infraestructura, con operación acompañada.",
        body: "Conecta tu negocio con equipos administrados por Publia. Elige la configuración y el esquema de recursos que corresponda a tu operación.",
        detail: "Compara las modalidades compartida y privada en la sección de Housing.",
        asset: "infra_housing.svg",
        alt: "Una oficina se conecta con un nodo administrado por Publia; dos usuarios acceden a la aplicación del negocio."
      },
      {
        id: "distributed-network",
        label: "Red distribuida",
        title: "Varios nodos. Más formas de colaborar.",
        body: "Conecta recursos de distintas ubicaciones mediante servicios y permisos definidos. Diseña cómo distribuir las tareas y qué rutas alternativas necesita tu operación.",
        detail: "Las rutas ilustran una arquitectura posible; la continuidad depende del diseño y la configuración contratados.",
        asset: "infra_distribuida.svg",
        alt: "Cuatro nodos en ubicaciones separadas forman una red con una ruta principal y otra alternativa."
      }
    ]
  },
  personas: {
    title: "Persona real, criterio real.",
    lead: "Combina la capacidad de la IA con personas que entienden el contexto, revisan decisiones y acompañan tu trabajo.",
    detail: "El acompañamiento humano se ofrece según el alcance y los horarios de tu servicio.",
    cta: "Conocer el acompañamiento"
  },
  ecosystem: {
    title: "Todo conectado. A tu manera.",
    lead: "Herramientas abiertas, integradas en un ecosistema modular. Trabaja desde tus canales habituales y decide qué piezas necesita tu negocio.",
    continuity: "Las plataformas pueden cambiar tarifas, condiciones o accesos. Diseñamos integraciones interoperables y opciones de exportación para facilitar la continuidad de tu operación.",
    ribbon: "Tecnología abierta, sin complicarte la operación.",
    cta: "Conversar por WhatsApp",
    demoLabel: "Ejemplo de proceso",
    resultLabel: "Resultado ilustrativo",
    families: [
      {
        id: "ia",
        label: "Inteligencia artificial",
        mode: "Asistido",
        steps: [
          {
            title: "Necesidad",
            body: "Define qué consultas o tareas quieres resolver."
          },
          {
            title: "Preparación",
            body: "Selecciona las fuentes que la IA puede utilizar."
          },
          {
            title: "Integración",
            body: "Conecta el asistente con el canal elegido."
          },
          {
            title: "Revisión",
            body: "Establece qué respuestas o acciones necesitan revisión humana."
          }
        ],
        result: "Un asistente responde preguntas con información autorizada y deriva las que requieren atención."
      },
      {
        id: "agentes",
        label: "Agentes asistentes",
        mode: "Asistido",
        steps: [
          {
            title: "Objetivo",
            body: "Elige una tarea y su criterio de finalización."
          },
          {
            title: "Permisos",
            body: "Delimita las herramientas y acciones disponibles."
          },
          {
            title: "Ejecución",
            body: "El agente trabaja dentro de esos permisos."
          },
          {
            title: "Control",
            body: "Revisa el resultado y autoriza los pasos que lo requieran."
          }
        ],
        result: "Un agente prepara un borrador de seguimiento para que lo revises antes de enviarlo."
      },
      {
        id: "web",
        label: "Sitios y comercio electrónico",
        mode: "Asistido",
        steps: [
          {
            title: "Oferta",
            body: "Organiza productos, servicios y datos del negocio."
          },
          {
            title: "Experiencia",
            body: "Define navegación, catálogo y consultas o pedidos."
          },
          {
            title: "Conexión",
            body: "Integra los servicios necesarios para la operación."
          },
          {
            title: "Entrega",
            body: "Recibe accesos e instrucciones para administrar el sitio."
          }
        ],
        result: "Un catálogo recibe consultas o pedidos y los dirige al flujo configurado para el negocio."
      },
      {
        id: "marketing",
        label: "Marketing digital",
        mode: "Asistido",
        steps: [
          {
            title: "Objetivo",
            body: "Define a quién quieres llegar y con qué propuesta."
          },
          {
            title: "Contenido",
            body: "Prepara las piezas para los canales seleccionados."
          },
          {
            title: "Aprobación",
            body: "Revisa mensajes y materiales antes de publicar."
          },
          {
            title: "Seguimiento",
            body: "Consulta los resultados disponibles en cada canal."
          }
        ],
        result: "Un calendario organiza piezas aprobadas y su publicación en las redes seleccionadas."
      },
      {
        id: "multimedia",
        label: "Producción multimedia",
        mode: "Humano con herramientas de IA",
        steps: [
          {
            title: "Idea",
            body: "Define el mensaje, el formato y la audiencia."
          },
          {
            title: "Guion",
            body: "Prepara la estructura y los materiales necesarios."
          },
          {
            title: "Producción",
            body: "Crea las piezas según el alcance acordado."
          },
          {
            title: "Entrega",
            body: "Revisa y recibe los archivos en los formatos definidos."
          }
        ],
        result: "Una pieza audiovisual comunica un servicio con guion, imagen y sonido preparados para su canal."
      },
      {
        id: "automatizacion",
        label: "Automatización",
        mode: "Automático con excepciones humanas",
        steps: [
          {
            title: "Disparador",
            body: "Identifica el evento que inicia el proceso."
          },
          {
            title: "Reglas",
            body: "Define los datos, condiciones y permisos."
          },
          {
            title: "Acción",
            body: "Ejecuta los pasos que se pueden automatizar."
          },
          {
            title: "Excepciones",
            body: "Deriva los casos que necesitan una persona."
          }
        ],
        result: "Una consulta se registra, se clasifica y se dirige al responsable definido."
      },
      {
        id: "infraestructura",
        label: "Infraestructura",
        mode: "Administrado",
        steps: [
          {
            title: "Necesidad",
            body: "Identifica aplicaciones, datos y usuarios."
          },
          {
            title: "Arquitectura",
            body: "Elige despliegue local, Housing o recursos distribuidos."
          },
          {
            title: "Configuración",
            body: "Establece accesos, respaldos y conexiones."
          },
          {
            title: "Operación",
            body: "Define administración, mantenimiento y responsabilidades."
          }
        ],
        result: "Una aplicación utiliza recursos configurados para el negocio con accesos y responsabilidades definidos."
      },
      {
        id: "cooperacion",
        label: "Colaboración y comunidad",
        mode: "Participación humana",
        steps: [
          {
            title: "Capacidad",
            body: "Identifica lo que puedes aportar o necesitas."
          },
          {
            title: "Acuerdo",
            body: "Define participantes, alcance y condiciones."
          },
          {
            title: "Trabajo",
            body: "Comparte las herramientas o el conocimiento acordados."
          },
          {
            title: "Documentación",
            body: "Registra resultados y aprendizajes que puedan reutilizarse."
          }
        ],
        result: "Dos equipos colaboran en un proyecto y documentan un procedimiento reutilizable."
      }
    ]
  },
  housing: {
    title: "Un nodo para lo que quieres construir.",
    lead: "Define la capacidad de tu equipo y cómo quieres utilizarla. Publia acompaña su administración.",
    sharedTitle: "Compartido",
    sharedBody: "Una parte de los recursos se destina a tu operación y otra a la red, según el acuerdo de servicio.",
    privateTitle: "Privado",
    privateBody: "Los recursos contratados se destinan a tu operación, sin aportación de capacidad a la red.",
    cta: "Cotizar mi configuración",
    fields: [
      "Equipo propio o por adquirir",
      "Modalidad compartida o privada",
      "Aplicaciones que quieres ejecutar",
      "Personas que lo utilizarán",
      "Capacidad y plazo que necesitas"
    ],
    note: "La cotización detalla equipo, administración, capacidad asignada y condiciones del servicio."
  },
  memberships: {
    title: "Elige tu combinación. Crece a tu ritmo.",
    lead: "Empieza con una base para tu negocio. Suma inteligencia, contenidos y acompañamiento conforme los necesites.",
    currency: "MXN / mes",
    cta: "Me interesa este plan",
    detailLabel: "Ver alcance",
    sharedNote: "El soporte humano se comparte entre clientes. La disponibilidad del equipo no equivale a horas de atención exclusiva.",
    extrasTitle: "Dale más alcance a tu plan.",
    extrasBody: "Fotografía, producción audiovisual, campañas especiales, eventos, capacitación y mayor capacidad de soporte se cotizan como complementos.",
    plans: [
      {
        id: "base",
        label: "Base",
        priceMXN: 300,
        tagline: "Tu negocio listo para conectar.",
        features: [
          "Sitio WordPress o tienda WooCommerce.",
          "Hosting para tu sitio.",
          "Chatbot de WhatsApp."
        ],
        detail: "El consumo de IA se cobra por separado. Este plan no incluye un agente personal."
      },
      {
        id: "agente",
        label: "Agente",
        priceMXN: 550,
        tagline: "Un asistente para tu trabajo.",
        features: [
          "Todo lo incluido en Base.",
          "Un agente asistente para una persona."
        ],
        detail: "El tiempo de respuesta depende de la carga del servicio. El agente personal y el chatbot de atención son funciones distintas."
      },
      {
        id: "crecimiento",
        label: "Crecimiento",
        priceMXN: 2000,
        tagline: "Más presencia y una atención conectada.",
        features: [
          "Todo lo incluido en Agente.",
          "Chatbot con derivación a varios integrantes de tu equipo.",
          "Gestión de 2 a 3 redes con contenido principalmente creado con IA."
        ],
        detail: "Referencia de alcance: aproximadamente 8 piezas mensuales. La distribución entre canales se define al contratar."
      },
      {
        id: "operacion",
        label: "Operación",
        priceMXN: 3000,
        tagline: "Acompañamiento para mover la operación.",
        features: [
          "Todo lo incluido en Crecimiento.",
          "Acceso a soporte humano compartido."
        ],
        detail: "El equipo asignado dispone de una jornada aproximada de 4 horas diarias compartida entre clientes. El alcance contempla entre 30 y 60 minutos de atención efectiva diaria por cliente, según el acuerdo de servicio."
      },
      {
        id: "cobertura",
        label: "Cobertura",
        priceMXN: 4000,
        tagline: "Una ventana de atención más amplia.",
        features: [
          "Todo lo incluido en Crecimiento.",
          "Soporte compartido mediante varios integrantes del equipo."
        ],
        detail: "Ventana de atención de 9:00 a 18:00, hora de Ciudad de México, en los días definidos en el acuerdo de servicio. Hasta 1 hora de atención efectiva diaria por cliente."
      }
    ]
  },
  knowledge: {
    title: "Conocimiento para llevarlo a la práctica.",
    trainingLabel: "Capacitación",
    trainingBody: "Aprende a utilizar las herramientas de tu operación con sesiones orientadas a tareas concretas.",
    adviceLabel: "Asesoría",
    adviceBody: "Revisa una necesidad con acompañamiento para definir opciones y próximos pasos.",
    cta: "Consultar opciones"
  },
  closing: {
    summaryTitle: "Tu siguiente paso, con contexto.",
    summaryLead: "Revisa lo que elegiste y cuéntanos qué quieres resolver.",
    title: "Vamos a conocernos.",
    lead: "Cuéntanos qué hace tu negocio y qué te gustaría mejorar. Empecemos por algo concreto.",
    name: "Tu nombre",
    business: "Nombre de tu negocio",
    need: "¿Qué quieres resolver?",
    needPlaceholder: "Por ejemplo: atender consultas, organizar pedidos o conectar mis herramientas.",
    submit: "Continuar por WhatsApp",
    privacy: "Estos datos se incluirán en el mensaje que tú decidas enviar por WhatsApp.",
    error: "Completa tu nombre y cuéntanos qué quieres resolver.",
    explore: "Explorar todo el recorrido"
  },
  contact: {
    channel: "WhatsApp",
    number: "525573724660",
    cta: "Conversar por WhatsApp",
    baseMessage: "Hola, quiero conocer las opciones de Publia para mi negocio.",
    infraMessage: "Hola, quiero diseñar mi infraestructura con Publia. Escenario: {label}.",
    ecosystemMessage: "Hola, me interesa {label} para mi negocio. Quiero conversar sobre el alcance.",
    planMessage: "Hola, me interesa la membresía {label} de Publia. Quiero conocer su alcance y condiciones.",
    housingMessage: "Hola, quiero cotizar una configuración de Housing con Publia.",
    formMessage: "Hola, soy {name}. Mi negocio: {business}. Quiero resolver: {need}."
  }
} as const;
