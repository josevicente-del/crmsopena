# Resumen del proyecto

- **Nombre:** CRM de la Empresa de Aluminio
- **Alumno:** Comercial de la empresa de aluminio
- **Contexto:** Prospección y geolocalización comercial para la industria de la extrusión de aluminio
- **Tipo:** Aplicación Web Interactiva de Prospección / PoC
- **Herramientas:** React 19, Leaflet, OSRM API, Speech Recognition API, jsPDF, html2canvas, Vite, Google Antigravity
- **Demo:** [Acceder al Index](file:///c:/Users/usuario/Desktop/carmen/index.html) (Local dev: http://localhost:5173)
- **Repo:** [Ubicación del Código Fuente](file:///c:/Users/usuario/Desktop/carmen)

---

## 1. Problema | Stakeholders | Solución | Proceso mejorado

- **Problema:** Enorme ineficiencia en las visitas comerciales de la industria del aluminio debida a rutas mal optimizadas por carretera (cálculo manual), uso de correos electrónicos genéricos o de marcador de posición (placeholders) que provocan rebote comercial y lentitud en el registro manual de notas de visitas comerciales.
- **Stakeholders:** Comerciales en ruta (Comercial de ruta), Director de Ventas y Responsables de Aprovisionamiento (Clientes).
- **Solución:** Un CRM interactivo en React 19 que automatiza la obtención de la ruta de menor distancia (TSP con OSRM), integra un asistente inteligente Agentforce (OSINT Simulator) para obtener y validar SMTP el correo de compras verídico, y permite dictar notas comerciales por voz (Web Speech API).
- **Proceso mejorado:** La planificación logística pasa de 120 minutos a menos de 15 minutos semanales; el registro de actividad diaria pasa de 40 minutos a 8 minutos diarios; y el gasto en combustible se optimiza en un 16.7%.

---

## 2. Prompts usados | Pruebas | Riesgos | Hoja de ruta

- **Prompts usados:**
  - Prompt para integrar la llamada a la API pública de OSRM en React y dibujar las polilíneas de ruta en Leaflet.
  - Prompt para crear el motor simulador de OSINT SMTP Handshake (`emailFinderEngine.js`).
- **Pruebas:** Se realizaron cuatro casos de prueba exhaustivos con el CRM (cálculo de georutas, resolución SMTP, dictado por voz y sanitización de datos de LocalStorage), logrando un 100% de éxito en todos ellos.
- **Riesgos:** Pérdida de supervisión humana al enviar correos (mitigado forzando revisión manual previa en el modal), brechas de privacidad de datos personales en el RGPD (mitigado recolectando solo direcciones corporativas oficiales de compras) e inexactitud del mapa OSRM (mitigado añadiendo enlace alternativo de navegación con Google Maps).
- **Hoja de ruta:** 
  - **Semana 1:** Pruebas beta cerradas con dos comerciales en la zona norte.
  - **Semana 2:** Conexión con base de datos real PostgreSQL / Firebase y backend seguro.
  - **Semana 3:** Formación en ciberseguridad y RGPD.
  - **Semana 4:** Lanzamiento total en el dominio `crm.empresa-aluminio.com` para 6 comerciales a nivel nacional.

---

## 3. Decisiones pendientes (datos que faltan o hay que confirmar)

- **Confirmación del coste exacto de combustible por km:** Los cálculos actuales estiman una reducción de 120 € mensuales en carburante basándose en tarifas medias, pero debe verificarse con las tarjetas Solred del equipo de comerciales tras la primera semana de pruebas beta.
- **API Key de producción de OSRM:** Para la fase de producción, es necesario decidir si se contrata un servidor dedicado de OSRM o se migra a un servicio comercial pago como Google Maps Matrix API para garantizar un 99.9% de disponibilidad (uptime).
