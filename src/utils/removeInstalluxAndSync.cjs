/**
 * ============================================================================
 * UTILIDAD: ELIMINACIÓN DE INSTALLUX ALUMINIUM Y REGISTRO EN LISTA NEGRA
 * ============================================================================
 * 
 * Este script da de baja a "Installux Aluminium S.A." de prospects.json y
 * la añade de forma permanente a excludedCompanies.json para evitar que pueda
 * volver a ser incorporada por procesos de prospección o importación.
 */

const fs = require('fs');
const path = require('path');

const PROSPECTS_PATH = path.join(__dirname, '../data/prospects.json');
const EXCLUDED_PATH = path.join(__dirname, '../data/excludedCompanies.json');

// Cargar prospectos actuales
const prospects = JSON.parse(fs.readFileSync(PROSPECTS_PATH, 'utf8'));
console.log(`[INFO] Prospectos antes de eliminar Installux: ${prospects.length}`);

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

// Filtrar Installux
const remainingProspects = [];
let removed = null;

for (const p of prospects) {
  if (p.id === 'PROP-APPR-0373' || (p.name || '').toLowerCase().includes('installux')) {
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
    (e.domain && e.domain.includes('installux'))
  );

  if (!alreadyInExcluded) {
    excludedList.push({
      id: removed.id,
      name: removed.name,
      cif: removed.cif,
      domain: 'installux-aluminium.com',
      web: removed.web,
      reason: 'Competencia directa (Gamista y fabricante de sistemas de perfilería de aluminio en Francia)',
      excludedAt: new Date().toISOString(),
      notes: 'Eliminada por indicación de Dirección Comercial para no prospectar competidores de gamas de aluminio.'
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
  console.warn(`[AVISO] No se encontró a Installux Aluminium en la base de datos.`);
}
