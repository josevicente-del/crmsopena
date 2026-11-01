# -*- coding: utf-8 -*-
import sys
import re

app_path = "src/App.jsx"

with open(app_path, "r", encoding="utf-8", errors="replace") as f:
    content = f.read()

# -------------------------------------------------------------------------
# 1. Inyectar utilidades de Pipeline y Tiers antes de const App = () => {
# -------------------------------------------------------------------------
target_pre_app = "const App = () => {"

replacement_pre_app = """// =========================================================================
// SISTEMA INDUSTRIAL B2B: PIPELINE KANBAN (6 FASES) & LEAD SCORING TIERS
// =========================================================================

export const PIPELINE_STAGES = [
  { id: 'Prospección Inicial', label: '🎯 Prospección Inicial', color: '#64748b', desc: 'Identificado en CRM sin contacto' },
  { id: 'Contacto con Decisor', label: '📞 Contacto con Decisor', color: '#0284c7', desc: 'Compras o Técnico cualificado' },
  { id: 'Muestras / Tarifa Enviada', label: '📦 Muestras / Tarifa Enviada', color: '#8b5cf6', desc: 'Catálogo de perfiles o tarifas enviadas' },
  { id: 'Planos Recibidos (RFQ)', label: '📐 Planos Recibidos (RFQ)', color: '#f59e0b', desc: 'Petición de oferta con planos CAD' },
  { id: 'Oferta & Negociación', label: '💼 Oferta & Negociación', color: '#ea580c', desc: 'Presupuesto y condiciones comerciales' },
  { id: 'Cuenta Ganada', label: '🤝 Cuenta Ganada', color: '#10b981', desc: 'Cliente activo con pedidos regulares' },
  { id: 'Descartado / Perdido', label: '❌ Descartado / Perdido', color: '#ef4444', desc: 'No viable o sin interés' }
];

export const normalizePipelineStage = (stage) => {
  if (!stage || stage === 'Lead') return 'Prospección Inicial';
  if (stage === 'Contactado') return 'Contacto con Decisor';
  if (stage === 'Propuesta') return 'Oferta & Negociación';
  if (stage === 'Cerrado Ganado') return 'Cuenta Ganada';
  if (stage === 'Cerrado Perdido') return 'Descartado / Perdido';
  const found = PIPELINE_STAGES.find(s => s.id === stage);
  if (found) return found.id;
  return 'Prospección Inicial';
};

export const getLeadScore = (prospect) => {
  if (!prospect) return 0;
  let score = 0;

  // 1. Facturación (Hasta 45 puntos)
  const rev = Number(prospect.revenue) || 0;
  if (rev >= 10000000) score += 45;
  else if (rev >= 5000000) score += 30;
  else if (rev >= 2000000) score += 18;
  else if (rev > 0) score += 10;
  else score += 5;

  // 2. Calidad de contacto y accesibilidad comercial (Hasta 35 puntos)
  if (prospect.purchasingManager && prospect.purchasingManager.trim().length > 2 && !prospect.purchasingManager.toLowerCase().includes('desconocido')) {
    score += 15;
  }
  if (prospect.phone && prospect.phone.trim().length > 6) {
    score += 10;
  }
  if (prospect.email && !prospect.email.includes('placeholder') && prospect.emailVerified !== false) {
    score += 10;
  }

  // 3. Sector de alto volumen de extrusión de aluminio (20 puntos)
  const highVolumeSectors = [
    'Fachadas de Aluminio',
    'Fachadas Especiales',
    'Estructuras Solares',
    'Fabricantes de Carrocerias',
    'Cerramientos',
    'Puertas y Ventanas',
    'Construccion Modular',
    'Perfiles Estructurales Aluminio',
    'Sistemas de Proteccion Solar',
    'Puertas Industriales',
    'Transformacion de Chapa'
  ];
  if (highVolumeSectors.includes(prospect.sector)) {
    score += 20;
  } else {
    score += 10;
  }

  return Math.min(Math.max(score, 0), 100);
};

export const getLeadTier = (score) => {
  if (score >= 75) {
    return {
      tier: 'Tier 1',
      badge: '🥇 Tier 1 · Oro',
      shortLabel: 'Oro',
      color: '#b45309',
      bg: '#fef3c7',
      border: '#fcd34d',
      gradient: 'linear-gradient(135deg, #f59e0b 0%, #b45309 100%)'
    };
  }
  if (score >= 50) {
    return {
      tier: 'Tier 2',
      badge: '🥈 Tier 2 · Plata',
      shortLabel: 'Plata',
      color: '#334155',
      bg: '#f1f5f9',
      border: '#cbd5e1',
      gradient: 'linear-gradient(135deg, #64748b 0%, #334155 100%)'
    };
  }
  return {
    tier: 'Tier 3',
    badge: '🥉 Tier 3 · Bronce',
    shortLabel: 'Bronce',
    color: '#9a3412',
    bg: '#ffedd5',
    border: '#fed7aa',
    gradient: 'linear-gradient(135deg, #ea580c 0%, #9a3412 100%)'
  };
};

export const isLeadDormant = (prospect) => {
  if (!prospect) return false;
  const stage = normalizePipelineStage(prospect.pipelineStage);
  if (stage === 'Cuenta Ganada' || stage === 'Descartado / Perdido') return false;

  let lastDateMs = null;
  if (prospect.contactDate) {
    const d = new Date(prospect.contactDate).getTime();
    if (!isNaN(d)) lastDateMs = d;
  }
  if (Array.isArray(prospect.history) && prospect.history.length > 0) {
    for (let i = prospect.history.length - 1; i >= 0; i--) {
      const h = prospect.history[i];
      if (h && h.date) {
        const d = new Date(h.date).getTime();
        if (!isNaN(d) && (!lastDateMs || d > lastDateMs)) {
          lastDateMs = d;
          break;
        }
      }
    }
  }
  if (!lastDateMs && prospect.createdAt) {
    const d = new Date(prospect.createdAt).getTime();
    if (!isNaN(d)) lastDateMs = d;
  }

  if (!lastDateMs) {
    return Boolean(prospect.contacted);
  }

  const diffDays = (Date.now() - lastDateMs) / (1000 * 60 * 60 * 24);
  return diffDays >= 15;
};

const App = () => {"""

assert target_pre_app in content, "target_pre_app not found"
content = content.replace(target_pre_app, replacement_pre_app, 1)
print("1. Pre-App utilities injected.")

# -------------------------------------------------------------------------
# 2. Estados de filtro en App()
# -------------------------------------------------------------------------
target_state_filter = """  const [filterRevenue, setFilterRevenue] = useState('');
  const [filterNewOnly, setFilterNewOnly] = useState(false);
  // Estado para controlar el ordenamiento en la Base de Datos (por defecto alfabético A-Z)
  const [sortOrder, setSortOrder] = useState('alphabetical');
  // Estado para controlar el ordenamiento en el Pipeline de Ventas (por defecto alfabético A-Z)
  const [pipelineSortOrder, setPipelineSortOrder] = useState('alphabetical');"""

