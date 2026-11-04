/**
 * migrate_json_to_supabase.cjs
 * ---------------------------------------------------------------
 * Fase 1 – Vuelca src/data/prospects.json a Supabase.
 *
 *  - Upsert por lotes (idempotente: re-ejecutable sin duplicar).
 *  - Mapea camelCase (JSON) → snake_case (Postgres).
 *  - Campos no mapeados se guardan en la columna jsonb `extra`.
 *  - Normaliza tasks/history a sus tablas si existen.
 *  - Verifica recuento final JSON vs Supabase.
 *
 * Credenciales (.env):
 *   VITE_SUPABASE_URL           (obligatoria)
 *   SUPABASE_SERVICE_ROLE_KEY   (recomendada; si falta usa VITE_SUPABASE_ANON_KEY)
 *
 * Uso:  node scripts/migrate_json_to_supabase.cjs [--dry-run]
 * ---------------------------------------------------------------
 */
const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const ROOT = path.join(__dirname, '..');
const DB_PATH = path.join(ROOT, 'src', 'data', 'prospects.json');
const BATCH = 100;
const DRY_RUN = process.argv.includes('--dry-run');

// ---------- Carga mínima de .env (sin dependencias extra) ----------
function loadEnv() {
  const file = path.join(ROOT, '.env');
  if (!fs.existsSync(file)) return;
  fs.readFileSync(file, 'utf8').split(/\r?\n/).forEach((line) => {
    const m = /^\s*([\w.]+)\s*=\s*(.*)\s*$/.exec(line);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
  });
}

// ---------- Mapeo JSON → columnas ----------
/** Columnas reales de public.prospects y el campo JSON del que salen. */
const COLUMN_MAP = {
  id: 'id', name: 'name', cif: 'cif', zone: 'zone', department: 'department',
  city: 'city', address: 'address', revenue: 'revenue', tier: 'tier',
  b2b_tier: 'b2bTier', sector: 'sector', products: 'products', email: 'email',
  secondary_email: 'secondaryEmail', phone: 'phone', web: 'web',
  website: 'website', purchasing_manager: 'purchasingManager',
  purchasing_phone: 'purchasingPhone', purchasing_linkedin: 'purchasingLinkedin',
  pipeline_stage: 'pipelineStage', contacted: 'contacted',
  contact_date: 'contactDate', location: 'location', notes: 'notes',
  profile_type: 'profileType', alloy: 'alloy', finish: 'finish',
  certamen: 'certamen', email_verified: 'emailVerified',
  email_status: 'emailableStatus', response: 'response', created_at: 'createdAt',
};
const USED_KEYS = new Set([...Object.values(COLUMN_MAP), 'tasks', 'history', 'lat', 'lng']);

/** Convierte un prospecto del JSON en una fila para Postgres. */
function toRow(p) {
  const row = { source: 'migration_json' };
  for (const [col, key] of Object.entries(COLUMN_MAP)) {
    if (p[key] !== undefined) row[col] = p[key];
  }
  row.web = row.web || p.website || null;                 // `web` alimenta la columna `domain`
  if (!row.location && p.lat != null) row.location = [p.lat, p.lng];
  if (Array.isArray(row.products)) row.products = row.products.join(' | ');
  if (row.revenue === '' ) row.revenue = null;
  // Todo lo no mapeado se conserva en `extra` (no se pierde información)
  row.extra = Object.fromEntries(Object.entries(p).filter(([k]) => !USED_KEYS.has(k)));
  return row;
}

/** Deduplica por dominio dentro del propio JSON (gana el registro más completo). */
function dedupeByDomain(rows) {
  const domainOf = (u = '') => u.toLowerCase().replace(/^https?:\/\/(www\.)?/, '').split('/')[0];
  const filled = (r) => Object.values(r).filter((v) => v !== null && v !== '' && v !== undefined).length;
  const byDomain = new Map(); const out = []; const dropped = [];
  rows.forEach((r) => {
    const d = domainOf(r.web || '');
    if (!d) return out.push(r);
    const prev = byDomain.get(d);
    if (!prev) { byDomain.set(d, r); out.push(r); return; }
    const keep = filled(r) > filled(prev) ? r : prev;
    const drop = keep === r ? prev : r;
    if (keep === r) out[out.indexOf(prev)] = r;
    byDomain.set(d, keep);
    dropped.push(`${drop.id} (${drop.name}) ≡ ${keep.id} [${d}]`);
  });
  return { rows: out, dropped };
}

