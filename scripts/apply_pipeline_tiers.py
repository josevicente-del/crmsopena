# -*- coding: utf-8 -*-
import sys
import re

app_path = "src/App.jsx"

with open(app_path, "r", encoding="utf-8") as f:
    content = f.read()

# 1. Definición de utilidades antes de 'const App = () => {'
target_pre_app = """const App = () => {"""

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

if target_pre_app in content:
    content = content.replace(target_pre_app, replacement_pre_app, 1)
    print("Pre-App utilities injected.")
else:
    print("ERROR: target_pre_app not found.")
    sys.exit(1)

# 2. Estados de filtro
target_filters_state = """  // Filters
  const [filterName, setFilterName] = useState('');
  const [filterZone, setFilterZone] = useState('');
  const [filterProduct, setFilterProduct] = useState('');
  const [filterSector, setFilterSector] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterRevenue, setFilterRevenue] = useState('');
  const [filterNewOnly, setFilterNewOnly] = useState(false);
  // Estado para controlar el ordenamiento en la Base de Datos (por defecto alfabético A-Z)
  const [sortOrder, setSortOrder] = useState('alphabetical');
  // Estado para controlar el ordenamiento en el Pipeline de Ventas (por defecto alfabético A-Z)
  const [pipelineSortOrder, setPipelineSortOrder] = useState('alphabetical');"""

replacement_filters_state = """  // Filters
  const [filterName, setFilterName] = useState('');
  const [filterZone, setFilterZone] = useState('');
  const [filterProduct, setFilterProduct] = useState('');
  const [filterSector, setFilterSector] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterRevenue, setFilterRevenue] = useState('');
  const [filterNewOnly, setFilterNewOnly] = useState(false);
  // Filtro rápido por Tier comercial B2B ('', 'hot20', 'tier1', 'tier2', 'tier3', 'dormant')
  const [filterTier, setFilterTier] = useState('');
  // Estado para controlar el ordenamiento en la Base de Datos (por defecto alfabético A-Z)
  const [sortOrder, setSortOrder] = useState('alphabetical');
  // Filtro de Tier y Leads Dormidos específico para el Pipeline Kanban
  const [pipelineTierFilter, setPipelineTierFilter] = useState('');
  // Estado para controlar el ordenamiento en el Pipeline de Ventas (por defecto alfabético A-Z)
  const [pipelineSortOrder, setPipelineSortOrder] = useState('alphabetical');"""

if target_filters_state in content:
    content = content.replace(target_filters_state, replacement_filters_state, 1)
    print("Filter states updated.")
else:
    print("ERROR: target_filters_state not found.")
    sys.exit(1)

# 3. filteredProspects y useEffect
target_filtered = """      return matchName && matchZone && matchProduct && matchSector && matchStatus && matchRevenue && matchNewOnly;
    });

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
  }, [userProspects, filterName, filterZone, filterProduct, filterSector, filterStatus, filterRevenue, filterNewOnly, sortOrder]);

  // Estados y lógica de paginación ultra-optimizada
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(50);

  // Reiniciar a la página 1 cuando varíe cualquier filtro o búsqueda
  useEffect(() => {
    setCurrentPage(1);
  }, [filterName, filterZone, filterProduct, filterSector, filterStatus, filterRevenue, filterNewOnly, sortOrder]);"""

