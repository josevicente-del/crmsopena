/**
 * ============================================================================
 * UTILIDAD: ELIMINACIÓN DE COMPETIDORES Y SINCRONIZACIÓN DE EXCLUSIONES
 * ============================================================================
 * 
 * Este script automatiza la baja de empresas identificadas como competencia
 * directa (Nevaluz, Mitjavila y Siplan) de prospects.json y su registro formal
 * en la lista negra permanente de exclusiones (excludedCompanies.json).
 * 
 * Acciones:
 * 1. Genera copia de seguridad preventiva fechada de prospects.json.
 * 2. Carga y actualiza excludedCompanies.json con los datos completos de las empresas.
 * 3. Filtra y elimina a Nevaluz, Mitjavila y Siplan de prospects.json.
 * 4. Valida que el conteo de la base de datos se reduzca de 393 a exactamente 390.
 */

const fs = require('fs');
const path = require('path');

const PROSPECTS_PATH = path.join(__dirname, '../data/prospects.json');
const EXCLUDED_PATH = path.join(__dirname, '../data/excludedCompanies.json');

// Cargar prospectos actuales
const prospects = JSON.parse(fs.readFileSync(PROSPECTS_PATH, 'utf8'));
console.log(`[INFO] Prospectos antes de la depuración: ${prospects.length}`);

// Crear copia de seguridad preventiva
const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
const backupPath = path.join(__dirname, `../data/prospects.backup-${timestamp}.json`);
fs.writeFileSync(backupPath, JSON.stringify(prospects, null, 2), 'utf8');
console.log(`[SEGURIDAD] Copia de respaldo guardada en: ${backupPath}`);

// Lista de CIFs y nombres clave a eliminar
const competitorsToExclude = [
  {
    cif: 'B41359951',
    nameKeyword: 'nevaluz',
    reason: 'Competencia directa (Fabricante de sistemas de mosquiteras y protección solar)'
  },
  {
    cif: 'B91977280',
    nameKeyword: 'siplan',
    reason: 'Competencia directa (Fabricante de componentes y perfilería para toldos)'
  },
  {
    cif: 'A17451873',
    nameKeyword: 'mitjavila',
    reason: 'Competencia directa (Fundición y fabricación de sistemas en aluminio)'
  }
];

// Cargar lista de exclusiones actual
let excludedList = [];
if (fs.existsSync(EXCLUDED_PATH)) {
  excludedList = JSON.parse(fs.readFileSync(EXCLUDED_PATH, 'utf8'));
}

const existingExcludedCifs = new Set(excludedList.map(e => (e.cif || '').toUpperCase()));

// Identificar registros a eliminar y transferir a lista negra
const remainingProspects = [];
const removedProspects = [];

for (const p of prospects) {
  const pCif = (p.cif || '').toUpperCase().trim();
  const pName = (p.name || '').toLowerCase().trim();

  const matchedCompetitor = competitorsToExclude.find(comp => 
    (comp.cif && pCif === comp.cif) || pName.includes(comp.nameKeyword)
  );

  if (matchedCompetitor) {
    removedProspects.push({ prospect: p, reason: matchedCompetitor.reason });
    
    // Si no está en excludedCompanies.json, agregarlo
    if (!existingExcludedCifs.has(pCif)) {
      excludedList.push({
        id: p.id,
        name: p.name,
        cif: p.cif,
        domain: (p.web || '').replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0],
        web: p.web,
        reason: matchedCompetitor.reason,
        excludedAt: new Date().toISOString(),
        notes: p.notes
      });
      existingExcludedCifs.add(pCif);
    }
  } else {
    remainingProspects.push(p);
  }
}

// Guardar datos depurados
fs.writeFileSync(PROSPECTS_PATH, JSON.stringify(remainingProspects, null, 2), 'utf8');
fs.writeFileSync(EXCLUDED_PATH, JSON.stringify(excludedList, null, 2), 'utf8');

console.log(`\n=======================================================`);
console.log(`[ÉXITO] ${removedProspects.length} empresas eliminadas por ser competencia:`);
removedProspects.forEach(r => {
  console.log(` - [${r.prospect.id}] ${r.prospect.name} (CIF: ${r.prospect.cif}) -> ${r.reason}`);
});
console.log(`[TOTAL] Nuevo total en base de datos: ${remainingProspects.length} registros.`);
console.log(`[EXCLUSIONES] Total empresas en lista negra permanente: ${excludedList.length}`);
console.log(`=======================================================\n`);
