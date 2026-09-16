/**
 * ============================================================================
 * UTILIDAD: ELIMINACIÓN DE LA CASA DE LA ESCALERA Y REGISTRO EN LISTA NEGRA
 * ============================================================================
 * 
 * Este script da de baja a "La Casa de la Escalera S.C." (https://www.lacasadelaescalera.com/)
 * de prospects.json y la anota de forma permanente en excludedCompanies.json para
 * impedir futuras reincorporaciones.
 */

const fs = require('fs');
const path = require('path');

const PROSPECTS_PATH = path.join(__dirname, '../data/prospects.json');
const EXCLUDED_PATH = path.join(__dirname, '../data/excludedCompanies.json');

// Cargar prospectos actuales
const prospects = JSON.parse(fs.readFileSync(PROSPECTS_PATH, 'utf8'));
console.log(`[INFO] Prospectos antes de eliminar La Casa de la Escalera: ${prospects.length}`);

// Copia de seguridad preventiva fechada
const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
const backupPath = path.join(__dirname, `../data/prospects.backup-${timestamp}.json`);
fs.writeFileSync(backupPath, JSON.stringify(prospects, null, 2), 'utf8');
console.log(`[SEGURIDAD] Copia de respaldo guardada en: ${backupPath}`);

// Cargar lista de exclusiones
let excludedList = [];
if (fs.existsSync(EXCLUDED_PATH)) {
  excludedList = JSON.parse(fs.readFileSync(EXCLUDED_PATH, 'utf8'));
}

// Filtrar La Casa de la Escalera
const remainingProspects = [];
let removed = null;

for (const p of prospects) {
  const isMatch = p.id === 'PROP-VERIF-0332' || 
    (p.web && p.web.toLowerCase().includes('lacasadelaescalera')) ||
    (p.name && p.name.toLowerCase().includes('casa de la escalera'));

  if (isMatch) {
    removed = p;
  } else {
    remainingProspects.push(p);
  }
}

if (removed) {
  // Anotar en excludedCompanies.json
  const alreadyInExcluded = excludedList.some(e => 
    e.id === removed.id || 
    (e.cif && e.cif === removed.cif) || 
    (e.domain && e.domain.includes('lacasadelaescalera'))
  );

  if (!alreadyInExcluded) {
    excludedList.push({
      id: removed.id,
      name: removed.name,
      cif: removed.cif || 'B82194012',
      domain: 'lacasadelaescalera.com',
      web: removed.web || 'https://www.lacasadelaescalera.com',
      reason: 'Baja definitiva por Dirección Comercial',
      excludedAt: new Date().toISOString(),
      notes: 'Eliminada de la base de datos para no volver a incorporarla jamás.'
    });
  }

  fs.writeFileSync(PROSPECTS_PATH, JSON.stringify(remainingProspects, null, 2), 'utf8');
  fs.writeFileSync(EXCLUDED_PATH, JSON.stringify(excludedList, null, 2), 'utf8');

  console.log(`\n=======================================================`);
  console.log(`[ÉXITO] Empresa eliminada: ${removed.name} (${removed.id})`);
  console.log(`[TOTAL] Nuevo total en base de datos: ${remainingProspects.length} registros.`);
  console.log(`[EXCLUSIONES] Total empresas en lista negra permanente: ${excludedList.length}`);
  console.log(`=======================================================\n`);
} else {
  console.warn(`[AVISO] No se encontró a La Casa de la Escalera en la base de datos.`);
}
