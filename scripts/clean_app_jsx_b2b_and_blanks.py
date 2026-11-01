# -*- coding: utf-8 -*-
"""
Limpia src/App.jsx de acuerdo con las instrucciones del usuario:
1. Elimina por completo 'Tier B2B (Consumo)', estimaciones de Tn/año, badges Tier A/B/C y la ficha técnica de extrusión estimada.
2. Corrige la sanitización inicial (línea 560) para que NO invente revenue = 5000000 cuando la facturación está en blanco (null).
3. Sincroniza con rawProspects para que localStorage no conserve facturaciones estimadas ni nombres de contacto inventados.
4. Deja en blanco la celda de Facturación, Contacto, Teléfono y Email cuando el dato no esté comprobado al 100%.
"""

with open("src/App.jsx", "r", encoding="utf-8") as f:
    content = f.read().replace("\r\n", "\n")

# 1. Eliminar import de getB2BExtrusionProfile (mantener solo lo necesario o quitar si no se usa)
content = content.replace(
    "import { getB2BExtrusionProfile, generateB2BOutreachKit, findNearbyClusterProspects } from './utils/b2bExtrusionEngine';\n",
    ""
)

# 2. En sanitize (línea 560): NO asignar 5000000 cuando revenue es null/vacío; dejar null y limpiar nombres inventados
old_sanitize = """            if (!clean.name) clean.name = 'Empresa sin nombre';
            if (!clean.zone) clean.zone = clean.provincia || 'Otras';
            if (typeof clean.revenue !== 'number' || isNaN(clean.revenue)) clean.revenue = 5000000;"""

new_sanitize = """            if (!clean.name) clean.name = 'Empresa sin nombre';
            if (!clean.zone) clean.zone = clean.provincia || 'Otras';
            if (typeof clean.revenue !== 'number' || isNaN(clean.revenue) || clean.revenue <= 0) clean.revenue = null;"""

assert old_sanitize in content, "old_sanitize not found"
content = content.replace(old_sanitize, new_sanitize, 1)

# 3. En la fusión con localStorage (modsMap), asegurar que revenue, cif y purchasingManager provengan de la base depurada (raw)
old_merge = """                // Garantizar que la geolocalización y demarcación oficial de la base no sea corrompida por modificaciones obsoletas
                location: raw ? raw.location : (mod.location || p.location),
                zone: raw ? raw.zone : (mod.zone || p.zone),
                department: raw ? raw.department : (mod.department || p.department),"""

new_merge = """                // Garantizar que la geolocalización, facturación contrastada y contactos limpios de la base no sean corrompidos por caché antigua
                location: raw ? raw.location : (mod.location || p.location),
                zone: raw ? raw.zone : (mod.zone || p.zone),
                department: raw ? raw.department : (mod.department || p.department),
                revenue: raw ? raw.revenue : null,
                cif: raw ? raw.cif : '',
                purchasingManager: raw ? raw.purchasingManager : '',
                contact: raw ? raw.contact : '',"""

assert old_merge in content, "old_merge not found"
content = content.replace(old_merge, new_merge, 1)

# 4. Quitar estado filterTier y su lógica en filteredProspects
content = content.replace("  const [filterTier, setFilterTier] = useState('');\n", "")

