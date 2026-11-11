/**
 * scripts/add_batch_veteco_inrialsa.cjs
 * ---------------------------------------------------------------------
 * Incorporación aprobada de Industria Riojana del Aluminio, S.A. (Grupo Inrialsa)
 * detectada en el catálogo oficial de VETECO 2026 (IFEMA).
 *
 * Reutiliza el módulo scripts/lib/prospectSync.cjs para deduplicar por
 * ID, CIF y dominio raíz antes de actualizar prospects.json y Supabase.
 * ---------------------------------------------------------------------
 */

const { syncProspectBatch } = require('./lib/prospectSync.cjs');

const APPROVED_INRIALSA = [
  {
    id: 'PROP-LEAD26-VETECO26-14',
    name: 'Industria Riojana del Aluminio, S.A. (Grupo Inrialsa)',
    cif: 'A26014241',
    zone: 'La Rioja',
    department: 'Lardero (La Rioja)',
    city: 'Lardero',
    address: 'Polígono Industrial La Variante, Calle La Grajera nº 9, 26140 Lardero (La Rioja)',
    location: [42.4265, -2.4602],
    phone: '+34 941 447 877',
    email: 'aluminio@inrialsa.com',
    secondaryEmail: 'inrialsa@inrialsa.com',
    web: 'https://www.inrialsa.com',
    website: 'https://www.inrialsa.com',
    tier: 'Tier 1',
    sector: 'Carpintería de Aluminio, Ventanas, Puertas y Cerramientos',
    products: [
      'Ventanas y puertas de aluminio con rotura de puente térmico',
      'Cerramientos exteriores y sistemas correderos de aluminio',
      'Fachadas ligeras y carpintería metálica para edificación',
      'Sistemas mixtos y soluciones certificadas para construcción'
    ],
    profileType: 'Carpintería de Aluminio / Ventanas y Cerramientos',
    alloy: '6060-T66 / 6063-T5',
    finish: 'Lacado Qualicoat / Anodizado',
    certamen: 'VETECO 2026 (IFEMA)',
    notes: 'Expositor VETECO 2026. División de aluminio del Grupo Inrialsa (fundado en 1966, ~50 empleados, división hermana Inrialsa PVC S.A. A26188912). Verificado Nov 2026.'
  }
];

async function main() {
  const result = await syncProspectBatch(APPROVED_INRIALSA, {
    appUser: 'Script VETECO Inrialsa',
    appSource: 'script:add_batch_veteco_inrialsa'
  });

  console.log(
    `prospects.json actualizado. Añadidas: ${result.addedCount}, Omitidas: ${result.skipped.length}, Total registros: ${result.totalJsonCount}`
  );
  if (result.skipped.length > 0) {
    console.log('Omitidas por duplicado:', result.skipped.join(', '));
  }
  console.log(`Supabase sincronizado correctamente (${result.syncedCount} registros).`);
}

main().catch(err => {
  console.error('Error en script VETECO Inrialsa:', err.message);
  process.exit(1);
});