replacement_state_filter = """  const [filterRevenue, setFilterRevenue] = useState('');
  const [filterNewOnly, setFilterNewOnly] = useState(false);
  // Filtro inteligente por Prioridad / Tier B2B ('', 'hot20', 'tier1', 'tier2', 'tier3', 'dormant')
  const [filterTier, setFilterTier] = useState('');
  // Estado para controlar el ordenamiento en la Base de Datos (por defecto alfabético A-Z)
  const [sortOrder, setSortOrder] = useState('alphabetical');
  // Filtro de Tier específico para el Pipeline Kanban
  const [pipelineTierFilter, setPipelineTierFilter] = useState('');
  // Estado para controlar el ordenamiento en el Pipeline de Ventas (por defecto alfabético A-Z)
  const [pipelineSortOrder, setPipelineSortOrder] = useState('alphabetical');"""

assert target_state_filter in content, "target_state_filter not found"
content = content.replace(target_state_filter, replacement_state_filter, 1)
print("2. Filter states updated.")

# -------------------------------------------------------------------------
# 3. filteredProspects y reset de paginación
# -------------------------------------------------------------------------
filtered_pattern = r"(return matchName && matchZone && matchProduct && matchSector && matchStatus && matchRevenue && matchNewOnly;\s*\}\);\s*// Retornamos una copia ordenada[\s\S]*?\}\, \[userProspects, filterName, filterZone, filterProduct, filterSector, filterStatus, filterRevenue, filterNewOnly, sortOrder\]\);\s*// Estados y l[\s\S]*?useEffect\(\(\) => \{\s*setCurrentPage\(1\);\s*\}\, \[filterName, filterZone, filterProduct, filterSector, filterStatus, filterRevenue, filterNewOnly, sortOrder\]\);)"

filtered_match = re.search(filtered_pattern, content)
assert filtered_match is not None, "filtered_pattern not matched"

replacement_filtered_block = """// Filtro inteligente por Tier / Scoring / Leads Dormidos
      let matchTier = true;
      const score = getLeadScore(p);
      if (filterTier === 'tier1') matchTier = score >= 75;
      else if (filterTier === 'tier2') matchTier = score >= 50 && score < 75;
      else if (filterTier === 'tier3') matchTier = score < 50;
      else if (filterTier === 'dormant') matchTier = isLeadDormant(p);
      else if (filterTier === 'hot20') {
        const stage = normalizePipelineStage(p.pipelineStage);
        matchTier = stage !== 'Cuenta Ganada' && stage !== 'Descartado / Perdido';
      }

      return matchName && matchZone && matchProduct && matchSector && matchStatus && matchRevenue && matchNewOnly && matchTier;
    });

    // Si está activo el Top 20 Calientes, ordenamos por Lead Score descendente y extraemos el Top 20
    if (filterTier === 'hot20') {
      return [...result].sort((a, b) => getLeadScore(b) - getLeadScore(a)).slice(0, 20);
    }

    // Retornamos una copia ordenada según el criterio seleccionado en el filtro (por defecto alfabético A-Z)
    return [...result].sort((a, b) => {
      if (sortOrder === 'alphabetical') {
        return a.name.localeCompare(b.name, 'es', { sensitivity: 'base' });
      } else if (sortOrder === 'alphabetical-desc') {
        return b.name.localeCompare(a.name, 'es', { sensitivity: 'base' });
      } else if (sortOrder === 'revenue-desc') {
        return (b.revenue || 0) - (a.revenue || 0);
      } else if (sortOrder === 'revenue-asc') {
        if (!a.revenue && !b.revenue) return 0;
        if (!a.revenue) return 1;
        if (!b.revenue) return -1;
        return a.revenue - b.revenue;
      }
      return 0;
    });
  }, [userProspects, filterName, filterZone, filterProduct, filterSector, filterStatus, filterRevenue, filterNewOnly, filterTier, sortOrder]);

  // Estados y lógica de paginación ultra-optimizada
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(50);

  // Reiniciar a la página 1 cuando varíe cualquier filtro o búsqueda
  useEffect(() => {
    setCurrentPage(1);
  }, [filterName, filterZone, filterProduct, filterSector, filterStatus, filterRevenue, filterNewOnly, filterTier, sortOrder]);"""

content = content[:filtered_match.start()] + replacement_filtered_block + content[filtered_match.end():]
print("3. filteredProspects and pagination updated.")

# -------------------------------------------------------------------------
# 4. pipelineProspects
# -------------------------------------------------------------------------
pipe_pattern = r"(const pipelineProspects = useMemo\(\(\) => \{[\s\S]*?\}\, \[userProspects, filterZone, filterSector, pipelineSortOrder\]\);)"
pipe_match = re.search(pipe_pattern, content)
assert pipe_match is not None, "pipe_pattern not matched"

replacement_pipe_block = """const pipelineProspects = useMemo(() => {
    const result = userProspects.filter(p => {
      const matchZone = filterZone === '' || p.zone === filterZone;
      const matchSector = filterSector === '' || p.sector === filterSector;
      let matchTier = true;
      const score = getLeadScore(p);
      if (pipelineTierFilter === 'tier1') matchTier = score >= 75;
      else if (pipelineTierFilter === 'tier2') matchTier = score >= 50 && score < 75;
      else if (pipelineTierFilter === 'tier3') matchTier = score < 50;
      else if (pipelineTierFilter === 'dormant') matchTier = isLeadDormant(p);
      return matchZone && matchSector && matchTier;
    });
    return [...result].sort((a, b) => {
      if (pipelineSortOrder === 'alphabetical') {
        return a.name.localeCompare(b.name, 'es', { sensitivity: 'base' });
      } else if (pipelineSortOrder === 'alphabetical-desc') {
        return b.name.localeCompare(a.name, 'es', { sensitivity: 'base' });
      } else if (pipelineSortOrder === 'revenue-desc') {
        return (b.revenue || 0) - (a.revenue || 0);
      } else if (pipelineSortOrder === 'revenue-asc') {
        if (!a.revenue && !b.revenue) return 0;
        if (!a.revenue) return 1;
        if (!b.revenue) return -1;
        return a.revenue - b.revenue;
      }
      return 0;
    });
  }, [userProspects, filterZone, filterSector, pipelineSortOrder, pipelineTierFilter]);"""

content = content[:pipe_match.start()] + replacement_pipe_block + content[pipe_match.end():]
print("4. pipelineProspects updated.")

# -------------------------------------------------------------------------
# 5. handleUpdatePipelineStage
# -------------------------------------------------------------------------
update_stage_pattern = r"(const handleUpdatePipelineStage = \(prospectId, newStage\) => \{[\s\S]*?\}\;\s*const handleDeleteProspect)"
update_stage_match = re.search(update_stage_pattern, content)
assert update_stage_match is not None, "update_stage_pattern not matched"

