# Estrategia de Scraping Avanzada: Consumidores de Aluminio Extruido

Este documento define las reglas de negocio, fuentes, sectores, palabras clave y restricciones temporales para el agente de IA en la extracción de leads B2B en España.

## 1. Fuentes de Datos
- **LinkedIn:** Para validar la estructura corporativa, número de empleados y cargos directivos.
- **Instagram:** Para el descubrimiento de empresas mediante publicaciones de proyectos reales y obras ejecutadas.

## 2. Restricción Temporal Estricta
- **Antigüedad de publicaciones:** El agente debe auditar únicamente publicaciones e historias destacadas de Instagram que tengan **menos de 3 meses de antigüedad**.
- **Fecha de corte:** Solo se procesará contenido publicado a partir de **junio de 2026** para garantizar leads con actividad comercial reciente y relevante.

## 3. Sectores Objetivo Seleccionados
El agente debe acotar las búsquedas utilizando estrictamente los siguientes sectores de la industria:
- Cerramientos
- Puertas y Ventanas
- Fachadas de Aluminio / Fachadas Especiales
- Estructuras Solares
- Perfiles Estructurales Aluminio
- Construcción Modular
- Divisiones de Oficina / Fab. Escaleras

## 4. Palabras Clave y Hashtags para Instagram
El agente utilizará los siguientes términos combinados con ubicaciones de España para rastrear perfiles comerciales y publicaciones:
- **Hashtags principales:** `#carpinteriadealuminio`, `#fachadasdealuminio`, `#perfilesdealuminio`, `#estructurassolares`, `#cerramientosdealuminio`, `#fachadasligeras`, `#aluminioarquitectonico`.
- **Términos de búsqueda:** "Fachadas estructurales", "Instalación de cerramientos", "Fabricante ventanas aluminio", "Estructuras fotovoltaicas aluminio", "Muro cortina España".

## 5. Criterios de Calificación y Exclusión
- **Facturación:** Superior a 5.000.000 € anuales (se verificará en el cruce de datos posterior).
- **Lista de Exclusión (Miembros AEA):** Omitir estrictamente asociados de la web oficial (ej. Alucofer, Cortizo, Adapta Color, Lasergran, Proalsa, Anodizados Ebro, Extrusiones Metálicas Europea, etc.).

## 6. Plan de Ejecución para el Browser Subagent
1. Rastrear Instagram aplicando los hashtags y términos de búsqueda.
2. Filtrar y descartar inmediatamente cualquier perfil cuyas publicaciones más recientes tengan más de 3 meses de antigüedad (anteriores a junio de 2026).
3. Cruzar los nombres de las empresas activas encontradas con LinkedIn y bases de datos financieras para verificar que superen los 5M € de facturación.
4. Aplicar el filtro de exclusión de la AEA.
5. Exportar a `leads_aluminio_recientes.csv` con los campos: Empresa, Sector, Web, Última Publicación (Fecha), Instagram, LinkedIn y Facturación.
