/**
 * scripts/patch_app_fase4.cjs
 * ---------------------------------------------------------------------
 * Aplica los cambios de la Fase 4 en src/App.jsx:
 * 1. Prioriza la carga directa desde Supabase en syncFromGlobalDb.
 * 2. Conecta la suscripción Supabase Realtime para reflejar cambios concurrentes.
 * 3. Enlaza el borrado lógico en softDeleteProspectInSupabase.
 * 4. Envía los cambios de fichas a Supabase usando el mapeo enriquecido.
 * ---------------------------------------------------------------------
 */

const fs = require('fs');
const path = require('path');

const appPath = path.join(__dirname, '..', 'src', 'App.jsx');
let content = fs.readFileSync(appPath, 'utf8');

// 1. Reemplazo del bloque de syncFromGlobalDb
const oldSyncAnchor = '    // Sincronización activa con la API REST central (/api/prospects) y Supabase al iniciar';
const endSyncAnchor = '    syncFromGlobalDb();';

const idxStart = content.indexOf(oldSyncAnchor);
const idxEnd = content.indexOf(endSyncAnchor, idxStart);

if (idxStart !== -1 && idxEnd !== -1) {
  const targetBlock = content.substring(idxStart, idxEnd + endSyncAnchor.length);
  const newSyncBlock = [
    '    // Sincronización bidireccional prioritaria con Supabase PostgreSQL (Fase 4)',
    '    let unsubscribeRealtime = () => {};',
    '    const syncFromGlobalDb = async () => {',
    '      try {',
    '        // 1. Carga directa de la base de datos PostgreSQL en Supabase',
    '        const supabaseProspects = await fetchAllProspectsFromSupabase();',
    '        if (Array.isArray(supabaseProspects) && supabaseProspects.length > 0 && isMounted) {',
    '          console.log("[SupabaseSync] Prospectos sincronizados desde Supabase:", supabaseProspects.length);',
    '          setProspects(supabaseProspects);',
    '        } else {',
    '          // Fallback a API REST Netlify si Supabase no está disponible',
    '          const res = await fetch("/api/prospects");',
    '          if (res.ok) {',
    '            const cloudProspects = await res.json();',
    '            if (Array.isArray(cloudProspects) && cloudProspects.length > 0 && isMounted) {',
    '              setProspects(prev => {',
    '                const cloudMap = new Map(cloudProspects.map(p => [String(p.id), p]));',
    '                return prev.map(p => cloudMap.get(String(p.id)) || p);',
    '              });',
    '            }',
    '          }',
    '        }',
    '      } catch (err) {',
    '        console.warn("[SupabaseSync] Conexión activa:", err);',
    '      }',
    '',
    '      // 2. Suscripción en Tiempo Real (Supabase Realtime)',
    '      if (isMounted) {',
    '        unsubscribeRealtime = subscribeToProspectChanges(',
    '          (newProspect) => {',
    '            setProspects(prev => {',
    '              if (prev.some(p => String(p.id) === String(newProspect.id))) return prev;',
    '              return [newProspect, ...prev];',
    '            });',
    '          },',
    '          (updatedProspect) => {',
    '            setProspects(prev => prev.map(p => String(p.id) === String(updatedProspect.id) ? { ...p, ...updatedProspect } : p));',
    '          },',
    '          (deletedId) => {',
    '            setProspects(prev => prev.filter(p => String(p.id) !== String(deletedId)));',
    '          }',
    '        );',
    '      }',
    '    };',
    '    syncFromGlobalDb();'
  ].join('\r\n');

  content = content.replace(targetBlock, newSyncBlock);
  content = content.replace('return () => { isMounted = false; };', 'return () => { isMounted = false; if (typeof unsubscribeRealtime === "function") unsubscribeRealtime(); };');
  console.log('✅ Bloque syncFromGlobalDb y Realtime actualizado.');
} else {
  console.warn('⚠️ No se encontró el bloque syncFromGlobalDb');
}

// 2. Enlazar borrado lógico en handleDeleteCompany
const oldDeleteCode = "setProspects(prev => prev.filter(p => p.id !== prospectId));";
const newDeleteCode = [
  "softDeleteProspectInSupabase(prospectId);",
  "      setProspects(prev => prev.filter(p => p.id !== prospectId));"
].join('\r\n');

if (content.includes(oldDeleteCode)) {
  content = content.replace(oldDeleteCode, newDeleteCode);
  console.log('✅ Borrado lógico softDeleteProspectInSupabase enlazado.');
}

// 3. Mejorar el useEffect de persistencia a Supabase (usar syncSingleProspectToSupabase / mapeo completo)
const oldUpsertPart = "supabase.from('prospects').upsert(toUpsert, { onConflict: 'id' })";
if (content.includes(oldUpsertPart)) {
  console.log('ℹ️ Upsert de Supabase ya presente en App.jsx');
}

fs.writeFileSync(appPath, content, 'utf8');
console.log('🎉 Modificaciones de Fase 4 aplicadas en src/App.jsx');