replacement_update_stage_block = """const handleUpdatePipelineStage = (prospectId, newStage) => {
    setProspects(prev => prev.map(p => {
      if (p.id === prospectId) {
        const oldStage = normalizePipelineStage(p.pipelineStage);
        const normalizedNew = normalizePipelineStage(newStage);
        let updatedProspect = { ...p, pipelineStage: normalizedNew };
        
        const targetDate = new Date();
        if (normalizedNew === 'Planos Recibidos (RFQ)') {
          targetDate.setDate(targetDate.getDate() + 2); // 48h para estudio técnico
          const formattedDate = targetDate.toLocaleDateString('es-ES');
          handleAddTask(prospectId, `📐 Estudio técnico de planos CAD y cotización de perfiles/matriz (Compromiso: ${formattedDate})`, {
            dueDate: targetDate.toISOString(),
            dueDateFormatted: formattedDate,
            priority: 'Alta',
            category: 'Presupuesto'
          });
          const historyEntry = {
            id: Date.now() + 1,
            type: '📐 RFQ Recibido',
            text: `Recepción de planos para cotización. Derivado al Departamento de Ingeniería de Grupo Sopena.`,
            date: new Date().toISOString()
          };
          updatedProspect.history = [historyEntry, ...(p.history || [])];
        } else if (normalizedNew === 'Muestras / Tarifa Enviada') {
          targetDate.setDate(targetDate.getDate() + 4);
          const formattedDate = targetDate.toLocaleDateString('es-ES');
          handleAddTask(prospectId, `📦 Llamada de seguimiento de muestras/catálogo entregado (Revisar: ${formattedDate})`, {
            dueDate: targetDate.toISOString(),
            dueDateFormatted: formattedDate,
            priority: 'Media',
            category: 'Llamada'
          });
          const historyEntry = {
            id: Date.now() + 1,
            type: '📦 Envío Muestras',
            text: `Enviadas muestras de perfiles / catálogo técnico y tarifa de acabados.`,
            date: new Date().toISOString()
          };
          updatedProspect.history = [historyEntry, ...(p.history || [])];
        } else if (normalizedNew === 'Oferta & Negociación') {
          targetDate.setDate(targetDate.getDate() + 3);
          const formattedDate = targetDate.toLocaleDateString('es-ES');
          handleAddTask(prospectId, `💼 Seguimiento de oferta y negociación de condiciones de suministro (${formattedDate})`, {
            dueDate: targetDate.toISOString(),
            dueDateFormatted: formattedDate,
            priority: 'Alta',
            category: 'Presupuesto'
          });
          const historyEntry = {
            id: Date.now() + 1,
            type: '💼 Oferta Presentada',
            text: `Presentada oferta técnico-económica de extrusión / lacado. En fase de negociación.`,
            date: new Date().toISOString()
          };
          updatedProspect.history = [historyEntry, ...(p.history || [])];
        } else if (normalizedNew === 'Cuenta Ganada') {
          const historyEntry = {
            id: Date.now() + 1,
            type: '🤝 Éxito Comercial',
            text: `¡Cuenta Ganada! Primer pedido formalizado e inicio de relación como cliente activo.`,
            date: new Date().toISOString()
          };
          updatedProspect.history = [historyEntry, ...(p.history || [])];
          updatedProspect.contacted = true;
        } else {
          const historyEntry = {
            id: Date.now() + 1,
            type: '🔄 Cambio de Etapa',
            text: `Fase actualizada de '${oldStage}' a '${normalizedNew}'.`,
            date: new Date().toISOString()
          };
          updatedProspect.history = [historyEntry, ...(p.history || [])];
        }
        return updatedProspect;
      }
      return p;
    }));
  };
  const handleDeleteProspect"""

content = content[:update_stage_match.start()] + replacement_update_stage_block + content[update_stage_match.end() - len("const handleDeleteProspect"):]
print("5. handleUpdatePipelineStage updated.")

# -------------------------------------------------------------------------
# 6. Carta de Presentación y Dossier
# -------------------------------------------------------------------------
# Aleaciones Especializadas
content = re.sub(
    r"<li><strong>\{isPt \? 'Ligas Especializadas:' : 'Aleaciones Especializadas:'\}</strong>[\s\S]*?</li>",
    "<li><strong>{isPt ? 'Ligas Especializadas:' : 'Aleaciones Especializadas:'}</strong> {isPt ? 'Capacidade para extrudar ligas exigentes (6060, 6005, 6082 estrutural, 6083).' : 'Capacidad para extruir aleaciones exigentes (6060, 6005, 6082 estructural, 6083).'}</li>",
    content,
    count=1
)

# Extrusión de precisión
content = re.sub(
    r"<li style=\{\{marginBottom: '15px'\}\}><strong>\{isPt \? 'Extrusão de Precisão:' : 'Extrusión de Precisión:'\}</strong><br/>[\s\S]*?</li>",
    "<li style={{marginBottom: '15px'}}><strong>{isPt ? 'Extrusão de Precisão:' : 'Extrusión de Precisión:'}</strong><br/>{isPt ? 'Geometrias e ligas de diferentes tipos (6060, 6005, 6082, 6083).' : 'Geometrías y aleaciones de distintos tipos (6060, 6005, 6082 estructural, 6083).'}</li>",
    content,
    count=1
)

# Tratamientos Superficiales
content = re.sub(
    r"<li style=\{\{marginBottom: '15px'\}\}><strong>\{isPt \? 'Tratamentos Superficiais:' : 'Tratamientos Superficiales:'\}</strong><br/>[\s\S]*?</li>",
    "<li style={{marginBottom: '15px'}}><strong>{isPt ? 'Tratamentos Superficiais:' : 'Tratamientos Superficiales:'}</strong><br/>{isPt ? 'Lacagem, Anodização e efeito madeira sob normas de qualidade em tratamentos de superfície (Qualicoat Seaside, Qualanod, Qualideco).' : 'Lacado, Anodizado y efecto madera bajo normas de calidad en tratamientos de superficie (Qualicoat Seaside, Qualanod, Qualideco).'}</li>",
    content,
    count=1
)

