/**
 * add_batch_13_empresas.cjs
 * ---------------------------------------------------------------
 * Incorpora 9 empresas nuevas al CRM y enriquece 4 ya existentes
 * (Malasa, Aluminios Criptana, Kallan Doors, Tamiluz).
 *
 * - Evita duplicados comparando dominio web.
 * - Datos obtenidos de webs oficiales / directorios públicos (nov-2026).
 * - Emails NO publicados se marcan como null (nunca inventados).
 *
 * Uso:  node scripts/add_batch_13_empresas.cjs
 * ---------------------------------------------------------------
 */
const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, '..', 'src', 'data', 'prospects.json');

/** Extrae el dominio base de una URL para deduplicar. */
const domainOf = (url = '') =>
  url.toLowerCase().replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0];

/** Construye un prospecto con la estructura estándar del CRM. */
function buildProspect(p, idx) {
  return {
    id: `PROP-LEAD26-BATCH13-${String(idx + 1).padStart(2, '0')}`,
    name: p.name,
    cif: p.cif || null,
    zone: p.zone,
    department: p.department,
    city: p.city,
    address: p.address,
    location: p.location,
    lat: p.location[0],
    lng: p.location[1],
    phone: p.phone,
    email: p.email,
    secondaryEmail: p.secondaryEmail || null,
    web: p.website,
    website: p.website,
    revenue: p.revenue || null,
    tier: p.tier || 'Tier 3',
    b2bTier: p.tier || 'Tier 3',
    purchasingManager: p.purchasingManager || 'Departamento de Compras',
    sector: p.sector,
    products: p.products,
    profileType: p.profileType,
    alloy: '6063-T5 / 6060',
    finish: 'Lacado / Anodizado',
    contacted: false,
    contactDate: null,
    emailVerified: !!p.email,
    emailVerifiedType: p.email ? 'corporate_official' : 'not_found',
    response: 'Pendiente de primer contacto comercial',
    notes: p.notes,
    createdAt: new Date().toISOString(),
    pipelineStage: 'Prospección Inicial',
    certamen: null,
    emailableStatus: p.email ? 'unverified' : 'not_found',
    tasks: [],
    history: [],
  };
}

