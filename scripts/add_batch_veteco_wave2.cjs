/**
 * scripts/add_batch_veteco_wave2.cjs
 * ---------------------------------------------------------------------
 * Incorporación aprobada de la segunda selección de VETECO / SMART DOORS 2026:
 *  - Glaxior, S.L. (Antequera, Málaga)
 *  - Record Puertas Automáticas, S.A. (Sabadell, Barcelona)
 *
 * Reutiliza el helper scripts/lib/prospectSync.cjs para deduplicar por
 * ID, CIF y dominio raíz antes de actualizar prospects.json y Supabase.
 * ---------------------------------------------------------------------
 */

const { syncProspectBatch } = require('./lib/prospectSync.cjs');

const APPROVED_WAVE2_COMPANIES = [
  {
    id: 'PROP-LEAD26-VETECO26-12',
    name: 'Glaxior, S.L.',
    cif: 'B75745463',
    zone: 'Andalucia',
    department: 'Antequera (Málaga)',
    city: 'Antequera',
    address: 'Calle Castilla la Mancha, 6, Parque Empresarial, 29200 Antequera (Málaga)',
    location: [37.0295, -4.5392],
    phone: '+34 910 075 269',
    email: 'info@glaxior.com',
    web: 'https://glaxior.com',
    website: 'https://glaxior.com',
    tier: 'Tier 2',
    sector: 'Cortinas de Cristal, Pérgolas Bioclimáticas y Perfilería de Aluminio',
    products: [
      'Cortinas de cristal abatibles y correderas',
      'Pérgolas bioclimáticas de aluminio',
      'Perfiles de aluminio lacado para cerramientos',
      'Sistemas de cerramiento exterior para instaladores'
    ],
    profileType: 'Cerramientos de Terraza / Pérgolas / Perfilería Lacada',
    alloy: '6063-T5 / 6060-T6',
    finish: 'Lacado Qualicoat / Anodizado',
    certamen: 'VETECO 2026 (IFEMA)',
    notes: 'Expositor VETECO 2026. Proveedor mayorista y fabricante de perfiles de aluminio lacado, cortinas de cristal y pérgolas bioclimáticas para profesionales. Verificado Nov 2026.'
  },
  {
    id: 'PROP-LEAD26-VETECO26-13',
    name: 'Record Puertas Automáticas, S.A.',
    cif: 'A82612797',
    zone: 'Cataluña',
    department: 'Sabadell (Barcelona)',
    city: 'Sabadell',
    address: 'Carrer de Joaquim Blume, 12, 08205 Sabadell (Barcelona)',
    location: [41.5318, 2.0942],
    phone: '+34 93 674 26 50',
    email: 'info@record.es',
    web: 'https://www.recorddoors.com',
    website: 'https://www.record.es',
    tier: 'Tier 2',
    sector: 'Puertas Automáticas Peatonales y Cerramientos de Aluminio',
    products: [
      'Puertas automáticas correderas estándar y telescópicas',
      'Puertas automáticas curvas y giratorias',
      'Bastidores y guías de aluminio extruido para accesos',
      'Operadores y automatismos para carpintería metálica'
    ],
    profileType: 'Puertas Automáticas / Perfilería Estructural',
    alloy: '6060-T6 / 6063-T5',
    finish: 'Anodizado / Lacado Qualicoat',
    certamen: 'SMART DOORS / VETECO 2026 (IFEMA)',
    notes: 'Expositor SMART DOORS / VETECO 2026. Filial española del grupo ASSA ABLOY especializada en puertas automáticas correderas, curvas y soluciones de acceso con perfilería de aluminio (tramo 1,5M-3M €). Verificado Nov 2026.'
  }
];

async function main() {
  const result = await syncProspectBatch(APPROVED_WAVE2_COMPANIES, {
    appUser: 'Script VETECO Ola 2',
    appSource: 'script:add_batch_veteco_wave2'
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
  console.error('Error en script VETECO Ola 2:', err.message);
  process.exit(1);
});