old_filter_logic = """      const matchSector = filterSector === '' || p.sector === filterSector;
      const matchStatus = filterStatus === '' || (filterStatus === 'contacted' ? p.contacted : !p.contacted);
      const b2b = getB2BExtrusionProfile(p);
      const matchTier = filterTier === '' || b2b.b2bTier === filterTier;
      
      let matchRevenue = true;
      if (filterRevenue === 'gt10') matchRevenue = p.revenue > 10000000;
      else if (filterRevenue === '5to10') matchRevenue = p.revenue >= 5000000 && p.revenue <= 10000000;
      else if (filterRevenue === 'lt5') matchRevenue = p.revenue < 5000000;
      let matchNewOnly = true;
      if (filterNewOnly) {
        if (!p.createdAt) {
          matchNewOnly = false;
        } else {
          const createdTime = new Date(p.createdAt).getTime();
          const diffTime = Math.abs(new Date().getTime() - createdTime);
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          matchNewOnly = diffDays <= 21; // 3 semanas son 21 días
        }
      }
      return matchName && matchZone && matchProduct && matchSector && matchStatus && matchTier && matchRevenue && matchNewOnly;
    });

    // Retornamos una copia ordenada según el criterio seleccionado en el filtro (por defecto alfabético A-Z)
    return [...result].sort((a, b) => {
      if (sortOrder === 'alphabetical') {
        return a.name.localeCompare(b.name, 'es', { sensitivity: 'base' });
      } else if (sortOrder === 'alphabetical-desc') {
        return b.name.localeCompare(a.name, 'es', { sensitivity: 'base' });
      } else if (sortOrder === 'revenue-desc') {
        return b.revenue - a.revenue;
      } else if (sortOrder === 'revenue-asc') {
        return a.revenue - b.revenue;
      } else if (sortOrder === 'tons-desc') {
        return getB2BExtrusionProfile(b).estimatedTonsPerYear - getB2BExtrusionProfile(a).estimatedTonsPerYear;
      }
      return 0;
    });
  }, [userProspects, filterName, filterZone, filterProduct, filterSector, filterStatus, filterTier, filterRevenue, filterNewOnly, sortOrder]);"""

new_filter_logic = """      const matchSector = filterSector === '' || p.sector === filterSector;
      const matchStatus = filterStatus === '' || (filterStatus === 'contacted' ? p.contacted : !p.contacted);
      
      let matchRevenue = true;
      if (filterRevenue === 'gt10') matchRevenue = Boolean(p.revenue && p.revenue > 10000000);
      else if (filterRevenue === '5to10') matchRevenue = Boolean(p.revenue && p.revenue >= 5000000 && p.revenue <= 10000000);
      else if (filterRevenue === 'lt5') matchRevenue = Boolean(p.revenue && p.revenue > 0 && p.revenue < 5000000);
      let matchNewOnly = true;
      if (filterNewOnly) {
        if (!p.createdAt) {
          matchNewOnly = false;
        } else {
          const createdTime = new Date(p.createdAt).getTime();
          const diffTime = Math.abs(new Date().getTime() - createdTime);
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          matchNewOnly = diffDays <= 21; // 3 semanas son 21 días
        }
      }
      return matchName && matchZone && matchProduct && matchSector && matchStatus && matchRevenue && matchNewOnly;
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
  }, [userProspects, filterName, filterZone, filterProduct, filterSector, filterStatus, filterRevenue, filterNewOnly, sortOrder]);"""

assert old_filter_logic in content, "old_filter_logic not found"
content = content.replace(old_filter_logic, new_filter_logic, 1)

# 5. Quitar selector 'Tier B2B (Consumo)' y opción 'tons-desc' de la barra de filtros
old_tier_select = """                <div className="filter-group">
                  <label>Tier B2B (Consumo)</label>
                  <select value={filterTier} onChange={e => setFilterTier(e.target.value)}>
                    <option value="">Todos (Tier A/B/C)</option>
                    <option value="Tier A">🔥 Tier A (&gt;100 Tn/año)</option>
                    <option value="Tier B">⭐ Tier B (35-100 Tn/año)</option>
                    <option value="Tier C">🔹 Tier C (&lt;35 Tn/año)</option>
                  </select>
                </div>
                <div className="filter-group">
                  <label>Facturación</label>
                  <select value={filterRevenue} onChange={e => setFilterRevenue(e.target.value)}>
                    <option value="">Todas</option>
                    <option value="gt10">&gt; 10M €</option>
                    <option value="5to10">5M € - 10M €</option>
                    <option value="lt5">&lt; 5M €</option>
                  </select>
                </div>
                <div className="filter-group">
                  <label>Ordenar por</label>
                  <select value={sortOrder} onChange={e => setSortOrder(e.target.value)}>
                    <option value="alphabetical">Nombre (A-Z)</option>
                    <option value="alphabetical-desc">Nombre (Z-A)</option>
                    <option value="tons-desc">⚖️ Potencial Tn/año (Desc.)</option>
                    <option value="revenue-desc">Facturación (Desc.)</option>
                    <option value="revenue-asc">Facturación (Asc.)</option>
                  </select>
                </div>"""