// ---------- 9 empresas nuevas ----------
const NEW_COMPANIES = [
  {
    name: 'Voss Stainless Iberia S.L. (Voss Edelstahl Barcelona)',
    cif: 'B65858441',
    zone: 'Cataluña', department: 'Barcelona', city: 'Sant Quirze del Vallès',
    address: 'C/ Narcís Monturiol i Estarriol, 16-18, 08192 Sant Quirze del Vallès (Barcelona)',
    location: [41.5306, 2.0817],
    phone: '+34 937 113 142',
    email: 'barcelona@voss-iberia.com',
    website: 'https://www.voss-edelstahl.com/de/barcelona',
    sector: 'Distribución de perfiles y tubos de acero inoxidable / metales',
    products: ['Tubos y perfiles de acero inoxidable', 'Barras y chapas', 'Accesorios metálicos'],
    profileType: 'Distribuidor de semielaborados metálicos',
    notes: 'Filial ibérica del grupo alemán Voss Edelstahlhandel. Email en dominio voss-iberia.com (distinto a la web) – validar MX.',
  },
  {
    name: 'Alumilux, S.L.',
    zone: 'Cataluña', department: 'Girona', city: 'Banyoles',
    address: 'Ronda Canaleta, 23-31, 17820 Banyoles (Girona)',
    location: [42.1167, 2.7667],
    phone: '+34 972 572 722',
    email: 'info@alumilux.cat',
    secondaryEmail: 'ocapdevila@alumilux.cat',
    website: 'https://alumilux.com',
    purchasingManager: 'O. Capdevila (Ventas)',
    sector: 'Alta carpintería metálica (aluminio, acero y vidrio)',
    products: ['Carpintería de aluminio de gama alta', 'Cerramientos acero-vidrio', 'Fachadas'],
    profileType: 'Carpintería / Cerramientos',
    notes: 'Emails departamentales publicados en web: ventas ocapdevila@, distribuidores xrocas@, comunicación llcapdevila@ (dominio .cat).',
  },
  {
    name: 'Cerrajería Teófilo, S.L.',
    zone: 'Comunidad de Madrid', department: 'Madrid', city: 'Humanes de Madrid',
    address: 'C/ Albacete, 12-14, P.I. Valdonaire, 28970 Humanes de Madrid (Madrid)',
    location: [40.2506, -3.8283],
    phone: '+34 916 977 721',
    email: 'info@teofilosl.es',
    website: 'https://teofilosl.es',
    sector: 'Carpintería de aluminio y cerrajería',
    products: ['Ventanas y puertas de aluminio', 'Cerramientos', 'Cerrajería metálica'],
    profileType: 'Carpintería / Cerramientos',
    notes: 'Fábrica en Humanes y showroom en Av. Pablo VI 9, Pozuelo de Alarcón. Tel. alternativo 91 352 39 14.',
  },
  {
    name: 'Cupoola (Vegametal Cubiertas)',
    zone: 'Comunidad Valenciana', department: 'Alicante', city: 'Orihuela',
    address: 'Camino Cencerro, s/n, Desamparados, 03312 Orihuela (Alicante)',
    location: [38.0847, -0.9439],
    phone: '+34 965 303 410',
    email: null,
    website: 'https://cupoola.com',
    tier: 'Tier 2',
    sector: 'Cubiertas y cerramientos de aluminio para piscinas',
    products: ['Cubiertas telescópicas de piscina', 'Cerramientos de aluminio', 'Pérgolas'],
    profileType: 'Estructuras / Cubiertas',
    notes: 'Planta de >22.000 m². No publican email: solo formulario web. Email: No encontrado.',
  },
  {
    name: 'Divisiones Normalizadas, S.A. (Dinor)',
    zone: 'Cataluña', department: 'Tarragona', city: 'Llorenç del Penedès',
    address: 'P.I. La Rigola, Camí de les Terres, 1, 43712 Llorenç del Penedès (Tarragona)',
    location: [41.2797, 1.5469],
    phone: '+34 977 677 793',
    email: 'info@dinor.es',
    website: 'https://www.dinor.es/productos/',
    tier: 'Tier 2',
    sector: 'Mamparas divisorias y suelos técnicos',
    products: ['Mamparas de oficina con perfilería de aluminio', 'Tabiques móviles', 'Suelos técnicos', 'Cabinas sanitarias'],
    profileType: 'Mamparas / Interiorismo',
    notes: 'Fabricante con perfilería de aluminio propia para mamparas.',
  },
  {
    name: 'Metalistería Almanseña, S.L.',
    zone: 'Castilla-La Mancha', department: 'Albacete', city: 'Almansa',
    address: 'Avda. Madrid, 86, 02640 Almansa (Albacete)',
    location: [38.8697, -1.0975],
    phone: '+34 967 311 918',
    email: 'administracion@metalisteria-almansena.es',
    secondaryEmail: 'dtecnico@metalisteria-almansena.es',
    website: 'https://metalisteria-almansena.es',
    sector: 'Carpintería metálica y de aluminio',
    products: ['Carpintería de aluminio', 'Fachadas', 'Estructuras metálicas'],
    profileType: 'Carpintería / Cerramientos',
    notes: 'Email técnico dtecnico@ publicado en web.',
  },
  {
    name: 'Talleres Valeriano Montón, S.A. (TV Montón)',
    zone: 'Cataluña', department: 'Barcelona', city: 'Mollet del Vallès',
    address: 'P.I. Can Magarola, C/ Claudi Arañó i Arañó, 19, 08100 Mollet del Vallès (Barcelona)',
    location: [41.5397, 2.2131],
    phone: '+34 935 798 021',
    email: 'tvmonton@tvmonton.com',
    website: 'https://www.tvmonton.com',
    tier: 'Tier 2',
    sector: 'Carpintería metálica, fachadas ligeras y estructuras',
    products: ['Fachadas ligeras / muro cortina', 'Carpintería de aluminio', 'Cerrajería', 'Estructuras metálicas'],
    profileType: 'Fachadas / Carpintería',
    notes: 'Constructor integral de fachadas ligeras: alto consumo de perfil extruido.',
  },
  {
    name: 'Estructuras de Aluminio Alicante, S.L. (Abrisol)',
    zone: 'Comunidad Valenciana', department: 'Alicante', city: 'Alicante',
    address: 'C/ Nieve, 44, P.I. Pla de la Vallonga, 03006 Alicante',
    location: [38.3567, -0.5458],
    phone: '+34 965 670 909',
    email: 'info@abrisol.net',
    website: 'https://www.abrisol.net',
    sector: 'Cubiertas de piscina y estructuras de aluminio',
    products: ['Cubiertas de piscina', 'Cerramientos de terraza', 'Estructuras de aluminio'],
    profileType: 'Estructuras / Cubiertas',
    notes: 'Exporta a Francia (tel. +33 647 612 893). WhatsApp +34 664 376 185.',
  },
  {
    name: 'Alumatic Norte',
    zone: 'Galicia', department: 'A Coruña', city: 'Culleredo',
    address: 'Parque Empresarial Alvedro, Calle A, Nave 29, 15180 Culleredo (A Coruña)',
    location: [43.3017, -8.3825],
    phone: '+34 981 671 122',
    email: 'contacto@alumaticnorte.com',
    website: 'https://www.alumaticnorte.com',
    sector: 'Pérgolas bioclimáticas y protección solar de aluminio',
    products: ['Pérgolas bioclimáticas', 'Toldos y cerramientos', 'Carpintería de aluminio'],
    profileType: 'Protección solar / Pérgolas',
    notes: 'Distribuidor/instalador Renson en Galicia.',
  },
];

// ---------- Enriquecimiento de los 4 ya existentes ----------
const ENRICH = {
  'PROP-LEAD26-0429': { city: 'Lorca', notes_append: 'Incluida de nuevo en lote del 04-11-2026 (ya existía).' },
  'PROP-LEAD26-0479': { city: 'Campo de Criptana', notes_append: 'Incluida de nuevo en lote del 04-11-2026 (ya existía).' },
  'PROP-LEAD26-0192': { notes_append: 'Incluida de nuevo en lote del 04-11-2026 (ya existía).' },
  'PROP-LEAD26-0384': { notes_append: 'Incluida de nuevo en lote del 04-11-2026 (ya existía).' },
};

// ---------- Ejecución ----------
function main() {
  const db = JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));
  const existingDomains = new Set(db.map((d) => domainOf(d.website || d.web)));

  let added = 0;
  NEW_COMPANIES.forEach((c, i) => {
    if (existingDomains.has(domainOf(c.website))) {
      console.log(`⏭  Duplicado, omitido: ${c.name}`);
      return;
    }
    db.push(buildProspect(c, i));
    added++;
    console.log(`✅ Añadido: ${c.name}`);
  });

  let enriched = 0;
  db.forEach((d) => {
    const e = ENRICH[d.id];
    if (!e) return;
    if (e.city && !d.city) d.city = e.city;
    if (e.notes_append && !(d.notes || '').includes(e.notes_append)) {
      d.notes = `${d.notes || ''} ${e.notes_append}`.trim();
    }
    enriched++;
  });

  fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2), 'utf8');
  console.log(`\nNuevos: ${added} | Enriquecidos: ${enriched} | Total: ${db.length}`);
}

main();

