---
name: email-finder
description: >-
  Estrategia y flujo de trabajo para descubrimiento, extracción y verificación de correos electrónicos corporativos (B2B) de empresas y decisores, validación sintáctica, detección de patrones de dominio y verificación de entregabilidad.
---

# Email Finder Skill: Localización y Verificación de Correos B2B

Esta skill proporciona los métodos, patrones y herramientas necesarias para encontrar y verificar correos electrónicos de empresas y profesionales directivos/técnicos.

## 1. Métodos de Localización de Emails

### A. Patrones Corporativos de Dominio
Las empresas suelen utilizar un patrón común para sus cuentas de correo bajo su propio dominio (`@empresa.com`). Los formatos más habituales son:
- `{nombre}.{apellido}@empresa.com` (ej: `carlos.garcia@empresa.com`)
- `{inicial_nombre}{apellido}@empresa.com` (ej: `cgarcia@empresa.com`)
- `{nombre}@empresa.com` (ej: `carlos@empresa.com`)
- `{apellido}@empresa.com` (ej: `garcia@empresa.com`)
- `{nombre}_{apellido}@empresa.com`

### B. Correos Genéricos Funcionales
Si se busca el punto de entrada directo por departamento:
- **Compras / Aprovisionamiento:** `compras@empresa.com`, `purchasing@...`, `procurement@...`
- **Oficina Técnica / Proyectos:** `tecnico@empresa.com`, `proyectos@...`, `ingenieria@...`
- **Dirección / Gerencia:** `direccion@empresa.com`, `gerencia@...`
- **Contacto General:** `info@empresa.com`, `contacto@...`, `administracion@...`

### C. Fuentes de Descubrimiento Web (OSINT & Scraping)
1. **Página Web Corporativa:**
   - Secciones: `/contacto`, `/aviso-legal`, `/politica-de-privacidad` (donde por ley suele figurar el email fiscal).
   - Metadatos schema.org / microformatos en el HTML (`mailto:`).
2. **Búsquedas Avanzadas (Dorks):**
   - `site:dominio.com "@dominio.com"`
   - `site:linkedin.com/in "empresa" "email"` o `"@empresa.com"`
   - `"empresa" "email" OR "contacto" OR "correo" filetype:pdf`
3. **Servicios y APIs B2B Recomendados:**
   - Hunter.io (`https://api.hunter.io/v2/domain-search`)
   - Anymail Finder / Voila Norbert / Tomba.io
   - Snov.io / Dropcontact

---

## 2. Validación y Verificación de Entregabilidad

Antes de emitir o registrar cualquier correo electrónico en el CRM:
1. **Validación Sintáctica (RFC 5322):** Comprobar que no contenga espacios ni caracteres no permitidos.
2. **Comprobación de Registros MX:** Verificar que el dominio receptor tenga registros DNS MX configurados (`nslookup -q=mx dominio.com`).
3. **Filtro de Correos Desechables:** Descartar dominios temporales (Mailinator, GuerrillaMail, etc.).
4. **Protección Anti-Spam / Catch-All:** Identificar si el servidor de correo tiene política *catch-all* (acepta cualquier buzón sin confirmar existencia individual).

---

## 3. Integración en el CRM

Al localizar un correo verificado:
- **Estatus:** Clasificar el email como `verificado`, `aproximado_por_patron` o `generico`.
- **Destinatario:** Asociar el correo a la persona concreta (Nombre, Cargo) dentro de la ficha del prospecto.
- **Canal de Contacto:** Añadir al campo `contacto.email` de la entidad correspondiente en el CRM.