new_tier_select = """                <div className="filter-group">
                  <label>Facturación</label>
                  <select value={filterRevenue} onChange={e => setFilterRevenue(e.target.value)}>
                    <option value="">Todas</option>
                    <option value="gt10">&gt; 10M €</option>
                    <option value="5to10">5M € - 10M €</option>
                    <option value="lt5">&lt; 5M €</option>
                  </select>
                </div>
                <div className="filter-group">
                  <label>Ordenar por</label>
                  <select value={sortOrder} onChange={e => setSortOrder(e.target.value)}>
                    <option value="alphabetical">Nombre (A-Z)</option>
                    <option value="alphabetical-desc">Nombre (Z-A)</option>
                    <option value="revenue-desc">Facturación (Desc.)</option>
                    <option value="revenue-asc">Facturación (Asc.)</option>
                  </select>
                </div>"""

assert old_tier_select in content, "old_tier_select not found"
content = content.replace(old_tier_select, new_tier_select, 1)

# 6. Quitar el Panel de Inteligencia Comercial B2B (Tonelaje y Scoring ABC) encima de la tabla
old_kpi_strip = """              {/* Panel de Inteligencia Comercial B2B (Tonelaje y Scoring ABC de Cuentas Filtradas) */}
              {(() => {
                const totalTons = filteredProspects.reduce((acc, item) => acc + getB2BExtrusionProfile(item).estimatedTonsPerYear, 0);
                const tierACount = filteredProspects.filter(item => getB2BExtrusionProfile(item).b2bTier === 'Tier A').length;
                const customDieCount = filteredProspects.filter(item => getB2BExtrusionProfile(item).profileType.includes('Matriz Propia')).length;
                const ptCount = filteredProspects.filter(item => item.zone === 'Portugal').length;
                return (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', marginBottom: '15px' }}>
                    <div style={{ background: 'linear-gradient(135deg, #072b66 0%, #1e3a8a 100%)', color: 'white', padding: '12px 16px', borderRadius: '10px', boxShadow: '0 2px 6px rgba(7,43,102,0.18)' }}>
                      <div style={{ fontSize: '0.75rem', opacity: 0.85, fontWeight: 600 }}>⚖️ POTENCIAL EXTRUSIÓN FILTRADO</div>
                      <div style={{ fontSize: '1.35rem', fontWeight: 800, marginTop: '2px' }}>{new Intl.NumberFormat('es-ES').format(totalTons)} Tn/año</div>
                      <div style={{ fontSize: '0.72rem', color: '#93c5fd' }}>~{new Intl.NumberFormat('es-ES', { maximumFractionDigits: 1 }).format((totalTons * 4150) / 1000000)}M € valor estimado de barra</div>
                    </div>
                    <div onClick={() => setFilterTier(filterTier === 'Tier A' ? '' : 'Tier A')} style={{ background: '#ffffff', border: filterTier === 'Tier A' ? '2px solid #f59e0b' : '1px solid #e2e8f0', padding: '12px 16px', borderRadius: '10px', cursor: 'pointer' }} title="Haz clic para filtrar solo Cuentas Clave Tier A">
                      <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 700 }}>🔥 CUENTAS CLAVE (TIER A)</div>
                      <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#b45309', marginTop: '2px' }}>{tierACount} empresas</div>
                      <div style={{ fontSize: '0.72rem', color: '#059669', fontWeight: 600 }}>Consumo &gt; 100 Tn/año (Clic para filtrar)</div>
                    </div>
                    <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', padding: '12px 16px', borderRadius: '10px' }}>
                      <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 700 }}>🛠️ POTENCIAL MATRIZ PROPIA</div>
                      <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#0f172a', marginTop: '2px' }}>{customDieCount} fabricantes</div>
                      <div style={{ fontSize: '0.72rem', color: '#64748b' }}>Perfiles técnicos bajo plano DXF/DWG</div>
                    </div>
                    <div onClick={() => setFilterZone(filterZone === 'Portugal' ? '' : 'Portugal')} style={{ background: '#ffffff', border: filterZone === 'Portugal' ? '2px solid #059669' : '1px solid #e2e8f0', padding: '12px 16px', borderRadius: '10px', cursor: 'pointer' }} title="Haz clic para filtrar el mercado portugués">
                      <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 700 }}>🇵🇹 MERCADO PORTUGAL</div>
                      <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#047857', marginTop: '2px' }}>{ptCount} industrias</div>
                      <div style={{ fontSize: '0.72rem', color: '#64748b' }}>Sin prensa propia (Clic para filtrar)</div>
                    </div>
                  </div>
                );
              })()}
              <div className="card table-container">"""

