/**
 * scripts/enrich_carinbisa.cjs
 * ---------------------------------------------------------------------
 * Corrección y enriquecimiento sin duplicados del registro existente
 * PROP-LEAD26-0474 (Carpintería Industrial Binéfar, S.A. - Carinbisa)
 * en prospects.json y Supabase PostgreSQL.
 *
 * Correcciones aplicadas tras verificación oficial:
 *  - CIF corregido de A22013957 -> A22014641 (NIF oficial de Carinbisa)
 *  - Dirección industrial real en Ctra. N-240 Km 128,100 (Esplús, Huesca)
 *  - Teléfono oficial +34 974 429 955 y email secundario presupuesto@carinbisa.com
 *  - Clasificación Tier 1 (6M-15M € / ~33 empleados) y especificaciones aluminio
 * ---------------------------------------------------------------------
 */

const { enrichExistingProspect } = require('./lib/prospectSync.cjs');

const TARGET_ID = 'PROP-LEAD26-0474';

const JSON_PATCH = {
  name: 'Carpintería Industrial Binéfar, S.A. (Carinbisa)',
  cif: 'A22014641',
  zone: 'Aragon',
  department: 'Esplús / Binéfar (Huesca)',
  city: 'Esplús',
  address: 'Carretera N-240, Km. 128,100, 22535 Esplús (Huesca)',
  location: [41.8165, 0.2785],
  lat: 41.8165,
  lng: 0.2785,
  phone: '+34 974 429 955',
  email: 'carinbisa@carinbisa.com',
  secondaryEmail: 'presupuesto@carinbisa.com',
  web: 'https://www.carinbisa.com',
  website: 'https://www.carinbisa.com',
  tier: 'Tier 1',
  b2bTier: 'Tier 1',
  sector: 'Cerramientos y Carpinteria de Aluminio',
  products: [
    'Cerramientos Mixtos Aluminio-Madera',
    'Ventanas RPT y Passivhaus',
    'Muros Cortina Mixtos y Puertas Exteriores'
  ],
  profileType: 'Mixto Madera-Aluminio / Muro Cortina',
  alloy: '6060-T66 / 6063-T5',
  finish: 'Lacado Qualicoat / Anodizado',
  certamen: 'VETECO 2026 (IFEMA)',
  notes:
    'Fabricante líder de cerramientos mixtos madera-aluminio de altas prestaciones térmicas y Passivhaus (~33 empleados, tramo 6M-15M €). [Actualizado Nov 2026: CIF corregido A22014641, dirección Ctra. N-240 Km 128,100 Esplús/Binéfar, tel. +34 974 429 955].'
};

const SUPABASE_PATCH = {
  name: JSON_PATCH.name,
  cif: JSON_PATCH.cif,
  zone: JSON_PATCH.zone,
  department: JSON_PATCH.department,
  city: JSON_PATCH.city,
  address: JSON_PATCH.address,
  location: JSON_PATCH.location,
  phone: JSON_PATCH.phone,
  email: JSON_PATCH.email,
  secondary_email: JSON_PATCH.secondaryEmail,
  web: JSON_PATCH.web,
  website: JSON_PATCH.website,
  tier: JSON_PATCH.tier,
  b2b_tier: JSON_PATCH.b2bTier,
  sector: JSON_PATCH.sector,
  products: JSON_PATCH.products.join(' | '),
  profile_type: JSON_PATCH.profileType,
  alloy: JSON_PATCH.alloy,
  finish: JSON_PATCH.finish,
  certamen: JSON_PATCH.certamen,
  notes: JSON_PATCH.notes,
  pipeline_stage: 'Lead'
};

async function main() {
  const result = await enrichExistingProspect(TARGET_ID, JSON_PATCH, SUPABASE_PATCH, {
    appUser: 'Script Enriquecimiento Carinbisa',
    appSource: 'script:enrich_carinbisa'
  });

  console.log(
    `Registro ${result.id} actualizado sin duplicar. Total en prospects.json: ${result.totalJsonCount}`
  );
}

main().catch(err => {
  console.error('Error actualizando Carinbisa:', err.message);
  process.exit(1);
});
