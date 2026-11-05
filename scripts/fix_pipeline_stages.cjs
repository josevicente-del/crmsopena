/**
 * scripts/fix_pipeline_stages.cjs
 * ---------------------------------------------------------------------
 * Corrige las empresas que no aparecían en el Kanban:
 *   1. App.jsx: añade normalizePipelineStage() y la usa en el Kanban,
 *      de modo que cualquier etapa desconocida/vacía cae en "Lead".
 *   2. prospects.json: "Prospección Inicial", vacío o ausente → "Lead".
 *   3. Supabase: mismo saneamiento en public.prospects (queda auditado).
 *   4. add_batch_13_empresas.cjs: los nuevos altas usarán "Lead".
 * Idempotente. Uso: node scripts/fix_pipeline_stages.cjs
 * ---------------------------------------------------------------------
 */
const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const ROOT = path.join(__dirname, '..');
const VALID_STAGES = ['Lead', 'Contactado', 'Propuesta', 'Cerrado Ganado', 'Cerrado Perdido'];
const LEGACY_STAGES = ['Prospección Inicial', 'Prospeccion Inicial', ''];

/** Lee un archivo de texto normalizando CRLF → LF; devuelve también el formato original. */
function readText(file) {
  const raw = fs.readFileSync(file, 'utf8');
  return { text: raw.replace(/\r\n/g, '\n'), crlf: raw.includes('\r\n') };
}
function writeText(file, text, crlf) {
  fs.writeFileSync(file, crlf ? text.replace(/\n/g, '\r\n') : text, 'utf8');
}

// ---------- 1. App.jsx ----------
function patchApp() {
  const file = path.join(ROOT, 'src', 'App.jsx');
  let { text, crlf } = readText(file);
  if (text.includes('const normalizePipelineStage')) return console.log('ℹ️  App.jsx ya normalizaba etapas');

  const anchor = '  const pipelineProspects = useMemo(() => {';
  if (!text.includes(anchor)) throw new Error('No se encontró pipelineProspects en App.jsx');
  text = text.replace(anchor,
`  // Columnas del Kanban. Cualquier etapa desconocida, antigua ("Prospección Inicial") o vacía
  // se muestra en "Lead" para que NINGUNA empresa quede fuera del tablero.
  const PIPELINE_STAGES = ${JSON.stringify(VALID_STAGES)};
  const normalizePipelineStage = (stage) => (PIPELINE_STAGES.includes(stage) ? stage : 'Lead');

${anchor}`);

  const before = text.split("(p.pipelineStage || 'Lead') === stage").length - 1;
  text = text.split("(p.pipelineStage || 'Lead') === stage").join('normalizePipelineStage(p.pipelineStage) === stage');
  writeText(file, text, crlf);
  console.log(`✅ App.jsx: helper añadido y ${before} filtros del Kanban normalizados`);
}

// ---------- 2. prospects.json ----------
function fixJson() {
  const file = path.join(ROOT, 'src', 'data', 'prospects.json');
  const db = JSON.parse(fs.readFileSync(file, 'utf8'));
  let n = 0;
  db.forEach((p) => {
    if (!VALID_STAGES.includes(p.pipelineStage)) { p.pipelineStage = 'Lead'; n++; }
  });
  fs.writeFileSync(file, JSON.stringify(db, null, 2), 'utf8');
  console.log(`✅ prospects.json: ${n} empresas pasadas a "Lead" (total ${db.length})`);
}

// ---------- 3. Supabase ----------
async function fixSupabase() {
  fs.readFileSync(path.join(ROOT, '.env'), 'utf8').split(/\r?\n/).forEach((l) => {
    const m = /^\s*([\w.]+)\s*=\s*(.*)\s*$/.exec(l);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
  });
  const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY, {
    auth: { persistSession: false },
    global: { headers: { 'x-app-user': 'script', 'x-app-source': 'script:fix_pipeline_stages' } },
  });

  const { data: a, error: e1 } = await supabase.from('prospects')
    .update({ pipeline_stage: 'Lead' }).in('pipeline_stage', LEGACY_STAGES).select('id');
  if (e1) throw e1;
  const { data: b, error: e2 } = await supabase.from('prospects')
    .update({ pipeline_stage: 'Lead' }).is('pipeline_stage', null).select('id');
  if (e2) throw e2;
  console.log(`✅ Supabase: ${a.length + b.length} empresas pasadas a "Lead"`);

  // Verificación: ninguna empresa activa fuera de las columnas válidas
  const { data: rest, error: e3 } = await supabase.from('prospects')
    .select('id,pipeline_stage').is('deleted_at', null).limit(5000);
  if (e3) throw e3;
  const out = rest.filter((r) => !VALID_STAGES.includes(r.pipeline_stage));
  console.log(out.length ? `⚠️  Siguen fuera del Kanban: ${out.length}` : `🔎 Supabase: ${rest.length} activas, todas en columnas válidas`);
}

// ---------- 4. Script de altas ----------
function patchBatchScript() {
  const file = path.join(ROOT, 'scripts', 'add_batch_13_empresas.cjs');
  if (!fs.existsSync(file)) return;
  let { text, crlf } = readText(file);
  if (!text.includes("'Prospección Inicial'")) return;
  writeText(file, text.replace("pipelineStage: 'Prospección Inicial'", "pipelineStage: 'Lead'"), crlf);
  console.log('✅ add_batch_13_empresas.cjs: nuevas altas en "Lead"');
}

(async () => {
  patchApp();
  fixJson();
  patchBatchScript();
  await fixSupabase();
})().catch((e) => { console.error('💥', e.message || e); process.exit(1); });