assert old_kpi_strip in content, "old_kpi_strip not found"
content = content.replace(old_kpi_strip, '              <div className="card table-container">', 1)

# 7. En la tabla de prospectos: quitar Tier A/B/C y Tn/año, y mostrar Facturación y Contacto en blanco si no están comprobados
old_table_cells = """                        <td>
                          <div style={{ fontWeight: 700, color: '#0f172a' }}>
                            {new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(p.revenue)}
                          </div>
                          {(() => {
                            const b2b = getB2BExtrusionProfile(p);
                            const badgeBg = b2b.b2bTier === 'Tier A' ? '#fef3c7' : b2b.b2bTier === 'Tier B' ? '#e0f2fe' : '#f1f5f9';
                            const badgeCol = b2b.b2bTier === 'Tier A' ? '#b45309' : b2b.b2bTier === 'Tier B' ? '#0369a1' : '#475569';
                            return (
                              <div style={{ display: 'flex', gap: '5px', alignItems: 'center', flexWrap: 'wrap', marginTop: '4px' }}>
                                <span style={{ fontSize: '0.7rem', fontWeight: 700, background: badgeBg, color: badgeCol, padding: '1px 6px', borderRadius: '4px' }}>
                                  {b2b.b2bTier === 'Tier A' ? '🔥 Tier A' : b2b.b2bTier === 'Tier B' ? '⭐ Tier B' : '🔹 Tier C'}
                                </span>
                                <span style={{ fontSize: '0.72rem', fontWeight: 600, color: '#059669' }} title={`Aleación: ${b2b.alloy} | ${b2b.profileType}`}>
                                  ⚖️ ~{b2b.estimatedTonsPerYear} Tn/año
                                </span>
                              </div>
                            );
                          })()}
                        </td>
                        <td>
                          {/* Nombre del responsable de compras */}
                          <span style={{fontWeight: 500}}>{p.purchasingManager}</span><br/>"""

new_table_cells = """                        <td>
                          {p.revenue ? (
                            <div style={{ fontWeight: 700, color: '#0f172a' }}>
                              {new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(p.revenue)}
                            </div>
                          ) : null}
                        </td>
                        <td>
                          {/* Nombre del responsable de compras (solo si está comprobado) */}
                          {p.purchasingManager ? (<><span style={{fontWeight: 500}}>{p.purchasingManager}</span><br/></>) : null}"""

assert old_table_cells in content, "old_table_cells not found"
content = content.replace(old_table_cells, new_table_cells, 1)

