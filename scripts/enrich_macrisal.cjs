/**
 * scripts/enrich_macrisal.cjs
 * ---------------------------------------------------------------------
 * Enriquecimiento sin duplicados del registro existente PROP-LEAD26-0214
 * (Finestres Macrisal, S.L. - https://www.macrisal.com/) en prospects.json
 * y Supabase PostgreSQL.
 * ---------------------------------------------------------------------
 */

const { enrichExistingProspect } = require('./lib/prospectSync.cjs');

const TARGET_ID = 'PROP-LEAD26-0214';

const JSON_PATCH = {
  name: 'Finestres Macrisal, S.L. (Macrisal)',
  cif: 'B65435638',
  department: 'Barcelona / Sant Quirze del Vallès',
  city: 'Barcelona',
  address: "C/ Ca n'Oliva, 74, 08020 Barcelona (Fábrica Aluminio) / C/ Marià Cubí i Soler, 21, Sant Quirze del Vallès (Fábrica PVC)",
  location: [41.4215, 2.2038],
  lat: 41.4215,
  lng: 2.2038,
  phone: '+34 93 300 50 55',
  email: 'contacto@macrisal.com',
  web: 'https://www.macrisal.com',
  website: 'https://www.macrisal.com',
  tier: 'Tier 2',
  b2bTier: 'Tier 2',
  sector: 'Carpintería de Aluminio, Ventanas RPT y Cerramientos',
  products: [
    'Ventanas y puertas de aluminio con RPT',
    'Cerramientos arquitectónicos de aluminio',
    'Carpintería mixta aluminio y PVC'
  ],
  profileType: 'Ventanas RPT / Carpintería de Aluminio',
  alloy: '6060-T66 / 6063-T5',
  finish: 'Lacado Qualicoat / Anodizado',
  notes:
    "Inscrita en la Cámara de Barcelona. Fabricantes y distribuidores de puertas, ventanas y cerramientos de aluminio (Fábrica Aluminio en C/ Ca n'Oliva, 74, Barcelona; Fábrica PVC en Sant Quirze del Vallès). [Enriquecido Nov 2026: CIF B65435638, tel. +34 93 300 50 55, histórico +34 93 337 10 20, email contacto@macrisal.com verificado]."
};

const SUPABASE_PATCH = {
  name: JSON_PATCH.name,
  cif: JSON_PATCH.cif,
  department: JSON_PATCH.department,
  city: JSON_PATCH.city,
  address: JSON_PATCH.address,
  location: JSON_PATCH.location,
  phone: JSON_PATCH.phone,
  email: JSON_PATCH.email,
  web: JSON_PATCH.web,
  website: JSON_PATCH.website,
  tier: JSON_PATCH.tier,
  b2b_tier: JSON_PATCH.b2bTier,
  sector: JSON_PATCH.sector,
  products: JSON_PATCH.products.join(' | '),
  profile_type: JSON_PATCH.profileType,
  alloy: JSON_PATCH.alloy,
  finish: JSON_PATCH.finish,
  notes: JSON_PATCH.notes,
  pipeline_stage: 'Lead'
};

async function main() {
  const result = await enrichExistingProspect(TARGET_ID, JSON_PATCH, SUPABASE_PATCH, {
    appUser: 'Script Enriquecimiento Macrisal',
    appSource: 'script:enrich_macrisal'
  });

  console.log(
    `Registro ${result.id} enriquecido sin duplicar. Total en prospects.json: ${result.totalJsonCount}`
  );
}

main().catch(err => {
  console.error('Error enriqueciendo Macrisal:', err.message);
  process.exit(1);
});