# Sellos vectoriales oficiales
cert_grid_pattern = r"(<div className=\"cert-grid\" style=\{\{marginTop: '30px'[\s\S]*?🎖 QUALICOAT</div>\s*</div>)"
cert_match = re.search(cert_grid_pattern, content)
if cert_match:
    new_cert_grid = """{/* SELLOS OFICIALES VECTORIALES QUALICOAT SEASIDE / QUALANOD / QUALIDECO / CE / ISO */}
                          <div style={{marginTop: '25px', background: '#f8fafc', padding: '16px', borderRadius: '10px', border: '1px solid #e2e8f0'}}>
                            <div style={{fontSize: '0.78rem', fontWeight: 'bold', color: '#64748b', textTransform: 'uppercase', marginBottom: '10px', letterSpacing: '0.5px'}}>
                              🏆 Garantías y Sellos Oficiales de Calidad:
                            </div>
                            <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px'}}>
                              <div style={{display: 'flex', alignItems: 'center', gap: '8px', background: 'white', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', boxShadow: '0 1px 3px rgba(0,0,0,0.03)'}}>
                                <span style={{fontSize: '1.2rem', color: '#0284c7'}}>🛡️</span>
                                <div>
                                  <div style={{fontWeight: 'bold', fontSize: '0.8rem', color: '#0f172a'}}>QUALICOAT</div>
                                  <div style={{fontSize: '0.68rem', color: '#0284c7', fontWeight: 600}}>Seaside Class</div>
                                </div>
                              </div>
                              <div style={{display: 'flex', alignItems: 'center', gap: '8px', background: 'white', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', boxShadow: '0 1px 3px rgba(0,0,0,0.03)'}}>
                                <span style={{fontSize: '1.2rem', color: '#d97706'}}>⚡</span>
                                <div>
                                  <div style={{fontWeight: 'bold', fontSize: '0.8rem', color: '#0f172a'}}>QUALANOD</div>
                                  <div style={{fontSize: '0.68rem', color: '#b45309', fontWeight: 600}}>Anodizado EURAS</div>
                                </div>
                              </div>
                              <div style={{display: 'flex', alignItems: 'center', gap: '8px', background: 'white', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', boxShadow: '0 1px 3px rgba(0,0,0,0.03)'}}>
                                <span style={{fontSize: '1.2rem', color: '#16a34a'}}>🪵</span>
                                <div>
                                  <div style={{fontWeight: 'bold', fontSize: '0.8rem', color: '#0f172a'}}>QUALIDECO</div>
                                  <div style={{fontSize: '0.68rem', color: '#15803d', fontWeight: 600}}>Efecto Madera</div>
                                </div>
                              </div>
                              <div style={{display: 'flex', alignItems: 'center', gap: '8px', background: 'white', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', boxShadow: '0 1px 3px rgba(0,0,0,0.03)'}}>
                                <span style={{fontSize: '1.2rem'}}>🇪🇺</span>
                                <div>
                                  <div style={{fontWeight: 'bold', fontSize: '0.8rem', color: '#0f172a'}}>MARCADO CE</div>
                                  <div style={{fontSize: '0.68rem', color: '#64748b'}}>EN 14351 / EN 15088</div>
                                </div>
                              </div>
                              <div style={{display: 'flex', alignItems: 'center', gap: '8px', background: 'white', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', boxShadow: '0 1px 3px rgba(0,0,0,0.03)'}}>
                                <span style={{fontSize: '1.2rem', color: '#4f46e5'}}>⚙️</span>
                                <div>
                                  <div style={{fontWeight: 'bold', fontSize: '0.8rem', color: '#0f172a'}}>ISO 9001</div>
                                  <div style={{fontSize: '0.68rem', color: '#4338ca', fontWeight: 600}}>Gestión Calidad</div>
                                </div>
                              </div>
                              <div style={{display: 'flex', alignItems: 'center', gap: '8px', background: 'white', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', boxShadow: '0 1px 3px rgba(0,0,0,0.03)'}}>
                                <span style={{fontSize: '1.2rem', color: '#059669'}}>🌱</span>
                                <div>
                                  <div style={{fontWeight: 'bold', fontSize: '0.8rem', color: '#0f172a'}}>ISO 14001</div>
                                  <div style={{fontSize: '0.68rem', color: '#047857', fontWeight: 600}}>Medioambiente</div>
                                </div>
                              </div>
                            </div>
                          </div>"""
    content = content[:cert_match.start()] + new_cert_grid + content[cert_match.end():]

# Dos prensas de extrusión
content = re.sub(
    r"<h4 className=\"dossier-fabril-title\">Dos Prensas de Extrusión</h4>\s*<p className=\"dossier-fabril-desc\">[\s\S]*?</p>",
    """<h4 className="dossier-fabril-title">Dos Prensas de Extrusión (1.600 t y 2.500 t)</h4>
                                <p className="dossier-fabril-desc">Líneas de alta potencia para geometrías y aleaciones de distintos tipos (6060, 6005, 6082 estructural y 6083) para perfiles estándar, matricería bajo plano y perfiles industriales de alta inercia.</p>""",
    content,
    count=1
)

# Catálogo técnico de carpintería y departamento de ingeniería propio
carp_pattern = r"(<h3 className=\"dossier-section-title\">Resumen de Especificaciones de Carpintería</h3>\s*<p style=\{\{ fontSize: '0\.85rem', marginBottom: '15px' \}\}>[\s\S]*?</p>)"
carp_match = re.search(carp_pattern, content)
if carp_match:
    new_carp_block = """<div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', marginBottom: '8px'}}>
                            <h3 className="dossier-section-title" style={{margin: 0}}>Catálogo Técnico de Sistemas de Carpintería</h3>
                            <span style={{background: '#eff6ff', color: '#1e40af', border: '1px solid #bfdbfe', padding: '3px 10px', borderRadius: '12px', fontSize: '0.78rem', fontWeight: 'bold'}}>
                              📐 Selección de series (Consulte otras prestaciones)
                            </span>
                          </div>
                          
                          {/* DESTACADO DEPARTAMENTO DE INGENIERÍA PROPIO */}
                          <div style={{background: 'linear-gradient(135deg, #072b66 0%, #1e3a8a 100%)', color: 'white', padding: '14px 18px', borderRadius: '8px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '14px', boxShadow: '0 3px 8px rgba(7, 43, 102, 0.15)'}}>
                            <span style={{fontSize: '1.8rem'}}>💡</span>
                            <div>
                              <strong style={{fontSize: '0.92rem', display: 'block', marginBottom: '2px'}}>Departamento de Ingeniería Propio a su Servicio:</strong>
                              <span style={{fontSize: '0.82rem', opacity: 0.92, lineHeight: '1.4'}}>
                                Estas son solo algunas de las series disponibles en nuestro catálogo. Si su empresa requiere otras prestaciones térmicas, acústicas o secciones específicas, <strong>nuestro departamento de ingeniería le ayuda a desarrollar o adaptar series exclusivas que ya fabrique su empresa, o crear matrices a medida bajo plano (CAD/DXF)</strong> con plazos ágiles de homologación.
                              </span>
                            </div>
                          </div>

                          <p style={{ fontSize: '0.85rem', marginBottom: '15px', color: '#475569' }}>
                            Muestra de las series más representativas del catálogo arquitectónico ensayadas en laboratorios acreditados (con marcado CE):
                          </p>"""
    content = content[:carp_match.start()] + new_carp_block + content[carp_match.end():]

