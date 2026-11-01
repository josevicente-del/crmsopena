---
name: agent-lead-finder-instagram
description: >-
  Estrategia integral de prospección y extracción de leads cualificados de aluminio extruido en Instagram, LinkedIn, Ferias Sectoriales, Licitaciones Públicas y Directorios Ibéricos para España y Portugal. Aplica restricción temporal estricta (<3 meses de antigüedad, posterior a junio 2026), filtro de consumo industrial de perfiles extruidos, facturación auditada (>5M €) o contrastada, exclusión taxativa de la AEA y verificación cruzada de solvencia mercantil.
---

# Agent Lead Finder: Estrategia de Prospección Multicanal y Fuentes Oficiales

Esta skill define el procedimiento estricto para la prospección, cualificación, validación cruzada y absorción de leads comerciales de perfiles de aluminio extruido dentro del CRM de Grupo Sopena.

## 1. Fuentes de Prospección Homologadas

### 1.1 Redes Profesionales y Visuales
- **Instagram:** Descubrimiento de proyectos reales terminados, fotografías de obras en curso, sistemas de muros cortina, cerramientos y carpintería singular.
- **LinkedIn:** Localización y verificación de organigramas, Directores de Compras (Purchasing Managers), Directores Técnicos de Producción y plantilla en planta.

### 1.2 Catálogos de Expositores de Ferias Sectoriales (Península Ibérica)
- **VETECO (IFEMA Madrid - ifema.es/veteco):** Salón Internacional de la Ventana, Fachada y Protección Solar. Censo exhaustivo de fabricantes de ventanas, muros cortina y sistemas de protección solar.
- **GENERA (IFEMA Madrid - ifema.es/genera):** Feria Internacional de Energía y Medioambiente. Fabricantes e instaladores de estructuras fotovoltaicas y perfilería solar en aluminio.
- **CONCRETA (Exponor Oporto, Portugal - concreta.exponor.pt):** Feria de Construcción, Arquitectura, Diseño e Ingeniería. Filtro de transformadores y ensambladores de cerramientos del norte y centro de Portugal.
- **FIAA (IFEMA Madrid - ifema.es/fiaa):** Feria Internacional del Autobús y del Autocar. Carroceros industriales y transformadores de perfiles estructurales de aluminio para transporte.

### 1.3 Plataformas de Licitación Pública (Obras y Cerramientos)
- **Plataforma de Contratación del Sector Público de España (contrataciondelestado.es):** Seguimiento de adjudicaciones de lotes específicos de "Carpintería metálica", "Fachadas modulares de aluminio" y "Muros cortina".
- **Portal BASE de Portugal (base.gov.pt):** Base de datos de contratos públicos del Estado portugués. Detección de adjudicatarios industriales de obras con carpintería y fachadas de aluminio.

### 1.4 Portales y Catálogos de Prescripción Técnica en Arquitectura
- **Tectónica (tectonica.archi):** Catálogo técnico de arquitectura con soluciones constructivas reales y fabricantes prescritos de carpintería y fachadas de aluminio.
- **ArchDaily España (archdaily.es):** Proyectos de arquitectura contemporánea con especificación de proveedores de sistemas de fachada y envolvente de aluminio.
- **Construnario (construnario.com) & Hispalyt:** Directorios técnicos de empresas fabricantes de cerramientos, celosías, lamas y persianas industriales de aluminio.

### 1.5 Directorios y Asociaciones Sectoriales de España y Portugal
- **Novoperfil (novoperfil.com):** Directorio nacional y portal de referencia en carpintería, cerramientos y fachadas.
- **FEMVAL (femval.es):** Censo industrial de la Federación Empresarial Metalúrgica Valenciana.
- **AECIM (aecim.org):** Registro empresarial de la industria del metal y cerramientos de Madrid y Zona Centro.
- **ANFAJE (Portugal - anfaje.pt):** Associação Nacional dos Fabricantes de Janelas Eficientes. Registro de fabricantes industriales de ventanas eficientes en Portugal.
- **AIMMAP (Portugal - aimmap.pt):** Associação dos Industriais Metalúrgicos, Metalomecânicos e Afins de Portugal. Censo de metalomecánica y subcontratación de perfilería.

### 1.6 Fuentes Financieras y Mercantiles B2B
- **Axesor (axesor.es):** Auditoría mercantil, scoring de solvencia y verificación de facturación > 5.000.000 € (o proyectos singulares solventes).
- **eInforma, Iberinform, elEconomista y Registro Mercantil:** Contraste de balances oficiales, administradores y solvencia. Si la facturación no se puede comprobar al 100%, debe dejarse en blanco (`null` / vacío).

---

## 2. Restricción Temporal Estricta
- **Antigüedad máxima:** Actividad, obras o publicaciones con **menos de 3 meses de antigüedad** (posteriores a junio de 2026).
- **Criterio de exclusión:** Si la empresa no presenta actividad demostrada posterior a junio de 2026, se descarta por inactividad.

---

## 3. Criterio de Consumo de Aluminio Extruido
- **Consumo Obligatorio:** La empresa debe ser consumidora real de perfiles de aluminio extruido (carpintería de rotura de puente térmico, sistemas de fachada modular, muros cortina, lamas extruidas, estructuras solares, carrocerías).
- **Exclusión de Prensa Propia:** No debe poseer prensas de extrusión propias ni pertenecer a grupos extrusores.
- **Sin Invención de Datos:** Cualquier empresa cuya actividad consumidora no se pueda contrastar al 100% no se añade a la base de datos. Si los contactos de LinkedIn no están contrastados fehacientemente, se dejan en blanco.

---

## 4. Reglas de Exclusión AEA y Competencia
- **Exclusión Taxativa AEA (Asociación Española del Aluminio):** Omitir empresas del registro de extrusores (Actividad 12): Cortizo, Exlabesa, Extrugasa, Alueuropa, Anicolor, Itesal, Alugom, Hydro Extrusion, Extruperfil, Nevaluz, Siplan, Mitjavila, Installux, Extrusax, Aluval, etc.
- **Antiduplicidad:** Comprobación estricta contra `src/data/prospects.json` y `src/data/excludedCompanies.json`.

---

## 5. Protocolo de Incorporación
- **Sin añadir automáticamente:** El sistema debe proponer las empresas detectadas en un informe para validación del usuario. Ninguna empresa se añadirá a la base de datos sin la aprobación expresa previa del usuario.