replacement_filtered = """      // Filtro inteligente por Tier / Scoring / Leads Dormidos
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

if target_filtered in content:
    content = content.replace(target_filtered, replacement_filtered, 1)
    print("filteredProspects updated.")
else:
    print("ERROR: target_filtered not found.")
    sys.exit(1)

# 4. pipelineProspects
target_pipe_prosp = """  // Memoizamos la lista específica para el Pipeline (Kanban), aplicando únicamente prospectos autorizados
  const pipelineProspects = useMemo(() => {
    const result = userProspects.filter(p => {
      const matchZone = filterZone === '' || p.zone === filterZone;
      const matchSector = filterSector === '' || p.sector === filterSector;
      return matchZone && matchSector;
    });
    return [...result].sort((a, b) => {
      if (pipelineSortOrder === 'alphabetical') {
        return a.name.localeCompare(b.name, 'es', { sensitivity: 'base' });
      } else if (pipelineSortOrder === 'alphabetical-desc') {
        return b.name.localeCompare(a.name, 'es', { sensitivity: 'base' });
      } else if (pipelineSortOrder === 'revenue-desc') {
        return b.revenue - a.revenue;
      } else if (pipelineSortOrder === 'revenue-asc') {
        return a.revenue - b.revenue;
      }
      return 0;
    });
  }, [userProspects, filterZone, filterSector, pipelineSortOrder]);"""

replacement_pipe_prosp = """  // Memoizamos la lista específica para el Pipeline (Kanban), aplicando filtros de zona, sector y Tier
  const pipelineProspects = useMemo(() => {
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

if target_pipe_prosp in content:
    content = content.replace(target_pipe_prosp, replacement_pipe_prosp, 1)
    print("pipelineProspects updated.")
else:
    print("ERROR: target_pipe_prosp not found.")
    sys.exit(1)

# 5. handleUpdatePipelineStage
target_update_stage = """  const handleUpdatePipelineStage = (prospectId, newStage) => {
    setProspects(prev => prev.map(p => {
      if (p.id === prospectId) {
        const oldStage = p.pipelineStage || 'Lead';
        let updatedProspect = { ...p, pipelineStage: newStage };
        // Si se transiciona de la columna 'Lead' a 'Propuesta', generamos una tarea automática para dentro de 3 días
        if (oldStage === 'Lead' && newStage === 'Propuesta') {
          const targetDate = new Date();
          targetDate.setDate(targetDate.getDate() + 3);
          const formattedDate = targetDate.toLocaleDateString('es-ES');

          handleAddTask(prospectId, `📞 Llamada de seguimiento: contacto comercial (Agendada para el ${formattedDate})`, {
            dueDate: targetDate.toISOString(),
            dueDateFormatted: formattedDate,
            priority: 'Alta',
            category: 'Llamada'
          });

          // Registrar en el historial del prospecto para mantener la trazabilidad del proceso
          const historyEntry = {
            id: Date.now() + 1,
            type: '📝 Nota',
            text: `Tránsito automático: Movido de 'Lead' a 'Propuesta'. Generada tarea de llamada de seguimiento para el ${formattedDate}.`,
            date: new Date().toISOString()
          };
          updatedProspect.history = [historyEntry, ...(p.history || [])];
        }
        return updatedProspect;
      }
      return p;
    }));
  };"""

replacement_update_stage = """  const handleUpdatePipelineStage = (prospectId, newStage) => {
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
  };"""

if target_update_stage in content:
    content = content.replace(target_update_stage, replacement_update_stage, 1)
    print("handleUpdatePipelineStage updated.")
else:
    print("ERROR: target_update_stage not found.")
    sys.exit(1)

# 6. Botonera en activeTab === 'prospects' y columna en tabla
target_table_bar = """              <div className="filter-bar">"""

replacement_table_bar = """              {/* BOTONERA INTELIGENTE DE LEAD SCORING & TIERS */}
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
              <div className="filter-bar">"""

if target_table_bar in content:
    content = content.replace(target_table_bar, replacement_table_bar, 1)
    print("Table priority bar injected.")
else:
    print("ERROR: target_table_bar not found.")
    sys.exit(1)

# 7. Cabecera y filas de la tabla de prospectos
target_table_headers = """                  <thead>
                    <tr>
                      <th>Empresa</th>
                      <th>Facturación</th>
                      <th>Contacto & Email</th>
                      <th>Teléfono</th>
                      <th>Sector & Zona</th>
                      <th>Estado CRM</th>
                      <th>Acción</th>
                    </tr>
                  </thead>"""

replacement_table_headers = """                  <thead>
                    <tr>
                      <th>Empresa</th>
                      <th>Prioridad / Tier</th>
                      <th>Facturación</th>
                      <th>Contacto & Email</th>
                      <th>Teléfono</th>
                      <th>Sector & Zona</th>
                      <th>Fase Pipeline</th>
                      <th>Acción</th>
                    </tr>
                  </thead>"""

if target_table_headers in content:
    content = content.replace(target_table_headers, replacement_table_headers, 1)
    print("Table headers updated.")
else:
    print("ERROR: target_table_headers not found.")
    sys.exit(1)

# Inserción de celda Prioridad / Tier en las filas de la tabla
target_row_start = """                          {p.web !== 'No disponible' ? (
                            <a href={p.web.startsWith('http') ? p.web : `https://${p.web}`} target="_blank" rel="noreferrer" style={{color: 'var(--sopena-blue)', fontSize: '0.85rem'}}>{p.web.replace('https://www.','').replace('http://www.','').replace('https://','')}</a>
                          ) : (
                            null
                          )}
                        </td>
                        <td>
                          {p.revenue ? ("""

replacement_row_start = """                          {p.web !== 'No disponible' ? (
                            <a href={p.web.startsWith('http') ? p.web : `https://${p.web}`} target="_blank" rel="noreferrer" style={{color: 'var(--sopena-blue)', fontSize: '0.85rem'}}>{p.web.replace('https://www.','').replace('http://www.','').replace('https://','')}</a>
                          ) : (
                            null
                          )}
                        </td>
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

if target_row_start in content:
    content = content.replace(target_row_start, replacement_row_start, 1)
    print("Table row Tier cell injected.")
else:
    print("ERROR: target_row_start not found.")
    sys.exit(1)

# Actualizar celda de Estado CRM a Fase Pipeline normalizada
target_status_cell = """                        <td>
                          <span className={`status-badge ${p.contacted ? 'status-contacted' : 'status-pending'}`}>
                            {p.contacted ? 'Contactado' : 'Pendiente'}
                          </span>
                        </td>"""

replacement_status_cell = """                        <td>
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

if target_status_cell in content:
    content = content.replace(target_status_cell, replacement_status_cell, 1)
    print("Table status cell updated to pipeline stage.")
else:
    print("ERROR: target_status_cell not found.")
    sys.exit(1)

# 8. PIPELINE KANBAN (6 FASES INDUSTRIALES)
target_kanban = """          {/* PIPELINE TAB */}
          {activeTab === 'pipeline' && (
            <div style={{display: 'flex', flexDirection: 'column', height: '100%'}}>
              <div className="filter-bar" style={{marginBottom: '20px'}}>
                <div className="filter-group">
                  <label>Zona</label>
                  <select value={filterZone} onChange={e => setFilterZone(e.target.value)}>
                    <option value="">Todas las zonas</option>
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
                  <label>Ordenar por</label>
                  <select value={pipelineSortOrder} onChange={e => setPipelineSortOrder(e.target.value)}>
                    <option value="alphabetical">Nombre (A-Z)</option>
                    <option value="alphabetical-desc">Nombre (Z-A)</option>
                    <option value="revenue-desc">Facturación (Desc.)</option>
                    <option value="revenue-asc">Facturación (Asc.)</option>
                  </select>
                </div>
              </div>
              <div className="pipeline-container" style={{display: 'flex', gap: '20px', overflowX: 'auto', paddingBottom: '20px', height: 'calc(100vh - 150px)'}}>
                {['Lead', 'Contactado', 'Propuesta', 'Cerrado Ganado', 'Cerrado Perdido'].map(stage => (
                  <div key={stage} style={{flex: '0 0 300px', background: '#f1f5f9', borderRadius: '12px', padding: '15px', display: 'flex', flexDirection: 'column'}}>
                    <h3 style={{margin: '0 0 15px 0', paddingBottom: '10px', borderBottom: '2px solid var(--sopena-blue)', color: 'var(--sopena-blue-dark)', display: 'flex', justifyContent: 'space-between'}}>
                       {stage} 
                        <span style={{background: 'var(--sopena-blue)', color: 'white', borderRadius: '50%', padding: '2px 8px', fontSize: '0.8rem'}}>{pipelineProspects.filter(p => (p.pipelineStage || 'Lead') === stage).length}</span>
                    </h3>
                    <div style={{flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px', paddingRight: '5px'}}>
                      {pipelineProspects.filter(p => (p.pipelineStage || 'Lead') === stage).map(p => (
                        <div key={p.id} style={{background: 'white', padding: '15px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', borderLeft: `4px solid ${stage.includes('Ganado') ? '#10b981' : stage.includes('Perdido') ? '#ef4444' : 'var(--sopena-blue)'}`, position: 'relative'}}>
                          <button onClick={() => handleDeleteProspect(p.id)} style={{position: 'absolute', top: '10px', right: '10px', background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '1.2rem', padding: 0}} title="Borrar Empresa">🗑️</button>
                          <h4 onClick={() => setSelectedProspect(p)} style={{margin: '0 0 5px 0', color: '#1e293b', paddingRight: '20px', cursor: 'pointer'}}>{p.name}</h4>
                          <p style={{margin: '0 0 10px 0', fontSize: '0.85rem', color: '#64748b'}}>{p.sector}{p.revenue ? ` - ${new Intl.NumberFormat('es-ES', {style: 'currency', currency: 'EUR', maximumFractionDigits: 0}).format(p.revenue)}` : ''}</p>
                          <select 
                            value={p.pipelineStage || 'Lead'} 
                            onChange={(e) => handleUpdatePipelineStage(p.id, e.target.value)}
                            style={{width: '100%', padding: '5px', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '0.8rem'}}
                          >
                            <option value="Lead">Lead</option>
                            <option value="Contactado">Contactado</option>
                            <option value="Propuesta">Propuesta</option>
                            <option value="Cerrado Ganado">Cerrado Ganado</option>
                            <option value="Cerrado Perdido">Cerrado Perdido</option>
                          </select>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}"""

replacement_kanban = """          {/* PIPELINE TAB */}
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
          )}"""

if target_kanban in content:
    content = content.replace(target_kanban, replacement_kanban, 1)
    print("Pipeline Kanban 6 stages updated.")
else:
    print("ERROR: target_kanban not found.")
    sys.exit(1)

# 9. Header del modal de detalle de prospecto
target_modal_header = """                <h2 style={{ margin: 0, fontSize: '1.6rem', color: 'var(--sopena-blue-dark)' }}>{selectedProspect.name}</h2>
                <span className="prospect-header-badge" style={{ background: selectedProspect.contacted ? 'rgba(34, 197, 94, 0.15)' : 'rgba(245, 158, 11, 0.15)', color: selectedProspect.contacted ? 'var(--success)' : 'var(--warning)' }}>
                  {selectedProspect.contacted ? '🟢 Contactado' : '🟡 Pendiente'}
                </span>
                <span style={{ marginLeft: '10px', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>ID: {selectedProspect.id} | {selectedProspect.zone}</span>"""

replacement_modal_header = """                <h2 style={{ margin: 0, fontSize: '1.6rem', color: 'var(--sopena-blue-dark)' }}>{selectedProspect.name}</h2>
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

if target_modal_header in content:
    content = content.replace(target_modal_header, replacement_modal_header, 1)
    print("Modal header Tier badge injected.")
else:
    print("ERROR: target_modal_header not found.")
    sys.exit(1)

with open(app_path, "w", encoding="utf-8") as f:
    f.write(content)

print("SUCCESS: All pipeline, tier, and scoring changes applied!")