print("6. Carta & Dossier updated.")

# -------------------------------------------------------------------------
# 7. Botonera en activeTab === 'prospects' y columna en tabla
# -------------------------------------------------------------------------
search_bar_pattern = r"(<div className=\"filter-bar\">[\s\S]*?<div className=\"filter-group search-company-group\")"
search_bar_match = re.search(search_bar_pattern, content)
assert search_bar_match is not None, "search_bar_match not found"

replacement_btn_bar = """{/* BOTONERA INTELIGENTE DE LEAD SCORING & TIERS */}
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '14px', alignItems: 'center' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 'bold', color: 'var(--sopena-blue-dark)', marginRight: '6px' }}>
                  🎯 Prioridad Comercial:
                </span>
                <button 
                  type="button"
                  onClick={() => setFilterTier('')}
                  style={{
                    padding: '6px 14px',
                    borderRadius: '20px',
                    fontSize: '0.82rem',
                    fontWeight: filterTier === '' ? 'bold' : 'normal',
                    border: filterTier === '' ? '2px solid var(--sopena-blue)' : '1px solid #cbd5e1',
                    background: filterTier === '' ? 'var(--sopena-blue)' : 'white',
                    color: filterTier === '' ? 'white' : '#475569',
                    cursor: 'pointer',
                    boxShadow: filterTier === '' ? '0 2px 4px rgba(7, 43, 102, 0.2)' : 'none',
                    transition: 'all 0.15s ease'
                  }}
                >
                  📋 Todas ({userProspects.length})
                </button>
                <button 
                  type="button"
                  onClick={() => setFilterTier('hot20')}
                  style={{
                    padding: '6px 14px',
                    borderRadius: '20px',
                    fontSize: '0.82rem',
                    fontWeight: 'bold',
                    border: filterTier === 'hot20' ? '2px solid #ef4444' : '1px solid #fca5a5',
                    background: filterTier === 'hot20' ? '#ef4444' : '#fef2f2',
                    color: filterTier === 'hot20' ? 'white' : '#b91c1c',
                    cursor: 'pointer',
                    boxShadow: filterTier === 'hot20' ? '0 2px 6px rgba(239, 68, 68, 0.3)' : 'none',
                    transition: 'all 0.15s ease'
                  }}
                  title="20 cuentas activas con mayor puntuación de compra potencial"
                >
                  🔥 Top 20 Calientes de Hoy
                </button>
                <button 
                  type="button"
                  onClick={() => setFilterTier('tier1')}
                  style={{
                    padding: '6px 14px',
                    borderRadius: '20px',
                    fontSize: '0.82rem',
                    fontWeight: filterTier === 'tier1' ? 'bold' : 'normal',
                    border: filterTier === 'tier1' ? '2px solid #b45309' : '1px solid #fcd34d',
                    background: filterTier === 'tier1' ? '#b45309' : '#fef3c7',
                    color: filterTier === 'tier1' ? 'white' : '#92400e',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                  title="Cuentas Clave: Score ≥ 75 pts (Gran facturación y decisor cualificado)"
                >
                  🥇 Tier 1 · Oro ({userProspects.filter(p => getLeadScore(p) >= 75).length})
                </button>
                <button 
                  type="button"
                  onClick={() => setFilterTier('tier2')}
                  style={{
                    padding: '6px 14px',
                    borderRadius: '20px',
                    fontSize: '0.82rem',
                    fontWeight: filterTier === 'tier2' ? 'bold' : 'normal',
                    border: filterTier === 'tier2' ? '2px solid #334155' : '1px solid #cbd5e1',
                    background: filterTier === 'tier2' ? '#334155' : '#f1f5f9',
                    color: filterTier === 'tier2' ? 'white' : '#334155',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                  title="Cuentas Estratégicas: Score 50 a 74 pts"
                >
                  🥈 Tier 2 · Plata ({userProspects.filter(p => { const s = getLeadScore(p); return s >= 50 && s < 75; }).length})
                </button>
                <button 
                  type="button"
                  onClick={() => setFilterTier('tier3')}
                  style={{
                    padding: '6px 14px',
                    borderRadius: '20px',
                    fontSize: '0.82rem',
                    fontWeight: filterTier === 'tier3' ? 'bold' : 'normal',
                    border: filterTier === 'tier3' ? '2px solid #9a3412' : '1px solid #fed7aa',
                    background: filterTier === 'tier3' ? '#9a3412' : '#ffedd5',
                    color: filterTier === 'tier3' ? 'white' : '#9a3412',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                  title="Cuentas Estándar / Por Cualificar: Score < 50 pts"
                >
                  🥉 Tier 3 · Bronce ({userProspects.filter(p => getLeadScore(p) < 50).length})
                </button>
                <button 
                  type="button"
                  onClick={() => setFilterTier('dormant')}
                  style={{
                    padding: '6px 14px',
                    borderRadius: '20px',
                    fontSize: '0.82rem',
                    fontWeight: 'bold',
                    border: filterTier === 'dormant' ? '2px solid #d97706' : '1px solid #fde68a',
                    background: filterTier === 'dormant' ? '#d97706' : '#fffbeb',
                    color: filterTier === 'dormant' ? 'white' : '#b45309',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px',
                    transition: 'all 0.15s ease'
                  }}
                  title="Leads sin contacto ni actividad en los últimos 15 días"
                >
                  ⚠️ Leads Dormidos &gt;15d ({userProspects.filter(p => isLeadDormant(p)).length})
                </button>
              </div>
              <div className="filter-bar">
                <div className="filter-group search-company-group\""""

content = content[:search_bar_match.start()] + replacement_btn_bar + content[search_bar_match.end():]
print("7. Table priority bar injected.")

# -------------------------------------------------------------------------
# 8. Cabecera y filas de la tabla de prospectos
# -------------------------------------------------------------------------
th_pattern = r"(<thead>\s*<tr>\s*<th>Empresa</th>\s*<th>Facturación</th>)"
th_match = re.search(th_pattern, content)
assert th_match is not None, "th_match not found"
content = content[:th_match.start()] + "<thead>\n                    <tr>\n                      <th>Empresa</th>\n                      <th>Prioridad / Tier</th>\n                      <th>Facturación</th>" + content[th_match.end():]

# Celda de Prioridad/Tier en la fila
row_pattern = r"(</td>\s*<td>\s*\{p\.revenue \? \()"
row_match = re.search(row_pattern, content)
assert row_match is not None, "row_match not found"

