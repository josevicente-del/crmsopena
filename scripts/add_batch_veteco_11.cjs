/**
 * scripts/add_batch_veteco_11.cjs
 * ---------------------------------------------------------------------
 * Script reutilizable de incorporación de 11 empresas aprobadas del
 * catálogo oficial de VETECO / Semana de la Construcción (IFEMA).
 *
 * Funciones principales:
 * 1. Normaliza dominios e IDs para prevenir duplicados frente a prospects.json.
 * 2. Construye registros normalizados compatibles con el esquema del CRM y Kanban
 *    (pipelineStage = 'Lead' para visibilidad directa en la primera columna).
 * 3. Actualiza c:\Users\usuario\Desktop\carmen\src\data\prospects.json.
 * 4. Sincroniza vía upsert con Supabase PostgreSQL (public.prospects) enviando
 *    cabeceras de auditoría (x-app-user, x-app-source).
 * ---------------------------------------------------------------------
 */

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const DB_PATH = path.join(__dirname, '..', 'src', 'data', 'prospects.json');
const ENV_PATH = path.join(__dirname, '..', '.env');

/**
 * Carga variables de entorno desde .env si no existen en process.env.
 */
function loadEnvFile(envFilePath) {
  if (!fs.existsSync(envFilePath)) return;
  fs.readFileSync(envFilePath, 'utf8')
    .split(/\r?\n/)
    .forEach(line => {
      const match = /^\s*([\w.]+)\s*=\s*(.*)\s*$/.exec(line);
      if (match && !process.env[match[1]]) {
        process.env[match[1]] = match[2].replace(/^["']|["']$/g, '');
      }
    });
}

/**
 * Extrae un dominio raíz normalizado (sin protocolo, sin www., sin rutas)
 * para realizar comprobaciones fiables de anti-duplicidad.
 */
function normalizeDomain(rawUrl) {
  if (!rawUrl || typeof rawUrl !== 'string') return '';
  return rawUrl
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, '')
    .replace(/^www\./, '')
    .split('/')[0]
    .split('?')[0];
}

/**
 * Transforma una definición compacta de empresa en un objeto completo
 * compatible con src/data/prospects.json.
 */
function buildJsonRecord(comp, nowIso) {
  return {
    id: comp.id,
    name: comp.name,
    cif: comp.cif || '',
    zone: comp.zone,
    department: comp.department,
    city: comp.city,
    address: comp.address,
    location: comp.location,
    lat: comp.location[0],
    lng: comp.location[1],
    phone: comp.phone || '',
    email: comp.email || '',
    secondaryEmail: comp.secondaryEmail || null,
    web: comp.web,
    website: comp.website || comp.web,
    revenue: null, // Política CRM: sin facturación auditada exacta, mantener null
    tier: comp.tier,
    b2bTier: comp.tier,
    purchasingManager: 'Responsable de Compras y Suministros',
    purchasingPhone: '',
    purchasingLinkedin: '',
    sector: comp.sector,
    products: comp.products,
    profileType: comp.profileType,
    alloy: comp.alloy,
    finish: comp.finish,
    contacted: false,
    contactDate: null,
    emailVerified: Boolean(comp.email),
    emailVerifiedType: comp.email ? 'corporate_official' : null,
    response: 'Pendiente de primer contacto comercial',
    notes: comp.notes,
    createdAt: nowIso,
    pipelineStage: 'Lead',
    certamen: 'VETECO 2026 (IFEMA)',
    emailableStatus: 'unverified',
    tasks: [],
    history: [],
    version: 1
  };
}

/**
 * Transforma una definición de empresa en una fila compatible con la tabla
 * public.prospects de Supabase PostgreSQL (columnas snake_case).
 */
function buildSupabaseRow(comp) {
  return {
    id: comp.id,
    name: comp.name,
    cif: comp.cif || null,
    zone: comp.zone,
    department: comp.department,
    city: comp.city,
    address: comp.address,
    location: comp.location,
    phone: comp.phone || null,
    email: comp.email || null,
    secondary_email: comp.secondaryEmail || null,
    web: comp.web,
    website: comp.website || comp.web,
    revenue: null,
    tier: comp.tier,
    b2b_tier: comp.tier,
    purchasing_manager: 'Responsable de Compras y Suministros',
    sector: comp.sector,
    products: comp.products.join(' | '),
    profile_type: comp.profileType,
    alloy: comp.alloy,
    finish: comp.finish,
    contacted: false,
    notes: comp.notes,
    email_verified: Boolean(comp.email),
    email_status: 'unverified',
    pipeline_stage: 'Lead',
    source: 'script:add_batch_veteco_11'
  };
}

// Listado verificado de las 11 empresas aprobadas por el usuario
const APPROVED_VETECO_COMPANIES = [
  {
    id: 'PROP-LEAD26-VETECO26-01',
    name: 'Emac Complementos, S.L. (EMAC Grupo)',
    cif: 'B46401675',
    zone: 'Comunidad Valenciana',
    department: 'Quart de Poblet (Valencia)',
    city: 'Quart de Poblet',
    address: 'Avda. de Madrid, 6, 46930 Quart de Poblet (Valencia)',
    location: [39.4822, -0.4435],
    phone: '+34 961 532 200',
    email: 'info@emac.es',
    web: 'https://www.emac.es',
    website: 'https://www.emac.es',
    tier: 'Tier 1',
    sector: 'Perfilería Técnica y Remates de Aluminio Extruido',
    products: [
      'Perfiles técnicos de aluminio extruido',
      'Juntas de dilatación y remates',
      'Sistemas de accesibilidad y seguridad',
      'Rodapiés y cantoneras de aluminio'
    ],
    profileType: 'Perfilería Técnica / Remates Arquitectónicos',
    alloy: '6063-T5 / 6060-T6',
    finish: 'Anodizado plata/oro/bronce / Lacado',
    notes: 'Expositor VETECO 2026 (Stand 7B20 P07). Fabricante líder en perfilería técnica, juntas de dilatación y remates de aluminio extruido (30-40 empleados). Verificado Nov 2026.'
  },
  {
    id: 'PROP-LEAD26-VETECO26-02',
    name: 'Piva Group S.P.A. Sucursal en España',
    cif: 'W0055366I',
    zone: 'Castilla y Leon',
    department: 'Pelabravo (Salamanca)',
    city: 'Pelabravo',
    address: 'Carretera de Madrid Km 88,5, 37181 Pelabravo (Salamanca)',
    location: [40.9355, -5.5812],
    phone: '+34 923 10 78 80',
    email: 'info@pivagroupspa.com',
    web: 'https://pivagroupspa.es',
    website: 'https://pivagroupspa.com',
    tier: 'Tier 1',
    sector: 'Fabricación de Ventanas, Puertas y Carpintería Metálica',
    products: [
      'Ventanas y cerramientos de aluminio y PVC',
      'Puertas y portones metálicos',
      'Sistemas de protección solar y pérgolas',
      'Carpintería de acero y aluminio'
    ],
    profileType: 'Carpintería de Aluminio / Cerramientos',
    alloy: '6060-T66 / 6063-T5',
    finish: 'Lacado Qualicoat / Anodizado',
    notes: 'Expositor VETECO 2026 (Stand 10B26 P10). Grupo industrial con planta productiva en Pelabravo (Salamanca) especializada en carpintería de aluminio, acero y PVC. Verificado Nov 2026.'
  },
  {
    id: 'PROP-LEAD26-VETECO26-03',
    name: 'Ventanas Suvent, S.L. (SuVent)',
    cif: 'B45346798',
    zone: 'Castilla-La Mancha',
    department: 'Lominchar (Toledo)',
    city: 'Lominchar',
    address: 'P.I. Aluceda, Nave 3, 45212 Lominchar (Toledo)',
    location: [40.0886, -3.9631],
    phone: '+34 925 558 317',
    email: 'info@suvent.es',
    web: 'https://www.suvent.es',
    website: 'https://www.suvent.es/',
    tier: 'Tier 2',
    sector: 'Fabricación de Ventanas y Cerramientos',
    products: [
      'Ventanas practicables y correderas de aluminio',
      'Sistemas con rotura de puente térmico',
      'Cerramientos y puertas exteriores',
      'Cajones y compactos'
    ],
    profileType: 'Ventanas / Rotura de Puente Térmico',
    alloy: '6060-T66 / 6063-T5',
    finish: 'Lacado Qualicoat / Bicolor / Anodizado',
    notes: 'Expositor VETECO 2026 (Stand 10F26 P10). Fabricante industrial de ventanas y cerramientos con planta en Toledo (10-30 empleados). Verificado Nov 2026.'
  },
  {
    id: 'PROP-LEAD26-VETECO26-04',
    name: 'NFI - Nouvelles Fermetures International, Lda.',
    cif: 'PT510158161',
    zone: 'Portugal',
    department: 'Vila Nova de Famalicão / Trofa (Norte)',
    city: 'Fradelos (Vila Nova de Famalicão)',
    address: 'Rua Braziela, nº 51, 4760-564 Fradelos, Vila Nova de Famalicão / Rua de Timor, Arm 7A/8A, 4785-123 Trofa, Portugal',
    location: [41.3665, -8.5872],
    phone: '+351 252 412 734',
    email: 'nfi@gadoor.net',
    web: 'https://www.nfi.pt',
    website: 'https://www.nfi.pt',
    tier: 'Tier 1',
    sector: 'Carpintería de Aluminio, Portones, Pérgolas y Persianas',
    products: [
      'Portones seccionales y batientes de aluminio',
      'Pérgolas bioclimáticas de aluminio',
      'Vallas y celosías en aluminio extruido',
      'Persianas y cerramientos'
    ],
    profileType: 'Portones / Pérgolas Bioclimáticas / Perfilería',
    alloy: '6060-T6 / 6063-T5',
    finish: 'Lacado Texturizado Qualicoat / Anodizado',
    notes: 'Expositor VETECO 2026 (Stand 9B09 P09). Fabricante portugués de gran volumen (51-200 empleados) especializado en portones de aluminio, pérgolas y carpintería exterior. Verificado Nov 2026.'
  },
  {
    id: 'PROP-LEAD26-VETECO26-05',
    name: 'Chatron, Lda.',
    cif: 'PT503103446',
    zone: 'Portugal',
    department: 'Vale de Cambra (Aveiro)',
    city: 'Vale de Cambra',
    address: 'Travessa da Zona Industrial 1, nº 95, Rossio, 3730-601 Vale de Cambra, Portugal',
    location: [40.8465, -8.3958],
    phone: '+351 256 472 888',
    email: 'comercial@chatron.pt',
    secondaryEmail: 'comercial@chatron.es',
    web: 'https://www.chatron.pt',
    website: 'https://www.chatron.pt/es',
    tier: 'Tier 2',
    sector: 'Iluminación Natural, Ventilación y Difusores de Aluminio',
    products: [
      'Tubos solares y sistemas de iluminación natural',
      'Ventiladores y extractores de aluminio',
      'Lamas y difusores técnicos de ventilación',
      'Lucernarios y sistemas constructivos'
    ],
    profileType: 'Perfilería Técnica / Ventilación / Marcos',
    alloy: '6060-T5 / 6063-T5',
    finish: 'Anodizado natural / Lacado',
    notes: 'Expositor VETECO 2026 (Stand 7E01 P07). Fabricante portugués PME (20-49 empleados) de sistemas de iluminación natural, ventilación y difusores con componentes en aluminio. Verificado Nov 2026.'
  },
  {
    id: 'PROP-LEAD26-VETECO26-06',
    name: 'Valportas - Portas e Automatismos, S.A.',
    cif: 'PT503930229',
    zone: 'Portugal',
    department: 'Valongo (Porto)',
    city: 'Campo (Valongo)',
    address: 'Rua Central de Fervença, 945, 4440-034 Campo, Valongo, Portugal',
    location: [41.1815, -8.4692],
    phone: '+351 220 904 300',
    email: 'geral@valportas.pt',
    secondaryEmail: 'marketing@valportas.pt',
    web: 'https://www.valportas.pt',
    website: 'https://www.valportas.pt',
    tier: 'Tier 2',
    sector: 'Fabricación de Puertas Industriales y Residenciales de Aluminio',
    products: [
      'Puertas seccionales industriales y residenciales',
      'Portones batientes y correderos de aluminio',
      'Vallas y carpintería exterior de aluminio',
      'Automatismos y muelles de carga'
    ],
    profileType: 'Puertas Industriales / Portones Aluminio',
    alloy: '6063-T5 / 6060-T6',
    finish: 'Lacado Qualicoat / Anodizado',
    notes: 'Expositor VETECO 2026 (Stand 7G03 P07). Fabricante de puertas seccionales y portones de aluminio en el norte de Portugal con fuerte presencia en España. Verificado Nov 2026.'
  },
  {
    id: 'PROP-LEAD26-VETECO26-07',
    name: 'MultiWindows (Solblik - Soluções, Lda.)',
    cif: 'PT510082874',
    zone: 'Portugal',
    department: 'Sintra (Lisboa)',
    city: 'Mem Martins',
    address: 'Zona Industrial de São Carlos, Armazém 35, 2725-009 Algueirão-Mem Martins, Sintra, Portugal',
    location: [38.7955, -9.3385],
    phone: '+351 210 995 036',
    email: 'geral@multi-windows.com',
    web: 'https://www.multi-windows.com',
    website: 'https://www.multi-windows.com',
    tier: 'Tier 2',
    sector: 'Fabricación de Ventanas, Puertas y Cerramientos',
    products: [
      'Ventanas y puertas de aluminio y PVC',
      'Cerramientos minimalistas y correderas',
      'Fachadas y sistemas de acristalamiento'
    ],
    profileType: 'Ventanas / Caixilharia de Aluminio',
    alloy: '6060-T66 / 6063-T5',
    finish: 'Lacado Qualicoat / Anodizado',
    notes: 'Expositor VETECO 2026 (Stand 10B35A P10). Fabricante y montador portugués de carpintería y ventanas en aluminio y PVC (11-50 empleados) en área de Lisboa. Verificado Nov 2026.'
  },
  {
    id: 'PROP-LEAD26-VETECO26-08',
    name: 'Alubuild, Lda.',
    cif: 'PT515709220',
    zone: 'Portugal',
    department: 'Vila Verde (Braga)',
    city: 'Vila Verde',
    address: 'Rua da Indústria, nº 433, Mós, 4730-290 Vila Verde, Braga, Portugal',
    location: [41.6485, -8.4355],
    phone: '+351 253 142 750',
    email: 'geral@alubuild.com',
    web: 'https://alubuild.com',
    website: 'https://alubuild.com/es/',
    tier: 'Tier 2',
    sector: 'Panel Composite de Aluminio, Mecanizado y Fachadas Ventiladas',
    products: [
      'Subestructuras de aluminio extruido para fachada ventilada',
      'Perfilería de fijación para panel composite',
      'Paneles composite y sistemas arquitectónicos de aluminio'
    ],
    profileType: 'Subestructura Fachada Ventilada / Perfilería',
    alloy: '6060-T6 / 6063-T6',
    finish: 'Bruto / Anodizado / Lacado PVDF',
    notes: 'Expositor VETECO 2026 (Stand 10D12 P10). Fabricante y especialista portugués en fachada ventilada, subestructuras de aluminio extruido y panel composite. Verificado Nov 2026.'
  },
  {
    id: 'PROP-LEAD26-VETECO26-09',
    name: 'Entrance Fast Access Spain, S.L. (EFAFLEX Spain)',
    cif: 'B98505555',
    zone: 'Comunidad Valenciana',
    department: 'Alzira (Valencia)',
    city: 'Alzira',
    address: 'Carrer dels Llimoners, Nave 6H, 46600 Alzira (Valencia)',
    location: [39.1518, -0.4408],
    phone: '+34 962 01 31 03',
    email: 'info@efa-spain.es',
    secondaryEmail: 'ventas@efa-spain.es',
    web: 'https://www.efa-spain.es',
    website: 'https://www.efaflex.es',
    tier: 'Tier 2',
    sector: 'Puertas Industriales Rápidas de Lamas de Aluminio',
    products: [
      'Puertas rápidas de espiral con lamas de aluminio anodizado',
      'Guías y bastidores estructurales de aluminio extruido',
      'Puertas industriales de alta velocidad para logística y salas limpias'
    ],
    profileType: 'Lamas y Guías Industriales / Alta Velocidad',
    alloy: '6060-T6 / 6063-T6',
    finish: 'Anodizado E6/EV1 / Lacado RAL',
    notes: 'Expositor VETECO 2026 (Stand 7G15 P07). Partner oficial autorizado en España de puertas industriales rápidas EFAFLEX con lamas y guías de aluminio extruido. Verificado Nov 2026.'
  },
  {
    id: 'PROP-LEAD26-VETECO26-10',
    name: 'Claroflex (Distribuidora de Sistemas de Cierre, S.L.)',
    cif: 'B93405496',
    zone: 'Andalucia',
    department: 'Cártama (Málaga)',
    city: 'Cártama',
    address: 'C/ Nicolás Redondo, Parcela Nº 1, P.I. El Cerro de Cártama, 29570 Cártama (Málaga)',
    location: [36.7115, -4.6305],
    phone: '+34 952 42 71 41',
    email: 'info@claroflex.com',
    web: 'https://claroflex.com',
    website: 'https://claroflex.com',
    tier: 'Tier 1',
    sector: 'Cortinas de Cristal y Sistemas de Cerramiento en Aluminio',
    products: [
      'Cortinas de cristal sin perfiles verticales',
      'Sistemas correderos de aluminio para terrazas',
      'Pérgolas bioclimáticas y barandillas de aluminio'
    ],
    profileType: 'Cerramientos de Terraza / Cortinas de Cristal',
    alloy: '6063-T5 / 6060-T6',
    finish: 'Lacado Qualicoat / Anodizado',
    notes: 'Expositor VETECO 2026 (Stand 9A06 P09). Fabricante internacional con sede en Málaga de cortinas de cristal y perfilería de cerramiento (Grupo Claroflex Spain S.L. B72786189). Verificado Nov 2026.'
  },
  {
    id: 'PROP-LEAD26-VETECO26-11',
    name: 'AIG Grupo Industrias Aproxyma, S.L.',
    cif: 'B67745463',
    zone: 'Murcia',
    department: 'Murcia / Lorquí (Murcia)',
    city: 'Baños y Mendigo',
    address: 'Ctra. Murcia-San Javier RM-19, Km 0, P.I. Cartago, 30155 Baños y Mendigo (Murcia)',
    location: [37.8685, -1.1065],
    phone: '+34 968 022 891',
    email: 'contacto@aigindustrias.com',
    web: 'https://www.aigindustrias.com',
    website: 'https://www.aigindustrias.com',
    tier: 'Tier 2',
    sector: 'Fabricación de Lamas de Aluminio y Panel Composite para Fachadas',
    products: [
      'Lamas de aluminio extruido de protección solar',
      'Subestructuras de aluminio para fachadas ventiladas',
      'Celosías y revestimientos metálicos de aluminio'
    ],
    profileType: 'Lamas de Protección Solar / Fachadas',
    alloy: '6063-T5 / 6060-T6',
    finish: 'Lacado Qualicoat / Anodizado',
    notes: 'Expositor VETECO 2026 (Stand 9C11 P09). Fabricante en Murcia de lamas solares de aluminio extruido y revestimientos de fachada (también en P.I. Base 2000, Lorquí). Verificado Nov 2026.'
  }
];

async function main() {
  loadEnvFile(ENV_PATH);

  if (!process.env.VITE_SUPABASE_URL || !process.env.VITE_SUPABASE_ANON_KEY) {
    throw new Error('Faltan VITE_SUPABASE_URL o VITE_SUPABASE_ANON_KEY en .env o entorno.');
  }

  const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY, {
    auth: { persistSession: false },
    global: {
      headers: {
        'x-app-user': 'Script VETECO 2026',
        'x-app-source': 'script:add_batch_veteco_11'
      }
    }
  });

  // 1. Leer base de datos local y construir índices de deduplicación
  const db = JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));
  const existingIds = new Set(db.map(item => String(item.id)));
  const existingDomains = new Set();
  db.forEach(item => {
    const d1 = normalizeDomain(item.web);
    const d2 = normalizeDomain(item.website);
    if (d1) existingDomains.add(d1);
    if (d2) existingDomains.add(d2);
  });

  // 2. Incorporar solo empresas no duplicadas
  const nowIso = new Date().toISOString();
  const insertedCompanies = [];
  const skippedCompanies = [];

  for (const comp of APPROVED_VETECO_COMPANIES) {
    const domWeb = normalizeDomain(comp.web);
    const domWebsite = normalizeDomain(comp.website);
    const isDuplicateId = existingIds.has(comp.id);
    const isDuplicateDomain = (domWeb && existingDomains.has(domWeb)) || (domWebsite && existingDomains.has(domWebsite));

    if (isDuplicateId || isDuplicateDomain) {
      skippedCompanies.push(comp.name);
      continue;
    }

    db.push(buildJsonRecord(comp, nowIso));
    existingIds.add(comp.id);
    if (domWeb) existingDomains.add(domWeb);
    if (domWebsite) existingDomains.add(domWebsite);
    insertedCompanies.push(comp);
  }

  // 3. Guardar archivo JSON local
  fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2), 'utf8');
  console.log(`prospects.json actualizado. Añadidas: ${insertedCompanies.length}, Omitidas por duplicado: ${skippedCompanies.length}, Total registros: ${db.length}`);

  if (skippedCompanies.length > 0) {
    console.log('Omitidas:', skippedCompanies.join(', '));
  }

  // 4. Sincronizar en Supabase PostgreSQL
  const rowsToSync = (insertedCompanies.length > 0 ? insertedCompanies : APPROVED_VETECO_COMPANIES).map(buildSupabaseRow);
  const { error } = await supabase.from('prospects').upsert(rowsToSync, { onConflict: 'id' });

  if (error) {
    console.error('Error sincronizando con Supabase:', error.message);
    process.exit(1);
  }

  console.log(`Supabase sincronizado correctamente (${rowsToSync.length} registros).`);
}

main().catch(err => {
  console.error('Error fatal en script:', err);
  process.exit(1);
});