# 8. En el Planificador de Rutas: quitar el recomendador con Tier/Tn y el Potencial Ruta Tn/año
old_route_block = """                {/* Recomendador Inteligente de Clúster Cercano (< 40 km) cuando hay al menos 1 parada */}
                {routeClients.length >= 1 && (() => {
                  const anchor = routeClients[routeClients.length - 1];
                  const nearby = findNearbyClusterProspects(anchor, userProspects, routeClients.map(c => c.id), 40, 4);
                  if (nearby.length === 0) return null;
                  return (
                    <div style={{ marginTop: '14px', padding: '12px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px' }}>
                      <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#166534', marginBottom: '6px' }}>
                        📍 Clúster Industrial a &lt;40 km de {anchor.name.split('(')[0].trim()}:
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        {nearby.map(item => (
                          <div key={item.prospect.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'white', padding: '6px 10px', borderRadius: '6px', border: '1px solid #dcfce7', fontSize: '0.78rem' }}>
                            <div>
                              <strong>{item.prospect.name}</strong>{' '}
                              <span style={{ color: '#059669', fontWeight: 700 }}>({item.tier} · ~{item.tons} Tn/año)</span>{' '}
                              <span style={{ color: '#64748b' }}>a {item.distanceKm.toFixed(1)} km</span>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleToggleRouteClient(item.prospect)}
                              style={{ background: '#16a34a', color: 'white', border: 'none', borderRadius: '5px', padding: '3px 8px', cursor: 'pointer', fontWeight: 700, fontSize: '0.74rem' }}
                            >
                              + Añadir a ruta
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })()}

                {routeClients.length > 1 && (
                  <div style={{marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '12px'}}>
                    {/* Distancia estimada + ROI Comercial del Viaje (Tn/año y Facturación acumulada) */}
                    <div style={{padding: '15px', background: '#f1f5f9', borderRadius: '8px'}}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
                        <div>
                          <strong>Distancia Total Estimada: </strong>
                          <span style={{color: 'var(--sopena-blue)', fontSize: '1.2rem', fontWeight: 600}}>
                            {totalDistance.toFixed(1)} km
                          </span>
                        </div>
                        <div style={{ background: '#fef3c7', color: '#92400e', padding: '3px 10px', borderRadius: '6px', fontSize: '0.82rem', fontWeight: 700 }}>
                          ⚖️ Potencial Ruta: {routeClients.reduce((acc, c) => acc + getB2BExtrusionProfile(c).estimatedTonsPerYear, 0)} Tn/año aluminio
                        </div>
                      </div>
                      <div style={{marginTop: '8px', fontSize: '0.78rem', color: '#64748b'}}>
                        📍 Orden de visita: {routeClients.map(c => c.name).join(' → ')}
                      </div>
                    </div>"""

new_route_block = """                {routeClients.length > 1 && (
                  <div style={{marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '12px'}}>
                    {/* Distancia estimada */}
                    <div style={{padding: '15px', background: '#f1f5f9', borderRadius: '8px'}}>
                      <strong>Distancia Total Estimada: </strong>
                      <span style={{color: 'var(--sopena-blue)', fontSize: '1.2rem', fontWeight: 600}}>
                        {totalDistance.toFixed(1)} km
                      </span>
                      <div style={{marginTop: '8px', fontSize: '0.78rem', color: '#64748b'}}>
                        📍 Orden de visita: {routeClients.map(c => c.name).join(' → ')}
                      </div>
                    </div>"""

assert old_route_block in content, "old_route_block not found"
content = content.replace(old_route_block, new_route_block, 1)

# 9. En el Kanban: quitar Tn/año, Tier A/B/C y mostrar facturación solo si existe
k_start = content.find('<span style={{display: \'flex\', alignItems: \'center\', gap: \'6px\'}}>\n                          <span style={{background: \'#ecfdf5\'')
k_end_marker = '<button onClick={() => setSelectedProspect(p)} style={{padding: \'5px 8px\', borderRadius: \'4px\', border: \'1px solid #c7d2fe\', background: \'#eef2ff\', color: \'#3730a3\', fontSize: \'0.75rem\', fontWeight: 700, cursor: \'pointer\'}} title="Abrir Ficha y Kit Prospección B2B">🎯 Kit</button>\n                          </div>\n                        </div>\n                        );\n                      })}'
k_end = content.find(k_end_marker, k_start)
assert k_start != -1 and k_end != -1, "old_kanban not found"

new_kanban = """<span style={{background: 'var(--sopena-blue)', color: 'white', borderRadius: '50%', padding: '2px 8px', fontSize: '0.8rem'}}>{pipelineProspects.filter(p => (p.pipelineStage || 'Lead') === stage).length}</span>
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
                      ))}"""

content = content[:k_start] + new_kanban + content[k_end + len(k_end_marker):]

