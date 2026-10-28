"""
Actualiza src/App.jsx implementando las 5 mejoras B2B aprobadas para el CRM de Extrusión de Aluminio:
1. KPIs Ejecutivos B2B (Tonelaje Anual Estimado Tn/año, Cuentas Tier A y Valor de Compra) + Filtro Tier ABC y Orden por Tonelaje.
2. Insignias en Tabla de Prospectos (Tier A/B/C, ~Tn/año, Matriz Propia / Aleación).
3. Ficha Técnica de Extrusión B2B en el Modal (Tipología de Perfil, Aleación, Acabado, Tonelaje y Proveedor Actual).
4. Nueva pestaña en el Modal: '🎯 Kit B2B (ES/PT)' con generador bilingüe (Español/Portugués) de Email Técnico a Compras, Nota de Conexión LinkedIn + Búsqueda en 1 clic, y Guion de Llamada + Objeciones.
5. Mejora del Pipeline Kanban (Tonelaje por etapa y acceso directo a ficha) y del Planificador de Rutas (Potencial total del viaje en Tn/año + Recomendador de Clúster Cercano < 40 km en 1 clic).
"""

with open("src/App.jsx", "r", encoding="utf-8") as f:
    content = f.read().replace("\r\n", "\n")

# 1. Añadir estado filterTier y soporte en filteredProspects + ordenamiento por Tonelaje (tons-desc)
target_1 = """  const [filterRevenue, setFilterRevenue] = useState('');
  const [filterNewOnly, setFilterNewOnly] = useState(false);"""

replacement_1 = """  const [filterRevenue, setFilterRevenue] = useState('');
  const [filterTier, setFilterTier] = useState('');
  const [filterNewOnly, setFilterNewOnly] = useState(false);"""

assert target_1 in content, "No se encontró target_1"
content = content.replace(target_1, replacement_1, 1)

target_2 = """      const matchSector = filterSector === '' || p.sector === filterSector;
      const matchStatus = filterStatus === '' || (filterStatus === 'contacted' ? p.contacted : !p.contacted);
      
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
      return matchName && matchZone && matchProduct && matchSector && matchStatus && matchRevenue && matchNewOnly;
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
      }
      return 0;
    });
  }, [userProspects, filterName, filterZone, filterProduct, filterSector, filterStatus, filterRevenue, filterNewOnly, sortOrder]);"""

replacement_2 = """      const matchSector = filterSector === '' || p.sector === filterSector;
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

assert target_2 in content, "No se encontró target_2"
content = content.replace(target_2, replacement_2, 1)

# 2. Añadir Banda de KPIs B2B de Extrusión y Filtro Tier ABC en la pestaña de Prospectos
target_3 = """                <div className="filter-group">
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

replacement_3 = """                <div className="filter-group">
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

assert target_3 in content, "No se encontró target_3"
content = content.replace(target_3, replacement_3, 1)

# Insertar Resumen Ejecutivo B2B encima de la tabla de prospectos
target_3b = """              <div className="card table-container">"""
replacement_3b = """              {/* Panel de Inteligencia Comercial B2B (Tonelaje y Scoring ABC de Cuentas Filtradas) */}
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

assert target_3b in content, "No se encontró target_3b"
content = content.replace(target_3b, replacement_3b, 1)

# 3. Enriquecer la celda de Facturación en la tabla de Prospectos con Tier ABC, Tn/año y Aleación
target_4 = """                        <td>{new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(p.revenue)}</td>"""
replacement_4 = """                        <td>
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
                        </td>"""

assert target_4 in content, "No se encontró target_4"
content = content.replace(target_4, replacement_4, 1)

# 4. Mejorar el Planificador de Rutas con el Potencial Total de la Ruta (Tn/año) y Recomendador de Clúster Cercano (<40 km)
target_5 = """                {routeClients.length > 1 && (
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

replacement_5 = """                {/* Recomendador Inteligente de Clúster Cercano (< 40 km) cuando hay al menos 1 parada */}
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

assert target_5 in content, "No se encontró target_5"
content = content.replace(target_5, replacement_5, 1)

# 5. Enriquecer el Modal del Prospecto: añadir la pestaña '🎯 Kit B2B (ES/PT)' y los campos técnicos de extrusión en '⚙️ Ficha & Ofertas'
target_6 = """              <button type="button" className={`modal-tab ${activeModalTab === 'tareas' ? 'active' : ''}`} onClick={() => setActiveModalTab('tareas')}>
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
                purchasingManager: formData.get('purchasingManager'),
                purchasingPhone: formData.get('purchasingPhone'),
                purchasingLinkedin: formData.get('purchasingLinkedin'),
                email: formData.get('email'),
                sector: formData.get('sector'),
                causaNoAceptacion: formData.get('causaNoAceptacion'),
                lastContactDates: formData.getAll('lastContactDates'),
                offerDates: formData.getAll('offerDates')
              });
            }}"""