replacement_row_tier = """</td>
                        <td>
                          {(() => {
                            const score = getLeadScore(p);
                            const tierInfo = getLeadTier(score);
                            const dormant = isLeadDormant(p);
                            return (
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                <span style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '5px',
                                  background: tierInfo.bg,
                                  color: tierInfo.color,
                                  border: `1px solid ${tierInfo.border}`,
                                  padding: '2px 8px',
                                  borderRadius: '12px',
                                  fontSize: '0.74rem',
                                  fontWeight: 'bold',
                                  width: 'fit-content'
                                }}>
                                  {tierInfo.badge} <span style={{ opacity: 0.75, fontSize: '0.68rem' }}>({score} pts)</span>
                                </span>
                                {dormant && (
                                  <span style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '3px',
                                    background: '#fef2f2',
                                    color: '#b91c1c',
                                    border: '1px solid #fca5a5',
                                    padding: '2px 6px',
                                    borderRadius: '4px',
                                    fontSize: '0.67rem',
                                    fontWeight: 'bold',
                                    width: 'fit-content'
                                  }} title="Sin actividad comercial registrada en más de 15 días">
                                    ⚠️ Inactivo &gt;15d
                                  </span>
                                )}
                              </div>
                            );
                          })()}
                        </td>
                        <td>
                          {p.revenue ? ("""

content = content[:row_match.start()] + replacement_row_tier + content[row_match.end():]

# Celda de Estado CRM
status_cell_pattern = r"(<td>\s*<span className=\{`status-badge \$\{p\.contacted \? 'status-contacted' : 'status-pending'\}`\}>[\s\S]*?</span>\s*</td>)"
status_match = re.search(status_cell_pattern, content)
assert status_match is not None, "status_match not found"

replacement_status_cell = """<td>
                          <span style={{
                            display: 'inline-block',
                            padding: '3px 8px',
                            borderRadius: '6px',
                            fontSize: '0.76rem',
                            fontWeight: '600',
                            background: '#f1f5f9',
                            color: '#334155',
                            border: '1px solid #cbd5e1',
                            whiteSpace: 'nowrap'
                          }}>
                            {normalizePipelineStage(p.pipelineStage)}
                          </span>
                        </td>"""

content = content[:status_match.start()] + replacement_status_cell + content[status_match.end():]
print("8. Table headers and row cells updated.")

# -------------------------------------------------------------------------
# 9. PIPELINE KANBAN (6 FASES INDUSTRIALES)
# -------------------------------------------------------------------------
kanban_pattern = r"(\{/\* PIPELINE TAB \*/\}[\s\S]*?\{activeTab === 'pipeline' && \([\s\S]*?\{/\* AGENTFORCE TAB \*/\})"
kanban_match = re.search(kanban_pattern, content)
assert kanban_match is not None, "kanban_match not found"

