/**
 * scripts/patch_pipeline_search.cjs
 * ---------------------------------------------------------------------
 * Añade al Pipeline de Ventas (Kanban) de src/App.jsx:
 *   1. Buscador por nombre/CIF.
 *   2. Índice alfabético A-Z (filtro por inicial del nombre).
 * Trabaja normalizando a LF y restaura CRLF al guardar. Idempotente.
 * Uso: node scripts/patch_pipeline_search.cjs
 * ---------------------------------------------------------------------
 */
const fs = require('fs');
const path = require('path');

const APP = path.join(__dirname, '..', 'src', 'App.jsx');
const raw = fs.readFileSync(APP, 'utf8');
const usesCRLF = raw.includes('\r\n');
let src = raw.replace(/\r\n/g, '\n');

if (src.includes('pipelineLetter, setPipelineLetter')) {
  console.log('ℹ️  El parche ya estaba aplicado.');
  process.exit(0);
}

/** Reemplaza un fragmento exacto o aborta si no se encuentra. */
function replaceOnce(target, replacement, label) {
  if (!src.includes(target)) throw new Error(`No se encontró el bloque: ${label}`);
  src = src.replace(target, replacement);
  console.log(`✅ ${label}`);
}

// 1. Estado + filtro en pipelineProspects
replaceOnce(
`  const pipelineProspects = useMemo(() => {
    const result = userProspects.filter(p => {
      const matchZone = filterZone === '' || p.zone === filterZone;
      const matchSector = filterSector === '' || p.sector === filterSector;
      return matchZone && matchSector;
    });`,
`  // Búsqueda alfabética del Pipeline: texto libre (nombre/CIF) e inicial A-Z
  const [pipelineSearch, setPipelineSearch] = useState('');
  const [pipelineLetter, setPipelineLetter] = useState(''); // '' = todas, '#' = número/símbolo

  /** Inicial normalizada (sin acentos, mayúscula) del nombre; '#' si no es letra. */
  const getInitialLetter = (name = '') => {
    const first = String(name).trim().charAt(0).normalize('NFD').replace(/[\\u0300-\\u036f]/g, '').toUpperCase();
    return /[A-Z]/.test(first) ? first : '#';
  };

  const pipelineProspects = useMemo(() => {
    const q = pipelineSearch.trim().toLowerCase();
    const result = userProspects.filter(p => {
      const matchZone = filterZone === '' || p.zone === filterZone;
      const matchSector = filterSector === '' || p.sector === filterSector;
      const matchSearch = q === '' ||
        (p.name || '').toLowerCase().includes(q) ||
        (p.cif || '').toLowerCase().includes(q);
      const matchLetter = pipelineLetter === '' || getInitialLetter(p.name) === pipelineLetter;
      return matchZone && matchSector && matchSearch && matchLetter;
    });`,
  'Estado y filtro de búsqueda en pipelineProspects'
);

// 2. UI: buscador + índice A-Z bajo los filtros del Pipeline
replaceOnce(
`                    <option value="revenue-asc">Facturación (Asc.)</option>
                  </select>
                </div>
              </div>
              <div className="pipeline-container"`,
`                    <option value="revenue-asc">Facturación (Asc.)</option>
                  </select>
                </div>
                {/* Buscador por nombre o CIF dentro del Pipeline */}
                <div className="filter-group">
                  <label>Buscar empresa</label>
                  <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                    <input
                      type="text"
                      placeholder="Nombre o CIF..."
                      value={pipelineSearch}
                      onChange={e => setPipelineSearch(e.target.value)}
                      style={{ width: '100%', padding: '8px 28px 8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', backgroundColor: '#ffffff', color: '#0f172a' }}
                    />
                    {pipelineSearch && (
                      <button onClick={() => setPipelineSearch('')} title="Limpiar búsqueda"
                        style={{ position: 'absolute', right: '6px', background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', fontSize: '14px' }}>✕</button>
                    )}
                  </div>
                </div>
              </div>

              {/* Índice alfabético: filtra el Kanban por la inicial del nombre */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginBottom: '15px', alignItems: 'center' }}>
                <span style={{ fontSize: '0.78rem', color: '#475569', fontWeight: 600, marginRight: '6px' }}>Inicial:</span>
                {['', ...'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split(''), '#'].map(letter => {
                  const active = pipelineLetter === letter;
                  return (
                    <button
                      key={letter || 'all'}
                      onClick={() => setPipelineLetter(letter)}
                      title={letter === '' ? 'Todas las letras' : letter === '#' ? 'Empiezan por número o símbolo' : \`Empresas que empiezan por \${letter}\`}
                      style={{
                        minWidth: letter === '' ? '52px' : '28px', padding: '4px 6px', borderRadius: '6px', cursor: 'pointer',
                        fontSize: '0.75rem', fontWeight: 700,
                        border: active ? '1px solid var(--sopena-blue)' : '1px solid #cbd5e1',
                        background: active ? 'var(--sopena-blue)' : '#ffffff',
                        color: active ? '#ffffff' : '#334155'
                      }}
                    >
                      {letter === '' ? 'Todas' : letter}
                    </button>
                  );
                })}
                <span style={{ fontSize: '0.75rem', color: '#64748b', marginLeft: '8px' }}>
                  {pipelineProspects.length} empresas
                </span>
              </div>

              <div className="pipeline-container"`,
  'Buscador e índice A-Z en la UI del Pipeline'
);

fs.writeFileSync(APP, usesCRLF ? src.replace(/\n/g, '\r\n') : src, 'utf8');
console.log('💾 src/App.jsx guardado');

