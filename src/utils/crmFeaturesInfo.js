/**
 * @file crmFeaturesInfo.js
 * @description Utilidad que almacena y documenta de forma estructurada las características 
 * principales de los sistemas CRM (Customer Relationship Management) y las plataformas más populares.
 * Este archivo es reutilizable para secciones de ayuda, dashboards informativos o componentes educativos dentro de la app.
 */

/**
 * Lista de las 4 características principales comunes a los CRM más populares del mercado.
 * @type {Array<{id: number, title: string, description: string, keyBenefits: string[], practicalExample: string}>}
 */
export const CRM_FEATURES = [
  {
    id: 1,
    title: "Gestión Centralizada de Contactos y Visión de 360 Grados",
    description: "Consiste en unificar en una única base de datos todo el historial del cliente o prospecto: datos de contacto, correos electrónicos, registros de llamadas, notas de reuniones e interacciones previas. Permite que cualquier miembro del equipo conozca el contexto completo de la relación comercial al instante.",
    keyBenefits: [
      "Eliminación de silos de información entre departamentos (ventas, marketing, soporte).",
      "Historial de interacciones estructurado de forma cronológica.",
      "Facilidad para transferir cuentas entre gestores sin perder información valiosa."
    ],
    practicalExample: "En el CRM actual de la empresa, cuando seleccionas un prospecto y ves su sección de 'Contacto' con su teléfono, email y el historial de acciones tomadas (correos enviados, llamadas recibidas)."
  },
  {
    id: 2,
    title: "Automatización del Embudo de Ventas (Pipeline) y Marketing",
    description: "Permite estructurar el proceso comercial en etapas visuales (Leads, Contactados, Propuesta, Negociación, Cerrado) y automatizar tareas repetitivas como el envío de correos electrónicos de seguimiento, creación de recordatorios o asignación automática de prospectos según la zona geográfica.",
    keyBenefits: [
      "Reducción de tareas administrativas manuales para los comerciales.",
      "Consistencia en el proceso de venta de la empresa.",
      "Seguimiento automatizado para que ningún cliente potencial quede desatendido."
    ],
    practicalExample: "Mover una tarjeta de empresa de la columna 'Lead' a 'Propuesta' en un tablero tipo Kanban y que el sistema genere automáticamente una tarea de llamada de seguimiento para dentro de 3 días."
  },
  {
    id: 3,
    title: "Analítica, Informes y Pronósticos de Ventas (Forecasting)",
    description: "Capacidad de procesar todos los datos comerciales acumulados para generar tableros de control (dashboards) en tiempo real, gráficos de rendimiento del equipo y previsiones de ingresos futuros basadas en las probabilidades de cierre de los tratos activos.",
    keyBenefits: [
      "Toma de decisiones estratégicas basadas en datos reales, no en intuiciones.",
      "Identificación de cuellos de botella en el proceso comercial.",
      "Visibilidad clara del retorno de inversión (ROI) de las campañas."
    ],
    practicalExample: "Un gráfico de pastel en el CRM que muestre la facturación potencial agrupada por zonas geográficas o sectores, o una métrica que indique cuántos leads se han cerrado con éxito este mes."
  },
  {
    id: 4,
    title: "Integración Multiplataforma y Accesibilidad Móvil",
    description: "Sincronización bidireccional con herramientas de uso diario (Gmail, Outlook, ERP de la empresa, redes profesionales como LinkedIn) y la disponibilidad de aplicaciones móviles robustas para que los comerciales en ruta consulten o actualicen datos desde cualquier lugar.",
    keyBenefits: [
      "Los comerciales no tienen que duplicar información entre el correo y el CRM.",
      "Acceso en tiempo real a mapas de ruta y fichas de clientes durante visitas de campo.",
      "Conectividad con herramientas de comunicación instantánea (WhatsApp, telefonía IP)."
    ],
    practicalExample: "Poder hacer clic en el teléfono de un contacto en el CRM desde el móvil para llamarle y que la llamada se registre de manera automática con un solo toque."
  }
];

/**
 * Resumen informativo de los sistemas CRM más populares y adoptados en el mercado.
 * @type {Array<{name: string, targetSegment: string, strongPoints: string[], description: string}>}
 */
export const POPULAR_CRMS = [
  {
    name: "Salesforce",
    targetSegment: "Grandes corporaciones y empresas con procesos comerciales complejos",
    strongPoints: [
      "Personalización casi ilimitada.",
      "Potente motor de inteligencia artificial (Agentforce).",
      "Ecosistema gigante de integraciones de terceros (AppExchange)."
    ],
    description: "El líder indiscutible del mercado global. Es la opción de referencia para organizaciones que necesitan integrar procesos de ventas avanzados, soporte técnico y marketing a gran escala."
  },
  {
    name: "HubSpot CRM",
    targetSegment: "Empresas en crecimiento, PYMEs y equipos enfocados en Inbound Marketing",
    strongPoints: [
      "Excelente usabilidad y facilidad de adopción por los equipos.",
      "Integración nativa perfecta entre marketing, ventas y servicio al cliente.",
      "Modelo de precios escalable con un plan gratuito muy completo."
    ],
    description: "Famoso por su interfaz intuitiva. Centraliza la atracción de leads a través del marketing digital y el cierre de ventas en una sola herramienta sin curvas de aprendizaje empinadas."
  },
  {
    name: "Zoho CRM",
    targetSegment: "Pequeñas y medianas empresas (PYMEs) que buscan versatilidad y coste ajustado",
    strongPoints: [
      "Excelente relación calidad-precio.",
      "Ecosistema de aplicaciones propio muy extenso (Zoho One).",
      "Herramienta integrada de inteligencia artificial llamada 'Zia'."
    ],
    description: "Una opción robusta y accesible que ofrece funciones avanzadas similares a las de competidores más caros a una fracción del coste, muy popular en mercados emergentes."
  },
  {
    name: "Pipedrive / Monday CRM",
    targetSegment: "Equipos comerciales ágiles y orientados a la gestión visual de procesos",
    strongPoints: [
      "Enfoque directo en el flujo visual del embudo de ventas.",
      "Implementación ultra rápida.",
      "Interfaces modernas e interactivas basadas en arrastrar y soltar."
    ],
    description: "Diseñados específicamente para evitar la complejidad excesiva. Se centran en ayudar a los vendedores a saber exactamente qué acción tomar a continuación con cada trato."
  }
];
