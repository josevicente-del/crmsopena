/**
 * ============================================================================
 * prospectAuditor.cjs - Motor de Auditoría y Validación de Prospectos CRM
 * ============================================================================
 * Propósito:
 * 1. Diagnosticar zonas y sectores con base de datos vacía o incompleta frente
 *    al objetivo estratégico de 1.200 empresas por zona.
 * 2. Aplicar filtros de exclusión rigurosos (exclusión de competidores de extrusión,
 *    consistencia de dominio web, verificación de duplicados por nombre, CIF, web y teléfono).
 * 3. Proporcionar un punto de verificación seguro: NUNCA escribe en la base de
 *    datos del CRM a menos que se invoque con confirmación explícita.
 * ============================================================================
 */

const fs = require('fs');
const path = require('path');

// Ruta principal al archivo de datos de prospectos en el CRM
const PROSPECTS_FILE = path.join(__dirname, '..', 'data', 'prospects.json');

// Objetivo de prospección definido por zona geográfica
const TARGET_PER_ZONE = 1200;

// Lista negra de dominios de empresas competidoras directas en extrusión de aluminio
// (Grupo Sopeña no prospecta competidores de extrusión, sino clientes transformadores e instaladores)
const EXCLUDED_EXTRUDER_DOMAINS = [
  'cortizo.com', 'extrugasa.com', 'exlabesa.com', 'extoledo.com', 'alueuropa.com',
  'hydro.com', 'baux.es', 'alugom.com', 'navarra.pt', 'extrusal.pt', 'anicolor.pt',
  'adla-aluminium.pt', 'accelum.pt', 'tafe.pt', 'gruposopena.com', 'sopena.es', 'extrual.com'
];

// Palabras clave de competidores de extrusión para filtrado en el nombre
const EXCLUDED_EXTRUDER_KEYWORDS = [
  'cortizo', 'extrugasa', 'exlabesa', 'extoledo', 'alueuropa', 'hydro extrusion',
  'sapa extrusion', 'baux', 'alugom', 'navarra extrusão', 'extrusal', 'anicolor',
  'adla', 'accelum', 'tafe', 'sopena', 'extrual'
];

/**
 * Normaliza un dominio web para comparaciones precisas (elimina protocolo, www y rutas).
 * @param {string} url - Dirección web
 * @returns {string} Dominio en minúsculas y limpio
 */