async function main() {
  loadEnv();
  const url = process.env.VITE_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error('Faltan VITE_SUPABASE_URL / clave en .env');
  console.log(`🔑 Usando clave: ${process.env.SUPABASE_SERVICE_ROLE_KEY ? 'service_role' : 'anon'}`);

  const supabase = createClient(url, key, { auth: { persistSession: false } });
  const json = JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));

  // 1. Integridad previa: IDs únicos
  const ids = new Set();
  const dupIds = json.filter((p) => (ids.has(p.id) ? true : (ids.add(p.id), false)));
  if (dupIds.length) throw new Error(`IDs duplicados en JSON: ${dupIds.map((d) => d.id).join(', ')}. Ejecuta scripts/fix_duplicate_ids.cjs`);

  // 2. Transformar + deduplicar por dominio
  const { rows, dropped } = dedupeByDomain(json.map(toRow));
  console.log(`📦 JSON: ${json.length} | a migrar: ${rows.length} | duplicados por dominio: ${dropped.length}`);
  dropped.forEach((d) => console.log('   ⚠️ ', d));
  if (DRY_RUN) return console.log('(dry-run: no se escribe nada)');

  // 3. Upsert por lotes
  let ok = 0; const failed = [];
  for (let i = 0; i < rows.length; i += BATCH) {
    const chunk = rows.slice(i, i + BATCH);
    const { error } = await supabase.from('prospects').upsert(chunk, { onConflict: 'id' });
    if (!error) { ok += chunk.length; process.stdout.write(`\r⬆️  ${ok}/${rows.length}`); continue; }
    // Si falla el lote, reintenta fila a fila para aislar el registro problemático
    for (const r of chunk) {
      const { error: e } = await supabase.from('prospects').upsert(r, { onConflict: 'id' });
      if (e) failed.push(`${r.id}: ${e.message}`); else ok++;
    }
  }
  console.log(`\n✅ Upsert OK: ${ok} | ❌ Fallidos: ${failed.length}`);
  failed.slice(0, 20).forEach((f) => console.log('   ', f));

  // 4. Tasks e history normalizadas (solo si las tablas existen)
  const tasks = json.flatMap((p) => (p.tasks || []).map((t) => ({
    prospect_id: p.id, title: t.title || t.text || 'Tarea', description: t.description || null,
    due_date: t.dueDate || t.date || null, done: !!(t.done || t.completed),
  })));
  const history = json.flatMap((p) => (p.history || []).map((h) => ({
    prospect_id: p.id, event_type: h.type || 'note', description: h.description || h.text || null,
    event_date: h.date || new Date().toISOString(),
  })));
  for (const [table, data] of [['tasks', tasks], ['prospect_history', history]]) {
    if (!data.length) { console.log(`ℹ️  ${table}: sin datos en JSON`); continue; }
    // Idempotencia: solo se cargan si la tabla está vacía (evita duplicar en re-ejecuciones)
    const { count: existing, error: cErr } = await supabase.from(table).select('id', { count: 'exact', head: true });
    if (cErr) { console.log(`⚠️  ${table}: ${cErr.message} (¿migración SQL aplicada?)`); continue; }
    if (existing > 0) { console.log(`⏭  ${table}: ya contiene ${existing} filas, se omite`); continue; }
    const { error } = await supabase.from(table).insert(data);
    console.log(error ? `⚠️  ${table}: ${error.message}` : `✅ ${table}: ${data.length} filas`);
  }

  // 5. Verificación de recuento
  const { count, error } = await supabase.from('prospects').select('id', { count: 'exact', head: true });
  if (error) throw error;
  const expected = rows.length;
  console.log(`\n🔎 Supabase: ${count} | Esperado (≥): ${expected} → ${count >= expected ? '✅ OK' : '❌ DESCUADRE'}`);
}

main().catch((e) => { console.error('💥', e.message); process.exit(1); });