replacement_6 = """              <button type="button" className={`modal-tab ${activeModalTab === 'tareas' ? 'active' : ''}`} onClick={() => setActiveModalTab('tareas')}>
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

assert target_6 in content, "No se encontró target_6"
content = content.replace(target_6, replacement_6, 1)

# 6. Enriquecer TAB 3 (tecnico) con las especificaciones técnicas de extrusión B2B y añadir TAB 5 (b2b_kit)
target_7 = """                {/* TAB 3: FICHA TECNICA & OFERTAS */}
                {activeModalTab === 'tecnico' && (
                  <div>
                    <h3 style={{ marginTop: 0, fontSize: '1.1rem', color: 'var(--sopena-blue)' }}>Requisitos Técnicos</h3>"""

replacement_7 = """                {/* TAB 3: FICHA TECNICA & OFERTAS */}
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

assert target_7 in content, "No se encontró target_7"
content = content.replace(target_7, replacement_7, 1)

target_8 = """                  </div>
                )}
                
              </div>
              {/* ACCIONES DEL MODAL */}"""

replacement_8 = """                  </div>
                )}

                {/* TAB 5: KIT DE PROSPECCIÓN B2B MULTICANAL (ESPAÑOL / PORTUGUÉS + LINKEDIN) */}
                {activeModalTab === 'b2b_kit' && (() => {
                  const kit = generateB2BOutreachKit(selectedProspect);
                  const b2b = getB2BExtrusionProfile(selectedProspect);
                  return (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#eff6ff', padding: '12px 16px', borderRadius: '8px', border: '1px solid #bfdbfe', flexWrap: 'wrap', gap: '10px' }}>
                        <div>
                          <strong style={{ color: '#1e3a8a', fontSize: '0.95rem' }}>
                            Idioma Automático Detectado: {kit.lang} | {b2b.b2bTier} (~{b2b.estimatedTonsPerYear} Tn/año · {b2b.alloy})
                          </strong>
                          <div style={{ fontSize: '0.8rem', color: '#475569', marginTop: '2px' }}>
                            Decisor objetivo: <strong>{selectedProspect.purchasingManager}</strong> ({selectedProspect.email})
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                          <a
                            href={kit.linkedinSearchUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="action-btn"
                            style={{ background: '#0a66c2', color: 'white', textDecoration: 'none', fontSize: '0.82rem', padding: '8px 12px' }}
                          >
                            🔗 Localizar Decisor en LinkedIn
                          </a>
                          <a
                            href={`mailto:${selectedProspect.email}?subject=${encodeURIComponent(kit.emailSubject)}&body=${encodeURIComponent(kit.emailBody)}`}
                            className="action-btn"
                            style={{ background: '#059669', color: 'white', textDecoration: 'none', fontSize: '0.82rem', padding: '8px 12px' }}
                          >
                            ✉️ Abrir Email en Cliente de Correo
                          </a>
                        </div>
                      </div>

                      {/* 1. Mensaje de conexión en LinkedIn */}
                      <div style={{ background: '#f8fafc', padding: '14px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                          <strong style={{ fontSize: '0.88rem', color: '#0f172a' }}>1. Nota de Invitación en LinkedIn (máx. 300 caracteres)</strong>
                          <button
                            type="button"
                            onClick={() => navigator.clipboard.writeText(kit.linkedinMessage)}
                            className="action-btn outline"
                            style={{ padding: '4px 10px', fontSize: '0.76rem' }}
                          >
                            📋 Copiar Nota LinkedIn
                          </button>
                        </div>
                        <div style={{ fontSize: '0.84rem', color: '#334155', background: 'white', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1' }}>
                          {kit.linkedinMessage}
                        </div>
                      </div>

                      {/* 2. Email técnico B2B al Responsable de Compras */}
                      <div style={{ background: '#f8fafc', padding: '14px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                          <strong style={{ fontSize: '0.88rem', color: '#0f172a' }}>2. Correo Técnico B2B (Estrategia Dual Sourcing / Matriz Propia)</strong>
                          <button
                            type="button"
                            onClick={() => navigator.clipboard.writeText(`Asunto: ${kit.emailSubject}\n\n${kit.emailBody}`)}
                            className="action-btn outline"
                            style={{ padding: '4px 10px', fontSize: '0.76rem' }}
                          >
                            📋 Copiar Asunto + Cuerpo
                          </button>
                        </div>
                        <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#1e293b', marginBottom: '6px' }}>
                          Asunto: {kit.emailSubject}
                        </div>
                        <pre style={{ margin: 0, whiteSpace: 'pre-wrap', fontFamily: 'inherit', fontSize: '0.83rem', color: '#334155', background: 'white', padding: '12px', borderRadius: '6px', border: '1px solid #cbd5e1', lineHeight: 1.5 }}>
                          {kit.emailBody}
                        </pre>
                      </div>

                      {/* 3. Guion de Llamada y Manejo de Objeciones de Extrusión */}
                      <div style={{ background: '#fffbeb', padding: '14px', borderRadius: '8px', border: '1px solid #fde68a' }}>
                        <strong style={{ fontSize: '0.88rem', color: '#92400e', display: 'block', marginBottom: '6px' }}>
                          3. Guion Telefónico y Rebate de Objeciones ante Compras
                        </strong>
                        <pre style={{ margin: 0, whiteSpace: 'pre-wrap', fontFamily: 'inherit', fontSize: '0.82rem', color: '#78350f', lineHeight: 1.5 }}>
                          {kit.coldCallScript}
                        </pre>
                      </div>
                    </div>
                  );
                })()}
                
              </div>
              {/* ACCIONES DEL MODAL */}"""

assert target_8 in content, "No se encontró target_8"
content = content.replace(target_8, replacement_8, 1)

with open("src/App.jsx", "w", encoding="utf-8") as f:
    f.write(content)

print("src/App.jsx actualizado con las 5 mejoras B2B exitosamente.")

