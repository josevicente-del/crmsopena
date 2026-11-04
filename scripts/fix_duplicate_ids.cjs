/**
 * fix_duplicate_ids.cjs
 * ---------------------------------------------------------------
 * Fase 0 – Saneamiento previo a la migración a Supabase.
 * Detecta IDs repetidos en prospects.json y reasigna un ID nuevo y
 * único a la 2ª (y siguientes) apariciones. Deja traza en `notes`.
 *
 * Uso:  node scripts/fix_duplicate_ids.cjs [--dry-run]
 * ---------------------------------------------------------------
 */
const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, '..', 'src', 'data', 'prospects.json');
const DRY_RUN = process.argv.includes('--dry-run');

/** Genera el siguiente ID numérico libre con formato PROP-LEAD26-NNNN. */
function nextFreeId(usedIds) {
  let n = 1;
  usedIds.forEach((id) => {
    const m = /^PROP-LEAD26-(\d{4})$/.exec(id);
    if (m) n = Math.max(n, Number(m[1]) + 1);
  });
  return () => {
    let id;
    do { id = `PROP-LEAD26-${String(n++).padStart(4, '0')}`; } while (usedIds.has(id));
    usedIds.add(id);
    return id;
  };
}

function main() {
  const db = JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));
  const used = new Set(db.map((p) => p.id));
  const genId = nextFreeId(used);
  const seen = new Set();
  const changes = [];

  db.forEach((p) => {
    if (!seen.has(p.id)) { seen.add(p.id); return; }
    const oldId = p.id;
    p.id = genId();
    p.notes = `${p.notes || ''} [ID reasignado ${oldId} → ${p.id} por duplicado, ${new Date().toISOString().slice(0, 10)}]`.trim();
    changes.push(`${oldId} → ${p.id}  (${p.name})`);
  });

  if (!changes.length) return console.log('✅ Sin IDs duplicados.');
  changes.forEach((c) => console.log('🔁', c));
  if (!DRY_RUN) fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2), 'utf8');
  console.log(DRY_RUN ? '(dry-run, sin escribir)' : `💾 Guardado. Total registros: ${db.length}`);
}

main();