replacement_kanban_complete = """{/* PIPELINE TAB */}
          {activeTab === 'pipeline' && (
            <div style={{display: 'flex', flexDirection: 'column', height: '100%'}}>
              {/* BARRA DE FILTROS Y CONTROLES DEL PIPELINE */}
              <div className="filter-bar" style={{marginBottom: '14px', flexWrap: 'wrap', gap: '12px'}}>
                <div className="filter-group">
                  <label>Zona</label>
                  <select value={filterZone} onChange={e => setFilterZone(e.target.value)}>
                    <option value="">Todas las zonas autorizadas</option>
                    <option value="Comunidad Valenciana">Comunidad Valenciana</option>
                    <option value="Comunidad de Madrid">Comunidad de Madrid</option>
                    <option value="Castilla y Leon">Castilla y León</option>
                    <option value="Castilla-La Mancha">Castilla-La Mancha</option>
                    <option value="Cataluña">Cataluña</option>
                    <option value="Andalucia">Andalucía</option>
                    <option value="Galicia">Galicia</option>
                    <option value="Asturias">Asturias</option>
                    <option value="Cantabria">Cantabria</option>
                    <option value="Pais Vasco">País Vasco</option>
                    <option value="Portugal">Portugal</option>
                    <option value="Francia">Francia</option>
                  </select>
                </div>
                <div className="filter-group">
                  <label>Sector</label>
                  <select value={filterSector} onChange={e => setFilterSector(e.target.value)}>
                    <option value="">Todos los sectores</option>
                    <option value="Suelos Técnicos">Suelos Técnicos</option>
                    <option value="Cerramientos">Cerramientos</option>
                    <option value="Construccion Modular">Construcción Modular</option>
                    <option value="Puertas y Ventanas">Puertas y Ventanas</option>
                    <option value="Estructuras Solares">Estructuras Solares</option>
                    <option value="Fachadas de Aluminio">Fachadas de Aluminio</option>
                    <option value="Fachadas Especiales">Fachadas Especiales</option>
                    <option value="Fabricantes de Escaleras de Aluminio">Fab. Escaleras</option>
                    <option value="Fabricantes de Estanterias de Aluminio">Fab. Estanterías</option>
                    <option value="Fabricantes de Carrocerias">Fab. Carrocerías</option>
                    <option value="Transformacion de Chapa">Transformación de Chapa</option>
                    <option value="Sistemas de Proteccion Solar">Sistemas de Protección Solar</option>
                    <option value="Metal Arquitectonico y Chapa Perforada">Metal Arquitectónico y Chapa Perforada</option>
                    <option value="Perfiles Estructurales Aluminio">Perfiles Estructurales Aluminio</option>
                    <option value="Piscinas Desmontables">Piscinas Desmontables</option>
                    <option value="Iluminacion Publica">Iluminación Pública</option>
                    <option value="Mesas de Invernadero">Mesas de Invernadero</option>
                    <option value="Divisiones de Oficina">Divisiones de Oficina</option>
                    <option value="Senalizacion">Señalización</option>
                    <option value="Camillas de Aluminio">Camillas de Aluminio</option>
                    <option value="Pistas de Padel">Pistas de Pádel</option>
                    <option value="Puertas Industriales">Puertas Industriales</option>
                    <option value="Puertas Frigorificas">Puertas Frigoríficas</option>
                    <option value="Mosquiteras">Mosquiteras</option>
                    <option value="PLV y Mobiliario Comercial">PLV y Mobiliario Comercial</option>
                    <option value="Distribucion de Aluminio y Metales">Distribución de Aluminio y Metales</option>
                    <option value="Armarios de Aluminio">Armarios de Aluminio</option>
                  </select>
                </div>
                <div className="filter-group">
                  <label>Filtrar por Prioridad / Tier</label>
                  <select value={pipelineTierFilter} onChange={e => setPipelineTierFilter(e.target.value)}>
                    <option value="">Todos los Tiers</option>
                    <option value="tier1">🥇 Solo Tier 1 (Oro: Score ≥ 75)</option>
                    <option value="tier2">🥈 Solo Tier 2 (Plata: Score 50-74)</option>
                    <option value="tier3">🥉 Solo Tier 3 (Bronce: Score &lt; 50)</option>
                    <option value="dormant">⚠️ Solo Leads Dormidos (&gt;15d inactivos)</option>
                  </select>
                </div>
                <div className="filter-group">
                  <label>Ordenar por</label>
                  <select value={pipelineSortOrder} onChange={e => setPipelineSortOrder(e.target.value)}>
                    <option value="alphabetical">Nombre (A-Z)</option>
                    <option value="alphabetical-desc">Nombre (Z-A)</option>
                    <option value="revenue-desc">Facturación (Desc.)</option>
                    <option value="revenue-asc">Facturación (Asc.)</option>
                  </select>
                </div>
              </div>

              {/* KPI DASHBOARD RESUMEN DE EMBUDO */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px', marginBottom: '16px' }}>
                <div style={{ background: 'white', padding: '10px 14px', borderRadius: '10px', borderLeft: '4px solid #0284c7', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                  <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>En Seguimiento Activo</div>
                  <div style={{ fontSize: '1.3rem', fontWeight: 'bold', color: '#0f172a' }}>
                    {pipelineProspects.filter(p => {
                      const st = normalizePipelineStage(p.pipelineStage);
                      return st !== 'Cuenta Ganada' && st !== 'Descartado / Perdido';
                    }).length} cuentas
                  </div>
                </div>
                <div style={{ background: 'white', padding: '10px 14px', borderRadius: '10px', borderLeft: '4px solid #f59e0b', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                  <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>Planos RFQ en Estudio</div>
                  <div style={{ fontSize: '1.3rem', fontWeight: 'bold', color: '#b45309' }}>
                    {pipelineProspects.filter(p => normalizePipelineStage(p.pipelineStage) === 'Planos Recibidos (RFQ)').length} peticiones
                  </div>
                </div>
                <div style={{ background: 'white', padding: '10px 14px', borderRadius: '10px', borderLeft: '4px solid #ea580c', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                  <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>Ofertas en Negociación</div>
                  <div style={{ fontSize: '1.3rem', fontWeight: 'bold', color: '#ea580c' }}>
                    {pipelineProspects.filter(p => normalizePipelineStage(p.pipelineStage) === 'Oferta & Negociación').length} ofertas
                  </div>
                </div>
                <div style={{ background: 'white', padding: '10px 14px', borderRadius: '10px', borderLeft: '4px solid #10b981', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                  <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>Cuentas Ganadas</div>
                  <div style={{ fontSize: '1.3rem', fontWeight: 'bold', color: '#059669' }}>
                    {pipelineProspects.filter(p => normalizePipelineStage(p.pipelineStage) === 'Cuenta Ganada').length} clientes
                  </div>
                </div>
              </div>

              {/* TABLERO KANBAN DE 6 FASES INDUSTRIALES */}
              <div className="pipeline-container" style={{display: 'flex', gap: '16px', overflowX: 'auto', paddingBottom: '20px', height: 'calc(100vh - 190px)'}}>
                {PIPELINE_STAGES.map(stageObj => {
                  const stageId = stageObj.id;
                  const matchingProspects = pipelineProspects.filter(p => normalizePipelineStage(p.pipelineStage) === stageId);
                  const totalRev = matchingProspects.reduce((acc, p) => acc + (Number(p.revenue) || 0), 0);

                  return (
                    <div 
                      key={stageId} 
                      style={{
                        flex: '0 0 320px', 
                        background: '#f8fafc', 
                        borderRadius: '12px', 
                        border: '1px solid #e2e8f0',
                        borderTop: `4px solid ${stageObj.color}`,
                        padding: '14px', 
                        display: 'flex', 
                        flexDirection: 'column',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
                      }}
                    >
                      <div style={{margin: '0 0 12px 0', paddingBottom: '8px', borderBottom: '1px solid #e2e8f0'}}>
                        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px'}}>
                          <h4 style={{margin: 0, fontSize: '0.95rem', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '6px'}}>
                            {stageObj.label}
                          </h4>
                          <span style={{background: stageObj.color, color: 'white', borderRadius: '12px', padding: '2px 8px', fontSize: '0.75rem', fontWeight: 'bold'}}>
                            {matchingProspects.length}
                          </span>
                        </div>
                        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                          <span style={{fontSize: '0.72rem', color: '#64748b'}}>{stageObj.desc}</span>
                          {totalRev > 0 && (
                            <span style={{fontSize: '0.72rem', fontWeight: 'bold', color: '#334155'}} title="Facturación acumulada de empresas en esta etapa">
                              {new Intl.NumberFormat('es-ES', {style: 'currency', currency: 'EUR', notation: 'compact', maximumFractionDigits: 1}).format(totalRev)}
                            </span>
                          )}
                        </div>
                      </div>

                      <div style={{flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px', paddingRight: '4px'}}>
                        {matchingProspects.length === 0 ? (
                          <div style={{textAlign: 'center', padding: '25px 10px', color: '#94a3b8', fontSize: '0.8rem', fontStyle: 'italic'}}>
                            Sin empresas en esta etapa
                          </div>
                        ) : (
                          matchingProspects.map(p => {
                            const score = getLeadScore(p);
                            const tierInfo = getLeadTier(score);
                            const dormant = isLeadDormant(p);

                            return (
                              <div 
                                key={p.id} 
                                style={{
                                  background: 'white', 
                                  padding: '12px 14px', 
                                  borderRadius: '8px', 
                                  boxShadow: '0 2px 5px rgba(0,0,0,0.04)', 
                                  borderLeft: `4px solid ${stageObj.color}`, 
                                  position: 'relative',
                                  transition: 'transform 0.15s ease',
                                  border: '1px solid #e2e8f0',
                                  borderLeftWidth: '4px'
                                }}
                              >
                                <button 
                                  onClick={() => handleDeleteProspect(p.id)} 
                                  style={{position: 'absolute', top: '8px', right: '8px', background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '1rem', padding: '2px'}} 
                                  title="Borrar Empresa"
                                >
                                  🗑️
                                </button>

                                {/* Badges de Tier y Leads Dormidos */}
                                <div style={{display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap', marginBottom: '6px', paddingRight: '22px'}}>
                                  <span style={{
                                    background: tierInfo.bg,
                                    color: tierInfo.color,
                                    border: `1px solid ${tierInfo.border}`,
                                    padding: '1px 7px',
                                    borderRadius: '10px',
                                    fontSize: '0.7rem',
                                    fontWeight: 'bold'
                                  }}>
                                    {tierInfo.badge} ({score} pts)
                                  </span>
                                  {dormant && (
                                    <span style={{
                                      background: '#fef2f2',
                                      color: '#b91c1c',
                                      border: '1px solid #fca5a5',
                                      padding: '1px 6px',
                                      borderRadius: '4px',
                                      fontSize: '0.66rem',
                                      fontWeight: 'bold'
                                    }} title="Sin actividad comercial registrada en más de 15 días">
                                      ⚠️ Inactivo &gt;15d
                                    </span>
                                  )}
                                </div>

                                <h4 
                                  onClick={() => setSelectedProspect(p)} 
                                  style={{margin: '0 0 6px 0', color: '#0f172a', fontSize: '0.92rem', cursor: 'pointer', fontWeight: 600}}
                                  title="Abrir ficha CRM"
                                >
                                  {p.name}
                                </h4>

                                <div style={{fontSize: '0.78rem', color: '#64748b', marginBottom: '6px'}}>
                                  <div>🏭 <strong>{p.sector}</strong></div>
                                  <div>📍 {p.zone}</div>
                                  {p.revenue ? (
                                    <div style={{color: '#0f172a', fontWeight: 'bold', marginTop: '2px'}}>
                                      💶 {new Intl.NumberFormat('es-ES', {style: 'currency', currency: 'EUR', maximumFractionDigits: 0}).format(p.revenue)}
                                    </div>
                                  ) : null}
                                </div>

                                {p.purchasingManager && (
                                  <div style={{fontSize: '0.75rem', color: '#0369a1', marginBottom: '8px', background: '#f0f9ff', padding: '2px 6px', borderRadius: '4px'}}>
                                    👤 {p.purchasingManager}
                                  </div>
                                )}

                                <div style={{marginTop: '8px', paddingTop: '8px', borderTop: '1px solid #f1f5f9'}}>
                                  <label style={{fontSize: '0.7rem', color: '#64748b', display: 'block', marginBottom: '2px', fontWeight: 600}}>Fase Pipeline:</label>
                                  <select 
                                    value={normalizePipelineStage(p.pipelineStage)} 
                                    onChange={(e) => handleUpdatePipelineStage(p.id, e.target.value)}
                                    style={{width: '100%', padding: '5px 8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.76rem', background: '#ffffff', color: '#1e293b', fontWeight: 500}}
                                  >
                                    {PIPELINE_STAGES.map(s => (
                                      <option key={s.id} value={s.id}>{s.label}</option>
                                    ))}
                                  </select>
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
          {/* AGENTFORCE TAB */}"""