# 10. En el Modal: quitar la pestaña b2b_kit, quitar los campos estimados de extrusión y permitir que purchasingManager y email queden en blanco
old_modal_header = """              <button type="button" className={`modal-tab ${activeModalTab === 'tareas' ? 'active' : ''}`} onClick={() => setActiveModalTab('tareas')}>
                📋 Actividad & Tareas
              </button>
              <button type="button" className={`modal-tab ${activeModalTab === 'b2b_kit' ? 'active' : ''}`} onClick={() => setActiveModalTab('b2b_kit')} style={{ color: activeModalTab === 'b2b_kit' ? 'var(--sopena-blue)' : '#059669', fontWeight: 700 }}>
                🎯 Kit Prospección B2B (ES/PT)
              </button>
            </div>
            <form onSubmit={e => {
              e.preventDefault();
              const formData = new FormData(e.target);
              handleSaveCrm(selectedProspect.id, {
                contacted: formData.get('contacted') === 'true',
                contactDate: formData.get('contactDate'),
                notes: formData.get('notes'),
                response: formData.get('response'),
                quality: formData.get('quality'),
                logistics: formData.get('logistics'),
                packaging: formData.get('packaging'),
                profileType: formData.get('profileType') || selectedProspect.profileType,
                alloy: formData.get('alloy') || selectedProspect.alloy,
                finish: formData.get('finish') || selectedProspect.finish,
                estimatedTonsPerYear: Number(formData.get('estimatedTonsPerYear')) || selectedProspect.estimatedTonsPerYear,
                incumbentSupplier: formData.get('incumbentSupplier') || selectedProspect.incumbentSupplier,
                purchasingManager: formData.get('purchasingManager') || selectedProspect.purchasingManager,
                purchasingPhone: formData.get('purchasingPhone') || selectedProspect.purchasingPhone,
                purchasingLinkedin: formData.get('purchasingLinkedin') || selectedProspect.purchasingLinkedin,
                email: formData.get('email') || selectedProspect.email,
                sector: formData.get('sector') || selectedProspect.sector,
                causaNoAceptacion: formData.get('causaNoAceptacion'),
                lastContactDates: formData.getAll('lastContactDates'),
                offerDates: formData.getAll('offerDates')
              });
            }}"""

new_modal_header = """              <button type="button" className={`modal-tab ${activeModalTab === 'tareas' ? 'active' : ''}`} onClick={() => setActiveModalTab('tareas')}>
                📋 Actividad & Tareas
              </button>
            </div>
            <form onSubmit={e => {
              e.preventDefault();
              const formData = new FormData(e.target);
              handleSaveCrm(selectedProspect.id, {
                contacted: formData.get('contacted') === 'true',
                contactDate: formData.get('contactDate'),
                notes: formData.get('notes'),
                response: formData.get('response'),
                quality: formData.get('quality'),
                logistics: formData.get('logistics'),
                packaging: formData.get('packaging'),
                purchasingManager: formData.get('purchasingManager') ?? selectedProspect.purchasingManager,
                purchasingPhone: formData.get('purchasingPhone') ?? selectedProspect.purchasingPhone,
                purchasingLinkedin: formData.get('purchasingLinkedin') ?? selectedProspect.purchasingLinkedin,
                email: formData.get('email') ?? selectedProspect.email,
                sector: formData.get('sector') || selectedProspect.sector,
                causaNoAceptacion: formData.get('causaNoAceptacion'),
                lastContactDates: formData.getAll('lastContactDates'),
                offerDates: formData.getAll('offerDates')
              });
            }}"""

assert old_modal_header in content, "old_modal_header not found"
content = content.replace(old_modal_header, new_modal_header, 1)

# Permitir guardar en el modal aunque purchasingManager o email estén en blanco
content = content.replace(
    '<input type="text" name="purchasingManager" defaultValue={selectedProspect.purchasingManager || \'\'} required />',
    '<input type="text" name="purchasingManager" defaultValue={selectedProspect.purchasingManager || \'\'} />'
)
content = content.replace(
    'name="email" \n                        defaultValue={selectedProspect.email || \'\'} \n                        required',
    'name="email" \n                        defaultValue={selectedProspect.email || \'\'}'
)

