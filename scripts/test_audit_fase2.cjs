/**
 * test_audit_fase2.cjs
 * ---------------------------------------------------------------
 * Prueba de humo de la auditoría (Fase 2):
 *  1. Modifica un campo de un prospecto (con cabeceras x-app-user/source).
 *  2. Lo restaura a su valor original.
 *  3. Lee el historial vía RPC get_record_audit y comprueba que
 *     ambos cambios quedaron registrados con autor y diff.
 *
 * Uso:  node scripts/test_audit_fase2.cjs [ID_PROSPECTO]
 * ---------------------------------------------------------------
 */
const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Carga mínima de .env
fs.readFileSync(path.join(__dirname, '..', '.env'), 'utf8').split(/\r?\n/).forEach((l) => {
  const m = /^\s*([\w.]+)\s*=\s*(.*)\s*$/.exec(l);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
});

const ID = process.argv[2] || 'PROP-LEAD26-0001';
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY, {
  auth: { persistSession: false },
  global: { headers: { 'x-app-user': 'Test Auditoria', 'x-app-source': 'script:test_audit' } },
});

async function main() {
  const { data: before, error: e0 } = await supabase.from('prospects').select('id,name,response').eq('id', ID).single();
  if (e0) throw e0;
  console.log(`🎯 ${before.id} · ${before.name} · response="${before.response}"`);

  const marker = `[TEST AUDIT ${new Date().toISOString()}]`;
  const { error: e1 } = await supabase.from('prospects').update({ response: marker }).eq('id', ID);
  if (e1) throw e1;
  const { error: e2 } = await supabase.from('prospects').update({ response: before.response }).eq('id', ID);
  if (e2) throw e2;
  console.log('✏️  Campo modificado y restaurado');

  const { data: log, error: e3 } = await supabase.rpc('get_record_audit', { p_record_id: ID, p_limit: 5 });
  if (e3) throw e3;
  log.forEach((r) => console.log(`📜 ${r.created_at} | ${r.operation} | ${r.actor_name} | ${r.source} | ${JSON.stringify(r.changed_fields)}`));

  const ok = log.filter((r) => r.source === 'script:test_audit' && r.changed_fields?.response).length >= 2;
  console.log(ok ? '\n✅ AUDITORÍA OPERATIVA' : '\n❌ No se encontraron los registros esperados');
  if (!ok) process.exit(1);
}

main().catch((e) => { console.error('💥', e.message || e); process.exit(1); });