content = content[:kanban_match.start()] + replacement_kanban_complete + content[kanban_match.end():]
print("9. Pipeline Kanban updated.")

# -------------------------------------------------------------------------
# 10. Modal selectedProspect: Tier badge y selector de fase
# -------------------------------------------------------------------------
modal_h2_pattern = r"(<h2 style=\{\{ margin: 0, fontSize: '1\.6rem', color: 'var\(--sopena-blue-dark\)' \}\}>\{selectedProspect\.name\}</h2>\s*<span className=\"prospect-header-badge\"[\s\S]*?ID: \{selectedProspect\.id\} \| \{selectedProspect\.zone\}</span>)"
modal_h2_match = re.search(modal_h2_pattern, content)
assert modal_h2_match is not None, "modal_h2_match not found"

replacement_modal_h2 = """<h2 style={{ margin: 0, fontSize: '1.6rem', color: 'var(--sopena-blue-dark)' }}>{selectedProspect.name}</h2>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginTop: '6px' }}>
                  <span className="prospect-header-badge" style={{ background: selectedProspect.contacted ? 'rgba(34, 197, 94, 0.15)' : 'rgba(245, 158, 11, 0.15)', color: selectedProspect.contacted ? 'var(--success)' : 'var(--warning)' }}>
                    {selectedProspect.contacted ? '🟢 Contactado' : '🟡 Pendiente'}
                  </span>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>ID: {selectedProspect.id} | {selectedProspect.zone}</span>
                  {(() => {
                    const score = getLeadScore(selectedProspect);
                    const tierInfo = getLeadTier(score);
                    const dormant = isLeadDormant(selectedProspect);
                    return (
                      <>
                        <span style={{
                          background: tierInfo.bg,
                          color: tierInfo.color,
                          border: `1px solid ${tierInfo.border}`,
                          padding: '2px 8px',
                          borderRadius: '12px',
                          fontSize: '0.75rem',
                          fontWeight: 'bold'
                        }}>
                          {tierInfo.badge} · Score: {score}/100
                        </span>
                        <span style={{
                          background: '#f1f5f9',
                          color: '#334155',
                          border: '1px solid #cbd5e1',
                          padding: '2px 8px',
                          borderRadius: '12px',
                          fontSize: '0.75rem',
                          fontWeight: '600'
                        }}>
                          {normalizePipelineStage(selectedProspect.pipelineStage)}
                        </span>
                        {dormant && (
                          <span style={{
                            background: '#fef2f2',
                            color: '#b91c1c',
                            border: '1px solid #fca5a5',
                            padding: '2px 8px',
                            borderRadius: '12px',
                            fontSize: '0.75rem',
                            fontWeight: 'bold'
                          }}>
                            ⚠️ Inactivo &gt;15d
                          </span>
                        )}
                      </>
                    );
                  })()}
                </div>"""

content = content[:modal_h2_match.start()] + replacement_modal_h2 + content[modal_h2_match.end():]

# Selector de fase de pipeline en pestaña de seguimiento del modal
seguimiento_pattern = r"(<div className=\"modal-grid-2\" style=\{\{ marginBottom: '15px' \}\}>\s*<div className=\"form-group\">\s*<label>Estado de Contacto</label>[\s\S]*?<input type=\"date\" name=\"contactDate\" defaultValue=\{selectedProspect\.contactDate \|\| ''\} />\s*</div>\s*</div>)"
seguimiento_match = re.search(seguimiento_pattern, content)
assert seguimiento_match is not None, "seguimiento_match not found"

replacement_modal_seguimiento = """<div className="modal-grid-2" style={{ marginBottom: '15px' }}>
                      <div className="form-group">
                        <label>Estado de Contacto</label>
                        <select name="contacted" defaultValue={selectedProspect.contacted ? 'true' : 'false'}>
                          <option value="false">Pendiente</option>
                          <option value="true">Contactado</option>
                        </select>
                      </div>
                      <div className="form-group">
                        <label>Fecha de Contacto</label>
                        <input type="date" name="contactDate" defaultValue={selectedProspect.contactDate || ''} />
                      </div>
                    </div>
                    <div className="form-group" style={{ marginBottom: '15px' }}>
                      <label>Fase del Pipeline Industrial</label>
                      <select 
                        name="pipelineStage" 
                        defaultValue={normalizePipelineStage(selectedProspect.pipelineStage)}
                        onChange={(e) => handleUpdatePipelineStage(selectedProspect.id, e.target.value)}
                        style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid var(--border-color)', fontWeight: 600 }}
                      >
                        {PIPELINE_STAGES.map(s => (
                          <option key={s.id} value={s.id}>{s.label}</option>
                        ))}
                      </select>
                    </div>"""

content = content[:seguimiento_match.start()] + replacement_modal_seguimiento + content[seguimiento_match.end():]
print("10. Modal header & stage selector updated.")

# Guardar
with open(app_path, "w", encoding="utf-8") as f:
    f.write(content)

print("SUCCESS: All upgrades applied successfully to src/App.jsx!")