function cleanDomain(url) {
  if (!url) return '';
  return url.toLowerCase()
    .replace(/^https?:\/\//, '')
    .replace(/^www\./, '')
    .split('/')[0]
    .trim();
}

/**
 * Normaliza un número telefónico dejando solo dígitos para evitar discrepancias de formato.
 * @param {string} phone - Teléfono de contacto
 * @returns {string} Solo dígitos
 */
function cleanPhone(phone) {
  if (!phone) return '';
  return phone.replace(/[^0-9]/g, '');
}

/**
 * Lee el archivo JSON actual de prospectos de forma segura.
 * @returns {Array<Object>} Lista de prospectos existentes
 */
function loadCurrentProspects() {
  if (!fs.existsSync(PROSPECTS_FILE)) {
    throw new Error(`El archivo de prospectos no existe en la ruta: ${PROSPECTS_FILE}`);
  }
  return JSON.parse(fs.readFileSync(PROSPECTS_FILE, 'utf8'));
}

/**
 * Audita el estado actual de la base de datos para una o varias zonas.
 * @param {Array<string>} [targetZones] - Zonas opcionales a filtrar
 * @returns {Object} Informe detallado con déficit por zona y desglose de sectores
 */
function auditZones(targetZones = ['Comunidad Valenciana', 'Comunidad de Madrid', 'Castilla-La Mancha', 'Francia']) {
  const prospects = loadCurrentProspects();
  const summary = {};

  targetZones.forEach(zone => {
    summary[zone] = {
      total: 0,
      target: TARGET_PER_ZONE,
      deficit: TARGET_PER_ZONE,
      coveragePercent: '0%',
      sectors: {},
      departments: {}
    };
  });

  prospects.forEach(item => {
    const z = item.zone;
    if (summary[z]) {
      summary[z].total++;
      summary[z].deficit = Math.max(0, TARGET_PER_ZONE - summary[z].total);
      summary[z].coveragePercent = ((summary[z].total / TARGET_PER_ZONE) * 100).toFixed(2) + '%';

      const s = item.sector || 'Sin Sector';
      summary[z].sectors[s] = (summary[z].sectors[s] || 0) + 1;

      const d = item.department || 'Sin Departamento';
      summary[z].departments[d] = (summary[z].departments[d] || 0) + 1;
    }
  });

  return summary;
}

/**
 * Valida un candidato frente a la base de datos actual y los criterios de exclusión.
 * @param {Object} candidate - Datos del candidato propuesto
 * @param {Array<Object>} existingProspects - Base de datos de comparación
 * @returns {{isValid: boolean, errors: Array<string>}} Resultado de la validación
 */
function validateCandidate(candidate, existingProspects) {
  const errors = [];
  const candidateDomain = cleanDomain(candidate.web);
  const candidatePhone = cleanPhone(candidate.phone);
  const candidateName = (candidate.name || '').toLowerCase().trim();
  const candidateCif = (candidate.cif || '').toUpperCase().trim();

  // 1. Verificación de exclusión de competidores de extrusión
  if (EXCLUDED_EXTRUDER_DOMAINS.some(d => candidateDomain.includes(d))) {
    errors.push(`Dominio vetado por pertenecer a un fabricante directo de extrusión: ${candidateDomain}`);
  }
  if (EXCLUDED_EXTRUDER_KEYWORDS.some(k => candidateName.includes(k))) {
    errors.push(`Razón social coincide con un competidor extrusor excluido: ${candidate.name}`);
  }

  // 2. Verificación de coherencia web
  if (!candidateDomain || candidateDomain.length < 4) {
    errors.push(`Dominio web no válido o inexistente: ${candidate.web}`);
  }

  // 3. Comprobación contra duplicados en la base de datos actual
  for (const existing of existingProspects) {
    const exDomain = cleanDomain(existing.web);
    const exName = (existing.name || '').toLowerCase().trim();
    const exPhone = cleanPhone(existing.phone);
    const exCif = (existing.cif || '').toUpperCase().trim();

    if (candidateDomain && exDomain === candidateDomain) {
      errors.push(`Dominio duplicado con registro existente ID ${existing.id} (${existing.name})`);
    }
    if (candidateName && exName === candidateName) {
      errors.push(`Nombre duplicado con registro existente ID ${existing.id} (${existing.name})`);
    }
    if (candidateCif && exCif && candidateCif === exCif) {
      errors.push(`CIF duplicado (${candidateCif}) con registro existente ID ${existing.id} (${existing.name})`);
    }
    if (candidatePhone && candidatePhone.length >= 8 && exPhone === candidatePhone) {
      errors.push(`Teléfono duplicado (${candidate.phone}) con registro existente ID ${existing.id} (${existing.name})`);
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Incorpora formalmente una lista de candidatos validados y aprobados al CRM.
 * IMPORTANTE: Solo debe ejecutarse tras confirmación explícita del usuario.
 * @param {Array<Object>} approvedCandidates - Candidatos aprobados
 * @returns {{success: boolean, addedCount: number, backupPath: string}} Resumen de incorporación
 */
function incorporateApprovedProspects(approvedCandidates) {
  const current = loadCurrentProspects();
  
  // 1. Crear copia de seguridad preventiva fechada
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupPath = path.join(__dirname, '..', 'data', `prospects.backup-${timestamp}.json`);
  fs.writeFileSync(backupPath, JSON.stringify(current, null, 2), 'utf8');

  // 2. Determinar el siguiente correlativo para ID único
  let maxIdNum = 350;
  current.forEach(item => {
    if (item.id && typeof item.id === 'string') {
      const match = item.id.match(/\d+$/);
      if (match) {
        const n = parseInt(match[0], 10);
        if (n > maxIdNum) maxIdNum = n;
      }
    }
  });

  // 3. Formatear y añadir los nuevos registros
  const newItems = approvedCandidates.map((cand, idx) => {
    const idNum = maxIdNum + idx + 1;
    return {
      id: `PROP-APPR-${String(idNum).padStart(4, '0')}`,
      name: cand.name,
      zone: cand.zone,
      department: cand.department || `${cand.city || 'Principal'} (${cand.zone})`,
      cif: cand.cif || 'Pendiente',
      web: cand.web.startsWith('http') ? cand.web : `https://${cand.web}`,
      revenue: cand.revenue || 0,
      purchasingManager: cand.purchasingManager || `Dpto. Compras (${cand.name})`,
      phone: cand.phone || '',
      email: cand.email || `info@${cleanDomain(cand.web)}`,
      location: cand.location || [40.4168, -3.7038], // Coordenadas geográficas por defecto
      sector: cand.sector,
      products: cand.products || ['Perfiles', 'Cerramientos', 'Accesorios'],
      contacted: false,
      contactDate: null,
      notes: cand.notes || 'Prospecto validado y aprobado por Dirección Comercial.',
      response: 'Pendiente de primer contacto comercial',
      createdAt: new Date().toISOString()
    };
  });

  const updatedData = [...current, ...newItems];
  fs.writeFileSync(PROSPECTS_FILE, JSON.stringify(updatedData, null, 2), 'utf8');

  return {
    success: true,
    addedCount: newItems.length,
    totalRecords: updatedData.length,
    backupPath
  };
}

module.exports = {
  auditZones,
  validateCandidate,
  incorporateApprovedProspects,
  cleanDomain,
  cleanPhone
};
