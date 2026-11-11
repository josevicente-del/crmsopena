/**
 * scripts/lib/prospectSync.cjs
 * ---------------------------------------------------------------------
 * Módulo reutilizable para incorporar lotes de empresas verificadas en:
 *  1) La base de datos local src/data/prospects.json (con deduplicación)
 *  2) La tabla public.prospects de Supabase PostgreSQL (con cabeceras de auditoría)
 *
 * Garantiza formato uniforme compatible con el Kanban ('pipelineStage: Lead'),
 * los filtros por zona de la aplicación y la política CRM de no inventar
 * facturación no auditada (revenue: null salvo dato oficial verificado).
 * ---------------------------------------------------------------------
 */

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const DEFAULT_DB_PATH = path.join(__dirname, '..', '..', 'src', 'data', 'prospects.json');
const DEFAULT_ENV_PATH = path.join(__dirname, '..', '..', '.env');

/**
 * Carga variables de entorno desde .env si aún no están definidas en process.env.
 */
function loadEnvFile(envFilePath = DEFAULT_ENV_PATH) {
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
 * Normaliza una URL o dominio a su raíz en minúsculas (sin protocolo, sin www., sin rutas)
 * para comparar dominios de forma fiable evitando falsos negativos en deduplicación.
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
 * Construye el registro JSON completo compatible con src/data/prospects.json.
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
    revenue: comp.revenue ?? null,
    tier: comp.tier,
    b2bTier: comp.tier,
    purchasingManager: comp.purchasingManager || 'Responsable de Compras y Suministros',
    purchasingPhone: comp.purchasingPhone || '',
    purchasingLinkedin: comp.purchasingLinkedin || '',
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
    pipelineStage: comp.pipelineStage || 'Lead',
    certamen: comp.certamen || null,
    emailableStatus: 'unverified',
    tasks: [],
    history: [],
    version: 1
  };
}

/**
 * Construye la fila snake_case para la tabla public.prospects de Supabase PostgreSQL.
 */
function buildSupabaseRow(comp, sourceTag) {
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
    revenue: comp.revenue ?? null,
    tier: comp.tier,
    b2b_tier: comp.tier,
    purchasing_manager: comp.purchasingManager || 'Responsable de Compras y Suministros',
    sector: comp.sector,
    products: Array.isArray(comp.products) ? comp.products.join(' | ') : (comp.products || ''),
    profile_type: comp.profileType,
    alloy: comp.alloy,
    finish: comp.finish,
    contacted: false,
    notes: comp.notes,
    email_verified: Boolean(comp.email),
    email_status: 'unverified',
    pipeline_stage: comp.pipelineStage || 'Lead',
    source: sourceTag
  };
}

/**
 * Inicializa el cliente Supabase con las cabeceras de auditoría estándar del proyecto.
 */
function createAuditedSupabaseClient({ appUser, appSource, envPath = DEFAULT_ENV_PATH }) {
  loadEnvFile(envPath);

  if (!process.env.VITE_SUPABASE_URL || !process.env.VITE_SUPABASE_ANON_KEY) {
    throw new Error('Faltan VITE_SUPABASE_URL o VITE_SUPABASE_ANON_KEY en .env o entorno.');
  }

  return createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY, {
    auth: { persistSession: false },
    global: {
      headers: {
        'x-app-user': appUser,
        'x-app-source': appSource
      }
    }
  });
}

/**
 * Sincroniza un lote de empresas en prospects.json y Supabase, devolviendo un resumen.
 */
async function syncProspectBatch(companies, { appUser, appSource, dbPath = DEFAULT_DB_PATH, envPath = DEFAULT_ENV_PATH }) {
  const supabase = createAuditedSupabaseClient({ appUser, appSource, envPath });

  // 1. Leer base local e indexar identificadores, CIFs y dominios existentes
  const db = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
  const existingIds = new Set(db.map(item => String(item.id)));
  const existingCifs = new Set(db.map(item => (item.cif || '').trim().toUpperCase()).filter(Boolean));
  const existingDomains = new Set();

  db.forEach(item => {
    const d1 = normalizeDomain(item.web);
    const d2 = normalizeDomain(item.website);
    if (d1) existingDomains.add(d1);
    if (d2) existingDomains.add(d2);
  });

  // 2. Filtrar e insertar únicamente empresas no duplicadas
  const nowIso = new Date().toISOString();
  const inserted = [];
  const skipped = [];

  for (const comp of companies) {
    const normCif = (comp.cif || '').trim().toUpperCase();
    const domWeb = normalizeDomain(comp.web);
    const domWebsite = normalizeDomain(comp.website);

    const isDuplicate =
      existingIds.has(comp.id) ||
      (normCif && existingCifs.has(normCif)) ||
      (domWeb && existingDomains.has(domWeb)) ||
      (domWebsite && existingDomains.has(domWebsite));

    if (isDuplicate) {
      skipped.push(comp.name);
      continue;
    }

    db.push(buildJsonRecord(comp, nowIso));
    existingIds.add(comp.id);
    if (normCif) existingCifs.add(normCif);
    if (domWeb) existingDomains.add(domWeb);
    if (domWebsite) existingDomains.add(domWebsite);
    inserted.push(comp);
  }

  // 3. Persistir archivo JSON local
  fs.writeFileSync(dbPath, JSON.stringify(db, null, 2), 'utf8');

  // 4. Sincronizar registros en Supabase PostgreSQL
  const rowsToSync = (inserted.length > 0 ? inserted : companies).map(c => buildSupabaseRow(c, appSource));
  const { error } = await supabase.from('prospects').upsert(rowsToSync, { onConflict: 'id' });

  if (error) {
    throw new Error(`Error sincronizando con Supabase: ${error.message}`);
  }

  return {
    addedCount: inserted.length,
    skipped,
    totalJsonCount: db.length,
    syncedCount: rowsToSync.length
  };
}

/**
 * Enriquece un registro existente por ID en prospects.json y Supabase sin duplicarlo.
 */
async function enrichExistingProspect(
  id,
  jsonPatch,
  supabasePatch,
  { appUser, appSource, dbPath = DEFAULT_DB_PATH, envPath = DEFAULT_ENV_PATH }
) {
  const supabase = createAuditedSupabaseClient({ appUser, appSource, envPath });
  const db = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
  const targetIndex = db.findIndex(item => String(item.id) === String(id));

  if (targetIndex === -1) {
    throw new Error(`No se encontró el registro ${id} en ${dbPath}`);
  }

  db[targetIndex] = { ...db[targetIndex], ...jsonPatch };
  fs.writeFileSync(dbPath, JSON.stringify(db, null, 2), 'utf8');

  const { error } = await supabase.from('prospects').update(supabasePatch).eq('id', id);
  if (error) {
    throw new Error(`Error actualizando ${id} en Supabase: ${error.message}`);
  }

  return { id, totalJsonCount: db.length };
}

module.exports = {
  normalizeDomain,
  buildJsonRecord,
  buildSupabaseRow,
  syncProspectBatch,
  enrichExistingProspect
};

