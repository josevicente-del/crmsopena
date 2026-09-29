---
name: agent-lead-finder-instagram
description: >-
  Estrategia de prospección y extracción de leads cualificados de aluminio extruido en Instagram y LinkedIn para España. Aplica restricción temporal estricta (<3 meses de antigüedad, posterior a junio 2026), facturación >5M €, exclusión de la AEA y verificación cruzada de solvencia mercantil.
---

# Agent Lead Finder: Estrategia de Prospección en Instagram y Fuentes Oficiales

Esta skill define el procedimiento estricto para la búsqueda, cualificación, validación cruzada y absorción de leads comerciales de aluminio extruido dentro del CRM de Grupo Sopeña.

## 1. Fuentes de Prospección
- **Instagram:** Descubrimiento mediante proyectos reales, fotos de obras, cerramientos, muros cortina y etiquetado industrial.
- **LinkedIn:** Verificación de organigrama, responsables de compras/técnicos y plantilla.
- **Fuentes Financieras y Mercantiles:** eInforma, Axesor, Iberinform, elEconomista y Registro Mercantil para auditoría de facturación y solvencia.

## 2. Restricción Temporal Estricta
- **Antigüedad máxima:** Publicaciones con **menos de 3 meses de antigüedad** (a partir de junio de 2026).
- **Criterio:** Si la última actividad comercial/publicación es anterior a junio de 2026, el lead se descarta inmediatamente por inactividad reciente.

## 3. Sectores Objetivo
1. Fachadas de Aluminio / Fachadas Especiales / Muros Cortina
2. Cerramientos y Carpintería de Aluminio
3. Puertas y Ventanas
4. Estructuras Solares / Fotovoltaica
5. Perfiles Estructurales Aluminio
6. Construcción Modular
7. Transformación de Chapa y Metal Arquitectónico

## 4. Palabras Clave y Hashtags Clave
- Hashtags: `#carpinteriadealuminio`, `#fachadasdealuminio`, `#perfilesdealuminio`, `#estructurassolares`, `#cerramientosdealuminio`, `#fachadasligeras`, `#aluminioarquitectonico`.
- Búsqueda: "Fachadas estructurales", "Instalación de cerramientos", "Fabricante ventanas aluminio", "Estructuras fotovoltaicas aluminio", "Muro cortina España".

## 5. Reglas de Calificación y Exclusión
- **Facturación:** Solo empresas con facturación auditada superior a 5.000.000 € (o proyectos singulares con solvencia contrastada).
- **Lista de Exclusión AEA (Asociación Española del Aluminio):** Omitir de forma taxativa a miembros del registro de extrusores (Actividad 12) como Cortizo, Exlabesa, Extrugasa, Alueuropa, Anicolor, Itesal, Alugom, Hydro Extrusion, Extruperfil, Nevaluz, Siplan, Mitjavila e Installux.
- **Antiduplicidad:** Comprobación previa contra `src/data/prospects.json` y `localStorage` ('aluminio_crm_added' y 'aluminio_crm_deleted').
- **Confirmación Previa:** Antes de incorporar cualquier lead rastreado a la base de datos oficial, se debe notificar al usuario para su validación expresa.
