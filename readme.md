# 🛠️ Guía de Instrucciones de AluCRM

Bienvenido a las instrucciones de instalación, ejecución y uso de **AluCRM**, el CRM inteligente y optimizador logístico diseñado específicamente para el equipo comercial de la **Empresa de Aluminio**. 

Esta aplicación web permite centralizar la base de datos de leads de extrusión y carpintería de aluminio, planificar georutas óptimas por carretera con la API de OSRM, verificar y validar correos de departamentos de compras mediante SMTP Handshake virtual asistido por IA, y dictar notas de visitas mediante voz.

---

## 📋 Requisitos Previos

Antes de ejecutar el programa, asegúrate de tener instalado en tu sistema:
- **Node.js** (versión 18.0 o superior recomendada). Puedes descargarlo desde [nodejs.org](https://nodejs.org/).
- **Navegador Web Moderno** compatible con la API de reconocimiento de voz de HTML5 (como **Google Chrome** o **Microsoft Edge**) y con la API de Geolocalización activa.

---

## 🚀 Instalación y Puesta en Marcha

Sigue estos sencillos pasos para instalar y ejecutar el proyecto en tu entorno local:

1. **Instalar dependencias del proyecto:**
   Abre una terminal en el directorio del proyecto (`c:\Users\usuario\Desktop\carmen`) y ejecuta el siguiente comando para descargar los paquetes necesarios (React, Leaflet, Lucide React, jsPDF, html2canvas, Vite, etc.):
   ```bash
   npm install
   ```

2. **Iniciar el servidor de desarrollo:**
   Una vez completada la instalación de los paquetes, ejecuta el comando para levantar el entorno de desarrollo local con Vite:
   ```bash
   npm run dev
   ```

3. **Acceder a la aplicación:**
   Abre tu navegador de internet y dirígete a la dirección local que te proporcione la terminal (típicamente `http://localhost:5173`).

---

## 📖 Instrucciones de Uso Paso a Paso

### Paso 1: Acceso Seguro y Simulación DDoS (Cloudflare Turnstile)
Al abrir la aplicación por primera vez en la sesión, visualizarás una pantalla simulada de protección corporativa de Cloudflare:
1. El sistema realizará un análisis silencioso de tu navegador de forma automática.
2. Si se detiene en el desafío interactivo, haz clic en la casilla **"Soy humano / Verify you are human"** del Turnstile de Cloudflare.
3. Tras completarse la validación (aparecerá un checkmark verde), serás redirigido al portal de inicio de sesión del CRM.
4. **Credenciales de Acceso:**
   - **Usuario:** `ccastro`
   - **Contraseña:** `aluminio`
5. Presiona **"Iniciar Sesión"** para acceder al Dashboard Principal.

### Paso 2: Gestión de la Base de Datos Comercial (Clientes)
En la pestaña principal **"Clientes"** puedes administrar los 116 leads de carpinterías y metalúrgicas cargados en el sistema:
- **Filtros Combinados:** Puedes filtrar por Zona Geográfica (Cantabria, Galicia, Asturias, Portugal, etc.), Sector del cliente, Estado del contacto (Contactado / No contactado) y Rango de Facturación Anual.
- **Ordenación Reactiva:** Utiliza el selector de ordenación para organizar el listado alfabéticamente (A-Z o Z-A) o por el volumen de facturación de forma ascendente o descendente.
- **Importar y Exportar Datos:** 
  - Haz clic en **"Descargar JSON"** para descargar una copia de seguridad local actualizada de todos tus prospectos.
  - Haz clic en **"Importar JSON"** para cargar un archivo con nuevos prospectos compatibles con la estructura del CRM.
- **Exportar en PDF Interactivo:** Presiona **"Exportar en PDF"** para generar un dossier corporativo limpio que incluye la base de datos de los clientes seleccionados en los filtros, con enlaces web y telefónicos activos.

### Paso 3: Optimización y Trazado de Georutas (Pestaña Mapa)
Para planificar de forma eficiente tus visitas comerciales presenciales y ahorrar combustible:
1. Dirígete a la pestaña **"Mapa"**.
2. Filtra por la zona geográfica que deseas visitar (ej. *Cantabria*). El mapa posicionará marcadores en la ubicación de cada cliente de dicha zona.
3. Haz clic en el botón **"Calcular Ruta Óptima"**.
4. El CRM llamará de forma segura a la API pública de **OSRM (Open Source Routing Machine)** resolviendo el problema del viajero (TSP) por carretera.
5. El sistema dibujará una línea cian brillante en el mapa Leaflet conectando a los clientes en el orden de conducción más eficiente, y te indicará los kilómetros totales estimados de trayecto.
6. Si deseas usar el GPS de tu móvil para guiarte en el coche, haz clic en el botón **"Abrir Ruta en Google Maps"**, el cual exportará las coordenadas del itinerario directamente al navegador de Google.

### Paso 4: Búsqueda de Contactos y SMTP Handshake Virtual (Agentforce)
Muchos prospectos cargados inicialmente contienen correos electrónicos genéricos o de marcador de posición (placeholders) que causan rebote:
1. Haz clic sobre cualquier cliente en la lista para abrir su **Ficha de Detalle**.
2. En la barra lateral derecha de la ficha, si el correo no está verificado, presiona el botón **"Agentforce Finder"**.
3. Se abrirá la consola interactiva del chatbot. Agentforce analizará el nombre y web de la empresa, consultará los registros DNS MX simulados y ejecutará un **SMTP Handshake Virtual** enviando los comandos SMTP de red (`HELO`, `MAIL FROM`, `RCPT TO`) al buzón corporativo de la empresa.
4. Si el servidor de correo responde con el código de estado de éxito `250 Recipient OK` (buzón activo y real), el sistema te sugerirá la dirección de email directa del departamento de compras.
5. Haz clic en **"Aplicar email verificado"** para guardar de forma permanente esta dirección de email en la base de datos del cliente, reparando el placeholder anterior.

### Paso 5: Dictado de Notas y Tareas por Voz (Web Speech API)
Para agilizar el registro de información comercial en movilidad sin utilizar el teclado:
1. Abre el modal de **Detalle del Cliente** y ve a la sección de añadir notas o tareas.
2. Haz clic sobre el icono del **Micrófono** ubicado a la derecha de los campos de entrada de texto.
3. El botón parpadeará en rojo indicando que la grabación está activa. Dicta por voz los detalles de tu reunión (ej: *"El cliente solicita un presupuesto para perfiles anodizados plata y corte a medida para septiembre"*).
4. El motor de reconocimiento de voz transcribirá tus palabras de forma precisa y automática directamente en el campo de texto. Haz clic en el botón del micrófono de nuevo para detener la grabación o espera a que termine de hablar, y pulsa en añadir nota.

### Paso 6: Pipeline Kanban y Automatizaciones Reactivas
Para dar seguimiento al progreso de tus negociaciones:
1. Dirígete a la pestaña **"Pipeline de Ventas"**.
2. Arrastra y suelta las tarjetas de tus clientes entre las columnas de fase de venta: `Lead` ➔ `Propuesta` ➔ `Negociación` ➔ `Cerrado`.
3. **Automatización:** Si arrastras una tarjeta desde la columna inicial `Lead` a la columna `Propuesta`, el CRM detectará este cambio y generará de manera automática una tarea en su ficha agendada para dentro de 3 días (ej. *📞 Llamada de seguimiento comercial*), registrando este evento de transición logística en el historial del prospecto.

---

## 📂 Estructura del Repositorio del Programa

- `src/App.jsx`: Componente principal de la interfaz de usuario, filtros, tabs y lógica reactiva.
- `src/components/AgentforceAssistant.jsx`: Componente interactivo del chatbot Agentforce.
- `src/utils/distance.js`: Rutinas de cálculo de distancias por carretera y conexión a la API de OSRM.
- `src/utils/emailFinderEngine.js`: Algoritmo heurístico de análisis de email y simulación del SMTP Handshake.
- `src/data/prospects.json`: Base de datos inicial precargada del CRM con 116 leads.
- `src/App.css`: Estilos visuales del CRM basados en colores metalizados, grises y azules corporativos.
- `memoria_final.html`: Memoria técnica detallada del proyecto final con modo defensa integrado para presentaciones.