/**
 * scripts/add_batch_jacema.cjs
 * ---------------------------------------------------------------------
 * Incorporación aprobada de Jacema, S.L. (https://jacema.com/productos/)
 * en prospects.json y sincronización con Supabase PostgreSQL.
 *
 * Reutiliza el módulo scripts/lib/prospectSync.cjs para deduplicar por
 * ID, CIF y dominio raíz y asignar la etapa 'Lead' en el Kanban.
 * ---------------------------------------------------------------------
 */

const { syncProspectBatch } = require('./lib/prospectSync.cjs');

const APPROVED_JACEMA = [
  {
    id: 'PROP-LEAD26-BATCH15-01',
    name: 'Jacema, S.L.',
    cif: 'B30080576',
    zone: 'Murcia',
    department: 'San Javier (Murcia)',
    city: 'Santiago de la Ribera (San Javier)',
    address: 'Calle Castillo de Javier, s/n, 30720 Santiago de la Ribera, San Javier (Murcia)',
    location: [37.8005, -0.8065],
    phone: '+34 968 570 293',
    email: 'jacema@jacema.com',
    secondaryEmail: 'info@jacema.com',
    web: 'https://www.jacema.com',
    website: 'https://jacema.com/productos/',
    tier: 'Tier 2',
    sector: 'Carpintería de Aluminio, Ventanas, Puertas y Cerramientos',
    products: [
      'Ventanas practicables, correderas y de hoja oculta en aluminio y PVC',
      'Puertas de entrada y paso de aluminio',
      'Cortinas de cristal, persianas y mosquiteras',
      'Sistemas de correderas de aluminio para grandes vanos'
    ],
    profileType: 'Ventanas / Correderas / Cerramientos de Aluminio',
    alloy: '6060-T66 / 6063-T5',
    finish: 'Lacado Qualicoat / Anodizado',
    certamen: null,
    notes: 'Empresa fundada en 1985 en San Javier (Murcia) con fabricación propia, montaje e instalación de carpintería de aluminio, PVC, cortinas de cristal, persianas y mosquiteras. Tel. secundario: 968 572 988. Verificado Nov 2026.'
  }
];

async function main() {
  const result = await syncProspectBatch(APPROVED_JACEMA, {
    appUser: 'Script Batch Jacema',
    appSource: 'script:add_batch_jacema'
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
  console.error('Error incorporando Jacema:', err.message);
  process.exit(1);
});