# Quitar Especificaciones B2B de Extrusión del TAB 3
old_tab3 = """                {/* TAB 3: FICHA TECNICA & OFERTAS */}
                {activeModalTab === 'tecnico' && (
                  <div>
                    <h3 style={{ marginTop: 0, fontSize: '1.1rem', color: 'var(--sopena-blue)' }}>Especificaciones B2B de Extrusión de Aluminio</h3>
                    {(() => {
                      const b2b = getB2BExtrusionProfile(selectedProspect);
                      return (
                        <div className="modal-grid-3" style={{ marginBottom: '18px', background: '#f8fafc', padding: '14px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                          <div className="form-group">
                            <label>Tipología de Perfil</label>
                            <select name="profileType" defaultValue={b2b.profileType}>
                              <option value="Matriz Propia (Bajo Plano)">Matriz Propia (Bajo Plano DXF/DWG)</option>
                              <option value="Carpintería / Arquitectura">Carpintería / Arquitectura</option>
                              <option value="Perfil Estándar / Estructural">Perfil Estándar / Estructural</option>
                            </select>
                          </div>
                          <div className="form-group">
                            <label>Aleación Principal</label>
                            <select name="alloy" defaultValue={b2b.alloy}>
                              <option value="6063-T5 / 6060">6063-T5 / 6060 (Arquitectura y Disipación)</option>
                              <option value="6005A-T6 / 6082-T6">6005A-T6 / 6082-T6 (Estructural / Solar / Naval)</option>
                              <option value="6061-T6 / Especial">6061-T6 / Aleación Técnica Especial</option>
                            </select>
                          </div>
                          <div className="form-group">
                            <label>Acabado Requerido</label>
                            <select name="finish" defaultValue={b2b.finish}>
                              <option value="Lacado Qualicoat / RPT">Lacado Qualicoat / RPT</option>
                              <option value="Anodizado Técnico / Mecanizado CNC">Anodizado Técnico / Mecanizado CNC</option>
                              <option value="Bruto (Mill Finish) / Corte Precisión">Bruto (Mill Finish) / Corte Precisión</option>
                            </select>
                          </div>
                          <div className="form-group">
                            <label>Consumo Estimado (Tn/año)</label>
                            <input type="number" name="estimatedTonsPerYear" defaultValue={b2b.estimatedTonsPerYear} min="1" max="5000" />
                          </div>
                          <div className="form-group" style={{ gridColumn: 'span 2' }}>
                            <label>Extrusor Actual (Estrategia Dual Sourcing / 2º Proveedor)</label>
                            <input type="text" name="incumbentSupplier" defaultValue={b2b.incumbentSupplier} placeholder="Ej: Cortizo, Exlabesa, Navarra, Extrusal..." />
                          </div>
                        </div>
                      );
                    })()}
                    <h3 style={{ marginTop: 0, fontSize: '1.1rem', color: 'var(--sopena-blue)' }}>Requisitos de Calidad y Logística</h3>"""

new_tab3 = """                {/* TAB 3: FICHA TECNICA & OFERTAS */}
                {activeModalTab === 'tecnico' && (
                  <div>
                    <h3 style={{ marginTop: 0, fontSize: '1.1rem', color: 'var(--sopena-blue)' }}>Requisitos Técnicos</h3>"""

assert old_tab3 in content, "old_tab3 not found"
content = content.replace(old_tab3, new_tab3, 1)

# Quitar TAB 5 (b2b_kit)
old_tab5_start = "                {/* TAB 5: KIT DE PROSPECCIÓN B2B MULTICANAL (ESPAÑOL / PORTUGUÉS + LINKEDIN) */}"
old_tab5_end = "              </div>\n              {/* ACCIONES DEL MODAL */}"
idx_start = content.find(old_tab5_start)
idx_end = content.find(old_tab5_end, idx_start)
assert idx_start != -1 and idx_end != -1, "old_tab5 not found"
content = content[:idx_start] + content[idx_end:]

with open("src/App.jsx", "w", encoding="utf-8") as f:
    f.write(content)

print("src/App.jsx limpiado de Tier B2B y preparado para mostrar campos en blanco cuando no estén comprobados.")
